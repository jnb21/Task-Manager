const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET, requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { email, username, password } = req.body;
  if (!email || !username || !password)
    return res.status(400).json({ error: 'Email, username, and password are required' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  if (username.trim().length < 2)
    return res.status(400).json({ error: 'Username must be at least 2 characters' });

  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await db.execute({
      sql: 'INSERT INTO users (email, username, password) VALUES (?, ?, ?)',
      args: [email.toLowerCase().trim(), username.trim(), hash],
    });
    const user = {
      id: Number(result.lastInsertRowid),
      email: email.toLowerCase().trim(),
      username: username.trim(),
    };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user });
  } catch (err) {
    if (err.message?.includes('UNIQUE constraint failed'))
      return res.status(409).json({ error: 'Email or username already taken' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });

  try {
    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [email.toLowerCase().trim()],
    });
    const row = result.rows[0];
    if (!row) return res.status(401).json({ error: 'Invalid email or password' });

    const match = await bcrypt.compare(password, String(row.password));
    if (!match) return res.status(401).json({ error: 'Invalid email or password' });

    const user = { id: Number(row.id), email: row.email, username: row.username };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT id, email, username FROM users WHERE id = ?',
      args: [req.user.id],
    });
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'User not found' });
    res.json({ user: { id: Number(row.id), email: row.email, username: row.username } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
