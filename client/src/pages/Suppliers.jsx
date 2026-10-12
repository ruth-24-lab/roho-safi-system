import { useEffect, useState } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:5000/api';
const empty = { name: '', contact_person: '', phone: '', email: '', location: '', notes: '' };

export default function Suppliers() {
  const { user } = useAuth();
  const canEdit = user?.role === 'Admin' || user?.role === 'Inventory Manager';
  const isAdmin = user?.role === 'Admin';

  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  const load = async () => {
    try {
      const res = await axios.get(`${API}/suppliers`, { headers: headers() });
      setSuppliers(res.data);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Could not load suppliers' });
    }
  };

  useEffect(() => { load(); }, []);

  const change = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    try {
      if (editingId) {
        await axios.put(`${API}/suppliers/${editingId}`, form, { headers: headers() });
        setMessage({ type: 'success', text: 'Supplier updated' });
      } else {
        await axios.post(`${API}/suppliers`, form, { headers: headers() });
        setMessage({ type: 'success', text: 'Supplier added' });
      }
      setForm(empty);
      setEditingId(null);
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Something went wrong' });
    }
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    setForm({
      name: s.name || '',
      contact_person: s.contact_person || '',
      phone: s.phone || '',
      email: s.email || '',
      location: s.location || '',
      notes: s.notes || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => { setEditingId(null); setForm(empty); };

  const remove = async (s) => {
    if (!window.confirm(`Delete supplier "${s.name}"?`)) return;
    setMessage({ type: '', text: '' });
    try {
      await axios.delete(`${API}/suppliers/${s.id}`, { headers: headers() });
      setMessage({ type: 'success', text: 'Supplier deleted' });
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Could not delete' });
    }
  };

  return (
    <Layout>
      <h2>Suppliers</h2>

      {canEdit && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3>{editingId ? 'Edit supplier' : 'Add supplier'}</h3>
          <form onSubmit={submit} style={{ display: 'grid', gap: 12, maxWidth: 520 }}>
            <input required placeholder="Supplier name" value={form.name} onChange={change('name')} />
            <input placeholder="Contact person" value={form.contact_person} onChange={change('contact_person')} />
            <input placeholder="Phone" value={form.phone} onChange={change('phone')} />
            <input type="email" placeholder="Email" value={form.email} onChange={change('email')} />
            <input placeholder="Location" value={form.location} onChange={change('location')} />
            <input placeholder="Notes (e.g. what they supply, delivery days)" value={form.notes} onChange={change('notes')} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                {editingId ? 'Save changes' : 'Add supplier'}
              </button>
              {editingId && (
                <button type="button" className="btn btn-secondary" onClick={cancelEdit}
                  style={{ color: '#1f2d3d', border: '1px solid #1f2d3d' }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {message.text && (
        <div style={{ marginBottom: 16, fontWeight: 600, color: message.type === 'error' ? '#c0392b' : '#2e7d57' }}>
          {message.text}
        </div>
      )}

      <div className="card">
        <h3>All suppliers ({suppliers.length})</h3>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Contact</th><th>Phone</th><th>Email</th>
                <th>Location</th><th>Products</th><th>Notes</th>
                {canEdit && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 && <tr><td colSpan="8">No suppliers yet</td></tr>}
              {suppliers.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.contact_person}</td>
                  <td>{s.phone}</td>
                  <td>{s.email}</td>
                  <td>{s.location}</td>
                  <td>{s.product_count}</td>
                  <td>{s.notes}</td>
                  {canEdit && (
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button className="btn btn-secondary" onClick={() => startEdit(s)}
                        style={{ color: '#1f2d3d', border: '1px solid #cfd6dd', marginRight: 6 }}>Edit</button>
                      {isAdmin && (
                        <button className="btn btn-secondary" onClick={() => remove(s)}
                          style={{ color: '#c0392b', border: '1px solid #c0392b' }}>Delete</button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
