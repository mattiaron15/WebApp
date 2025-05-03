const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Register route
router.post('/register', authController.register);

// Login route
router.post('/login', authController.login);

// Get current user profile
router.get('/me', protect, authController.getMe);

// Update current user profile
router.put('/me', protect, authController.updateProfile);

// Change password
router.put('/change-password', protect, authController.changePassword);

module.exports = router; 