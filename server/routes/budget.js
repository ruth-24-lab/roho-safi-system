const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

module.exports = (pool) => {
  const logAction = (userId, action, tableName, recordId) =>
    pool.query(
      'INSERT INTO audit_logs (user_id, action, table_name, record_id) VALUES ($1, $2, $3, $4)',
      [userId, action, tableName, recordId]
    );

  // Get all budget categories with actual spend calculated
  router.get('/categories', authenticate, async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          bc.id, bc.name, bc.allocated_amount, bc.period_start, bc.period_end,
          COALESCE(SUM(e.amount), 0) AS spent,
          bc.allocated_amount - COALESCE(SUM(e.amount), 0) AS remaining
        FROM budget_categories bc
        LEFT JOIN expenditures e ON e.category_id = bc.id
        GROUP BY bc.id
        ORDER BY bc.name
      `);
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Create a budget category (Admin only)
  router.post('/categories', authenticate, authorize('Admin'), async (req, res) => {
    const { name, allocated_amount, period_start, period_end } = req.body;
    if (!name || !allocated_amount || !period_start || !period_end) {
      return res.status(400).json({ error: 'Name, allocated amount, period start and end are required' });
    }
    try {
      const result = await pool.query(
        `INSERT INTO budget_categories (name, allocated_amount, period_start, period_end)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [name, allocated_amount, period_start, period_end]
      );
      const category = result.rows[0];
      await logAction(req.user.id, 'CREATE_BUDGET_CATEGORY', 'budget_categories', category.id);
      res.status(201).json(category);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Record an expenditure (Admin only)
  router.post('/expenditures', authenticate, authorize('Admin'), async (req, res) => {
    const { category_id, amount, description } = req.body;
    if (!category_id || !amount) {
      return res.status(400).json({ error: 'Category and amount are required' });
    }
    try {
      const result = await pool.query(
        `INSERT INTO expenditures (category_id, amount, description, user_id)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [category_id, amount, description, req.user.id]
      );
      const expenditure = result.rows[0];
      await logAction(req.user.id, 'CREATE_EXPENDITURE', 'expenditures', expenditure.id);
      res.status(201).json(expenditure);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Get all expenditures (any logged-in user can view)
  router.get('/expenditures', authenticate, async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT e.*, bc.name AS category_name
        FROM expenditures e
        JOIN budget_categories bc ON bc.id = e.category_id
        ORDER BY e.created_at DESC
      `);
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  return router;
};