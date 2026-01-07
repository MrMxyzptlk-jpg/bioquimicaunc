const express = require('express');
const pool = require('../db.js');
const router = express.Router();

// Get all posts
router.get('/', async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM posts ORDER BY created_at DESC'
  );
  res.json(result.rows);
});

// Create post
router.post('/', async (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Missing data' });
  }

  const result = await pool.query(
    'INSERT INTO posts (title, content) VALUES ($1, $2) RETURNING *',
    [title, content]
  );

  res.json(result.rows[0]);
});

module.exports = router;
