const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const cors = require('cors');
const path = require('path');
const auth = require('./middleware/auth'); 
const checkInRoutes = require('./routes/checkInRoutes');
const questRoutes = require('./routes/questRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const forcedJWT_SECRET = '4a8f5b3e2c1d9e7f6a5b4c3d2e1f0a9';
// Ensure process.env.JWT_SECRET is set so auth middleware works if .env is missing
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = forcedJWT_SECRET;
}
const usedJWT_SECRET = process.env.JWT_SECRET;

app.use(express.json());
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*', // Use env var for production, allow all for testing
  credentials: true
}));

app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) return res.status(400).json({ msg: 'Email and password required' });
    const user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });
    const newUser = new User({ email, password: await bcrypt.hash(password, 10) });
    await newUser.save();
    const payload = { user: { id: newUser.id } };
    const token = jwt.sign(payload, usedJWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) return res.status(400).json({ msg: 'Email and password required' });
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'User not found' });
    if (!await bcrypt.compare(password, user.password)) return res.status(400).json({ msg: 'Invalid credentials' });
    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, usedJWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

app.use('/api/checkin', auth, checkInRoutes); // Apply auth middleware to protected routes


app.use('/api/quest', require('./routes/questRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));


app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).send(`Cannot ${req.method} ${req.url}`);
});

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB connection error:', err));
