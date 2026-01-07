const express = require('express');
const cors = require('cors');
const path = require('path');
const commentsRoutes = require('./routes/comments');
const postsRoutes = require('./routes/posts');
const app = express();

app.use(cors());
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, '../docs')));

// API routes
app.use('/api/comments', commentsRoutes);
app.use('/api/posts', postsRoutes);


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
