import { useEffect, useState } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';

const API = 'http://localhost:5000/api';

export default function Stock() {
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [form, setForm] = useState({ product_id: '', movement_type: 'OUT', quantity: '', note: '' });
  const [message, setMessage] = useState({ type: '', text: '' });

  const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  const load = async () => {
    try {
      const [p, m] = await Promise.all([
        axios.get(`${API}/products`, { headers: headers() }),
        axios.get(`${API}/stock`, { headers: headers() }),
      ]);
      setProducts(p.data);
      setMovements(m.data);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Could not load data' });
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    try {
      const res = await axios.post(`${API}/stock`, form, { headers: headers() });
      setMessage({ type: 'success', text: `Recorded. New quantity: ${res.data.new_quantity}` });
      setForm({ ...form, quantity: '', note: '' });
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Something went wrong' });
    }
  };

  const selected = products.find((p) => String(p.id) === String(form.product_id));

  return (
    <Layout>
      <h2>Stock Movements</h2>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3>Record stock in / out</h3>
        <form onSubmit={submit} style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
          <select required value={form.product_id}
            onChange={(e) => setForm({ ...form, product_id: e.target.value })}>
            <option value="">Select product…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name} (in stock: {p.quantity})</option>
            ))}
          </select>

          <select value={form.movement_type}
            onChange={(e) => setForm({ ...form, movement_type: e.target.value })}>
            <option value="OUT">Stock OUT (sale / loss)</option>
            <option value="IN">Stock IN (restock)</option>
          </select>

          <input type="number" min="1" required placeholder="Quantity" value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })} />

          <input type="text" placeholder="Note (optional)" value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })} />

          {selected && (
            <small>Current stock: {selected.quantity}. Reorder level: {selected.reorder_level}</small>
          )}

          <button type="submit" className="btn btn-primary">Record movement</button>
          {message.text && (
            <div style={{ color: message.type === 'error' ? '#c0392b' : '#2e7d57', fontWeight: 600 }}>
              {message.text}
            </div>
          )}
        </form>
      </div>

      <div className="card">
        <h3>Recent movements</h3>
        <table>
          <thead>
            <tr><th>Date</th><th>Product</th><th>Type</th><th>Qty</th><th>By</th><th>Note</th></tr>
          </thead>
          <tbody>
            {movements.length === 0 && <tr><td colSpan="6">No movements yet</td></tr>}
            {movements.map((m) => (
              <tr key={m.id}>
                <td>{new Date(m.created_at).toLocaleString()}</td>
                <td>{m.product_name}</td>
                <td style={{ color: m.movement_type === 'IN' ? '#2e7d57' : '#c0392b', fontWeight: 600 }}>
                  {m.movement_type}
                </td>
                <td>{m.quantity}</td>
                <td>{m.user_name}</td>
                <td>{m.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}