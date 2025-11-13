# Kubernetes Infrastructure

This directory contains Kubernetes manifests for deploying the e-commerce microservices platform.

## Directory Structure

```
kubernetes/
├── base/                          # Base manifests (reusable)
│   ├── product-deployment.yaml   # Product Service deployment
│   └── product-service.yaml      # Product Service ClusterIP
└── README.md                      # This file
```

## Quick Deploy

### Deploy Product Service

```bash
# Deploy everything
kubectl apply -f base/

# Verify deployment
kubectl get all

# Check if Pods are running
kubectl get pods

# Check Service
kubectl get service product-service
```

### Access the Service

```bash
# Port forward to access locally
kubectl port-forward service/product-service 8080:80

# Test in browser or curl
curl http://localhost:8080
```

## Manifest Explanations

### product-deployment.yaml

This Deployment manifest creates:
- **3 replicas** of the Product Service for high availability
- **Resource limits** (CPU: 500m, Memory: 512Mi) to prevent resource starvation
- **Health checks**:
  - Liveness probe: Restarts container if unhealthy
  - Readiness probe: Removes from Service if not ready
- **Environment variables** from ConfigMaps and Secrets

Key features:
```yaml
replicas: 3                    # High availability
imagePullPolicy: IfNotPresent  # Use local image if available
resources:                     # Resource management
  requests:                    # Minimum guaranteed
    cpu: 100m
    memory: 128Mi
  limits:                      # Maximum allowed
    cpu: 500m
    memory: 512Mi
```

### product-service.yaml

This Service manifest creates:
- **ClusterIP** service (internal access only)
- Maps port 80 to container port 3002
- Routes traffic to Pods with label `app: product-service`

## Usage Patterns

### Development

For local development with real containers:

```bash
# Build local image first
cd services/product-service
docker build -t product-service:latest .

# Deploy to Kubernetes
kubectl apply -f infrastructure/kubernetes/base/

# Watch Pods start
kubectl get pods -w

# View logs
kubectl logs -l app=product-service --all-containers=true
```

### Testing ConfigMaps and Secrets

```bash
# Create ConfigMap
kubectl create configmap product-config \
  --from-literal=PORT=3002 \
  --from-literal=NODE_ENV=production

# Create Secret
kubectl create secret generic product-secrets \
  --from-literal=DATABASE_URL=postgresql://user:pass@postgres:5432/products

# Verify
kubectl get configmap product-config
kubectl get secret product-secrets
```

### Scaling

```bash
# Scale to 5 replicas
kubectl scale deployment product-service --replicas=5

# Verify
kubectl get pods

# Watch scaling in action
kubectl get pods -w
```

### Updates and Rollbacks

```bash
# Update image version
kubectl set image deployment/product-service \
  product-service=product-service:v2

# Watch rolling update
kubectl rollout status deployment/product-service

# Check history
kubectl rollout history deployment/product-service

# Rollback if needed
kubectl rollout undo deployment/product-service
```

## Common Commands

### Get Resources
```bash
kubectl get all
kubectl get deployments
kubectl get pods
kubectl get services
kubectl get configmaps
kubectl get secrets
```

### Describe Resources
```bash
kubectl describe deployment product-service
kubectl describe pod <pod-name>
kubectl describe service product-service
```

### Logs and Debugging
```bash
# View logs
kubectl logs -l app=product-service

# Follow logs
kubectl logs -f <pod-name>

# Previous logs (for crashed containers)
kubectl logs --previous <pod-name>

# Shell into container
kubectl exec -it <pod-name> -- sh
```

### Cleanup
```bash
# Delete all resources
kubectl delete -f base/

# Or delete specific resource
kubectl delete deployment product-service
kubectl delete service product-service
```

## Environment-Specific Deployments

For different environments, you can:

1. **Use Namespaces**:
```bash
kubectl create namespace production
kubectl apply -f base/ -n production
```

2. **Use Kustomize** (Week 4):
```
kubernetes/
├── base/
└── overlays/
    ├── dev/
    ├── staging/
    └── production/
```

3. **Use Helm Charts** (Week 4):
```bash
helm install product-service ./charts/product-service \
  --values values-production.yaml
```

## Resource Limits Guide

### Small Service (API, light processing)
```yaml
resources:
  requests:
    memory: "64Mi"
    cpu: "50m"
  limits:
    memory: "128Mi"
    cpu: "100m"
```

### Medium Service (typical microservice)
```yaml
resources:
  requests:
    memory: "128Mi"
    cpu: "100m"
  limits:
    memory: "256Mi"
    cpu: "500m"
```

### Large Service (heavy processing, caching)
```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "1Gi"
    cpu: "1000m"
```

## Health Check Best Practices

### Liveness Probe
- Checks if container is alive
- Restarts container if fails
- Use for detecting deadlocks

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3002
  initialDelaySeconds: 30  # Wait for app to start
  periodSeconds: 10         # Check every 10s
  timeoutSeconds: 5         # Wait 5s for response
  failureThreshold: 3       # Restart after 3 failures
```

### Readiness Probe
- Checks if container is ready for traffic
- Removes from Service if fails
- Use for warm-up periods

```yaml
readinessProbe:
  httpGet:
    path: /ready
    port: 3002
  initialDelaySeconds: 5   # Quick check
  periodSeconds: 5          # Check often
  timeoutSeconds: 3
  failureThreshold: 3
```

## Troubleshooting

### Pods Not Starting

```bash
# Check events
kubectl describe pod <pod-name>

# Common issues:
# - ImagePullBackOff: Image doesn't exist
# - CrashLoopBackOff: Container keeps crashing
# - Pending: Insufficient resources
```

### Service Not Working

```bash
# Check if Service has endpoints
kubectl get endpoints product-service

# If no endpoints, labels might not match
kubectl get pods --show-labels
kubectl describe service product-service
```

### Out of Resources

```bash
# Check node resources
kubectl top nodes

# Check Pod resources
kubectl top pods

# Describe node for details
kubectl describe node <node-name>
```

## Next Steps

Week 4 will introduce:
- **Ingress Controllers** for HTTP routing
- **StatefulSets** for stateful applications
- **PersistentVolumes** for data storage
- **Helm Charts** for package management

---

For detailed exercises, see: `exercises/week-3-k8s/README.md`
