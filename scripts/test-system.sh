#!/bin/bash

# Campus Shop System Test Script
# Usage: ./test-system.sh [OPTIONS]
#
# Options:
#   --quick         Run quick test (5 users, 10 items, 5 bids)
#   --small         Run small test (50 users, 100 items, 50 bids)
#   --medium        Run medium test (200 users, 500 items, 200 bids)
#   --large         Run large test (500 users, 2000 items, 1000 bids)
#   --auth          Test only auth service
#   --items         Test only items service
#   --bidding       Test only bidding service
#   --notifications Test only notifications service
#   --profile       Test only profile service
#   --db            Test only databases (read/write replicas)
#   --kafka         Test only Kafka
#   --all           Test everything (default)
#   --log FILE      Append results to log file (default: test-results.log)

# Don't exit on error - we want to see all test results
# set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default values
TEST_SIZE="quick"
TEST_AUTH=false
TEST_ITEMS=false
TEST_BIDDING=false
TEST_NOTIFICATIONS=false
TEST_PROFILE=false
TEST_DB=false
TEST_KAFKA=false
TEST_ALL=true
LOG_DIR="logs"
LOG_FILE="logs/test-results.log"
API_BASE="http://localhost:8080/api"

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --quick)
            TEST_SIZE="quick"
            shift
            ;;
        --small)
            TEST_SIZE="small"
            shift
            ;;
        --medium)
            TEST_SIZE="medium"
            shift
            ;;
        --large)
            TEST_SIZE="large"
            shift
            ;;
        --auth)
            TEST_AUTH=true
            TEST_ALL=false
            shift
            ;;
        --items)
            TEST_ITEMS=true
            TEST_ALL=false
            shift
            ;;
        --bidding)
            TEST_BIDDING=true
            TEST_ALL=false
            shift
            ;;
        --notifications)
            TEST_NOTIFICATIONS=true
            TEST_ALL=false
            shift
            ;;
        --profile)
            TEST_PROFILE=true
            TEST_ALL=false
            shift
            ;;
        --db)
            TEST_DB=true
            TEST_ALL=false
            shift
            ;;
        --kafka)
            TEST_KAFKA=true
            TEST_ALL=false
            shift
            ;;
        --all)
            TEST_ALL=true
            shift
            ;;
        --log)
            LOG_FILE="$2"
            # If log file doesn't have logs/ prefix, add it
            if [[ ! "$LOG_FILE" =~ ^logs/ ]] && [[ ! "$LOG_FILE" =~ ^/ ]]; then
                LOG_FILE="logs/$LOG_FILE"
            fi
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Set test parameters based on size
case $TEST_SIZE in
    quick)
        NUM_USERS=5
        NUM_ITEMS=10
        NUM_BIDS=5
        ;;
    small)
        NUM_USERS=50
        NUM_ITEMS=100
        NUM_BIDS=50
        ;;
    medium)
        NUM_USERS=200
        NUM_ITEMS=500
        NUM_BIDS=200
        ;;
    large)
        NUM_USERS=500
        NUM_ITEMS=2000
        NUM_BIDS=1000
        ;;
esac

# Enable all tests if --all is set
if [ "$TEST_ALL" = true ]; then
    TEST_AUTH=true
    TEST_ITEMS=true
    TEST_BIDDING=true
    TEST_NOTIFICATIONS=true
    TEST_PROFILE=true
    TEST_DB=true
    TEST_KAFKA=true
fi

# Logging function
log() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} | ${message}" | tee -a "$LOG_FILE"
}

log_section() {
    local section="$1"
    log "\n=========================================="
    log "$section"
    log "=========================================="
}

# Check prerequisites
check_prerequisites() {
    log_section "Checking Prerequisites"
    
    if ! command -v kubectl &> /dev/null; then
        log "${RED}kubectl not found${NC}"
        exit 1
    fi
    
    if ! command -v curl &> /dev/null; then
        log "${RED}curl not found${NC}"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        log "${RED}jq not found${NC}"
        exit 1
    fi
    
    # Check cluster
    if ! kubectl get pods -n campus-shop &> /dev/null; then
        log "${RED}Cannot connect to cluster or namespace not found${NC}"
        exit 1
    fi
    
    log "${GREEN}All prerequisites met${NC}"
}

# Check all services health
check_services_health() {
    log_section "Checking Services Health"
    
    local services=(
        "Auth Service:${API_BASE}/auth/health"
        "Items Service:${API_BASE}/items/health"
        "Bidding Service:${API_BASE}/bids/health"
        "Profile Service:${API_BASE}/profiles/health"
        "Notifications Service:${API_BASE}/notifications/health"
    )
    
    local all_healthy=true
    
    for service_info in "${services[@]}"; do
        local service_name="${service_info%%:*}"
        local endpoint="${service_info#*:}"
        
        if curl -s -f -o /dev/null "${endpoint}" 2>/dev/null; then
            log "  ${GREEN}✓${NC} ${service_name}: Healthy"
        else
            log "  ${RED}✗${NC} ${service_name}: Failed"
            all_healthy=false
        fi
    done
    
    echo ""
    
    if [ "$all_healthy" = false ]; then
        log "${YELLOW}⚠️  Warning: Some services are not healthy${NC}"
        log "${YELLOW}   Tests may fail if services are down${NC}"
        echo ""
    else
        log "${GREEN}All services are healthy${NC}"
    fi
}

# Test database read/write replicas
test_databases() {
    log_section "Testing Database Replicas (Read/Write)"
    
    local services=("auth" "items" "bids" "profiles" "notifications")
    local db_names=("auth_db" "items_db" "bids_db" "profiles_db" "notifications_db")
    
    for i in "${!services[@]}"; do
        local service="${services[$i]}"
        local db="${db_names[$i]}"
        
        log "\nTesting postgres-${service}..."
        
        # Test primary (write)
        log "  Primary (postgres-${service}-0):"
        local primary_count=$(kubectl exec -n campus-shop postgres-${service}-0 -- \
            psql -U admin -d ${db} -tAc "SELECT COUNT(*) FROM pg_stat_activity WHERE datname='${db}';" 2>/dev/null || echo "0")
        log "    Active connections: ${primary_count}"
        
        # Check replication status
        local replication_status=$(kubectl exec -n campus-shop postgres-${service}-0 -- \
            psql -U admin -d ${db} -tAc "SELECT state FROM pg_stat_replication LIMIT 1;" 2>/dev/null || echo "none")
        log "    Replication status: ${replication_status}"
        
        # Test replica (read)
        log "  Replica (postgres-${service}-1):"
        local replica_count=$(kubectl exec -n campus-shop postgres-${service}-1 -- \
            psql -U admin -d ${db} -tAc "SELECT COUNT(*) FROM pg_stat_activity WHERE datname='${db}';" 2>/dev/null || echo "0")
        log "    Active connections: ${replica_count}"
        
        # Check replication lag
        local lag=$(kubectl exec -n campus-shop postgres-${service}-1 -- \
            psql -U admin -d ${db} -tAc "SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()));" 2>/dev/null || echo "unknown")
        log "    Replication lag: ${lag}s"
        
        if [ "$replication_status" == "streaming" ]; then
            log "    ${GREEN}Status: HEALTHY${NC}"
        else
            log "    ${YELLOW}Status: CHECK REPLICATION${NC}"
        fi
    done
}

# Test Kafka
test_kafka() {
    log_section "Testing Kafka"
    
    # Check Kafka pod
    local kafka_pod=$(kubectl get pods -n campus-shop -l app=kafka -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
    if [ -z "$kafka_pod" ]; then
        log "${RED}Kafka pod not found${NC}"
        return
    fi
    
    log "Kafka pod: ${kafka_pod}"
    
    # List topics
    log "\nKafka topics:"
    kubectl exec -n campus-shop ${kafka_pod} -- \
        kafka-topics.sh --bootstrap-server localhost:9092 --list 2>/dev/null | tee -a "$LOG_FILE"
    
    # Check consumer groups
    log "\nConsumer groups:"
    kubectl exec -n campus-shop ${kafka_pod} -- \
        kafka-consumer-groups.sh --bootstrap-server localhost:9092 --list 2>/dev/null | tee -a "$LOG_FILE"
    
    # Check consumer lag
    log "\nConsumer lag (notifications-group):"
    kubectl exec -n campus-shop ${kafka_pod} -- \
        kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
        --describe --group notifications-group 2>/dev/null | tee -a "$LOG_FILE"
}

# Test auth service
test_auth_service() {
    log_section "Testing Auth Service ($NUM_USERS users)"
    
    local start_time=$(date +%s)
    local success=0
    local failed=0
    local timestamp=$(date +%s)
    
    for i in $(seq 1 $NUM_USERS); do
        local email="testuser${timestamp}${i}@iitj.ac.in"
        local response=$(curl -s -w "\n%{http_code}" -X POST ${API_BASE}/auth/register \
            -H "Content-Type: application/json" \
            -d "{\"email\":\"${email}\",\"password\":\"Test123!\",\"name\":\"Test User ${i}\"}" 2>/dev/null || echo "000")
        
        local http_code=$(echo "$response" | tail -n 1)
        if [ "$http_code" == "201" ] || [ "$http_code" == "200" ]; then
            ((success++))
        else
            ((failed++))
        fi
    done
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    if [ $duration -eq 0 ]; then duration=1; fi
    local throughput=$((success / duration))
    
    log "Results:"
    log "  Successful: ${GREEN}${success}${NC}"
    log "  Failed: ${RED}${failed}${NC}"
    log "  Duration: ${duration}s"
    log "  Throughput: ${throughput} req/sec"
    
    # Count total users in database
    local total_users=$(kubectl exec -n campus-shop postgres-auth-0 -- \
        psql -U admin -d auth_db -tAc "SELECT COUNT(*) FROM \"Users\";" 2>/dev/null || echo "0")
    log "  Total users in DB: ${total_users}"
}

# Test items service
test_items_service() {
    log_section "Testing Items Service ($NUM_ITEMS items)"
    
    # Get a valid token first
    local timestamp=$(date +%s)
    local test_email="itemtest${timestamp}@iitj.ac.in"
    
    curl -s -X POST ${API_BASE}/auth/register \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"${test_email}\",\"password\":\"Test123!\",\"name\":\"Item Tester\"}" > /dev/null 2>&1
    
    # Auto-verify user
    kubectl exec -n campus-shop postgres-auth-0 -- \
        psql -U admin -d auth_db -c "UPDATE \"Users\" SET \"isVerified\" = true WHERE email = '${test_email}';" > /dev/null 2>&1
    
    # Login
    local login_response=$(curl -s -X POST ${API_BASE}/auth/login \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"${test_email}\",\"password\":\"Test123!\"}")
    local token=$(echo "$login_response" | jq -r '.token // .data.token // empty')
    
    if [ -z "$token" ] || [ "$token" == "null" ]; then
        log "${RED}Failed to get auth token${NC}"
        return
    fi
    
    local start_time=$(date +%s)
    local success=0
    local failed=0
    local created_items=()
    
    # Test 1: Create items
    for i in $(seq 1 $NUM_ITEMS); do
        local response=$(curl -s -w "\n%{http_code}" -X POST ${API_BASE}/items \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${token}" \
            -d "{\"title\":\"Test Item ${i}\",\"description\":\"Test description\",\"price\":100,\"imageUrl\":\"https://example.com/img.jpg\"}" 2>/dev/null || echo "000")
        
        local http_code=$(echo "$response" | tail -n 1)
        if [ "$http_code" == "201" ] || [ "$http_code" == "200" ]; then
            ((success++))
            local body=$(echo "$response" | head -n -1)
            local item_id=$(echo "$body" | jq -r '.id // empty' 2>/dev/null)
            if [ -n "$item_id" ] && [ "$item_id" != "null" ]; then
                created_items+=("$item_id")
            fi
        else
            ((failed++))
        fi
    done
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    if [ $duration -eq 0 ]; then duration=1; fi
    local throughput=$((success / duration))
    
    log "Item Creation Results:"
    log "  Successful: ${GREEN}${success}${NC}"
    log "  Failed: ${RED}${failed}${NC}"
    log "  Duration: ${duration}s"
    log "  Throughput: ${throughput} req/sec"
    
    # Test 2: Get all items (public endpoint)
    local get_all_response=$(curl -s -w "\n%{http_code}" -X GET "${API_BASE}/items" 2>/dev/null || echo "000")
    local get_all_code=$(echo "$get_all_response" | tail -n 1)
    if [ "$get_all_code" == "200" ]; then
        local items_count=$(echo "$get_all_response" | head -n -1 | jq '. | length' 2>/dev/null || echo "0")
        log "✓ Get All Items: ${GREEN}SUCCESS${NC} (${items_count} items)"
    else
        log "✗ Get All Items: ${RED}FAILED (HTTP ${get_all_code})${NC}"
    fi
    
    # Test 3: Get single item
    if [ ${#created_items[@]} -gt 0 ]; then
        local test_item_id="${created_items[0]}"
        local get_item_response=$(curl -s -w "\n%{http_code}" -X GET "${API_BASE}/items/${test_item_id}" 2>/dev/null || echo "000")
        local get_item_code=$(echo "$get_item_response" | tail -n 1)
        if [ "$get_item_code" == "200" ]; then
            log "✓ Get Item by ID: ${GREEN}SUCCESS${NC}"
        else
            log "✗ Get Item by ID: ${RED}FAILED (HTTP ${get_item_code})${NC}"
        fi
        
        # Test 4: Update item
        local update_response=$(curl -s -w "\n%{http_code}" -X PUT "${API_BASE}/items/${test_item_id}" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${token}" \
            -d "{\"title\":\"Updated Item\",\"price\":200}" 2>/dev/null || echo "000")
        local update_code=$(echo "$update_response" | tail -n 1)
        if [ "$update_code" == "200" ]; then
            log "✓ Update Item: ${GREEN}SUCCESS${NC}"
        else
            log "✗ Update Item: ${RED}FAILED (HTTP ${update_code})${NC}"
        fi
    fi
    
    # Test 5: Mark items as sold
    if [ ${#created_items[@]} -gt 0 ]; then
        log ""
        log "Testing Mark as Sold (${#created_items[@]} items)..."
        local sold_success=0
        local sold_failed=0
        
        for item_id in "${created_items[@]}"; do
            local sold_response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/items/${item_id}/sell" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer ${token}" 2>/dev/null || echo "000")
            
            local sold_http_code=$(echo "$sold_response" | tail -n 1)
            if [ "$sold_http_code" == "200" ]; then
                ((sold_success++))
            else
                ((sold_failed++))
            fi
        done
        
        log "  Mark as Sold - Successful: ${GREEN}${sold_success}${NC}"
        log "  Mark as Sold - Failed: ${RED}${sold_failed}${NC}"
        
        # Test 6: Delete one item (test with first item)
        if [ ${#created_items[@]} -gt 1 ]; then
            local delete_item_id="${created_items[1]}"
            local delete_response=$(curl -s -w "\n%{http_code}" -X DELETE "${API_BASE}/items/${delete_item_id}" \
                -H "Authorization: Bearer ${token}" 2>/dev/null || echo "000")
            local delete_code=$(echo "$delete_response" | tail -n 1)
            if [ "$delete_code" == "200" ]; then
                log "✓ Delete Item: ${GREEN}SUCCESS${NC}"
            else
                log "✗ Delete Item: ${RED}FAILED (HTTP ${delete_code})${NC}"
            fi
        fi
        
        # Test 7: Image upload (test with an unsold item)
        if [ ${#created_items[@]} -gt 2 ]; then
            local image_item_id="${created_items[2]}"
            # Create a simple test image (1x1 PNG)
            local test_image="/tmp/test_item_image.png"
            echo -n "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > "$test_image"
            
            local image_response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/items/${image_item_id}/image" \
                -H "Authorization: Bearer ${token}" \
                -F "itemImage=@${test_image}" 2>/dev/null || echo "000")
            local image_code=$(echo "$image_response" | tail -n 1)
            if [ "$image_code" == "200" ]; then
                local image_url=$(echo "$image_response" | head -n -1 | jq -r '.item.imageUrl // empty' 2>/dev/null)
                if [ -n "$image_url" ]; then
                    log "✓ Upload Image: ${GREEN}SUCCESS${NC} (${image_url:0:50}...)"
                else
                    log "✓ Upload Image: ${GREEN}SUCCESS${NC}"
                fi
            else
                log "✗ Upload Image: ${RED}FAILED (HTTP ${image_code})${NC}"
            fi
            
            # Cleanup
            rm -f "$test_image"
        fi
    fi
    
    # Count total items in database
    local total_items=$(kubectl exec -n campus-shop postgres-items-0 -- \
        psql -U admin -d items_db -tAc "SELECT COUNT(*) FROM \"Items\";" 2>/dev/null || echo "0")
    log "  Total items in DB: ${total_items}"
    
    # Count sold items
    local sold_items=$(kubectl exec -n campus-shop postgres-items-0 -- \
        psql -U admin -d items_db -tAc "SELECT COUNT(*) FROM \"Items\" WHERE status = 'sold';" 2>/dev/null || echo "0")
    log "  Sold items in DB: ${sold_items}"
}

# Test bidding service
test_bidding_service() {
    log_section "Testing Bidding Service ($NUM_BIDS bids)"
    
    local timestamp=$(date +%s)
    
    # Create a seller user and items first
    local seller_email="seller${timestamp}@iitj.ac.in"
    curl -s -X POST ${API_BASE}/auth/register \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"${seller_email}\",\"password\":\"Test123!\",\"name\":\"Test Seller\"}" > /dev/null 2>&1
    
    kubectl exec -n campus-shop postgres-auth-0 -- \
        psql -U admin -d auth_db -c "UPDATE \"Users\" SET \"isVerified\" = true WHERE email = '${seller_email}';" > /dev/null 2>&1
    
    local seller_login=$(curl -s -X POST ${API_BASE}/auth/login \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"${seller_email}\",\"password\":\"Test123!\"}")
    local seller_token=$(echo "$seller_login" | jq -r '.token // .data.token // empty')
    
    if [ -z "$seller_token" ] || [ "$seller_token" == "null" ]; then
        log "${RED}Failed to create seller account${NC}"
        return
    fi
    
    # Create items from seller
    log "  Creating ${NUM_BIDS} items from seller..."
    local created_items=()
    local max_item_price=$((100 + NUM_BIDS * 10))
    for j in $(seq 1 $NUM_BIDS); do
        local item_response=$(curl -s -X POST ${API_BASE}/items \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${seller_token}" \
            -d "{\"title\":\"Bid Test Item ${timestamp}-${j}\",\"description\":\"Item for bidding test\",\"price\":$((100 + j * 10)),\"imageUrl\":\"https://example.com/img.jpg\"}" 2>/dev/null)
        local item_id=$(echo "$item_response" | jq -r '.id // .data.id // empty' 2>/dev/null)
        if [ -n "$item_id" ] && [ "$item_id" != "null" ]; then
            created_items+=("$item_id")
        fi
    done
    
    if [ ${#created_items[@]} -eq 0 ]; then
        log "${RED}Failed to create any items${NC}"
        return
    fi
    
    log "  Created ${#created_items[@]} items"
    
    # Now create a bidder user (different from seller)
    local bidder_email="bidder${timestamp}@iitj.ac.in"
    curl -s -X POST ${API_BASE}/auth/register \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"${bidder_email}\",\"password\":\"Test123!\",\"name\":\"Test Bidder\"}" > /dev/null 2>&1
    
    kubectl exec -n campus-shop postgres-auth-0 -- \
        psql -U admin -d auth_db -c "UPDATE \"Users\" SET \"isVerified\" = true WHERE email = '${bidder_email}';" > /dev/null 2>&1
    
    local bidder_login=$(curl -s -X POST ${API_BASE}/auth/login \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"${bidder_email}\",\"password\":\"Test123!\"}")
    local token=$(echo "$bidder_login" | jq -r '.token // .data.token // empty')
    
    if [ -z "$token" ] || [ "$token" == "null" ]; then
        log "${RED}Failed to create bidder account${NC}"
        return
    fi
    
    # Place bids on the items
    local start_time=$(date +%s)
    local success=0
    local failed=0
    local actual_bid_count=${#created_items[@]}
    
    # Only bid on items we actually created
    if [ $actual_bid_count -lt $NUM_BIDS ]; then
        log "  ${YELLOW}Warning: Only created ${actual_bid_count} items, will place ${actual_bid_count} bids${NC}"
    fi
    
    for i in $(seq 1 $actual_bid_count); do
        local item_id="${created_items[$((i - 1))]}"
        
        # Skip if item_id is empty
        if [ -z "$item_id" ] || [ "$item_id" == "null" ]; then
            ((failed++))
            continue
        fi
        
        # Ensure bid is higher than maximum possible item price
        local bid_amount=$((max_item_price + 50 + RANDOM % 400))
        
        local response=$(curl -s -w "\n%{http_code}" -X POST ${API_BASE}/bids \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${token}" \
            -d "{\"itemId\":\"${item_id}\",\"amount\":${bid_amount}}" 2>/dev/null || echo "000")
        
        local http_code=$(echo "$response" | tail -n 1)
        if [ "$http_code" == "201" ] || [ "$http_code" == "200" ]; then
            ((success++))
        else
            ((failed++))
            # Log first 3 failures for debugging
            if [ $failed -le 3 ]; then
                local body=$(echo "$response" | head -n -1)
                local error_msg=$(echo "$body" | jq -r '.message // .error // "Unknown error"' 2>/dev/null || echo "Parse error")
                log "  ${RED}Bid $i failed (HTTP $http_code): $error_msg${NC}"
            fi
        fi
    done
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    if [ $duration -eq 0 ]; then duration=1; fi
    local throughput=$((success / duration))
    
    log "Results:"
    log "  Successful: ${GREEN}${success}${NC}"
    log "  Failed: ${RED}${failed}${NC}"
    log "  Duration: ${duration}s"
    log "  Throughput: ${throughput} req/sec"
    
    # Count total bids in database
    local total_bids=$(kubectl exec -n campus-shop postgres-bids-0 -- \
        psql -U admin -d bids_db -tAc "SELECT COUNT(*) FROM \"Bids\";" 2>/dev/null || echo "0")
    log "  Total bids in DB: ${total_bids}"
    
    # Test bidding service GET endpoints
    if [ $success -gt 0 ] && [ ${#created_items[@]} -gt 0 ]; then
        log ""
        log "Testing Bidding GET Endpoints..."
        
        # Test 1: Get all bids
        local get_bids_response=$(curl -s -w "\n%{http_code}" -X GET "${API_BASE}/bids" \
            -H "Authorization: Bearer ${token}" 2>/dev/null || echo "000")
        local get_bids_code=$(echo "$get_bids_response" | tail -n 1)
        if [ "$get_bids_code" == "200" ]; then
            local bids_count=$(echo "$get_bids_response" | head -n -1 | jq '. | length' 2>/dev/null || echo "0")
            log "✓ Get All Bids: ${GREEN}SUCCESS${NC} (${bids_count} bids)"
        else
            log "✗ Get All Bids: ${RED}FAILED (HTTP ${get_bids_code})${NC}"
        fi
        
        # Test 2: Get bids for specific item
        local test_item_id="${created_items[0]}"
        local get_item_bids_response=$(curl -s -w "\n%{http_code}" -X GET "${API_BASE}/bids/item/${test_item_id}" \
            -H "Authorization: Bearer ${token}" 2>/dev/null || echo "000")
        local get_item_bids_code=$(echo "$get_item_bids_response" | tail -n 1)
        if [ "$get_item_bids_code" == "200" ]; then
            local item_bids_count=$(echo "$get_item_bids_response" | head -n -1 | jq '. | length' 2>/dev/null || echo "0")
            log "✓ Get Bids for Item: ${GREEN}SUCCESS${NC} (${item_bids_count} bids)"
        else
            log "✗ Get Bids for Item: ${RED}FAILED (HTTP ${get_item_bids_code})${NC}"
        fi
    fi
}

# Test notifications service
test_notifications_service() {
    log_section "Testing Notifications Service"
    
    # Count processed events
    local processed_events=$(kubectl exec -n campus-shop postgres-notifications-0 -- \
        psql -U admin -d notifications_db -tAc "SELECT COUNT(*) FROM \"ProcessedEvents\";" 2>/dev/null || echo "0")
    log "Processed Kafka events: ${processed_events}"
    
    # Count notifications (using correct database name and authentication)
    local mongodb_pod=$(kubectl get pods -n campus-shop -l app=mongodb -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    local mongo_user=$(kubectl get secret -n campus-shop mongodb-secret -o jsonpath='{.data.MONGO_INITDB_ROOT_USERNAME}' 2>/dev/null | base64 -d)
    local mongo_pass=$(kubectl get secret -n campus-shop mongodb-secret -o jsonpath='{.data.MONGO_INITDB_ROOT_PASSWORD}' 2>/dev/null | base64 -d)
    local total_notifications=$(kubectl exec -n campus-shop ${mongodb_pod} -- \
        mongosh -u "${mongo_user}" -p "${mongo_pass}" --authenticationDatabase admin notifications --quiet --eval "db.notifications.countDocuments()" 2>/dev/null || echo "0")
    log "Total notifications in MongoDB: ${total_notifications}"
    
    # Check email status
    local notifications_pod=$(kubectl get pods -n campus-shop -l app=notifications-service -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
    if [ -n "$notifications_pod" ]; then
        local skipped_emails=$(kubectl logs -n campus-shop ${notifications_pod} --tail=10000 | grep -c "SKIPPED" 2>/dev/null || echo "0")
        log "Emails skipped (DISABLE_EMAILS): ${skipped_emails}"
    fi
    
    # Test API endpoints - need to generate notifications first
    log ""
    log "Testing Notifications API Endpoints..."
    local timestamp=$(date +%s)
    local seller_email="seller${timestamp}@iitj.ac.in"
    local bidder_email="bidder${timestamp}@iitj.ac.in"
    
    # Create seller account
    curl -s -X POST ${API_BASE}/auth/register \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"${seller_email}\",\"password\":\"Test123!\",\"name\":\"Seller\"}" > /dev/null 2>&1
    
    kubectl exec -n campus-shop postgres-auth-0 -- \
        psql -U admin -d auth_db -c "UPDATE \"Users\" SET \"isVerified\" = true WHERE email = '${seller_email}';" > /dev/null 2>&1
    
    local seller_login=$(curl -s -X POST ${API_BASE}/auth/login \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"${seller_email}\",\"password\":\"Test123!\"}")
    local seller_token=$(echo "$seller_login" | jq -r '.token // .data.token // empty')
    
    # Seller creates an item (generates notification for seller)
    local item_response=$(curl -s -X POST ${API_BASE}/items \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${seller_token}" \
        -d "{\"title\":\"Notif Test Item\",\"description\":\"Test\",\"price\":100,\"imageUrl\":\"https://example.com/img.jpg\"}" 2>/dev/null)
    local item_id=$(echo "$item_response" | jq -r '.id // empty' 2>/dev/null)
    
    # Create bidder account
    curl -s -X POST ${API_BASE}/auth/register \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"${bidder_email}\",\"password\":\"Test123!\",\"name\":\"Bidder\"}" > /dev/null 2>&1
    
    kubectl exec -n campus-shop postgres-auth-0 -- \
        psql -U admin -d auth_db -c "UPDATE \"Users\" SET \"isVerified\" = true WHERE email = '${bidder_email}';" > /dev/null 2>&1
    
    local bidder_login=$(curl -s -X POST ${API_BASE}/auth/login \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"${bidder_email}\",\"password\":\"Test123!\"}")
    local bidder_token=$(echo "$bidder_login" | jq -r '.token // .data.token // empty')
    
    # Bidder places bid (generates notification for seller)
    if [ -n "$item_id" ] && [ "$item_id" != "null" ]; then
        curl -s -X POST ${API_BASE}/bids \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${bidder_token}" \
            -d "{\"itemId\":\"${item_id}\",\"amount\":150}" > /dev/null 2>&1
        
        # Create another item and bid to have multiple notifications
        local item_response2=$(curl -s -X POST ${API_BASE}/items \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${seller_token}" \
            -d "{\"title\":\"Notif Test Item 2\",\"description\":\"Test\",\"price\":200,\"imageUrl\":\"https://example.com/img.jpg\"}" 2>/dev/null)
        local item_id2=$(echo "$item_response2" | jq -r '.id // empty' 2>/dev/null)
        
        if [ -n "$item_id2" ] && [ "$item_id2" != "null" ]; then
            curl -s -X POST ${API_BASE}/bids \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer ${bidder_token}" \
                -d "{\"itemId\":\"${item_id2}\",\"amount\":250}" > /dev/null 2>&1
        fi
        
        # Wait longer for Kafka to process and notifications to be created
        sleep 5
    fi
    
    # Now test with seller's account (should have notifications)
    if [ -n "$seller_token" ] && [ "$seller_token" != "null" ]; then
        # Test 1: Get notifications (paginated)
        local get_notifs_response=$(curl -s -w "\n%{http_code}" -X GET "${API_BASE}/notifications?limit=10&skip=0" \
            -H "Authorization: Bearer ${seller_token}" 2>/dev/null || echo "000")
        local get_notifs_code=$(echo "$get_notifs_response" | tail -n 1)
        local notifs_count=0
        if [ "$get_notifs_code" == "200" ]; then
            notifs_count=$(echo "$get_notifs_response" | head -n -1 | jq '.notifications | length' 2>/dev/null || echo "0")
            log "✓ Get Notifications: ${GREEN}SUCCESS${NC} (${notifs_count} notifications)"
        else
            log "✗ Get Notifications: ${RED}FAILED (HTTP ${get_notifs_code})${NC}"
        fi
        
        # Test 2: Get unread count
        local unread_response=$(curl -s -w "\n%{http_code}" -X GET "${API_BASE}/notifications/unread-count" \
            -H "Authorization: Bearer ${seller_token}" 2>/dev/null || echo "000")
        local unread_code=$(echo "$unread_response" | tail -n 1)
        local unread_count=0
        if [ "$unread_code" == "200" ]; then
            unread_count=$(echo "$unread_response" | head -n -1 | jq '.count // 0' 2>/dev/null || echo "0")
            log "✓ Get Unread Count: ${GREEN}SUCCESS${NC} (${unread_count} unread)"
        else
            log "✗ Get Unread Count: ${RED}FAILED (HTTP ${unread_code})${NC}"
        fi
        
        # Test 3: Get notification stats
        local stats_response=$(curl -s -w "\n%{http_code}" -X GET "${API_BASE}/notifications/stats" \
            -H "Authorization: Bearer ${seller_token}" 2>/dev/null || echo "000")
        local stats_code=$(echo "$stats_response" | tail -n 1)
        if [ "$stats_code" == "200" ]; then
            log "✓ Get Notification Stats: ${GREEN}SUCCESS${NC}"
        else
            log "✗ Get Notification Stats: ${RED}FAILED (HTTP ${stats_code})${NC}"
        fi
        
        # Test 4: Mark notification as read (if we have notifications)
        if [ "$notifs_count" -gt 0 ]; then
            local notif_id=$(echo "$get_notifs_response" | head -n -1 | jq -r '.notifications[0]._id // empty' 2>/dev/null)
            if [ -n "$notif_id" ] && [ "$notif_id" != "null" ]; then
                local mark_read_response=$(curl -s -w "\n%{http_code}" -X PATCH "${API_BASE}/notifications/${notif_id}/read" \
                    -H "Authorization: Bearer ${seller_token}" 2>/dev/null || echo "000")
                local mark_read_code=$(echo "$mark_read_response" | tail -n 1)
                if [ "$mark_read_code" == "200" ]; then
                    log "✓ Mark Notification as Read: ${GREEN}SUCCESS${NC}"
                else
                    log "✗ Mark Notification as Read: ${RED}FAILED (HTTP ${mark_read_code})${NC}"
                fi
            fi
        fi
        
        # Test 5: Mark all as read
        if [ "$unread_count" -gt 0 ]; then
            local mark_all_response=$(curl -s -w "\n%{http_code}" -X PATCH "${API_BASE}/notifications/mark-all-read" \
                -H "Authorization: Bearer ${seller_token}" 2>/dev/null || echo "000")
            local mark_all_code=$(echo "$mark_all_response" | tail -n 1)
            if [ "$mark_all_code" == "200" ]; then
                local modified_count=$(echo "$mark_all_response" | head -n -1 | jq '.modifiedCount // 0' 2>/dev/null || echo "0")
                log "✓ Mark All as Read: ${GREEN}SUCCESS${NC} (${modified_count} marked)"
            else
                log "✗ Mark All as Read: ${RED}FAILED (HTTP ${mark_all_code})${NC}"
            fi
        fi
        
        # Test 6: Delete notification (if we have any)
        if [ "$notifs_count" -gt 1 ]; then
            local notif_id_to_delete=$(echo "$get_notifs_response" | head -n -1 | jq -r '.notifications[1]._id // empty' 2>/dev/null)
            if [ -n "$notif_id_to_delete" ] && [ "$notif_id_to_delete" != "null" ]; then
                local delete_response=$(curl -s -w "\n%{http_code}" -X DELETE "${API_BASE}/notifications/${notif_id_to_delete}" \
                    -H "Authorization: Bearer ${seller_token}" 2>/dev/null || echo "000")
                local delete_code=$(echo "$delete_response" | tail -n 1)
                if [ "$delete_code" == "200" ]; then
                    log "✓ Delete Notification: ${GREEN}SUCCESS${NC}"
                else
                    log "✗ Delete Notification: ${RED}FAILED (HTTP ${delete_code})${NC}"
                fi
            fi
        fi
    else
        log "Notifications API tests: ${RED}FAILED (no token)${NC}"
    fi
}

# Test profile service
test_profile_service() {
    log_section "Testing Profile Service"
    
    # Count profiles
    local total_profiles=$(kubectl exec -n campus-shop postgres-profiles-0 -- \
        psql -U admin -d profiles_db -tAc "SELECT COUNT(*) FROM \"Profiles\";" 2>/dev/null || echo "0")
    log "Total profiles in DB: ${total_profiles}"
    
    # Test profile endpoint with a user
    local timestamp=$(date +%s)
    local test_email="profiletest${timestamp}@iitj.ac.in"
    
    curl -s -X POST ${API_BASE}/auth/register \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"${test_email}\",\"password\":\"Test123!\",\"name\":\"Profile Tester\"}" > /dev/null 2>&1
    
    kubectl exec -n campus-shop postgres-auth-0 -- \
        psql -U admin -d auth_db -c "UPDATE \"Users\" SET \"isVerified\" = true WHERE email = '${test_email}';" > /dev/null 2>&1
    
    local login_response=$(curl -s -X POST ${API_BASE}/auth/login \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"${test_email}\",\"password\":\"Test123!\"}")
    local token=$(echo "$login_response" | jq -r '.token // .data.token // empty')
    
    if [ -n "$token" ] && [ "$token" != "null" ]; then
        # Test 1: Get profile endpoint
        local profile_response=$(curl -s -w "\n%{http_code}" -X GET ${API_BASE}/profiles/me \
            -H "Authorization: Bearer ${token}" 2>/dev/null || echo "000")
        local profile_code=$(echo "$profile_response" | tail -n 1)
        
        if [ "$profile_code" == "200" ]; then
            log "✓ Get Profile: ${GREEN}SUCCESS${NC}"
        else
            log "✗ Get Profile: ${RED}FAILED (HTTP ${profile_code})${NC}"
        fi
        
        # Test 2: Get posted items
        local posted_response=$(curl -s -w "\n%{http_code}" -X GET ${API_BASE}/profiles/me/items/posted \
            -H "Authorization: Bearer ${token}" 2>/dev/null || echo "000")
        local posted_code=$(echo "$posted_response" | tail -n 1)
        
        if [ "$posted_code" == "200" ]; then
            log "✓ Get Posted Items: ${GREEN}SUCCESS${NC}"
        else
            log "✗ Get Posted Items: ${RED}FAILED (HTTP ${posted_code})${NC}"
        fi
        
        # Test 3: Get sold items
        local sold_response=$(curl -s -w "\n%{http_code}" -X GET ${API_BASE}/profiles/me/items/sold \
            -H "Authorization: Bearer ${token}" 2>/dev/null || echo "000")
        local sold_code=$(echo "$sold_response" | tail -n 1)
        
        if [ "$sold_code" == "200" ]; then
            log "✓ Get Sold Items: ${GREEN}SUCCESS${NC}"
        else
            log "✗ Get Sold Items: ${RED}FAILED (HTTP ${sold_code})${NC}"
        fi
        
        # Test 4: Get my bids
        local bids_response=$(curl -s -w "\n%{http_code}" -X GET ${API_BASE}/profiles/me/bids \
            -H "Authorization: Bearer ${token}" 2>/dev/null || echo "000")
        local bids_code=$(echo "$bids_response" | tail -n 1)
        
        if [ "$bids_code" == "200" ]; then
            log "✓ Get My Bids: ${GREEN}SUCCESS${NC}"
        else
            log "✗ Get My Bids: ${RED}FAILED (HTTP ${bids_code})${NC}"
        fi
        
        # Test 5: Update profile
        local update_response=$(curl -s -w "\n%{http_code}" -X PUT ${API_BASE}/profiles/me \
            -H "Authorization: Bearer ${token}" \
            -H "Content-Type: application/json" \
            -d "{\"displayName\":\"Test User ${timestamp}\",\"phoneNumber\":\"1234567890\"}" 2>/dev/null || echo "000")
        local update_code=$(echo "$update_response" | tail -n 1)
        
        if [ "$update_code" == "200" ]; then
            log "✓ Update Profile: ${GREEN}SUCCESS${NC}"
        else
            log "✗ Update Profile: ${RED}FAILED (HTTP ${update_code})${NC}"
        fi
        
        # Test 6: Get active bids (need to create item and bid first)
        log ""
        log "Testing Medium Priority Endpoints..."
        
        # Create an item as this user
        local test_item_response=$(curl -s -X POST ${API_BASE}/items \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${token}" \
            -d "{\"title\":\"Profile Test Item\",\"description\":\"Test\",\"price\":100,\"imageUrl\":\"https://example.com/img.jpg\"}" 2>/dev/null)
        local test_item_id=$(echo "$test_item_response" | jq -r '.id // empty' 2>/dev/null)
        
        # Create another user to bid on the item
        local bidder_timestamp=$(date +%s)
        local bidder_email="bidder${bidder_timestamp}@iitj.ac.in"
        curl -s -X POST ${API_BASE}/auth/register \
            -H "Content-Type: application/json" \
            -d "{\"email\":\"${bidder_email}\",\"password\":\"Test123!\",\"name\":\"Bidder\"}" > /dev/null 2>&1
        
        kubectl exec -n campus-shop postgres-auth-0 -- \
            psql -U admin -d auth_db -c "UPDATE \"Users\" SET \"isVerified\" = true WHERE email = '${bidder_email}';" > /dev/null 2>&1
        
        local bidder_login=$(curl -s -X POST ${API_BASE}/auth/login \
            -H "Content-Type: application/json" \
            -d "{\"email\":\"${bidder_email}\",\"password\":\"Test123!\"}")
        local bidder_token=$(echo "$bidder_login" | jq -r '.token // .data.token // empty')
        
        # Bidder places a bid (creates an active bid)
        if [ -n "$test_item_id" ] && [ "$test_item_id" != "null" ] && [ -n "$bidder_token" ] && [ "$bidder_token" != "null" ]; then
            curl -s -X POST ${API_BASE}/bids \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer ${bidder_token}" \
                -d "{\"itemId\":\"${test_item_id}\",\"amount\":150}" > /dev/null 2>&1
            
            # Test active bids for the bidder
            local active_bids_response=$(curl -s -w "\n%{http_code}" -X GET ${API_BASE}/profiles/me/bids/active \
                -H "Authorization: Bearer ${bidder_token}" 2>/dev/null || echo "000")
            local active_bids_code=$(echo "$active_bids_response" | tail -n 1)
            
            if [ "$active_bids_code" == "200" ]; then
                local active_bids_count=$(echo "$active_bids_response" | head -n -1 | jq '. | length' 2>/dev/null || echo "0")
                log "✓ Get Active Bids: ${GREEN}SUCCESS${NC} (${active_bids_count} active bids)"
            else
                log "✗ Get Active Bids: ${RED}FAILED (HTTP ${active_bids_code})${NC}"
            fi
            
            # Test purchased items (seller marked as sold, bidder won)
            local purchased_response=$(curl -s -w "\n%{http_code}" -X GET ${API_BASE}/profiles/me/items/purchased \
                -H "Authorization: Bearer ${bidder_token}" 2>/dev/null || echo "000")
            local purchased_code=$(echo "$purchased_response" | tail -n 1)
            
            if [ "$purchased_code" == "200" ]; then
                local purchased_count=$(echo "$purchased_response" | head -n -1 | jq '. | length' 2>/dev/null || echo "0")
                log "✓ Get Purchased Items: ${GREEN}SUCCESS${NC} (${purchased_count} purchased)"
            else
                log "✗ Get Purchased Items: ${RED}FAILED (HTTP ${purchased_code})${NC}"
            fi
            
            # Test other user profile (bidder views seller profile)
            local user_id_response=$(curl -s -X GET ${API_BASE}/auth/user/${test_item_id} \
                -H "Authorization: Bearer ${token}" 2>/dev/null)
            local seller_user_id=$(echo "$user_id_response" | jq -r '.userId // .id // empty' 2>/dev/null)
            
            # For now, test with the token user's own ID since we need a valid user ID
            local my_user_response=$(curl -s -X GET ${API_BASE}/profiles/me \
                -H "Authorization: Bearer ${token}" 2>/dev/null)
            local my_user_id=$(echo "$my_user_response" | jq -r '.userId // empty' 2>/dev/null)
            
            if [ -n "$my_user_id" ] && [ "$my_user_id" != "null" ]; then
                local other_profile_response=$(curl -s -w "\n%{http_code}" -X GET "${API_BASE}/profiles/${my_user_id}" \
                    -H "Authorization: Bearer ${bidder_token}" 2>/dev/null || echo "000")
                local other_profile_code=$(echo "$other_profile_response" | tail -n 1)
                
                if [ "$other_profile_code" == "200" ]; then
                    log "✓ Get Other User Profile: ${GREEN}SUCCESS${NC}"
                else
                    log "✗ Get Other User Profile: ${RED}FAILED (HTTP ${other_profile_code})${NC}"
                fi
            fi
        fi
        
        # Test items/me/bids (seller views bids on their items)
        if [ -n "$test_item_id" ] && [ "$test_item_id" != "null" ]; then
            local seller_bids_response=$(curl -s -w "\n%{http_code}" -X GET ${API_BASE}/items/me/bids \
                -H "Authorization: Bearer ${token}" 2>/dev/null || echo "000")
            local seller_bids_code=$(echo "$seller_bids_response" | tail -n 1)
            
            if [ "$seller_bids_code" == "200" ]; then
                local seller_bids_count=$(echo "$seller_bids_response" | head -n -1 | jq '. | length' 2>/dev/null || echo "0")
                log "✓ Get Bids on My Items: ${GREEN}SUCCESS${NC} (${seller_bids_count} bids received)"
            else
                log "✗ Get Bids on My Items: ${RED}FAILED (HTTP ${seller_bids_code})${NC}"
            fi
        fi
    else
        log "Profile endpoint tests: ${RED}FAILED (no token)${NC}"
    fi
}

# Main execution
main() {
    log_section "Campus Shop System Test - $(date)"
    log "Test Size: ${TEST_SIZE}"
    log "Parameters: ${NUM_USERS} users, ${NUM_ITEMS} items, ${NUM_BIDS} bids"
    log "Log File: ${LOG_FILE}"
    
    check_prerequisites
    
    check_services_health
    
    # System overview
    log_section "System Overview"
    log "Pods:"
    kubectl get pods -n campus-shop | tee -a "$LOG_FILE"
    
    log "\nHPA Status:"
    kubectl get hpa -n campus-shop 2>/dev/null | tee -a "$LOG_FILE" || log "No HPA configured"
    
    # Run tests
    if [ "$TEST_DB" = true ]; then
        test_databases
    fi
    
    if [ "$TEST_KAFKA" = true ]; then
        test_kafka
    fi
    
    if [ "$TEST_AUTH" = true ]; then
        test_auth_service
    fi
    
    if [ "$TEST_ITEMS" = true ]; then
        test_items_service
    fi
    
    if [ "$TEST_BIDDING" = true ]; then
        test_bidding_service
    fi
    
    if [ "$TEST_NOTIFICATIONS" = true ]; then
        test_notifications_service
    fi
    
    if [ "$TEST_PROFILE" = true ]; then
        test_profile_service
    fi
    
    # Final summary
    log_section "Test Summary"
    log "Total users: $(kubectl exec -n campus-shop postgres-auth-0 -- psql -U admin -d auth_db -tAc "SELECT COUNT(*) FROM \"Users\";" 2>/dev/null || echo "0")"
    log "Total items: $(kubectl exec -n campus-shop postgres-items-0 -- psql -U admin -d items_db -tAc "SELECT COUNT(*) FROM \"Items\";" 2>/dev/null || echo "0")"
    log "Total bids: $(kubectl exec -n campus-shop postgres-bids-0 -- psql -U admin -d bids_db -tAc "SELECT COUNT(*) FROM \"Bids\";" 2>/dev/null || echo "0")"
    log "Total profiles: $(kubectl exec -n campus-shop postgres-profiles-0 -- psql -U admin -d profiles_db -tAc "SELECT COUNT(*) FROM \"Profiles\";" 2>/dev/null || echo "0")"
    log "Processed events: $(kubectl exec -n campus-shop postgres-notifications-0 -- psql -U admin -d notifications_db -tAc "SELECT COUNT(*) FROM \"ProcessedEvents\";" 2>/dev/null || echo "0")"
    
    log "\n${GREEN}Test completed successfully!${NC}"
    log "Full results saved to: ${LOG_FILE}"
}

main
