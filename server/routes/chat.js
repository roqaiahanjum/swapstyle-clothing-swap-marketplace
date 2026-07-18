const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');

// Get Chat Room Messages
router.get('/:swapRequestId/messages', auth, chatController.getChatMessages);

// Mark Messages in Room as Read
router.put('/:swapRequestId/read', auth, chatController.markAsRead);

module.exports = router;
