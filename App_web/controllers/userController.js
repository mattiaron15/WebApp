const User = require('../models/User');
const Post = require('../models/Post');
const axios = require('axios');
const config = require('../config/config');

// API base URL from config
const API_BASE_URL = config.API_BASE_URL;

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        bio: user.bio,
        profilePicture: user.profilePicture,
        followers: user.followers.length,
        following: user.following.length,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
  try {
    const { bio, profilePicture, username } = req.body;

    // Get token from auth header
    const token = req.headers.authorization?.split(' ')[1] || '';
    
    // Use the API to update profile
    const response = await axios.put(`${API_BASE_URL}/api/auth/profile`, 
      { bio, profilePicture, username },
      { 
        headers: {
          'x-auth-token': token
        }
      }
    );

    res.status(200).json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.msg || 'Error updating user profile',
      error: error.message
    });
  }
};

// Get user posts
exports.getUserPosts = async (req, res) => {
  try {
    console.log('getUserPosts called for user ID:', req.params.id);
    
    if (!req.params.id) {
      console.error('Missing user ID in request params');
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    // Log per debug avanzato
    console.log("DEBUGGING USER POSTS RETRIEVAL");
    console.log("User ID from params:", req.params.id);
    console.log("Type of ID:", typeof req.params.id);
    
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Inizializzo variabili per il risultato
    let targetUser = null;
    let userEmail = null;
    let allUserIds = [];
    
    // 1. Primo tentativo: cerca per ID direttamente
    targetUser = await User.findById(req.params.id);
    
    // 2. Se non trova l'utente, cerca qualsiasi utente che abbia lo stesso ID come stringa
    if (!targetUser) {
      console.log('User not found directly by ID, trying string comparison...');
      const allUsers = await User.find();
      for (const user of allUsers) {
        if (user._id.toString() === req.params.id) {
          targetUser = user;
          console.log('Found user by string ID comparison:', user.username, user._id);
          break;
        }
      }
    }
    
    // 3. Se ancora non trova l'utente, cerca l'utente dalla request
    if (!targetUser && req.user && req.user.email) {
      console.log('User not found by ID, searching by email from token:', req.user.email);
      targetUser = await User.findOne({ email: req.user.email });
      
      if (targetUser) {
        console.log('Found user via email from token:', targetUser.username, targetUser._id);
      }
    }
    
    // 4. Se ancora non trova l'utente, recupera tutti gli utenti e mostra i dettagli per debug
    if (!targetUser) {
      console.log('User still not found. Retrieving all users for debug:');
      const allUsers = await User.find().select('_id username email');
      
      console.log('All users in DB:', allUsers.map(u => ({
        id: u._id.toString(),
        username: u.username,
        email: u.email
      })));
      
      if (allUsers.length > 0) {
        // Come fallback, usa il primo utente trovato
        targetUser = allUsers[0];
        console.log('Using first user as fallback:', targetUser.username, targetUser._id);
      } else {
        console.log('No users found in the database at all!');
        return res.status(404).json({
          success: false,
          message: 'No users found in the database'
        });
      }
    }
    
    console.log('Selected target user:', targetUser.username, 'with email:', targetUser.email);
    userEmail = targetUser.email;
    
    // Cerca utenti con la stessa email (per gestire ID diversi ma stesso utente)
    const usersWithSameEmail = await User.find({ email: userEmail })
      .select('_id username email');
    
    allUserIds = usersWithSameEmail.map(user => user._id.toString());
    
    console.log('Found all IDs for this user email:', allUserIds);
    
    // Conta i post per tutti gli ID associati a questa email
    const totalPostsQuery = Post.countDocuments({ author: { $in: allUserIds } });
    
    // Ottieni i post paginati per tutti gli ID associati a questa email
    const postsQuery = Post.find({ author: { $in: allUserIds } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username profilePicture email');
    
    // Esegui entrambe le query in parallelo
    const [posts, totalPosts] = await Promise.all([postsQuery, totalPostsQuery]);
    
    console.log(`Found ${posts.length} posts for user IDs [${allUserIds.join(', ')}], total: ${totalPosts}`);
    
    // Log di alcuni post per debug
    if (posts.length > 0) {
      console.log('Sample post data:', {
        id: posts[0]._id,
        title: posts[0].title,
        authorId: posts[0].author._id,
        authorUsername: posts[0].author.username
      });
    }

    res.status(200).json({
      success: true,
      count: posts.length,
      totalPosts,
      totalPages: Math.ceil(totalPosts / limit),
      currentPage: page,
      data: posts
    });
  } catch (error) {
    console.error('Error in getUserPosts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user posts',
      error: error.message
    });
  }
};

// Follow or unfollow a user
exports.followUser = async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself'
      });
    }

    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already following
    const isFollowing = currentUser.following.includes(req.params.id);

    if (isFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(req.user.id, {
        $pull: { following: req.params.id }
      });
      await User.findByIdAndUpdate(req.params.id, {
        $pull: { followers: req.user.id }
      });

      // Get the updated user data
      const updatedUser = await User.findById(req.user.id).select('-password');

      res.status(200).json({
        success: true,
        message: 'User unfollowed',
        isFollowing: false,
        currentUserData: {
          followers: updatedUser.followers,
          following: updatedUser.following
        }
      });
    } else {
      // Follow
      await User.findByIdAndUpdate(req.user.id, {
        $push: { following: req.params.id }
      });
      await User.findByIdAndUpdate(req.params.id, {
        $push: { followers: req.user.id }
      });

      // Get the updated user data
      const updatedUser = await User.findById(req.user.id).select('-password');

      res.status(200).json({
        success: true,
        message: 'User followed',
        isFollowing: true,
        currentUserData: {
          followers: updatedUser.followers,
          following: updatedUser.following
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error following/unfollowing user',
      error: error.message
    });
  }
}; 