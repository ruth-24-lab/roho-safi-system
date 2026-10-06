import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState([]);
  const [error, setError] = useState('');

  const headers = { Authorization: `Bearer ${token}` };

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const lowStock = products.filter((p) => p.quantity <= p.reorder_level);
  const totalBudgetRemaining = categories.reduce((sum, c) => sum + parseFloat(c.remaining), 0);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Roho Safi Dashboard</h1>
        <div>
          <span style={{ marginRight: '1rem' }}>{user?.name} ({user?.role})</span>
          <button onClick={handleLogout}>Log Out</button>
        </div>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '2rem' }}>
        <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1rem' }}>
          <h3>Total Products</h3>
          <p style={{ fontSize: '2rem', margin: 0 }}>{products.length}</p>
        </div>
        <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1rem' }}>
          <h3>Low Stock Items</h3>
          <p style={{ fontSize: '2rem', margin: 0, color: lowStock.length > 0 ? 'red' : 'inherit' }}>
            {lowStock.length}
          </p>
        </div>
        <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1rem' }}>
          <h3>Budget Remaining</h3>
          <p style={{ fontSize: '2rem', margin: 0 }}>KES {totalBudgetRemaining.toFixed(2)}</p>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h2>⚠️ Stock Shortage Alerts</h2>
          <ul>
            {lowStock.map((p) => (
              <li key={p.id}>
                {p.name} — only {p.quantity} left (reorder level: {p.reorder_level})
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ marginTop: '2rem' }}>
        <h2>Budget Categories</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Category</th>
              <th style={{ textAlign: 'right', borderBottom: '1px solid #ccc' }}>Allocated</th>
              <th style={{ textAlign: 'right', borderBottom: '1px solid #ccc' }}>Spent</th>
              <th style={{ textAlign: 'right', borderBottom: '1px solid #ccc' }}>Remaining</th>
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
      </div>

      {user?.role === 'Admin' && summary.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h2>Staff Activity (Audit Summary)</h2>
          <ul>
            {summary.map((s) => (
              <li key={s.id}>{s.name} ({s.role}) — {s.action_count} actions</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default Dashboard;