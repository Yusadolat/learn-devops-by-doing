# Week 1: Docker Fundamentals

## 🎯 Learning Objectives

By the end of this week, you will:
- ✅ Write Dockerfiles for Node.js applications
- ✅ Understand Docker image layers and optimization
- ✅ Build and run containers locally
- ✅ Debug containerized applications
- ✅ Implement proper health checks

## 📚 Prerequisites

Before starting, ensure you have:
- Docker Desktop installed and running
- Node.js 18+ installed (for local testing)
- Basic understanding of JavaScript/Node.js
- A code editor (VS Code recommended)

## 🏋️ Exercises

### Exercise 1: Dockerize the API Gateway (Est. time: 1 hour)

**Goal**: Create your first Dockerfile for the API Gateway service

**Steps**:

1. Navigate to `services/api-gateway/`
2. Create a file named `Dockerfile` (no extension)
3. Follow these requirements:
   - Use Node.js 18 Alpine as base image
   - Copy package files first (for layer caching)
   - Install dependencies
   - Copy application code
   - Expose port 3000
   - Set the start command

**Hints**:
```dockerfile
# Start with: FROM node:18-alpine
# Remember: WORKDIR sets working directory
# Use: COPY package*.json before copying all code
# Don't forget: npm install
# Expose: The port your app runs on
# CMD: The command to start your app
```

**Test your work**:
```bash
# Build the image
docker build -t api-gateway:v1 .

# Run the container
docker run -p 3000:3000 --name api-gateway api-gateway:v1

# Test it
curl http://localhost:3000/health
```

**Expected output**: `{"status":"healthy","service":"api-gateway",...}`

**✅ Checkpoint**: Can you successfully build and run the API Gateway container?

---

### Exercise 2: Dockerize User Service (Est. time: 45 minutes)

**Goal**: Apply what you learned to another service with database dependency

**Steps**:

1. Navigate to `services/user-service/`
2. Create a `Dockerfile` similar to Exercise 1
3. Note: This service needs PostgreSQL, but we'll handle that in Week 2

**Key Differences**:
- Port 3001 (not 3000)
- Needs `DB_*` environment variables
- Will fail to start without database (expected for now!)

**Test your work**:
```bash
docker build -t user-service:v1 .

# This will fail - that's OK! Read the error message
docker run -p 3001:3001 --name user-service user-service:v1

# You should see: "Database initialization failed"
```

**✅ Checkpoint**: Image builds successfully, but container fails because no database exists

---

### Exercise 3: Optimize with Multi-Stage Build (Est. time: 1 hour)

**Goal**: Learn image optimization and security best practices

**Challenge**: Reduce API Gateway image size by 50%+

**Current image size**:
```bash
docker images api-gateway:v1
# You'll see something like: 200MB+
```

**Your task**: Create a new Dockerfile with these optimizations:
1. Use multi-stage build (builder + production)
2. Only copy node_modules production dependencies
3. Use smaller base image for production
4. Run as non-root user
5. Add health check

**Template**:
```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
# ... copy and install ALL dependencies ...

# Stage 2: Production
FROM node:18-alpine AS production
# ... copy only what's needed ...
USER node
HEALTHCHECK --interval=30s --timeout=3s \
  CMD node healthcheck.js || exit 1
```

**Test optimization**:
```bash
docker build -t api-gateway:v2-optimized .
docker images | grep api-gateway

# Compare sizes - v2 should be much smaller!
```

**✅ Checkpoint**: New image is 50%+ smaller and runs as non-root

---

### Exercise 4: Dockerize Remaining Services (Est. time: 2 hours)

**Goal**: Practice makes perfect

**Your task**: Create Dockerfiles for:
- Product Service (port 3002)
- Order Service (port 3003)

**Requirements for each**:
- Use multi-stage build pattern from Exercise 3
- Include health checks
- Run as non-root user
- Optimize image size

**Test all services**:
```bash
cd services/product-service
docker build -t product-service:v1 .

cd ../order-service
docker build -t order-service:v1 .
```

**✅ Checkpoint**: All 4 backend services have optimized Dockerfiles

---

### Exercise 5: Docker Networking Basics (Est. time: 45 minutes)

**Goal**: Understand how containers communicate

**Steps**:

1. Create a Docker network:
```bash
docker network create ecommerce-network
```

2. Run PostgreSQL:
```bash
docker run -d \
  --name postgres \
  --network ecommerce-network \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ecommerce \
  -p 5432:5432 \
  postgres:15-alpine
```

3. Run User Service with network:
```bash
docker run -d \
  --name user-service \
  --network ecommerce-network \
  -e DB_HOST=postgres \
  -e DB_PORT=5432 \
  -e DB_NAME=ecommerce \
  -e DB_USER=postgres \
  -e DB_PASSWORD=postgres \
  -p 3001:3001 \
  user-service:v1
```

4. Test the connection:
```bash
# Check logs
docker logs user-service

# Test endpoint
curl -X POST http://localhost:3001/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**✅ Checkpoint**: User Service successfully connects to PostgreSQL and registers users

---

## 🎓 Key Concepts Learned

After completing Week 1, you should understand:

1. **Docker Images vs Containers**
   - Image = Blueprint (immutable)
   - Container = Running instance (ephemeral)

2. **Layer Caching**
   - Why we copy package.json before code
   - How to optimize build times

3. **Multi-Stage Builds**
   - Separate build and production stages
   - Reduce final image size
   - Remove build tools from production

4. **Docker Networking**
   - Containers can talk via network names
   - Port mapping: host:container
   - Bridge networks for isolation

5. **Environment Variables**
   - Configuration via `-e` flag
   - Separating config from code

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot connect to Docker daemon"
**Solution**: Ensure Docker Desktop is running

### Issue 2: "Port 3000 already allocated"
**Solution**:
```bash
docker ps -a  # Find the container
docker rm -f <container-id>  # Remove it
```

### Issue 3: Image builds slowly
**Solution**: Use layer caching - copy package.json first!

### Issue 4: Container exits immediately
**Solution**:
```bash
docker logs <container-name>  # Check logs
docker run -it <image> /bin/sh  # Debug interactively
```

## 📝 Deliverables

By end of Week 1, you should have:

- [ ] 4 Dockerfiles (one per service)
- [ ] All images built successfully
- [ ] User Service connected to PostgreSQL
- [ ] Understanding of Docker basics

## ⏭️ What's Next?

**Week 2**: Docker Compose
- Run entire stack with one command
- Service dependencies
- Volume management
- Development vs Production configs

---

**Need Help?** Check TROUBLESHOOTING.md or create a GitHub issue!

**Pro Tip**: Don't just copy-paste solutions! Type everything manually to build muscle memory. Break things, fix them, learn from mistakes. That's how you become a DevOps engineer! 💪
