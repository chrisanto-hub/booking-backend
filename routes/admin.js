// routes/admin.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Booking = require('../models/Booking');
const authMiddleware = require('../middleware/authMiddleware');

// Middleware to check if user is admin
function adminMiddleware(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Access denied. Admins only.' });
  }
  next();
}

// ✅ Get all users
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get all bookings
router.get('/bookings', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find().populate('user', 'name email');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Update booking status (admin override)
router.put('/bookings/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('user', 'name email');

    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Delete a user
router.delete('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
