const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

const ROLES = ['Admin', 'Sales Staff', 'Inventory Manager'];

module.exports = (pool) => {
  const logAction = (userId, action, recordId) =>
    pool.query(
      'INSERT INTO audit_logs (user_id, action, table_name, record_id) VALUES ($1, $2, $3, $4)',
      [userId, action, 'users', recordId]
    );

  // Register (Admin only)
  router.post('/register', authenticate, authorize('Admin'), async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !ROLES.includes(role)) {
      return res.status(400).json({ error: 'Name, email, password and a valid role are required' });
    }
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await pool.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
        [name, email, hashedPassword, role]
      );
      const user = result.rows[0];
      await logAction(req.user.id, 'CREATE_USER', user.id);
      res.status(201).json(user);
    } catch (err) {
      if (err.code === '23505') {
        return res.status(409).json({ error: 'Email already registered' });
      }
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Login
  router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      const user = result.rows[0];
      if (!user || !user.is_active || !(await bcrypt.compare(password, user.password_hash))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );
      await logAction(user.id, 'LOGIN', user.id);
      res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Who am I (any logged-in user)
  router.get('/me', authenticate, (req, res) => {
    res.json(req.user);
  });

  return router;
};