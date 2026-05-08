const express = require('express');
const pool = require('../database');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.post('/', authenticate, adminOnly, async (req, res) => {
  try {
    const { name, description, price, stock } = req.body;
    if (!name || price == null || stock == null) {
      return res.status(400).json({ error: 'Nombre, precio y stock son obligatorios' });
    }

    const { rows } = await pool.query(
      'INSERT INTO products (name, description, price, stock) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description || '', parseFloat(price), parseInt(stock)]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.put('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const { name, description, price, stock } = req.body;
    const { rows: existing } = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });

    const { rows } = await pool.query(
      'UPDATE products SET name = $1, description = $2, price = $3, stock = $4 WHERE id = $5 RETURNING *',
      [
        name || existing[0].name,
        description !== undefined ? description : existing[0].description,
        price != null ? parseFloat(price) : existing[0].price,
        stock != null ? parseInt(stock) : existing[0].stock,
        req.params.id,
      ]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });

    await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
