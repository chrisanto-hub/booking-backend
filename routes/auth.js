// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// Multer setup for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Helper: handle validation errors
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

// ✅ Register new user
router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/[A-Za-z]/).withMessage('Password must contain letters')
      .matches(/[0-9]/).withMessage('Password must contain numbers'),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const { name, email, password } = req.body;
      let user = await User.findOne({ email });
      if (user) return res.status(400).json({ error: 'User already exists' });

      const hashedPassword = await bcrypt.hash(password, 10);
      user = new User({ name, email, password: hashedPassword });
      await user.save();

      const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '1d' });
      res.json({ token });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ✅ Login user
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ error: 'Invalid credentials' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

      const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '1d' });
      res.json({ token });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ✅ Get current user profile
router.get('/me', authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
});

// ✅ Update profile (name/email/avatar)
router.put(
  '/profile',
  authMiddleware,
  upload.single('avatar'),
  [
    body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),
    body('email').optional().isEmail().withMessage('Valid email required'),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const updates = {};
      if (req.body.name) updates.name = req.body.name;
      if (req.body.email) updates.email = req.body.email;
      if (req.file) updates.avatar = req.file.filename;

      const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ✅ Update password
router.put(
  '/password',
  authMiddleware,
  [
    body('oldPassword').notEmpty().withMessage('Old password required'),
    body('newPassword')
      .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
      .matches(/[A-Za-z]/).withMessage('New password must contain letters')
      .matches(/[0-9]/).withMessage('New password must contain numbers'),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
      const user = await User.findById(req.user.id);

      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) return res.status(400).json({ error: 'Old password incorrect' });

      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();

      res.json({ message: 'Password updated successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
