import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

function AuditLog() {
  const { token, user } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };
  const isAdmin = user?.role === 'Admin';

  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState([]);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    action: '', table_name: '', from_date: '', to_date: '',
  });

  const fetchLogs = async () => {
    try {
      const params = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });
      const res = await axios.get('http://localhost:5000/api/audit', { headers, params });
      setLogs(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load audit log');
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/audit/summary', { headers });
      setSummary(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load summary');
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchLogs();
      fetchSummary();
    }
  }, []);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const clearFilters = () => {
    setFilters({ action: '', table_name: '', from_date: '', to_date: '' });
    setTimeout(fetchLogs, 0);
  };

  if (!isAdmin) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <Link to="/dashboard">← Back to Dashboard</Link>
        <p style={{ color: 'red', marginTop: '1rem' }}>
          You do not have permission to view the audit log.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '1000px', margin: '0 auto' }}>
      <Link to="/dashboard">← Back to Dashboard</Link>
      <h1>Audit Log</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ marginBottom: '2rem' }}>
        <h2>Staff Activity Summary</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Name</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Role</th>
              <th style={{ textAlign: 'right', borderBottom: '1px solid #ccc' }}>Actions</th>
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
      </div>

      <form onSubmit={handleFilterSubmit} style={{ marginBottom: '1.5rem', border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
        <h3>Filter Log</h3>
        <select name="action" value={filters.action} onChange={handleFilterChange} style={{ marginRight: '0.5rem' }}>
          <option value="">All Actions</option>
          <option value="LOGIN">LOGIN</option>
          <option value="CREATE_PRODUCT">CREATE_PRODUCT</option>
          <option value="UPDATE_PRODUCT">UPDATE_PRODUCT</option>
          <option value="DELETE_PRODUCT">DELETE_PRODUCT</option>
          <option value="CREATE_BUDGET_CATEGORY">CREATE_BUDGET_CATEGORY</option>
          <option value="CREATE_EXPENDITURE">CREATE_EXPENDITURE</option>
          <option value="CREATE_USER">CREATE_USER</option>
        </select>
        <select name="table_name" value={filters.table_name} onChange={handleFilterChange} style={{ marginRight: '0.5rem' }}>
          <option value="">All Tables</option>
          <option value="users">users</option>
          <option value="products">products</option>
          <option value="budget_categories">budget_categories</option>
          <option value="expenditures">expenditures</option>
        </select>
        <label>From: </label>
        <input type="date" name="from_date" value={filters.from_date} onChange={handleFilterChange} style={{ marginRight: '0.5rem' }} />
        <label>To: </label>
        <input type="date" name="to_date" value={filters.to_date} onChange={handleFilterChange} style={{ marginRight: '0.5rem' }} />
        <button type="submit">Apply</button>
        <button type="button" onClick={clearFilters} style={{ marginLeft: '0.5rem' }}>Clear</button>
      </form>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Time</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>User</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Action</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Table</th>
            <th style={{ textAlign: 'right', borderBottom: '1px solid #ccc' }}>Record ID</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{new Date(log.created_at).toLocaleString()}</td>
              <td>{log.user_name || `User #${log.user_id}`}</td>
              <td>{log.action}</td>
              <td>{log.table_name}</td>
              <td style={{ textAlign: 'right' }}>{log.record_id}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AuditLog;