// // server.js

// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const dotenv = require("dotenv");
// const bcrypt = require("bcrypt");
// const helmet = require("helmet");
// const rateLimit = require("express-rate-limit");
// const { body, validationResult } = require("express-validator");
// const jwt = require("jsonwebtoken");

// const authenticateJWT = (req, res, next) => {
//   const token = req.headers.authorization?.split(" ")[1];

//   if (token) {
//     jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
//       if (err) {
//         return res.sendStatus(403); // Forbidden
//       }
//       req.user = user; // Spara användarinformationen i req.user
//       next();
//     });
//   } else {
//     res.sendStatus(401); // Unauthorized
//   }
// };
// dotenv.config();

// const app = express();

// // Middleware
// app.use(helmet());
// app.use(cors({ origin: "http://localhost:3000" }));
// app.use(express.json());
// app.use(authenticateJWT);


// // MongoDB-anslutning
// mongoose
//   .connect(process.env.VITE_MONGODB_URI)
//   .then(() => console.log("MongoDB connected"))
//   .catch((err) => console.log(err));

// // Användarschema
// const userSchema = new mongoose.Schema({
//   username: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   role: { type: String, enum: ["user", "admin"], required: true },
// });

// const UserModel = mongoose.model("User", userSchema);

// // Loggmodell för inloggningsförsök
// const loginAttemptSchema = new mongoose.Schema({
//   username: { type: String, required: true },
//   success: { type: Boolean, required: true },
//   timestamp: { type: Date, default: Date.now },
//   ip: { type: String, required: true },
//   userAgent: { type: String, required: true },
// });

// const LoginAttempt = mongoose.model("LoginAttempt", loginAttemptSchema);

// // Funktion för att logga inloggningsförsök i databasen
// const logLoginAttempt = async (username, success, ip, userAgent) => {
//   const attempt = new LoginAttempt({
//     username,
//     success,
//     ip,
//     userAgent,
//   });
//   try {
//     await attempt.save();
//     console.log("Login attempt logged successfully");
//   } catch (error) {
//     console.error("Failed to log login attempt:", error);
//   }
// };

// // Funktion för att kontrollera lösenordsstyrka
// const COMMON_PASSWORDS = ["password", "12345678", /* Lägg till fler eller läs från en fil */];
// const isPasswordStrong = (username, password) => {
//   return (
//     password.length >= 8 &&
//     password !== username &&
//     !/^(.)\1+$/.test(password) && // Repeated characters
//     !COMMON_PASSWORDS.includes(password)
//   );
// };

// // Endpoint för att kontrollera lösenordets styrka
// app.post(
//   "/api/check-password",
//   [
//     body("username").isAlphanumeric().trim().escape(),
//     body("password").isString().trim(),
//   ],
//   (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }

//     const { username, password } = req.body;
//     if (!isPasswordStrong(username, password)) {
//       return res.status(400).json({ message: "Password is too weak" });
//     }

//     res.status(200).json({ message: "Password is strong enough" });
//   }
// );

// // Rate limiting för inloggningsförsök
// const loginLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 5,
//   message: "Too many login attempts from this IP, please try again later.",
// });

// // Inloggning med loggning av inloggningsförsök
// app.post(
//   "/api/login",
//   loginLimiter,
//   [
//     body("username").isAlphanumeric().withMessage("Invalid username format").trim().escape(),
//     body("password").isLength({ min: 8 }).withMessage("Invalid password format").trim(),
//   ],
//   async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }

//     const { username, password } = req.body;
//     const ip = req.ip || req.connection.remoteAddress;
//     const userAgent = req.headers["user-agent"] || "Unknown";

//     try {
//       const user = await UserModel.findOne({ username });
//       if (!user) {
//         await logLoginAttempt(username, false, ip, userAgent);
//         return res.status(401).json({ message: "Invalid credentials" });
//       }

//       const isMatch = await bcrypt.compare(password, user.password);
//       if (!isMatch) {
//         await logLoginAttempt(username, false, ip, userAgent);
//         return res.status(401).json({ message: "Invalid credentials" });
//       }

//       await logLoginAttempt(username, true, ip, userAgent);
//       res.status(200).json({
//         message: "Login successful",
//         user: { username: user.username, role: user.role },
//       });
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: "Server error" });
//     }
//   }
// );

// // Registreringsroute
// app.post(
//   "/api/register",
//   [
//     body("username")
//       .isAlphanumeric()
//       .withMessage("Username should only contain letters and numbers")
//       .trim()
//       .escape(),
//     body("password")
//       .isLength({ min: 8 })
//       .withMessage("Password must be at least 8 characters long")
//       .trim(),
//     body("role")
//       .isIn(["user", "admin"])
//       .withMessage("Invalid role")
//       .optional() // Gör rollen valfri vid registrering
//   ],
//   async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }

//     const { username, password, role = "user" } = req.body;

//     // Kontrollera om lösenordet är starkt
//     if (!isPasswordStrong(username, password)) {
//       return res.status(400).json({ message: "Password is too weak" });
//     }

//     try {
//       // Kolla om användarnamnet redan finns
//       const existingUser = await UserModel.findOne({ username });
//       if (existingUser) {
//         return res.status(400).json({ message: "Username already exists" });
//       }

//       // Hasha lösenordet innan det sparas
//       const hashedPassword = await bcrypt.hash(password, 10);

//       // Skapa och spara ny användare
//       const newUser = new UserModel({ username, password: hashedPassword, role });
//       await newUser.save();

//       res.status(201).json({ message: "User registered successfully" });
//     } catch (error) {
//       console.error("Failed to register user:", error);
//       res.status(500).json({ message: "Server error" });
//     }
//   }
// );


// // Routen för att hämta senaste 100 inloggningsförsök, endast för admin
// app.get("/api/login-attempts", async (req, res) => {
//   if (!req.user || req.user.role !== "admin") {
//     return res.status(403).json({ message: "Access denied" });
//   }

//   try {
//     const attempts = await LoginAttempt.find()
//       .sort({ timestamp: -1 })
//       .limit(100);
//     res.status(200).json(attempts);
//   } catch (error) {
//     console.error("Failed to retrieve login attempts:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });



// // Starta servern
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");

dotenv.config();
const app = express();

// Middleware
app.use(cors({ origin: "http://localhost:3000" }));
app.use(helmet());
app.use(express.json());

const authenticateJWT = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.sendStatus(401);
  try {
    req.user = await jwt.verify(token, process.env.JWT_SECRET);
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
});
const UserModel = mongoose.model("User", userSchema);

const loginAttemptSchema = new mongoose.Schema({
  username: { type: String, required: true },
  success: { type: Boolean, required: true },
  timestamp: { type: Date, default: Date.now },
  ip: { type: String, required: true },
  userAgent: { type: String, required: true },
});
const LoginAttempt = mongoose.model("LoginAttempt", loginAttemptSchema);

const logLoginAttempt = async (username, success, ip, userAgent) => {
  await LoginAttempt.create({ username, success, ip, userAgent });
};

// Password strength check
const COMMON_PASSWORDS = ["password", "12345678"];
const isPasswordStrong = (username, password) => 
  password.length >= 8 && password !== username && 
  !/^(.)\1+$/.test(password) && !COMMON_PASSWORDS.includes(password);

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
app.post("/api/login", loginLimiter, [
  body("username").isAlphanumeric().trim().escape(),
  body("password").isLength({ min: 8 }).trim(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { username, password } = req.body;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers["user-agent"] || "Unknown";

  try {
    const user = await UserModel.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      await logLoginAttempt(username, false, ip, userAgent);
      return res.status(401).json({ message: "Invalid credentials" });
    }
    await logLoginAttempt(username, true, ip, userAgent);
    res.status(200).json({
      message: "Login successful",
      user: { username: user.username, role: user.role },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/register", [
  body("username").isAlphanumeric().trim().escape(),
  body("password").isLength({ min: 8 }).trim(),
  body("role").isIn(["user", "admin"]).optional(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { username, password, role = "user" } = req.body;
  if (!isPasswordStrong(username, password)) {
    return res.status(400).json({ message: "Password is too weak" });
  }

  try {
    if (await UserModel.findOne({ username })) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await UserModel.create({ username, password: hashedPassword, role });
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Failed to register user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/login-attempts", authenticateJWT, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Access denied" });

  try {
    const attempts = await LoginAttempt.find().sort({ timestamp: -1 }).limit(100);
    res.status(200).json(attempts);
  } catch (error) {
    console.error("Failed to retrieve login attempts:", error);
    res.status(500).json({ message: "Server error" });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
