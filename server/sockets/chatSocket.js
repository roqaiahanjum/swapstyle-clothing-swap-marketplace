const Message = require('../models/Message');
const SwapRequest = require('../models/SwapRequest');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Keep track of online users: userId -> socketId
const onlineUsers = new Map();

// Keep track of who is in which chat room: socketId -> roomName
const socketRooms = new Map();

module.exports = function (io) {
  io.on('connection', (socket) => {
    // Register User
    socket.on('registerUser', (userId) => {
      if (userId) {
        socket.join(userId);
        onlineUsers.set(userId, socket.id);
        // Broadcast user status changed (online)
        io.emit('userStatusChange', { userId, status: 'online' });
      }
    });

    // Join Room (specific to a SwapRequest ID)
    socket.on('joinRoom', async ({ swapRequestId, userId }) => {
      socket.join(swapRequestId);
      socketRooms.set(socket.id, swapRequestId);
      
      // Optionally mark messages as read when joining
      try {
        await Message.updateMany(
          { swapRequestId, sender: { $ne: userId }, read: false },
          { $set: { read: true } }
        );
        // Let the other user know messages are read
        socket.to(swapRequestId).emit('messagesRead', { swapRequestId });
      } catch (err) {
        console.error('Error marking messages read on join:', err);
      }
    });

    // Leave Room
    socket.on('leaveRoom', ({ swapRequestId }) => {
      socket.leave(swapRequestId);
      socketRooms.delete(socket.id);
    });

    // Send Message
    socket.on('sendMessage', async ({ swapRequestId, senderId, text }) => {
      try {
        if (!swapRequestId || !senderId || !text) return;

        // Save message to database
        const message = new Message({
          swapRequestId,
          sender: senderId,
          text,
          read: false
        });
        await message.save();

        // Populate sender details for frontend
        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'name profilePicture');

        // Emit message to everyone in the room
        io.to(swapRequestId).emit('newMessage', populatedMessage);

        // Notify recipient if they are not in the room
        const swap = await SwapRequest.findById(swapRequestId);
        if (swap) {
          const recipientId = swap.fromUser.toString() === senderId ? swap.toUser.toString() : swap.fromUser.toString();
          
          // Check if recipient is currently in the room
          let recipientInRoom = false;
          const recipientSocketId = onlineUsers.get(recipientId);
          if (recipientSocketId) {
            const currentRoom = socketRooms.get(recipientSocketId);
            if (currentRoom === swapRequestId) {
              recipientInRoom = true;
            }
          }

          if (!recipientInRoom) {
            // Create a Notification in MongoDB
            const sender = await User.findById(senderId);
            const notificationText = `New message from ${sender ? sender.name : 'Swapper'} in negotiations chat.`;
            
            const notification = new Notification({
              user: recipientId,
              text: notificationText,
              link: `/chat/${swapRequestId}`
            });
            await notification.save();

            // Send real-time notification if recipient is online
            if (recipientSocketId) {
              io.to(recipientSocketId).emit('newNotification', {
                _id: notification._id,
                text: notificationText,
                link: `/chat/${swapRequestId}`,
                read: false,
                createdAt: notification.createdAt
              });
            }
          }
        }
      } catch (err) {
        console.error('Error saving or emitting socket message:', err);
      }
    });

    // Typing Indicator
    socket.on('typing', ({ swapRequestId, senderName, isTyping }) => {
      socket.to(swapRequestId).emit('typingStatus', { senderName, isTyping });
    });

    // Disconnect
    socket.on('disconnect', () => {
      // Clean up maps
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          io.emit('userStatusChange', { userId, status: 'offline' });
          break;
        }
      }
      socketRooms.delete(socket.id);
    });
  });
};
