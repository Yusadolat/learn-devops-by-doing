# Week 3 Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Kubernetes (Choose One)

#### Option A: Minikube (Easiest)
```bash
# macOS
brew install minikube

# Start cluster
minikube start --driver=docker

# Verify
kubectl get nodes
```

#### Option B: kind (Alternative)
```bash
# macOS
brew install kind

# Create cluster
kind create cluster --name learn-devops

# Verify
kubectl get nodes
```

### Step 2: Verify kubectl is working
```bash
kubectl version --client
kubectl cluster-info
kubectl get all --all-namespaces
```

### Step 3: Start with Exercise 1
```bash
cd /Users/macbook/Personals/learning/learn-devops/exercises/week-3-k8s

# Read the README
cat README.md | less

# Start with the first exercise
# Create your first Pod!
```

---

## 📋 Essential kubectl Commands

### Get Information
```bash
kubectl get pods                    # List Pods
kubectl get deployments             # List Deployments
kubectl get services                # List Services
kubectl get all                     # List all resources
kubectl get pods -A                 # All Pods in all namespaces
```

### Describe Resources (Detailed Info)
```bash
kubectl describe pod <pod-name>
kubectl describe deployment <deployment-name>
kubectl describe service <service-name>
```

### Logs and Debugging
```bash
kubectl logs <pod-name>                     # View logs
kubectl logs <pod-name> -c <container>      # Logs from specific container
kubectl logs <pod-name> --previous          # Logs from crashed container
kubectl exec -it <pod-name> -- sh           # Shell into Pod
```

### Apply and Delete
```bash
kubectl apply -f file.yaml           # Create/update resources
kubectl delete -f file.yaml          # Delete resources
kubectl delete pod <pod-name>        # Delete specific Pod
```

### Scale and Update
```bash
kubectl scale deployment <name> --replicas=5    # Scale to 5 replicas
kubectl rollout status deployment/<name>        # Check rollout status
kubectl rollout undo deployment/<name>          # Rollback
```

---

## 🎯 Your First 30 Minutes

### Minute 0-5: Setup
- Install minikube or kind
- Verify kubectl works
- Start cluster

### Minute 5-15: Exercise 1 - First Pod
```bash
# Create pod-nginx.yaml
cat << EOF > pod-nginx.yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-pod
spec:
  containers:
  - name: nginx
    image: nginx:1.25-alpine
    ports:
    - containerPort: 80
EOF

# Deploy it
kubectl apply -f pod-nginx.yaml

# Check it
kubectl get pods
kubectl describe pod nginx-pod

# Access it
kubectl port-forward nginx-pod 8080:80
# Visit http://localhost:8080

# Clean up
kubectl delete pod nginx-pod
```

### Minute 15-25: Exercise 3 - First Deployment
```bash
# Create deployment-product.yaml
cat << EOF > deployment-product.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: product-service
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
EOF

# Deploy it
kubectl apply -f deployment-product.yaml

# Watch Pods being created
kubectl get pods -w

# Scale it
kubectl scale deployment product-service --replicas=5
kubectl get pods

# Delete one Pod and watch it recreate
kubectl delete pod <pod-name>
kubectl get pods -w
```

### Minute 25-30: Exercise 4 - First Service
```bash
# Create service
kubectl expose deployment product-service --port=80 --target-port=3002

# Check it
kubectl get service product-service
kubectl describe service product-service

# Test it
kubectl run test-pod --image=alpine:3.18 --rm -it --restart=Never -- sh
# Inside pod: apk add curl && curl product-service
```

---

## 🐛 Quick Troubleshooting

### Pod Won't Start
```bash
kubectl describe pod <pod-name>
# Look for errors in Events section at the bottom
```

### Can't Connect to Service
```bash
# Check if Service has endpoints
kubectl get endpoints <service-name>

# Check if labels match
kubectl get pods --show-labels
```

### Want to Start Fresh
```bash
# Delete everything in default namespace
kubectl delete all --all

# Or delete specific namespace
kubectl delete namespace <namespace-name>
```

---

## 📚 Useful Aliases (Optional)

Add these to your `~/.zshrc` or `~/.bashrc`:

```bash
alias k='kubectl'
alias kgp='kubectl get pods'
alias kgs='kubectl get services'
alias kgd='kubectl get deployments'
alias kdp='kubectl describe pod'
alias kdd='kubectl describe deployment'
alias kl='kubectl logs'
alias kex='kubectl exec -it'

# Usage examples after adding aliases:
# k get pods
# kgp
# kl <pod-name>
```

Reload your shell:
```bash
source ~/.zshrc  # or ~/.bashrc
```

---

## ✅ Success Criteria

You're ready to continue if you can:
- [x] Start a Kubernetes cluster (minikube or kind)
- [x] Run kubectl commands successfully
- [x] Create and delete a Pod
- [x] Create a Deployment with multiple replicas
- [x] Expose a Deployment as a Service
- [x] View logs from a Pod

---

## 🆘 Getting Help

### In This Project
- Check `solutions/SOLUTIONS.md` for exercise answers
- Read `README.md` for detailed explanations

### Online Resources
- [Kubernetes Official Docs](https://kubernetes.io/docs/home/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [Interactive Tutorial](https://kubernetes.io/docs/tutorials/kubernetes-basics/)

### Common Issues

**"connection refused" when accessing cluster**
```bash
minikube status        # Check if running
minikube start         # Start if stopped
```

**"command not found: kubectl"**
```bash
# Install kubectl
brew install kubectl
```

**Cluster is slow or unresponsive**
```bash
# Restart minikube
minikube stop
minikube delete
minikube start
```

---

**Ready? Start with Exercise 1!** 🚀

```bash
cd /Users/macbook/Personals/learning/learn-devops/exercises/week-3-k8s
cat README.md
```
