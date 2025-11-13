# Product Service

## Overview
Product catalog management with CRUD operations.

## Port
3002

## Endpoints
- `GET /` - Get all products
- `GET /:id` - Get product by ID
- `POST /` - Create product
- `PUT /:id` - Update product
- `DELETE /:id` - Delete product
- `GET /health` - Health check

## Database Schema
```sql
products (
  id, name, description, price,
  stock_quantity, category,
  created_at, updated_at
)
```

## Sample Data
Includes 5 sample products on initialization.

## Key Technologies
- Express.js
- PostgreSQL

## Learn About
- REST API design
- CRUD operations
- Database queries
