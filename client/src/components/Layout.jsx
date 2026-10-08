import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <nav className="navbar">
        <div className="navbar-brand">Roho Safi System</div>
        <div className="navbar-links">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/products">Products</Link>
          <Link to="/budget">Budget</Link>
          <Link to="/reports">Reports</Link>
          {user?.role === 'Admin' && <Link to="/audit">Audit Log</Link>}
          {user?.role === 'Admin' && <Link to="/users">Users</Link>}
        </div>
        <div className="navbar-user">
          <span>{user?.name} ({user?.role})</span>
          <button onClick={handleLogout} className="btn-secondary">Log Out</button>
        </div>
      </nav>
      <main className="page-content">{children}</main>
    </div>
  );
}

export default Layout;