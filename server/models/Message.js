const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  swapRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SwapRequest',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  read: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Message', MessageSchema);
