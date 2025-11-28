const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Booking = require('../models/Booking');

// Middleware to verify token
function authMiddleware(req, res, next) {
  const header = req.header('Authorization');
  if (!header) return res.status(401).json({ error: 'No token provided' });

  const token = header.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ✅ Get all bookings (admin only)
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const bookings = await Booking.find();
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Create a new booking (any logged-in user)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { service, date } = req.body;
    if (!service || !date) {
      return res.status(400).json({ error: 'Service and date required' });
    }

    const booking = new Booking({
      user: req.user.id,
      service,
      date
    });

    await booking.save();
    res.json({ booking });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
