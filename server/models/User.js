const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    default: ''
  },
  location: {
    city: {
      type: String,
      required: true,
      default: 'Unknown'
    },
    coordinates: {
      lat: {
        type: Number,
        default: 0
      },
      lng: {
        type: Number,
        default: 0
      }
    }
  },
  profilePicture: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  },
  active: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model('User', UserSchema);
