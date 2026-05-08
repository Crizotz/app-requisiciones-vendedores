import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('cart') || '[]'));
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/products').then(({ data }) => setProducts(data)).catch(() => {});
  }, []);

  const addToCart = (product) => {
    const existing = cart.find((item) => item.product_id === product.id);
    let newCart;
    if (existing) {
      newCart = cart.map((item) =>
        item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      newCart = [...cart, { product_id: product.id, name: product.name, price: product.price, quantity: 1 }];
    }
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  return (
    <div>
      <div className="page-header">
        <h1>Catálogo de Productos</h1>
        <button className="btn btn-primary" onClick={() => navigate('/carrito')}>
          Ir al Carrito ({cart.reduce((s, i) => s + i.quantity, 0)})
        </button>
      </div>
      <div className="product-grid">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <h3>{product.name}</h3>
            <p className="product-desc">{product.description}</p>
            <p className="product-price">${Number(product.price).toFixed(2)}</p>
            <p className={`product-stock ${product.stock <= 5 ? 'low-stock' : ''}`}>
              Stock: {product.stock}
            </p>
            <button
              className="btn btn-primary btn-full"
              onClick={() => addToCart(product)}
              disabled={product.stock === 0}
            >
              {product.stock === 0 ? 'Sin stock' : 'Agregar al carrito'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
