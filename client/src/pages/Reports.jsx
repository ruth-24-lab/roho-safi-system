import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

function Reports() {
  const { token, user } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };
  const isAdmin = user?.role === 'Admin';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [expenditures, setExpenditures] = useState([]);
  const [auditSummary, setAuditSummary] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const productsRes = await axios.get('http://localhost:5000/api/products', { headers });
        setProducts(productsRes.data);

        const categoriesRes = await axios.get('http://localhost:5000/api/budget/categories', { headers });
        setCategories(categoriesRes.data);

        const expRes = await axios.get('http://localhost:5000/api/budget/expenditures', { headers });
        setExpenditures(expRes.data);

        if (isAdmin) {
          const summaryRes = await axios.get('http://localhost:5000/api/audit/summary', { headers });
          setAuditSummary(summaryRes.data);
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load report data');
      }
    };
    fetchAll();
  }, []);

  const lowStock = products.filter((p) => p.quantity <= p.reorder_level);
  const totalAllocated = categories.reduce((sum, c) => sum + parseFloat(c.allocated_amount), 0);
  const totalSpent = categories.reduce((sum, c) => sum + parseFloat(c.spent), 0);
  const totalRemaining = categories.reduce((sum, c) => sum + parseFloat(c.remaining), 0);
  const totalInventoryValue = products.reduce((sum, p) => sum + p.quantity * parseFloat(p.unit_price || 0), 0);

  return (
    <Layout>
      <h1>Reports</h1>
      {error && <p className="error-text">{error}</p>}

      {/* Summary Report */}
      <h2>Summary Report</h2>
      <div className="card-grid">
        <div className="card">
          <h3>Total Inventory Value</h3>
          <p className="stat-number">KES {totalInventoryValue.toFixed(2)}</p>
        </div>
        <div className="card">
          <h3>Total Budget Allocated</h3>
          <p className="stat-number">KES {totalAllocated.toFixed(2)}</p>
        </div>
        <div className="card">
          <h3>Total Remaining Budget</h3>
          <p className="stat-number">KES {totalRemaining.toFixed(2)}</p>
        </div>
      </div>

      {/* Inventory Report */}
      <h2>Inventory Report</h2>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th style={{ textAlign: 'right' }}>Quantity</th>
            <th style={{ textAlign: 'right' }}>Unit Price</th>
            <th style={{ textAlign: 'right' }}>Value</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.category}</td>
              <td style={{ textAlign: 'right' }}>{p.quantity}</td>
              <td style={{ textAlign: 'right' }}>{p.unit_price}</td>
              <td style={{ textAlign: 'right' }}>{(p.quantity * parseFloat(p.unit_price || 0)).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Low Stock Report */}
      <h2>Low Stock Report</h2>
      {lowStock.length === 0 ? (
        <p>No products currently at or below reorder level.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th style={{ textAlign: 'right' }}>Current Quantity</th>
              <th style={{ textAlign: 'right' }}>Reorder Level</th>
              <th>Supplier</th>
            </tr>
          </thead>
          <tbody>
            {lowStock.map((p) => (
              <tr key={p.id} className="row-alert">
                <td>{p.name}</td>
                <td style={{ textAlign: 'right' }}>{p.quantity}</td>
                <td style={{ textAlign: 'right' }}>{p.reorder_level}</td>
                <td>{p.supplier}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Budget Allocation Report */}
      <h2>Budget Allocation Report</h2>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th style={{ textAlign: 'right' }}>Allocated</th>
            <th style={{ textAlign: 'right' }}>Spent</th>
            <th style={{ textAlign: 'right' }}>Remaining</th>
            <th style={{ textAlign: 'right' }}>% Used</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => {
            const pctUsed = (parseFloat(c.spent) / parseFloat(c.allocated_amount)) * 100;
            return (
              <tr key={c.id} className={pctUsed >= 90 ? 'row-alert' : ''}>
                <td>{c.name}</td>
                <td style={{ textAlign: 'right' }}>{c.allocated_amount}</td>
                <td style={{ textAlign: 'right' }}>{c.spent}</td>
                <td style={{ textAlign: 'right' }}>{c.remaining}</td>
                <td style={{ textAlign: 'right' }}>{pctUsed.toFixed(1)}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Expenditure Report */}
      <h2>Expenditure Report</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Category</th>
            <th>Description</th>
            <th style={{ textAlign: 'right' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {expenditures.map((e) => (
            <tr key={e.id}>
              <td>{new Date(e.created_at).toLocaleDateString()}</td>
              <td>{e.category_name}</td>
              <td>{e.description}</td>
              <td style={{ textAlign: 'right' }}>{e.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Audit Trail Report (Admin only) */}
      {isAdmin && (
        <>
          <h2>Audit Trail Report (Staff Activity)</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th style={{ textAlign: 'right' }}>Total Actions</th>
              </tr>
            </thead>
            <tbody>
              {auditSummary.map((s) => (
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

      <div style={{ marginTop: '2rem' }}>
        <button onClick={() => window.print()}>Print / Export Report</button>
      </div>
    </Layout>
  );
}

export default Reports;