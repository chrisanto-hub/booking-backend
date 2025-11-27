// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  avatar: {
    type: String, // filename or URL
  },
  isAdmin: {
    type: Boolean,
    default: false, // normal users by default
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
