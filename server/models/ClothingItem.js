const mongoose = require('mongoose');

const ClothingItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Outerwear', 'Tops', 'Bottoms', 'Shoes', 'Accessories', 'Other']
  },
  brand: {
    type: String,
    required: true
  },
  size: {
    type: String,
    required: true
  },
  condition: {
    type: String,
    required: true,
    enum: ['New', 'Like New', 'Good', 'Fair']
  },
  images: [
    {
      type: String
    }
  ],
  estimatedSwapValue: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Available', 'Pending', 'Swapped'],
    default: 'Available'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    city: {
      type: String,
      required: true
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
  gender: {
    type: String,
    enum: ['Men', 'Women', 'Unisex', 'Kids'],
    default: 'Unisex'
  },
  color: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ClothingItem', ClothingItemSchema);
