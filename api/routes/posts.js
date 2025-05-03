const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Post = require('../models/Post');
const User = require('../models/User');

// @route   POST /api/posts
// @desc    Crea un nuovo post
// @access  Private
router.post('/', auth, [
  check('title', 'Il titolo è obbligatorio').not().isEmpty(),
  check('title', 'Il titolo non può superare i 100 caratteri').isLength({ max: 100 }),
  check('content', 'Il contenuto è obbligatorio').not().isEmpty(),
  check('content', 'Il contenuto deve avere almeno 10 caratteri').isLength({ min: 10 }),
  check('image', 'L\'URL dell\'immagine non è valido').optional().isURL()
], async (req, res) => {
  // Validazione input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, content, image, tags } = req.body;

    // Crea nuovo post
    const post = new Post({
      title,
      content,
      author: req.user.id,
      image: image || '',
      tags: tags ? (typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()) : tags) : []
    });

    // Salva il post nel database
    await post.save();

    // Popola l'autore per la risposta
    await post.populate('author', 'username profilePicture');

    res.status(201).json(post);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Errore del server');
  }
});

// @route   GET /api/posts
// @desc    Ottieni tutti i post
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username profilePicture');

    const totalPosts = await Post.countDocuments();

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      totalPosts
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Errore del server');
  }
});

// @route   GET /api/posts/:id
// @desc    Ottieni un post per ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username profilePicture bio');

    if (!post) {
      return res.status(404).json({ msg: 'Post non trovato' });
    }
    
    // Incrementa il contatore delle visualizzazioni
    post.views += 1;
    await post.save();

    // Restituisci il post con formato simile a quello dell'app web
    res.json({
      _id: post._id,
      title: post.title,
      content: post.content,
      image: post.image,
      author: post.author,
      tags: post.tags,
      likes: post.likes,
      comments: post.comments,
      views: post.views,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post non trovato' });
    }
    res.status(500).send('Errore del server');
  }
});

// @route   PUT /api/posts/:id
// @desc    Update a post
// @access  Private
router.put('/:id', auth, [
  check('title', 'Il titolo è obbligatorio').not().isEmpty(),
  check('title', 'Il titolo non può superare i 100 caratteri').isLength({ max: 100 }),
  check('content', 'Il contenuto è obbligatorio').not().isEmpty(),
  check('content', 'Il contenuto deve avere almeno 10 caratteri').isLength({ min: 10 }),
  check('image', 'L\'URL dell\'immagine non è valido').optional().isURL()
], async (req, res) => {
  // Validazione input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    let post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Post non trovato' });
    }

    // Verifica che l'utente sia l'autore del post
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Non autorizzato a modificare questo post' });
    }

    const { title, content, image, tags } = req.body;

    // Aggiorna i campi del post
    post.title = title;
    post.content = content;
    post.image = image || '';
    post.tags = tags ? (typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()) : tags) : [];

    await post.save();

    // Popola i dati dell'autore
    await post.populate('author', 'username profilePicture');

    // Restituisci il post aggiornato
    res.json({
      _id: post._id,
      title: post.title,
      content: post.content,
      image: post.image,
      author: post.author,
      tags: post.tags,
      likes: post.likes,
      comments: post.comments,
      views: post.views,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post non trovato' });
    }
    res.status(500).send('Errore del server');
  }
});

// @route   PUT /api/posts/:id/like
// @desc    Like or unlike a post
// @access  Private
router.put('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Post non trovato' });
    }

    // Check if the post has already been liked by this user
    const isLiked = post.likes.map(like => like.toString()).includes(req.user.id);

    if (isLiked) {
      // Unlike the post
      post.likes = post.likes.filter(like => like.toString() !== req.user.id);
    } else {
      // Like the post
      post.likes.push(req.user.id);
    }

    await post.save();

    // Return the like status and updated likes array
    res.json({
      isLiked: !isLiked,
      likesCount: post.likes.length,
      likes: post.likes
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post non trovato' });
    }
    res.status(500).send('Errore del server');
  }
});

// @route   DELETE /api/posts/:id
// @desc    Delete a post
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Post non trovato' });
    }

    // Verifica che l'utente sia l'autore del post
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Non autorizzato a eliminare questo post' });
    }

    await post.deleteOne();

    res.json({ msg: 'Post eliminato con successo' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post non trovato' });
    }
    res.status(500).send('Errore del server');
  }
});

module.exports = router; 