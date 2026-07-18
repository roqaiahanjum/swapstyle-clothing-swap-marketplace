const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Register
router.post('/register', upload.single('profilePicture'), authController.register);

// Login
router.post('/login', authController.login);

// Get Profile
router.get('/me', auth, authController.getProfile);

// Update Profile
router.put('/me', auth, upload.single('profilePicture'), authController.updateProfile);

// Change Password
router.put('/change-password', auth, authController.changePassword);

module.exports = router;
