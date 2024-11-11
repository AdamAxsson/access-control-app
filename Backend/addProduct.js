// const axios = require("axios");

// const token = "din_hemliga_nyckel"; // Sätt in din giltiga JWT-token

// const products = [
//   { name: "Produkt 1", stock: 10, price: 199 },
//   { name: "Produkt 2", stock: 5, price: 299 }
// ];

// async function addProducts() {
//   for (const product of products) {
//     try {
//       const response = await axios.post("http://localhost:5000/api/products", product, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       console.log("Produkt tillagd:", response.data);
//     } catch (error) {
//       console.error("Kunde inte lägga till produkt:", error.response ? error.response.data : error.message);
//     }
//   }
// }

 // const productSchema = new mongoose.Schema({
  //   name: { type: String, required: true },
  //   stock: { type: Number, required: true },
  //   price: { type: Number, required: true },
  // });
  // const ProductModel = mongoose.model("Product", productSchema);

  // const reservationSchema = new mongoose.Schema({
  //   user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  //   product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  //   reservedAt: { type: Date, default: Date.now },
  // });
  // const ReservationModel = mongoose.model("Reservation", reservationSchema);

  // Routes
  // app.post("/api/reserve", authenticateJWT, async (req, res) => {
  //   const { productId } = req.body;

  //   try {
  //     // Hämta produkt och användare
  //     const product = await ProductModel.findById(productId);
  //     const user = await UserModel.findById(req.user._id);

  //     if (!product) {
  //       return res.status(404).json({ message: "Product not found" });
  //     }

  //     if (product.stock <= 0) {
  //       return res.status(400).json({ message: "Product is out of stock" });
  //     }

  //     if (user.reservations.length >= 5) {
  //       return res.status(400).json({ message: "You can only reserve up to 5 products" });
  //     }

  //     // Skapa en reservation
  //     const reservation = new ReservationModel({ user: user._id, product: product._id });
  //     await reservation.save();

  //     // Minska lagersaldo för produkten
  //     product.stock -= 1;
  //     await product.save();

  //     // Lägg till reservation till användarens reservationer
  //     user.reservations.push(reservation._id);
  //     await user.save();

  //     res.status(200).json({ message: "Product reserved successfully", reservation });
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).json({ message: "Server error" });
  //   }
  // });

  // // Function to log login attempts
  // const logLoginAttempt = async (username, success, req) => {
  //   const ip = req.ip || req.connection.remoteAddress; // Hämta IP-adressen från req
  //   const userAgent = req.headers["user-agent"] || "Unknown"; // Hämta användaragenten

  //   // Använd moment-timezone för att logga korrekt Stockholm-tid
  //   const localDate = moment().tz("Europe/Stockholm").format("YYYY-MM-DD HH:mm:ss"); 

  //   console.log(`[${localDate}] Inloggningsförsök: ${username} | IP: ${ip} | User-Agent: ${userAgent} | Lyckades: ${success}`);
    
  //   // Spara inloggningsförsöket i databasen
  //   await LoginAttempt.create({ username, success, ip, userAgent });
  // };
  // app.get("/api/products", async (req, res) => {
  //   try {
  //     const products = await ProductModel.find();
  //     res.status(200).json(products);
  //   } catch (error) {
  //     console.error("Failed to fetch products:", error);
  //     res.status(500).json({ message: "Server error" });
  //   }
  // });

  // app.post("/api/products", authenticateJWT, async (req, res) => {
  //   const { name, stock, price } = req.body;

  //   // Kontrollera att alla nödvändiga fält är med
  //   if (!name || !stock || !price) {
  //     return res.status(400).json({ message: "All product fields are required" });
  //   }

  //   try {
  //     const newProduct = new ProductModel({ name, stock, price });
  //     await newProduct.save();
  //     res.status(201).json(newProduct);
  //   } catch (error) {
  //     console.error("Failed to add product:", error);
  //     res.status(500).json({ message: "Server error" });
  //   }
  // });

// addProducts();
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Ladda miljövariabler från .env-fil
dotenv.config();

// Anslut till din MongoDB-databas
mongoose.connect(process.env.VITE_MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1); // Stoppa om anslutningen misslyckas
  });

// Produkt-schema och modell
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  price: { type: Number, required: true, min: 0 },
  reservedBy: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    quantity: { type: Number, required: true, min: 1 }
  }]
});

const Product = mongoose.model('Product', productSchema);

// Definiera produkter att skapa
const products = [
  { name: "Laptop", quantity: 10, price: 7999.99, reservedBy: [] },
  { name: "Smartphone", quantity: 20, price: 4999.99, reservedBy: [] },
  { name: "Headphones", quantity: 50, price: 899.99, reservedBy: [] }
];

// Skapa produkterna i databasen
Product.insertMany(products)
  .then((result) => {
    console.log("Produkter skapade:", result);
    mongoose.disconnect();  // Koppla bort från databasen när vi är klara
  })
  .catch((error) => {
    console.error("Fel vid skapande av produkter:", error);
    mongoose.disconnect();  // Koppla bort även om det uppstår ett fel
  });

