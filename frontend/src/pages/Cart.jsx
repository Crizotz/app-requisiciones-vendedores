import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Cart() {
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('cart') || '[]'));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const updateQuantity = (productId, delta) => {
    const newCart = cart
      .map((item) =>
        item.product_id === productId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
      )
      .filter((item) => item.quantity > 0);
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const removeItem = (productId) => {
    const newCart = cart.filter((item) => item.product_id !== productId);
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const submitOrder = async () => {
    try {
      const { data } = await api.post('/orders', {
        items: cart.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      });
      setSuccess(`Requisición #${data.id} creada exitosamente`);
      setCart([]);
      localStorage.setItem('cart', JSON.stringify([]));
      setTimeout(() => navigate('/historial'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear la requisición');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Carrito de Compras</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/catalogo')}>Seguir comprando</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {cart.length === 0 ? (
        <p className="empty-msg">El carrito está vacío</p>
      ) : (
        <>
          <div className="cart-list">
            {cart.map((item) => (
              <div key={item.product_id} className="cart-item">
                <div className="cart-item-info">
                  <h3>{item.name}</h3>
                  <p>${item.price.toFixed(2)} c/u</p>
                </div>
                <div className="cart-item-actions">
                  <button className="btn btn-small" onClick={() => updateQuantity(item.product_id, -1)}>-</button>
                  <span>{item.quantity}</span>
                  <button className="btn btn-small" onClick={() => updateQuantity(item.product_id, 1)}>+</button>
                  <span className="cart-item-subtotal">${(item.price * item.quantity).toFixed(2)}</span>
                  <button className="btn btn-small btn-danger" onClick={() => removeItem(item.product_id)}>X</button>
                </div>
              </div>
            ))}
          </div>
          <div className="cart-total">
            <h2>Total: ${total.toFixed(2)}</h2>
            <button className="btn btn-primary" onClick={submitOrder}>Enviar Requisición</button>
          </div>
        </>
      )}
    </div>
  );
}
