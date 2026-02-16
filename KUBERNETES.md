# Kubernetes Deployment (Legacy/Advanced)

This document contains the instructions and manifests for deploying Project-Mina to a Kubernetes cluster.

## Prerequisites
* A Kubernetes cluster (Minikube, Docker Desktop, or Cloud Provider).
* `kubectl` installed and configured.
* (Optional) Metrics Server installed (for Autoscaling).

## 1. Build & Push Images
Before deploying, push your images to a registry:

```bash
docker login
docker build -t your-user/project-mina-backend:latest ./backend
docker push your-user/project-mina-backend:latest

docker build -t your-user/project-mina-frontend:latest ./frontend
docker push your-user/project-mina-frontend:latest
```

## 2. Deploy to Cluster
Use Kustomize to apply all manifests:

```bash
kubectl apply -k k8s/
```

## 3. Accessing the App
* **Ingress**: Exposed via Ingress at `www.example.com`.
* **NodePort**: Check `kubectl get svc frontend`.

## 4. Autoscaling
Scales based on CPU:
* **Backend**: 1-5 replicas (Target: 50% CPU)
* **Frontend**: 1-5 replicas (Target: 20% CPU)

To test:
```bash
kubectl run -i --tty load-generator --rm --image=busybox --restart=Never -- /bin/sh -c "while sleep 0.01; do wget -q -O- http://frontend; done"
```
