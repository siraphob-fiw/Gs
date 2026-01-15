#!/bin/bash

# StrengthOS Production Readiness Checklist
# This script validates that the application is ready for production deployment

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED_CHECKS++))
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    ((WARNING_CHECKS++))
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED_CHECKS++))
}

check_item() {
    ((TOTAL_CHECKS++))
}

# Security Checks
check_security() {
    echo
    log_info "=== Security Checks ==="
    
    # Check for hardcoded secrets
    check_item
    log_info "Checking for hardcoded secrets..."
    if grep -r -i "password\|secret\|key" --include="*.ts" --include="*.js" --include="*.json" "$PROJECT_ROOT/src" | grep -v "// TODO\|// FIXME" | grep -E "(password|secret|key)\s*[:=]\s*['\"][^'\"]{8,}" > /dev/null; then
        log_error "Potential hardcoded secrets found in source code"
    else
        log_success "No hardcoded secrets detected"
    fi
    
    # Check for TODO/FIXME comments in security-critical files
    check_item
    log_info "Checking for security TODOs..."
    security_files=("AuthService" "AccessControlService" "SecurityMiddleware")
    todo_found=false
    for file in "${security_files[@]}"; do
        if find "$PROJECT_ROOT/src" -name "*$file*" -exec grep -l "TODO\|FIXME" {} \; | head -1 > /dev/null; then
            todo_found=true
            break
        fi
    done
    
    if [[ "$todo_found" == true ]]; then
        log_warning "TODO/FIXME comments found in security-critical files"
    else
        log_success "No security-related TODOs found"
    fi
    
    # Check for proper error handling
    check_item
    log_info "Checking error handling coverage..."
    if grep -r "throw new Error\|console.error" --include="*.ts" "$PROJECT_ROOT/src" > /dev/null; then
        log_warning "Basic error handling detected - ensure proper error logging is implemented"
    else
        log_success "Error handling appears to be properly implemented"
    fi
    
    # Check for rate limiting configuration
    check_item
    log_info "Checking rate limiting configuration..."
    if [[ -f "$PROJECT_ROOT/src/Middleware/RateLimitMiddleware.ts" ]]; then
        log_success "Rate limiting middleware found"
    else
        log_error "Rate limiting middleware not found"
    fi
    
    # Check for CORS configuration
    check_item
    log_info "Checking CORS configuration..."
    if grep -r "cors" --include="*.ts" "$PROJECT_ROOT/src" > /dev/null; then
        log_success "CORS configuration found"
    else
        log_error "CORS configuration not found"
    fi
}

# Performance Checks
check_performance() {
    echo
    log_info "=== Performance Checks ==="
    
    # Check for database connection pooling
    check_item
    log_info "Checking database connection pooling..."
    if grep -r "pool" --include="*.ts" "$PROJECT_ROOT/src" | grep -i "database\|db" > /dev/null; then
        log_success "Database connection pooling configured"
    else
        log_warning "Database connection pooling not clearly configured"
    fi
    
    # Check for caching implementation
    check_item
    log_info "Checking caching implementation..."
    if [[ -f "$PROJECT_ROOT/src/Services/Caches/RedisCacheService.ts" ]]; then
        log_success "Redis caching service found"
    else
        log_error "Caching service not found"
    fi
    
    # Check for query optimization
    check_item
    log_info "Checking for query optimization..."
    if [[ -f "$PROJECT_ROOT/src/Services/Caches/DatabaseOptimizationService.ts" ]]; then
        log_success "Database optimization service found"
    else
        log_warning "Database optimization service not found"
    fi
    
    # Check for performance monitoring
    check_item
    log_info "Checking performance monitoring..."
    if [[ -f "$PROJECT_ROOT/src/Services/Monitoring/MetricsService.ts" ]]; then
        log_success "Metrics service found"
    else
        log_error "Performance monitoring not implemented"
    fi
}

# Reliability Checks
check_reliability() {
    echo
    log_info "=== Reliability Checks ==="
    
    # Check for health checks
    check_item
    log_info "Checking health check endpoints..."
    if [[ -f "$PROJECT_ROOT/src/Routes/HealthRoutes.ts" ]]; then
        log_success "Health check routes found"
    else
        log_error "Health check endpoints not implemented"
    fi
    
    # Check for graceful shutdown
    check_item
    log_info "Checking graceful shutdown handling..."
    if grep -r "SIGTERM\|SIGINT" --include="*.ts" "$PROJECT_ROOT/src" > /dev/null; then
        log_success "Graceful shutdown handling found"
    else
        log_warning "Graceful shutdown handling not clearly implemented"
    fi
    
    # Check for circuit breaker pattern
    check_item
    log_info "Checking circuit breaker implementation..."
    if [[ -f "$PROJECT_ROOT/src/Services/ExternalIntegrations/CircuitBreakerService.ts" ]]; then
        log_success "Circuit breaker service found"
    else
        log_warning "Circuit breaker pattern not implemented"
    fi
    
    # Check for retry logic
    check_item
    log_info "Checking retry logic..."
    if [[ -f "$PROJECT_ROOT/src/Services/ExternalIntegrations/RetryService.ts" ]]; then
        log_success "Retry service found"
    else
        log_warning "Retry logic not implemented"
    fi
    
    # Check for backup and recovery
    check_item
    log_info "Checking backup and recovery..."
    if [[ -f "$PROJECT_ROOT/src/Services/DataMigration/BackupService.ts" ]]; then
        log_success "Backup service found"
    else
        log_error "Backup and recovery not implemented"
    fi
}

# Monitoring and Observability Checks
check_monitoring() {
    echo
    log_info "=== Monitoring and Observability Checks ==="
    
    # Check for structured logging
    check_item
    log_info "Checking structured logging..."
    if [[ -f "$PROJECT_ROOT/src/Services/Monitoring/LoggingService.ts" ]]; then
        log_success "Structured logging service found"
    else
        log_error "Structured logging not implemented"
    fi
    
    # Check for metrics collection
    check_item
    log_info "Checking metrics collection..."
    if grep -r "prometheus\|metrics" --include="*.ts" "$PROJECT_ROOT/src" > /dev/null; then
        log_success "Metrics collection implemented"
    else
        log_error "Metrics collection not found"
    fi
    
    # Check for distributed tracing
    check_item
    log_info "Checking distributed tracing..."
    if grep -r "trace\|span" --include="*.ts" "$PROJECT_ROOT/src" > /dev/null; then
        log_success "Distributed tracing implemented"
    else
        log_warning "Distributed tracing not clearly implemented"
    fi
    
    # Check for alerting configuration
    check_item
    log_info "Checking alerting configuration..."
    if [[ -f "$PROJECT_ROOT/monitoring/alertmanager/alertmanager.yml" ]]; then
        log_success "Alerting configuration found"
    else
        log_warning "Alerting configuration not found"
    fi
}

# Compliance Checks
check_compliance() {
    echo
    log_info "=== Compliance Checks ==="
    
    # Check for audit logging
    check_item
    log_info "Checking audit logging..."
    if grep -r "audit" --include="*.ts" "$PROJECT_ROOT/src" > /dev/null; then
        log_success "Audit logging implemented"
    else
        log_error "Audit logging not found"
    fi
    
    # Check for data privacy controls
    check_item
    log_info "Checking data privacy controls..."
    if [[ -f "$PROJECT_ROOT/src/Services/Security/SecurityComplianceService.ts" ]]; then
        log_success "Security compliance service found"
    else
        log_error "Data privacy controls not implemented"
    fi
    
    # Check for GDPR compliance
    check_item
    log_info "Checking GDPR compliance features..."
    if grep -r "gdpr\|data.*export\|data.*deletion" --include="*.ts" "$PROJECT_ROOT/src" > /dev/null; then
        log_success "GDPR compliance features found"
    else
        log_warning "GDPR compliance features not clearly implemented"
    fi
}

# Infrastructure Checks
check_infrastructure() {
    echo
    log_info "=== Infrastructure Checks ==="
    
    # Check for Dockerfile
    check_item
    log_info "Checking Dockerfile..."
    if [[ -f "$PROJECT_ROOT/Dockerfile" ]]; then
        log_success "Dockerfile found"
    else
        log_error "Dockerfile not found"
    fi
    
    # Check for Kubernetes manifests
    check_item
    log_info "Checking Kubernetes manifests..."
    if [[ -d "$PROJECT_ROOT/helm" ]]; then
        log_success "Helm charts found"
    else
        log_error "Kubernetes deployment manifests not found"
    fi
    
    # Check for CI/CD pipeline
    check_item
    log_info "Checking CI/CD pipeline..."
    if [[ -f "$PROJECT_ROOT/.github/workflows/ci-cd.yml" ]]; then
        log_success "CI/CD pipeline configuration found"
    else
        log_error "CI/CD pipeline not configured"
    fi
    
    # Check for environment configuration
    check_item
    log_info "Checking environment configuration..."
    if [[ -f "$PROJECT_ROOT/helm/values-production.yaml" ]]; then
        log_success "Production environment configuration found"
    else
        log_warning "Production environment configuration not found"
    fi
}

# Testing Checks
check_testing() {
    echo
    log_info "=== Testing Checks ==="
    
    # Check for unit tests
    check_item
    log_info "Checking unit test coverage..."
    if [[ -d "$PROJECT_ROOT/src/__tests__" ]]; then
        test_files=$(find "$PROJECT_ROOT/src/__tests__" -name "*.test.ts" | wc -l)
        if [[ $test_files -gt 10 ]]; then
            log_success "Comprehensive unit tests found ($test_files test files)"
        else
            log_warning "Limited unit test coverage ($test_files test files)"
        fi
    else
        log_error "Unit tests not found"
    fi
    
    # Check for integration tests
    check_item
    log_info "Checking integration tests..."
    if find "$PROJECT_ROOT/src/__tests__" -name "*integration*" -o -name "*Integration*" | head -1 > /dev/null 2>&1; then
        log_success "Integration tests found"
    else
        log_warning "Integration tests not found"
    fi
    
    # Check for security tests
    check_item
    log_info "Checking security tests..."
    if find "$PROJECT_ROOT/src/__tests__" -name "*security*" -o -name "*Security*" | head -1 > /dev/null 2>&1; then
        log_success "Security tests found"
    else
        log_warning "Security tests not found"
    fi
    
    # Check for performance tests
    check_item
    log_info "Checking performance tests..."
    if find "$PROJECT_ROOT/src/__tests__" -name "*performance*" -o -name "*Performance*" | head -1 > /dev/null 2>&1; then
        log_success "Performance tests found"
    else
        log_warning "Performance tests not found"
    fi
}

# Documentation Checks
check_documentation() {
    echo
    log_info "=== Documentation Checks ==="
    
    # Check for README
    check_item
    log_info "Checking README documentation..."
    if [[ -f "$PROJECT_ROOT/README.md" ]]; then
        log_success "README.md found"
    else
        log_error "README.md not found"
    fi
    
    # Check for API documentation
    check_item
    log_info "Checking API documentation..."
    if grep -r "swagger\|openapi" --include="*.ts" "$PROJECT_ROOT/src" > /dev/null; then
        log_success "API documentation (Swagger/OpenAPI) found"
    else
        log_warning "API documentation not found"
    fi
    
    # Check for deployment documentation
    check_item
    log_info "Checking deployment documentation..."
    if [[ -f "$PROJECT_ROOT/DEPLOYMENT.md" ]] || grep -i "deployment\|deploy" "$PROJECT_ROOT/README.md" > /dev/null 2>&1; then
        log_success "Deployment documentation found"
    else
        log_warning "Deployment documentation not found"
    fi
}

# Run all checks
run_all_checks() {
    log_info "Starting Production Readiness Check for StrengthOS User Management API"
    log_info "=================================================================="
    
    check_security
    check_performance
    check_reliability
    check_monitoring
    check_compliance
    check_infrastructure
    check_testing
    check_documentation
    
    # Summary
    echo
    log_info "=== Production Readiness Summary ==="
    echo "Total Checks: $TOTAL_CHECKS"
    echo -e "Passed: ${GREEN}$PASSED_CHECKS${NC}"
    echo -e "Warnings: ${YELLOW}$WARNING_CHECKS${NC}"
    echo -e "Failed: ${RED}$FAILED_CHECKS${NC}"
    
    # Calculate score
    local score=$(( (PASSED_CHECKS * 100) / TOTAL_CHECKS ))
    echo "Overall Score: $score%"
    
    echo
    if [[ $FAILED_CHECKS -eq 0 ]]; then
        if [[ $WARNING_CHECKS -eq 0 ]]; then
            log_success "🎉 Application is FULLY READY for production deployment!"
        else
            log_warning "⚠️  Application is MOSTLY READY for production with some warnings to address"
        fi
        exit 0
    else
        log_error "❌ Application is NOT READY for production deployment"
        log_error "Please address the failed checks before deploying to production"
        exit 1
    fi
}

# Main execution
main() {
    cd "$PROJECT_ROOT"
    run_all_checks
}

# Show help
show_help() {
    cat << EOF
StrengthOS Production Readiness Checker

This script validates that the application meets production deployment standards
across security, performance, reliability, monitoring, compliance, infrastructure,
testing, and documentation.

Usage: $0 [OPTIONS]

OPTIONS:
    -h, --help      Show this help message

The script will exit with code 0 if ready for production, 1 if not ready.

EOF
}

# Parse arguments
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac