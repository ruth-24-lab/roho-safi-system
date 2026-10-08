import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const ROLES = ['Admin', 'Sales Staff', 'Inventory Manager'];

function Users() {
  const { token, user } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };
  const isAdmin = user?.role === 'Admin';

  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Sales Staff' });

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users', { headers });
      setUsers(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load users');
    }
  };

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await axios.post('http://localhost:5000/api/auth/register', form, { headers });
      setMessage(`Account created for ${form.name}`);
      setForm({ name: '', email: '', password: '', role: 'Sales Staff' });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user');
    }
  };

  const updateUser = async (id, changes) => {
    setError('');
    setMessage('');
    try {
      await axios.patch(`http://localhost:5000/api/users/${id}`, changes, { headers });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed');
    }
  };

  if (!isAdmin) {
    return (
      <Layout>
        <h1>Users</h1>
        <p className="error-text">You do not have permission to manage users.</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1>User Management</h1>
      {error && <p className="error-text">{error}</p>}
      {message && <p style={{ color: '#2e8b57' }}>{message}</p>}

      <form onSubmit={handleCreate} className="card">
        <h3>Create Staff Account</h3>
        <input
          placeholder="Full name" value={form.name} required
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          type="email" placeholder="Email" value={form.email} required
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          type="password" placeholder="Password" value={form.password} required
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <div>
          <button type="submit">Create Account</button>
        </div>
      </form>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className={!u.is_active ? 'row-alert' : ''}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>
                {u.id === user.id ? (
                  u.role
                ) : (
                  <select
                    value={u.role}
                    onChange={(e) => updateUser(u.id, { role: e.target.value })}
                    style={{ marginBottom: 0 }}
                  >
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                )}
              </td>
              <td>{u.is_active ? 'Active' : 'Deactivated'}</td>
              <td>
                {u.id !== user.id && (
                  u.is_active ? (
                    <button className="btn-danger" onClick={() => updateUser(u.id, { is_active: false })}>
                      Deactivate
                    </button>
                  ) : (
                    <button onClick={() => updateUser(u.id, { is_active: true })}>
                      Reactivate
                    </button>
                  )
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Layout>
  );
}

export default Users;