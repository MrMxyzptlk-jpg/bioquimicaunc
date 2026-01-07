const express = require('express');
const pool = require('../db.js');
const router = express.Router();

/* Get comments for a specific post */
router.get('/:postId', async (req, res) => {
  const { postId } = req.params;

  const result = await pool.query(
    'SELECT * FROM comments WHERE post_id = $1 ORDER BY created_at ASC',
    [postId]
  );

  res.json(result.rows);
});

/* Add comment to a post */
router.post('/', async (req, res) => {
  const { content, post_id } = req.body;

  if (!content || !post_id) {
    return res.status(400).json({ error: 'Missing data' });
  }

  const result = await pool.query(
    'INSERT INTO comments (content, post_id) VALUES ($1, $2) RETURNING *',
    [content, post_id]
  );

  res.json(result.rows[0]);
});

module.exports = router;
