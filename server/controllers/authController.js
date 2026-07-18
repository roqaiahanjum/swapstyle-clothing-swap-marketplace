const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register User
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, city, lat, lng } = req.body;

    // Simple validation
    if (!name || !email || !password || !city) {
      return res.status(400).json({ message: 'Please enter all required fields' });
    }

    // Check existing user
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Profile picture (if uploaded)
    let profilePicture = '';
    if (req.file) {
      profilePicture = `/uploads/${req.file.filename}`;
    }

    // Create User
    user = new User({
      name,
      email,
      password: hashedPassword,
      phone: phone || '',
      location: {
        city,
        coordinates: {
          lat: parseFloat(lat) || 0,
          lng: parseFloat(lng) || 0
        }
      },
      profilePicture,
      role: 'user' // Default role
    });

    await user.save();

    // Create JWT
    const payload = {
      id: user._id,
      role: user.role
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'swapstyle_jwt_secret_key_2026_dev_mode',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
        profilePicture: user.profilePicture,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
};

// Login User
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter email and password' });
    }

    // Check user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check active status
    if (user.active === false) {
      return res.status(400).json({ message: 'Your account has been deactivated by administration.' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT
    const payload = {
      id: user._id,
      role: user.role
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'swapstyle_jwt_secret_key_2026_dev_mode',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
        profilePicture: user.profilePicture,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
};

// Get User Profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// Update Profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, city, lat, lng } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    
    if (city) {
      user.location.city = city;
      if (lat !== undefined && lng !== undefined) {
        user.location.coordinates = {
          lat: parseFloat(lat),
          lng: parseFloat(lng)
        };
      }
    }

    if (req.file) {
      user.profilePicture = `/uploads/${req.file.filename}`;
    }

    await user.save();

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      location: user.location,
      profilePicture: user.profilePicture,
      role: user.role
    });
  } catch (err) {
    next(err);
  }
};

// Change Password
exports.changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Please enter old and new passwords.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Validate old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect old password.' });
    }

    // Hash and save new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password updated successfully!' });
  } catch (err) {
    next(err);
  }
};
