const express = require('express');
const router = express.Router();

// Importa le rotte
const authRoutes = require('./auth');
const postRoutes = require('./posts');

// Definisci i prefissi delle rotte
router.use('/api/auth', authRoutes);
router.use('/api/posts', postRoutes);

module.exports = router;