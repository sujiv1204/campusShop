# Kubernetes (Kind) Local Setup Guide

This guide details the complete process for deploying the Campus Marketplace microservice architecture to a local Kubernetes (Kind) cluster on a Linux-based system (like Kubuntu).

## Prerequisites

Before you begin, ensure you have the following tools installed:

-   Docker
-   `kind` (Kubernetes in Docker)
-   `kubectl` (Kubernetes command-line tool)
-   `openssl` (for generating certificates)
-   `oha` (or `k6`) for load testing (optional)

## Step 1: Create the Kind Cluster

This creates your local Kubernetes cluster.

```bash
kind create cluster --name microservices-cluster --image kindest/node:v1.29.4
```

---

**✅ Checkpoint:** Verify that your cluster node is running and ready.

```bash
kubectl get nodes
```

You should see an output like this:

```
NAME                                    STATUS   ROLES           AGE   VERSION
microservices-cluster-control-plane     Ready    control-plane   1m    v1.29.4
```

---

## Step 2: Create the Application Namespace

We will deploy all our application components into a dedicated `campus-shop` namespace.

```bash
kubectl apply -f k8s/namespace.yaml
```

Or manually create it:

```bash
kubectl create namespace campus-shop
```

---

**✅ Checkpoint:** Verify the namespace was created.

```bash
kubectl get namespaces
```

You should see `campus-shop` in the list with a status of `Active`.

---

## Step 3: Install Cluster Components (Metrics & VPA)

These components are required for autoscaling.

### A. Install Metrics Server (for HPA)

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
kubectl patch deployment metrics-server -n kube-system --type=json \
  -p '[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]'
```

### B. Install Vertical Pod Autoscaler (VPA)

```bash
# Apply VPA CRDs and RBAC
kubectl apply -f https://raw.githubusercontent.com/kubernetes/autoscaler/master/vertical-pod-autoscaler/deploy/vpa-v1-crd-gen.yaml
kubectl apply -f https://raw.githubusercontent.com/kubernetes/autoscaler/master/vertical-pod-autoscaler/deploy/vpa-rbac.yaml

# Create VPA SSL certificates
openssl req -x509 -new -nodes -days 365 -keyout caKey.pem -out caCert.pem -subj "/CN=vpa-ca"
openssl genrsa -out serverKey.pem 2048
openssl req -new -key serverKey.pem -out server.csr -subj "/CN=vpa-admission-controller.kube-system.svc"
openssl x509 -req -in server.csr -CA caCert.pem -CAkey caKey.pem -CAcreateserial -out serverCert.pem -days 365

# Create the secret in Kubernetes
kubectl create secret generic vpa-tls-certs \
  --namespace kube-system \
  --from-file=serverCert.pem=serverCert.pem \
  --from-file=serverKey.pem=serverKey.pem \
  --from-file=caCert.pem=caCert.pem

# Apply VPA Deployments
kubectl apply -f https://raw.githubusercontent.com/kubernetes/autoscaler/master/vertical-pod-autoscaler/deploy/recommender-deployment.yaml
kubectl apply -f https://raw.githubusercontent.com/kubernetes/autoscaler/master/vertical-pod-autoscaler/deploy/updater-deployment.yaml
kubectl apply -f https://raw.githubusercontent.com/kubernetes/autoscaler/master/vertical-pod-autoscaler/deploy/admission-controller-deployment.yaml
```

---

**✅ Checkpoint:** Wait a minute or two, then check that the new components are running in the `kube-system` namespace.

```bash
kubectl get pods -n kube-system
```

Look for `metrics-server-...` and the three VPA pods (`vpa-admission-controller`, `vpa-recommender`, `vpa-updater`) to have a status of `Running`.

---

## Step 4: Deploy Secrets

**Important:** Deploy secrets before infrastructure and services as they contain sensitive configuration data.

```bash
kubectl apply -f k8s/secrets/
```

---

**✅ Checkpoint:** Verify secrets were created.

```bash
kubectl get secrets -n campus-shop
```

You should see secrets like `postgres-auth-secret`, `minio-secret`, `auth-service-secret`, etc.

---

## Step 5: Deploy Infrastructure

This command deploys all your databases, Kafka, Zookeeper, and MinIO into your `campus-shop` namespace.

```bash
# Deploy databases (PostgreSQL instances)
kubectl apply -f k8s/databases/

# Deploy Kafka and Zookeeper
kubectl apply -f k8s/kafka/

# Deploy MinIO (object storage)
kubectl apply -f k8s/storage/
```

---

**✅ Checkpoint:** Check that all infrastructure pods are running.

```bash
kubectl get pods -n campus-shop -w
```

Wait until all pods (e.g., `postgres-auth`, `postgres-items`, `kafka`, `zookeeper`, `minio`, etc.) are in the `Running` state before proceeding. Press `Ctrl+C` to exit the watch.

You can also check the persistent volume claims:

```bash
kubectl get pvc -n campus-shop
```

All PVCs should be in `Bound` status.

---

## Step 6: Build and Load Application Images

This step builds your microservice images locally and loads them into your Kind cluster's internal registry.

```bash
# Build all 5 images
docker build -t auth-service:local ./services/auth-service
docker build -t items-service:local ./services/items-service
docker build -t bidding-service:local ./services/bidding-service
docker build -t notifications-service:local ./services/notifications-service
docker build -t profile-service:local ./services/profile-service

# Load all 5 images into Kind
kind load docker-image auth-service:local --name microservices-cluster
kind load docker-image items-service:local --name microservices-cluster
kind load docker-image bidding-service:local --name microservices-cluster
kind load docker-image notifications-service:local --name microservices-cluster
kind load docker-image profile-service:local --name microservices-cluster
```

---

**✅ Checkpoint:** This step will take a few minutes. A successful `kind load` command is your checkpoint.

---

## Step 7: Deploy Microservices & Autoscalers

Now that the infrastructure is ready and the images are loaded, you can deploy your application into the `campus-shop` namespace.

```bash
# 1. Deploy your 5 microservices
kubectl apply -f k8s/deployments/

# 2. Apply your autoscaler configurations
kubectl apply -f k8s/autoscaling/
```

---

**✅ Checkpoint:** Verify that your microservice pods are running.

```bash
kubectl get pods -n campus-shop -w
```

Wait until all your application pods (e.g., `auth-service-...`, `items-service-...`, etc.) are `Running`.

You can check the services:

```bash
kubectl get svc -n campus-shop
```

You should see services like `auth-service`, `items-service`, `bidding-service`, `notifications-service`, `profile-service`, and all database services.

---

## Step 8: Install and Configure Ingress

This installs the Nginx Ingress controller and applies your routing rules, allowing external traffic into your cluster.

```bash
# 1. Install the Nginx Ingress controller for Kind
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

# 2. Wait for the Ingress controller to be ready (this can take a minute)
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s

# 3. Apply your Ingress routing rules
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/minio-ingress.yaml
```

---

**✅ Checkpoint:** Check that your Ingress is configured and has an address.

```bash
kubectl get ingress -n campus-shop
```

You should see your ingress listed (e.g., `app-ingress`, `minio-ingress`).

---

## Step 9: Access Your Application (Port Forwarding)

You must run these commands in **separate, dedicated terminals** as they will block.

### **Terminal 1: Forward Ingress**

This forwards your local `8080` port to the cluster's Ingress controller.

```bash
kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8080:80
```

### **Terminal 2: Forward MinIO Console**

This forwards the MinIO API and Console ports.

```bash
kubectl port-forward svc/minio-service 9000:9000 9001:9001 -n campus-shop
```

---

**✅ Checkpoint:** Your application is now live. Test a health endpoint from a new terminal.

```bash
curl http://localhost:8080/api/auth/health
```

You should get a JSON response like `{"status":"UP","message":"Auth service is healthy!"}`.

Test other services:

```bash
curl http://localhost:8080/api/items/health
curl http://localhost:8080/api/bids/health
curl http://localhost:8080/api/notifications/health
curl http://localhost:8080/api/profiles/health
```

---

## Step 10: Testing & Verification

Run these commands in new, separate terminals to watch your autoscalers work.

### **Terminal 3: Run Load Test** (Optional)

This runs a test against one of your API endpoints.

```bash
oha -z 10m -c 10 -q 1000 http://localhost:8080/api/items/health
```

Or using `k6`:

```bash
k6 run -u 10 -d 10m --rps 1000 http://localhost:8080/api/items/health
```

### **Terminal 4: Watch HPA (Horizontal Pod Autoscaler)**

```bash
kubectl get hpa -n campus-shop -w
```

You will see the `TARGETS` CPU usage climb and the `REPLICAS` count increase from 1 to the maximum (5).

### **Terminal 5: Watch VPA (Vertical Pod Autoscaler)**

```bash
kubectl get vpa -n campus-shop -w
```

You will see the VPA component update its recommendations. You can get a detailed recommendation by running:

```bash
kubectl describe vpa items-vpa -n campus-shop
```

---

## Step 11: Accessing MinIO Console

MinIO provides a web console for managing object storage.

1. Open your browser and navigate to: `http://localhost:9001`
2. Login credentials:
    - Username: `minioadmin`
    - Password: `minioadmin`

---

## Troubleshooting

### Check Pod Logs

```bash
# View logs for a specific pod
kubectl logs <pod-name> -n campus-shop

# Follow logs in real-time
kubectl logs -f <pod-name> -n campus-shop

# View logs for previous crashed container
kubectl logs <pod-name> -n campus-shop --previous
```

### Check Pod Status and Events

```bash
# Describe a pod to see events
kubectl describe pod <pod-name> -n campus-shop

# Get all events in the namespace
kubectl get events -n campus-shop --sort-by='.lastTimestamp'
```

### Common Issues

1. **Pods stuck in `Pending` state:**

    - Check PVC status: `kubectl get pvc -n campus-shop`
    - Check pod events: `kubectl describe pod <pod-name> -n campus-shop`

2. **Pods in `CrashLoopBackOff`:**

    - Check logs: `kubectl logs <pod-name> -n campus-shop`
    - Verify secrets are created: `kubectl get secrets -n campus-shop`
    - Check database connectivity

3. **Service not accessible:**

    - Verify service exists: `kubectl get svc -n campus-shop`
    - Check ingress: `kubectl get ingress -n campus-shop`
    - Verify port-forward is running

4. **Images not loading (ERR_NAME_NOT_RESOLVED for MinIO URLs):**
    - This happens when the backend stores MinIO URLs with internal cluster DNS
    - The `MINIO_PUBLIC_URL` in `k8s/secrets/service-secrets.yaml` must be set to `http://localhost:9000` for local development
    - After changing, restart items-service: `kubectl rollout restart deployment items-service -n campus-shop`
    - Ensure MinIO port-forward is running: `kubectl port-forward svc/minio-service 9000:9000 9001:9001 -n campus-shop`

### Cleanup

To delete everything and start fresh:

```bash
# Delete the namespace (this removes all resources in it)
kubectl delete namespace campus-shop

# Delete the Kind cluster
kind delete cluster --name microservices-cluster

# Remove generated certificates
rm caKey.pem caCert.pem serverKey.pem server.csr serverCert.pem caCert.srl
```

---

## Architecture Overview

Your deployed architecture includes:

-   **5 Microservices:**

    -   `auth-service` (port 5001)
    -   `items-service` (port 5002)
    -   `bidding-service` (port 5003)
    -   `notifications-service` (port 5004)
    -   `profile-service` (port 5005)

-   **5 PostgreSQL Databases:**

    -   `postgres-auth`
    -   `postgres-items`
    -   `postgres-bids`
    -   `postgres-notifications`
    -   `postgres-profiles`

-   **Message Queue:**

    -   Kafka + Zookeeper

-   **Object Storage:**

    -   MinIO

-   **Autoscaling:**

    -   HPA (Horizontal Pod Autoscaler) for all services
    -   VPA (Vertical Pod Autoscaler) for all services

-   **Ingress:**
    -   Nginx Ingress Controller
    -   Routes for all API endpoints

All services run in the `campus-shop` namespace with proper secret management, resource limits, health checks, and persistent storage.

---

## Next Steps

-   Set up monitoring with Prometheus and Grafana
-   Configure persistent volumes for production
-   Implement proper TLS/SSL certificates
-   Set up CI/CD pipeline
-   Configure backup strategies for databases
-   Implement log aggregation (ELK stack or similar)
