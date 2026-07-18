const User = require('../models/User');
const ClothingItem = require('../models/ClothingItem');
const SwapRequest = require('../models/SwapRequest');

// Get Dashboard Analytics
exports.getAnalytics = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalListings = await ClothingItem.countDocuments();
    const availableListings = await ClothingItem.countDocuments({ status: 'Available' });
    const pendingListings = await ClothingItem.countDocuments({ status: 'Pending' });
    const completedSwaps = await SwapRequest.countDocuments({ status: 'Completed' });
    const disputedSwaps = await SwapRequest.countDocuments({ status: 'Disputed' });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeUsers7Days = await User.countDocuments({
      role: 'user',
      lastActiveAt: { $gte: sevenDaysAgo }
    });

    res.json({
      totalUsers,
      totalListings,
      availableListings,
      pendingListings,
      completedSwaps,
      disputedSwaps,
      activeUsers7Days
    });
  } catch (err) {
    next(err);
  }
};

// Get All Users
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
};

// Get All Listings (Admin)
exports.getAllListings = async (req, res, next) => {
  try {
    const listings = await ClothingItem.find()
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });
    res.json(listings);
  } catch (err) {
    next(err);
  }
};

// Delete User (Admin)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin user' });
    }

    // Delete user's listings
    await ClothingItem.deleteMany({ owner: user._id });
    
    // Delete user
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User and all their listings deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// Resolve Dispute (Admin)
exports.resolveDispute = async (req, res, next) => {
  try {
    const { action, adminResolutionNote } = req.body; // 'Complete', 'Cancel', or 'MarkDisputed'
    const swap = await SwapRequest.findById(req.params.id)
      .populate('offeredItem')
      .populate('requestedItem');

    if (!swap) {
      return res.status(404).json({ message: 'Swap request not found' });
    }

    if (action === 'MarkDisputed') {
      swap.status = 'Disputed';
      swap.resolved = false;
      swap.resolvedByAdmin = false;
      if (adminResolutionNote) swap.adminResolutionNote = adminResolutionNote;
      await swap.save();
      return res.json({ message: 'Swap request successfully marked as Disputed.', swap });
    }

    if (action === 'Complete') {
      // Complete: items marked swapped
      if (swap.offeredItem) await ClothingItem.findByIdAndUpdate(swap.offeredItem._id, { status: 'Swapped' });
      if (swap.requestedItem) await ClothingItem.findByIdAndUpdate(swap.requestedItem._id, { status: 'Swapped' });
      swap.status = 'Completed';
      swap.resolved = true;
      swap.resolvedByAdmin = true;
    } else if (action === 'Cancel') {
      // Cancel/Reject: items returned to Available
      if (swap.offeredItem) await ClothingItem.findByIdAndUpdate(swap.offeredItem._id, { status: 'Available' });
      if (swap.requestedItem) await ClothingItem.findByIdAndUpdate(swap.requestedItem._id, { status: 'Available' });
      swap.status = 'Rejected';
      swap.resolved = true;
      swap.resolvedByAdmin = true;
    } else {
      return res.status(400).json({ message: 'Invalid action. Must be "Complete", "Cancel", or "MarkDisputed"' });
    }

    if (adminResolutionNote) {
      swap.adminResolutionNote = adminResolutionNote;
    }
    await swap.save();

    res.json({ message: `Dispute resolved with action: ${action}`, swap });
  } catch (err) {
    next(err);
  }
};

// Get All Disputed Swaps (Admin)
exports.getDisputedSwaps = async (req, res, next) => {
  try {
    const disputes = await SwapRequest.find({ status: 'Disputed' })
      .populate('fromUser', 'name email')
      .populate('toUser', 'name email')
      .populate('offeredItem')
      .populate('requestedItem')
      .sort({ createdAt: -1 });
    res.json(disputes);
  } catch (err) {
    next(err);
  }
};

// Get All Swaps (Admin)
exports.getAllSwaps = async (req, res, next) => {
  try {
    const swaps = await SwapRequest.find()
      .populate('fromUser', 'name email')
      .populate('toUser', 'name email')
      .populate('offeredItem')
      .populate('requestedItem')
      .sort({ createdAt: -1 });
    res.json(swaps);
  } catch (err) {
    next(err);
  }
};

// Toggle User Active Status (Admin)
exports.toggleUserActive = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot deactivate admin user' });
    }
    user.active = !user.active;
    await user.save();
    res.json({ message: `User status changed to ${user.active ? 'Active' : 'Deactivated'}`, user });
  } catch (err) {
    next(err);
  }
};

