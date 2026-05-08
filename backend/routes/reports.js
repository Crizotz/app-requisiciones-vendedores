const express = require('express');
const ExcelJS = require('exceljs');
const pool = require('../database');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/export', authenticate, adminOnly, async (req, res) => {
  try {
    const { start, end } = req.query;

    let ordersQuery, ordersParams;
    if (start && end) {
      ordersQuery = `
        SELECT o.*, u.name as user_name, u.email as user_email
        FROM orders o JOIN users u ON o.user_id = u.id
        WHERE o.created_at::date BETWEEN $1 AND $2
        ORDER BY o.created_at DESC
      `;
      ordersParams = [start, end];
    } else {
      ordersQuery = `
        SELECT o.*, u.name as user_name, u.email as user_email
        FROM orders o JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
      `;
      ordersParams = [];
    }

    const { rows: orders } = await pool.query(ordersQuery, ordersParams);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Requisiciones');

    sheet.columns = [
      { header: '#', key: 'id', width: 8 },
      { header: 'Vendedor', key: 'user_name', width: 25 },
      { header: 'Email', key: 'user_email', width: 30 },
      { header: 'Total', key: 'total', width: 15 },
      { header: 'Estado', key: 'status', width: 15 },
      { header: 'Fecha', key: 'created_at', width: 20 },
      { header: 'Productos', key: 'products', width: 50 },
    ];

    for (const order of orders) {
      const { rows: items } = await pool.query(
        `SELECT oi.*, p.name as product_name
         FROM order_items oi JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = $1`,
        [order.id]
      );
      const productsStr = items.map(i => `${i.product_name} x${i.quantity} ($${i.price})`).join(', ');
      sheet.addRow({
        id: order.id,
        user_name: order.user_name,
        user_email: order.user_email,
        total: `$${parseFloat(order.total).toFixed(2)}`,
        status: order.status,
        created_at: order.created_at,
        products: productsStr,
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=requisiciones_${start || 'todas'}_${end || 'ahora'}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.get('/summary', authenticate, adminOnly, async (req, res) => {
  try {
    const { rows: totalOrders } = await pool.query('SELECT COUNT(*)::int as count FROM orders');
    const { rows: totalApproved } = await pool.query("SELECT COUNT(*)::int as count FROM orders WHERE status = 'aprobado'");
    const { rows: totalPending } = await pool.query("SELECT COUNT(*)::int as count FROM orders WHERE status = 'pendiente'");
    const { rows: totalRevenue } = await pool.query("SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status = 'aprobado'");
    const { rows: totalProducts } = await pool.query('SELECT COUNT(*)::int as count FROM products');
    const { rows: totalUsers } = await pool.query("SELECT COUNT(*)::int as count FROM users WHERE role = 'vendedor'");

    const { rows: topProducts } = await pool.query(`
      SELECT p.name, SUM(oi.quantity)::int as total_sold, SUM(oi.quantity * oi.price) as total_revenue
      FROM order_items oi JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'aprobado'
      GROUP BY p.id, p.name
      ORDER BY total_sold DESC
      LIMIT 5
    `);

    res.json({
      totalOrders: parseInt(totalOrders[0].count),
      totalApproved: parseInt(totalApproved[0].count),
      totalPending: parseInt(totalPending[0].count),
      totalRevenue: parseFloat(totalRevenue[0].total),
      totalProducts: parseInt(totalProducts[0].count),
      totalUsers: parseInt(totalUsers[0].count),
      topProducts,
    });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
