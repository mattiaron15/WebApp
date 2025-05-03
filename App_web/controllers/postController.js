const Post = require('../models/Post');
const User = require('../models/User');
const axios = require('axios');
const config = require('../config/config');

// API base URL from config (used only for user-related operations)
const API_BASE_URL = config.API_BASE_URL;

// Create a new post
exports.createPost = async (req, res) => {
  try {
    const { title, content, tags, image } = req.body;

    // Use local implementation for post creation
    const post = await Post.create({
      title,
      content,
      author: req.user.id,
      tags: tags ? (typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()) : tags) : [],
      image: image || ''
    });

    res.status(201).json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating post',
      error: error.message
    });
  }
};

// Get all posts with pagination
exports.getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    // Filtro per tag se presente nella query
    const tagFilter = req.query.tag ? { tags: req.query.tag } : {};
    
    const posts = await Post.find(tagFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username profilePicture')
      .populate({
        path: 'comments',
        select: 'content createdAt',
        populate: {
          path: 'author',
          select: 'username profilePicture'
        }
      });

    // Conta i post totali con lo stesso filtro
    const totalPosts = await Post.countDocuments(tagFilter);

    res.status(200).json({
      success: true,
      count: posts.length,
      totalPosts,
      totalPages: Math.ceil(totalPosts / limit),
      currentPage: page,
      data: posts
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching posts',
      error: error.message
    });
  }
};

// Get single post
exports.getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username profilePicture bio email')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'username profilePicture'
        }
      });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Increment view count
    post.views += 1;
    await post.save();

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching post',
      error: error.message
    });
  }
};

// Update post
exports.updatePost = async (req, res) => {
  try {
    let post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Log delle informazioni per debug
    console.log('----DEBUG UPDATE POST----');
    console.log('Post author ID:', post.author.toString());
    console.log('User ID from req.user:', req.user.id);
    console.log('------------------------');

    // Verifica più flessibile della proprietà del post
    // 1. Controlla l'ID esatto
    // 2. Controlla se l'utente è l'autore del post verificando tramite email
    let isAuthorized = false;
    
    // Verifica diretta dell'ID
    if (post.author.toString() === req.user.id) {
      isAuthorized = true;
    } 
    // Verifica tramite email se disponibile
    else if (req.user.email) {
      try {
        // Trova l'autore del post in base all'ID dell'autore
        const author = await User.findById(post.author);
        
        // Se l'email dell'utente corrente corrisponde all'email dell'autore, è autorizzato
        if (author && author.email === req.user.email) {
          isAuthorized = true;
          console.log('User authorized via email match');
        }
      } catch (err) {
        console.error('Error checking author email:', err);
      }
    }
    
    // Controllo admin
    if (req.user.isAdmin) {
      isAuthorized = true;
      console.log('User authorized as admin');
    }
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this post'
      });
    }

    const { title, content, tags, image } = req.body;

    post = await Post.findByIdAndUpdate(
      req.params.id,
      { 
        title, 
        content, 
        tags: tags ? (typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()) : tags) : post.tags,
        image: image || post.image
      },
      { new: true, runValidators: true }
    ).populate('author', 'username profilePicture');

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating post',
      error: error.message
    });
  }
};

// Delete post
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Log delle informazioni per debug
    console.log('----DEBUG DELETE POST----');
    console.log('Post author ID:', post.author.toString());
    console.log('User ID from req.user:', req.user.id);
    console.log('User object:', JSON.stringify(req.user));
    console.log('------------------------');

    // Verifica più flessibile della proprietà del post
    // 1. Controlla l'ID esatto
    // 2. Controlla se l'utente è l'autore del post verificando tramite email
    let isAuthorized = false;
    
    // Verifica diretta dell'ID
    if (post.author.toString() === req.user.id) {
      isAuthorized = true;
    } 
    // Verifica tramite email se disponibile
    else if (req.user.email) {
      try {
        // Trova l'autore del post in base all'ID dell'autore
        const author = await User.findById(post.author);
        
        // Se l'email dell'utente corrente corrisponde all'email dell'autore, è autorizzato
        if (author && author.email === req.user.email) {
          isAuthorized = true;
          console.log('User authorized via email match');
        }
      } catch (err) {
        console.error('Error checking author email:', err);
      }
    }
    
    // Controllo admin
    if (req.user.isAdmin) {
      isAuthorized = true;
      console.log('User authorized as admin');
    }
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }

    await post.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting post',
      error: error.message
    });
  }
};

// Like or unlike a post
exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if the post has already been liked by this user
    const isLiked = post.likes.includes(req.user.id);

    if (isLiked) {
      // Unlike
      post.likes = post.likes.filter(
        like => like.toString() !== req.user.id
      );
    } else {
      // Like
      post.likes.push(req.user.id);
    }

    await post.save();

    // Prepare response data
    const responseData = {
      success: true,
      isLiked: !isLiked,
      likesCount: post.likes.length,
      data: post.likes,
      userId: req.user.id
    };

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(`post-${post._id}`).emit('post-like-update', responseData);
    }

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error liking/unliking post:', error);
    res.status(500).json({
      success: false,
      message: 'Error liking/unliking post',
      error: error.message
    });
  }
};

// Search posts
exports.searchPosts = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a search query'
      });
    }

    const posts = await Post.find(
      { $text: { $search: query } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .populate('author', 'username profilePicture')
      .limit(20);

    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts
    });
  } catch (error) {
    console.error('Error searching posts:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching posts',
      error: error.message
    });
  }
};

// Get trending posts
exports.getTrendingPosts = async (req, res) => {
  try {
    // Get posts from the last 7 days
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    // Modified sorting to avoid the parallel arrays issue
    // Use only one sorting criteria: views (which is a simple number field)
    const posts = await Post.find({
      createdAt: { $gte: lastWeek }
    })
      .sort({ views: -1 })
      .limit(5)
      .populate('author', 'username profilePicture');

    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts
    });
  } catch (error) {
    console.error('Error fetching trending posts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trending posts',
      error: error.message
    });
  }
}; 