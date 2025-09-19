const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/authMiddleware');


router.post('/register', async (req, res) => {
  const { username, email, password, name } = req.body;
  try {
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const user = new User({ username, email, password: hash, name });
    await user.save();

   
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    res.json({
      message: 'User created successfully',
      token,             
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
      }
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});


router.post('/login', async (req,res)=>{
  const { usernameOrEmail, password } = req.body;
  try {
    const user = await User.findOne({ $or: [{ email: usernameOrEmail }, { username: usernameOrEmail }] });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    res.json({ token });
  } catch(e){ res.status(500).json({ message: e.message }) }
});


router.get('/me', authMiddleware, async (req,res)=>{
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
});



module.exports = router;
