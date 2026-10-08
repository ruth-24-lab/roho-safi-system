import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

function Dashboard() {
  const { token, user } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsRes = await axios.get('http://localhost:5000/api/products', { headers });
        setProducts(productsRes.data);

        const categoriesRes = await axios.get('http://localhost:5000/api/budget/categories', { headers });
        setCategories(categoriesRes.data);

        if (user?.role === 'Admin') {
          const summaryRes = await axios.get('http://localhost:5000/api/audit/summary', { headers });
          setSummary(summaryRes.data);
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load dashboard data');
      }
    };
    fetchData();
  }, []);

  const lowStock = products.filter((p) => p.quantity <= p.reorder_level);
  const totalBudgetRemaining = categories.reduce((sum, c) => sum + parseFloat(c.remaining), 0);

  return (
    <Layout>
      <h1>Dashboard</h1>
      {error && <p className="error-text">{error}</p>}

      <div className="card-grid">
        <div className="card">
          <h3>Total Products</h3>
          <p className="stat-number">{products.length}</p>
        </div>
        <div className="card">
          <h3>Low Stock Items</h3>
          <p className={`stat-number ${lowStock.length > 0 ? 'alert' : ''}`}>{lowStock.length}</p>
        </div>
        <div className="card">
          <h3>Budget Remaining</h3>
          <p className="stat-number">KES {totalBudgetRemaining.toFixed(2)}</p>
        </div>
      </div>

      {lowStock.length > 0 && (
        <>
          <h2>⚠️ Stock Shortage Alerts</h2>
          <ul>
            {lowStock.map((p) => (
              <li key={p.id}>
                {p.name} — only {p.quantity} left (reorder level: {p.reorder_level})
              </li>
            ))}
          </ul>
        </>
      )}

      <h2>Budget Categories</h2>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th style={{ textAlign: 'right' }}>Allocated</th>
            <th style={{ textAlign: 'right' }}>Spent</th>
            <th style={{ textAlign: 'right' }}>Remaining</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td style={{ textAlign: 'right' }}>{c.allocated_amount}</td>
              <td style={{ textAlign: 'right' }}>{c.spent}</td>
              <td style={{ textAlign: 'right' }}>{c.remaining}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {user?.role === 'Admin' && summary.length > 0 && (
        <>
          <h2>Staff Activity (Audit Summary)</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.role}</td>
                  <td style={{ textAlign: 'right' }}>{s.action_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </Layout>
  );
}

export default Dashboard;