require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(morgan('combined'));
app.use(express.json());

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ecommerce',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

// Initialize database
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        stock_quantity INTEGER DEFAULT 0,
        category VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Insert sample products if table is empty
    const count = await pool.query('SELECT COUNT(*) FROM products');
    if (parseInt(count.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO products (name, description, price, stock_quantity, category) VALUES
        ('Laptop Pro', 'High-performance laptop', 1299.99, 50, 'Electronics'),
        ('Wireless Mouse', 'Ergonomic wireless mouse', 29.99, 200, 'Accessories'),
        ('USB-C Cable', 'Fast charging cable', 12.99, 500, 'Accessories'),
        ('Keyboard Mechanical', 'RGB mechanical keyboard', 89.99, 100, 'Accessories'),
        ('Monitor 4K', '27-inch 4K display', 399.99, 75, 'Electronics')
      `);
      console.log('✅ Sample products inserted');
    }
    console.log('✅ Database initialized');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
  }
};

initDB();

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'product-service',
    timestamp: new Date().toISOString()
  });
});

// Get all products
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY id');
    res.json({ products: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products', message: error.message });
  }
});

// Get product by ID
app.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ product: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product', message: error.message });
  }
});

// Create product
app.post('/', async (req, res) => {
  try {
    const { name, description, price, stockQuantity, category } = req.body;
    const result = await pool.query(
      'INSERT INTO products (name, description, price, stock_quantity, category) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description, price, stockQuantity, category]
    );
    res.status(201).json({ product: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product', message: error.message });
  }
});

// Update product
app.put('/:id', async (req, res) => {
  try {
    const { name, description, price, stockQuantity, category } = req.body;
    const result = await pool.query(
      'UPDATE products SET name = $1, description = $2, price = $3, stock_quantity = $4, category = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
      [name, description, price, stockQuantity, category, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ product: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product', message: error.message });
  }
});

// Delete product
app.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted', product: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product', message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Product Service listening on port ${PORT}`);
});
