const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Get user profile
router.get('/:id', userController.getUserProfile);

// Update user profile
router.put('/:id', protect, userController.updateUserProfile);

// Get user posts
router.get('/:id/posts', userController.getUserPosts);

// Follow or unfollow a user
router.put('/:id/follow', protect, userController.followUser);

module.exports = router; 