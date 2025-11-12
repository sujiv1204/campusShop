# Scripts Directory# Seed Data Scripts

## Available Scripts## Overview

### 1. System Testing (`test-system.sh`)This directory contains scripts to generate realistic test data for the Campus Marketplace application. The seed script creates users, items, and bids by calling the actual APIs, which tests the entire microservice stack.

Comprehensive testing script for all services and infrastructure.## What It Tests

**Usage:**### ✅ Services & APIs

```bash- **Auth Service**: User registration, login, JWT tokens

# Run quick test (5 users, 10 items, 5 bids)- **Items Service**: Item creation, validation, PostgreSQL writes

./test-system.sh --quick- **Bidding Service**: Bid placement, validation, Kafka events

- **Notifications Service**: Kafka consumer, email preferences, email sending

# Run different sizes- **Profile Service**: Profile creation, preferences API

./test-system.sh --small    # 50/100/50

./test-system.sh --medium   # 200/500/200### ✅ Infrastructure

./test-system.sh --large    # 500/2000/1000- **PostgreSQL**: Primary/replica routing, connection pools

- **Kafka**: Message queue throughput, event publishing

# Test specific components- **MongoDB**: Notification log storage

./test-system.sh --quick --auth- **Ingress**: Request routing through nginx

./test-system.sh --small --items --bidding- **Prometheus**: Metrics collection for all services

./test-system.sh --medium --db --kafka

## Installation

# Custom log file

# Custom log file
./test-system.sh --large --log production-test.log

# All logs are saved to the logs/ directory
# Default log file: logs/test-results.log
```

### 2. Seed Data Generator (`seed-data.js`)```bash

````cd scripts

npm install

**What it tests:**```

- All 5 microservices

- PostgreSQL read/write replicas## Usage

- Kafka event pipeline

- MongoDB notifications### Quick Start (Small Dataset)

- HPA autoscalingTest the setup with a small dataset:

- Complete data flow```bash

npm run seed:small

### 2. Data Seeding (`seed-data.js`)# Creates: 10 users, 50 items, 100 bids

````

Generate realistic test data via API calls.

### Medium Dataset

**Usage:**```bash

````bashnpm run seed:medium

# Using npm scripts# Creates: 100 users, 500 items, 1000 bids

npm run seed         # 10 users, 50 items, 100 bids```

npm run seed:small   # 50 users, 100 items, 200 bids

npm run seed:medium  # 200 users, 500 items, 500 bids### Full Dataset (Performance Testing)

npm run seed:full    # 500 users, 2000 items, 5000 bids```bash

npm run seed:full

# Direct usage with custom numbers# Creates: 500 users, 2000 items, 5000 bids

node seed-data.js <users> <items> <bids>```

node seed-data.js 20 100 150

### For Kubernetes Deployment

# With concurrency control```bash

CONCURRENT_REQUESTS=3 node seed-data.js 100 200 300npm run seed:k8s

```# Uses http://localhost:8080/api (requires port-forward on ingress)

````

**Features:**

-   Creates users with email verification### For Docker Compose

-   Auto-verifies users via database```bash

-   Logs in all users to get JWT tokensnpm run seed:docker

-   Creates items across 10 categories# Uses http://localhost:3000/api

-   Places realistic bids```

-   Progress tracking

## Environment Variables

**Prerequisites:**

````bash| Variable | Default | Description |

# Install dependencies (if not already installed)|----------|---------|-------------|

npm install| `API_BASE` | `http://localhost:8080/api` | Base URL for API |

```| `NUM_USERS` | `500` | Number of users to create |

| `NUM_ITEMS` | `2000` | Number of items to create |

## Files| `NUM_BIDS` | `5000` | Number of bids to place |

| `CONCURRENT_REQUESTS` | `10` | Parallel requests (hardcoded) |

- `test-system.sh` - Unified system testing script

- `seed-data.js` - Data generation script### Custom Configuration

- `package.json` - Seed script dependencies```bash

- `verify-test-users.sh` - User verification utility# Create 1000 users, 5000 items, 10000 bids

NUM_USERS=1000 NUM_ITEMS=5000 NUM_BIDS=10000 node seed-data.js

## Tips

# Use different API endpoint

1. **Emails**: Make sure `DISABLE_EMAILS=true` is set in notifications service to avoid email costsAPI_BASE=http://production-api.com/api node seed-data.js

2. **Concurrency**: Use `CONCURRENT_REQUESTS=5` or lower to prevent overload```

3. **Logs**: All test results append to `test-results.log` (never overwrites)

4. **Database**: Use `DATABASE_GUIDE.md` to inspect data after seeding## Prerequisites



## Examples### For Kubernetes

1. Ensure all pods are running:

```bash   ```bash

# Full workflow   kubectl get pods -n campus-shop

npm run seed:small                    # Generate data   ```

./test-system.sh --small --all        # Test everything

tail -f test-results.log              # Monitor results2. Port-forward the ingress:

   ```bash

# Targeted testing   kubectl port-forward -n campus-shop service/nginx-ingress 8080:80

npm run seed                          # Small seed   ```

./test-system.sh --quick --auth --db  # Test auth + replicas

3. Verify API health:

# Large scale (run outside VS Code)   ```bash

npm run seed:full                     # 500/2000/5000   curl http://localhost:8080/api/auth/health

./test-system.sh --large --all        # Full test   ```

````

### For Docker Compose

1. Start all services:

    ```bash
    docker-compose up -d
    ```

2. Wait for services to be healthy:

    ```bash
    docker-compose ps
    ```

3. Verify API health:
    ```bash
    curl http://localhost:3000/api/auth/health
    ```

## Output

The script provides real-time progress updates:

```
🚀 Campus Marketplace Seed Data Generator
==========================================
API Base: http://localhost:8080/api
Target: 500 users, 2000 items, 5000 bids
Concurrency: 10 parallel requests
==========================================

📝 Creating 500 users...
  Progress: 50/500 created, 50 logged in
  Progress: 100/500 created, 100 logged in
  ...
✅ Users complete: 498 ready (2 errors)

📦 Creating 2000 items...
  Progress: 100/2000 created
  Progress: 200/2000 created
  ...
✅ Items complete: 1987 created (13 errors)

💰 Creating 5000 bids...
  Progress: 500/5000 placed
  Progress: 1000/5000 placed
  ...
✅ Bids complete: 4956 placed (44 errors)

🎉 Seeding Complete!
==========================================
✅ Users: 498/500
✅ Items: 1987/2000
✅ Bids: 4956/5000
⏱️  Duration: 342.56s
❌ Total Errors: 59
==========================================

📊 Next Steps:
1. Check Grafana: http://localhost:3000
2. Check Prometheus: http://localhost:9090
3. Verify data: curl http://localhost:8080/api/items | jq length
```

## Performance Testing

After seeding, use the data to test:

### 1. Database Replication

Check PostgreSQL replica read distribution:

```bash
# Monitor replica usage
kubectl logs -n campus-shop <service-pod> | grep "read replica"

# Check Prometheus query
# Query: pg_stat_database_tup_fetched{instance="postgres-items-replica"}
```

### 2. HPA Autoscaling

Trigger autoscaling with concurrent requests:

```bash
# Watch pods scale
kubectl get pods -n campus-shop -w

# Check HPA status
kubectl get hpa -n campus-shop
```

### 3. Kafka Throughput

Monitor notification processing:

```bash
# Check consumer lag
kubectl exec -n campus-shop kafka-0 -- kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 --describe --group notifications-group

# Check notification service logs
kubectl logs -n campus-shop <notifications-pod> | grep "Processed event"
```

### 4. Grafana Dashboards

View metrics at http://localhost:3000:

-   Service request rates
-   Database connection pools
-   Error rates
-   Response latencies

## Troubleshooting

### Script Hangs During User Creation

-   Check auth-service logs: `kubectl logs -n campus-shop <auth-pod>`
-   Verify database connectivity
-   Reduce `CONCURRENT_REQUESTS` (hardcoded in script)

### High Error Rate

-   Some errors are expected due to timing/load
-   Acceptable error rate: < 5%
-   If errors > 10%, check service health

### Kafka Events Not Processing

-   Check notifications-service logs
-   Verify Kafka is running: `kubectl get pods -n campus-shop | grep kafka`
-   Check consumer group lag

### Memory Issues

-   Script uses minimal memory (~100MB)
-   If OOM, reduce batch sizes in code
-   Run in smaller batches (seed:medium, then seed:medium again)

## Data Cleanup

To reset and start fresh:

### Kubernetes

```bash
# Delete and recreate databases
kubectl delete -f k8s/databases/
kubectl apply -f k8s/databases/

# Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app=postgres-auth -n campus-shop --timeout=300s

# Restart services to run migrations
kubectl rollout restart deployment -n campus-shop
```

### Docker Compose

```bash
# Stop and remove volumes
docker-compose down -v

# Restart
docker-compose up -d
```

## Notes

-   **Realistic Data**: Uses Faker.js for realistic names, emails, descriptions
-   **Categories**: Items prefixed with category (e.g., "Electronics: Laptop Pro")
-   **Bid Logic**: Bids are 10-50% above item price
-   **Concurrent Requests**: 10 parallel requests to balance speed and server load
-   **Retry Logic**: Automatic retries with exponential backoff
-   **Progress Tracking**: Real-time updates every batch

## Future Enhancements

-   [ ] Add image upload support (MinIO integration)
-   [ ] Generate random bid acceptance/rejection
-   [ ] Create user interactions (item views, favorites)
-   [ ] Support custom category distribution
-   [ ] Add cleanup/reset command
-   [ ] Generate realistic time distribution (not all at once)
