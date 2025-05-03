const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

// Load environment variables
dotenv.config();

// Load configuration
const config = require('./config/config');

// Set default API URL
process.env.API_BASE_URL = config.API_BASE_URL;

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  // Join socket to room for specific post
  socket.on('join-post', (postId) => {
    socket.join(`post-${postId}`);
    console.log(`Socket ${socket.id} joined post-${postId}`);
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible to our route handlers
app.set('io', io);

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Import routes
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const userRoutes = require('./routes/users');
const commentRoutes = require('./routes/comments');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/comments', commentRoutes);

// Basic routes (frontend routes)
app.get('/', (req, res) => {
  res.render('index', { title: 'Home - Blog App' });
});

app.get('/about', (req, res) => {
  res.render('about', { title: 'About - Blog App' });
});

app.get('/explore', (req, res) => {
  const { query, tag, author } = req.query;
  res.render('explore', { 
    title: 'Explore - Blog App',
    query,
    tag,
    author
  });
});

app.get('/profile', (req, res) => {
  res.render('profile', { title: 'My Profile - Blog App' });
});

app.get('/login', (req, res) => {
  res.render('login', { title: 'Login - Blog App' });
});

app.get('/register', (req, res) => {
  res.render('register', { title: 'Register - Blog App' });
});

app.get('/create-post', (req, res) => {
  res.render('createPost', { title: 'Create Post - Blog App' });
});

app.get('/post/:id', (req, res) => {
  res.render('post', { title: 'Post - Blog App', postId: req.params.id });
});

// Error handling middleware
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.render('error', {
    title: 'Error',
    message: error.message,
    error: process.env.NODE_ENV === 'development' ? error : {}
  });
});

// Connect to MongoDB
const PORT = config.PORT;
const MONGO_URI = config.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
  });

module.exports = { app, server, io }; 