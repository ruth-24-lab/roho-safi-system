const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

module.exports = (pool) => {
  // View audit log (Admin only) - supports optional filters
  router.get('/', authenticate, authorize('Admin'), async (req, res) => {
    const { user_id, action, table_name, from_date, to_date } = req.query;

    let query = `
      SELECT al.id, al.user_id, u.name AS user_name, al.action,
             al.table_name, al.record_id, al.details, al.created_at
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      WHERE 1=1
    `;
    const params = [];

    if (user_id) {
      params.push(user_id);
      query += ` AND al.user_id = $${params.length}`;
    }
    if (action) {
      params.push(action);
      query += ` AND al.action = $${params.length}`;
    }
    if (table_name) {
      params.push(table_name);
      query += ` AND al.table_name = $${params.length}`;
    }
    if (from_date) {
      params.push(from_date);
      query += ` AND al.created_at >= $${params.length}`;
    }
    if (to_date) {
      params.push(to_date);
      query += ` AND al.created_at <= $${params.length}`;
    }

    query += ` ORDER BY al.created_at DESC LIMIT 100`;

    try {
      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Summary: count of actions per user (Admin only)
  router.get('/summary', authenticate, authorize('Admin'), async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT u.id, u.name, u.role, COUNT(al.id) AS action_count
        FROM users u
        LEFT JOIN audit_logs al ON al.user_id = u.id
        GROUP BY u.id
        ORDER BY action_count DESC
      `);
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  return router;
};