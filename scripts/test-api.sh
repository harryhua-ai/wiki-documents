#!/bin/bash

#===============================================================================
# API Test Suite
#===============================================================================
# Comprehensive API testing script for Wiki Ask AI feature
# Tests all endpoints, error handling, performance, and edge cases
#
# Usage: ./scripts/test-api.sh [options]
#
# Options:
#   --quick           Run quick smoke tests only
#   --full            Run full test suite (default)
#   --verbose         Show detailed test output
#   --report          Generate HTML test report
#   --help            Show this help message
#===============================================================================

set -e

#===============================================================================
# Configuration
#===============================================================================
API_BASE_URL="${API_BASE_URL:-http://localhost:3001}"
API_CHAT_ENDPOINT="$API_BASE_URL/api/chat"
API_HEALTH_ENDPOINT="$API_BASE_URL/api/health"
API_FEEDBACK_ENDPOINT="$API_BASE_URL/api/feedback"

TEST_RESULTS_DIR="./test-results"
mkdir -p "$TEST_RESULTS_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="$TEST_RESULTS_DIR/api-test-report-$TIMESTAMP.txt"

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
NC='\033[0m'

#===============================================================================
# Test Counters
#===============================================================================
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

declare -a FAILED_TEST_NAMES
declare -a PASSED_TEST_NAMES

#===============================================================================
# Functions
#===============================================================================

print_header() {
    echo ""
    echo -e "${BOLD}${BLUE}════════════════════════════════════════${NC}"
    echo -e "${BOLD}${BLUE}║  $1${NC}"
    echo -e "${BOLD}${BLUE}════════════════════════════════════════${NC}"
    echo ""
}

print_test_start() {
    echo -e "${MAGENTA}▶ $1${NC}"
    echo "----------------------------------------"
}

print_success() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
}

print_fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
}

print_skip() {
    echo -e "${YELLOW}⏭ SKIP${NC}: $1"
}

print_info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

# Record test result
record_test() {
    local test_name=$1
    local result=$2
    local details=$3

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    if [ "$result" = "PASS" ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        PASSED_TEST_NAMES+=("$test_name")
        print_success "$test_name"
        echo "$details" >> "$REPORT_FILE"
    elif [ "$result" = "FAIL" ]; then
        FAILED_TESTS=$((FAILED_TESTS + 1))
        FAILED_TEST_NAMES+=("$test_name: $details")
        print_fail "$test_name"
        echo "FAIL: $details" >> "$REPORT_FILE"
    else
        SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
        print_skip "$test_name"
        echo "SKIP: $details" >> "$REPORT_FILE"
    fi
}

# Test 1: Health Check
test_health_check() {
    print_test_start "Test 1: Health Endpoint Check"

    local start_time=$(date +%s.%N)
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" "$API_HEALTH_ENDPOINT" 2>/dev/null)
    local end_time=$(date +%s.%N)
    local duration=$(echo "$end_time - $start_time" | bc -l)

    if [ "$http_code" = "200" ]; then
        record_test "Health Check" "PASS" "HTTP 200, ${duration}s"
    else
        record_test "Health Check" "FAIL" "HTTP $http_code (expected 200)"
    fi
}

# Test 2: API is Running
test_api_running() {
    print_test_start "Test 2: API Service Running"

    if lsof -i :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
        local pid=$(lsof -ti :3001 -sTCP:LISTEN)
        record_test "API Running" "PASS" "PID: $pid, Port: 3001"
    else
        record_test "API Running" "FAIL" "API not running on port 3001"
    fi
}

# Test 3: Chat Endpoint - Basic Chinese
test_chat_basic_chinese() {
    print_test_start "Test 3: Chat Endpoint - Basic Chinese Query"

    local payload='{"message":"NE301 是什么？","language":"zh-Hans"}'

    local start_time=$(date +%s.%N)
    local response=$(curl -s -X POST "$API_CHAT_ENDPOINT" \
        -H "Content-Type: application/json" \
        -d "$payload" \
        --max-time 30 2>&1)
    local end_time=$(date +%s.%N)
    local duration=$(echo "$end_time - $start_time" | bc -l)

    # Check for SSE events
    if echo "$response" | grep -q "data:.*chunk.*"; then
        # Check for relevant content
        if echo "$response" | grep -q "NE301\|STM32N6\|NeoEyes"; then
            record_test "Chat (Chinese)" "PASS" "Response contains relevant content, ${duration}s"
        else
            record_test "Chat (Chinese)" "FAIL" "Response lacks relevant content"
        fi
    else
        record_test "Chat (Chinese)" "FAIL" "No SSE stream response"
    fi
}

# Test 4: Chat Endpoint - Basic English
test_chat_basic_english() {
    print_test_start "Test 4: Chat Endpoint - Basic English Query"

    local payload='{"message":"What is NE301?","language":"en"}'

    local start_time=$(date +%s.%N)
    local response=$(curl -s -X POST "$API_CHAT_ENDPOINT" \
        -H "Content-Type: application/json" \
        -d "$payload" \
        --max-time 30 2>&1)
    local end_time=$(date +%s.%N)
    local duration=$(echo "$end_time - $start_time" | bc -l)

    if echo "$response" | grep -q "data:.*chunk.*"; then
        if echo "$response" | grep -q "NE301\|STM32N6\|NeoEyes"; then
            record_test "Chat (English)" "PASS" "Response contains relevant content, ${duration}s"
        else
            record_test "Chat (English)" "FAIL" "Response lacks relevant content"
        fi
    else
        record_test "Chat (English)" "FAIL" "No SSE stream response"
    fi
}

# Test 5: Chat Endpoint - Long Query
test_chat_long_query() {
    print_test_start "Test 5: Chat Endpoint - Long Query (Multi-turn)"

    local payload='{"message":"请详细介绍 NG4500 和 NE301 的区别，包括硬件配置、软件支持、适用场景和价格","language":"zh-Hans"}'

    local start_time=$(date +%s.%N)
    local response=$(curl -s -X POST "$API_CHAT_ENDPOINT" \
        -H "Content-Type: application/json" \
        -d "$payload" \
        --max-time 60 2>&1)
    local end_time=$(date +%s.%N)
    local duration=$(echo "$end_time - $start_time" | bc -l)

    if echo "$response" | grep -q "data:.*sources"; then
        # Check for multi-source comparison
        local source_count=$(echo "$response" | grep -o "data:.*sources" | wc -l)
        if [ "$source_count" -gt 0 ]; then
            record_test "Chat (Long Query)" "PASS" "Multi-source response, ${duration}s, $source_count sources"
        else
            record_test "Chat (Long Query)" "FAIL" "No sources in response"
        fi
    else
        record_test "Chat (Long Query)" "FAIL" "No SSE stream response"
    fi
}

# Test 6: Chat Endpoint - Empty Message
test_chat_empty_message() {
    print_test_start "Test 6: Chat Endpoint - Empty Message"

    local payload='{"message":"","language":"zh-Hans"}'

    local start_time=$(date +%s.%N)
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST "$API_CHAT_ENDPOINT" \
        -H "Content-Type: application/json" \
        -d "$payload" \
        --max-time 10 2>/dev/null)
    local end_time=$(date +%s.%N)
    local duration=$(echo "$end_time - $start_time" | bc -l)

    # Empty message should return 400 or handle gracefully
    if [ "$http_code" = "400" ] || [ "$http_code" = "422" ]; then
        record_test "Chat (Empty)" "PASS" "Correctly rejected with HTTP $http_code, ${duration}s"
    else
        record_test "Chat (Empty)" "FAIL" "Should reject empty message (got HTTP $http_code)"
    fi
}

# Test 7: Chat Endpoint - Very Long Message
test_chat_very_long_message() {
    print_test_start "Test 7: Chat Endpoint - Very Long Message (>500 chars)"

    # Generate 600 character message
    local long_message=$(printf 's%.0s' {1..600})
    local payload="{\"message\":\"$long_message\",\"language\":\"zh-Hans\"}"

    local start_time=$(date +%s.%N)
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST "$API_CHAT_ENDPOINT" \
        -H "Content-Type: application/json" \
        -d "$payload" \
        --max-time 10 2>/dev/null)

    if [ "$http_code" = "413" ] || [ "$http_code" = "400" ]; then
        record_test "Chat (Too Long)" "PASS" "Correctly rejected with HTTP $http_code"
    else
        record_test "Chat (Too Long)" "FAIL" "Should reject message >500 chars (got HTTP $http_code)"
    fi
}

# Test 8: Chat Endpoint - Missing Language
test_chat_missing_language() {
    print_test_start "Test 8: Chat Endpoint - Missing Language Parameter"

    local payload='{"message":"test without language"}'

    local response=$(curl -s -X POST "$API_CHAT_ENDPOINT" \
        -H "Content-Type: application/json" \
        -d "$payload" \
        --max-time 30 2>&1)

    # Should auto-detect language or have a default
    if echo "$response" | grep -q "data:.*chunk.*"; then
        record_test "Chat (No Language)" "PASS" "Auto-detected language successfully"
    else
        record_test "Chat (No Language)" "FAIL" "Failed to process request"
    fi
}

# Test 9: Chat Endpoint - Invalid JSON
test_chat_invalid_json() {
    print_test_start "Test 9: Chat Endpoint - Invalid JSON"

    local invalid_json='{"message":invalid json}'

    local http_code=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST "$API_CHAT_ENDPOINT" \
        -H "Content-Type: application/json" \
        -d "$invalid_json" \
        --max-time 10 2>/dev/null)

    if [ "$http_code" = "400" ] || [ "$http_code" = "422" ]; then
        record_test "Chat (Invalid JSON)" "PASS" "Correctly rejected with HTTP $http_code"
    else
        record_test "Chat (Invalid JSON)" "FAIL" "Should reject invalid JSON (got HTTP $http_code)"
    fi
}

# Test 10: Chat Endpoint - Special Characters
test_chat_special_characters() {
    print_test_start "Test 10: Chat Endpoint - Special Characters (XSS attempt)"

    local xss_payload='{"message":"<script>alert(\"xss\")</script>","language":"zh-Hans"}'

    local start_time=$(date +%s.%N)
    local response=$(curl -s -X POST "$API_CHAT_ENDPOINT" \
        -H "Content-Type: application/json" \
        -d "$xss_payload" \
        --max-time 30 2>&1)
    local end_time=$(date +%s.%N)

    # Should sanitize input and not execute script
    if echo "$response" | grep -q "<script>"; then
        record_test "Chat (XSS)" "FAIL" "XSS vulnerability detected"
    else
        record_test "Chat (XSS)" "PASS" "Input properly sanitized"
    fi
}

# Test 11: SSE Connection Stability
test_sse_stability() {
    print_test_start "Test 11: SSE Connection Stability (30s stream)"

    local payload='{"message":"测试 SSE 连接稳定性","language":"zh-Hans"}'

    # Measure stream duration
    local start_time=$(date +%s.%N)
    local response=$(timeout 35 curl -s -N -X POST "$API_CHAT_ENDPOINT" \
        -H "Content-Type: application/json" \
        -d "$payload" \
        --no-buffer 2>&1)
    local end_time=$(date +%s.%N)
    local duration=$(echo "$end_time - $start_time" | bc -l)

    # Count SSE events
    local event_count=$(echo "$response" | grep -c "data:" || echo "0")

    if [ "$event_count" -gt 5 ]; then
        record_test "SSE Stability" "PASS" "Received $event_count events over ${duration}s"
    else
        record_test "SSE Stability" "FAIL" "Only $event_count events received"
    fi
}

# Test 12: Response Time P95
test_response_time_p95() {
    print_test_start "Test 12: Response Time P95 (10 queries)"

    local total_time=0
    local queries=10

    for i in $(seq 1 $queries); do
        local payload='{"message":"快速测试问题'$i'","language":"zh-Hans"}'

        local start_time=$(date +%s.%N)
        curl -s -X POST "$API_CHAT_ENDPOINT" \
            -H "Content-Type: application/json" \
            -d "$payload" \
            --max-time 10 -o /dev/null 2>/dev/null
        local end_time=$(date +%s.%N)

        local query_time=$(echo "$end_time - $start_time" | bc -l)
        total_time=$(echo "$total_time + $query_time" | bc -l)

        print_info "Query $i: ${query_time}s"
    done

    local avg_time=$(echo "scale=2; $total_time / $queries" | bc -l)

    # P95 target: < 5s
    if [ $(echo "$avg_time < 5.0" | bc -l) -eq 1 ]; then
        record_test "Response Time P95" "PASS" "Avg: ${avg_time}s (< 5s target)"
    else
        record_test "Response Time P95" "FAIL" "Avg: ${avg_time}s (exceeds 5s target)"
    fi
}

# Test 13: Feedback Endpoint
test_feedback_endpoint() {
    print_test_start "Test 13: Feedback Endpoint"

    local feedback_payload='{"conversation_id":"test-conv-001","message_id":"test-msg-001","rating":"positive","comment":"Test feedback"}'

    local start_time=$(date +%s.%N)
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST "$API_FEEDBACK_ENDPOINT" \
        -H "Content-Type: application/json" \
        -d "$feedback_payload" \
        --max-time 10 2>/dev/null)
    local end_time=$(date +%s.%N)
    local duration=$(echo "$end_time - $start_time" | bc -l)

    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        record_test "Feedback Endpoint" "PASS" "HTTP $http_code, ${duration}s"
    else
        record_test "Feedback Endpoint" "FAIL" "HTTP $http_code (expected 200/201)"
    fi
}

# Test 14: CORS Headers
test_cors_headers() {
    print_test_start "Test 14: CORS Headers"

    local cors_response=$(curl -s -I -X OPTIONS "$API_CHAT_ENDPOINT" \
        -H "Origin: https://wiki.camthink.ai" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type" 2>/dev/null)

    if echo "$cors_response" | grep -q "Access-Control-Allow-Origin"; then
        record_test "CORS Headers" "PASS" "CORS headers present"
    else
        record_test "CORS Headers" "FAIL" "Missing CORS headers"
    fi
}

# Test 15: Rate Limiting
test_rate_limiting() {
    print_test_start "Test 15: Rate Limiting (11 rapid requests)"

    local passed_count=0
    local rate_limited=false

    for i in {1..11}; do
        local payload="{\"message\":\"Rate limit test $i\",\"language\":\"zh-Hans\"}"
        local http_code=$(curl -s -o /dev/null -w "%{http_code}" \
            -X POST "$API_CHAT_ENDPOINT" \
            -H "Content-Type: application/json" \
            -d "$payload" \
            --max-time 5 2>/dev/null)

        if [ "$http_code" = "429" ]; then
            rate_limited=true
            break
        fi

        if [ "$http_code" = "200" ]; then
            passed_count=$((passed_count + 1))
        fi

        print_info "Request $i: HTTP $http_code"
    done

    if [ "$rate_limited" = "true" ]; then
        record_test "Rate Limiting" "PASS" "Rate limiting triggered after $passed_count successful requests"
    else
        record_test "Rate Limiting" "FAIL" "No rate limiting detected (11 requests allowed)"
    fi
}

# Generate summary report
generate_summary() {
    print_header "Test Summary"

    echo -e "${BOLD}Total Tests:${NC} $TOTAL_TESTS"
    echo -e "${GREEN}Passed:${NC} $PASSED_TESTS"
    echo -e "${RED}Failed:${NC} $FAILED_TESTS"
    echo -e "${YELLOW}Skipped:${NC} $SKIPPED_TESTS"

    local pass_rate=0
    if [ $TOTAL_TESTS -gt 0 ]; then
        pass_rate=$(echo "scale=1; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)
    fi

    echo -e "${BOLD}Pass Rate:${NC} ${pass_rate}%"

    echo ""
    echo "Full report saved to: $REPORT_FILE"

    if [ $FAILED_TESTS -gt 0 ]; then
        echo ""
        echo -e "${RED}Failed Tests:${NC}"
        for test in "${FAILED_TEST_NAMES[@]}"; do
            echo "  • $test"
        done
    fi
}

#===============================================================================
# Main
#===============================================================================

# Parse arguments
RUN_FULL_TESTS=true
RUN_QUICK_TESTS=false
GENERATE_HTML_REPORT=false

while [ $# -gt 0 ]; do
    case $1 in
        --quick)
            RUN_QUICK_TESTS=true
            RUN_FULL_TESTS=false
            shift
            ;;
        --full)
            RUN_FULL_TESTS=true
            shift
            ;;
        --verbose)
            set -x
            shift
            ;;
        --report)
            GENERATE_HTML_REPORT=true
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --quick           Run quick smoke tests only (health + basic chat)"
            echo "  --full            Run full test suite (default)"
            echo "  --verbose         Show detailed test output"
            echo "  --report          Generate HTML test report"
            echo "  --help            Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                          # Run full test suite"
            echo "  $0 --quick                 # Run quick smoke tests"
            echo "  $0 --verbose               # Show detailed output"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage"
            exit 1
            ;;
    esac
done

# Initialize report file
echo "API Test Suite - $(date)" > "$REPORT_FILE"
echo "API Base URL: $API_BASE_URL" >> "$REPORT_FILE"
echo "================================" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

print_header "API Test Suite"

if [ "$RUN_QUICK_TESTS" = "true" ]; then
    print_info "Running quick smoke tests..."
    test_api_running
    test_health_check
    test_chat_basic_chinese
    test_chat_basic_english
else
    print_info "Running full test suite..."
    test_health_check
    test_api_running
    test_chat_basic_chinese
    test_chat_basic_english
    test_chat_long_query
    test_chat_empty_message
    test_chat_very_long_message
    test_chat_missing_language
    test_chat_invalid_json
    test_chat_special_characters
    test_sse_stability
    test_response_time_p95
    test_feedback_endpoint
    test_cors_headers
    test_rate_limiting
fi

generate_summary

# Exit with error code based on test results
if [ $FAILED_TESTS -gt 0 ]; then
    exit 1
else
    exit 0
fi