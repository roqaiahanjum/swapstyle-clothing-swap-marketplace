const SwapRequest = require('../models/SwapRequest');
const ClothingItem = require('../models/ClothingItem');
const Notification = require('../models/Notification');
const Message = require('../models/Message');

const sendRealTimeNotification = (req, userId, notification) => {
  const io = req.app.get('io');
  if (io && userId) {
    io.to(userId.toString()).emit('newNotification', notification);
  }
};

// Create Swap Request
exports.createSwapRequest = async (req, res, next) => {
  try {
    const { offeredItemId, requestedItemId } = req.body;

    if (!offeredItemId || !requestedItemId) {
      return res.status(400).json({ message: 'Both offered and requested items are required' });
    }

    // Verify offered item belongs to logged-in user and is available
    const offeredItem = await ClothingItem.findById(offeredItemId);
    if (!offeredItem) {
      return res.status(404).json({ message: 'Offered item not found' });
    }
    if (offeredItem.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You must own the offered item' });
    }
    if (offeredItem.status !== 'Available') {
      return res.status(400).json({ message: 'Your offered item is already swap-locked or swapped' });
    }

    // Verify requested item exists and is available
    const requestedItem = await ClothingItem.findById(requestedItemId);
    if (!requestedItem) {
      return res.status(404).json({ message: 'Requested item not found' });
    }
    if (requestedItem.status !== 'Available') {
      return res.status(400).json({ message: 'Requested item is no longer available for swapping' });
    }

    // Prevent swap with self
    if (requestedItem.owner.toString() === req.user.id) {
      return res.status(400).json({ message: 'You cannot swap items with yourself' });
    }

    // Check if swap request already exists between these items
    const existingRequest = await SwapRequest.findOne({
      offeredItem: offeredItemId,
      requestedItem: requestedItemId,
      status: { $in: ['Pending', 'Accepted'] }
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'A swap request for these items is already active' });
    }

    // Create Swap Request
    const swapRequest = new SwapRequest({
      fromUser: req.user.id,
      toUser: requestedItem.owner,
      offeredItem: offeredItemId,
      requestedItem: requestedItemId,
      status: 'Pending'
    });

    await swapRequest.save();

    // Create Notification for the owner of requested item
    const notification = new Notification({
      user: requestedItem.owner,
      text: `You have received a new swap request offering "${offeredItem.title}" for your "${requestedItem.title}"`,
      link: '/swaps'
    });
    await notification.save();
    sendRealTimeNotification(req, requestedItem.owner, notification);

    res.status(201).json(swapRequest);
  } catch (err) {
    next(err);
  }
};

// Get My Swap Requests (incoming & outgoing)
exports.getMySwaps = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const incoming = await SwapRequest.find({ toUser: userId })
      .populate('fromUser', 'name email phone location profilePicture')
      .populate('toUser', 'name email phone location profilePicture')
      .populate('offeredItem')
      .populate('requestedItem')
      .sort({ createdAt: -1 });

    const outgoing = await SwapRequest.find({ fromUser: userId })
      .populate('fromUser', 'name email phone location profilePicture')
      .populate('toUser', 'name email phone location profilePicture')
      .populate('offeredItem')
      .populate('requestedItem')
      .sort({ createdAt: -1 });

    const getUnreadCounts = async (swaps, currentUserId) => {
      return await Promise.all(swaps.map(async (swap) => {
        const unreadCount = await Message.countDocuments({
          swapRequestId: swap._id,
          sender: { $ne: currentUserId },
          read: false
        });
        const swapObj = swap.toObject();
        swapObj.unreadCount = unreadCount;
        return swapObj;
      }));
    };

    const incomingWithUnread = await getUnreadCounts(incoming, userId);
    const outgoingWithUnread = await getUnreadCounts(outgoing, userId);

    res.json({ incoming: incomingWithUnread, outgoing: outgoingWithUnread });
  } catch (err) {
    next(err);
  }
};

// Get Single Swap Request
exports.getSwapById = async (req, res, next) => {
  try {
    const swap = await SwapRequest.findById(req.params.id)
      .populate('fromUser', 'name email phone location profilePicture')
      .populate('toUser', 'name email phone location profilePicture')
      .populate('offeredItem')
      .populate('requestedItem');

    if (!swap) {
      return res.status(404).json({ message: 'Swap request not found' });
    }

    // Ensure logged-in user is part of swap or admin
    if (swap.fromUser._id.toString() !== req.user.id && 
        swap.toUser._id.toString() !== req.user.id && 
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Unauthorized view' });
    }

    res.json(swap);
  } catch (err) {
    next(err);
  }
};

// Update Swap Request Status
exports.updateSwapStatus = async (req, res, next) => {
  try {
    const { status, disputeReason } = req.body;
    const swapId = req.params.id;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const swap = await SwapRequest.findById(swapId)
      .populate('offeredItem')
      .populate('requestedItem');

    if (!swap) {
      return res.status(404).json({ message: 'Swap request not found' });
    }

    // Check authority
    const isToUser = swap.toUser.toString() === req.user.id;
    const isFromUser = swap.fromUser.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isToUser && !isFromUser && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to modify this swap request' });
    }

    // Handle state transitions
    if (status === 'Accepted') {
      // Only the receiver of the swap (toUser) can accept
      if (!isToUser) {
        return res.status(403).json({ message: 'Only the recipient can accept a swap request' });
      }
      if (swap.status !== 'Pending') {
        return res.status(400).json({ message: 'Swap request is not pending' });
      }

      // Check if both items are still Available
      if (swap.offeredItem.status !== 'Available' || swap.requestedItem.status !== 'Available') {
        return res.status(400).json({ message: 'One or both items are no longer available' });
      }

      // Set items status to Pending
      await ClothingItem.findByIdAndUpdate(swap.offeredItem._id, { status: 'Pending' });
      await ClothingItem.findByIdAndUpdate(swap.requestedItem._id, { status: 'Pending' });

      // Update swap status
      swap.status = 'Accepted';
      await swap.save();

      // Reject all other pending swap requests containing either item
      await SwapRequest.updateMany(
        {
          _id: { $ne: swap._id },
          status: 'Pending',
          $or: [
            { offeredItem: swap.offeredItem._id },
            { offeredItem: swap.requestedItem._id },
            { requestedItem: swap.offeredItem._id },
            { requestedItem: swap.requestedItem._id }
          ]
        },
        { status: 'Rejected' }
      );

      // Notify the sender
      const notification = new Notification({
        user: swap.fromUser,
        text: `Your swap request for "${swap.requestedItem.title}" has been accepted! You can now start chat negotiations.`,
        link: `/chat/${swap._id}`
      });
      await notification.save();
      sendRealTimeNotification(req, swap.fromUser, notification);

    } else if (status === 'Rejected') {
      // Receiver of swap rejecting the proposal
      if (!isToUser && !isFromUser) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      if (swap.status === 'Accepted') {
        // If it was accepted, we need to release the items back to Available
        await ClothingItem.findByIdAndUpdate(swap.offeredItem._id, { status: 'Available' });
        await ClothingItem.findByIdAndUpdate(swap.requestedItem._id, { status: 'Available' });
      }

      swap.status = 'Rejected';
      await swap.save();

      // Notify other user
      const targetUser = isToUser ? swap.fromUser : swap.toUser;
      const notification = new Notification({
        user: targetUser,
        text: `Swap request for "${swap.requestedItem.title}" has been declined/cancelled.`,
        link: '/swaps'
      });
      await notification.save();
      sendRealTimeNotification(req, targetUser, notification);

    } else if (status === 'Completed') {
      if (swap.status !== 'Accepted' && swap.status !== 'Disputed') {
        return res.status(400).json({ message: 'Swap must be accepted first before completion' });
      }

      if (isFromUser) {
        swap.confirmedByFrom = true;
      }
      if (isToUser) {
        swap.confirmedByTo = true;
      }

      if (swap.confirmedByFrom && swap.confirmedByTo) {
        // Complete swap: mark both items as Swapped
        await ClothingItem.findByIdAndUpdate(swap.offeredItem._id, { status: 'Swapped' });
        await ClothingItem.findByIdAndUpdate(swap.requestedItem._id, { status: 'Swapped' });

        swap.status = 'Completed';
        await swap.save();

        // Notify both users
        const notifyFrom = new Notification({
          user: swap.fromUser,
          text: `Swap transaction for "${swap.requestedItem.title}" and "${swap.offeredItem.title}" is complete!`,
          link: '/swaps'
        });
        const notifyTo = new Notification({
          user: swap.toUser,
          text: `Swap transaction for "${swap.requestedItem.title}" and "${swap.offeredItem.title}" is complete!`,
          link: '/swaps'
        });
        await Promise.all([notifyFrom.save(), notifyTo.save()]);
        sendRealTimeNotification(req, swap.fromUser, notifyFrom);
        sendRealTimeNotification(req, swap.toUser, notifyTo);
      } else {
        await swap.save();
        // Notify other user to confirm
        const targetUser = isFromUser ? swap.toUser : swap.fromUser;
        const notification = new Notification({
          user: targetUser,
          text: `The other party has marked the swap of "${swap.requestedItem.title}" and "${swap.offeredItem.title}" as completed. Please confirm to complete the transaction.`,
          link: '/swaps'
        });
        await notification.save();
        sendRealTimeNotification(req, targetUser, notification);
      }

    } else if (status === 'Disputed') {
      if (swap.status !== 'Accepted') {
        return res.status(400).json({ message: 'Only active accepted swaps can be disputed' });
      }

      swap.status = 'Disputed';
      swap.disputeReason = disputeReason || 'General Swap Dispute';
      await swap.save();

      // Notify other user
      const targetUser = isToUser ? swap.fromUser : swap.toUser;
      const notification = new Notification({
        user: targetUser,
        text: `A dispute has been raised regarding the swap of "${swap.requestedItem.title}" and "${swap.offeredItem.title}". Our admin team will investigate.`,
        link: `/chat/${swap._id}`
      });
      await notification.save();
      sendRealTimeNotification(req, targetUser, notification);
    }

    res.json(swap);
  } catch (err) {
    next(err);
  }
};
