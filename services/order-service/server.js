require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const { Pool } = require('pg');
const redis = require('redis');

const app = express();
const PORT = process.env.PORT || 3003;

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

// Redis client for caching
let redisClient;
(async () => {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    await redisClient.connect();
    console.log('✅ Redis connected');
  } catch (error) {
    console.log('⚠️  Redis not available:', error.message);
  }
})();

// Initialize database
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id),
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price DECIMAL(10, 2) NOT NULL
      )
    `);
    
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
    service: 'order-service',
    redis: redisClient?.isOpen ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Create order
app.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const { userId, items } = req.body; // items: [{productId, quantity, price}]
    
    await client.query('BEGIN');
    
    // Calculate total
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Insert order
    const orderResult = await client.query(
      'INSERT INTO orders (user_id, total_amount) VALUES ($1, $2) RETURNING *',
      [userId, totalAmount]
    );
    
    const order = orderResult.rows[0];
    
    // Insert order items
    for (const item of items) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [order.id, item.productId, item.quantity, item.price]
      );
    }
    
    await client.query('COMMIT');
    
    // Invalidate cache
    if (redisClient?.isOpen) {
      await redisClient.del(`user_orders:${userId}`);
    }
    
    res.status(201).json({ order });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to create order', message: error.message });
  } finally {
    client.release();
  }
});

// Get user orders
app.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const cacheKey = `user_orders:${userId}`;
    
    // Check cache
    if (redisClient?.isOpen) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return res.json({ orders: JSON.parse(cached), source: 'cache' });
      }
    }
    
    // Query database
    const result = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    // Cache results
    if (redisClient?.isOpen && result.rows.length > 0) {
      await redisClient.setEx(cacheKey, 300, JSON.stringify(result.rows)); // 5 min cache
    }
    
    res.json({ orders: result.rows, source: 'database' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders', message: error.message });
  }
});

// Get order details
app.get('/:id', async (req, res) => {
  try {
    const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const itemsResult = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [req.params.id]);
    
    res.json({
      order: orderResult.rows[0],
      items: itemsResult.rows
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order', message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Order Service listening on port ${PORT}`);
});
