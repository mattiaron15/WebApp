/**
 * Application Configuration
 * 
 * This file contains application configuration settings.
 * It serves as an alternative to using environment variables directly.
 */

const config = {
  // Server configuration
  PORT: process.env.PORT || 3000,
  
  // Database configuration
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/blog-app',
  
  // API configuration
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:8080',
  
  // Authentication configuration
  JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret_key'
};

module.exports = config; 