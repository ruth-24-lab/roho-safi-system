const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');

module.exports = (pool) => {
  const router = express.Router();
  router.use(authenticate);

  // Who can do what:
  // IN  (restock)  -> Admin, Inventory Manager
  // OUT (sale/loss) -> Admin, Inventory Manager, Sales Staff
  router.post('/', async (req, res) => {
    const { product_id, movement_type, quantity, note } = req.body;
    const qty = parseInt(quantity, 10);

    if (!['IN', 'OUT'].includes(movement_type))
      return res.status(400).json({ message: 'movement_type must be IN or OUT' });
    if (!product_id || !qty || qty <= 0)
      return res.status(400).json({ message: 'product_id and a positive quantity are required' });

    const allowed = movement_type === 'IN'
      ? ['Admin', 'Inventory Manager']
      : ['Admin', 'Inventory Manager', 'Sales Staff'];
    if (!allowed.includes(req.user.role))
      return res.status(403).json({ message: 'You do not have permission to do this' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const p = await client.query('SELECT quantity FROM products WHERE id = $1 FOR UPDATE', [product_id]);
      if (p.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Product not found' });
      }
      const newQty = movement_type === 'IN' ? p.rows[0].quantity + qty : p.rows[0].quantity - qty;
      if (newQty < 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: `Not enough stock. Only ${p.rows[0].quantity} available.` });
      }
      await client.query('UPDATE products SET quantity = $1 WHERE id = $2', [newQty, product_id]);
      const m = await client.query(
        `INSERT INTO stock_movements (product_id, user_id, movement_type, quantity, note)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [product_id, req.user.id, movement_type, qty, note || null]
      );
      await client.query(
        'INSERT INTO audit_logs (user_id, action, table_name, record_id) VALUES ($1,$2,$3,$4)',
        [req.user.id, `STOCK_${movement_type}`, 'stock_movements', m.rows[0].id]
      );
      await client.query('COMMIT');
      res.status(201).json({ movement: m.rows[0], new_quantity: newQty });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    } finally {
      client.release();
    }
  });

  // History (any logged-in user), optional ?product_id=
  router.get('/', async (req, res) => {
    try {
      const params = [];
      let where = '';
      if (req.query.product_id) { params.push(req.query.product_id); where = 'WHERE m.product_id = $1'; }
      const r = await pool.query(
        `SELECT m.*, p.name AS product_name, u.name AS user_name
         FROM stock_movements m
         JOIN products p ON p.id = m.product_id
         JOIN users u ON u.id = m.user_id
         ${where} ORDER BY m.created_at DESC LIMIT 100`, params);
      res.json(r.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  return router;
};