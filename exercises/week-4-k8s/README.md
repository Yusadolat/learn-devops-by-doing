# Week 4: Advanced Kubernetes

## 🎯 Learning Objectives

By the end of this week, you will:
- ✅ Configure Ingress controllers for HTTP/HTTPS routing
- ✅ Deploy stateful applications using StatefulSets
- ✅ Manage persistent storage with PersistentVolumes and PersistentVolumeClaims
- ✅ Create and deploy Helm charts
- ✅ Implement resource quotas and limits
- ✅ Configure Network Policies for security
- ✅ Understand advanced Kubernetes patterns

## 📚 Prerequisites

- ✅ Completed Week 3 (Pods, Deployments, Services, ConfigMaps, Secrets, Namespaces)
- Kubernetes cluster running (minikube or kind)
- kubectl installed and configured
- Helm 3 installed
- Basic understanding of DNS and HTTP

## 🛠️ Setup Instructions

### Install Helm 3

```bash
# macOS
brew install helm

# Verify installation
helm version
```

### Enable Ingress on Minikube

```bash
# Enable ingress addon
minikube addons enable ingress

# Verify ingress controller is running
kubectl get pods -n ingress-nginx
```

### For kind, install NGINX Ingress

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

# Wait for it to be ready
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=90s
```

## 📖 Advanced Kubernetes Concepts

### What You'll Learn

1. **Ingress**: HTTP(S) routing and load balancing
2. **StatefulSets**: Ordered, stable Pod identities for databases
3. **PersistentVolumes**: Durable storage that survives Pod restarts
4. **Helm**: Kubernetes package manager
5. **Resource Management**: Quotas and limits
6. **Network Policies**: Pod-level firewall rules

## 🏋️ Exercises

### Exercise 1: Ingress Controller

**Objective**: Route HTTP traffic to multiple services using a single entry point.

**Scenario**: You have multiple services (Product, User, Order) and want to expose them all through a single domain with different paths.

**Tasks**:

1. First, ensure you have services running from Week 3:

```bash
# Create the services if not already running
kubectl create namespace ecommerce

# Deploy Product Service
cat << EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: product-service
  namespace: ecommerce
spec:
  replicas: 2
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
        image: hashicorp/http-echo
        args:
        - "-text=Product Service v1.0"
        - "-listen=:3002"
        ports:
        - containerPort: 3002
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
  - port: 80
    targetPort: 3002
EOF
```

2. Deploy User Service:

```bash
cat << EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
  namespace: ecommerce
spec:
  replicas: 2
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
        image: hashicorp/http-echo
        args:
        - "-text=User Service v1.0"
        - "-listen=:3001"
        ports:
        - containerPort: 3001
---
apiVersion: v1
kind: Service
metadata:
  name: user-service
  namespace: ecommerce
spec:
  selector:
    app: user-service
  ports:
  - port: 80
    targetPort: 3001
EOF
```

3. Create an Ingress resource:

```yaml
# Create file: ingress-ecommerce.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ecommerce-ingress
  namespace: ecommerce
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
  - host: ecommerce.local
    http:
      paths:
      - path: /products
        pathType: Prefix
        backend:
          service:
            name: product-service
            port:
              number: 80
      - path: /users
        pathType: Prefix
        backend:
          service:
            name: user-service
            port:
              number: 80
```

4. Apply the Ingress:

```bash
kubectl apply -f ingress-ecommerce.yaml

# Check Ingress status
kubectl get ingress -n ecommerce
kubectl describe ingress ecommerce-ingress -n ecommerce
```

5. Test the Ingress:

```bash
# Get minikube IP
minikube ip

# Add to /etc/hosts (use sudo)
echo "$(minikube ip) ecommerce.local" | sudo tee -a /etc/hosts

# Test the routes
curl http://ecommerce.local/products
curl http://ecommerce.local/users

# Or use kubectl port-forward
kubectl port-forward -n ingress-nginx service/ingress-nginx-controller 8080:80
curl -H "Host: ecommerce.local" http://localhost:8080/products
curl -H "Host: ecommerce.local" http://localhost:8080/users
```

**Key Learning**:
- Ingress provides Layer 7 (HTTP) load balancing
- Single external IP for multiple services
- Path-based and host-based routing
- Annotations for advanced features

---

### Exercise 2: StatefulSet with PostgreSQL

**Objective**: Deploy a stateful database using StatefulSet.

**Why StatefulSet?**
- Stable, unique network identifiers
- Stable persistent storage
- Ordered deployment and scaling
- Ordered updates and rollbacks

**Tasks**:

1. Create a StorageClass (for dynamic provisioning):

```yaml
# Create file: storageclass.yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-storage
provisioner: k8s.io/minikube-hostpath
volumeBindingMode: Immediate
reclaimPolicy: Retain
```

2. Create a StatefulSet for PostgreSQL:

```yaml
# Create file: postgres-statefulset.yaml
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: ecommerce
  labels:
    app: postgres
spec:
  ports:
  - port: 5432
    name: postgres
  clusterIP: None  # Headless service for StatefulSet
  selector:
    app: postgres
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: ecommerce
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        ports:
        - containerPort: 5432
          name: postgres
        env:
        - name: POSTGRES_DB
          value: ecommerce
        - name: POSTGRES_USER
          value: admin
        - name: POSTGRES_PASSWORD
          value: secret123
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
          subPath: postgres
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: [ "ReadWriteOnce" ]
      storageClassName: fast-storage
      resources:
        requests:
          storage: 1Gi
```

3. Deploy the StatefulSet:

```bash
kubectl apply -f storageclass.yaml
kubectl apply -f postgres-statefulset.yaml

# Watch Pods being created
kubectl get pods -n ecommerce -w

# Check StatefulSet status
kubectl get statefulset -n ecommerce
kubectl get pvc -n ecommerce
kubectl get pv
```

4. Test the PostgreSQL database:

```bash
# Connect to PostgreSQL
kubectl exec -it -n ecommerce postgres-0 -- psql -U admin -d ecommerce

# Inside PostgreSQL:
\l                                    # List databases
CREATE TABLE products (id SERIAL PRIMARY KEY, name VARCHAR(100));
INSERT INTO products (name) VALUES ('Laptop'), ('Mouse');
SELECT * FROM products;
\q

# Delete the Pod and watch it recreate with data intact
kubectl delete pod -n ecommerce postgres-0
kubectl get pods -n ecommerce -w

# Reconnect and verify data persists
kubectl exec -it -n ecommerce postgres-0 -- psql -U admin -d ecommerce -c "SELECT * FROM products;"
```

**Key Learning**:
- StatefulSet provides stable Pod names (postgres-0, postgres-1, etc.)
- Each Pod gets its own PersistentVolume
- Data persists across Pod restarts
- Pods are created/deleted in order

---

### Exercise 3: PersistentVolumes and PersistentVolumeClaims

**Objective**: Understand the storage abstraction in Kubernetes.

**Storage Architecture**:
- **PersistentVolume (PV)**: Cluster-level storage resource
- **PersistentVolumeClaim (PVC)**: User's request for storage
- **StorageClass**: Dynamic provisioner for PVs

**Tasks**:

1. Create a PersistentVolume manually:

```yaml
# Create file: persistent-volume.yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: manual-pv
spec:
  capacity:
    storage: 2Gi
  accessModes:
  - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: manual
  hostPath:
    path: /mnt/data
```

2. Create a PersistentVolumeClaim:

```yaml
# Create file: persistent-volume-claim.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: manual-pvc
  namespace: ecommerce
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
  storageClassName: manual
```

3. Use the PVC in a Pod:

```yaml
# Create file: pod-with-pvc.yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-with-storage
  namespace: ecommerce
spec:
  containers:
  - name: nginx
    image: nginx:1.25-alpine
    volumeMounts:
    - name: storage
      mountPath: /usr/share/nginx/html
  volumes:
  - name: storage
    persistentVolumeClaim:
      claimName: manual-pvc
```

4. Deploy and test:

```bash
kubectl apply -f persistent-volume.yaml
kubectl apply -f persistent-volume-claim.yaml
kubectl apply -f pod-with-pvc.yaml

# Check PV and PVC binding
kubectl get pv
kubectl get pvc -n ecommerce

# Write data to the volume
kubectl exec -n ecommerce nginx-with-storage -- sh -c "echo 'Hello from PV' > /usr/share/nginx/html/index.html"

# Delete Pod and recreate
kubectl delete pod -n ecommerce nginx-with-storage
kubectl apply -f pod-with-pvc.yaml

# Verify data persists
kubectl exec -n ecommerce nginx-with-storage -- cat /usr/share/nginx/html/index.html
```

**Access Modes**:
- **ReadWriteOnce (RWO)**: Single node read-write
- **ReadOnlyMany (ROX)**: Multiple nodes read-only
- **ReadWriteMany (RWX)**: Multiple nodes read-write

**Reclaim Policies**:
- **Retain**: Manual cleanup required
- **Delete**: Automatic deletion
- **Recycle**: Deprecated

---

### Exercise 4: Your First Helm Chart

**Objective**: Package and deploy applications using Helm.

**Tasks**:

1. Create a Helm chart for the Product Service:

```bash
# Create chart structure
helm create product-chart

# This creates:
# product-chart/
# ├── Chart.yaml
# ├── values.yaml
# ├── templates/
# └── charts/
```

2. Customize `Chart.yaml`:

```yaml
# product-chart/Chart.yaml
apiVersion: v2
name: product-chart
description: A Helm chart for Product Service
type: application
version: 0.1.0
appVersion: "1.0"
```

3. Customize `values.yaml`:

```yaml
# product-chart/values.yaml
replicaCount: 3

image:
  repository: hashicorp/http-echo
  pullPolicy: IfNotPresent
  tag: "latest"

service:
  type: ClusterIP
  port: 80
  targetPort: 3002

ingress:
  enabled: false

resources:
  limits:
    cpu: 200m
    memory: 256Mi
  requests:
    cpu: 100m
    memory: 128Mi

env:
  - name: PORT
    value: "3002"
  - name: NODE_ENV
    value: "production"
```

4. Create Deployment template:

```yaml
# product-chart/templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "product-chart.fullname" . }}
  labels:
    {{- include "product-chart.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      {{- include "product-chart.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "product-chart.selectorLabels" . | nindent 8 }}
    spec:
      containers:
      - name: {{ .Chart.Name }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
        imagePullPolicy: {{ .Values.image.pullPolicy }}
        args:
        - "-text=Product Service from Helm"
        - "-listen=:{{ .Values.service.targetPort }}"
        ports:
        - name: http
          containerPort: {{ .Values.service.targetPort }}
          protocol: TCP
        env:
        {{- toYaml .Values.env | nindent 8 }}
        resources:
          {{- toYaml .Values.resources | nindent 10 }}
```

5. Install the Helm chart:

```bash
# Dry run to see what will be created
helm install product-release product-chart --dry-run --debug

# Install for real
helm install product-release product-chart -n ecommerce

# List releases
helm list -n ecommerce

# Check what was created
kubectl get all -n ecommerce -l app.kubernetes.io/name=product-chart
```

6. Upgrade the release:

```bash
# Modify values.yaml (change replicaCount to 5)
helm upgrade product-release product-chart -n ecommerce

# Check rollout
kubectl get pods -n ecommerce

# Rollback if needed
helm rollback product-release -n ecommerce

# View history
helm history product-release -n ecommerce
```

7. Package and share:

```bash
# Package the chart
helm package product-chart

# This creates product-chart-0.1.0.tgz
```

**Key Helm Commands**:
```bash
helm create <name>              # Create new chart
helm install <release> <chart>  # Install chart
helm upgrade <release> <chart>  # Upgrade release
helm rollback <release>         # Rollback release
helm list                       # List releases
helm uninstall <release>        # Remove release
helm package <chart>            # Package chart
```

---

### Exercise 5: Resource Quotas and LimitRanges

**Objective**: Prevent resource exhaustion and ensure fair resource allocation.

**Tasks**:

1. Create a namespace with ResourceQuota:

```yaml
# Create file: resourcequota.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: team-a
---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: team-a-quota
  namespace: team-a
spec:
  hard:
    requests.cpu: "4"
    requests.memory: 8Gi
    limits.cpu: "8"
    limits.memory: 16Gi
    pods: "10"
    services: "5"
    persistentvolumeclaims: "5"
```

2. Create a LimitRange:

```yaml
# Create file: limitrange.yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: team-a-limits
  namespace: team-a
spec:
  limits:
  - max:
      cpu: "2"
      memory: 2Gi
    min:
      cpu: "100m"
      memory: 128Mi
    default:
      cpu: "500m"
      memory: 512Mi
    defaultRequest:
      cpu: "250m"
      memory: 256Mi
    type: Container
```

3. Apply and test:

```bash
kubectl apply -f resourcequota.yaml
kubectl apply -f limitrange.yaml

# Check quota
kubectl describe resourcequota team-a-quota -n team-a
kubectl describe limitrange team-a-limits -n team-a
```

4. Deploy a Pod that violates limits:

```yaml
# Create file: test-pod-too-big.yaml
apiVersion: v1
kind: Pod
metadata:
  name: too-big
  namespace: team-a
spec:
  containers:
  - name: app
    image: nginx:alpine
    resources:
      requests:
        cpu: "3"      # Exceeds max (2 CPU)
        memory: 3Gi   # Exceeds max (2Gi)
```

```bash
kubectl apply -f test-pod-too-big.yaml
# Should fail with error about exceeding limits
```

5. Deploy a valid Pod:

```yaml
# Create file: test-pod-valid.yaml
apiVersion: v1
kind: Pod
metadata:
  name: valid-pod
  namespace: team-a
spec:
  containers:
  - name: app
    image: nginx:alpine
    resources:
      requests:
        cpu: "500m"
        memory: 512Mi
      limits:
        cpu: "1"
        memory: 1Gi
```

```bash
kubectl apply -f test-pod-valid.yaml

# Check quota usage
kubectl describe resourcequota team-a-quota -n team-a
```

**Key Learning**:
- ResourceQuota limits total resources per namespace
- LimitRange sets default and max/min per container
- Prevents single Pod from consuming all resources
- Ensures fair resource distribution

---

### Exercise 6: Network Policies

**Objective**: Implement pod-level firewall rules for security.

**Scenario**: Only allow Product Service to communicate with User Service, block everything else.

**Tasks**:

1. Deploy test services:

```bash
# Deploy frontend, backend, and database pods
kubectl create namespace secure-app

# Frontend
kubectl run frontend -n secure-app --image=nginx:alpine --labels="app=frontend"

# Backend
kubectl run backend -n secure-app --image=nginx:alpine --labels="app=backend"

# Database
kubectl run database -n secure-app --image=nginx:alpine --labels="app=database"

# Expose services
kubectl expose pod frontend -n secure-app --port=80
kubectl expose pod backend -n secure-app --port=80
kubectl expose pod database -n secure-app --port=80
```

2. Test connectivity (before Network Policy):

```bash
# All Pods can communicate (by default)
kubectl exec -n secure-app frontend -- wget -qO- http://backend
kubectl exec -n secure-app frontend -- wget -qO- http://database
kubectl exec -n secure-app backend -- wget -qO- http://database
```

3. Create Network Policy to restrict database access:

```yaml
# Create file: netpol-database.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: database-policy
  namespace: secure-app
spec:
  podSelector:
    matchLabels:
      app: database
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: backend
    ports:
    - protocol: TCP
      port: 80
```

4. Apply and test:

```bash
kubectl apply -f netpol-database.yaml

# Backend can still access database
kubectl exec -n secure-app backend -- wget -qO- --timeout=2 http://database
# Should work

# Frontend cannot access database
kubectl exec -n secure-app frontend -- wget -qO- --timeout=2 http://database
# Should timeout

# Backend can still access frontend (no policy on frontend)
kubectl exec -n secure-app backend -- wget -qO- http://frontend
# Should work
```

5. Create egress policy:

```yaml
# Create file: netpol-frontend-egress.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: frontend-egress
  namespace: secure-app
spec:
  podSelector:
    matchLabels:
      app: frontend
  policyTypes:
  - Egress
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: backend
    ports:
    - protocol: TCP
      port: 80
  - to:  # Allow DNS
    - namespaceSelector: {}
    ports:
    - protocol: UDP
      port: 53
```

```bash
kubectl apply -f netpol-frontend-egress.yaml

# Frontend can access backend
kubectl exec -n secure-app frontend -- wget -qO- --timeout=2 http://backend
# Should work

# Frontend cannot access database
kubectl exec -n secure-app frontend -- wget -qO- --timeout=2 http://database
# Should timeout
```

**Key Learning**:
- Network Policies are namespace-scoped
- Default: All traffic allowed
- Once a policy is applied, only allowed traffic passes
- Ingress: Controls incoming traffic
- Egress: Controls outgoing traffic
- Always allow DNS (UDP port 53) for service discovery

---

## 🎯 Week 4 Challenge

**Build a Production-Ready E-Commerce Platform**:

1. **Deploy Complete Stack with Helm**:
   - Create Helm charts for all 4 microservices
   - Use values.yaml for environment-specific configs
   - Deploy to dev, staging, and prod namespaces

2. **Setup Ingress**:
   - Single domain with path-based routing
   - All services accessible via `/api/products`, `/api/users`, etc.

3. **Persistent Storage**:
   - StatefulSet for PostgreSQL
   - PersistentVolume for file uploads
   - Redis for caching

4. **Security**:
   - Network Policies isolating database
   - ResourceQuotas per namespace
   - LimitRanges for all Pods

5. **Bonus**:
   - TLS/HTTPS on Ingress
   - Horizontal Pod Autoscaler
   - Pod Disruption Budgets
   - Monitoring with Prometheus

---

## 🐛 Troubleshooting Guide

### Ingress Not Working

```bash
# Check ingress controller
kubectl get pods -n ingress-nginx

# Check ingress resource
kubectl describe ingress <name> -n <namespace>

# Check service endpoints
kubectl get endpoints <service> -n <namespace>

# View ingress controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx
```

### StatefulSet Pod Stuck in Pending

```bash
# Check PVC status
kubectl get pvc -n <namespace>

# Check PV availability
kubectl get pv

# Check events
kubectl describe statefulset <name> -n <namespace>

# Common issues:
# - No available PV
# - StorageClass not found
# - Insufficient storage
```

### Helm Release Failed

```bash
# Check release status
helm status <release> -n <namespace>

# View release history
helm history <release> -n <namespace>

# Get values used
helm get values <release> -n <namespace>

# Debug template rendering
helm template <release> <chart> --debug

# Rollback to previous version
helm rollback <release> -n <namespace>
```

### Network Policy Not Blocking Traffic

```bash
# Check if network plugin supports Network Policies
# (Calico, Cilium, Weave support it; Flannel doesn't)

# Check policy
kubectl describe networkpolicy <n> -n <namespace>

# View policy in YAML
kubectl get networkpolicy <n> -n <namespace> -o yaml

# Test with verbose output
kubectl exec <pod> -- wget -O- --timeout=2 http://<target>
```

---

## 📝 Self-Assessment Questions

Answer these to verify your understanding:

### 1. Conceptual Questions

**Ingress**:
- What's the difference between a Service and an Ingress?
- When would you use path-based vs host-based routing?
- What are Ingress annotations used for?

**StatefulSet**:
- How is StatefulSet different from Deployment?
- What are the key features of StatefulSet?
- When should you NOT use StatefulSet?

**Storage**:
- Explain the relationship between PV, PVC, and StorageClass
- What are the three access modes for volumes?
- What's the difference between Retain and Delete reclaim policies?

**Helm**:
- What problems does Helm solve?
- How is Helm different from kubectl apply?
- What's the purpose of values.yaml?

**Resource Management**:
- What's the difference between ResourceQuota and LimitRange?
- Why set both requests and limits?
- What happens if a Pod exceeds its memory limit?

**Network Policies**:
- Are Network Policies stateful or stateless?
- What's the default behavior without any Network Policy?
- Why always allow DNS in egress policies?

### 2. Practical Questions

**Ingress**:
```bash
# How do you view Ingress logs?
# Answer:
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx -f

# How do you test Ingress without DNS?
# Answer:
curl -H "Host: example.com" http://<ingress-ip>/path
```

**StatefulSet**:
```bash
# How do you scale a StatefulSet?
# Answer:
kubectl scale statefulset <name> --replicas=3

# How do you update a StatefulSet?
# Answer:
kubectl set image statefulset/<name> <container>=<new-image>
# Or edit:
kubectl edit statefulset <name>
```

**Helm**:
```bash
# How do you override values during install?
# Answer:
helm install <release> <chart> --set key=value
# Or:
helm install <release> <chart> -f custom-values.yaml

# How do you view what Helm will create before installing?
# Answer:
helm install <release> <chart> --dry-run --debug
```

### 3. Troubleshooting Scenarios

**Scenario 1**: Ingress returns 404 for all paths
- Check if Ingress controller is running
- Verify service exists and has endpoints
- Check Ingress rules match the path
- Verify backend service is healthy

**Scenario 2**: StatefulSet Pod won't start, stuck in Pending
- Check PVC status: `kubectl get pvc`
- Verify StorageClass exists
- Check if PV is available
- Look at events: `kubectl describe pod`

**Scenario 3**: Helm upgrade fails
- Check release status: `helm status`
- View error: `helm upgrade --debug`
- Rollback: `helm rollback`
- Fix values.yaml and retry

**Scenario 4**: Network Policy blocks legitimate traffic
- Check policy selector labels match
- Verify ingress/egress rules
- Remember to allow DNS (UDP 53)
- Test without policy first

---

## 📚 Additional Resources

### Official Documentation
- [Kubernetes Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/)
- [StatefulSets](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/)
- [Persistent Volumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)
- [Helm Documentation](https://helm.sh/docs/)
- [Network Policies](https://kubernetes.io/docs/concepts/services-networking/network-policies/)
- [Resource Quotas](https://kubernetes.io/docs/concepts/policy/resource-quotas/)

### Helm Chart Examples
- [Official Helm Charts](https://github.com/helm/charts)
- [Bitnami Charts](https://github.com/bitnami/charts)
- [Chart Best Practices](https://helm.sh/docs/chart_best_practices/)

### Network Policy Recipes
- [Network Policy Recipes](https://github.com/ahmetb/kubernetes-network-policy-recipes)

### Learning Platforms
- [Kubernetes the Hard Way](https://github.com/kelseyhightower/kubernetes-the-hard-way)
- [Katacoda Kubernetes Scenarios](https://www.katacoda.com/courses/kubernetes)

---

## ✅ Week 4 Checklist

Before moving to Week 5 (CI/CD), ensure you can:

### Ingress
- [ ] Deploy an Ingress controller
- [ ] Create Ingress rules for path-based routing
- [ ] Configure host-based routing
- [ ] Test Ingress with curl or browser
- [ ] Understand Ingress annotations

### StatefulSet
- [ ] Create a StatefulSet
- [ ] Understand Pod naming (pod-0, pod-1, etc.)
- [ ] Scale StatefulSet up and down
- [ ] Deploy a database with StatefulSet
- [ ] Verify data persistence across Pod restarts

### Storage
- [ ] Create PersistentVolumes manually
- [ ] Create PersistentVolumeClaims
- [ ] Understand access modes (RWO, ROX, RWX)
- [ ] Configure StorageClass for dynamic provisioning
- [ ] Use PVCs in Pods and StatefulSets

### Helm
- [ ] Create a Helm chart from scratch
- [ ] Customize values.yaml
- [ ] Install a chart
- [ ] Upgrade a release
- [ ] Rollback a release
- [ ] Package and share charts

### Resource Management
- [ ] Create ResourceQuotas
- [ ] Create LimitRanges
- [ ] Set resource requests and limits
- [ ] Monitor quota usage
- [ ] Understand difference between requests and limits

### Network Policies
- [ ] Create ingress Network Policies
- [ ] Create egress Network Policies
- [ ] Test policy enforcement
- [ ] Allow DNS in egress policies
- [ ] Debug Network Policy issues

---

## 🚀 What's Next?

Week 5 & 6 will cover:
- **CI/CD Pipelines** with GitHub Actions
- **Automated Docker builds**
- **Push to ECR/DockerHub**
- **Automated testing**
- **Deployment to Kubernetes**
- **Canary and Blue-Green deployments**
- **GitOps with ArgoCD**

---

## 💡 Pro Tips

### Ingress Tips
1. Always test with curl first before browser (caching issues)
2. Use `--dry-run` to validate Ingress before applying
3. Check ingress controller logs for debugging
4. Use annotations for SSL redirect, rate limiting, etc.

### StatefulSet Tips
1. Always use headless service (clusterIP: None)
2. Use volumeClaimTemplates for automatic PVC creation
3. Scale down carefully (data loss risk)
4. Use init containers for initialization tasks

### Helm Tips
1. Use `helm lint` to validate charts
2. Use `helm template` to preview manifests
3. Always version your charts (Chart.yaml)
4. Use `--dry-run` before actual installation
5. Keep values.yaml simple and well-documented

### Storage Tips
1. Use StorageClass for dynamic provisioning
2. Set proper reclaim policy (Retain for production)
3. Always set resource requests in PVC
4. Use subPath to avoid permission issues

### Resource Management Tips
1. Always set requests (for scheduling)
2. Set limits to prevent resource exhaustion
3. Monitor actual usage: `kubectl top pods`
4. Use Vertical Pod Autoscaler for recommendations

### Network Policy Tips
1. Start permissive, then restrict gradually
2. Always allow DNS (UDP 53)
3. Test without policies first
4. Use labels consistently for selectors
5. Document your policies

---

## 🎓 Advanced Challenge

**Deploy a Complete Production Stack**:

```
┌─────────────────────────────────────────────────┐
│              Ingress Controller                 │
│         (ecommerce.local)                      │
└─────────────┬───────────────────────────────────┘
              │
     ┌────────┴─────────┬──────────────┐
     │                  │              │
┌────▼─────┐   ┌───────▼──┐   ┌──────▼────┐
│ Frontend │   │  API GW  │   │  Grafana  │
│ (Helm)   │   │  (Helm)  │   │  (Helm)   │
└──────────┘   └─────┬────┘   └───────────┘
                     │
          ┌──────────┼──────────┐
          │          │          │
     ┌────▼──┐  ┌───▼───┐  ┌──▼────┐
     │ User  │  │Product│  │ Order │
     │Service│  │Service│  │Service│
     │(Helm) │  │(Helm) │  │(Helm) │
     └───┬───┘  └───┬───┘  └───┬───┘
         │          │          │
         └──────────┼──────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
   ┌────▼──┐   ┌───▼────┐  ┌──▼───┐
   │  PG   │   │ Redis  │  │Kafka │
   │(STS)  │   │ (STS)  │  │(STS) │
   └───────┘   └────────┘  └──────┘
```

**Requirements**:
1. All services deployed via Helm
2. StatefulSets for all stateful components
3. Ingress with path-based routing
4. Network Policies isolating databases
5. ResourceQuotas per namespace
6. Monitoring with Prometheus + Grafana
7. Automated backups for PostgreSQL

**Bonus Points**:
- TLS/HTTPS with cert-manager
- Horizontal Pod Autoscaler on all services
- Pod Disruption Budgets
- Custom Metrics for HPA
- GitOps with ArgoCD

---

**Congratulations on completing Week 4!** 🎉

You now have advanced Kubernetes skills:
✅ HTTP routing with Ingress
✅ Stateful applications
✅ Persistent storage management
✅ Helm charts
✅ Resource management
✅ Network security

**Ready for CI/CD in Week 5?** 🚀
