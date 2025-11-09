# Kubernetes Secrets Setup

This directory contains sensitive configuration data for the Campus Shop application.

## ⚠️ Security Notice

The actual secret files are **NOT** tracked in Git for security reasons. You must create them locally.

## Required Secret Files

Create the following files in this directory:

### 1. `postgres-secrets.yaml`

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: postgres-auth-secret
  namespace: campus-shop
type: Opaque
stringData:
  POSTGRES_USER: admin
  POSTGRES_PASSWORD: your_secure_password_here
  POSTGRES_DB: auth_db
---
apiVersion: v1
kind: Secret
metadata:
  name: postgres-items-secret
  namespace: campus-shop
type: Opaque
stringData:
  POSTGRES_USER: admin
  POSTGRES_PASSWORD: your_secure_password_here
  POSTGRES_DB: items_db
---
apiVersion: v1
kind: Secret
metadata:
  name: postgres-bids-secret
  namespace: campus-shop
type: Opaque
stringData:
  POSTGRES_USER: admin
  POSTGRES_PASSWORD: your_secure_password_here
  POSTGRES_DB: bids_db
---
apiVersion: v1
kind: Secret
metadata:
  name: postgres-profiles-secret
  namespace: campus-shop
type: Opaque
stringData:
  POSTGRES_USER: admin
  POSTGRES_PASSWORD: your_secure_password_here
  POSTGRES_DB: profiles_db
---
apiVersion: v1
kind: Secret
metadata:
  name: postgres-notifications-secret
  namespace: campus-shop
type: Opaque
stringData:
  POSTGRES_USER: admin
  POSTGRES_PASSWORD: your_secure_password_here
  POSTGRES_DB: notifications_db
```

### 2. `minio-secrets.yaml`

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: minio-secret
  namespace: campus-shop
type: Opaque
stringData:
  MINIO_ROOT_USER: minioadmin
  MINIO_ROOT_PASSWORD: minioadmin
```

### 3. `service-secrets.yaml`

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: auth-service-secret
  namespace: campus-shop
type: Opaque
stringData:
  DB_HOST: postgres-auth-service
  DB_USER: admin
  DB_PASSWORD: your_secure_password_here
  DB_NAME: auth_db
  DB_PORT: "5432"
  JWT_SECRET: your_jwt_secret_here_minimum_32_characters
  EMAIL_HOST: smtp-relay.brevo.com
  EMAIL_PORT: "587"
  EMAIL_USER: your_smtp_user@smtp-brevo.com
  EMAIL_PASS: your_smtp_password_here
  EMAIL_FROM: '"Campus Shop" <your_email@example.com>'
---
apiVersion: v1
kind: Secret
metadata:
  name: items-service-secret
  namespace: campus-shop
type: Opaque
stringData:
  DB_HOST: postgres-items-service
  DB_USER: admin
  DB_PASSWORD: your_secure_password_here
  DB_NAME: items_db
  DB_PORT: "5432"
  JWT_SECRET: your_jwt_secret_here_minimum_32_characters
  MINIO_ENDPOINT: minio-service
  MINIO_PORT: "9000"
  MINIO_ACCESS_KEY: minioadmin
  MINIO_SECRET_KEY: minioadmin
  MINIO_PUBLIC_URL: http://localhost:9000
  KAFKA_BROKER: kafka-service.campus-shop.svc.cluster.local:9092
---
apiVersion: v1
kind: Secret
metadata:
  name: bidding-service-secret
  namespace: campus-shop
type: Opaque
stringData:
  DB_HOST: postgres-bids-service
  DB_USER: admin
  DB_PASSWORD: your_secure_password_here
  DB_NAME: bids_db
  DB_PORT: "5432"
  JWT_SECRET: your_jwt_secret_here_minimum_32_characters
  KAFKA_BROKER: kafka-service.campus-shop.svc.cluster.local:9092
---
apiVersion: v1
kind: Secret
metadata:
  name: notifications-service-secret
  namespace: campus-shop
type: Opaque
stringData:
  DB_HOST: postgres-notifications-service
  DB_USER: admin
  DB_PASSWORD: your_secure_password_here
  DB_NAME: notifications_db
  DB_PORT: "5432"
  KAFKA_BROKER: kafka-service.campus-shop.svc.cluster.local:9092
  EMAIL_HOST: smtp-relay.brevo.com
  EMAIL_PORT: "587"
  EMAIL_USER: your_smtp_user@smtp-brevo.com
  EMAIL_PASS: your_smtp_password_here
  EMAIL_FROM: '"Campus Shop" <your_email@example.com>'
---
apiVersion: v1
kind: Secret
metadata:
  name: profile-service-secret
  namespace: campus-shop
type: Opaque
stringData:
  DB_HOST: postgres-profiles-service
  DB_USER: admin
  DB_PASSWORD: your_secure_password_here
  DB_NAME: profiles_db
  DB_PORT: "5432"
  JWT_SECRET: your_jwt_secret_here_minimum_32_characters
```

## Quick Setup Instructions

1. Copy the template files above and replace placeholder values with your actual secrets
2. Generate a strong JWT secret:
   ```bash
   openssl rand -base64 48
   ```
3. Apply the secrets to your cluster:
   ```bash
   kubectl apply -f k8s/secrets/
   ```

## Security Best Practices

- Never commit actual secret values to Git
- Use different passwords for each environment (dev/staging/prod)
- Rotate secrets regularly
- For production, consider using external secret management tools like:
  - HashiCorp Vault
  - AWS Secrets Manager
  - Azure Key Vault
  - Google Secret Manager
  - Sealed Secrets (for GitOps workflows)
