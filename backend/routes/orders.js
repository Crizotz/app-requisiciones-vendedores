const express = require('express');
const pool = require('../database');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    let ordersQuery;
    let params;
    if (req.user.role === 'admin') {
      ordersQuery = `
        SELECT o.*, u.name as user_name, u.email as user_email
        FROM orders o JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
      `;
      params = [];
    } else {
      ordersQuery = `
        SELECT o.*, u.name as user_name, u.email as user_email
        FROM orders o JOIN users u ON o.user_id = u.id
        WHERE o.user_id = $1
        ORDER BY o.created_at DESC
      `;
      params = [req.user.id];
    }

    const { rows: orders } = await pool.query(ordersQuery, params);

    for (const order of orders) {
      const { rows: items } = await pool.query(
        `SELECT oi.*, p.name as product_name
         FROM order_items oi JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = $1`,
        [order.id]
      );
      order.items = items;
    }

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const { rows: orders } = await pool.query(
      `SELECT o.*, u.name as user_name, u.email as user_email
       FROM orders o JOIN users u ON o.user_id = u.id
       WHERE o.id = $1`,
      [req.params.id]
    );

    if (orders.length === 0) return res.status(404).json({ error: 'Requisición no encontrada' });

    const order = orders[0];
    if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para ver esta requisición' });
    }

    const { rows: items } = await pool.query(
      `SELECT oi.*, p.name as product_name
       FROM order_items oi JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [order.id]
    );
    order.items = items;

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !items.length) {
      return res.status(400).json({ error: 'La requisición debe tener al menos un producto' });
    }

    let total = 0;
    const orderItems = [];

    for (const item of items) {
      const { rows: products } = await pool.query('SELECT * FROM products WHERE id = $1', [item.product_id]);
      const product = products[0];
      if (!product) return res.status(404).json({ error: `Producto ${item.product_id} no encontrado` });
      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}` });
      }
      const price = parseFloat(product.price);
      total += price * item.quantity;
      orderItems.push({ product_id: item.product_id, quantity: item.quantity, price });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: orderRows } = await client.query(
        'INSERT INTO orders (user_id, total) VALUES ($1, $2) RETURNING id',
        [req.user.id, total]
      );
      const orderId = orderRows[0].id;

      for (const item of orderItems) {
        await client.query(
          'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
          [orderId, item.product_id, item.quantity, item.price]
        );
        await client.query(
          'UPDATE products SET stock = stock - $1 WHERE id = $2',
          [item.quantity, item.product_id]
        );
      }

      await client.query('COMMIT');

      const { rows: orderRows2 } = await pool.query(
        `SELECT o.*, u.name as user_name, u.email as user_email
         FROM orders o JOIN users u ON o.user_id = u.id
         WHERE o.id = $1`,
        [orderId]
      );
      const order = orderRows2[0];
      order.items = orderItems;

      res.status(201).json(order);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.put('/:id/status', authenticate, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pendiente', 'aprobado', 'rechazado'].includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const { rows: existing } = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Requisición no encontrada' });

    const order = existing[0];

    if (status === 'rechazado' && order.status !== 'rechazado') {
      const { rows: items } = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
      for (const item of items) {
        await pool.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [item.quantity, item.product_id]);
      }
    }

    await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [status, req.params.id]);

    const { rows: updatedRows } = await pool.query(
      `SELECT o.*, u.name as user_name, u.email as user_email
       FROM orders o JOIN users u ON o.user_id = u.id
       WHERE o.id = $1`,
      [req.params.id]
    );

    const updated = updatedRows[0];
    const { rows: items } = await pool.query(
      `SELECT oi.*, p.name as product_name
       FROM order_items oi JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [updated.id]
    );
    updated.items = items;

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
