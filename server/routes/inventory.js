const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

module.exports = (pool) => {
  const logAction = (userId, action, tableName, recordId) =>
    pool.query(
      'INSERT INTO audit_logs (user_id, action, table_name, record_id) VALUES ($1, $2, $3, $4)',
      [userId, action, tableName, recordId]
    );

  // Get all products (any logged-in user can view)
  router.get('/', authenticate, async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM products ORDER BY name');
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Add a product (Admin or Inventory Manager)
  router.post('/', authenticate, authorize('Admin', 'Inventory Manager'), async (req, res) => {
    const { name, category, quantity, reorder_level, unit_price, supplier } = req.body;
    if (!name) return res.status(400).json({ error: 'Product name is required' });
    try {
      const result = await pool.query(
        `INSERT INTO products (name, category, quantity, reorder_level, unit_price, supplier)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [name, category, quantity || 0, reorder_level || 0, unit_price, supplier]
      );
      const product = result.rows[0];
      await logAction(req.user.id, 'CREATE_PRODUCT', 'products', product.id);
      res.status(201).json(product);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Update a product (Admin or Inventory Manager)
  router.put('/:id', authenticate, authorize('Admin', 'Inventory Manager'), async (req, res) => {
    const { id } = req.params;
    const { name, category, quantity, reorder_level, unit_price, supplier } = req.body;
    try {
      const result = await pool.query(
        `UPDATE products SET name=$1, category=$2, quantity=$3, reorder_level=$4,
         unit_price=$5, supplier=$6, updated_at=NOW() WHERE id=$7 RETURNING *`,
        [name, category, quantity, reorder_level, unit_price, supplier, id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
      await logAction(req.user.id, 'UPDATE_PRODUCT', 'products', id);
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Delete a product (Admin only)
  router.delete('/:id', authenticate, authorize('Admin'), async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query('DELETE FROM products WHERE id=$1 RETURNING id', [id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
      await logAction(req.user.id, 'DELETE_PRODUCT', 'products', id);
      res.json({ message: 'Product deleted' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  return router;
};