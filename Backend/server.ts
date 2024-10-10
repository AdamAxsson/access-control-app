import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Anslut till MongoDB
// Anslut till MongoDB
mongoose.connect(process.env.MONGODB_URI as string)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));



// Användarschema
interface User {
  username: string;
  password: string;
  role: 'user' | 'admin';
}

const userSchema = new mongoose.Schema<User>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], required: true },
});

const UserModel = mongoose.model<User>('User', userSchema);

// Registrera ny användare
app.post('/api/register', async (req: Request, res: Response) => {
  const { username, password, role } = req.body;

  try {
    const newUser = new UserModel({ username, password, role });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error: any) {
    console.error(error); // Logga felet i terminalen
    res.status(400).json({ message: error.message });
  }
});


// Login
app.post('/api/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    const user = await UserModel.findOne({ username, password });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    res.status(200).json({ message: 'Login successful', user: { username: user.username, role: user.role } });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Starta servern
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
