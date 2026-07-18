const express = require('express');
const router = express.Router();
const swapsController = require('../controllers/swapsController');
const auth = require('../middleware/auth');

// Create Swap Request
router.post('/', auth, swapsController.createSwapRequest);

// Get My Swaps (incoming + outgoing)
router.get('/', auth, swapsController.getMySwaps);

// Get Swap Request By ID
router.get('/:id', auth, swapsController.getSwapById);

// Update Swap Request Status (Accept, Decline, Complete, Dispute)
router.put('/:id', auth, swapsController.updateSwapStatus);

module.exports = router;
