# Week 3 Solutions

## Exercise 1: Your First Pod - Solutions

### Questions Answers:

**Q: What happens if the container crashes?**
A: The Pod will show status "Error" or "CrashLoopBackOff". Kubernetes will try to restart the container multiple times. However, since Pods don't have self-healing for replicas, if you delete the Pod entirely, it won't be recreated automatically.

**Q: How would you run multiple replicas of this Pod?**
A: You can't run multiple replicas with just a Pod. You need a Deployment, which manages multiple Pod replicas and provides self-healing, rolling updates, and scaling capabilities.

**Q: Is a Pod accessible from outside the cluster?**
A: No, by default Pods are only accessible within the cluster. To access from outside, you need to:
- Use `kubectl port-forward` (development only)
- Create a Service with type NodePort or LoadBalancer
- Use an Ingress controller

---

## Exercise 3: Deployment - Solutions

### Questions Answers:

**Q: What's the difference between a Pod and a Deployment?**
A: 
- **Pod**: Basic unit, runs containers, no self-healing
- **Deployment**: Manages Pods, provides:
  - Multiple replicas
  - Self-healing (recreates failed Pods)
  - Rolling updates
  - Rollback capability
  - Declarative updates

**Q: What happens during a rolling update?**
A: 
1. New Pods are created with the updated image
2. Once new Pods are ready, old Pods are terminated
3. Process continues until all Pods are updated
4. Ensures zero downtime
5. RollingUpdate strategy (maxSurge, maxUnavailable) controls the pace

**Q: How does Kubernetes ensure the desired number of replicas?**
A: The Deployment controller continuously watches the actual state and compares it to the desired state. If there's a mismatch (Pod crashes, node fails), it automatically creates new Pods to match the desired replica count.

---

## Self-Assessment Answers

### 1. Conceptual Questions

**Q: What is the difference between a Pod and a Deployment?**
A: Pod is the smallest deployable unit in Kubernetes. Deployment is a higher-level abstraction that manages Pods, providing features like scaling, self-healing, and rolling updates.

**Q: When would you use ClusterIP vs NodePort vs LoadBalancer?**
A:
- **ClusterIP**: Internal service communication only (microservices calling each other)
- **NodePort**: Expose service on each node's IP (development, testing, or when you manage your own load balancer)
- **LoadBalancer**: Production external access (cloud providers provision actual load balancers)

**Q: Why should Secrets not be stored in Git?**
A: 
- Secrets are only base64 encoded, not encrypted
- Git history is permanent - even if deleted later, secrets remain in history
- Public repos expose secrets to everyone
- Better to use external secret management (AWS Secrets Manager, Vault)

**Q: What is the purpose of Namespaces?**
A:
- Organize resources logically (dev, staging, prod)
- Resource isolation and access control
- Resource quotas and limits per namespace
- Multiple teams can work in same cluster without conflicts

### 2. Practical Questions

**Q: How do you scale a Deployment to 10 replicas?**
A:
```bash
kubectl scale deployment <deployment-name> --replicas=10
```

**Q: How do you expose a Deployment as a Service?**
A:
```bash
kubectl expose deployment <deployment-name> --port=80 --target-port=3002 --type=ClusterIP
```

**Q: How do you access a Secret value from a Pod?**
A: Two ways:
1. As environment variable:
```yaml
env:
- name: DB_PASSWORD
  valueFrom:
    secretKeyRef:
      name: db-credentials
      key: password
```

2. As mounted file:
```yaml
volumeMounts:
- name: secret-volume
  mountPath: /etc/secrets
volumes:
- name: secret-volume
  secret:
    secretName: db-credentials
```

**Q: How do you check the logs of a specific container in a multi-container Pod?**
A:
```bash
kubectl logs <pod-name> -c <container-name>
```

### 3. Troubleshooting Questions

**Q: A Pod is in "ImagePullBackOff" status. What's wrong?**
A: Common causes:
- Image doesn't exist in the registry
- Image tag is incorrect
- Private registry requires authentication (imagePullSecrets)
- Network issues accessing the registry

Check with:
```bash
kubectl describe pod <pod-name>
# Look for "Failed to pull image" errors
```

**Q: Pods are running but Service is not routing traffic. What to check?**
A:
1. Check if Service has endpoints:
```bash
kubectl get endpoints <service-name>
```

2. Verify labels match between Service selector and Pod labels:
```bash
kubectl get pods --show-labels
kubectl describe service <service-name>
```

3. Check if Pods are ready:
```bash
kubectl get pods
```

**Q: How do you roll back a Deployment to the previous version?**
A:
```bash
# Rollback to previous version
kubectl rollout undo deployment/<deployment-name>

# Rollback to specific revision
kubectl rollout undo deployment/<deployment-name> --to-revision=2

# Check rollout history
kubectl rollout history deployment/<deployment-name>
```

---

## Week 3 Challenge - Sample Solution

Here's a sample solution for deploying all 4 microservices:

```yaml
# complete-ecommerce.yaml
---
apiVersion: v1
kind: Namespace
metadata:
  name: ecommerce
  labels:
    environment: production

---
# ConfigMap for API Gateway
apiVersion: v1
kind: ConfigMap
metadata:
  name: api-gateway-config
  namespace: ecommerce
data:
  PORT: "3000"
  NODE_ENV: "production"
  USER_SERVICE_URL: "http://user-service"
  PRODUCT_SERVICE_URL: "http://product-service"
  ORDER_SERVICE_URL: "http://order-service"

---
# Secrets for database
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
  namespace: ecommerce
type: Opaque
stringData:
  POSTGRES_USER: "admin"
  POSTGRES_PASSWORD: "SuperSecret123!"
  POSTGRES_DB: "ecommerce"

---
# API Gateway Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: ecommerce
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: api-gateway:latest
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: api-gateway-config
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"

---
# API Gateway Service (NodePort for external access)
apiVersion: v1
kind: Service
metadata:
  name: api-gateway
  namespace: ecommerce
spec:
  type: NodePort
  selector:
    app: api-gateway
  ports:
  - port: 80
    targetPort: 3000
    nodePort: 30000

---
# User Service Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
  namespace: ecommerce
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
    spec:
      containers:
      - name: user-service
        image: user-service:latest
        ports:
        - containerPort: 3001
        env:
        - name: PORT
          value: "3001"
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: POSTGRES_USER
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: POSTGRES_PASSWORD
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"

---
# User Service (ClusterIP - internal only)
apiVersion: v1
kind: Service
metadata:
  name: user-service
  namespace: ecommerce
spec:
  type: ClusterIP
  selector:
    app: user-service
  ports:
  - port: 80
    targetPort: 3001

---
# Product Service Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: product-service
  namespace: ecommerce
spec:
  replicas: 3
  selector:
    matchLabels:
      app: product-service
  template:
    metadata:
      labels:
        app: product-service
    spec:
      containers:
      - name: product-service
        image: product-service:latest
        ports:
        - containerPort: 3002
        env:
        - name: PORT
          value: "3002"
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: POSTGRES_USER
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: POSTGRES_PASSWORD
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"

---
# Product Service (ClusterIP - internal only)
apiVersion: v1
kind: Service
metadata:
  name: product-service
  namespace: ecommerce
spec:
  type: ClusterIP
  selector:
    app: product-service
  ports:
  - port: 80
    targetPort: 3002

---
# Order Service Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
  namespace: ecommerce
spec:
  replicas: 3
  selector:
    matchLabels:
      app: order-service
  template:
    metadata:
      labels:
        app: order-service
    spec:
      containers:
      - name: order-service
        image: order-service:latest
        ports:
        - containerPort: 3003
        env:
        - name: PORT
          value: "3003"
        - name: REDIS_HOST
          value: "redis-service"
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: POSTGRES_USER
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: POSTGRES_PASSWORD
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"

---
# Order Service (ClusterIP - internal only)
apiVersion: v1
kind: Service
metadata:
  name: order-service
  namespace: ecommerce
spec:
  type: ClusterIP
  selector:
    app: order-service
  ports:
  - port: 80
    targetPort: 3003
```

### Deploy Everything:

```bash
kubectl apply -f complete-ecommerce.yaml

# Verify all resources
kubectl get all -n ecommerce

# Check ConfigMaps and Secrets
kubectl get configmap -n ecommerce
kubectl get secret -n ecommerce

# Test connectivity
kubectl port-forward -n ecommerce service/api-gateway 8080:80
```

### Architecture Diagram:

```
┌─────────────────────────────────────────────────┐
│              Kubernetes Cluster                 │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │      Namespace: ecommerce              │   │
│  │                                         │   │
│  │  ┌──────────────┐                      │   │
│  │  │ API Gateway  │ :30000 (NodePort)    │   │
│  │  │ (3 replicas) │                      │   │
│  │  └──────┬───────┘                      │   │
│  │         │                               │   │
│  │    ┌────┴─────┬──────────────┐         │   │
│  │    │          │              │         │   │
│  │  ┌─▼──┐    ┌─▼──┐       ┌──▼──┐      │   │
│  │  │User│    │Prod│       │Order│      │   │
│  │  │Svc │    │Svc │       │ Svc │      │   │
│  │  │(3) │    │(3) │       │ (3) │      │   │
│  │  └────┘    └────┘       └──┬──┘      │   │
│  │                             │         │   │
│  │                          ┌──▼───┐    │   │
│  │                          │Redis │    │   │
│  │                          └──────┘    │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### Verification Steps:

```bash
# 1. Check all Pods are running
kubectl get pods -n ecommerce

# 2. Check Services
kubectl get svc -n ecommerce

# 3. Test API Gateway
kubectl port-forward -n ecommerce service/api-gateway 8080:80
curl http://localhost:8080/health

# 4. Test service-to-service communication
kubectl run test-pod -n ecommerce --image=alpine:3.18 --rm -it --restart=Never -- sh
apk add curl
curl http://user-service/health
curl http://product-service/health
curl http://order-service/health
```

---

## Common Mistakes and Tips

### Mistake 1: Labels Don't Match
```yaml
# Wrong - Service selector doesn't match Pod labels
spec:
  selector:
    app: product      # ❌ Wrong label
  template:
    metadata:
      labels:
        app: product-service  # Different label
```

### Mistake 2: Wrong Target Port
```yaml
# Wrong - Service targets wrong port
spec:
  ports:
  - port: 80
    targetPort: 3000  # ❌ But container uses 3002
```

### Mistake 3: Namespace Mismatch
```bash
# Wrong - Resource and command in different namespaces
kubectl apply -f deployment.yaml -n prod
kubectl get pods -n dev  # ❌ Looking in wrong namespace
```

### Best Practices

1. **Always use labels consistently**
2. **Use namespaces to organize resources**
3. **Set resource requests and limits**
4. **Use health checks (liveness and readiness probes)**
5. **Never commit Secrets to Git**
6. **Use descriptive names for resources**
7. **Add annotations for documentation**

---

Congratulations! You've completed Week 3! 🎉

Ready for Week 4: Advanced Kubernetes? 🚀
