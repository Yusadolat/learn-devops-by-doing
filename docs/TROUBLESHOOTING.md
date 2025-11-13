# 🐛 Troubleshooting Guide

## Common Issues and Solutions

### Docker Issues

#### 1. "Cannot connect to the Docker daemon"

**Error**: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock`

**Cause**: Docker Desktop is not running

**Solution**:
```bash
# Mac: Open Docker Desktop from Applications
# Check status
docker info
```

---

#### 2. "Port is already allocated"

**Error**: `Bind for 0.0.0.0:3000 failed: port is already allocated`

**Cause**: Another process is using the port

**Solution**:
```bash
# Find what's using the port
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change port in docker-compose.yml
ports:
  - "3001:3000"  # Use different host port
```

---

#### 3. "Image build failed"

**Error**: Various errors during `docker build`

**Common causes and fixes**:

**A. Network timeout**:
```bash
# Retry build
docker build --no-cache -t service:v1 .
```

**B. Cached layer issues**:
```bash
# Build without cache
docker build --no-cache -t service:v1 .
```

**C. Permission denied**:
```bash
# Check Dockerfile USER directive
# Ensure files are readable
chmod +r file.txt
```

---

#### 4. Container exits immediately

**Symptoms**: Container starts then stops

**Debug steps**:
```bash
# Check logs
docker logs <container-name>

# Run interactively
docker run -it <image> /bin/sh

# Check entry point
docker inspect <image> | grep -A 5 Cmd
```

**Common causes**:
- Application crashed (check logs)
- No process running (need CMD or ENTRYPOINT)
- Missing dependencies

---

### Docker Compose Issues

#### 5. "Network not found"

**Error**: `network <name> not found`

**Solution**:
```bash
# Remove and recreate
docker compose down
docker compose up -d
```

---

#### 6. "Service unhealthy"

**Symptoms**: Service marked as unhealthy

**Debug**:
```bash
# Check health check logs
docker inspect <container> | grep -A 20 Health

# Exec into container
docker compose exec service-name sh

# Test health endpoint manually
curl http://localhost:3000/health
```

**Common causes**:
- Wrong port in health check
- Service taking too long to start
- Database not ready

**Fix**:
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 30s
  timeout: 10s
  retries: 5
  start_period: 40s  # Increase this!
```

---

#### 7. Services can't communicate

**Symptoms**: "Connection refused" or "Host not found"

**Cause**: Wrong service name or network config

**Solution**:
```bash
# Check service is on same network
docker compose ps
docker network inspect <network-name>

# Use correct service name (from docker-compose.yml)
# NOT localhost, use: http://user-service:3001
```

---

### Database Issues

#### 8. "Database connection refused"

**Error**: `ECONNREFUSED` or `Connection refused`

**Debug checklist**:
```bash
# 1. Is PostgreSQL running?
docker compose ps postgres

# 2. Check logs
docker compose logs postgres

# 3. Verify connection details
docker compose exec service-name sh
env | grep DB_

# 4. Test connection from container
docker compose exec user-service sh
nc -zv postgres 5432
```

**Common causes**:
- PostgreSQL not started (check depends_on)
- Wrong DB_HOST (should be service name)
- Wrong credentials
- Database not created

---

#### 9. "Database doesn't exist"

**Error**: `database "ecommerce" does not exist`

**Solution**:
```bash
# Check POSTGRES_DB environment variable
docker compose exec postgres psql -U postgres -c "\l"

# Create database manually if needed
docker compose exec postgres psql -U postgres -c "CREATE DATABASE ecommerce;"
```

---

#### 10. "Too many connections"

**Error**: `remaining connection slots are reserved`

**Cause**: Connection pool exhaustion

**Solutions**:

**A. Close connections properly**:
```javascript
// Always use connection pools
// Always release connections
client.release()
```

**B. Increase PostgreSQL max connections**:
```yaml
postgres:
  command: postgres -c max_connections=200
```

---

### Application Issues

#### 11. "Cannot find module"

**Error**: `Error: Cannot find module 'express'`

**Cause**: Dependencies not installed in container

**Solution**:
```dockerfile
# Ensure package.json is copied and installed
COPY package*.json ./
RUN npm install
COPY . .
```

**Rebuild**:
```bash
docker compose up -d --build
```

---

#### 12. Environment variables not working

**Symptoms**: Defaults used instead of env vars

**Debug**:
```bash
# Check environment inside container
docker compose exec service-name sh
env | grep PORT

# Check docker-compose.yml environment section
docker compose config
```

**Solution**:
```yaml
# Ensure env vars are set correctly
environment:
  PORT: 3001
  DB_HOST: postgres  # NOT localhost!
```

---

#### 13. "502 Bad Gateway" from API Gateway

**Cause**: Backend service not reachable

**Debug**:
```bash
# Check backend service is running
docker compose ps

# Check gateway logs
docker compose logs api-gateway

# Test backend directly
curl http://localhost:3001/health

# Check gateway can reach backend (from inside container)
docker compose exec api-gateway sh
curl http://user-service:3001/health
```

---

### Performance Issues

#### 14. Slow builds

**Solution**:
```dockerfile
# Use .dockerignore
node_modules
.git
*.log

# Layer caching
COPY package*.json ./
RUN npm install  # This layer caches!
COPY . .
```

---

#### 15. High memory usage

**Solution**:
```yaml
# Add resource limits
services:
  user-service:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
```

---

### Mac-Specific Issues

#### 16. M1/M2 Architecture Issues

**Error**: `exec format error`

**Cause**: Image built for wrong architecture

**Solution**:
```bash
# Build for ARM64
docker build --platform linux/arm64 -t service:v1 .

# Or use multi-arch
docker buildx build --platform linux/amd64,linux/arm64 -t service:v1 .
```

---

#### 17. File permission issues

**Error**: `Permission denied` when accessing files

**Solution**:
```bash
# Fix permissions
chmod -R 755 directory/

# Or in Dockerfile
RUN chown -R node:node /app
USER node
```

---

## General Debugging Workflow

When something doesn't work:

1. **Check logs**:
   ```bash
   docker compose logs -f [service-name]
   ```

2. **Check container status**:
   ```bash
   docker compose ps
   ```

3. **Exec into container**:
   ```bash
   docker compose exec service-name sh
   ```

4. **Test connectivity**:
   ```bash
   # From inside container
   nc -zv postgres 5432
   curl http://user-service:3001/health
   ```

5. **Verify environment**:
   ```bash
   # Check env vars
   docker compose exec service-name env
   ```

6. **Restart service**:
   ```bash
   docker compose restart service-name
   ```

7. **Rebuild if needed**:
   ```bash
   docker compose up -d --build service-name
   ```

---

## Getting More Help

### Enable Debug Logging

**Application**:
```javascript
// Add more logging
console.log('Config:', {
  port: process.env.PORT,
  dbHost: process.env.DB_HOST
});
```

**Docker Compose**:
```bash
# Verbose output
docker compose --verbose up
```

### Clean Slate Approach

When all else fails:

```bash
# Nuclear option - reset everything
docker compose down -v
docker system prune -a
docker compose up -d --build
```

---

## Resources

- Docker docs: https://docs.docker.com
- Docker Compose docs: https://docs.docker.com/compose
- Node.js best practices: https://github.com/goldbergyoni/nodebestpractices
- PostgreSQL docs: https://www.postgresql.org/docs

---

**Remember**: Errors are learning opportunities! Read error messages carefully, they usually tell you exactly what's wrong. 🐛 → 🦋
