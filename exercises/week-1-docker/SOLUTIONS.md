# Week 1 Solutions - Try Before Looking!

## Exercise 1 & 2: Basic Dockerfile

### API Gateway / User Service / Product Service / Order Service

All services use a similar pattern:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application code
COPY . .

# Expose port (adjust per service: 3000, 3001, 3002, 3003)
EXPOSE 3000

# Start command
CMD ["npm", "start"]
```

**Why this works**: Simple and functional, but not optimized

---

## Exercise 3: Optimized Multi-Stage Dockerfile

### For API Gateway:

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY . .

# Run any build steps if needed
# RUN npm run build (if you had TypeScript or build process)

# Stage 2: Production
FROM node:18-alpine AS production

# Create app user (security best practice)
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app .

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "server.js"]
```

**Key improvements**:
- ✅ Multi-stage build (builder + production)
- ✅ Smaller final image (only production deps)
- ✅ Non-root user (security)
- ✅ Health check included
- ✅ npm cache cleaned

---

## Dockerfile per Service

### User Service (Port 3001)

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

FROM node:18-alpine AS production
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY --from=builder --chown=nodejs:nodejs /app .
USER nodejs
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
CMD ["node", "server.js"]
```

### Product Service (Port 3002)

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

FROM node:18-alpine AS production
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY --from=builder --chown=nodejs:nodejs /app .
USER nodejs
EXPOSE 3002
HEALTHCHECK --interval=30s --timeout=3s \
  CMD node -e "require('http').get('http://localhost:3002/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
CMD ["node", "server.js"]
```

### Order Service (Port 3003)

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

FROM node:18-alpine AS production
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY --from=builder --chown=nodejs:nodejs /app .
USER nodejs
EXPOSE 3003
HEALTHCHECK --interval=30s --timeout=3s \
  CMD node -e "require('http').get('http://localhost:3003/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
CMD ["node", "server.js"]
```

---

## Exercise 5: Docker Networking

### Complete Working Example

```bash
# 1. Create network
docker network create ecommerce-network

# 2. Start PostgreSQL
docker run -d \
  --name postgres \
  --network ecommerce-network \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ecommerce \
  -p 5432:5432 \
  postgres:15-alpine

# 3. Start Redis (for Order Service)
docker run -d \
  --name redis \
  --network ecommerce-network \
  -p 6379:6379 \
  redis:7-alpine

# 4. Start User Service
docker run -d \
  --name user-service \
  --network ecommerce-network \
  -e DB_HOST=postgres \
  -e DB_PORT=5432 \
  -e DB_NAME=ecommerce \
  -e DB_USER=postgres \
  -e DB_PASSWORD=postgres \
  -e JWT_SECRET=your-secret-key \
  -p 3001:3001 \
  user-service:v1

# 5. Start Product Service
docker run -d \
  --name product-service \
  --network ecommerce-network \
  -e DB_HOST=postgres \
  -e DB_PORT=5432 \
  -e DB_NAME=ecommerce \
  -e DB_USER=postgres \
  -e DB_PASSWORD=postgres \
  -p 3002:3002 \
  product-service:v1

# 6. Start Order Service
docker run -d \
  --name order-service \
  --network ecommerce-network \
  -e DB_HOST=postgres \
  -e DB_PORT=5432 \
  -e DB_NAME=ecommerce \
  -e DB_USER=postgres \
  -e DB_PASSWORD=postgres \
  -e REDIS_URL=redis://redis:6379 \
  -p 3003:3003 \
  order-service:v1

# 7. Start API Gateway
docker run -d \
  --name api-gateway \
  --network ecommerce-network \
  -e USER_SERVICE_URL=http://user-service:3001 \
  -e PRODUCT_SERVICE_URL=http://product-service:3002 \
  -e ORDER_SERVICE_URL=http://order-service:3003 \
  -p 3000:3000 \
  api-gateway:v1

# 8. Test everything
curl http://localhost:3000/health
curl http://localhost:3000/api/products
```

---

## Image Size Comparison

After optimization, you should see:

```bash
$ docker images

REPOSITORY         TAG              SIZE
api-gateway        v1               ~200MB
api-gateway        v2-optimized     ~80MB  (60% reduction!)
user-service       v1               ~85MB
product-service    v1               ~85MB
order-service      v1               ~90MB
```

---

## 🎯 Self-Check

Before moving to Week 2, ensure you can answer:

1. ✅ Why copy package.json before application code?
   - **Answer**: Layer caching - dependencies change less frequently than code

2. ✅ What's the difference between COPY and ADD?
   - **Answer**: COPY is simpler, ADD can extract tarballs and fetch URLs

3. ✅ Why use multi-stage builds?
   - **Answer**: Smaller images, remove build tools from production

4. ✅ What does USER nodejs do?
   - **Answer**: Runs container as non-root for security

5. ✅ How do containers communicate on same network?
   - **Answer**: By container name (Docker DNS)

---

**Remember**: These are solutions. Learn by typing, not copy-pasting! 🚀

**Next**: Week 2 - Docker Compose to simplify this entire setup!
