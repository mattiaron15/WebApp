const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

// Create a comment
router.post('/', protect, commentController.createComment);

// Get comments for a post
router.get('/post/:postId', commentController.getPostComments);

// Get replies for a comment
router.get('/replies/:commentId', commentController.getCommentReplies);

// Update, delete a comment
router.route('/:id')
  .put(protect, commentController.updateComment)
  .delete(protect, commentController.deleteComment);

// Like or unlike a comment
router.put('/:id/like', protect, commentController.likeComment);

module.exports = router; 