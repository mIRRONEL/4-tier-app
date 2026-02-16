# Project Mina

Project Mina is a high-performance, **4-tier full-stack application** designed for production-grade reliability, security, and horizontal scalability. It leverages Node.js, React, MySQL, and Redis to handle high volumes of data with sub-second response times.

## 🏗️ Architecture

The system follows a modern microservices pattern optimized for Docker and Kubernetes:

1.  **Ingress Layer**: Nginx-based Gateway for global traffic management and SSL termination.
2.  **Frontend Layer**: React + Vite SPA, served via Nginx with automated token rotation.
3.  **App Layer**: Scalable Node.js (Express) backend with Redis-backed session persistence.
4.  **Data Layer**: High-availability MySQL (Persistence) and Redis (Caching & Session Store).

## 🚀 Key Features

*   **⚡ High-Performance Caching**: Intelligent Redis implementation with configurable TTL for search and item retrieval.
*   **📂 Global Pagination**: Backend-driven pagination for `GET` and `Search` routes, ensuring zero lag even with thousands of items.
*   **🛡️ Automated Security**: 
    *   **Auto-Secret Generation**: Built-in scripts to generate cryptographically secure JWT keys.
    *   **Silent Session Refresh**: Automatic background token renewal using Refresh Tokens + Axios Interceptors.
*   **⚖️ Horizontal Scaling**: Fully containerized and ready for `N+1` replicas with Nginx round-robin load balancing.
*   **🛠️ Resiliency**: Init containers, formal healthchecks, and strict resource limits applied to all containers.

## 🛠️ Getting Started (Local Development)

### 1. Prerequisite Setup
Clone the repo and initialize your secure environment:
```bash
git clone https://github.com/ronel11/project-mina.git
cd project-mina

# Generate your secure JWT key
node backend/scripts/generate-secret.js
```

### 2. Environment Configuration
Edit [`.env`](file:///.env) to customize your stack:
| Variable | Default | Description |
| :--- | :--- | :--- |
| `FRONTEND_URL` | `http://localhost:8080` | Required for CORS security |
| `CACHE_TTL_ITEMS` | `3600` | Seconds to cache item lists |
| `CACHE_TTL_SEARCH` | `300` | Seconds to cache search results |

### 3. Launch the Stack
```bash
docker-compose up -d --build
```
*   **Dashboard**: `http://localhost:8080`

## 📈 Operations & Scaling

### Scale Backend Replicas
Scale your application logic horizontally with a single command:
```bash
docker-compose up -d --scale backend=3
```

### Monitor Performance
Monitor resource consumption and container health:
```bash
docker stats
docker-compose ps
```

### Run Load Tests
Verify system stability under pressure using [k6](https://k6.io/):
```bash
docker run --rm -i --network project-mina_mina-network grafana/k6 run - <load-test/k6-script.js
```

## 📂 Project Structure

```
Project-Mina/
├── backend/            # Express Service (Auth, Items, Search)
│   ├── scripts/        # Automation & Maintenance scripts
│   └── src/            # Business Logic & Middleware
├── frontend/           # React SPA (AuthContext, Dashboard)
├── ingress/            # Nginx Gateway & Load Balancer
├── k8s/                # Kubernetes (HPA, Ingress, Deployments)
├── load-test/          # k6 Stress Testing scripts
└── docker-compose.yml  # Orchestration & Local Scale
```