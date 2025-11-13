# Week 2: Docker Compose Mastery

## 🎯 Learning Objectives

By the end of this week, you will:
- ✅ Understand Docker Compose concepts
- ✅ Run entire microservices stack with one command
- ✅ Manage service dependencies and startup order
- ✅ Configure volumes for data persistence
- ✅ Use networks for service isolation
- ✅ Create development vs production configs

## 📚 What is Docker Compose?

Docker Compose is a tool for defining and running multi-container applications. Instead of running 10+ docker commands, you run ONE command: `docker compose up`

## 🏋️ Exercises

### Exercise 1: Understanding the Compose File (Est. time: 45 min)

**Goal**: Learn docker-compose.yml structure

**Task**: Analyze the provided compose file at `infrastructure/docker/docker-compose.yml`

**Study these sections**:

1. **Services**: Each microservice definition
2. **Networks**: How services communicate
3. **Volumes**: Data persistence
4. **Environment Variables**: Service configuration
5. **Dependencies**: Service startup order
6. **Health Checks**: Service readiness detection

**Questions to answer**:
1. Why does user-service depend on postgres health check?
2. What happens if you remove the depends_on clause?
3. How do services find each other by name?
4. Where is database data stored?

**✅ Checkpoint**: You understand every line in docker-compose.yml

---

### Exercise 2: Run the Complete Stack (Est. time: 30 min)

**Goal**: Start all services with one command

**Steps**:

```bash
# Navigate to compose directory
cd infrastructure/docker

# Start everything
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f

# Test the stack
curl http://localhost:3000/health
curl http://localhost:3000/api/products
```

**Expected**: All services show "Up" status

**✅ Checkpoint**: Entire stack running with single command

---

### Exercise 3: Service Dependencies (Est. time: 1 hour)

**Goal**: Understand and fix dependency issues

**Challenge**: Break and fix service dependencies

**Task 1**: Remove health check from postgres
- Comment out the healthcheck section
- Restart: `docker compose up -d`
- What happens? Why do services fail?

**Task 2**: Start services in wrong order
```bash
docker compose up api-gateway  # Try starting gateway first
```
- Observe the error
- Understand why order matters

**Task 3**: Add restart policies
- Modify compose file to add `restart: on-failure`
- Test by killing a service
- Watch it auto-restart

**✅ Checkpoint**: You understand service orchestration

---

### Exercise 4: Environment Management (Est. time: 1 hour)

**Goal**: Create development vs production configs

**Task**: Create two compose files:
1. `docker-compose.dev.yml` - Development setup
2. `docker-compose.prod.yml` - Production-ready

**Development features**:
- Volume mounts for hot-reload
- Debug ports exposed
- More verbose logging
- Development database

**Production features**:
- No volume mounts
- Resource limits (CPU/memory)
- Health checks with retries
- Production database settings

**Test both**:
```bash
# Development
docker compose -f docker-compose.dev.yml up -d

# Production
docker compose -f docker-compose.prod.yml up -d
```

**✅ Checkpoint**: Separate configs for dev and prod

---

### Exercise 5: Volumes and Data Persistence (Est. time: 45 min)

**Goal**: Understand data persistence

**Experiment**:

1. Start stack and create some data:
```bash
docker compose up -d

# Register a user
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

2. Stop and remove containers:
```bash
docker compose down
```

3. Start again:
```bash
docker compose up -d
```

**Question**: Is your user still there? Why?

4. Now destroy volumes:
```bash
docker compose down -v  # -v removes volumes
docker compose up -d
```

**Question**: Is your user still there? Why not?

**✅ Checkpoint**: You understand named volumes vs anonymous volumes

---

### Exercise 6: Scaling Services (Est. time: 30 min)

**Goal**: Learn horizontal scaling

**Task**: Scale product service to 3 instances

```bash
docker compose up -d --scale product-service=3

# Check
docker compose ps | grep product-service

# Test load balancing
for i in {1..10}; do
  curl http://localhost:3002/health
  echo ""
done
```

**Challenge**: Add nginx load balancer to distribute traffic

**✅ Checkpoint**: Services can scale horizontally

---

## 🎓 Key Concepts Learned

1. **Service Orchestration**: Managing multiple containers
2. **Dependency Management**: Service startup order
3. **Network Isolation**: Custom networks for security
4. **Volume Management**: Data persistence patterns
5. **Environment Separation**: Dev vs Prod configurations
6. **Health Checks**: Service readiness detection
7. **Resource Limits**: CPU/Memory constraints

## 📝 Docker Compose Commands Cheatsheet

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# Stop and remove volumes
docker compose down -v

# View logs
docker compose logs -f [service]

# Restart specific service
docker compose restart user-service

# Rebuild and start
docker compose up -d --build

# Scale service
docker compose up -d --scale product-service=3

# Run command in service
docker compose exec user-service sh

# View service config
docker compose config
```

## 🐛 Common Issues

### Issue 1: "network not found"
```bash
docker compose down
docker compose up -d
```

### Issue 2: Port conflict
```bash
# Change port mapping in compose file
ports:
  - "3001:3001"  # Change left side (host port)
```

### Issue 3: Service can't connect
- Check service names match container names
- Verify network configuration
- Check environment variables

## 📝 Deliverables

By end of Week 2:

- [ ] Complete docker-compose.yml understanding
- [ ] Can start/stop entire stack with one command
- [ ] Created dev and prod compose files
- [ ] Understand volumes and persistence
- [ ] Can scale services

## ⏭️ What's Next?

**Week 3**: Kubernetes
- Deploy to K8s cluster
- Learn Pods, Deployments, Services
- Configure Ingress
- Implement auto-scaling

---

**Pro Tip**: Docker Compose is perfect for local development and small deployments. For production at scale, you'll move to Kubernetes (Week 3-4)! 🚀
