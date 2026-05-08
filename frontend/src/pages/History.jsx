import { useState, useEffect } from 'react';
import api from '../api';

export default function History() {
  const [orders, setOrders] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.get('/orders').then(({ data }) => setOrders(data)).catch(() => {});
  }, []);

  const statusBadge = (status) => {
    const colors = { pendiente: 'badge-warning', aprobado: 'badge-success', rechazado: 'badge-danger' };
    return <span className={`badge ${colors[status] || ''}`}>{status}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <h1>Historial de Requisiciones</h1>
      </div>

      {orders.length === 0 ? (
        <p className="empty-msg">No hay requisiciones aún</p>
      ) : (
        <div className="order-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header" onClick={() => setExpanded(expanded === order.id ? null : order.id)}>
                <div>
                  <strong>#{order.id}</strong> - {statusBadge(order.status)}
                  <span className="order-date">{new Date(order.created_at).toLocaleString('es-MX')}</span>
                </div>
                <div>
                  <strong>${order.total.toFixed(2)}</strong>
                  {order.user_name && <span className="order-user"> - {order.user_name}</span>}
                </div>
              </div>
              {expanded === order.id && (
                <div className="order-details">
                  <table>
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item) => (
                        <tr key={item.id}>
                          <td>{item.product_name}</td>
                          <td>{item.quantity}</td>
                          <td>${item.price.toFixed(2)}</td>
                          <td>${(item.quantity * item.price).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
