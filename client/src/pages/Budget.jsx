import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

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
    <Layout>
      <h1>Budget &amp; Expenditure</h1>
      {error && <p className="error-text">{error}</p>}

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
            <tr key={c.id} className={parseFloat(c.remaining) < 0 ? 'row-alert' : ''}>
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
          <form onSubmit={handleExpSubmit} className="card">
            <h3>Record Expenditure</h3>
            <select
              value={expForm.category_id}
              onChange={(e) => setExpForm({ ...expForm, category_id: e.target.value })}
              required
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
            />
            <input
              placeholder="Description"
              value={expForm.description}
              onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
            />
            <div>
              <button type="submit">Record</button>
            </div>
          </form>

          <form onSubmit={handleCatSubmit} className="card">
            <h3>New Budget Category</h3>
            <input
              placeholder="Name"
              value={catForm.name}
              onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
              required
            />
            <input
              type="number" step="0.01" placeholder="Allocated Amount"
              value={catForm.allocated_amount}
              onChange={(e) => setCatForm({ ...catForm, allocated_amount: e.target.value })}
              required
            />
            <label>From: </label>
            <input
              type="date"
              value={catForm.period_start}
              onChange={(e) => setCatForm({ ...catForm, period_start: e.target.value })}
              required
            />
            <label>To: </label>
            <input
              type="date"
              value={catForm.period_end}
              onChange={(e) => setCatForm({ ...catForm, period_end: e.target.value })}
              required
            />
            <div>
              <button type="submit">Create Category</button>
            </div>
          </form>
        </>
      )}
    </Layout>
  );
}

export default Budget;