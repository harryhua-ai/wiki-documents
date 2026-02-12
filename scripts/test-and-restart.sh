#!/bin/bash

#===============================================================================
# Wiki Comprehensive Test and Restart Script
#===============================================================================
# This script performs comprehensive testing and restart of the wiki environment:
# 1. Pre-flight environment checks
# 2. Stops existing services gracefully
# 3. Clears all caches
# 4. Rebuilds website and API
# 5. Runs automated tests
# 6. Starts fresh services
# 7. Performs comprehensive health checks
# 8. Generates test report
#
# Usage: ./scripts/test-and-restart.sh [options]
#
# Options:
#   --with-api        Also test and restart API service (port 3001)
#   --api-only        Only test and restart API service
#   --web-only        Only test and restart web service (default)
#   --no-cache         Skip cache clearing (faster)
#   --no-tests         Skip automated tests (faster)
#   --production       Run in production mode (uses pm2 instead of npm run dev)
#   --verbose          Show detailed test output
#   --help            Show this help message
#
# Examples:
#   ./scripts/test-and-restart.sh                      # Test and restart web only
#   ./scripts/test-and-restart.sh --with-api          # Test and restart both web and API
#   ./scripts/test-and-restart.sh --api-only          # Test and restart API only
#   ./scripts/test-and-restart.sh --production --with-api  # Production deployment with both services
#===============================================================================

set -e  # Exit on error

#===============================================================================
# Configuration
#===============================================================================
WEB_PORT=3000
API_PORT=3001
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_PREFIX="[Wiki Test]"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
TEST_REPORT_DIR="$PROJECT_ROOT/test-reports"
mkdir -p "$TEST_REPORT_DIR"

#===============================================================================
# Colors
#===============================================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

#===============================================================================
# Global Variables
#===============================================================================
RESTART_WEB=true
RESTART_API=false
SKIP_CACHE=false
SKIP_TESTS=false
PRODUCTION_MODE=false
VERBOSE=false
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

#===============================================================================
# Functions
#===============================================================================

# Print colored message
print_info() {
    echo -e "${CYAN}${LOG_PREFIX}${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_test() {
    echo -e "${MAGENTA}🧪 $1${NC}"
}

print_step() {
    echo ""
    echo -e "${BOLD}${BLUE}▶ $1${NC}"
    echo "----------------------------------------"
}

print_verbose() {
    if [ "$VERBOSE" = "true" ]; then
        echo -e "${CYAN}[VERBOSE]${NC} $1"
    fi
}

# Print banner
print_banner() {
    echo ""
    echo -e "${BOLD}${CYAN}╔════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${CYAN}║   Wiki Test & Restart Script              ║${NC}"
    echo -e "${BOLD}${CYAN}╚════════════════════════════════════════╝${NC}"
    echo ""
}

# Show help message
show_help() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --with-api        Also test and restart API service (port $API_PORT)"
    echo "  --api-only        Only test and restart API service"
    echo "  --web-only        Only test and restart web service (default)"
    echo "  --no-cache         Skip cache clearing (faster)"
    echo "  --no-tests         Skip automated tests (faster)"
    echo "  --production       Run in production mode (uses pm2)"
    echo "  --verbose          Show detailed test output"
    echo "  --help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                          # Test and restart web only (development)"
    echo "  $0 --with-api               # Test and restart both web and API (development)"
    echo "  $0 --api-only               # Test and restart API only (development)"
    echo "  $0 --production --with-api  # Production deployment with both services"
    echo ""
    exit 0
}

# Check if port is in use
check_port() {
    local port=$1
    local service_name=$2

    if lsof -i :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        local pid=$(lsof -ti :$port -sTCP:LISTEN)
        print_warning "$service_name is already running on port $port (PID: $pid)"
        return 0
    else
        return 1
    fi
}

# Kill process on port
kill_port() {
    local port=$1
    local service_name=$2

    if lsof -ti :$port -sTCP:LISTEN >/dev/null 2>&1; then
        local pid=$(lsof -ti :$port -sTCP:LISTEN)
        print_info "Stopping $service_name (PID: $pid)..."
        kill $pid 2>/dev/null || true

        # Wait up to 5 seconds for process to terminate
        local count=0
        while lsof -ti :$port -sTCP:LISTEN >/dev/null 2>&1 && [ $count -lt 10 ]; do
            sleep 0.5
            count=$((count + 1))
        done

        # Force kill if still running
        if lsof -ti :$port -sTCP:LISTEN >/dev/null 2>&1; then
            print_warning "Force killing $service_name..."
            kill -9 $pid 2>/dev/null || true
            sleep 1
        fi

        print_success "$service_name stopped"
    else
        print_info "$service_name is not running"
    fi
}

# Clear Docusaurus cache
clear_cache() {
    print_step "Clearing Docusaurus cache"

    cd "$PROJECT_ROOT"

    if [ "$SKIP_CACHE" = "true" ]; then
        print_warning "Skipping cache clear (--no-cache flag)"
        return 0
    fi

    print_info "Running: yarn clear"
    if yarn clear; then
        print_success "Cache cleared"
    else
        print_error "Failed to clear cache"
        return 1
    fi
}

# Build website
build_website() {
    print_step "Building website"
    cd "$PROJECT_ROOT"

    local build_cmd="yarn build"
    if [ "$PRODUCTION_MODE" = "true" ]; then
        build_cmd="NODE_ENV=production yarn build"
    fi

    print_info "Running: $build_cmd"
    if $build_cmd; then
        print_success "Website built successfully"
    else
        print_error "Build failed"
        return 1
    fi
}

# Build and test API
build_api() {
    print_step "Building API"
    cd "$PROJECT_ROOT/api"

    print_info "Running: npm run build"
    if npm run build; then
        print_success "API built successfully"
    else
        print_error "API build failed"
        return 1
    fi
}

# Ingest API documents
ingest_documents() {
    print_step "Ingesting API documents"
    cd "$PROJECT_ROOT/api"

    local ingest_cmd="npm run ingest"
    if [ "$PRODUCTION_MODE" = "true" ]; then
        # In production, ingest should use production config
        ingest_cmd="NODE_ENV=production npm run ingest"
    fi

    print_info "Running: $ingest_cmd"
    if $ingest_cmd; then
        print_success "Documents ingested successfully"
    else
        print_warning "Document ingestion failed (continuing anyway)"
    fi
}

# Start web service
start_web() {
    print_step "Starting web service (port $WEB_PORT)"
    cd "$PROJECT_ROOT"

    # Check if port is available
    if check_port $WEB_PORT "Web service"; then
        kill_port $WEB_PORT "Web service"
    fi

    print_info "Running: yarn serve"
    print_info "Website will be available at: ${GREEN}http://localhost:$WEB_PORT${NC}"
    echo ""

    # Start serve in background
    yarn serve > /tmp/wiki-web.log 2>&1 &
    WEB_PID=$!
    echo $WEB_PID > /tmp/wiki-web.pid
    print_success "Web service started (PID: $WEB_PID)"
}

# Start API service (development mode)
start_api_dev() {
    print_step "Starting API service (development mode, port $API_PORT)"
    cd "$PROJECT_ROOT/api"

    # Check if port is available
    if check_port $API_PORT "API service"; then
        print_warning "API is already running. Restart?"
        read -p "$(echo -e ${YELLOW}Restart API? [y/N]: ${NC})" -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            kill_port $API_PORT "API service"
        else
            print_info "Skipping API restart"
            return 0
        fi
    fi

    print_info "Running: npm run dev"
    print_info "API will be available at: ${GREEN}http://localhost:$API_PORT${NC}"
    echo ""

    # Start API in background
    npm run dev > /tmp/wiki-api-dev.log 2>&1 &
    API_PID=$!
    echo $API_PID > /tmp/wiki-api-dev.pid
    print_success "API service started (PID: $API_PID)"
}

# Start API service (production mode with PM2)
start_api_prod() {
    print_step "Starting API service (production mode with PM2, port $API_PORT)"
    cd "$PROJECT_ROOT/api"

    print_info "Running: pm2 reload wiki-api"
    if pm2 reload wiki-api; then
        print_success "API service reloaded with PM2"
    else
        # If reload fails, try starting
        print_warning "PM2 reload failed, attempting start..."
        if pm2 start pm2.config.js; then
            print_success "API service started with PM2"
        else
            print_error "Failed to start API service"
            return 1
        fi
    fi

    pm2 save
}

# Health check for web service
health_check_web() {
    print_step "Web service health check"
    sleep 3  # Give server time to start

    local max_attempts=10
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        print_verbose "Health check attempt $attempt/$max_attempts..."

        if curl -s -o /dev/null -w "%{http_code}" http://localhost:$WEB_PORT | grep -q "200"; then
            print_success "Web service is responding (http://localhost:$WEB_PORT)"
            return 0
        fi

        attempt=$((attempt + 1))
        sleep 2
    done

    print_error "Web service health check failed"
    return 1
}

# Health check for API service
health_check_api() {
    print_step "API service health check"
    sleep 2  # Give API time to start

    local health_url="http://localhost:$API_PORT/health"
    local max_attempts=10
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        print_verbose "Health check attempt $attempt/$max_attempts to $health_url..."

        local http_code=$(curl -s -o /dev/null -w "%{http_code}" "$health_url" 2>/dev/null)

        if [ "$http_code" = "200" ]; then
            print_success "API service is responding ($health_url)"
            return 0
        fi

        attempt=$((attempt + 1))
        sleep 2
    done

    print_error "API service health check failed"
    return 1
}

#===============================================================================
# Test Functions
#===============================================================================

# Test 1: Environment Validation
test_environment() {
    print_test "Test 1: Environment Validation"

    local env_ok=true

    # Check Node.js version
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$NODE_MAJOR" -ge 18 ]; then
            print_success "Node.js version: $NODE_VERSION ✓"
        else
            print_error "Node.js version: $NODE_VERSION (need 18+) ✗"
            env_ok=false
        fi
    else
        print_error "Node.js not found ✗"
        env_ok=false
    fi

    # Check npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm -v)
        print_success "npm version: $NPM_VERSION ✓"
    else
        print_error "npm not found ✗"
        env_ok=false
    fi

    # Check yarn
    if command -v yarn &> /dev/null; then
        YARN_VERSION=$(yarn -v)
        print_success "yarn version: $YARN_VERSION ✓"
    else
        print_error "yarn not found ✗"
        env_ok=false
    fi

    # Check PM2 (production mode only)
    if [ "$PRODUCTION_MODE" = "true" ]; then
        if command -v pm2 &> /dev/null; then
            PM2_VERSION=$(pm2 -v)
            print_success "PM2 version: $PM2_VERSION ✓"
        else
            print_error "PM2 not found (required for production) ✗"
            env_ok=false
        fi
    fi

    # Check disk space
    DISK_AVAILABLE=$(df -BG "$PROJECT_ROOT" | tail -1 | awk '{print $4}')
    DISK_AVAILABLE_GB=$((DISK_AVAILABLE / 1024 / 1024))
    if [ "$DISK_AVAILABLE_GB" -gt 2048 ]; then
        print_success "Disk space: ${DISK_AVAILABLE_GB}GB available ✓"
    else
        print_warning "Disk space: ${DISK_AVAILABLE_GB}GB available (recommend 2GB+) ⚠"
        env_ok=false
    fi

    if [ "$env_ok" = "true" ]; then
        print_success "Environment validation: PASSED"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        print_error "Environment validation: FAILED"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi

    TESTS_TOTAL=$((TESTS_TOTAL + 1))
}

# Test 2: API Health Endpoint
test_api_health() {
    print_test "Test 2: API Health Endpoint"

    if [ "$RESTART_API" = "false" ]; then
        print_info "Skipping API health test (--web-only flag)"
        return 0
    fi

    local health_url="http://localhost:$API_PORT/health"
    print_verbose "Testing: $health_url"

    local response=$(curl -s -w "\nHTTP_CODE:%{http_code}\nTIME_TOTAL:%{time_total}s\n" "$health_url" 2>/dev/null)
    local http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
    local time_total=$(echo "$response" | grep "TIME_TOTAL:" | cut -d: -f2)

    if [ "$http_code" = "200" ]; then
        print_success "Health check: 200 OK ✓"
        print_success "Response time: ${time_total}s ✓"

        if [ $(echo "$time_total < 1" | bc -l 2>/dev/null) -eq 1 ]; then
            print_success "Response time: Excellent (< 1s) ✓"
        elif [ $(echo "$time_total < 3" | bc -l 2>/dev/null) -eq 1 ]; then
            print_success "Response time: Good (< 3s) ✓"
        else
            print_warning "Response time: Slow (> 3s) ⚠"
        fi

        print_success "API health test: PASSED"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        print_error "Health check failed: HTTP $http_code ✗"
        print_error "API health test: FAILED"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi

    TESTS_TOTAL=$((TESTS_TOTAL + 1))
}

# Test 3: API Chat Endpoint (Basic)
test_api_chat_basic() {
    print_test "Test 3: API Chat Endpoint (Basic)"

    if [ "$RESTART_API" = "false" ]; then
        print_info "Skipping API chat test (--web-only flag)"
        return 0
    fi

    local chat_url="http://localhost:$API_PORT/api/chat"
    local test_payload='{"message":"test","language":"zh-Hans"}'
    local expected_response_chunk="根据"

    print_verbose "Testing: POST $chat_url"
    print_verbose "Payload: $test_payload"

    local start_time=$(date +%s.%N)
    local response=$(curl -s -X POST "$chat_url" \
        -H "Content-Type: application/json" \
        -d "$test_payload" \
        --no-buffer \
        --max-time 10 2>&1)
    local end_time=$(date +%s.%N)
    local duration=$(echo "$end_time - $start_time" | bc)

    if echo "$response" | grep -q "$expected_response_chunk"; then
        print_success "Chat endpoint response: Valid ✓"
        print_success "Response time: ${duration}s ✓"
        print_success "API chat test: PASSED"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        print_error "Chat endpoint response: Invalid ✗"
        print_verbose "Response: $response"
        print_error "API chat test: FAILED"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi

    TESTS_TOTAL=$((TESTS_TOTAL + 1))
}

# Test 4: Static Files Access
test_static_files() {
    print_test "Test 4: Static Files Access"

    local test_urls=(
        "http://localhost:$WEB_PORT/"
        "http://localhost:$WEB_PORT/docs/"
        "http://localhost:$WEB_PORT/docs/1-neoedge-ng4500-series/overview.html"
    )

    local all_passed=true
    for url in "${test_urls[@]}"; do
        print_verbose "Testing: $url"

        local http_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)

        if [ "$http_code" = "200" ]; then
            print_success "✓ $url"
        else
            print_error "✗ $url (HTTP $http_code)"
            all_passed=false
        fi
    done

    if [ "$all_passed" = "true" ]; then
        print_success "Static files test: PASSED"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        print_error "Static files test: FAILED"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi

    TESTS_TOTAL=$((TESTS_TOTAL + 1))
}

# Test 5: SSE Connection
test_sse_connection() {
    print_test "Test 5: SSE Connection"

    if [ "$RESTART_API" = "false" ]; then
        print_info "Skipping SSE test (--web-only flag)"
        return 0
    fi

    local chat_url="http://localhost:$API_PORT/api/chat"
    local test_payload='{"message":"test"}'

    print_verbose "Testing SSE connection to: $chat_url"

    # Test SSE connection for 5 seconds
    local response=$(timeout 5 curl -s -N -X POST "$chat_url" \
        -H "Content-Type: application/json" \
        -d "$test_payload" \
        --no-buffer 2>&1 || echo "TIMEOUT")

    if echo "$response" | grep -q "data:"; then
        print_success "SSE stream detected ✓"
        if echo "$response" | grep -q "data:.*chunk"; then
            print_success "SSE chunk events working ✓"
        fi
        if echo "$response" | grep -q "data:.*sources"; then
            print_success "SSE sources events working ✓"
        fi
        print_success "SSE connection test: PASSED"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        print_error "SSE stream not detected ✗"
        print_verbose "Response: $response"
        print_error "SSE connection test: FAILED"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi

    TESTS_TOTAL=$((TESTS_TOTAL + 1))
}

# Test 6: Vector Database
test_vector_db() {
    print_test "Test 6: Vector Database"

    if [ "$RESTART_API" = "false" ]; then
        print_info "Skipping vector DB test (--web-only flag)"
        return 0
    fi

    cd "$PROJECT_ROOT/api"

    # Check if vector database exists
    local vector_db_path="data/vectors.db"
    if [ -f "$vector_db_path" ]; then
        print_success "Vector database exists ✓"
        local size=$(du -h "$vector_db_path" | cut -f1)
        print_info "Database size: $size"

        # Check if database is accessible
        if [ -r "$vector_db_path" ]; then
            print_success "Database readable ✓"
            print_success "Vector database test: PASSED"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            print_error "Database not readable ✗"
            print_error "Vector database test: FAILED"
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
    elif [ -f "data/qdrant.json" ] || [ -n "$QDRANT_URL" ]; then
        print_success "Qdrant configuration found ✓"
        print_success "Vector database test: PASSED"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        print_warning "No vector database found ⚠"
        print_warning "Run: npm run ingest to create database"
        print_error "Vector database test: FAILED"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi

    TESTS_TOTAL=$((TESTS_TOTAL + 1))
}

# Generate test report
generate_test_report() {
    print_step "Generating Test Report"

    local report_file="$TEST_REPORT_DIR/test-report-$TIMESTAMP.md"

    cat > "$report_file" <<EOF
# Wiki Test Report

**Date**: $(date '+%Y-%m-%d %H:%M:%S')
**Environment**: $([ "$PRODUCTION_MODE" = "true" ] && echo "Production" || echo "Development")
**Configuration**:
- Web Service: $([ "$RESTART_WEB" = "true" ] && echo "Enabled" || echo "Disabled")
- API Service: $([ "$RESTART_API" = "true" ] && echo "Enabled" || echo "Disabled")
- Production Mode: $PRODUCTION_MODE

## Test Summary

| Metric | Count |
|--------|--------|
| **Total Tests** | $TESTS_TOTAL |
| **Passed** | $TESTS_PASSED |
| **Failed** | $TESTS_FAILED |
| **Pass Rate** | $(echo "scale=2; $TESTS_PASSED * 100 / $TESTS_TOTAL" | bc -l 2>/dev/null || echo "N/A")% |

## Test Results

$(if [ $TESTS_FAILED -eq 0 ]; then
    echo "### ✅ ALL TESTS PASSED"
else
    echo "### ❌ SOME TESTS FAILED"
    echo ""
    echo "Failed tests: $TESTS_FAILED"
    echo "Please review the logs above for details."
fi)

## Next Steps

1. Review failed tests above
2. Check logs in \`tmp/\` directory
3. Consult \`api/PM2_MONITORING_GUIDE.md\` for troubleshooting
4. Run \`./scripts/test-api.sh\` for detailed API testing

---
**Generated by**: \`./scripts/test-and-restart.sh\`
EOF

    print_success "Test report saved: $report_file"
}

#===============================================================================
# Main
#===============================================================================

# Parse arguments
while [ $# -gt 0 ]; do
    case $1 in
        --with-api)
            RESTART_API=true
            shift
            ;;
        --api-only)
            RESTART_WEB=false
            RESTART_API=true
            shift
            ;;
        --web-only)
            RESTART_WEB=true
            RESTART_API=false
            shift
            ;;
        --no-cache)
            SKIP_CACHE=true
            shift
            ;;
        --no-tests)
            SKIP_TESTS=true
            shift
            ;;
        --production)
            PRODUCTION_MODE=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --help)
            show_help
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help to see available options"
            exit 1
            ;;
    esac
done

# Print banner
print_banner

# Show configuration
echo -e "${BOLD}Configuration:${NC}"
if [ "$RESTART_WEB" = "true" ]; then
    echo -e "  • Web service (Docusaurus): ${GREEN}Enabled${NC}"
else
    echo -e "  • Web service (Docusaurus): ${YELLOW}Disabled${NC}"
fi

if [ "$RESTART_API" = "true" ]; then
    echo -e "  • API service (Express): ${GREEN}Enabled${NC}"
else
    echo -e "  • API service (Express): ${YELLOW}Disabled${NC}"
fi

echo -e "  • Production mode: $PRODUCTION_MODE"
echo -e "  • Skip cache: $SKIP_CACHE"
echo -e "  • Skip tests: $SKIP_TESTS"
echo ""

# Confirm restart
read -p "$(echo -e ${CYAN}Continue with test and restart? [Y/n]: ${NC})" -n 1 -r
echo
if [[ $REPLY =~ ^[Nn]$ ]]; then
    print_info "Cancelled"
    exit 0
fi

#===============================================================================
# Phase 1: Stop Existing Services
#===============================================================================
print_step "Phase 1: Stop Existing Services"

if [ "$RESTART_WEB" = "true" ]; then
    check_port $WEB_PORT "Web service" || kill_port $WEB_PORT "Web service"
fi

if [ "$RESTART_API" = "true" ]; then
    check_port $API_PORT "API service" || kill_port $API_PORT "API service"
fi

#===============================================================================
# Phase 2: Build Phase
#===============================================================================
print_step "Phase 2: Build"

if [ "$RESTART_WEB" = "true" ]; then
    clear_cache
    build_website
fi

if [ "$RESTART_API" = "true" ]; then
    build_api
    ingest_documents
fi

#===============================================================================
# Phase 3: Automated Tests
#===============================================================================
if [ "$SKIP_TESTS" = "false" ]; then
    print_step "Phase 3: Automated Tests"

    test_environment
    test_vector_db
    test_static_files

    if [ "$RESTART_API" = "true" ]; then
        test_api_health
        test_api_chat_basic
        test_sse_connection
    fi

    generate_test_report
else
    print_warning "Skipping automated tests (--no-tests flag)"
fi

#===============================================================================
# Phase 4: Start Services
#===============================================================================
print_step "Phase 4: Start Services"

if [ "$RESTART_API" = "true" ]; then
    if [ "$PRODUCTION_MODE" = "true" ]; then
        start_api_prod
        health_check_api
    else
        start_api_dev
        health_check_api
    fi
fi

if [ "$RESTART_WEB" = "true" ]; then
    # Give API a moment if both are starting
    if [ "$RESTART_API" = "true" ]; then
        sleep 2
    fi

    start_web
    health_check_web
fi

#===============================================================================
# Final Summary
#===============================================================================
echo ""
print_success "=== Test and Restart Complete ==="

echo ""
echo "Services Running:"
if [ "$RESTART_WEB" = "true" ]; then
    echo "  🌐 Web:  ${GREEN}http://localhost:$WEB_PORT${NC}"
fi
if [ "$RESTART_API" = "true" ]; then
    echo "  🔌 API:  ${GREEN}http://localhost:$API_PORT${NC}"
fi

echo ""
echo "Next Steps:"
echo "  1. Open browser to test web interface"
echo "  2. Run: ./scripts/test-api.sh for detailed API testing"
echo "  3. Check PM2 logs: pm2 logs wiki-api (production mode)"
echo "  4. View test report: cat $TEST_REPORT_DIR/test-report-$TIMESTAMP.md"
echo ""

if [ "$TESTS_FAILED" -gt 0 ]; then
    print_warning "⚠️  $TESTS_FAILED test(s) failed - check report for details"
fi

if [ "$PRODUCTION_MODE" = "true" ]; then
    print_info "Production mode: Check logs with"
    echo "  ssh root@wiki.camthink.ai 'pm2 logs wiki-api --lines 50'"
fi
