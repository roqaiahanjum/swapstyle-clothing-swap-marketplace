const Message = require('../models/Message');
const SwapRequest = require('../models/SwapRequest');

// Get Chat Messages for Room
exports.getChatMessages = async (req, res, next) => {
  try {
    const { swapRequestId } = req.params;
    
    // Verify swap exists and user is part of it
    const swap = await SwapRequest.findById(swapRequestId);
    if (!swap) {
      return res.status(404).json({ message: 'Swap request not found' });
    }

    if (swap.fromUser.toString() !== req.user.id && 
        swap.toUser.toString() !== req.user.id && 
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied to this chat room' });
    }

    const messages = await Message.find({ swapRequestId })
      .populate('sender', 'name profilePicture')
      .sort({ timestamp: 1 });

    res.json(messages);
  } catch (err) {
    next(err);
  }
};

// Mark Chat Messages as Read
exports.markAsRead = async (req, res, next) => {
  try {
    const { swapRequestId } = req.params;
    
    // Update all messages in this swap request where sender is NOT the current user
    await Message.updateMany(
      { swapRequestId, sender: { $ne: req.user.id }, read: false },
      { $set: { read: true } }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (err) {
    next(err);
  }
};
