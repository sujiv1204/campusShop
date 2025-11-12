# System Testing Guide

## Quick Start

```bash
cd scripts

# Generate test data first (optional)
npm run seed         # 10 users, 50 items, 100 bids
npm run seed:small   # 50 users, 100 items, 200 bids

# Run complete system test (all services, all databases)
./test-system.sh --quick

# Run larger tests
./test-system.sh --small     # 50 users, 100 items, 50 bids
./test-system.sh --medium    # 200 users, 500 items, 200 bids
./test-system.sh --large     # 500 users, 2000 items, 1000 bids
```

## Test Specific Components

```bash
# Test individual services
./test-system.sh --quick --auth           # Auth service only
./test-system.sh --quick --items          # Items service only
./test-system.sh --quick --bidding        # Bidding service only
./test-system.sh --quick --notifications  # Notifications service only
./test-system.sh --quick --profile        # Profile service only

# Test infrastructure
./test-system.sh --db                     # Database replicas (read/write)
./test-system.sh --kafka                  # Kafka event pipeline

# Combine multiple components
./test-system.sh --small --auth --items --db
```

## Custom Log File

```bash
# Append to specific log file (default: test-results.log)
./test-system.sh --large --log production-test.log

# View results
tail -f test-results.log
```

## What Gets Tested

### Services

-   **Auth Service**: User registration, login, JWT tokens
-   **Items Service**: Item creation, listings, status management
-   **Bidding Service**: Bid placement, bid validation
-   **Notifications Service**: Kafka event processing, MongoDB storage
-   **Profile Service**: User profiles, email preferences

### Infrastructure

-   **PostgreSQL Replicas**: Primary/replica status, replication lag, read/write distribution
-   **Kafka**: Topics, consumer groups, event processing lag
-   **MongoDB**: Notification storage
-   **HPA**: Autoscaling status

### Data Flow

1. Register users → Auth DB
2. Create items → Items DB
3. Place bids → Bids DB → Kafka → Notifications
4. Check profiles → Profiles DB
5. Verify replicas working

## Test Results

All results appended to log file with timestamps:

-   Success/failure counts
-   Throughput (requests/sec)
-   Duration
-   Total data counts
-   Replication status
-   Kafka consumer lag

## Example Output

```
2025-11-12 22:18:30 | Testing Auth Service (5 users)
2025-11-12 22:18:32 | Results:
2025-11-12 22:18:32 |   Successful: 5
2025-11-12 22:18:32 |   Failed: 0
2025-11-12 22:18:32 |   Duration: 2s
2025-11-12 22:18:32 |   Throughput: 2 req/sec
2025-11-12 22:18:32 |   Total users in DB: 850
```

## Database Inspection

For detailed database queries and commands:

```bash
# See DATABASE_GUIDE.md for:
# - Interactive psql/mongosh sessions
# - Common queries for each database
# - Replication status checks
# - Connection distribution monitoring
```

## Troubleshooting

If tests fail:

1. Check cluster: `kubectl get pods -n campus-shop`
2. Check services: `kubectl get svc -n campus-shop`
3. Check port-forward: `kubectl port-forward -n campus-shop service/nginx-ingress 8080:80`
4. Check logs: `kubectl logs -n campus-shop <pod-name>`

## Files

-   `test-system.sh` - Main test script
-   `seed-data.js` - Data generation script
-   `package.json` - Seed script dependencies
-   `test-results.log` - Test output (appended)
-   `scripts/README.md` - Detailed scripts documentation
-   `DATABASE_GUIDE.md` - Database inspection guide
-   `README.md` - Project overview
-   `INSTALLATION.md` - Setup instructions
