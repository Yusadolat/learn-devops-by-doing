require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Service URLs (from environment variables)
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3001';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://order-service:3003';

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString()
  });
});

// Route: User Service
app.use('/api/users', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${USER_SERVICE_URL}${req.url}`,
      data: req.body,
      headers: {
        ...req.headers,
        host: undefined // Remove original host header
      }
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error proxying to user service:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'User service unavailable',
      message: error.message
    });
  }
});

// Route: Product Service
app.use('/api/products', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${PRODUCT_SERVICE_URL}${req.url}`,
      data: req.body,
      headers: {
        ...req.headers,
        host: undefined
      }
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error proxying to product service:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Product service unavailable',
      message: error.message
    });
  }
});

// Route: Order Service
app.use('/api/orders', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${ORDER_SERVICE_URL}${req.url}`,
      data: req.body,
      headers: {
        ...req.headers,
        host: undefined
      }
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error proxying to order service:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Order service unavailable',
      message: error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Gateway listening on port ${PORT}`);
  console.log(`📡 User Service URL: ${USER_SERVICE_URL}`);
  console.log(`📡 Product Service URL: ${PRODUCT_SERVICE_URL}`);
  console.log(`📡 Order Service URL: ${ORDER_SERVICE_URL}`);
});
