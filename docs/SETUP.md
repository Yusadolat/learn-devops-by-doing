# 🚀 Quick Start Guide

## Getting Started in 5 Minutes

### 1. Verify Prerequisites

```bash
# Check Docker
docker --version
# Should show: Docker version 20.x or higher

# Check Docker Compose
docker compose version
# Should show: Docker Compose version v2.x

# Check Node.js (for local development)
node --version
# Should show: v18.x or higher
```

### 2. Clone and Navigate

```bash
cd /path/to/learn-devops
```

### 3. Choose Your Path

#### Option A: Using Docker Compose (Easiest - Week 2)

```bash
# Navigate to Docker Compose directory
cd infrastructure/docker

# Start everything with one command
docker compose up -d

# Check if everything is running
docker compose ps

# View logs
docker compose logs -f

# Test the API
curl http://localhost:3000/health
curl http://localhost:3000/api/products
```

**To stop**:
```bash
docker compose down
```

**To stop and remove volumes (reset database)**:
```bash
docker compose down -v
```

#### Option B: Manual Docker (Week 1 Learning)

Follow the exercises in `exercises/week-1-docker/README.md`

---

## 🧪 Testing Your Setup

### 1. Health Checks

```bash
# API Gateway
curl http://localhost:3000/health

# User Service
curl http://localhost:3001/health

# Product Service
curl http://localhost:3002/health

# Order Service
curl http://localhost:3003/health
```

All should return: `{"status":"healthy",...}`

### 2. Test User Registration

```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

Expected: `{"message":"User registered successfully",...}`

### 3. Test Login

```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Expected: You'll get a JWT token

### 4. Test Products

```bash
# Get all products
curl http://localhost:3000/api/products

# Get specific product
curl http://localhost:3000/api/products/1
```

Expected: JSON with product list/details

### 5. Test Orders

```bash
# Create an order (use token from login)
TOKEN="<your-jwt-token-from-login>"

curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "userId": 1,
    "items": [
      {"productId": 1, "quantity": 2, "price": 1299.99},
      {"productId": 2, "quantity": 1, "price": 29.99}
    ]
  }'
```

---

## 🐛 Troubleshooting

### Issue: Port already in use

```bash
# Find what's using the port
lsof -i :3000  # Or :3001, :3002, etc.

# Kill the process
kill -9 <PID>

# Or stop Docker containers
docker compose down
```

### Issue: Database connection failed

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check logs
docker logs ecommerce-postgres

# Restart services
docker compose restart
```

### Issue: Services can't reach each other

```bash
# Check network
docker network inspect learn-devops_ecommerce-network

# Restart with fresh network
docker compose down
docker compose up -d
```

### Issue: Stale data in database

```bash
# Reset everything
docker compose down -v  # Removes volumes
docker compose up -d    # Fresh start
```

---

## 📊 Useful Commands

### Docker Compose

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f [service-name]

# Restart specific service
docker compose restart user-service

# Rebuild and restart
docker compose up -d --build

# Scale service
docker compose up -d --scale user-service=3
```

### Docker

```bash
# List containers
docker ps

# List images
docker images

# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# View container logs
docker logs <container-name>

# Execute command in container
docker exec -it <container-name> sh

# Inspect container
docker inspect <container-name>
```

---

## 🎯 Next Steps

1. **Week 1**: Complete Docker exercises → `exercises/week-1-docker/`
2. **Week 2**: Master Docker Compose → `exercises/week-2-docker/`
3. **Week 3**: Deploy to Kubernetes → `exercises/week-3-k8s/`

---

## 📞 Need Help?

- Check TROUBLESHOOTING.md
- Review exercise READMEs
- Create a GitHub issue
- Ask in Discord community

**Happy Learning! 🚀**
