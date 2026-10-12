const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');

module.exports = (pool) => {
  const router = express.Router();
  router.use(authenticate);

  const audit = (userId, action, id) =>
    pool.query(
      'INSERT INTO audit_logs (user_id, action, table_name, record_id) VALUES ($1,$2,$3,$4)',
      [userId, action, 'suppliers', id]
    );

  // List (any logged-in user), with how many products use each supplier
  router.get('/', async (req, res) => {
    try {
      const r = await pool.query(
        `SELECT s.*, COUNT(p.id)::int AS product_count
         FROM suppliers s
         LEFT JOIN products p ON LOWER(TRIM(p.supplier)) = LOWER(TRIM(s.name))
         GROUP BY s.id
         ORDER BY s.name`
      );
      res.json(r.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Add (Admin, Inventory Manager)
  router.post('/', authorize('Admin', 'Inventory Manager'), async (req, res) => {
    const { name, contact_person, phone, email, location, notes } = req.body;
    if (!name || !name.trim())
      return res.status(400).json({ message: 'Supplier name is required' });
    try {
      const r = await pool.query(
        `INSERT INTO suppliers (name, contact_person, phone, email, location, notes)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [name.trim(), contact_person || null, phone || null, email || null, location || null, notes || null]
      );
      await audit(req.user.id, 'CREATE_SUPPLIER', r.rows[0].id);
      res.status(201).json(r.rows[0]);
    } catch (err) {
      if (err.code === '23505')
        return res.status(400).json({ message: 'A supplier with this name already exists' });
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Edit (Admin, Inventory Manager)
  router.put('/:id', authorize('Admin', 'Inventory Manager'), async (req, res) => {
    const { name, contact_person, phone, email, location, notes } = req.body;
    if (!name || !name.trim())
      return res.status(400).json({ message: 'Supplier name is required' });
    try {
      const r = await pool.query(
        `UPDATE suppliers
         SET name=$1, contact_person=$2, phone=$3, email=$4, location=$5, notes=$6
         WHERE id=$7 RETURNING *`,
        [name.trim(), contact_person || null, phone || null, email || null, location || null, notes || null, req.params.id]
      );
      if (r.rows.length === 0) return res.status(404).json({ message: 'Supplier not found' });
      await audit(req.user.id, 'UPDATE_SUPPLIER', r.rows[0].id);
      res.json(r.rows[0]);
    } catch (err) {
      if (err.code === '23505')
        return res.status(400).json({ message: 'A supplier with this name already exists' });
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Delete (Admin only), blocked while products still use the supplier
  router.delete('/:id', authorize('Admin'), async (req, res) => {
    try {
      const s = await pool.query('SELECT name FROM suppliers WHERE id=$1', [req.params.id]);
      if (s.rows.length === 0) return res.status(404).json({ message: 'Supplier not found' });
      const used = await pool.query(
        'SELECT COUNT(*)::int AS n FROM products WHERE LOWER(TRIM(supplier)) = LOWER(TRIM($1))',
        [s.rows[0].name]
      );
      if (used.rows[0].n > 0)
        return res.status(400).json({
          message: `Cannot delete: ${used.rows[0].n} product(s) still use this supplier`,
        });
      await pool.query('DELETE FROM suppliers WHERE id=$1', [req.params.id]);
      await audit(req.user.id, 'DELETE_SUPPLIER', Number(req.params.id));
      res.json({ message: 'Supplier deleted' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  return router;
};