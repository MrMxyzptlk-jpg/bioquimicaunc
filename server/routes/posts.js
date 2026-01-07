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

// Delete post
const { ADMIN_KEY } = require('../config');
router.delete('/:id', async (req, res) => {
  if (req.headers['x-admin-key'] !== ADMIN_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { id } = req.params;

  await pool.query(
    'UPDATE posts SET deleted = true WHERE id = $1',
    [id]
  );

  res.json({ success: true });
});

module.exports = router;
