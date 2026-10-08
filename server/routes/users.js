const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

const ROLES = ['Admin', 'Sales Staff', 'Inventory Manager'];

module.exports = (pool) => {
  const logAction = (userId, action, recordId) =>
    pool.query(
      'INSERT INTO audit_logs (user_id, action, table_name, record_id) VALUES ($1, $2, $3, $4)',
      [userId, action, 'users', recordId]
    );

  // List all users (Admin only)
  router.get('/', authenticate, authorize('Admin'), async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT id, name, email, role, is_active, created_at FROM users ORDER BY id'
      );
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Change a user's role or active status (Admin only)
  router.patch('/:id', authenticate, authorize('Admin'), async (req, res) => {
    const { id } = req.params;
    const { role, is_active } = req.body;

    if (Number(id) === req.user.id) {
      return res.status(400).json({ error: 'You cannot change your own role or status' });
    }
    if (role === undefined && is_active === undefined) {
      return res.status(400).json({ error: 'Provide a role or is_active value' });
    }
    if (role !== undefined && !ROLES.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    try {
      const result = await pool.query(
        `UPDATE users
         SET role = COALESCE($1, role), is_active = COALESCE($2, is_active)
         WHERE id = $3
         RETURNING id, name, email, role, is_active`,
        [role ?? null, is_active ?? null, id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

      const action =
        is_active === false ? 'DEACTIVATE_USER' :
        is_active === true ? 'ACTIVATE_USER' : 'CHANGE_USER_ROLE';
      await logAction(req.user.id, action, id);
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  return router;
};