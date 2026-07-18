const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Get Dashboard Analytics
router.get('/analytics', auth, admin, adminController.getAnalytics);

// Get All Users
router.get('/users', auth, admin, adminController.getAllUsers);

// Get All Listings
router.get('/listings', auth, admin, adminController.getAllListings);

// Delete User and their listings
router.delete('/users/:id', auth, admin, adminController.deleteUser);

// Get All Disputed Swaps
router.get('/disputes', auth, admin, adminController.getDisputedSwaps);

// Get All Swaps (Admin)
router.get('/swaps', auth, admin, adminController.getAllSwaps);

// Resolve Dispute (Accept action: 'Complete' or 'Cancel' or 'MarkDisputed')
router.put('/disputes/:id', auth, admin, adminController.resolveDispute);

// Toggle user active status (deactivate/activate)
router.put('/users/:id/toggle-active', auth, admin, adminController.toggleUserActive);

module.exports = router;

