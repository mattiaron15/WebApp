const Comment = require('../models/Comment');
const Post = require('../models/Post');

// Create a new comment
exports.createComment = async (req, res) => {
  try {
    const { content, postId, parentCommentId } = req.body;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Create comment
    const newComment = await Comment.create({
      content,
      author: req.user.id,
      post: postId,
      parentComment: parentCommentId || null
    });

    // Add comment to post
    post.comments.push(newComment._id);
    await post.save();

    // Populate author details
    await newComment.populate('author', 'username profilePicture');

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(`post-${postId}`).emit('new-comment', {
        comment: newComment,
        parentCommentId
      });
    }

    res.status(201).json({
      success: true,
      data: newComment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating comment',
      error: error.message
    });
  }
};

// Get comments for a post
exports.getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Find top-level comments (no parent comment)
    const comments = await Comment.find({
      post: postId,
      parentComment: null
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username profilePicture')
      .populate({
        path: 'likes',
        select: '_id'
      });

    const totalComments = await Comment.countDocuments({
      post: postId,
      parentComment: null
    });

    res.status(200).json({
      success: true,
      count: comments.length,
      totalComments,
      totalPages: Math.ceil(totalComments / limit),
      currentPage: page,
      data: comments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching comments',
      error: error.message
    });
  }
};

// Get replies for a comment
exports.getCommentReplies = async (req, res) => {
  try {
    const { commentId } = req.params;
    
    // Check if comment exists
    const parentComment = await Comment.findById(commentId);
    if (!parentComment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Find replies
    const replies = await Comment.find({
      parentComment: commentId
    })
      .sort({ createdAt: 1 })
      .populate('author', 'username profilePicture')
      .populate({
        path: 'likes',
        select: '_id'
      });

    res.status(200).json({
      success: true,
      count: replies.length,
      data: replies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching replies',
      error: error.message
    });
  }
};

// Update a comment
exports.updateComment = async (req, res) => {
  try {
    const { content } = req.body;
    
    // Find comment
    let comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user is the author
    if (comment.author.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this comment'
      });
    }

    // Update comment
    comment = await Comment.findByIdAndUpdate(
      req.params.id,
      { 
        content,
        isEdited: true 
      },
      { new: true, runValidators: true }
    ).populate('author', 'username profilePicture');

    res.status(200).json({
      success: true,
      data: comment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating comment',
      error: error.message
    });
  }
};

// Delete a comment
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user is the author
    if (comment.author.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    // Remove comment from post's comments array
    await Post.findByIdAndUpdate(comment.post, {
      $pull: { comments: comment._id }
    });

    // Delete all replies if it's a parent comment
    if (!comment.parentComment) {
      await Comment.deleteMany({ parentComment: comment._id });
    }

    // Delete the comment
    await comment.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting comment',
      error: error.message
    });
  }
};

// Like or unlike a comment
exports.likeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if already liked
    const isLiked = comment.likes.includes(req.user.id);

    if (isLiked) {
      // Unlike
      comment.likes = comment.likes.filter(
        like => like.toString() !== req.user.id
      );
    } else {
      // Like
      comment.likes.push(req.user.id);
    }

    await comment.save();

    // Prepare response data
    const responseData = {
      success: true,
      isLiked: !isLiked,
      likesCount: comment.likes.length,
      commentId: comment._id,
      userId: req.user.id
    };

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(`post-${comment.post}`).emit('comment-like-update', responseData);
    }

    res.status(200).json(responseData);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error liking/unliking comment',
      error: error.message
    });
  }
}; 