# 🚀 DevOps Learning Project - E-Commerce Microservices

> **A hands-on, progressive learning project that takes you from Docker basics to production-ready Kubernetes deployments**

## 📋 Project Overview

This is a **practical, hands-on** learning repository designed to teach DevOps through building and deploying a real microservices application. No more watching videos - you'll build everything yourself!

### What You'll Build

A complete e-commerce platform with:
- **Frontend**: React application (simple product catalog and cart)
- **API Gateway**: Routes requests to backend services
- **User Service**: Authentication and user management
- **Product Service**: Product catalog management
- **Order Service**: Order processing and history
- **Database**: PostgreSQL for data persistence
- **Cache**: Redis for session management

### Architecture

```
User (Browser)
      ↓
  Frontend (React)
      ↓
CloudFront/S3 (AWS)
      ↓
API Gateway (Node.js)
      ↓
├── User Service (Node.js) → PostgreSQL
├── Product Service (Node.js) → PostgreSQL
└── Order Service (Node.js) → PostgreSQL + Redis
```

## 🎯 Learning Path (8 Weeks)

### **Weeks 1-2: Docker Fundamentals**

**Goals:**
- Containerize each microservice
- Understand Dockerfile best practices
- Learn Docker networking and volumes
- Use Docker Compose for local development

**Exercises:**
1. Week 1: Write Dockerfiles for each service (user, product, order, api-gateway, frontend)
2. Week 2: Create Docker Compose to run entire stack locally
3. Test inter-service communication
4. Implement health checks

**Checkpoint:** All services running locally with Docker Compose

---

### **Weeks 3-4: Kubernetes Essentials**

**Goals:**
- Deploy microservices to Kubernetes
- Understand Pods, Deployments, Services
- Configure Ingress for routing
- Manage ConfigMaps and Secrets

**Exercises:**
1. Week 3: Create Kubernetes manifests (deployments, services, configmaps)
2. Week 4: Set up Ingress controller and configure routing
3. Deploy PostgreSQL and Redis as StatefulSets
4. Configure persistent volumes

**Checkpoint:** Application running on local Kubernetes (Minikube/Kind) or EKS

---

### **Weeks 5-6: CI/CD Pipelines**

**Goals:**
- Automate Docker image builds
- Implement automated testing
- Deploy to Kubernetes automatically
- Practice GitOps principles

**Exercises:**
1. Week 5: Create GitHub Actions workflows for each service
2. Automated builds → ECR push → Deploy to EKS
3. Week 6: Implement canary/blue-green deployments
4. Add automated rollback on failure

**Checkpoint:** Full CI/CD pipeline from git push to production deployment

---

### **Week 7: Infrastructure as Code (Terraform)**

**Goals:**
- Provision AWS infrastructure with Terraform
- Manage state properly (S3 backend)
- Use modules for reusability
- Understand lifecycle management

**Exercises:**
1. Create Terraform modules for VPC, EKS, RDS, ECR
2. Deploy complete infrastructure from scratch
3. Practice terraform plan/apply workflow
4. Implement workspaces for dev/staging/prod

**Checkpoint:** Complete AWS infrastructure managed by Terraform

---

### **Week 8: Observability & Production Readiness**

**Goals:**
- Set up monitoring (Prometheus/Grafana)
- Implement centralized logging (Loki/ELK)
- Configure alerting rules
- Practice security best practices

**Exercises:**
1. Deploy Prometheus + Grafana on EKS
2. Configure service metrics and dashboards
3. Set up log aggregation
4. Implement WAF, security groups, IAM least privilege
5. Calculate and optimize cloud costs

**Checkpoint:** Production-grade deployment with full observability

---

## 🏗️ Project Structure

```
learn-devops/
├── README.md                    # This file
├── services/
│   ├── api-gateway/            # API Gateway service
│   ├── user-service/           # User authentication service
│   ├── product-service/        # Product catalog service
│   └── order-service/          # Order processing service
├── frontend/                   # React frontend application
├── infrastructure/
│   ├── docker/                 # Docker Compose files
│   ├── kubernetes/             # K8s manifests
│   ├── helm/                   # Helm charts
│   └── terraform/              # Terraform modules
├── ci-cd/
│   └── github-actions/         # CI/CD workflow files
├── exercises/
│   ├── week-1-docker/          # Week 1 exercises and solutions
│   ├── week-2-docker/          # Week 2 exercises
│   ├── week-3-k8s/             # Week 3 exercises
│   └── ...
└── docs/
    ├── SETUP.md                # Initial setup guide
    ├── DOCKER-GUIDE.md         # Docker learning guide
    ├── K8S-GUIDE.md            # Kubernetes learning guide
    └── TROUBLESHOOTING.md      # Common issues and fixes
```

## 🚦 Getting Started

### Prerequisites

- Docker Desktop installed
- Node.js 18+ installed
- AWS CLI configured
- kubectl installed
- Git installed

### Quick Start

```bash
# Clone the repository
cd /path/to/learn-devops

# Start with Week 1 - Docker basics
cd exercises/week-1-docker
cat README.md

# Follow the exercises step by step
```

## 📚 Learning Resources

Each week's folder contains:
- 📖 **README.md**: Detailed instructions and concepts
- 💡 **EXERCISES.md**: Hands-on tasks to complete
- ✅ **SOLUTIONS.md**: Reference solutions (try before looking!)
- 🐛 **TROUBLESHOOTING.md**: Common issues and fixes

## 🎓 How to Use This Repository

1. **Start with Week 1** - Don't skip ahead!
2. **Do the exercises** - Reading won't teach you, doing will
3. **Make mistakes** - Break things, debug them, learn from errors
4. **Try before checking solutions** - Struggle is where learning happens
5. **Document your work** - Keep notes on what you learned
6. **Ask questions** - Use GitHub issues for questions

## ✨ Key Learning Outcomes

By the end of this project, you will:

✅ **Containerize applications** with Docker best practices
✅ **Deploy microservices** to Kubernetes clusters
✅ **Build CI/CD pipelines** with GitHub Actions
✅ **Provision infrastructure** with Terraform
✅ **Implement observability** with modern tools
✅ **Secure production systems** following AWS best practices
✅ **Debug and troubleshoot** real-world issues
✅ **Optimize costs** and performance

## 🎯 Success Criteria

You've completed this project when you can:
1. Deploy the entire application from scratch in under 30 minutes
2. Explain every piece of infrastructure and why it exists
3. Roll back a bad deployment confidently
4. Debug a production issue using logs and metrics
5. Calculate the monthly AWS cost and justify each resource

## 📞 Support

- Create GitHub issues for questions
- Join our Discord community (link TBD)
- Weekly office hours (schedule TBD)

## 📝 License

MIT License - Feel free to use this for learning!

---

**Ready to start?** Head to `exercises/week-1-docker/README.md` and let's build something! 🚀
