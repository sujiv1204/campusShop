# 🚨 Emergency: Disable Email Sending

## Problem

The seed script generates Kafka events that trigger email notifications. This consumed your Brevo email credits, and there are pending emails in the queue that will retry tomorrow.

## ✅ Solution Implemented

### Code Changes

Added `DISABLE_EMAILS` environment variable to the notifications service:

-   **File**: `services/notifications-service/src/consumer.js`
-   **What it does**: Skips `transporter.sendMail()` calls but still processes events and logs to MongoDB
-   **Default**: `false` (emails enabled for normal operation)

### Quick Fix Commands

#### **Option 1: Disable Emails Immediately (K8s)**

```bash
# Set environment variable without rebuilding
kubectl set env deployment/notifications-service -n campus-shop DISABLE_EMAILS=true

# Restart to apply
kubectl rollout restart deployment/notifications-service -n campus-shop

# Verify
kubectl logs -n campus-shop $(kubectl get pods -n campus-shop -l app=notifications-service -o jsonpath='{.items[0].metadata.name}') | grep "EMAIL SENDING IS DISABLED"
```

#### **Option 2: Stop Processing Events Entirely**

```bash
# Scale down notifications service (no email processing at all)
kubectl scale deployment notifications-service -n campus-shop --replicas=0

# Later, scale back up
kubectl scale deployment notifications-service -n campus-shop --replicas=1
```

#### **Option 3: Pause Kafka Consumer**

```bash
# Delete notifications pod (consumer stops)
kubectl delete pod -n campus-shop -l app=notifications-service

# Events stay in Kafka queue, can be processed later
```

### Permanent Configuration (Rebuild Required)

#### **For K8s Deployment:**

1. Edit `k8s/deployments/notifications.yaml`:

    ```yaml
    - name: DISABLE_EMAILS
      value: "true" # Changed from "false"
    ```

2. Rebuild and redeploy:
    ```bash
    cd services/notifications-service
    docker build -t notifications-service:local .
    kind load docker-image notifications-service:local --name campus-cluster
    kubectl rollout restart deployment/notifications-service -n campus-shop
    ```

#### **For Docker Compose:**

Add to `services_envs/notifications-service/.env`:

```env
DISABLE_EMAILS=true
```

Then restart:

```bash
docker-compose restart notifications-service
```

## Testing Without Emails

### Run Seed Script with Emails Disabled

```bash
# First, disable emails (Option 1 above)

# Then run seed script
cd scripts
npm run seed:full

# You'll see logs like:
# 📧 [SKIPPED] Would have sent bid notification to testuser@iitj.ac.in
```

### Verify Events Are Still Processed

```bash
# Check MongoDB notifications (created but not emailed)
kubectl exec -n campus-shop mongodb-0 -- mongosh campus_notifications \
  --eval "db.notifications.countDocuments()"

# Check PostgreSQL event deduplication (working)
kubectl exec -n campus-shop postgres-notifications-0 -- \
  psql -U admin -d notifications_db -c "SELECT COUNT(*) FROM \"ProcessedEvents\";"

# Check Kafka consumer is running
kubectl logs -n campus-shop $(kubectl get pods -n campus-shop -l app=notifications-service -o jsonpath='{.items[0].metadata.name}') | tail -20
```

## What Still Works When Emails Are Disabled

✅ **Full API Testing**: All services and APIs still tested
✅ **Kafka Events**: Bid events published and consumed
✅ **MongoDB Notifications**: Notifications created and logged
✅ **PostgreSQL Deduplication**: Events tracked, no duplicates
✅ **Email Preferences**: Preferences checked (respects user settings)
✅ **Service-to-Service**: Profile service still called for preferences

❌ **Actual Email Sending**: `transporter.sendMail()` is skipped

## Brevo Credit Management

### Current Situation

-   ❌ Credits exhausted from seed script emails
-   ⚠️ Backlog of emails will retry tomorrow (automatic)
-   📊 Check Brevo dashboard for queue status

### Prevent Tomorrow's Retry Storm

**Option A: Clear Brevo Queue (Recommended)**

1. Login to Brevo dashboard
2. Go to Transactional > Logs
3. Find pending emails (status: "queued" or "deferred")
4. Cancel/delete queued emails if possible

**Option B: Keep Service Scaled Down**

```bash
# Keep notifications service at 0 replicas until Brevo credits renew
kubectl scale deployment notifications-service -n campus-shop --replicas=0
```

**Option C: Use DISABLE_EMAILS Permanently**

-   Emails won't be sent even when credits renew
-   You control when to re-enable via environment variable

## For Performance Testing (Without Email Costs)

### Updated Seed Script Commands

```bash
# Small test (no emails)
npm run seed:small

# Medium test (no emails)
npm run seed:medium

# Full test (no emails) - Safe to run!
npm run seed:full
```

### Enable Emails Only for Demo

```bash
# Before demo/evaluation
kubectl set env deployment/notifications-service -n campus-shop DISABLE_EMAILS=false

# After demo
kubectl set env deployment/notifications-service -n campus-shop DISABLE_EMAILS=true
```

## Recovery Steps

### When Credits Renew Tomorrow

1. **Check Brevo Queue**: Cancel any pending retries if needed
2. **Keep Emails Disabled**: Use `DISABLE_EMAILS=true` for all testing
3. **Enable Selectively**: Only turn on emails for final demo with small dataset

### Safe Demo with Emails

```bash
# 1. Enable emails
kubectl set env deployment/notifications-service -n campus-shop DISABLE_EMAILS=false

# 2. Small demo seed (10 users = ~10-20 emails max)
cd scripts
NUM_USERS=5 NUM_ITEMS=10 NUM_BIDS=10 node seed-data.js

# 3. Immediately disable again
kubectl set env deployment/notifications-service -n campus-shop DISABLE_EMAILS=true
```

## Monitoring

### Check Current Status

```bash
# Is DISABLE_EMAILS set?
kubectl get deployment notifications-service -n campus-shop -o jsonpath='{.spec.template.spec.containers[0].env[?(@.name=="DISABLE_EMAILS")].value}' && echo

# Are emails being skipped?
kubectl logs -n campus-shop $(kubectl get pods -n campus-shop -l app=notifications-service -o jsonpath='{.items[0].metadata.name}') | grep "SKIPPED"

# How many notifications created (not emailed)?
kubectl exec -n campus-shop mongodb-0 -- mongosh campus_notifications \
  --eval "db.notifications.countDocuments({emailSent: true})"
```

## Alternative: Use Fake SMTP for Testing

### Install MailHog (Email Testing Tool)

```bash
# Deploy MailHog in K8s
kubectl run mailhog --image=mailhog/mailhog -n campus-shop
kubectl expose pod mailhog --port=1025 --target-port=1025 --name=mailhog-smtp -n campus-shop
kubectl expose pod mailhog --port=8025 --target-port=8025 --name=mailhog-web -n campus-shop

# Update notifications service to use MailHog
kubectl set env deployment/notifications-service -n campus-shop \
  EMAIL_HOST=mailhog-smtp.campus-shop.svc.cluster.local \
  EMAIL_PORT=1025 \
  DISABLE_EMAILS=false

# View emails at: kubectl port-forward pod/mailhog 8025:8025 -n campus-shop
# Then open http://localhost:8025
```

## Summary

**Immediate Action**: Run `kubectl set env deployment/notifications-service -n campus-shop DISABLE_EMAILS=true`

**For Testing**: Keep emails disabled, all other functionality works perfectly

**For Demo**: Enable emails only with very small dataset (5-10 users max)

**Long-term**: Consider MailHog or other fake SMTP for unlimited testing
