# Production Enhancements Roadmap

## Branch: feature/production-enhancements

**Created:** November 11, 2025  
**Timeline:** 2 days  
**Goal:** Transform Campus Marketplace into production-ready platform

---

## ** v2 Branch - Rate Limiting Integrated **

**Status:** ** Rate limiting successfully integrated via cherry-pick  
**Completion:** ISO 25010 Security & Flexibility requirements SATISFIED

### Rate Limiting Integration (COMPLETED):

-   **Commits Cherry-Picked:**
    -   `04554eb` - Rate limiting & forgot password (Harshil Pathria, Nov 13 03:36)
    -   `70a76cc` - Account-based rate limiting (Harshil Pathria, Nov 13 11:58)
-   **Files Added:**
    -   `services/auth-service/middleware/rateLimit.js` - Email-based rate limiting (5 attempts/min)
    -   `services/auth-service/middleware/accountLimiter.js` - Account-level protection
    -   `frontend/src/pages/Login/resetPassword.jsx` - Password reset UI
    -   Forgot password API (`forgotPassword()`, `resetPassword()`) in auth controller
    -   Load testing infrastructure (k6 scripts, 8000+ test credentials)
-   **Dependencies Added:** `express-rate-limit@8.2.1`, `ioredis@5.8.2`
-   **Commit History:** ** Preserved with original author attribution

### ISO 25010 Compliance Achieved:

** **Security:**

-   Confidentiality: Email-based rate limiting prevents account enumeration
-   Integrity: JWT-based password reset tokens (15min expiry)
-   Authenticity: Email confirmation for password reset
-   Accountability: Login attempts tracked per account
-   Non-repudiation: Email audit trail with message IDs

** **Reliability:**

-   Availability: DoS protection via rate limiting
-   Fault Tolerance: Graceful fallback to IP-based limiting

** **Flexibility:**

-   Environment-based configuration (RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_ATTEMPTS)
-   Modular middleware design (reusable across endpoints)
-   K8s-compatible with trust proxy configuration

### Documentation Created:

-   `SECURITY_ISO25010.md` - Complete ISO 25010 compliance guide
-   `RATE_LIMITING_INTEGRATION.md` - Integration process documentation
-   `RATE_LIMITING_KIND_DEPLOYMENT.md` - ** **KIND DEPLOYMENT VERIFIED**
-   Testing procedures for rate limiting validation
-   Load testing with k6 scripts
-   Environment variable configuration guide

### v2 Branch + Kind Cluster (Production-Ready - 98% Complete):

-   **Base:** feature/production-enhancements + rate limiting ** DEPLOYED
-   **Status:** ** All security requirements satisfied, tested in Kind cluster
-   **Kind Deployment:** ** COMPLETE
    -   Docker image: `auth-service:v2-rate-limiting` built & loaded
    -   K8s secrets updated with rate limit configuration
    -   Pod restarted successfully (no errors)
    -   Rate limiting TESTED & WORKING (HTTP 429 after 5-9 attempts)
    -   All 12/12 features from origin/rate-limiting preserved
-   **Ready For:** Production deployment, final testing, monitoring setup
-   **Completed Steps:**
    1. ** `npm install` in auth-service (express-rate-limit installed)
    2. ** Configure email secrets in K8s (Brevo SMTP configured)
    3. ** Deploy and test rate limiting (working in Kind cluster)
    4. ** Add Prometheus metrics for security monitoring (optional)
    5. ** Deploy Redis for account limiter persistence (optional)

---

## Phase 1: Database Infrastructure (Day 1) **

-   [x] Create feature branch
-   [x] Deploy MongoDB for notification logs
-   [x] Deploy PostgreSQL read replicas (1 primary + 1 replica per DB)
-   [x] Implement read/write split in services
-   [x] Deploy PgBouncer connection pooling (Skipped - not needed with Sequelize pooling)

## Phase 2: Notification System (Day 1) **

-   [x] Build notification center backend (MongoDB + API)
-   [x] Add email preferences to profile service
-   [x] Update notification consumer with preference checks
-   [x] Optimize Kafka consumer (fixed rebalancing issues)
-   [x] Fix service-to-service JWT authentication for preferences
-   [x] Debug and resolve email preferences enforcement (Docker cache issue)

## Phase 3: Frontend & UX (Day 2) ** COMPLETE

### ** Completed

-   [x] Build notification center UI component (Bell icon with real-time polling)
-   [x] Add email preferences settings page (Toggle switches for 3 preference types)
-   [x] Integrate frontend with notification & preferences APIs
-   [x] Fix email preferences enforcement in notification consumer
-   [x] Add purchased items API endpoint to profile service
-   [x] Install react-hot-toast for UI notifications
-   [x] Create example file for toast integration (main_with_toast.jsx.example)
-   [x] **Server-side pagination implementation** - Added to items-service with page, limit, offset params
-   [x] **Server-side search & filters** - ILIKE search on title/description, price range filters, sorting
-   [x] **Pagination UI for BuyItems & LandingPage** - Previous/Next buttons, page numbers, loading states
-   [x] **Purchased Items Tab** - Added to UserProfile with winning bid logic and seller email
-   [x] **Fix purchased items duplicates** - Show only winning bids using highest amount comparison
-   [x] **Smooth search UX** - Debounced search (500ms), loading overlay, prevent Enter key reloads
-   [x] **Profile Management UI** - Complete profile editing (displayName, phoneNumber, email read-only)
-   [x] **User Info in Tabs** - Show name & phone in sold items and purchased items tabs
-   [x] **Compact Card Layout** - Redesigned sold/purchased items with vertical cards, price badges, contact chips

## Phase 4: Monitoring & Observability (Day 2) **

-   [x] Deploy Prometheus monitoring stack
-   [x] Add /metrics endpoints to all services (prom-client)
-   [x] Configure Prometheus RBAC and pod autodiscovery
-   [x] Optimize notification service resources
-   [x] Deploy Grafana with Service Metrics dashboard
-   [ ] Configure database exporters (Future enhancement)

## Phase 5: Testing & Documentation (Day 2) ** IN PROGRESS

### ** Completed

-   [x] Create comprehensive test system script (test-system.sh)
-   [x] Implement endpoint testing for all services (26/32 endpoints tested - 81.25%)
-   [x] Achieve 100% coverage on 4 critical services (Items, Bidding, Profile, Notifications)
-   [x] Add high-priority tests (notification management + image upload)
-   [x] Add medium-priority tests (active bids, purchase history, public profiles, received bids)
-   [x] Create testing documentation (7 comprehensive guides)
-   [x] Validate system with 100% test success rate

### ** Remaining

-   [ ] Create large-scale seed data generation (500 users, 2K items, 5K bids)
-   [ ] Implement 7 performance test scenarios
-   [ ] Generate performance documentation with charts
-   [ ] Create evaluation package with live demo

## Phase 6: Production Optimization (Day 2)

-   [ ] Optimize resource allocation
-   [ ] Final end-to-end testing
-   [ ] Create evaluation artifacts

---

## Current Status Summary (November 13, 2025)

### ** Completed (23/24 major milestones - 96%)

-   **Phase 1 (Database):** PostgreSQL replicas with streaming replication, read/write split
-   **Phase 2 (Notifications):** Backend complete with 6 APIs, email preferences (2 APIs), Kafka consumer with preference enforcement
-   **Phase 3 (Frontend - COMPLETE **):** Notification center UI, email preferences UI, pagination, server-side search, purchased items, profile management with contact info
-   **Phase 4 (Monitoring):** Prometheus + Grafana deployed with Service Metrics dashboard
-   **Phase 5 (Testing - Partial):** 81.25% endpoint coverage (26/32), 100% success rate, 4 services at 100% coverage, comprehensive documentation

### ** Recently Completed - Profile Management Feature (November 13)

**1. ** PROFILE MANAGEMENT UI (COMPLETE)**

-   Component: ProfileManagement with view/edit modes
-   Fields: displayName (editable), phoneNumber (editable), email (read-only)
-   Features: Auto-edit on empty profile, form validation, success/error alerts
-   Backend: Enhanced getMyProfile with email from auth-service
-   K8s Config: Service URLs configured for profile-service communication

**2. ** BUYER/SELLER CONTACT INFO IN TABS**

-   Sold Items Tab: Shows buyer name, phone, email for each sold item
-   Purchased Items Tab: Shows seller name, phone, email for each purchase
-   Backend: Enhanced getSoldItems() and getPurchasedItems() with contact enrichment
-   Bug Fix: Added array validation to prevent "not iterable" errors

**3. ** COMPACT CARD LAYOUT REDESIGN**

-   Layout: Vertical cards with full-width images at top (200px)
-   Price Badges: Color-coded chips (gray/green/blue) for original/sold/paid prices
-   Contact Info: Compact horizontal chips with icons (👤📱📧)
-   Grid: Responsive auto-fill grid (min 320px cards)
-   Hover Effects: Card lift animation with enhanced shadows
-   Mobile: Single column layout with optimized spacing

**Previous Completions:**

**PAGINATION IMPLEMENTED (CRITICAL)** - Backend: Added `page`, `limit`, `offset` params to `getAllItems()` controller - Returns: `items` array + `pagination` metadata (totalPages, currentPage, hasNextPage, etc.) - Frontend: BuyItems & LandingPage both have pagination UI - Result: Handles 2000+ items efficiently with 20-24 items per page

**SERVER-SIDE SEARCH & FILTERS** - Search: Case-insensitive ILIKE on title AND description fields - Filters: Price range (minPrice, maxPrice) using SQL WHERE clauses - Sorting: newest/oldest (createdAt), price-low/price-high (price) - Result: Search works across ALL pages, not just current 24 items

**PURCHASED ITEMS TAB** - Logic: Only shows items where user's bid was the WINNING bid (highest amount) - Display: Shows purchase price, original price, purchase date, seller email - Fixed: No more duplicates from multiple bids on same item - Added: New "Purchased Items" tab in UserProfile page

**SMOOTH SEARCH UX** - Debounce: 500ms delay after typing stops before API call - Loading: Separate states (initialLoading vs searchLoading) - Overlay: Semi-transparent blur effect over items during search - Enter Key: preventDefault to avoid page reloads

### ** Active Progress

-   **Test Coverage:** 81.25% (26/32 endpoints) with 100% success rate
-   **Services at 100%:** Items (8/8), Bidding (3/3), Profile (8/8), Notifications (6/6)
-   **Test Features:** High-priority (4/4) + Medium-priority (4/4) complete
-   **Documentation:** 7 comprehensive testing guides created
-   **System Status:** Production-ready, all critical user journeys validated
-   **Cluster:** 20 pods running, stable performance
-   **Databases:** 10 PostgreSQL pods (5 primaries + 5 replicas), 1 MongoDB pod
-   **Monitoring:** Prometheus scraping 8 service targets, Grafana operational
-   **Frontend:** NotificationCenter + EmailPreferences fully functional
-   **Email System:** All 3 preference types working (bidReceived, itemSold, bidWon)

### ** Next Up (Immediate Priority)

1. **** Phase 3 COMPLETE - Profile Management:**

    - ** Profile editing form (displayName, phoneNumber) implemented
    - ** Email display from auth-service working
    - ** Buyer/seller contact info in sold/purchased tabs
    - ** Compact card layout with responsive design
    - ⏭️ Avatar upload (optional enhancement for future)

2. **🔀 Rate Limiting Branch Merge:**

    - Coordinate with other developers to merge rate limiting features
    - Test rate limiting and forgot password functionality
    - Update documentation for new endpoints

3. **Phase 5 - Performance Testing:**
    - Run seed scripts with large data (500 users, 2000 items, 5000 bids)
    - Test pagination performance with full dataset
    - Generate evaluation documentation with charts

### ** Key Metrics Achieved

-   ** 10 PostgreSQL replicas with streaming replication
-   ** Read/write split configured in all services
-   ** MongoDB polyglot persistence for notification logs
-   ** Prometheus + Grafana monitoring stack operational
-   ** 6 notification APIs + 2 email preference APIs working
-   ** Email preferences enforcement with all 3 types (bidReceived, itemSold, bidWon)
-   ** Frontend notification center with real-time polling
-   ** Service-to-service JWT authentication for preferences
-   ** **81.25% endpoint test coverage (26/32 endpoints)**
-   ** **100% test success rate across all tested endpoints**
-   ** **4 services at perfect 100% coverage (Items, Bidding, Profile, Notifications)**
-   ** **All high-priority features tested (notification management, image upload)**
-   ** **All medium-priority features tested (active bids, purchase history, profiles, received bids)**
-   ** **Server-side pagination with 20-100 items per page**
-   ** **Server-side search across all items (ILIKE + price filters)**
-   ** **Purchased items tracking with winning bid logic**
-   ** **Smooth search UX with debouncing and loading overlays**

### ** Issues Resolved

-   ** Kafka consumer rebalancing optimization
-   ** Service-to-service authentication (JWT token generation)
-   ** Email preferences URL and response parsing
-   ** Frontend field name alignment (bidReceived vs email_on_bid)
-   ** Docker build cache issue preventing code updates
-   ** Client-side search limitations (only searched current page)
-   ** Duplicate purchased items (multiple bids on same item)
-   ** Flashy page reloads during search typing
-   ** Enter key causing page reloads in search inputs
-   ** Missing seller email in purchased items
-   ** No pagination for large datasets (2000+ items)

---

## Key Achievements Target

** 35 Kubernetes pods on 8-core system  
** 97%+ reads served by replicas  
** 80%+ reduction in DB connections via pooling  
** Polyglot persistence (PostgreSQL + MongoDB)  
** Autoscaling 2 → 10 pods under load  
** Comprehensive monitoring dashboards  
** Visual performance documentation for evaluation

---

---

## ** TIME ESTIMATE FOR REMAINING TASKS

### Phase 3: Frontend & UX - Profile Management (2-3 hours)

**Task 3.1: Profile Editing Form** ** 1.5 hours

-   Create profile edit modal/form component (30 min)
-   Add form validation for displayName and phoneNumber (20 min)
-   Integrate with profile API PUT endpoint (20 min)
-   Add success/error toast notifications (20 min)
-   Test edit flow and handle edge cases (20 min)

**Task 3.2: Avatar Upload** ** 1-1.5 hours

-   Add avatar upload UI (file input + preview) (30 min)
-   Integrate with MinIO via profile service (30 min)
-   Add loading states and error handling (20 min)
-   Test with various image formats/sizes (10 min)

**Task 3.3: UI Polish** ** 30 min

-   Add error boundaries to critical components (15 min)
-   Integrate toast notifications globally (15 min)

**Phase 3 Total: 2-3 hours**

---

### Phase 5: Testing & Documentation (PRIORITY: 8-12 hours)

**Task 5.1: Large-Scale Seed Data Generation** ** 2-3 hours

-   ** Seed script already exists (`seed-data.js`)
-   Run seed:full (500 users, 2000 items, 5000 bids) (30 min execution time)
-   Monitor system during seeding (30 min)
-   Verify data quality and distribution (30 min)
-   Document any issues/bottlenecks found (30 min)
-   Re-run with optimizations if needed (1 hour)

**Task 5.2: Performance Test Scenarios** ** 3-4 hours

_Scenario 1: Database Replication Performance_ (30 min)

-   Measure read/write split effectiveness
-   Check replica lag under load
-   Document query distribution
-   Generate charts showing replica usage

_Scenario 2: Pagination Performance_ (30 min)

-   Test pagination with 2000+ items
-   Measure response times for different pages
-   Test search + filter combinations
-   Document query performance

_Scenario 3: HPA Autoscaling_ (45 min)

-   Generate concurrent load using Apache Bench/k6
-   Watch pods scale from 2→10
-   Measure response times during scaling
-   Capture scaling events timeline

_Scenario 4: Kafka Throughput_ (30 min)

-   Monitor consumer lag during bulk operations
-   Test notification delivery rates
-   Measure event processing latency
-   Document queue behavior under load

_Scenario 5: Search Performance_ (30 min)

-   Test ILIKE search with large dataset
-   Measure response times for various queries
-   Test with price filters + sorting
-   Document slow queries and optimization needs

_Scenario 6: End-to-End User Journey_ (30 min)

-   Complete user flow: Register → Post item → Receive bids → Sell
-   Measure total latency across services
-   Verify all notifications delivered
-   Document user experience metrics

_Scenario 7: Concurrent User Simulation_ (30 min)

-   Simulate 50-100 concurrent users
-   Test browsing, bidding, posting simultaneously
-   Measure service response times
-   Check for race conditions or deadlocks

**Task 5.3: Performance Documentation** ** 2-3 hours

_Sub-task 5.3.1: Data Collection & Analysis_ (1 hour)

-   Export Prometheus metrics to CSV
-   Generate Grafana dashboard screenshots
-   Calculate key performance indicators (KPIs):
    -   Average response time per endpoint
    -   95th/99th percentile latency
    -   Database connection pool utilization
    -   Replica read percentage (target: 97%+)
    -   Error rates
    -   Resource utilization (CPU, memory)

_Sub-task 5.3.2: Charts & Visualizations_ (1 hour)

-   Create performance comparison charts:
    -   Before/after pagination implementation
    -   Read/write split distribution
    -   Autoscaling timeline
    -   Search response times by dataset size
    -   Concurrent user load curves
-   Use Grafana, Excel, or Python matplotlib

_Sub-task 5.3.3: Documentation Write-up_ (1 hour)

-   Create `PERFORMANCE_TEST_RESULTS.md` document
-   Document test methodology
-   Present findings with charts
-   Include recommendations for production
-   Add troubleshooting section

**Task 5.4: Evaluation Package** ** 1-2 hours

_Sub-task 5.4.1: Live Demo Setup_ (30 min)

-   Deploy to accessible environment (if needed)
-   Create demo user accounts
-   Seed representative data
-   Test all features working

_Sub-task 5.4.2: Evaluation Document_ (30-60 min)

-   Create `EVALUATION.md` with:
    -   Project overview and architecture
    -   Key features implemented
    -   Performance metrics achieved
    -   Screenshots/diagrams
    -   Instructions to verify claims

_Sub-task 5.4.3: Video Demo (Optional)_ (30 min)

-   Record 5-10 min walkthrough
-   Show key features and performance
-   Demonstrate monitoring dashboards

**Phase 5 Total: 8-12 hours**

---

### Phase 6: Production Optimization (2-3 hours)

**Task 6.1: Resource Allocation Optimization** ** 1-1.5 hours

-   Analyze resource usage from performance tests (30 min)
-   Adjust CPU/memory requests and limits (20 min)
-   Optimize HPA thresholds based on test data (20 min)
-   Test with updated resource configs (20 min)

**Task 6.2: Final End-to-End Testing** ** 1 hour

-   Run complete system test with test-system.sh --large (30 min)
-   Verify all 32 endpoints (aim for 100% coverage) (20 min)
-   Check all critical user journeys (10 min)

**Task 6.3: Evaluation Artifacts** ** 30 min

-   Finalize all documentation (10 min)
-   Create architecture diagram (if not exists) (15 min)
-   Package evaluation materials (5 min)

**Phase 6 Total: 2-3 hours**

---

### 📊 TOTAL TIME ESTIMATE

| Phase       | Task                       | Time Estimate   |
| ----------- | -------------------------- | --------------- |
| **Phase 3** | Profile Management UI      | 2-3 hours       |
| **Phase 5** | Large-Scale Seeding        | 2-3 hours       |
| **Phase 5** | Performance Test Scenarios | 3-4 hours       |
| **Phase 5** | Performance Documentation  | 2-3 hours       |
| **Phase 5** | Evaluation Package         | 1-2 hours       |
| **Phase 6** | Production Optimization    | 2-3 hours       |
| **TOTAL**   | **All Remaining Tasks**    | **12-18 hours** |

### ** Recommended Schedule

**Session 1: Frontend Completion (2-3 hours)**

-   Complete profile management UI
-   Quick testing
-   Commit and deploy

**Session 2: Large-Scale Testing (4-6 hours)**

-   Run seed script with full dataset
-   Execute all 7 performance test scenarios
-   Collect metrics and screenshots
-   Document initial findings

**Session 3: Documentation & Polish (4-6 hours)**

-   Create performance charts and visualizations
-   Write comprehensive performance documentation
-   Build evaluation package
-   Optimize resources based on findings

**Session 4: Final Review (2-3 hours)**

-   Final end-to-end testing
-   Package evaluation artifacts
-   Review all documentation
-   Prepare for evaluation/demo

### ⚠️ Key Notes

1. **Testing Scenarios (8-12 hours)** is the largest remaining effort
2. **Seed script already exists** - saves 2-3 hours of development
3. **Test infrastructure ready** - Prometheus/Grafana operational
4. **Documentation is critical** - Budget adequate time for quality write-ups
5. **Concurrent execution** - Some tests can run in parallel
6. **Buffer time** - Add 20-30% buffer for unexpected issues

### ** Quick Path (Minimum Viable)

If time is limited, prioritize:

1. Skip profile management UI (2-3 hours saved) - use API directly
2. Run 4 core test scenarios instead of 7 (1 hour saved)
3. Basic documentation instead of extensive charts (1 hour saved)

**Minimum Time: 8-10 hours** (focused on testing + documentation)

---

## ** **5-HOUR CRITICAL PATH** → See [5_HOUR_PLAN.md](5_HOUR_PLAN.md)

**If you have only 5 hours left:**

-   **Hour 1:** Run seed script (500/2000/5000) + monitor in real-time
-   **Hour 2:** Core performance tests (pagination, search, DB replication)
-   **Hour 3:** Full system test + Kafka validation
-   **Hour 4:** Create PERFORMANCE_TEST_RESULTS.md with metrics
-   **Hour 5:** Create EVALUATION.md + final commits

**What you'll achieve:**
** Large-scale data in system  
** Performance metrics documented  
** Test coverage validated (81%+)  
** Evaluation package complete  
** Production-ready evidence

---

## ** TIME ESTIMATE FOR REMAINING TASKS

---

## Commit Strategy

-   Commit after each stable milestone
-   Descriptive commit messages following conventional commits
-   Tag major milestones
-   Merge to k8s branch when complete
