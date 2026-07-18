const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function (req, res, next) {
  // Get token from header
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    return res.status(401).json({ message: 'No authorization token, access denied' });
  }

  // Token is format "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Token format is invalid, must be Bearer <token>' });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'swapstyle_jwt_secret_key_2026_dev_mode');
    
    const dbUser = await User.findById(decoded.id);
    if (!dbUser) {
      return res.status(401).json({ message: 'User not found, access denied' });
    }
    if (dbUser.active === false) {
      return res.status(401).json({ message: 'Your account has been deactivated by administration.' });
    }

    req.user = decoded; // holds { id, role }

    // Update activity timestamp
    dbUser.lastActiveAt = new Date();
    await dbUser.save();

    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid or expired' });
  }
};
