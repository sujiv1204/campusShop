# 3-Hour Sprint Plan - Testing & Production Readiness

**Time Remaining:** 3 hours  
**Current Status:** v2 branch at 98% complete  
**Goal:** Comprehensive testing, bug fixes, final polish before merging to main

---

## Quick Cleanup ✅

```bash
# Commit cleanup
git add -A
git commit -m "chore: remove unnecessary documentation"
git push origin v2
```

---

## Hour 1: System Testing & Bug Fixes (60 min)

### 1.1 End-to-End Flow Testing (30 min)

**Priority 1: Critical User Flows**

```bash
# Test 1: Registration → Email Verification → Login (5 min)
curl -X POST http://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"sprint-test@iitj.ac.in","password":"Test123!","confirmPassword":"Test123!"}'

# Verify email link, then login
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sprint-test@iitj.ac.in","password":"Test123!"}'

# Test 2: Profile Management (5 min)
# - Open frontend: http://localhost:8080
# - Login with verified account
# - Go to UserProfile → Profile Settings tab
# - Edit displayName and phoneNumber
# - Verify email is read-only
# - Save and refresh page

# Test 3: Item Upload with Image (5 min)
# - Go to Dashboard → Upload Item
# - Fill form (title, description, price, category)
# - Upload image (test with 5MB image)
# - Submit and verify image appears

# Test 4: Search & Pagination (5 min)
# - Go to Buy Items page
# - Test search with partial title
# - Test price range filters
# - Navigate between pages (Previous/Next)
# - Verify 12 items per page

# Test 5: Bidding Flow (5 min)
# - Select an item from Buy Items
# - Place a bid (higher than current price)
# - Go to Dashboard → Active Bids
# - Verify bid appears
# - Owner accepts bid
# - Verify notification received

# Test 6: Sold/Purchased Items (5 min)
# - Go to UserProfile → Sold Items tab
# - Verify compact cards with buyer info (name, phone, email)
# - Go to Purchased Items tab
# - Verify seller info displayed
```

**Expected Issues to Fix:**

-   ⚠️ Image upload size limits (check MinIO config)
-   ⚠️ Pagination edge cases (empty results, last page)
-   ⚠️ Profile edit validation (phone number format)
-   ⚠️ Notification delays (check Kafka consumer)

### 1.2 Rate Limiting & Security Testing (15 min)

```bash
# Test 7: Rate Limiting (10 min)
# Run from inside cluster for reliable results
kubectl run -n campus-shop rate-test --rm -i --restart=Never \
  --image=curlimages/curl:latest -- sh -c '
  for i in 1 2 3 4 5 6 7 8 9 10; do
    echo "Attempt $i:";
    curl -X POST http://auth-service/api/auth/login \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"ratetest@iitj.ac.in\",\"password\":\"wrong\"}" \
      -w "HTTP:%{http_code}\n" -s | head -c 100;
    echo "";
  done'

# Expected: HTTP 429 after 5-9 attempts

# Test 8: Forgot Password Flow (5 min)
curl -X POST http://localhost/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"sprint-test@iitj.ac.in"}'

# Check email for reset link
# Click link → should open frontend reset password page
# Submit new password → should succeed
# Login with new password → should work
```

**Expected Issues:**

-   ⚠️ Email delivery delays (check SMTP logs)
-   ⚠️ Frontend reset password route (verify it exists)
-   ⚠️ Token expiration handling

### 1.3 Performance & Load Testing (15 min)

```bash
# Test 9: Concurrent User Simulation (10 min)
# Use the k6 load testing scripts from rate-limiting branch

# Copy k6 scripts
kubectl cp campus-shop/auth-service-8488d8c786-pjzlp:/usr/src/app/load/k6/login_test.js ./login_test.js

# Install k6 if not installed
brew install k6  # macOS
# OR
snap install k6  # Linux

# Run load test
k6 run login_test.js

# Expected output:
# - Successful logins: 80-90%
# - Rate limited: 10-20%
# - Average response time: <500ms
# - Max response time: <2000ms

# Test 10: Database Connection Pool (5 min)
kubectl logs -n campus-shop deployment/items-service --tail=100 | grep -i "pool\|connection"

# Check for connection pool exhaustion
# Expected: No "too many connections" errors
```

---

## Hour 2: Bug Fixes & Polish (60 min)

### 2.1 Fix Critical Bugs (30 min)

**Based on testing results, prioritize:**

1. **Image Upload Issues** (10 min)

    - Check MinIO storage limits
    - Verify image compression in frontend
    - Test edge cases (no image, large image)

2. **Pagination Bugs** (10 min)

    - Fix empty result handling
    - Fix last page navigation
    - Ensure consistent item count

3. **Profile/Contact Info** (5 min)

    - Verify buyer/seller info enrichment
    - Check email fetching from auth-service
    - Test with missing profile data

4. **Notification Delays** (5 min)
    - Check Kafka consumer lag
    - Verify email preferences working
    - Test notification center updates

### 2.2 Frontend Polish (20 min)

**Quick UI Improvements:**

```javascript
// 1. Add loading states (5 min)
// Verify all API calls show loading spinners
// Check: Login, Register, Item Upload, Bidding

// 2. Error handling (5 min)
// Add user-friendly error messages
// Check: Network errors, validation errors

// 3. Mobile responsiveness (5 min)
// Test on mobile viewport
// Fix: Profile cards, item grids, navigation

// 4. Password reset UI (5 min)
// Verify resetPassword.jsx is accessible
// Test: /reset-password?token=xxx route works
// Add token validation feedback
```

### 2.3 Documentation Updates (10 min)

```bash
# Update README.md with:
# - Rate limiting feature
# - Forgot password flow
# - K8s deployment status
# - Testing checklist

# Update ROADMAP.md:
# - Mark current sprint complete
# - Update progress to 99%
# - Add final testing checklist
```

---

## Hour 3: Final Testing & Preparation (60 min)

### 3.1 Comprehensive Test Run (30 min)

```bash
# Run automated test suite
cd scripts
./test-system.sh

# Expected: All tests pass (26/32 or better)

# Manual verification checklist:
✅ Registration works
✅ Email verification works
✅ Login works (correct credentials)
✅ Rate limiting blocks after 5 attempts
✅ Profile edit works (save & persist)
✅ Item upload works (with image)
✅ Search works (partial match)
✅ Pagination works (all pages)
✅ Bidding works (place & accept)
✅ Notifications appear (real-time)
✅ Sold items show buyer info
✅ Purchased items show seller info
✅ Forgot password sends email
✅ Password reset works with token
✅ All pages load without errors
✅ Mobile view looks good
```

### 3.2 Performance Validation (15 min)

```bash
# 1. Check pod resource usage
kubectl top pods -n campus-shop

# Expected:
# - CPU: <1 core per service
# - Memory: <512Mi per service
# - No pods restarting

# 2. Check database connections
kubectl exec -n campus-shop postgres-items-0 -- \
  psql -U admin -d items_db -c "SELECT count(*) FROM pg_stat_activity;"

# Expected: <50 connections per database

# 3. Check Prometheus metrics
kubectl port-forward -n monitoring svc/prometheus-service 9090:9090 &
# Open http://localhost:9090
# Check: request rates, error rates, latencies

# 4. Check Grafana dashboards
kubectl port-forward -n monitoring svc/grafana-service 3000:3000 &
# Open http://localhost:3000
# Verify: All services green, no alerts
```

### 3.3 Final Commit & Push (15 min)

```bash
# 1. Stage all changes
git add -A

# 2. Review changes
git status
git diff --cached

# 3. Commit with summary
git commit -m "chore: final testing and bug fixes for v2 production release

Testing completed:
- ✅ All critical user flows verified
- ✅ Rate limiting working (HTTP 429 after 5 attempts)
- ✅ Forgot password flow tested
- ✅ Profile management tested
- ✅ Image upload tested
- ✅ Search & pagination tested
- ✅ Bidding flow tested
- ✅ Load testing passed (k6)

Bug fixes:
- Fixed: [list any bugs found and fixed]
- Improved: [list any improvements made]

Performance:
- CPU usage: Normal (<1 core per service)
- Memory usage: Normal (<512Mi per service)
- Response times: <500ms average
- Database connections: Healthy

Ready for production deployment and merge to main
v2 branch at 99% complete"

# 4. Push to remote
git push origin v2

# 5. Tag release (optional)
git tag -a v2.0.0 -m "Production release v2.0.0 - Kubernetes architecture with rate limiting"
git push origin v2.0.0
```

---

## Post-Sprint (After 3 Hours)

### Merge to Main (When Ready)

**Option 1: Branch Replacement (Recommended)**

```bash
# On GitHub: Settings → Branches → Default branch → Change to "v2"
# This makes v2 the primary branch without merge conflicts
```

**Option 2: Create Release PR**

```bash
# On GitHub: Create PR from v2 to main
# Add comprehensive description
# Get team review
# Merge when approved
```

---

## Priority Checklist

### Must Complete (Critical):

-   [ ] Test all critical user flows (registration → login → profile → item → bid)
-   [ ] Verify rate limiting works
-   [ ] Fix any blocking bugs found during testing
-   [ ] Run automated test suite
-   [ ] Commit and push all changes

### Should Complete (High Priority):

-   [ ] Test forgot password flow
-   [ ] Run load testing (k6)
-   [ ] Check performance metrics
-   [ ] Update README with new features
-   [ ] Polish frontend error handling

### Nice to Have (If Time Permits):

-   [ ] Mobile responsiveness check
-   [ ] Add more test coverage
-   [ ] Grafana dashboard review
-   [ ] Documentation improvements

---

## Quick Reference Commands

### Testing

```bash
# Full test suite
cd scripts && ./test-system.sh

# Rate limiting test
kubectl run -n campus-shop test-rate --rm -i --restart=Never \
  --image=curlimages/curl:latest -- curl -X POST http://auth-service/api/auth/login \
  -H "Content-Type: application/json" -d '{"email":"test@iitj.ac.in","password":"wrong"}'

# Check logs
kubectl logs -n campus-shop deployment/auth-service --tail=50

# Check pods
kubectl get pods -n campus-shop
```

### Debugging

```bash
# Restart service
kubectl rollout restart deployment auth-service -n campus-shop

# Check pod status
kubectl describe pod -n campus-shop <pod-name>

# Interactive shell
kubectl exec -it -n campus-shop <pod-name> -- /bin/sh

# Port forward for local testing
kubectl port-forward -n campus-shop svc/auth-service 5001:80
```

### Git

```bash
# Quick commit
git add -A && git commit -m "fix: [description]" && git push origin v2

# View recent history
git log --oneline -10

# Check what changed
git diff HEAD~1
```

---

## Success Criteria

**v2 branch is ready for main when:**

✅ All critical user flows work without errors  
✅ Rate limiting blocks brute force attempts  
✅ No 500 errors in any service  
✅ Load testing shows acceptable performance  
✅ Automated tests pass (>80% coverage)  
✅ Documentation is up to date  
✅ All changes committed and pushed  
✅ Team reviewed and approved

**Current Status:** 98% → Target: 99% (production-ready)

---

**Created:** November 13, 2025 1:15 PM  
**Time Available:** 3 hours  
**Focus:** Testing, bug fixes, final polish  
**Goal:** Production-ready v2 branch
