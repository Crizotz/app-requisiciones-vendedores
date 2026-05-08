import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Requisiciones</Link>
      </div>
      <div className="navbar-links">
        <Link to="/catalogo">Catálogo</Link>
        <Link to="/carrito">Carrito</Link>
        <Link to="/historial">Historial</Link>
        {user.role === 'admin' && (
          <>
            <Link to="/admin/productos">Admin Productos</Link>
            <Link to="/admin/requisiciones">Admin Requisiciones</Link>
            <Link to="/admin/reportes">Reportes</Link>
          </>
        )}
      </div>
      <div className="navbar-user">
        <span>{user.name} ({user.role})</span>
        <button onClick={handleLogout} className="btn btn-small">Salir</button>
      </div>
    </nav>
  );
}
