// booking-backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

dotenv.config();
const app = express();

// CORS: allow your production frontends
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
}));
app.use(express.json());

// Serve uploads (avatars)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// Routes
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
