#!/bin/bash

# StrengthOS API Deployment Script
# Usage: ./scripts/deploy.sh [environment] [version]
# Example: ./scripts/deploy.sh production v1.0.0

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT=${1:-staging}
VERSION=${2:-latest}
APP_NAME="sos-web-api"

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

# Validate environment
validate_environment() {
    case $ENVIRONMENT in
        development|staging|production)
            log_info "Deploying to $ENVIRONMENT environment"
            ;;
        *)
            log_error "Invalid environment: $ENVIRONMENT"
            log_error "Valid environments: development, staging, production"
            exit 1
            ;;
    esac
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if required commands exist
    local required_commands=("node" "npm" "docker" "git")
    for cmd in "${required_commands[@]}"; do
        if ! command -v $cmd &> /dev/null; then
            log_error "$cmd is required but not installed"
            exit 1
        fi
    done
    
    # Check Node.js version
    local node_version=$(node --version | cut -d'v' -f2)
    local required_version="18.0.0"
    if ! npx semver -r ">=$required_version" "$node_version" &> /dev/null; then
        log_error "Node.js version $required_version or higher is required (current: $node_version)"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Build application
build_application() {
    log_info "Building application..."
    
    cd "$PROJECT_DIR"
    
    # Install dependencies
    log_info "Installing dependencies..."
    npm ci --production=false
    
    # Run linting
    # log_info "Running linting..."
    # npm run lint
    
    # Run tests
    # log_info "Running tests..."
    # npm run test
    
    # Build application
    log_info "Building TypeScript..."
    npm run build
    
    log_success "Application built successfully"
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    # Load environment variables
    if [ -f "$PROJECT_DIR/.env.$ENVIRONMENT" ]; then
        export $(cat "$PROJECT_DIR/.env.$ENVIRONMENT" | grep -v '^#' | xargs)
    fi
    
    # Run migrations
    npm run migration:run
    
    log_success "Database migrations completed"
}

# Create Docker image
build_docker_image() {
    log_info "Building Docker image..."
    
    cd "$PROJECT_DIR"
    
    local image_tag="$APP_NAME:$VERSION"
    local latest_tag="$APP_NAME:latest"
    
    # Build Docker image
    docker build -t "$image_tag" -t "$latest_tag" .
    
    # Tag for registry if not local deployment
    if [ "$ENVIRONMENT" != "development" ]; then
        local registry_url="your-registry.com"
        docker tag "$image_tag" "$registry_url/$image_tag"
        docker tag "$latest_tag" "$registry_url/$latest_tag"
        
        # Push to registry
        log_info "Pushing image to registry..."
        docker push "$registry_url/$image_tag"
        docker push "$registry_url/$latest_tag"
    fi
    
    log_success "Docker image built and pushed"
}

# Deploy to Kubernetes
deploy_to_kubernetes() {
    log_info "Deploying to Kubernetes..."
    
    local namespace="strengthos-$ENVIRONMENT"
    local helm_chart="$PROJECT_DIR/helm/strengthos-api"
    local values_file="$PROJECT_DIR/helm/values-$ENVIRONMENT.yaml"
    
    # Check if values file exists
    if [ ! -f "$values_file" ]; then
        log_error "Values file not found: $values_file"
        exit 1
    fi
    
    # Deploy with Helm
    helm upgrade --install \
        "$APP_NAME" \
        "$helm_chart" \
        --namespace "$namespace" \
        --create-namespace \
        --values "$values_file" \
        --set image.tag="$VERSION" \
        --set environment="$ENVIRONMENT" \
        --wait \
        --timeout=10m
    
    log_success "Deployment to Kubernetes completed"
}

# Deploy to Docker Compose (for development/staging)
deploy_docker_compose() {
    log_info "Deploying with Docker Compose..."
    
    cd "$PROJECT_DIR"
    
    local compose_file="docker-compose.$ENVIRONMENT.yml"
    
    # Check if compose file exists
    if [ ! -f "$compose_file" ]; then
        log_warning "Compose file not found: $compose_file, using default"
        compose_file="docker-compose.yml"
    fi
    
    # Deploy with Docker Compose
    docker-compose -f "$compose_file" down
    docker-compose -f "$compose_file" up -d --build
    
    log_success "Docker Compose deployment completed"
}

# Health check
health_check() {
    log_info "Performing health check..."
    
    local health_url
    case $ENVIRONMENT in
        development)
            health_url="http://localhost:3000/api/v1/health"
            ;;
        staging)
            health_url="https://api-staging.strengthos.com/api/v1/health"
            ;;
        production)
            health_url="https://api.strengthos.com/api/v1/health"
            ;;
    esac
    
    # Wait for service to be ready
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$health_url" > /dev/null; then
            log_success "Health check passed"
            return 0
        fi
        
        log_info "Health check attempt $attempt/$max_attempts failed, retrying in 10 seconds..."
        sleep 10
        ((attempt++))
    done
    
    log_error "Health check failed after $max_attempts attempts"
    return 1
}

# Rollback function
rollback() {
    log_warning "Rolling back deployment..."
    
    case $ENVIRONMENT in
        development|staging)
            # Rollback Docker Compose
            docker-compose down
            docker-compose up -d --build
            ;;
        production)
            # Rollback Kubernetes deployment
            helm rollback "$APP_NAME" --namespace "strengthos-$ENVIRONMENT"
            ;;
    esac
    
    log_success "Rollback completed"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up..."
    
    # Remove old Docker images
    docker image prune -f
    
    # Clean npm cache
    npm cache clean --force
    
    log_success "Cleanup completed"
}

# Main deployment function
main() {
    log_info "Starting deployment of $APP_NAME version $VERSION to $ENVIRONMENT"
    
    # Validate inputs
    validate_environment
    
    # Check prerequisites
    check_prerequisites
    
    # Build application
    build_application
    
    # Run database migrations (skip for development)
    if [ "$ENVIRONMENT" != "development" ]; then
        run_migrations
    fi
    
    # Build and deploy
    case $ENVIRONMENT in
        development)
            deploy_docker_compose
            ;;
        staging)
            build_docker_image
            deploy_docker_compose
            ;;
        production)
            build_docker_image
            deploy_to_kubernetes
            ;;
    esac
    
    # Health check
    if ! health_check; then
        log_error "Deployment failed health check"
        rollback
        exit 1
    fi
    
    # Cleanup
    cleanup
    
    log_success "Deployment completed successfully!"
    log_info "Application is running at:"
    case $ENVIRONMENT in
        development)
            log_info "  - API: http://localhost:3000/api/v1"
            log_info "  - Docs: http://localhost:3000/api/docs"
            ;;
        staging)
            log_info "  - API: https://api-staging.strengthos.com/api/v1"
            log_info "  - Docs: https://api-staging.strengthos.com/api/docs"
            ;;
        production)
            log_info "  - API: https://api.strengthos.com/api/v1"
            log_info "  - Docs: https://api.strengthos.com/api/docs"
            ;;
    esac
}

# Trap errors and cleanup
trap 'log_error "Deployment failed"; cleanup; exit 1' ERR

# Run main function
main "$@"