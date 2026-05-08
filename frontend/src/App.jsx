import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Catalog from './pages/Catalog';
import Cart from './pages/Cart';
import History from './pages/History';
import AdminProducts from './pages/AdminProducts';
import AdminOrders from './pages/AdminOrders';
import Reports from './pages/Reports';

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/catalogo" element={<ProtectedRoute><Catalog /></ProtectedRoute>} />
          <Route path="/carrito" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="/historial" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/admin/productos" element={<AdminRoute><AdminProducts /></AdminRoute>} />
          <Route path="/admin/requisiciones" element={<AdminRoute><AdminOrders /></AdminRoute>} />
          <Route path="/admin/reportes" element={<AdminRoute><Reports /></AdminRoute>} />
          <Route path="/" element={<Navigate to="/catalogo" />} />
        </Routes>
      </main>
    </div>
  );
}
