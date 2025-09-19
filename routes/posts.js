const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const auth = require('../middleware/authMiddleware');

// Create a post
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, linkedPost } = req.body;
    const post = new Post({
      title,
      content,
      author: req.user.id,
      linkedPost: linkedPost || null,
    });
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all posts
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'username name')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Like / Unlike 
router.post('/like', auth, async (req, res) => {
  try {
    const { postId } = req.body;
    if (!postId) return res.status(400).json({ message: 'postId is required' });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const uid = req.user.id;
    const idx = post.likedBy.indexOf(uid);

    if (idx === -1) {
      post.likedBy.push(uid);
    } else {
      post.likedBy.splice(idx, 1);
    }

    post.likes = post.likedBy.length;
    await post.save();

    res.json({ likes: post.likes, likedBy: post.likedBy });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//comment 
router.post('/comment', auth, async (req, res) => {
  try {
    const { postId, text } = req.body;
    if (!postId || !text) return res.status(400).json({ message: 'postId and text are required' });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = new Comment({
      author: req.user.id,
      post: post._id,
      text,
    });

    await comment.save();
    post.comments.push(comment._id);
    await post.save();

    const populated = await Comment.findById(comment._id).populate('author', 'username name');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
