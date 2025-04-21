const dotenv = require('dotenv');
// require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;

// const cloudinary = require('cloudinary');
// import { v2 as cloudinary } from 'cloudinary';


const app = express();
// app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


dotenv.config({
  path: path.resolve(__dirname, `.env.${process.env.NODE_ENV || 'production'}`)
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  graphics: [{ type: String }]
});

const User = mongoose.model('User', userSchema);

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};


//Cloudinary
(async function() {

  // Configuration
  cloudinary.config({ 
      cloud_name: 'dhypvhlw9', 
      api_key: '931334672885819', 
      api_secret: 'XtEmPPoEFAgnggyHuVjlzx3Wdtg' // Click 'View API Keys' above to copy your API secret
  });
  
  // Upload an image
   const uploadResult = await cloudinary.uploader
     .upload(
         'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg', {
             public_id: 'shoes',
         }
     )
     .catch((error) => {
         console.log(error);
     });
  
  console.log(uploadResult);
  
  // Optimize delivery by resizing and applying auto-format and auto-quality
  const optimizeUrl = cloudinary.url('shoes', {
      fetch_format: 'auto',
      quality: 'auto'
  });
  
  console.log(optimizeUrl);
  
  // Transform the image: auto-crop to square aspect_ratio
  const autoCropUrl = cloudinary.url('shoes', {
      crop: 'auto',
      gravity: 'auto',
      width: 500,
      height: 500,
  });
  
  console.log(autoCropUrl);    
})();

// Routes
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post(`${BASE_URL}/api/upload`, authenticateToken, upload.single('graphic'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    const user = await User.findById(req.user.userId);
    user.graphics.push(req.file.filename);
    await user.save();
    
    res.json({ message: 'File uploaded successfully', filename: req.file.filename });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/graphics', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    res.json({ graphics: user.graphics });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/graphics/:filename', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user.graphics.includes(req.params.filename)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const filePath = path.join(__dirname, 'uploads', req.params.filename);
    res.sendFile(filePath);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const PORT = process.env.PORT;
if (!PORT) {
    console.error('PORT environment variable is not set. This is required for production.');
    process.exit(1);
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 
