import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

function Products() {
  const { token, user } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };
  const canManage = user?.role === 'Admin' || user?.role === 'Inventory Manager';

  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', category: '', quantity: '', reorder_level: '', unit_price: '', supplier: '',
  });
  const [editingId, setEditingId] = useState(null);

  const fetchProducts = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/products', { headers });
      setProducts(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load products');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({ name: '', category: '', quantity: '', reorder_level: '', unit_price: '', supplier: '' });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await axios.put(`http://localhost:5000/api/products/${editingId}`, form, { headers });
      } else {
        await axios.post('http://localhost:5000/api/products', form, { headers });
      }
      resetForm();
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    }
  };

  const handleEdit = (product) => {
    setForm({
      name: product.name,
      category: product.category || '',
      quantity: product.quantity,
      reorder_level: product.reorder_level,
      unit_price: product.unit_price,
      supplier: product.supplier || '',
    });
    setEditingId(product.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/products/${id}`, { headers });
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed');
    }
  };

  return (
    <Layout>
      <h1>Products</h1>
      {error && <p className="error-text">{error}</p>}

      {canManage && (
        <form onSubmit={handleSubmit} className="card">
          <h3>{editingId ? 'Edit Product' : 'Add Product'}</h3>
          <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
          <input name="category" placeholder="Category" value={form.category} onChange={handleChange} />
          <input name="quantity" type="number" placeholder="Quantity" value={form.quantity} onChange={handleChange} required />
          <input name="reorder_level" type="number" placeholder="Reorder Level" value={form.reorder_level} onChange={handleChange} required />
          <input name="unit_price" type="number" step="0.01" placeholder="Unit Price" value={form.unit_price} onChange={handleChange} />
          <input name="supplier" placeholder="Supplier" value={form.supplier} onChange={handleChange} />
          <div>
            <button type="submit">{editingId ? 'Update Product' : 'Add Product'}</button>
            {editingId && (
              <button type="button" onClick={resetForm} className="btn-secondary" style={{ marginLeft: '0.5rem' }}>
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th style={{ textAlign: 'right' }}>Qty</th>
            <th style={{ textAlign: 'right' }}>Reorder</th>
            <th style={{ textAlign: 'right' }}>Price</th>
            <th>Supplier</th>
            {canManage && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className={p.quantity <= p.reorder_level ? 'row-alert' : ''}>
              <td>{p.name}</td>
              <td>{p.category}</td>
              <td style={{ textAlign: 'right' }}>{p.quantity}</td>
              <td style={{ textAlign: 'right' }}>{p.reorder_level}</td>
              <td style={{ textAlign: 'right' }}>{p.unit_price}</td>
              <td>{p.supplier}</td>
              {canManage && (
                <td>
                  <button onClick={() => handleEdit(p)} className="btn-secondary">Edit</button>
                  {user?.role === 'Admin' && (
                    <button onClick={() => handleDelete(p.id)} className="btn-danger" style={{ marginLeft: '0.5rem' }}>
                      Delete
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </Layout>
  );
}

export default Products;