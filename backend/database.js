const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/requisiciones',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'vendedor',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price NUMERIC(10,2) NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      total NUMERIC(10,2) NOT NULL,
      status TEXT NOT NULL DEFAULT 'pendiente',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id),
      product_id INTEGER NOT NULL REFERENCES products(id),
      quantity INTEGER NOT NULL,
      price NUMERIC(10,2) NOT NULL
    );
  `);

  const { rows } = await pool.query('SELECT COUNT(*) as count FROM users');
  if (parseInt(rows[0].count) === 0) {
    const adminPass = bcrypt.hashSync('admin123', 10);
    const vendedorPass = bcrypt.hashSync('vendedor123', 10);

    await pool.query('INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)', ['Admin', 'admin@example.com', adminPass, 'admin']);
    await pool.query('INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)', ['Vendedor 1', 'vendedor@example.com', vendedorPass, 'vendedor']);

    const products = [
      ['Laptop HP ProBook', 'Laptop empresarial 15.6" 8GB RAM 256GB SSD', 12500.00, 10],
      ['Monitor Dell 27"', 'Monitor IPS 27" Full HD 75Hz', 4500.00, 15],
      ['Teclado Mecánico Logitech', 'Teclado mecánico RGB inalámbrico', 1800.00, 25],
      ['Mouse Inalámbrico MX Master 3', 'Mouse ergonómico premium', 2200.00, 20],
      ['Webcam Logitech C920', 'Webcam HD 1080p con micrófono', 1600.00, 30],
      ['Audífonos Sony WH-1000XM5', 'Audífonos inalámbricos con cancelación de ruido', 5500.00, 12],
      ['Hub USB-C 7 en 1', 'Hub multipuerto USB-C con HDMI', 850.00, 40],
      ['SSD Samsung 1TB', 'Disco sólido externo portátil 1TB USB-C', 2100.00, 18],
    ];

    for (const [name, desc, price, stock] of products) {
      await pool.query('INSERT INTO products (name, description, price, stock) VALUES ($1, $2, $3, $4)', [name, desc, price, stock]);
    }

    console.log('Base de datos inicializada con datos de ejemplo');
  }
}

initDB().catch(err => console.error('Error inicializando DB:', err));

module.exports = pool;
