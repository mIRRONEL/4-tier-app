# Project Mina

A full-stack microservice application built with Node.js, React, MySQL, and Redis, designed for Kubernetes deployment with high availability and autoscaling.

##  Tech Stack

*   **Frontend**: React, Vite, TailwindCSS
*   **Backend**: Node.js, Express, Sequelize
*   **Database**: MySQL 8.0
*   **Cache**: Redis 7.0
*   **DevOps**: Docker, Kubernetes (Kustomize), Nginx

##  Features

*   **User Authentication**: JWT-based Signup and Login.
*   **Item Management**: Create, Read, and Search items.
*   **Caching**: Redis caching for high-performance search and retrieval.
*   **Resilience**:
    *   **Startup Dependencies**: Init containers ensure services start in order.
    *   **Health Checks**: Liveness and Readiness probes for self-healing.
*   **Scalability**:
    *   Horizontal Pod Autoscaling (HPA) based on CPU usage.
    *   Ingress (Cilium) for traffic routing.

##  Local Development (Docker Compose)

The easiest way to run the app locally is using Docker Compose.

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/ronel11/project-mina.git
    cd project-mina
    ```

2.  **Start the services**:
    ```bash
    docker-compose up --build
    ```

3.  **Access the application**:
    *   Frontend: `http://localhost:5173`
    *   Backend: `http://localhost:3000`

##  Kubernetes Deployment

This project is optimized for Kubernetes. All manifests are located in the `k8s/` directory and managed via Kustomize.

### Prerequisites
*   A Kubernetes cluster (Minikube, Docker Desktop, or Cloud Provider).
*   `kubectl` installed and configured.
*   (Optional) Metrics Server installed (for Autoscaling).

### 1. Build & Push Images
If you modify the code, you need to build and push the images to your registry (e.g., Docker Hub).

```bash
# Login
docker login

# Backend
docker build -t ronel11/project-mina-backend:latest ./backend
docker push ronel11/project-mina-backend:latest

# Frontend
docker build -t ronel11/project-mina-frontend:latest ./frontend
docker push ronel11/project-mina-frontend:latest
```

### 2. Deploy to Cluster
Use Kustomize to apply all manifests (Deployments, Services, Secrets, Ingress, HPA) in one go.

```bash
kubectl apply -k k8s/
```

### 3. Accessing the App

*   **Ingress**: The app is exposed via Ingress at `www.example.com`.
    *   Add `127.0.0.1 www.example.com` to your `/etc/hosts` file to test locally.
*   **NodePort**: Alternatively, access the frontend service via NodePort (check `kubectl get svc frontend`).

### 4. Autoscaling
The application includes Horizontal Pod Autoscalers (HPA).
*   **Backend**: Scales 1-5 replicas (Target: 50% CPU)
*   **Frontend**: Scales 1-5 replicas (Target: 20% CPU)

To test autoscaling, run a load generator:
```bash
kubectl run -i --tty load-generator --rm --image=busybox --restart=Never -- /bin/sh -c "while sleep 0.01; do wget -q -O- http://frontend; done"
```

##  Project Structure

```
Project-Mina/
├── backend/                  # Node.js Express Service
│   ├── src/                  # Application Source
│   ├── Dockerfile
│   └── package.json
├── frontend/                 # React Vite Service
│   ├── src/                  # Application Source
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.js
├── k8s/                      # Kubernetes Manifests
│   ├── kustomization.yaml    # Resource Aggregator
│   ├── ingress.yaml          # Ingress Rules (Cilium)
│   ├── secrets.example.yaml  # Secret Template
│   ├── configmap.yaml        # Env Variables
│   ├── storageClass.yml      # Storage Config
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   ├── backend-hpa.yaml
│   ├── frontend-deployment.yaml
│   ├── frontend-service.yaml
│   ├── frontend-hpa.yaml
│   ├── mysql-deployment.yaml
│   ├── mysql-service.yaml
│   ├── mysql-pvc.yaml
│   ├── redis-deployment.yaml
│   └── redis-service.yaml
├── docker-compose.yml        # Local Development Orchestration
├── .gitignore                # Git Ignore Rules
└── README.md                 # Project Documentation
```