require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

const authRoutes = require('./routes/auth');
const inventoryRoutes = require('./routes/inventory');
const budgetRoutes = require('./routes/budget');
const auditRoutes = require('./routes/audit');

// Test route
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', dbTime: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.use('/api/auth', authRoutes(pool));
app.use('/api/products', inventoryRoutes(pool));
app.use('/api/budget', budgetRoutes(pool));
app.use('/api/audit', auditRoutes(pool));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});