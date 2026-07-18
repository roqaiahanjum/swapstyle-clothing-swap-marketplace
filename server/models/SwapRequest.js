const mongoose = require('mongoose');

const SwapRequestSchema = new mongoose.Schema({
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  offeredItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClothingItem',
    required: true
  },
  requestedItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClothingItem',
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected', 'Completed', 'Disputed'],
    default: 'Pending'
  },
  disputeReason: {
    type: String,
    default: ''
  },
  resolvedByAdmin: {
    type: Boolean,
    default: false
  },
  adminResolutionNote: {
    type: String,
    default: ''
  },
  resolved: {
    type: Boolean,
    default: false
  },
  confirmedByFrom: {
    type: Boolean,
    default: false
  },
  confirmedByTo: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SwapRequest', SwapRequestSchema);
