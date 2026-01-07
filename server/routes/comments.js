const express = require('express');
const pool = require('../db.js');

const router = express.Router();

// Get all comments
router.get('/', async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM comments ORDER BY created_at DESC'
  );
  res.json(result.rows);
});

// Add a comment
router.post('/', async (req, res) => {
  const { content } = req.body;

  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'Empty comment' });
  }

  const result = await pool.query(
    'INSERT INTO comments (content) VALUES ($1) RETURNING *',
    [content]
  );

  res.json(result.rows[0]);
});

module.exports = router;
