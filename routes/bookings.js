// routes/bookings.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const authMiddleware = require('../middleware/authMiddleware');

// Helper: handle validation errors
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

// ✅ Create a booking (only logged-in user)
router.post(
  '/',
  authMiddleware,
  [
    body('service')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Service must be 2–50 characters'),
    body('date')
      .notEmpty()
      .withMessage('Date is required')
      .isISO8601()
      .withMessage('Date must be valid ISO8601 format')
      .custom((value) => {
        const d = new Date(value);
        if (d <= new Date()) throw new Error('Date must be in the future');
        return true;
      }),
    body('notes')
      .optional()
      .isLength({ max: 200 })
      .withMessage('Notes must be at most 200 characters'),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const booking = new Booking({
        ...req.body,
        user: req.user.id,
      });
      await booking.save();
      res.status(201).json(booking);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

// ✅ Get all bookings for logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get a single booking (only if owned by user)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user.id });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Update booking status (confirm/cancel)
router.put(
  '/:id/status',
  authMiddleware,
  [
    body('status')
      .notEmpty()
      .withMessage('Status is required')
      .isIn(['pending', 'confirmed', 'cancelled'])
      .withMessage('Status must be pending, confirmed, or cancelled'),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const booking = await Booking.findOneAndUpdate(
        { _id: req.params.id, user: req.user.id },
        { status: req.body.status },
        { new: true }
      );
      if (!booking) return res.status(404).json({ error: 'Booking not found' });
      res.json(booking);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ✅ Delete a booking (only if owned by user)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const deleted = await Booking.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!deleted) return res.status(404).json({ error: 'Booking not found' });
    res.json({ message: 'Booking deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
