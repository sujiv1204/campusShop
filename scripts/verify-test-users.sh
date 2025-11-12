#!/bin/bash
# Helper script to auto-verify all test users in the database

echo "Auto-verifying all test users in auth database..."

# Get auth database pod
AUTH_POD=$(kubectl get pods -n campus-shop -l app=postgres-auth,statefulset.kubernetes.io/pod-name=postgres-auth-0 -o jsonpath='{.items[0].metadata.name}')

if [ -z "$AUTH_POD" ]; then
    echo "❌ Could not find postgres-auth pod"
    exit 1
fi

echo "Found pod: $AUTH_POD"

# Update all testuser emails to be verified
kubectl exec -n campus-shop $AUTH_POD -- psql -U authuser -d authdb -c "UPDATE \"Users\" SET \"isVerified\" = true WHERE email LIKE 'testuser%@iitj.ac.in';"

echo "✅ All testuser accounts are now verified"
