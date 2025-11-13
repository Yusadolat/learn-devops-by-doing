# Order Service

## Overview
Order processing with Redis caching for performance.

## Port
3003

## Endpoints
- `POST /` - Create order
- `GET /user/:userId` - Get user orders (with caching)
- `GET /:id` - Get order details
- `GET /health` - Health check

## Database Schema
```sql
orders (id, user_id, total_amount, status, created_at, updated_at)
order_items (id, order_id, product_id, quantity, price)
```

## Key Technologies
- Express.js
- PostgreSQL (orders storage)
- Redis (caching)
- Database transactions

## Caching Strategy
- User orders cached for 5 minutes
- Cache invalidated on new order
- Falls back to database if Redis unavailable

## Learn About
- Database transactions
- Caching strategies
- Cache invalidation
- Performance optimization
