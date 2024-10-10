// server.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');

dotenv.config();

const app = express();
app.use(cors({ origin: 'http://localhost:3000' })); // Ändra detta till din frontend-URL
app.use(express.json());

// Anslut till MongoDB
mongoose.connect(process.env.VITE_MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Användarschema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], required: true },
});

const UserModel = mongoose.model('User', userSchema);

// Registrera ny användare
// Registrera ny användare
app.post('/api/register', async (req, res) => {
  const { username, password, role } = req.body;

  try {
    // Kontrollera om användarnamnet redan finns
    const existingUser = await UserModel.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10); // Hasha lösenordet
    const newUser = new UserModel({ username, password: hashedPassword, role });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error); // Logga felet i terminalen
    res.status(400).json({ message: error.message });
  }
});


// Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await UserModel.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password); // Jämför lösenord
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.status(200).json({ message: 'Login successful', user: { username: user.username, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Starta servern
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
