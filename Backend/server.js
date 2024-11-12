  const express = require("express");
  const mongoose = require("mongoose");
  const cors = require("cors");
  const dotenv = require("dotenv");
  const bcrypt = require("bcrypt");
  const helmet = require("helmet");
  const rateLimit = require("express-rate-limit");
  const { body, validationResult } = require("express-validator");
  const jwt = require("jsonwebtoken");
  const moment = require("moment-timezone"); 
  const winston = require('winston');
  const fs = require("fs");



  dotenv.config();
  const app = express();

  // Middleware for parsing JSON requests
  app.use(express.json());
  const corsOptions = {
    origin: "http://localhost:3000", // Frontendens URL
    methods: "GET,POST",
    allowedHeaders: "Content-Type,Authorization",
  };
  app.use(cors(corsOptions));
    app.use(helmet());  // Använd den grundläggande helmet-konfigurationen

  // Lägg till XSS-filter
  app.use(helmet.xssFilter()); // Skyddar mot XSS-attacker
  
  // Lägg till Content Security Policy (CSP)
  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"], // Tillåt endast källor från samma ursprung
        scriptSrc: ["'self'", "'unsafe-inline'"], // Tillåt skript från samma ursprung och inline-skript (kan justeras beroende på behov)
        objectSrc: ["'none'"], // Blockera användning av <object>, <embed> eller <applet>
        styleSrc: ["'self'", "'unsafe-inline'"], // Tillåt stilar från samma ursprung och inline-stilar
        imgSrc: ["'self'", "data:"], // Tillåt bilder från samma ursprung samt data-URL
        connectSrc: ["'self'"], // Tillåt nätverksanrop från samma ursprung
        fontSrc: ["'self'"], // Tillåt typsnitt från samma ursprung
        frameSrc: ["'none'"], // Blockera användning av <frame>, <iframe>, <object>, <embed> eller <applet>
        childSrc: ["'none'"], // Blockera öppning av nya fönster eller inbäddade objekt
        formAction: ["'self'"], // Begränsa formulärsändning till samma ursprung
        frameAncestors: ["'none'"], // Blockera förfäder för <frame> och <iframe>
      },
    })
  );
  
  app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true, preload: true }));  // Aktivera HTTP Strict Transport Security (HSTS)
  app.use(helmet.referrerPolicy({ policy: "no-referrer" }));  // Förhindra referrer-information från att skickas

  // JWT Authentication middleware
  const authenticateJWT = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.sendStatus(401);
    try {
      const decoded = await jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; 
      next();
    } catch (err) {
      res.sendStatus(403);
    }
  };
  

  // MongoDB connection
  mongoose.connect(process.env.VITE_MONGODB_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(console.error);


  // Models
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], required: true },
  reservations: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    quantity: { type: Number, required: true, min: 1 }
  }]
});
const UserModel = mongoose.model("User", userSchema);

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  price: { type: Number, required: true, min: 0 }
});
const Product = mongoose.model("Product", productSchema);

  

  // Password strength check
  const COMMON_PASSWORDS = ["password", "12345678"];
  const isPasswordStrong = (username, password) => {
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const isNotUsername = password !== username;
    const isNotCommon = !COMMON_PASSWORDS.includes(password);
    const isNotRepeating = !/^(.)\1+$/.test(password); 

    return (
      hasMinLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumber &&
      isNotUsername &&
      isNotCommon &&
      isNotRepeating
    );
  };

  // Skapa en logger med Winston
const logger = winston.createLogger({
  level: 'info',
  transports: [
    // Skriv loggar till terminalen (Console)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(), 
        winston.format.simple() 
      )
    }),
    // Skriv loggar till fil
    new winston.transports.File({ 
      filename: 'login_attempts.log', 
      level: 'info', 
      format: winston.format.combine(
        winston.format.timestamp(), 
        winston.format.json() 
      )
    })
  ]
});


  // Routes
  app.post("/api/check-password", [
    body("username").isAlphanumeric().trim().escape(),
    body("password").isString().trim(),
  ], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, password } = req.body;
    if (!isPasswordStrong(username, password)) {
      return res.status(400).json({ message: "Password is too weak" });
    }
    res.status(200).json({ message: "Password is strong enough" });
  });

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too many login attempts, try again later.",
  });


const logLoginAttempt = async (username, success, req, reason = "") => {
  const ip = req.ip || req.connection.remoteAddress || "127.0.0.1";
  const userAgent = req.headers["user-agent"] || "Unknown";
  const localDate = moment().tz("Europe/Stockholm").format("YYYY-MM-DD HH:mm:ss");

  console.log(`[${localDate}] Inloggningsförsök: ${username} | Lyckades: ${success ? "Ja" : "Nej"} | IP: ${ip} | User-Agent: ${userAgent} | Orsak: ${reason}`);

  const logMessage = `${localDate} | ${username} | ${success ? "Lyckades" : "Misslyckades"} | IP: ${ip} | User-Agent: ${userAgent} | Orsak: ${reason}\n`;

  fs.appendFile("login_attempts.log", logMessage, (err) => {
    if (err) {
      console.error("Fel vid skrivning av logg:", err);
    }
  });
};


app.post("/api/login", loginLimiter, [
  // Validera användarnamn och lösenord
  body("username").isAlphanumeric().trim().escape().isLength({ min: 3 }),
  body("password").isLength({ min: 8 }).trim(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  try {
    // Kontrollera om användaren finns
    const user = await UserModel.findOne({ username });
    if (!user) {
      // Logga och skicka generell felmeddelande
      await logLoginAttempt(username, false, req, "Användarnamnet finns inte");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Kontrollera lösenordets giltighet
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await logLoginAttempt(username, false, req, "Fel lösenord");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Skapa JWT-token
    const token = jwt.sign(
      { username: user.username, role: user.role, id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '20m' }
    );

    // Logga lyckat inloggningsförsök
    await logLoginAttempt(username, true, req);

    // Skicka tillbaka svar
    return res.status(200).json({
      message: "Login successful",
      user: { username: user.username, role: user.role },
      token
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/register", [
  body("username")
    .isAlphanumeric()
    .trim()
    .escape()
    .withMessage("Username must only contain letters and numbers."),
  body("password")
    .isString()
    .trim()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long.")
    .custom((value) => {
      // Förstärkning av lösenordskontroll för att tillåta 20 tecken för hög säkerhet
      const isStrongEnough = value.length >= 8 && value.length < 20;
      const isExtraStrong = value.length >= 20;
      if (!isStrongEnough && !isExtraStrong) {
        throw new Error("Password must be at least 8 characters or 20+ characters for extra security.");
      }
      return true;
    })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { username, password } = req.body;

  // Kontrollera lösenordets styrka med befintlig funktion
  if (!isPasswordStrong(username, password)) {
    return res.status(400).json({ message: "Password is too weak" });
  }

  try {
    // Kontrollera om användarnamnet redan finns
    if (await UserModel.findOne({ username })) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Hashar och saltar lösenordet (saltrundor 12 för högre säkerhet)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Skapa den nya användaren
    const user = await UserModel.create({
      username,
      password: hashedPassword,
      role: "user"
    });

    // Skapa JWT-token
    const token = jwt.sign(
      { username: user.username, role: user.role, id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '20m' }
    );

    // Säkerhetsloggning för registreringsförsök (valfritt)
    console.log(`[REGISTRATION ATTEMPT] User: ${username} registered successfully at ${new Date().toISOString()}`);

    // Skicka tillbaka svar
    return res.status(201).json({
      message: "User registered successfully",
      user: { username: user.username, role: user.role },
      token
    });
  } catch (error) {
    console.error("Failed to register user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

  app.post("/api/reserve", authenticateJWT, async (req, res) => {
    
    const { productId, quantity } = req.body;
    
    // Kontrollera att kvantiteten är positiv
    if (quantity < 1) return res.status(400).json({ message: "Invalid quantity" });
  
    try {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
  
      // Hämta användaren och kontrollera deras totala reservationer
      const user = await UserModel.findById(req.user.id);
      
      // Beräkna totalt reserverade produkter
      const totalReserved = user.reservations.reduce((sum, res) => sum + res.quantity, 0);
      
      // Kontrollera att användaren inte har överskridit maxgränsen på 5 produkter totalt
      if (totalReserved + quantity > 5) {
        return res.status(400).json({ message: "Reservation limit reached. You can only reserve up to 5 products in total." });
      }
  
      // Minska lagersaldo för produkten
      if (product.quantity < quantity) {
        return res.status(400).json({ message: "Not enough stock available" });
      }
      product.quantity -= quantity;
      await product.save();
  
      // Lägg till eller uppdatera användarens reservation
      const existingReservation = user.reservations.find(res => res.productId.equals(productId));
      if (existingReservation) {
        existingReservation.quantity += quantity;
      } else {
        user.reservations.push({ productId, quantity });
      }
  
      await user.save();
  
      res.status(200).json({ message: "Product reserved successfully", product });
    } catch (error) {
      console.error("Error reserving product:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  
  app.post("/api/reserve/cancel", authenticateJWT, async (req, res) => {
    const { productId, quantity } = req.body;
  
    if (quantity < 1) return res.status(400).json({ message: "Invalid quantity" });
  
    try {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
  
      const user = await UserModel.findById(req.user.id);
      const userReservationIndex = user.reservations.findIndex(res => res.productId.equals(productId));
      if (userReservationIndex === -1) {
        return res.status(404).json({ message: "Reservation not found" });
      }
  
      const userReservation = user.reservations[userReservationIndex];
  
      // Kontrollera att användaren inte försöker ta bort mer än de har reserverat
      if (userReservation.quantity < quantity) {
        return res.status(400).json({ message: "Not enough items reserved to cancel" });
      }
  
      // Uppdatera lagersaldo
      product.quantity += quantity;
      await product.save();
  
      // Ta bort eller minska användarens reservation
      if (userReservation.quantity === quantity) {
        user.reservations.splice(userReservationIndex, 1);
      } else {
        userReservation.quantity -= quantity;
      }
  
      await user.save();
  
      res.status(200).json({ message: "Reservation cancelled successfully", product });
    } catch (error) {
      console.error("Error cancelling reservation:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/products", async (req, res) => {
    try {
      const products = await Product.find(); // Hämta alla produkter
      res.status(200).json(products); // Returnera produkterna som JSON
    } catch (error) {
      console.error("Fel vid hämtning av produkter:", error);
      res.status(500).json({ message: "Server error" });
    }
  });


  // Start the server
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

