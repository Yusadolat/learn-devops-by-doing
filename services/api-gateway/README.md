# API Gateway Service

## Overview

The API Gateway acts as a single entry point for all client requests. It routes traffic to appropriate microservices and provides cross-cutting concerns like rate limiting, CORS, and logging.

## Architecture Pattern

- **Pattern**: API Gateway / BFF (Backend for Frontend)
- **Port**: 3000
- **Dependencies**: User Service, Product Service, Order Service

## Endpoints

### Health Check
- `GET /health` - Returns service health status

### Routed Endpoints
- `ALL /api/users/*` → User Service (port 3001)
- `ALL /api/products/*` → Product Service (port 3002)
- `ALL /api/orders/*` → Order Service (port 3003)

## Features

✅ Request routing and proxying
✅ Rate limiting (100 requests/15 min per IP)
✅ CORS enabled
✅ Security headers (Helmet)
✅ Request logging (Morgan)
✅ Error handling

## Environment Variables

```env
PORT=3000
USER_SERVICE_URL=http://user-service:3001
PRODUCT_SERVICE_URL=http://product-service:3002
ORDER_SERVICE_URL=http://order-service:3003
```

## Local Development

```bash
# Install dependencies
npm install

# Start service
npm start

# Development with auto-reload
npm run dev
```

## Docker

```bash
# Build image
docker build -t api-gateway:v1 .

# Run container
docker run -p 3000:3000 \
  -e USER_SERVICE_URL=http://user-service:3001 \
  -e PRODUCT_SERVICE_URL=http://product-service:3002 \
  -e ORDER_SERVICE_URL=http://order-service:3003 \
  api-gateway:v1
```

## Testing

```bash
# Health check
curl http://localhost:3000/health

# Test routing
curl http://localhost:3000/api/products
```

## Key Learning Points

- **Service Discovery**: How services find each other
- **Load Balancing**: Can add multiple backend instances
- **API Versioning**: Can route /v1, /v2 to different services
- **Authentication**: Can add JWT validation middleware
- **Monitoring**: Central point for metrics/logging
