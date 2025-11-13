# Week 3: Kubernetes Basics

## 🎯 Learning Objectives

By the end of this week, you will:
- ✅ Understand Kubernetes architecture and core concepts
- ✅ Create and manage Pods
- ✅ Deploy applications using Deployments
- ✅ Expose services using ClusterIP, NodePort, and LoadBalancer
- ✅ Manage configuration with ConfigMaps and Secrets
- ✅ Organize resources using Namespaces
- ✅ Debug and troubleshoot Kubernetes applications

## 📚 Prerequisites

- Completed Week 1 & 2 (Docker fundamentals)
- Kubernetes cluster access (minikube, kind, or cloud provider)
- kubectl installed and configured
- Basic understanding of YAML

## 🛠️ Setup Instructions

### Option 1: Using Minikube (Recommended for Local)

```bash
# Install minikube (macOS)
brew install minikube

# Start cluster
minikube start --driver=docker

# Verify cluster is running
kubectl cluster-info
kubectl get nodes
```

### Option 2: Using kind (Kubernetes in Docker)

```bash
# Install kind
brew install kind

# Create cluster
kind create cluster --name learn-devops

# Verify
kubectl cluster-info
kubectl get nodes
```

### Option 3: Using Cloud Provider

If you have AWS, GCP, or Azure access, you can use their managed Kubernetes services (EKS, GKE, AKS). We'll cover this more in Week 7.

## 📖 Quick Kubernetes Concepts

### What is Kubernetes?

Kubernetes (K8s) is a container orchestration platform that automates:
- Deployment
- Scaling
- Management
- Networking
- Storage

### Core Components

1. **Pod**: Smallest deployable unit (one or more containers)
2. **Deployment**: Manages Pod replicas and updates
3. **Service**: Exposes Pods to network traffic
4. **ConfigMap**: Configuration data
5. **Secret**: Sensitive data (passwords, tokens)
6. **Namespace**: Virtual cluster for resource isolation

## 🏋️ Exercises

### Exercise 1: Your First Pod

**Objective**: Create a simple Pod and understand Pod lifecycle.

**Tasks**:

1. Create a Pod manifest for the nginx web server:

```yaml
# Create file: pod-nginx.yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-pod
  labels:
    app: nginx
spec:
  containers:
  - name: nginx
    image: nginx:1.25-alpine
    ports:
    - containerPort: 80
```

2. Deploy the Pod:

```bash
kubectl apply -f pod-nginx.yaml
```

3. Verify Pod is running:

```bash
# Check Pod status
kubectl get pods

# Get detailed information
kubectl describe pod nginx-pod

# Check Pod logs
kubectl logs nginx-pod

# Execute command inside Pod
kubectl exec -it nginx-pod -- sh
# Inside the container, try: curl localhost
# Type 'exit' to leave
```

4. Port-forward to access the Pod:

```bash
# Forward local port 8080 to Pod port 80
kubectl port-forward nginx-pod 8080:80

# In another terminal or browser, visit:
# http://localhost:8080
```

5. Clean up:

```bash
kubectl delete pod nginx-pod
```

**Questions**:
- What happens if the container crashes?
- How would you run multiple replicas of this Pod?
- Is a Pod accessible from outside the cluster?

---

### Exercise 2: Multi-Container Pod

**Objective**: Understand multi-container Pods and container communication.

**Tasks**:

1. Create a Pod with two containers sharing a volume:

```yaml
# Create file: pod-multi-container.yaml
apiVersion: v1
kind: Pod
metadata:
  name: multi-container-pod
spec:
  volumes:
  - name: shared-data
    emptyDir: {}
  
  containers:
  - name: nginx
    image: nginx:1.25-alpine
    volumeMounts:
    - name: shared-data
      mountPath: /usr/share/nginx/html
  
  - name: content-updater
    image: alpine:3.18
    volumeMounts:
    - name: shared-data
      mountPath: /html
    command: ["/bin/sh"]
    args:
    - -c
    - |
      while true; do
        echo "Updated at $(date)" > /html/index.html
        sleep 10
      done
```

2. Deploy and test:

```bash
kubectl apply -f pod-multi-container.yaml

# Wait for Pod to be ready
kubectl get pods -w

# Port forward and check in browser
kubectl port-forward multi-container-pod 8080:80

# Check logs from specific container
kubectl logs multi-container-pod -c nginx
kubectl logs multi-container-pod -c content-updater
```

3. Clean up:

```bash
kubectl delete pod multi-container-pod
```

**Key Learning**: Containers in the same Pod share:
- Network namespace (localhost communication)
- Storage volumes
- Pod lifecycle

---

### Exercise 3: Your First Deployment

**Objective**: Create a Deployment and understand replica management.

**Tasks**:

1. Create a Deployment for the Product Service:

```yaml
# Create file: deployment-product-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: product-service
  labels:
    app: product-service
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
        image: node:18-alpine
        command: ["sh", "-c", "echo 'Product Service Running' && sleep 3600"]
        ports:
        - containerPort: 3002
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
```

2. Deploy and observe:

```bash
kubectl apply -f deployment-product-service.yaml

# Watch Pods being created
kubectl get pods -w

# Get deployment status
kubectl get deployment product-service

# Get detailed info
kubectl describe deployment product-service
```

3. Test self-healing:

```bash
# Delete a Pod
kubectl delete pod <pod-name>

# Watch Kubernetes automatically recreate it
kubectl get pods -w
```

4. Scale the Deployment:

```bash
# Scale to 5 replicas
kubectl scale deployment product-service --replicas=5

# Verify
kubectl get pods

# Scale back down
kubectl scale deployment product-service --replicas=2
```

5. Update the Deployment:

```bash
# Edit the deployment (change the echo message)
kubectl edit deployment product-service

# Or update using apply
# (modify the YAML file and reapply)
kubectl apply -f deployment-product-service.yaml

# Watch the rolling update
kubectl rollout status deployment product-service

# Check rollout history
kubectl rollout history deployment product-service
```

6. Clean up:

```bash
kubectl delete deployment product-service
```

**Questions**:
- What's the difference between a Pod and a Deployment?
- What happens during a rolling update?
- How does Kubernetes ensure the desired number of replicas?

---

### Exercise 4: ClusterIP Service

**Objective**: Expose Pods internally within the cluster.

**Tasks**:

1. First, deploy the Product Service again:

```bash
kubectl apply -f deployment-product-service.yaml
```

2. Create a ClusterIP Service:

```yaml
# Create file: service-product-clusterip.yaml
apiVersion: v1
kind: Service
metadata:
  name: product-service
spec:
  type: ClusterIP
  selector:
    app: product-service
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3002
```

3. Deploy the Service:

```bash
kubectl apply -f service-product-clusterip.yaml

# Get Service details
kubectl get service product-service
kubectl describe service product-service
```

4. Test internal connectivity:

```bash
# Create a test Pod to curl the service
kubectl run test-pod --image=alpine:3.18 --rm -it --restart=Never -- sh

# Inside the Pod, install curl and test
apk add curl
curl product-service

# Try the FQDN (Fully Qualified Domain Name)
curl product-service.default.svc.cluster.local
```

**Key Learning**: ClusterIP Services:
- Only accessible within the cluster
- Get a stable cluster IP
- Load balance across Pod replicas
- Use DNS for service discovery

---

### Exercise 5: NodePort Service

**Objective**: Expose a service on each node's IP at a static port.

**Tasks**:

1. Create a NodePort Service:

```yaml
# Create file: service-product-nodeport.yaml
apiVersion: v1
kind: Service
metadata:
  name: product-service-nodeport
spec:
  type: NodePort
  selector:
    app: product-service
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3002
    nodePort: 30080  # Optional: specify port (30000-32767)
```

2. Deploy and test:

```bash
kubectl apply -f service-product-nodeport.yaml

# Get the NodePort
kubectl get service product-service-nodeport

# For minikube, get the URL
minikube service product-service-nodeport --url

# Access in browser or curl
curl $(minikube service product-service-nodeport --url)
```

**Key Learning**: NodePort Services:
- Accessible from outside the cluster
- Each node listens on the specified port
- Port range: 30000-32767
- Good for development, not ideal for production

---

### Exercise 6: ConfigMaps

**Objective**: Manage application configuration externally.

**Tasks**:

1. Create a ConfigMap with application settings:

```yaml
# Create file: configmap-app-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  APP_NAME: "E-Commerce Platform"
  APP_ENV: "development"
  LOG_LEVEL: "debug"
  DATABASE_HOST: "postgres-service"
  DATABASE_PORT: "5432"
  config.json: |
    {
      "features": {
        "enableCache": true,
        "enableMetrics": true,
        "maxRetries": 3
      }
    }
```

2. Deploy ConfigMap:

```bash
kubectl apply -f configmap-app-config.yaml

# View ConfigMap
kubectl get configmap app-config
kubectl describe configmap app-config
```

3. Use ConfigMap in a Deployment:

```yaml
# Create file: deployment-with-configmap.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-with-config
spec:
  replicas: 2
  selector:
    matchLabels:
      app: demo-app
  template:
    metadata:
      labels:
        app: demo-app
    spec:
      containers:
      - name: app
        image: alpine:3.18
        command: ["/bin/sh", "-c"]
        args:
        - |
          echo "App Name: $APP_NAME"
          echo "Environment: $APP_ENV"
          echo "Log Level: $LOG_LEVEL"
          echo "Config file contents:"
          cat /config/config.json
          sleep 3600
        env:
        - name: APP_NAME
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: APP_NAME
        - name: APP_ENV
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: APP_ENV
        - name: LOG_LEVEL
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: LOG_LEVEL
        volumeMounts:
        - name: config-volume
          mountPath: /config
      volumes:
      - name: config-volume
        configMap:
          name: app-config
          items:
          - key: config.json
            path: config.json
```

4. Deploy and verify:

```bash
kubectl apply -f deployment-with-configmap.yaml

# Check Pod logs to see environment variables
kubectl logs -l app=demo-app

# Exec into Pod and check mounted file
kubectl exec -it <pod-name> -- cat /config/config.json
```

---

### Exercise 7: Secrets

**Objective**: Securely manage sensitive data.

**Tasks**:

1. Create a Secret for database credentials:

```bash
# Create Secret using kubectl (recommended for sensitive data)
kubectl create secret generic db-credentials \
  --from-literal=username=admin \
  --from-literal=password=SuperSecret123!

# View Secret (encoded)
kubectl get secret db-credentials -o yaml

# Decode Secret value
kubectl get secret db-credentials -o jsonpath='{.data.password}' | base64 --decode
```

2. Alternatively, create Secret from YAML (not recommended for real secrets):

```yaml
# Create file: secret-db-credentials.yaml
# Note: These values are base64 encoded, NOT encrypted!
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials-yaml
type: Opaque
data:
  username: YWRtaW4=        # base64("admin")
  password: U3VwZXJTZWNyZXQxMjMh  # base64("SuperSecret123!")
```

3. Use Secret in a Deployment:

```yaml
# Create file: deployment-with-secret.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-with-secret
spec:
  replicas: 1
  selector:
    matchLabels:
      app: secure-app
  template:
    metadata:
      labels:
        app: secure-app
    spec:
      containers:
      - name: app
        image: alpine:3.18
        command: ["/bin/sh", "-c"]
        args:
        - |
          echo "Connecting to database..."
          echo "Username: $DB_USERNAME"
          echo "Password: $DB_PASSWORD"
          echo "Secret file content:"
          cat /secrets/username
          sleep 3600
        env:
        - name: DB_USERNAME
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: username
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: password
        volumeMounts:
        - name: secret-volume
          mountPath: /secrets
          readOnly: true
      volumes:
      - name: secret-volume
        secret:
          secretName: db-credentials
```

4. Deploy and verify:

```bash
kubectl apply -f deployment-with-secret.yaml

# Check logs (be careful not to expose secrets!)
kubectl logs -l app=secure-app
```

**Security Best Practices**:
- ❌ Don't commit Secrets to Git
- ✅ Use external secret management (AWS Secrets Manager, HashiCorp Vault)
- ✅ Enable encryption at rest
- ✅ Use RBAC to restrict Secret access

---

### Exercise 8: Namespaces

**Objective**: Organize resources and isolate environments.

**Tasks**:

1. Create Namespaces for different environments:

```bash
# Create namespaces
kubectl create namespace development
kubectl create namespace staging
kubectl create namespace production

# List namespaces
kubectl get namespaces
```

2. Or use YAML:

```yaml
# Create file: namespaces.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: development
  labels:
    environment: dev
---
apiVersion: v1
kind: Namespace
metadata:
  name: staging
  labels:
    environment: staging
---
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    environment: prod
```

3. Deploy resources to specific namespaces:

```bash
# Deploy to development namespace
kubectl apply -f deployment-product-service.yaml -n development

# Deploy to production namespace
kubectl apply -f deployment-product-service.yaml -n production

# List Pods in specific namespace
kubectl get pods -n development
kubectl get pods -n production

# List all Pods across all namespaces
kubectl get pods --all-namespaces
# or
kubectl get pods -A
```

4. Set default namespace for kubectl:

```bash
# Set default namespace
kubectl config set-context --current --namespace=development

# Verify
kubectl config view --minify | grep namespace

# Now kubectl commands use 'development' by default
kubectl get pods
```

5. Access services across namespaces:

Services can be accessed using DNS:
- Same namespace: `service-name`
- Different namespace: `service-name.namespace-name.svc.cluster.local`

```bash
# Example: access product-service in development from default namespace
curl product-service.development.svc.cluster.local
```

---

### Exercise 9: Real Application Deployment

**Objective**: Deploy the complete Product Service with all components.

**Tasks**:

1. Create a complete manifest for Product Service:

```yaml
# Create file: product-service-complete.yaml
---
apiVersion: v1
kind: Namespace
metadata:
  name: ecommerce

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: product-config
  namespace: ecommerce
data:
  PORT: "3002"
  NODE_ENV: "production"
  LOG_LEVEL: "info"

---
apiVersion: v1
kind: Secret
metadata:
  name: product-secrets
  namespace: ecommerce
type: Opaque
stringData:
  DATABASE_URL: "postgresql://user:pass@postgres:5432/products"

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: product-service
  namespace: ecommerce
  labels:
    app: product-service
    tier: backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: product-service
  template:
    metadata:
      labels:
        app: product-service
        tier: backend
    spec:
      containers:
      - name: product-service
        image: node:18-alpine
        ports:
        - containerPort: 3002
        env:
        - name: PORT
          valueFrom:
            configMapKeyRef:
              name: product-config
              key: PORT
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: product-config
              key: NODE_ENV
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: product-secrets
              key: DATABASE_URL
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3002
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3002
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: product-service
  namespace: ecommerce
spec:
  selector:
    app: product-service
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3002
  type: ClusterIP
```

2. Deploy everything:

```bash
kubectl apply -f product-service-complete.yaml

# Verify all resources
kubectl get all -n ecommerce

# Check ConfigMap and Secret
kubectl get configmap -n ecommerce
kubectl get secret -n ecommerce

# Describe the Deployment
kubectl describe deployment product-service -n ecommerce
```

---

## 🐛 Troubleshooting Guide

### Pod is in Pending state

```bash
kubectl describe pod <pod-name>
# Look for: Insufficient CPU/memory, or node issues
```

### Pod is in CrashLoopBackOff

```bash
kubectl logs <pod-name>
kubectl logs <pod-name> --previous  # Check previous crash logs
```

### Service not accessible

```bash
# Check if Service endpoints are populated
kubectl get endpoints <service-name>

# Verify labels match
kubectl get pods --show-labels
kubectl describe service <service-name>
```

### ConfigMap or Secret not found

```bash
kubectl get configmap
kubectl get secret
# Ensure they're in the correct namespace
```

## 📝 Self-Assessment Questions

Answer these to verify your understanding:

1. **Conceptual**:
   - What is the difference between a Pod and a Deployment?
   - When would you use ClusterIP vs NodePort vs LoadBalancer?
   - Why should Secrets not be stored in Git?
   - What is the purpose of Namespaces?

2. **Practical**:
   - How do you scale a Deployment to 10 replicas?
   - How do you expose a Deployment as a Service?
   - How do you access a Secret value from a Pod?
   - How do you check the logs of a specific container in a multi-container Pod?

3. **Troubleshooting**:
   - A Pod is in "ImagePullBackOff" status. What's wrong?
   - Pods are running but Service is not routing traffic. What to check?
   - How do you roll back a Deployment to the previous version?

## 🎯 Week 3 Challenge

**Build a complete microservice stack in Kubernetes**:

1. Deploy all 4 services (API Gateway, User, Product, Order)
2. Create ConfigMaps for each service
3. Create Secrets for database credentials
4. Expose services appropriately (ClusterIP for internal, NodePort for external)
5. Organize everything in an "ecommerce" namespace
6. Scale services to 3 replicas each
7. Verify services can communicate with each other

**Bonus**:
- Add health check probes
- Set resource requests and limits
- Add labels and annotations
- Create a diagram of your architecture

## 📚 Additional Resources

- [Official Kubernetes Docs](https://kubernetes.io/docs/home/)
- [Kubernetes Basics Tutorial](https://kubernetes.io/docs/tutorials/kubernetes-basics/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [Play with Kubernetes](https://labs.play-with-k8s.com/)

## ✅ Checklist

Before moving to Week 4, ensure you can:

- [ ] Create and manage Pods
- [ ] Deploy applications using Deployments
- [ ] Scale Deployments up and down
- [ ] Create ClusterIP and NodePort Services
- [ ] Use ConfigMaps for configuration
- [ ] Use Secrets for sensitive data
- [ ] Organize resources using Namespaces
- [ ] Debug Pods using logs and describe
- [ ] Understand Pod lifecycle and self-healing

## 🚀 What's Next?

Week 4 will cover:
- Ingress Controllers
- StatefulSets for databases
- PersistentVolumes and PersistentVolumeClaims
- Helm Charts
- Advanced networking

---

**Ready to level up?** Start with Exercise 1 and work your way through! 💪

Need help? Check the `solutions/` folder or ask questions!
