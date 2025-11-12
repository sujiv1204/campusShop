# Database Inspection Guide

Quick reference for checking data in all databases.

## Quick Commands

```bash
# Auth Database
kubectl exec -n campus-shop postgres-auth-0 -- psql -U admin -d auth_db

# Items Database
kubectl exec -n campus-shop postgres-items-0 -- psql -U admin -d items_db

# Bidding Database
kubectl exec -n campus-shop postgres-bids-0 -- psql -U admin -d bids_db

# Profile Database
kubectl exec -n campus-shop postgres-profiles-0 -- psql -U admin -d profiles_db

# Notifications Database
kubectl exec -n campus-shop postgres-notifications-0 -- psql -U admin -d notifications_db

# MongoDB (Notifications)
# Get credentials first
MONGO_USER=$(kubectl get secret -n campus-shop mongodb-secret -o jsonpath='{.data.MONGO_INITDB_ROOT_USERNAME}' | base64 -d)
MONGO_PASS=$(kubectl get secret -n campus-shop mongodb-secret -o jsonpath='{.data.MONGO_INITDB_ROOT_PASSWORD}' | base64 -d)
MONGO_POD=$(kubectl get pods -n campus-shop -l app=mongodb -o jsonpath='{.items[0].metadata.name}')

# Connect to MongoDB
kubectl exec -n campus-shop ${MONGO_POD} -- mongosh -u "${MONGO_USER}" -p "${MONGO_PASS}" --authenticationDatabase admin notifications
```

## Database Queries

### Auth Database (postgres-auth-0)

```bash
# Connect to primary
kubectl exec -it -n campus-shop postgres-auth-0 -- psql -U admin -d auth_db

# Connect to replica (read-only)
kubectl exec -it -n campus-shop postgres-auth-1 -- psql -U admin -d auth_db
```

**Common Queries:**

```sql
-- Count all users
SELECT COUNT(*) FROM "Users";

-- Recent users
SELECT id, email, name, "isVerified", "createdAt"
FROM "Users"
ORDER BY "createdAt" DESC
LIMIT 10;

-- Verified vs unverified
SELECT "isVerified", COUNT(*)
FROM "Users"
GROUP BY "isVerified";

-- Check replication status (on primary only)
SELECT * FROM pg_stat_replication;

-- Check if running as replica
SELECT pg_is_in_recovery();
```

### Items Database (postgres-items-0)

```bash
# Connect to primary
kubectl exec -it -n campus-shop postgres-items-0 -- psql -U admin -d items_db

# Connect to replica
kubectl exec -it -n campus-shop postgres-items-1 -- psql -U admin -d items_db
```

**Common Queries:**

```sql
-- Count all items
SELECT COUNT(*) FROM "Items";

-- Recent items
SELECT id, title, price, status, "createdAt"
FROM "Items"
ORDER BY "createdAt" DESC
LIMIT 10;

-- Items by status
SELECT status, COUNT(*)
FROM "Items"
GROUP BY status;

-- Items with bid counts
SELECT i.id, i.title, i.price, COUNT(b.id) as bid_count
FROM "Items" i
LEFT JOIN "Bids" b ON i.id = b."itemId"
GROUP BY i.id, i.title, i.price
ORDER BY bid_count DESC
LIMIT 10;

-- Check replication lag
SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) as lag_seconds;
```

### Bidding Database (postgres-bids-0)

```bash
# Connect to primary
kubectl exec -it -n campus-shop postgres-bids-0 -- psql -U admin -d bids_db

# Connect to replica
kubectl exec -it -n campus-shop postgres-bids-1 -- psql -U admin -d bids_db
```

**Common Queries:**

```sql
-- Count all bids
SELECT COUNT(*) FROM "Bids";

-- Recent bids
SELECT id, "itemId", "userId", amount, "createdAt"
FROM "Bids"
ORDER BY "createdAt" DESC
LIMIT 10;

-- Top bidders
SELECT "userId", COUNT(*) as bid_count, SUM(amount) as total_bid_amount
FROM "Bids"
GROUP BY "userId"
ORDER BY bid_count DESC
LIMIT 10;

-- Average bid amount
SELECT AVG(amount) as avg_bid, MIN(amount) as min_bid, MAX(amount) as max_bid
FROM "Bids";

-- Bids per item
SELECT "itemId", COUNT(*) as bid_count, MAX(amount) as highest_bid
FROM "Bids"
GROUP BY "itemId"
ORDER BY bid_count DESC
LIMIT 10;
```

### Profile Database (postgres-profiles-0)

```bash
# Connect to primary
kubectl exec -it -n campus-shop postgres-profiles-0 -- psql -U admin -d profiles_db

# Connect to replica
kubectl exec -it -n campus-shop postgres-profiles-1 -- psql -U admin -d profiles_db
```

**Common Queries:**

```sql
-- Count all profiles
SELECT COUNT(*) FROM "Profiles";

-- Recent profiles
SELECT id, "userId", bio, "createdAt"
FROM "Profiles"
ORDER BY "createdAt" DESC
LIMIT 10;

-- Email preferences
SELECT "emailOnBidPlaced", "emailOnItemSold", "emailOnOutbid", COUNT(*) as count
FROM "Profiles"
GROUP BY "emailOnBidPlaced", "emailOnItemSold", "emailOnOutbid";
```

### Notifications Database (postgres-notifications-0)

```bash
# Connect to primary
kubectl exec -it -n campus-shop postgres-notifications-0 -- psql -U admin -d notifications_db

# Connect to replica
kubectl exec -it -n campus-shop postgres-notifications-1 -- psql -U admin -d notifications_db
```

**Common Queries:**

```sql
-- Count processed events
SELECT COUNT(*) FROM "ProcessedEvents";

-- Recent processed events
SELECT "eventId", "eventType", "processedAt"
FROM "ProcessedEvents"
ORDER BY "processedAt" DESC
LIMIT 10;

-- Events by type
SELECT "eventType", COUNT(*) as count
FROM "ProcessedEvents"
GROUP BY "eventType";

-- Check for duplicate processing
SELECT "eventId", COUNT(*) as count
FROM "ProcessedEvents"
GROUP BY "eventId"
HAVING COUNT(*) > 1;
```

### MongoDB (Notifications Collection)

```bash
# Connect to MongoDB
kubectl exec -it -n campus-shop mongodb-0 -- mongosh campus-shop
```

**Common Queries:**

```javascript
// Count all notifications
db.notifications.countDocuments();

// Recent notifications
db.notifications.find().sort({ createdAt: -1 }).limit(10).pretty();

// Notifications by type
db.notifications.aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }]);

// Unread notifications
db.notifications.countDocuments({ read: false });

// Notifications by user (replace USER_ID)
db.notifications.find({ userId: "USER_ID" }).sort({ createdAt: -1 }).pretty();

// Email sent status
db.notifications.aggregate([
    { $group: { _id: "$emailSent", count: { $sum: 1 } } },
]);

// Exit MongoDB
exit;
```

## Testing Read/Write Replicas

### Write Test (Primary Only)

```bash
# Auth - Write to primary
kubectl exec -n campus-shop postgres-auth-0 -- \
  psql -U admin -d auth_db -c \
  "INSERT INTO \"Users\" (id, email, password, name, \"isVerified\", \"createdAt\", \"updatedAt\")
   VALUES (gen_random_uuid(), 'replicatest@test.com', 'hash', 'Replica Test', true, NOW(), NOW());"

# Verify on replica (should appear after replication lag)
kubectl exec -n campus-shop postgres-auth-1 -- \
  psql -U admin -d auth_db -c \
  "SELECT * FROM \"Users\" WHERE email = 'replicatest@test.com';"
```

### Read Test (Both Primary and Replica)

```bash
# Read from primary
kubectl exec -n campus-shop postgres-auth-0 -- \
  psql -U admin -d auth_db -tAc "SELECT COUNT(*) FROM \"Users\";"

# Read from replica (should be same or slightly behind)
kubectl exec -n campus-shop postgres-auth-1 -- \
  psql -U admin -d auth_db -tAc "SELECT COUNT(*) FROM \"Users\";"
```

### Check Replication Status

```bash
# On primary - check replicas connected
kubectl exec -n campus-shop postgres-auth-0 -- \
  psql -U admin -d auth_db -c \
  "SELECT client_addr, state, sync_state, replay_lag
   FROM pg_stat_replication;"

# On replica - check replication lag
kubectl exec -n campus-shop postgres-auth-1 -- \
  psql -U admin -d auth_db -c \
  "SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) as lag_seconds;"

# On replica - verify it's in recovery mode
kubectl exec -n campus-shop postgres-auth-1 -- \
  psql -U admin -d auth_db -c "SELECT pg_is_in_recovery();"
```

### Connection Distribution Check

```bash
# Check active connections on all databases
for service in auth items bids profiles notifications; do
  echo "=== postgres-${service} ==="
  echo "Primary:"
  kubectl exec -n campus-shop postgres-${service}-0 -- \
    psql -U admin -d ${service}_db -tAc \
    "SELECT COUNT(*) FROM pg_stat_activity WHERE datname='${service}_db';"
  echo "Replica:"
  kubectl exec -n campus-shop postgres-${service}-1 -- \
    psql -U admin -d ${service}_db -tAc \
    "SELECT COUNT(*) FROM pg_stat_activity WHERE datname='${service}_db';"
  echo ""
done
```

## Full System Data Check

```bash
# One-liner to check all data counts
echo "=== System Data Summary ===" && \
echo "Users: $(kubectl exec -n campus-shop postgres-auth-0 -- psql -U admin -d auth_db -tAc 'SELECT COUNT(*) FROM \"Users\";')" && \
echo "Items: $(kubectl exec -n campus-shop postgres-items-0 -- psql -U admin -d items_db -tAc 'SELECT COUNT(*) FROM \"Items\";')" && \
echo "Bids: $(kubectl exec -n campus-shop postgres-bids-0 -- psql -U admin -d bids_db -tAc 'SELECT COUNT(*) FROM \"Bids\";')" && \
echo "Profiles: $(kubectl exec -n campus-shop postgres-profiles-0 -- psql -U admin -d profiles_db -tAc 'SELECT COUNT(*) FROM \"Profiles\";')" && \
echo "Processed Events: $(kubectl exec -n campus-shop postgres-notifications-0 -- psql -U admin -d notifications_db -tAc 'SELECT COUNT(*) FROM \"ProcessedEvents\";')" && \
echo "MongoDB Notifications: $(kubectl exec -n campus-shop mongodb-0 -- mongosh campus-shop --quiet --eval 'db.notifications.countDocuments()')"
```

## Cleanup Test Data

```bash
# Delete test users (be careful!)
kubectl exec -n campus-shop postgres-auth-0 -- \
  psql -U admin -d auth_db -c \
  "DELETE FROM \"Users\" WHERE email LIKE '%testuser%' OR email LIKE '%test.com';"

# Or delete by date
kubectl exec -n campus-shop postgres-auth-0 -- \
  psql -U admin -d auth_db -c \
  "DELETE FROM \"Users\" WHERE \"createdAt\" > '2025-11-12';"
```
