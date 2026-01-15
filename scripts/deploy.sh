#!/bin/bash

# StrengthOS Deployment Script
# This script handles deployment to different environments

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DOCKER_REGISTRY="ghcr.io"
IMAGE_NAME="strengthos/user-management-api"

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

# Help function
show_help() {
    cat << EOF
StrengthOS Deployment Script

Usage: $0 [OPTIONS] ENVIRONMENT

ENVIRONMENTS:
    local       Deploy to local development environment
    staging     Deploy to staging environment
    production  Deploy to production environment

OPTIONS:
    -h, --help              Show this help message
    -v, --version VERSION   Specify version to deploy (default: latest)
    -f, --force             Force deployment without confirmation
    -d, --dry-run           Show what would be deployed without executing
    -b, --build             Build new image before deployment
    --skip-tests            Skip running tests before deployment
    --skip-migrations       Skip database migrations
    --rollback VERSION      Rollback to specified version

EXAMPLES:
    $0 staging                          # Deploy latest to staging
    $0 production -v v1.2.3            # Deploy specific version to production
    $0 local -b                        # Build and deploy to local
    $0 production --rollback v1.2.2    # Rollback production to v1.2.2

EOF
}

# Parse command line arguments
ENVIRONMENT=""
VERSION="latest"
FORCE=false
DRY_RUN=false
BUILD=false
SKIP_TESTS=false
SKIP_MIGRATIONS=false
ROLLBACK=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -v|--version)
            VERSION="$2"
            shift 2
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -b|--build)
            BUILD=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-migrations)
            SKIP_MIGRATIONS=true
            shift
            ;;
        --rollback)
            ROLLBACK="$2"
            shift 2
            ;;
        local|staging|production)
            ENVIRONMENT="$1"
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate environment
if [[ -z "$ENVIRONMENT" ]]; then
    log_error "Environment is required"
    show_help
    exit 1
fi

# Load environment configuration
load_environment_config() {
    local env_file="$PROJECT_ROOT/config/environments/$ENVIRONMENT.env"
    
    if [[ -f "$env_file" ]]; then
        log_info "Loading environment configuration from $env_file"
        source "$env_file"
    else
        log_warning "Environment configuration file not found: $env_file"
    fi
}

# Pre-deployment checks
pre_deployment_checks() {
    log_info "Running pre-deployment checks..."
    
    # Check if required tools are installed
    local required_tools=("docker" "kubectl" "helm")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "$tool is required but not installed"
            exit 1
        fi
    done
    
    # Check if we're on the correct branch for production
    if [[ "$ENVIRONMENT" == "production" ]]; then
        local current_branch=$(git rev-parse --abbrev-ref HEAD)
        if [[ "$current_branch" != "main" && "$FORCE" != true ]]; then
            log_error "Production deployments must be from main branch. Current branch: $current_branch"
            log_info "Use --force to override this check"
            exit 1
        fi
    fi
    
    # Check for uncommitted changes
    if [[ -n $(git status --porcelain) && "$FORCE" != true ]]; then
        log_error "There are uncommitted changes in the repository"
        log_info "Use --force to override this check"
        exit 1
    fi
    
    log_success "Pre-deployment checks passed"
}

# Run tests
run_tests() {
    if [[ "$SKIP_TESTS" == true ]]; then
        log_warning "Skipping tests"
        return
    fi
    
    log_info "Running test suite..."
    
    cd "$PROJECT_ROOT"
    
    # Install dependencies if needed
    if [[ ! -d "node_modules" ]]; then
        log_info "Installing dependencies..."
        npm ci
    fi
    
    # Run tests
    npm run test:unit
    npm run test:integration
    npm run test:security
    
    log_success "All tests passed"
}

# Build Docker image
build_image() {
    if [[ "$BUILD" != true && "$ROLLBACK" == "" ]]; then
        log_info "Skipping image build"
        return
    fi
    
    log_info "Building Docker image..."
    
    cd "$PROJECT_ROOT"
    
    local image_tag="$DOCKER_REGISTRY/$IMAGE_NAME:$VERSION"
    local git_commit=$(git rev-parse --short HEAD)
    
    docker build \
        --build-arg VERSION="$VERSION" \
        --build-arg GIT_COMMIT="$git_commit" \
        --build-arg BUILD_TIME="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        -t "$image_tag" \
        .
    
    # Tag as latest if this is the latest version
    if [[ "$VERSION" == "latest" || "$ENVIRONMENT" == "production" ]]; then
        docker tag "$image_tag" "$DOCKER_REGISTRY/$IMAGE_NAME:latest"
    fi
    
    log_success "Docker image built: $image_tag"
}

# Push Docker image
push_image() {
    if [[ "$ENVIRONMENT" == "local" ]]; then
        log_info "Skipping image push for local environment"
        return
    fi
    
    log_info "Pushing Docker image to registry..."
    
    local image_tag="$DOCKER_REGISTRY/$IMAGE_NAME:$VERSION"
    
    docker push "$image_tag"
    
    if [[ "$VERSION" == "latest" || "$ENVIRONMENT" == "production" ]]; then
        docker push "$DOCKER_REGISTRY/$IMAGE_NAME:latest"
    fi
    
    log_success "Docker image pushed: $image_tag"
}

# Deploy to Kubernetes
deploy_to_kubernetes() {
    log_info "Deploying to Kubernetes ($ENVIRONMENT)..."
    
    local namespace="strengthos-$ENVIRONMENT"
    local helm_chart="$PROJECT_ROOT/helm/strengthos-user-management"
    local values_file="$PROJECT_ROOT/helm/values-$ENVIRONMENT.yaml"
    
    # Create namespace if it doesn't exist
    kubectl create namespace "$namespace" --dry-run=client -o yaml | kubectl apply -f -
    
    # Deploy using Helm
    local helm_args=(
        "upgrade" "--install"
        "strengthos-user-management"
        "$helm_chart"
        "--namespace" "$namespace"
        "--values" "$values_file"
        "--set" "image.tag=$VERSION"
        "--set" "environment=$ENVIRONMENT"
    )
    
    if [[ "$DRY_RUN" == true ]]; then
        helm_args+=("--dry-run")
    fi
    
    helm "${helm_args[@]}"
    
    if [[ "$DRY_RUN" != true ]]; then
        # Wait for deployment to be ready
        kubectl rollout status deployment/strengthos-user-management -n "$namespace" --timeout=300s
        log_success "Deployment completed successfully"
    else
        log_info "Dry run completed"
    fi
}

# Deploy to local environment
deploy_local() {
    log_info "Deploying to local environment..."
    
    cd "$PROJECT_ROOT"
    
    # Stop existing containers
    docker-compose down
    
    # Start services
    if [[ "$BUILD" == true ]]; then
        docker-compose up --build -d
    else
        docker-compose up -d
    fi
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 10
    
    # Check health
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f http://localhost:3000/health &> /dev/null; then
            log_success "Application is healthy"
            break
        fi
        
        log_info "Attempt $attempt/$max_attempts: Waiting for application to be ready..."
        sleep 5
        ((attempt++))
    done
    
    if [[ $attempt -gt $max_attempts ]]; then
        log_error "Application failed to become healthy"
        exit 1
    fi
}

# Run database migrations
run_migrations() {
    if [[ "$SKIP_MIGRATIONS" == true ]]; then
        log_warning "Skipping database migrations"
        return
    fi
    
    log_info "Running database migrations..."
    
    case "$ENVIRONMENT" in
        local)
            cd "$PROJECT_ROOT"
            npm run migrate:latest
            ;;
        staging|production)
            # Run migrations in Kubernetes
            local namespace="strengthos-$ENVIRONMENT"
            kubectl run migration-job \
                --image="$DOCKER_REGISTRY/$IMAGE_NAME:$VERSION" \
                --namespace="$namespace" \
                --restart=Never \
                --command -- npm run migrate:latest
            
            # Wait for migration to complete
            kubectl wait --for=condition=complete job/migration-job -n "$namespace" --timeout=300s
            kubectl delete job migration-job -n "$namespace"
            ;;
    esac
    
    log_success "Database migrations completed"
}

# Rollback deployment
rollback_deployment() {
    if [[ -z "$ROLLBACK" ]]; then
        return
    fi
    
    log_info "Rolling back to version: $ROLLBACK"
    
    case "$ENVIRONMENT" in
        local)
            log_error "Rollback not supported for local environment"
            exit 1
            ;;
        staging|production)
            local namespace="strengthos-$ENVIRONMENT"
            
            # Rollback using Helm
            helm rollback strengthos-user-management --namespace "$namespace"
            
            # Wait for rollback to complete
            kubectl rollout status deployment/strengthos-user-management -n "$namespace" --timeout=300s
            ;;
    esac
    
    log_success "Rollback completed"
}

# Post-deployment verification
post_deployment_verification() {
    log_info "Running post-deployment verification..."
    
    local health_url
    case "$ENVIRONMENT" in
        local)
            health_url="http://localhost:3000/health"
            ;;
        staging)
            health_url="https://api-staging.strengthos.com/health"
            ;;
        production)
            health_url="https://api.strengthos.com/health"
            ;;
    esac
    
    # Check application health
    local max_attempts=10
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f "$health_url" &> /dev/null; then
            log_success "Application health check passed"
            break
        fi
        
        log_info "Attempt $attempt/$max_attempts: Health check failed, retrying..."
        sleep 10
        ((attempt++))
    done
    
    if [[ $attempt -gt $max_attempts ]]; then
        log_error "Post-deployment health check failed"
        exit 1
    fi
    
    # Run smoke tests
    log_info "Running smoke tests..."
    # Add smoke test commands here
    
    log_success "Post-deployment verification completed"
}

# Confirmation prompt
confirm_deployment() {
    if [[ "$FORCE" == true || "$DRY_RUN" == true ]]; then
        return
    fi
    
    echo
    log_warning "You are about to deploy to $ENVIRONMENT environment"
    log_info "Version: $VERSION"
    log_info "Image: $DOCKER_REGISTRY/$IMAGE_NAME:$VERSION"
    echo
    
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Deployment cancelled"
        exit 0
    fi
}

# Main deployment function
main() {
    log_info "Starting deployment to $ENVIRONMENT environment"
    
    load_environment_config
    pre_deployment_checks
    
    if [[ -n "$ROLLBACK" ]]; then
        confirm_deployment
        rollback_deployment
        post_deployment_verification
        log_success "Rollback completed successfully"
        return
    fi
    
    run_tests
    build_image
    push_image
    
    confirm_deployment
    
    case "$ENVIRONMENT" in
        local)
            deploy_local
            ;;
        staging|production)
            run_migrations
            deploy_to_kubernetes
            ;;
    esac
    
    post_deployment_verification
    
    log_success "Deployment to $ENVIRONMENT completed successfully"
}

# Run main function
main "$@"