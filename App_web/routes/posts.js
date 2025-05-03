const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');

// Get all posts and create a post
router.route('/')
  .get(postController.getAllPosts)
  .post(protect, postController.createPost);

// Get trending posts
router.get('/trending', postController.getTrendingPosts);

// Search posts
router.get('/search', postController.searchPosts);

// Get, update, and delete a specific post
router.route('/:id')
  .get(postController.getPost)
  .put(protect, postController.updatePost)
  .delete(protect, postController.deletePost);

// Like or unlike a post
router.put('/:id/like', protect, postController.likePost);

module.exports = router; 