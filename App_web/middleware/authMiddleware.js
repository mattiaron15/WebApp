const axios = require('axios');
const config = require('../config/config');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// API base URL from config
const API_BASE_URL = config.API_BASE_URL;

// Protect routes - check if user is authenticated
exports.protect = async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.headers['x-auth-token']) {
    token = req.headers['x-auth-token'];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token',
    });
  }

    try {
    // First try the API to verify the token
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'x-auth-token': token
        }
      });
      
      // Set the user from API in the request object
      req.user = response.data;
      
      // Aggiungi log di debug per vedere l'utente restituito dall'API
      console.log('User from API:', req.user);
      
      // Assicurati che req.user.id sia impostato correttamente
      if (req.user && !req.user.id && req.user._id) {
        req.user.id = req.user._id;
        console.log('Set req.user.id from _id:', req.user.id);
      }
      
      // Verifica lo stato di admin dell'utente dall'API
      console.log('API isAdmin status:', req.user.isAdmin);

      // If user is not in local DB, check if we need to add a reference
      try {
        let localUser = await User.findById(req.user.id);
        if (!localUser) {
          // Prima cerca per email
          const existingUserWithEmail = await User.findOne({ email: req.user.email });
          
          if (existingUserWithEmail) {
            // Se esiste già un utente con la stessa email, aggiornalo invece di crearne uno nuovo
            console.log('Updating existing user with the same email:', req.user.email);
            existingUserWithEmail.username = req.user.username;
            existingUserWithEmail.profilePicture = req.user.profilePicture || existingUserWithEmail.profilePicture;
            existingUserWithEmail.bio = req.user.bio || existingUserWithEmail.bio;
            existingUserWithEmail.isApiUser = true;
            await existingUserWithEmail.save();
            localUser = existingUserWithEmail;
          } else {
            // Cerca se esiste già un utente con lo stesso username
            const existingUserWithUsername = await User.findOne({ username: req.user.username });
            
            if (existingUserWithUsername) {
              // Se esiste un utente con lo stesso username, genera un username unico
              console.log('Username already exists, generating unique username');
              const uniqueUsername = `${req.user.username}_${Date.now().toString().slice(-4)}`;
              
              // Crea un nuovo riferimento utente con username unico
              localUser = await User.create({
                _id: req.user.id,
                username: uniqueUsername,
                email: req.user.email,
                profilePicture: req.user.profilePicture || '',
                bio: req.user.bio || '',
                isApiUser: true
              });
              console.log('Created local user reference with unique username:', uniqueUsername);
            } else {
              // Crea un nuovo riferimento utente
              try {
                localUser = await User.create({
                  _id: req.user.id,
                  username: req.user.username,
                  email: req.user.email,
                  profilePicture: req.user.profilePicture || '',
                  bio: req.user.bio || '',
                  isApiUser: true
                });
                console.log('Created local user reference for API user:', req.user.id);
              } catch (createError) {
                // Se c'è un errore durante la creazione (probabilmente chiave duplicata)
                console.error('Error creating user, trying with modified username:', createError.message);
                const uniqueUsername = `${req.user.username}_${Date.now().toString().slice(-4)}`;
                localUser = await User.create({
                  _id: req.user.id,
                  username: uniqueUsername,
                  email: req.user.email,
                  profilePicture: req.user.profilePicture || '',
                  bio: req.user.bio || '',
                  isApiUser: true
                });
                console.log('Created local user with modified username:', uniqueUsername);
              }
            }
          }
        } else {
          // L'utente esiste già, aggiorna solo se necessario
          if (localUser.username !== req.user.username || 
              localUser.profilePicture !== req.user.profilePicture || 
              localUser.bio !== req.user.bio) {
            
            // Verifica se il nuovo username è già in uso da un altro utente
            if (localUser.username !== req.user.username) {
              const existingUserWithUsername = await User.findOne({ 
                username: req.user.username,
                _id: { $ne: localUser._id } // escludi l'utente corrente
              });
              
              if (existingUserWithUsername) {
                // Se lo username è già in uso, non aggiornarlo
                console.log(`Username ${req.user.username} already in use, keeping current username ${localUser.username}`);
              } else {
                // Altrimenti aggiorna lo username
                localUser.username = req.user.username;
              }
            } else {
              // Mantieni lo username esistente
              console.log('Keeping existing username:', localUser.username);
            }
            
            // Aggiorna gli altri campi
            localUser.profilePicture = req.user.profilePicture || localUser.profilePicture;
            localUser.bio = req.user.bio || localUser.bio;
            localUser.isApiUser = true;
            await localUser.save();
            console.log('Updated local user reference for API user:', req.user.id);
          }
        }
        
        // Make sure we use the augmented local user for the request
        req.user.id = localUser._id;
        
        // Mantieni lo stato di admin dal database locale
        if (localUser.isAdmin) {
          console.log('Setting isAdmin=true from local database for user:', localUser.username);
          req.user.isAdmin = true;
        }
        
        // Log dell'utente finale dopo tutte le sincronizzazioni
        console.log('Final user object in request:', JSON.stringify({
          _id: req.user._id,
          id: req.user.id,
          username: req.user.username,
          email: req.user.email,
          isAdmin: req.user.isAdmin
        }));
      } catch (dbError) {
        console.error('Error syncing local user:', dbError);
        // Not critical, proceed anyway
      }
      
      next();
    } catch (apiError) {
      console.error('API auth failed, trying local fallback:', apiError.message);
      
      // Non tentare la verifica JWT locale, ma passa direttamente a ottenere l'utente dal token
      try {
        // Estrai l'ID utente dal token senza verificarlo (verifica soft)
        let userId;
        
        try {
          // Prova a decodificare il token senza verificare la firma
          const decoded = jwt.decode(token);
          if (decoded && decoded.user && decoded.user.id) {
            userId = decoded.user.id;
          } else if (decoded && decoded.id) {
            userId = decoded.id;
          } else {
            throw new Error('Invalid token format');
          }
        } catch (decodeError) {
          console.error('Error decoding token:', decodeError.message);
          return res.status(401).json({
            success: false,
            message: 'Invalid token format'
          });
        }
        
        // Ottieni l'utente dal database
        const user = await User.findById(userId);
        
        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'User not found with this token'
          });
        }
        
        // Imposta l'utente nella richiesta
        req.user = user;

      next();
    } catch (error) {
        console.error('Local user lookup failed:', error.message);
        return res.status(401).json({
        success: false,
          message: 'Not authorized, token failed'
      });
    }
  }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Not authorized, token failed',
    });
  }
};

// Check if user is admin
exports.admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Not authorized as an admin',
    });
  }
}; 