#!/bin/bash

# StrengthOS API Health Check Script
# Usage: ./scripts/health-check.sh [environment] [timeout]
# Example: ./scripts/health-check.sh production 30

set -e

# Configuration
ENVIRONMENT=${1:-development}
TIMEOUT=${2:-30}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get health check URL based on environment
get_health_url() {
    case $ENVIRONMENT in
        development)
            echo "http://localhost:3000/api/v1/health"
            ;;
        staging)
            echo "https://api-staging.strengthos.com/api/v1/health"
            ;;
        production)
            echo "https://api.strengthos.com/api/v1/health"
            ;;
        *)
            log_error "Invalid environment: $ENVIRONMENT"
            exit 1
            ;;
    esac
}

# Perform basic health check
basic_health_check() {
    local url=$1
    local response
    
    log_info "Performing basic health check..."
    
    response=$(curl -s -w "%{http_code}" -o /tmp/health_response "$url" || echo "000")
    
    if [ "$response" = "200" ]; then
        log_success "Basic health check passed (HTTP 200)"
        return 0
    else
        log_error "Basic health check failed (HTTP $response)"
        if [ -f /tmp/health_response ]; then
            log_error "Response: $(cat /tmp/health_response)"
        fi
        return 1
    fi
}

# Perform detailed health check
detailed_health_check() {
    local url=$1
    local response_file="/tmp/health_detailed_response"
    
    log_info "Performing detailed health check..."
    
    if curl -s "$url" > "$response_file"; then
        local status=$(jq -r '.status' "$response_file" 2>/dev/null || echo "unknown")
        
        if [ "$status" = "ok" ]; then
            log_success "Detailed health check passed"
            
            # Check individual services
            log_info "Service status:"
            jq -r '.info | to_entries[] | "  - \(.key): \(.value.status)"' "$response_file" 2>/dev/null || true
            
            # Check for any errors
            local errors=$(jq -r '.error | length' "$response_file" 2>/dev/null || echo "0")
            if [ "$errors" != "0" ]; then
                log_warning "Some services have errors:"
                jq -r '.error | to_entries[] | "  - \(.key): \(.value)"' "$response_file" 2>/dev/null || true
            fi
            
            return 0
        else
            log_error "Detailed health check failed (status: $status)"
            return 1
        fi
    else
        log_error "Failed to get detailed health response"
        return 1
    fi
}

# Check database connectivity
check_database() {
    local base_url=$(dirname "$(get_health_url)")
    local db_url="$base_url/health/database"
    
    log_info "Checking database connectivity..."
    
    local response=$(curl -s -w "%{http_code}" -o /tmp/db_response "$db_url" || echo "000")
    
    if [ "$response" = "200" ]; then
        log_success "Database connectivity check passed"
        return 0
    else
        log_error "Database connectivity check failed (HTTP $response)"
        return 1
    fi
}

# Check cache connectivity
check_cache() {
    local base_url=$(dirname "$(get_health_url)")
    local cache_url="$base_url/health/cache"
    
    log_info "Checking cache connectivity..."
    
    local response=$(curl -s -w "%{http_code}" -o /tmp/cache_response "$cache_url" || echo "000")
    
    if [ "$response" = "200" ]; then
        log_success "Cache connectivity check passed"
        return 0
    else
        log_warning "Cache connectivity check failed (HTTP $response)"
        return 0  # Cache failure is not critical
    fi
}

# Check API endpoints
check_api_endpoints() {
    local base_url=$(dirname "$(get_health_url)")
    local endpoints=(
        "/auth/health"
        "/users/health"
        "/tenants/health"
    )
    
    log_info "Checking API endpoints..."
    
    local failed_endpoints=0
    
    for endpoint in "${endpoints[@]}"; do
        local url="$base_url$endpoint"
        local response=$(curl -s -w "%{http_code}" -o /dev/null "$url" || echo "000")
        
        if [ "$response" = "200" ] || [ "$response" = "401" ]; then
            log_info "  ✓ $endpoint (HTTP $response)"
        else
            log_warning "  ✗ $endpoint (HTTP $response)"
            ((failed_endpoints++))
        fi
    done
    
    if [ $failed_endpoints -eq 0 ]; then
        log_success "All API endpoints are responding"
        return 0
    else
        log_warning "$failed_endpoints API endpoints are not responding properly"
        return 0  # Non-critical for basic health check
    fi
}

# Performance check
performance_check() {
    local url=$1
    
    log_info "Performing performance check..."
    
    local start_time=$(date +%s%N)
    local response=$(curl -s -w "%{http_code}" -o /dev/null "$url" || echo "000")
    local end_time=$(date +%s%N)
    
    local duration_ms=$(( (end_time - start_time) / 1000000 ))
    
    if [ "$response" = "200" ]; then
        if [ $duration_ms -lt 1000 ]; then
            log_success "Performance check passed (${duration_ms}ms)"
            return 0
        elif [ $duration_ms -lt 5000 ]; then
            log_warning "Performance check slow (${duration_ms}ms)"
            return 0
        else
            log_error "Performance check failed - too slow (${duration_ms}ms)"
            return 1
        fi
    else
        log_error "Performance check failed (HTTP $response)"
        return 1
    fi
}

# Wait for service to be ready
wait_for_service() {
    local url=$1
    local max_attempts=$((TIMEOUT / 5))
    local attempt=1
    
    log_info "Waiting for service to be ready (timeout: ${TIMEOUT}s)..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url" > /dev/null 2>&1; then
            log_success "Service is ready after $((attempt * 5)) seconds"
            return 0
        fi
        
        log_info "Attempt $attempt/$max_attempts - service not ready, waiting 5 seconds..."
        sleep 5
        ((attempt++))
    done
    
    log_error "Service did not become ready within ${TIMEOUT} seconds"
    return 1
}

# Main health check function
main() {
    local health_url=$(get_health_url)
    local exit_code=0
    
    log_info "Starting health check for $ENVIRONMENT environment"
    log_info "Health URL: $health_url"
    
    # Wait for service to be ready
    if ! wait_for_service "$health_url"; then
        exit_code=1
    fi
    
    # Basic health check
    if ! basic_health_check "$health_url"; then
        exit_code=1
    fi
    
    # Detailed health check
    if ! detailed_health_check "$health_url"; then
        exit_code=1
    fi
    
    # Database check
    if ! check_database; then
        exit_code=1
    fi
    
    # Cache check
    check_cache  # Non-critical
    
    # API endpoints check
    check_api_endpoints  # Non-critical
    
    # Performance check
    if ! performance_check "$health_url"; then
        exit_code=1
    fi
    
    # Summary
    if [ $exit_code -eq 0 ]; then
        log_success "All health checks passed!"
        log_info "Service is healthy and ready to serve requests"
    else
        log_error "Some health checks failed!"
        log_error "Service may not be fully operational"
    fi
    
    # Cleanup
    rm -f /tmp/health_response /tmp/health_detailed_response /tmp/db_response /tmp/cache_response
    
    exit $exit_code
}

# Check if jq is available
if ! command -v jq &> /dev/null; then
    log_warning "jq is not installed - detailed health checks will be limited"
fi

# Run main function
main "$@"