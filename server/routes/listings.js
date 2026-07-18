const express = require('express');
const router = express.Router();
const listingsController = require('../controllers/listingsController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Suggest estimated swap value
router.get('/suggest-value', listingsController.suggestValue);

// Get My Listings
router.get('/my', auth, listingsController.getMyListings);

// Get All Listings
router.get('/', listingsController.getListings);

// Get Listing By ID
router.get('/:id', listingsController.getListingById);

// Create Listing (Multiple images upload support)
router.post('/', auth, upload.array('images', 5), listingsController.createListing);

// Update Listing
router.put('/:id', auth, upload.array('images', 5), listingsController.updateListing);

// Delete Listing
router.delete('/:id', auth, listingsController.deleteListing);

module.exports = router;
