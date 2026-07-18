const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

// Get All User Notifications
router.get('/', auth, async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) {
    next(err);
  }
});

// Mark Single Notification as Read
router.put('/:id/read', auth, async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: { read: true } },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json(notification);
  } catch (err) {
    next(err);
  }
});

// Mark All Notifications as Read
router.put('/read-all', auth, async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { $set: { read: true } }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
