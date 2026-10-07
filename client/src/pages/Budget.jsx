import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

function Budget() {
  const { token, user } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };
  const isAdmin = user?.role === 'Admin';

  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');

  const [catForm, setCatForm] = useState({
    name: '', allocated_amount: '', period_start: '', period_end: '',
  });

  const [expForm, setExpForm] = useState({
    category_id: '', amount: '', description: '',
  });

  const fetchCategories = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/budget/categories', { headers });
      setCategories(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load budget categories');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCatSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post('http://localhost:5000/api/budget/categories', catForm, { headers });
      setCatForm({ name: '', allocated_amount: '', period_start: '', period_end: '' });
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create category');
    }
  };

  const handleExpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post('http://localhost:5000/api/budget/expenditures', expForm, { headers });
      setExpForm({ category_id: '', amount: '', description: '' });
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record expenditure');
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto' }}>
      <Link to="/dashboard">← Back to Dashboard</Link>
      <h1>Budget &amp; Expenditure</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
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
            <tr key={c.id} style={{ color: parseFloat(c.remaining) < 0 ? 'red' : 'inherit' }}>
              <td>{c.name}</td>
              <td style={{ textAlign: 'right' }}>{c.allocated_amount}</td>
              <td style={{ textAlign: 'right' }}>{c.spent}</td>
              <td style={{ textAlign: 'right' }}>{c.remaining}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {isAdmin && (
        <>
          <form onSubmit={handleExpSubmit} style={{ marginBottom: '2rem', border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
            <h3>Record Expenditure</h3>
            <select
              value={expForm.category_id}
              onChange={(e) => setExpForm({ ...expForm, category_id: e.target.value })}
              required
              style={{ marginRight: '0.5rem', padding: '0.4rem' }}
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input
              type="number" step="0.01" placeholder="Amount"
              value={expForm.amount}
              onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })}
              required
              style={{ marginRight: '0.5rem' }}
            />
            <input
              placeholder="Description"
              value={expForm.description}
              onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
              style={{ marginRight: '0.5rem' }}
            />
            <button type="submit">Record</button>
          </form>

          <form onSubmit={handleCatSubmit} style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
            <h3>New Budget Category</h3>
            <input
              placeholder="Name"
              value={catForm.name}
              onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
              required
              style={{ marginRight: '0.5rem' }}
            />
            <input
              type="number" step="0.01" placeholder="Allocated Amount"
              value={catForm.allocated_amount}
              onChange={(e) => setCatForm({ ...catForm, allocated_amount: e.target.value })}
              required
              style={{ marginRight: '0.5rem' }}
            />
            <label>From: </label>
            <input
              type="date"
              value={catForm.period_start}
              onChange={(e) => setCatForm({ ...catForm, period_start: e.target.value })}
              required
              style={{ marginRight: '0.5rem' }}
            />
            <label>To: </label>
            <input
              type="date"
              value={catForm.period_end}
              onChange={(e) => setCatForm({ ...catForm, period_end: e.target.value })}
              required
              style={{ marginRight: '0.5rem' }}
            />
            <button type="submit">Create Category</button>
          </form>
        </>
      )}
    </div>
  );
}

export default Budget;