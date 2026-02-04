require('dotenv').config();
const express = require('express');
const multer = require('multer');
const basicAuth = require('express-basic-auth');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Paths
const CONFIG_PATH = path.join(__dirname, 'data', 'config.json');
const UPLOADS_PATH = path.join(__dirname, 'uploads');
const GALLERY_PATH = path.join(__dirname, 'public', 'images', 'gallery');

// Ensure directories exist
[UPLOADS_PATH, GALLERY_PATH, path.dirname(CONFIG_PATH)].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Basic auth for admin routes
const adminAuth = basicAuth({
  users: { [process.env.ADMIN_USERNAME || 'admin']: process.env.ADMIN_PASSWORD || 'changeme' },
  challenge: true,
  realm: 'The Hearth Admin'
});

// Multer configuration for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_PATH);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Helper functions
function getConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading config:', err);
  }
  return getDefaultConfig();
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

function getDefaultConfig() {
  return {
    theme: {
      primaryColor: '#c9a66b',
      secondaryColor: '#8b7355',
      accentColor: '#e8d5b7',
      lightBg: '#faf8f5',
      lightText: '#2c2c2c',
      darkBg: '#1a1a1a',
      darkText: '#f5f5f5',
      fontHeading: 'Josefin Sans',
      fontBody: 'Inter'
    },
    share: {
      copyUrl: true,
      twitter: true,
      facebook: true,
      linkedin: true,
      email: true
    },
    gallery: []
  };
}

// Initialize config if it doesn't exist
if (!fs.existsSync(CONFIG_PATH)) {
  saveConfig(getDefaultConfig());
}

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// ============ PUBLIC API ROUTES ============

// Get public config (safe version without sensitive data)
app.get('/api/config', (req, res) => {
  const config = getConfig();
  res.json(config);
});

// Get gallery images
app.get('/api/gallery', (req, res) => {
  const config = getConfig();
  res.json(config.gallery || []);
});

// Contact form submission
app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM || 'noreply@thehearth.pro',
      to: process.env.MAIL_TO || 'join@thehearth.pro',
      replyTo: email,
      subject: `[The Hearth] ${subject || 'New Contact Form Submission'}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject || 'N/A'}</p>
        <hr>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `
    });
    res.json({ success: true, message: 'Message sent successfully' });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ error: 'Failed to send message. Please try again later.' });
  }
});

// ============ ADMIN ROUTES ============

// Admin panel
app.get('/admin', adminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Get full config (admin only)
app.get('/api/admin/config', adminAuth, (req, res) => {
  res.json(getConfig());
});

// Update config
app.post('/api/admin/config', adminAuth, (req, res) => {
  try {
    const currentConfig = getConfig();
    const newConfig = { ...currentConfig, ...req.body };

    // Preserve gallery if not provided
    if (!req.body.gallery) {
      newConfig.gallery = currentConfig.gallery;
    }

    saveConfig(newConfig);
    res.json({ success: true, config: newConfig });
  } catch (err) {
    console.error('Config save error:', err);
    res.status(500).json({ error: 'Failed to save configuration' });
  }
});

// Upload gallery image
app.post('/api/admin/gallery/upload', adminAuth, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }

  const config = getConfig();
  const imageData = {
    id: Date.now().toString(),
    filename: req.file.filename,
    originalName: req.file.originalname,
    path: `/uploads/${req.file.filename}`,
    caption: req.body.caption || '',
    order: config.gallery.length
  };

  config.gallery.push(imageData);
  saveConfig(config);

  res.json({ success: true, image: imageData });
});

// Update gallery image (caption, order)
app.put('/api/admin/gallery/:id', adminAuth, (req, res) => {
  const config = getConfig();
  const imageIndex = config.gallery.findIndex(img => img.id === req.params.id);

  if (imageIndex === -1) {
    return res.status(404).json({ error: 'Image not found' });
  }

  if (req.body.caption !== undefined) {
    config.gallery[imageIndex].caption = req.body.caption;
  }
  if (req.body.order !== undefined) {
    config.gallery[imageIndex].order = req.body.order;
  }

  saveConfig(config);
  res.json({ success: true, image: config.gallery[imageIndex] });
});

// Reorder gallery images
app.post('/api/admin/gallery/reorder', adminAuth, (req, res) => {
  const { order } = req.body; // Array of image IDs in new order

  if (!Array.isArray(order)) {
    return res.status(400).json({ error: 'Order must be an array of image IDs' });
  }

  const config = getConfig();
  const reorderedGallery = [];

  order.forEach((id, index) => {
    const image = config.gallery.find(img => img.id === id);
    if (image) {
      image.order = index;
      reorderedGallery.push(image);
    }
  });

  // Add any images not in the order array at the end
  config.gallery.forEach(img => {
    if (!order.includes(img.id)) {
      img.order = reorderedGallery.length;
      reorderedGallery.push(img);
    }
  });

  config.gallery = reorderedGallery;
  saveConfig(config);

  res.json({ success: true, gallery: config.gallery });
});

// Delete gallery image
app.delete('/api/admin/gallery/:id', adminAuth, (req, res) => {
  const config = getConfig();
  const imageIndex = config.gallery.findIndex(img => img.id === req.params.id);

  if (imageIndex === -1) {
    return res.status(404).json({ error: 'Image not found' });
  }

  const image = config.gallery[imageIndex];

  // Delete file from disk
  const filePath = path.join(UPLOADS_PATH, image.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  config.gallery.splice(imageIndex, 1);

  // Reorder remaining images
  config.gallery.forEach((img, idx) => {
    img.order = idx;
  });

  saveConfig(config);
  res.json({ success: true });
});

// ============ START SERVER ============

app.listen(PORT, () => {
  console.log(`The Hearth server running on http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
});
