# Grafana Dashboards - Campus Marketplace

This directory contains pre-configured Grafana dashboards for monitoring the Campus Marketplace microservices platform.

## Dashboards Overview

### 1. Service Metrics Dashboard (`1-service-metrics.json`)

**Focus:** HTTP request metrics and application performance

-   HTTP request rate by service
-   Request duration (p95 latency)
-   HTTP status code distribution
-   Error rate by service
-   Request duration heatmap
-   Top 5 slowest routes
-   Request distribution pie chart

**Key Metrics:**

-   `http_requests_total` - Total HTTP requests
-   `http_request_duration_seconds` - Request latency
-   Status codes (2xx, 4xx, 5xx)

---

## Future Dashboards

The following dashboards can be added once additional metrics are instrumented:

### Database Metrics (Pending)

**Requirements:**

-   Sequelize query hooks to track `db_query_duration_seconds`
-   PostgreSQL exporter for connection and replication metrics

### System Overview (Pending)

**Requirements:**

-   kube-state-metrics deployment for Kubernetes metrics
-   Container resource metrics collection

### Business KPIs (Pending)

**Requirements:**

-   Custom business metric counters (registrations, items created, bids placed)
-   Enhanced route labeling for endpoint-specific tracking

---

## How to Import Dashboards

### Method 1: Grafana UI (Manual Import)

1. Access Grafana at `http://localhost:3000` (via port-forward)
2. Login with credentials:

    - Username: `admin`
    - Password: `admin`

3. Import the dashboard:
    - Click **"+" → Import** in the left sidebar
    - Click **"Upload JSON file"**
    - Select `1-service-metrics.json`
    - Select **"Prometheus"** as the data source
    - Click **"Import"**

### Method 2: Grafana API (Automated)

```bash
# Port-forward Grafana first
kubectl port-forward -n monitoring svc/grafana 3000:3000

# Import dashboard
curl -X POST http://admin:admin@localhost:3000/api/dashboards/db \
  -H "Content-Type: application/json" \
  -d @k8s/monitoring/dashboards/1-service-metrics.json
```

---

## Dashboard Refresh Interval

-   **Service Metrics:** 10 seconds (real-time monitoring)

## Troubleshooting

### No Data Showing

1. **Check Prometheus data source:**

    ```bash
    # Verify Prometheus is running
    kubectl get pods -n monitoring

    # Check Prometheus targets
    kubectl port-forward -n monitoring svc/prometheus 9090:9090
    # Visit http://localhost:9090/targets
    ```

2. **Verify metrics are being collected:**

    ```bash
    # Check if services have /metrics endpoint
    kubectl exec -n campus-shop deployment/auth-service -- wget -qO- http://localhost:5001/metrics
    ```

3. **Check Grafana logs:**
    ```bash
    kubectl logs -n monitoring deployment/grafana
    ```

### Dashboards Not Loading

-   Ensure Prometheus data source URL is correct: `http://prometheus.monitoring.svc.cluster.local:9090`
-   Check Grafana can reach Prometheus:
    ```bash
    kubectl exec -n monitoring deployment/grafana -- wget -qO- http://prometheus.monitoring.svc.cluster.local:9090/api/v1/targets
    ```

---

## Customization

All dashboards are JSON files and can be customized:

1. Export existing dashboard from Grafana UI
2. Modify JSON (add panels, change queries, etc.)
3. Re-import the modified dashboard

### Common Customizations:

-   **Add alerts:** Add `"alert"` blocks to panel definitions
-   **Change time ranges:** Modify `"range"` in targets
-   **Add variables:** Add `"templating"` section for dynamic filters
-   **Modify thresholds:** Update `"thresholds"` in fieldConfig

---

## Metrics Reference

### Custom Application Metrics (from prom-client)

-   `http_request_total{app, method, route, status_code}` - Counter
-   `http_request_duration_seconds{app, method, route}` - Histogram
-   `db_query_duration_seconds{app}` - Histogram

### Kubernetes Metrics (from kube-state-metrics)

-   `kube_pod_status_phase` - Pod states
-   `kube_pod_container_status_restarts_total` - Restart counts
-   `container_cpu_usage_seconds_total` - CPU usage
-   `container_memory_working_set_bytes` - Memory usage

### PostgreSQL Metrics (if postgres-exporter is deployed)

-   `pg_stat_activity_count` - Active connections
-   `pg_replication_lag` - Replication delay
-   `pg_stat_database_tup_fetched` - Tuples fetched
-   `pg_stat_database_tup_inserted` - Tuples inserted

---

## Next Steps

1. Import all 4 dashboards into Grafana
2. Configure alerting rules for critical metrics
3. Set up notification channels (email, Slack, etc.)
4. Create additional custom dashboards as needed

## Support

For issues or questions about these dashboards, refer to:

-   [Grafana Documentation](https://grafana.com/docs/)
-   [Prometheus Query Language](https://prometheus.io/docs/prometheus/latest/querying/basics/)
-   Campus Marketplace ROADMAP.md
