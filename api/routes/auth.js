const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route   POST /api/auth/register
// @desc    Registra un nuovo utente
// @access  Public
router.post('/register', [
  check('username', 'Username è obbligatorio').not().isEmpty(),
  check('email', 'Inserisci un indirizzo email valido').isEmail(),
  check('password', 'Inserisci una password con almeno 6 caratteri').isLength({ min: 6 })
], async (req, res) => {
  // Validazione input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password } = req.body;

  try {
    // Verifica se l'utente esiste già
    let userByEmail = await User.findOne({ email });
    if (userByEmail) {
      return res.status(400).json({ msg: 'Utente con questa email già esistente' });
    }

    let userByUsername = await User.findOne({ username });
    if (userByUsername) {
      return res.status(400).json({ msg: 'Username già in uso' });
    }

    // Crea nuovo utente
    const user = new User({
      username,
      email,
      password
    });

    // Cripta la password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Salva l'utente nel database
    await user.save();

    // Crea il payload JWT
    const payload = {
      user: {
        id: user.id
      }
    };

    // Genera il token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Errore del server');
  }
});

// @route   POST /api/auth/login
// @desc    Autentica utente e ottiene token
// @access  Public
router.post('/login', [
  check('email', 'Inserisci un indirizzo email valido').isEmail(),
  check('password', 'Password richiesta').exists()
], async (req, res) => {
  // Validazione input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Verifica se l'utente esiste
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Credenziali non valide' });
    }

    // Verifica la password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Credenziali non valide' });
    }

    // Crea il payload JWT
    const payload = {
      user: {
        id: user.id
      }
    };

    // Genera il token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Errore del server');
  }
});

// @route   GET /api/auth/me
// @desc    Ottieni informazioni utente
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    // Ottieni l'utente dal database (escludi la password)
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'Utente non trovato' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Errore del server');
  }
});

// @route   GET /api/auth/users
// @desc    Ottieni tutti gli utenti registrati
// @access  Private (solo admin)
router.get('/users', auth, async (req, res) => {
  try {
    // Verifica se l'utente è un amministratore
    const user = await User.findById(req.user.id);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ msg: 'Accesso negato: richiesti privilegi di amministratore' });
    }
    
    // Ottieni tutti gli utenti dal database (escludi le password)
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Errore del server');
  }
});

// @route   PUT /api/auth/users/:id/admin
// @desc    Aggiorna lo stato admin di un utente
// @access  Private (solo admin)
router.put('/users/:id/admin', auth, async (req, res) => {
  try {
    // Verifica se l'utente che fa la richiesta è un amministratore
    const requestingUser = await User.findById(req.user.id);
    if (!requestingUser || !requestingUser.isAdmin) {
      return res.status(403).json({ msg: 'Accesso negato: richiesti privilegi di amministratore' });
    }
    
    // Ottieni l'utente da aggiornare
    const userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate) {
      return res.status(404).json({ msg: 'Utente non trovato' });
    }
    
    // Aggiorna lo stato admin dell'utente (inverti il valore corrente)
    userToUpdate.isAdmin = !userToUpdate.isAdmin;
    
    // Salva le modifiche
    await userToUpdate.save();
    
    // Restituisci l'utente aggiornato (senza la password)
    res.json({
      _id: userToUpdate._id,
      username: userToUpdate.username,
      email: userToUpdate.email,
      isAdmin: userToUpdate.isAdmin,
      createdAt: userToUpdate.createdAt
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'ID utente non valido' });
    }
    res.status(500).send('Errore del server');
  }
});

// @route   POST /api/auth/reset-password
// @desc    Cambia la password di un utente
// @access  Public
router.post('/reset-password', [
  check('email', 'Inserisci un indirizzo email valido').isEmail(),
  check('oldPassword', 'Password attuale richiesta').exists(),
  check('newPassword', 'Inserisci una nuova password con almeno 6 caratteri').isLength({ min: 6 })
], async (req, res) => {
  // Validazione input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, oldPassword, newPassword } = req.body;

  try {
    // Verifica se l'utente esiste
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Utente non trovato' });
    }

    // Verifica la vecchia password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Password attuale non corretta' });
    }

    // Cripta la nuova password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Salva l'utente con la nuova password
    await user.save();

    res.json({ msg: 'Password aggiornata con successo' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Errore del server');
  }
});

// @route   PUT /api/auth/profile
// @desc    Aggiorna il profilo utente
// @access  Private
router.put('/profile', auth, [
  check('bio', 'Bio non può superare i 500 caratteri').optional().isLength({ max: 500 }),
  check('profilePicture', 'URL non valido per l\'immagine del profilo').optional().isURL()
], async (req, res) => {
  // Validazione input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Ottieni l'utente dal database
    let user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'Utente non trovato' });
    }

    // Campi che possono essere aggiornati
    const { bio, profilePicture, username } = req.body;

    // Verifica se username esiste già (se viene fornito)
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ msg: 'Username già in uso' });
      }
      user.username = username;
    }

    // Aggiorna i campi se forniti
    if (bio !== undefined) user.bio = bio;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    // Salva le modifiche
    await user.save();

    // Invia la risposta senza la password
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      bio: user.bio,
      profilePicture: user.profilePicture,
      isAdmin: user.isAdmin,
      followers: user.followers,
      following: user.following,
      createdAt: user.createdAt
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'ID utente non valido' });
    }
    res.status(500).send('Errore del server');
  }
});

// @route   PUT /api/auth/change-password
// @desc    Cambia la password dell'utente autenticato
// @access  Private
router.put('/change-password', auth, [
  check('currentPassword', 'Password attuale richiesta').exists(),
  check('newPassword', 'Inserisci una nuova password con almeno 6 caratteri').isLength({ min: 6 })
], async (req, res) => {
  // Validazione input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { currentPassword, newPassword } = req.body;

  try {
    // Ottieni l'utente dal database (con password)
    let user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'Utente non trovato' });
    }

    // Verifica la password attuale
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ msg: 'Password attuale non corretta' });
    }

    // Cripta la nuova password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Salva l'utente con la nuova password
    await user.save();

    res.json({ msg: 'Password aggiornata con successo' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Errore del server');
  }
});

module.exports = router;