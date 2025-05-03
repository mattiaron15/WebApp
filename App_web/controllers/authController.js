const axios = require('axios');
const config = require('../config/config');
const User = require('../models/User');

// API base URL from config
const API_BASE_URL = config.API_BASE_URL;

// Register a new user
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Forward the registration request to the API
    const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
      username,
      email,
      password
    });

    // Return the response from the API
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.msg || 'Error in user registration',
      errors: error.response?.data?.errors || []
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Forward the login request to the API
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email,
      password
    });

    // Return the response from the API
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.msg || 'Error in user login',
      errors: error.response?.data?.errors || []
    });
  }
};

// Get current user profile
exports.getMe = async (req, res) => {
  try {
    console.log('getMe called with token:', req.headers.authorization?.split(' ')[1]?.substring(0, 10) + '...');
    
    // Forward the request to the API with the token
    const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
      headers: {
        'x-auth-token': req.headers.authorization?.split(' ')[1] || ''
      }
    });

    // Get local user data to include correct followers/following
    const apiUserData = response.data;
    console.log('API user data received:', apiUserData._id || apiUserData.id);
    
    // Try to find user in local DB based on ID from API
    const localUser = await User.findOne({ 
      $or: [
        { _id: apiUserData._id },
        { email: apiUserData.email }
      ]
    }).select('-password');
    
    if (localUser) {
      console.log('Local user data found:', localUser._id);
      console.log('Local user isAdmin status:', localUser.isAdmin);
      
      // Combine data, giving preference to API data but using local data for followers/following and isAdmin
      const userData = {
        ...apiUserData,
        followers: localUser.followers || [],
        following: localUser.following || [],
        isAdmin: localUser.isAdmin || false  // Includi lo stato di admin dal database locale
      };
      
      console.log('Combined user data with followers:', userData.followers.length, 'following:', userData.following.length, 'isAdmin:', userData.isAdmin);
      
      // Format the response to match the existing structure
      res.status(200).json({
        success: true,
        user: userData
      });
    } else {
      console.log('No local user found, returning API data only');
      // Just return API data if no local user found
      res.status(200).json({
        success: true,
        user: apiUserData
      });
    }
  } catch (error) {
    console.error('Error in getMe:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.msg || 'Error getting user profile',
    });
  }
};

// Update current user profile
exports.updateProfile = async (req, res) => {
  try {
    const { bio, profilePicture, username } = req.body;
    
    // Get token from auth header
    const token = req.headers.authorization?.split(' ')[1] || '';
    
    // Forward to the API
    const response = await axios.put(`${API_BASE_URL}/api/auth/profile`, 
      { bio, profilePicture, username },
      { 
        headers: {
          'x-auth-token': token
        }
      }
    );

    // Return success response
    res.status(200).json({
      success: true,
      user: response.data
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

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }
    
    // Get token from auth header
    const token = req.headers.authorization?.split(' ')[1] || req.headers['x-auth-token'] || '';
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is required'
      });
    }
    
    // Forward the request to the API
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/auth/change-password`,
        { currentPassword, newPassword },
        { headers: { 'x-auth-token': token } }
      );
      
      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (apiError) {
      console.error('API error during password change:', apiError.response?.data || apiError.message);
      
      // Handle specific API errors
      if (apiError.response?.status === 401) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
      
      return res.status(apiError.response?.status || 500).json({
        success: false,
        message: apiError.response?.data?.msg || 'Error changing password'
      });
    }
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while changing password'
    });
  }
}; 