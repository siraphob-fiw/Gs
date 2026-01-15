#!/bin/bash

# StrengthOS API Backup Script
# Usage: ./scripts/backup.sh [environment] [type]
# Example: ./scripts/backup.sh production full

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT=${1:-production}
BACKUP_TYPE=${2:-incremental}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

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

# Load environment variables
load_environment() {
    local env_file="$PROJECT_DIR/.env.$ENVIRONMENT"
    
    if [ -f "$env_file" ]; then
        log_info "Loading environment from $env_file"
        export $(cat "$env_file" | grep -v '^#' | xargs)
    else
        log_error "Environment file not found: $env_file"
        exit 1
    fi
}

# Validate backup configuration
validate_backup_config() {
    if [ "$BACKUP_ENABLED" != "true" ]; then
        log_error "Backup is not enabled for $ENVIRONMENT environment"
        exit 1
    fi
    
    if [ -z "$DATABASE_URL" ]; then
        log_error "DATABASE_URL is not configured"
        exit 1
    fi
    
    if [ -z "$BACKUP_S3_BUCKET" ]; then
        log_error "BACKUP_S3_BUCKET is not configured"
        exit 1
    fi
    
    log_success "Backup configuration validated"
}

# Create backup directory
create_backup_dir() {
    local backup_dir="/tmp/strengthos_backup_$TIMESTAMP"
    mkdir -p "$backup_dir"
    echo "$backup_dir"
}

# Backup database
backup_database() {
    local backup_dir=$1
    local db_backup_file="$backup_dir/database_$TIMESTAMP.sql"
    
    log_info "Creating database backup..."
    
    # Extract database connection details from URL
    local db_url_regex="postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+)"
    if [[ $DATABASE_URL =~ $db_url_regex ]]; then
        local db_user="${BASH_REMATCH[1]}"
        local db_password="${BASH_REMATCH[2]}"
        local db_host="${BASH_REMATCH[3]}"
        local db_port="${BASH_REMATCH[4]}"
        local db_name="${BASH_REMATCH[5]}"
        
        # Set password for pg_dump
        export PGPASSWORD="$db_password"
        
        # Create database dump
        pg_dump -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" \
            --verbose --clean --if-exists --create \
            --format=custom --compress=9 \
            --file="$db_backup_file.custom"
        
        # Also create SQL dump for easier inspection
        pg_dump -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" \
            --verbose --clean --if-exists --create \
            --file="$db_backup_file"
        
        # Compress SQL dump
        gzip "$db_backup_file"
        
        unset PGPASSWORD
        
        log_success "Database backup created: $db_backup_file.gz"
    else
        log_error "Invalid DATABASE_URL format"
        exit 1
    fi
}

# Backup Redis data
backup_redis() {
    local backup_dir=$1
    local redis_backup_file="$backup_dir/redis_$TIMESTAMP.rdb"
    
    log_info "Creating Redis backup..."
    
    if [ -n "$REDIS_URL" ]; then
        # Extract Redis connection details
        local redis_host=$(echo "$REDIS_URL" | sed -n 's/redis:\/\/\([^:]*\):.*/\1/p')
        local redis_port=$(echo "$REDIS_URL" | sed -n 's/redis:\/\/[^:]*:\([0-9]*\).*/\1/p')
        
        # Use redis-cli to create backup
        if command -v redis-cli &> /dev/null; then
            redis-cli -h "$redis_host" -p "$redis_port" --rdb "$redis_backup_file"
            log_success "Redis backup created: $redis_backup_file"
        else
            log_warning "redis-cli not found, skipping Redis backup"
        fi
    else
        log_warning "REDIS_URL not configured, skipping Redis backup"
    fi
}

# Backup application files
backup_application() {
    local backup_dir=$1
    local app_backup_file="$backup_dir/application_$TIMESTAMP.tar.gz"
    
    log_info "Creating application backup..."
    
    # Files and directories to backup
    local backup_items=(
        "package.json"
        "package-lock.json"
        "tsconfig.json"
        "src/"
        "migrations/"
        "seeds/"
        "config/"
        ".env.$ENVIRONMENT"
    )
    
    # Create tar archive
    cd "$PROJECT_DIR"
    tar -czf "$app_backup_file" "${backup_items[@]}" 2>/dev/null || true
    
    log_success "Application backup created: $app_backup_file"
}

# Backup logs
backup_logs() {
    local backup_dir=$1
    local logs_backup_file="$backup_dir/logs_$TIMESTAMP.tar.gz"
    
    log_info "Creating logs backup..."
    
    local log_dirs=(
        "/var/log/strengthos"
        "$PROJECT_DIR/logs"
    )
    
    local existing_dirs=()
    for dir in "${log_dirs[@]}"; do
        if [ -d "$dir" ]; then
            existing_dirs+=("$dir")
        fi
    done
    
    if [ ${#existing_dirs[@]} -gt 0 ]; then
        tar -czf "$logs_backup_file" "${existing_dirs[@]}" 2>/dev/null || true
        log_success "Logs backup created: $logs_backup_file"
    else
        log_warning "No log directories found, skipping logs backup"
    fi
}

# Upload to S3
upload_to_s3() {
    local backup_dir=$1
    local s3_path="s3://$BACKUP_S3_BUCKET/$ENVIRONMENT/$TIMESTAMP"
    
    log_info "Uploading backup to S3: $s3_path"
    
    # Check if AWS CLI is available
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed"
        exit 1
    fi
    
    # Upload all backup files
    aws s3 cp "$backup_dir" "$s3_path" --recursive --storage-class STANDARD_IA
    
    # Create manifest file
    local manifest_file="$backup_dir/manifest.json"
    cat > "$manifest_file" << EOF
{
  "timestamp": "$TIMESTAMP",
  "environment": "$ENVIRONMENT",
  "backup_type": "$BACKUP_TYPE",
  "files": [
$(find "$backup_dir" -type f -name "*.sql.gz" -o -name "*.custom" -o -name "*.rdb" -o -name "*.tar.gz" | sed 's/.*\//    "/' | sed 's/$/",/' | sed '$ s/,$//')
  ],
  "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "retention_until": "$(date -u -d "+${BACKUP_RETENTION_DAYS:-30} days" +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
    
    # Upload manifest
    aws s3 cp "$manifest_file" "$s3_path/manifest.json"
    
    log_success "Backup uploaded to S3 successfully"
}

# Cleanup old backups
cleanup_old_backups() {
    local retention_days=${BACKUP_RETENTION_DAYS:-30}
    local cutoff_date=$(date -u -d "-$retention_days days" +"%Y%m%d")
    
    log_info "Cleaning up backups older than $retention_days days..."
    
    # List and delete old backups from S3
    aws s3 ls "s3://$BACKUP_S3_BUCKET/$ENVIRONMENT/" | while read -r line; do
        local backup_date=$(echo "$line" | awk '{print $2}' | cut -d'_' -f1)
        if [[ "$backup_date" < "$cutoff_date" ]]; then
            local backup_path=$(echo "$line" | awk '{print $2}')
            log_info "Deleting old backup: $backup_path"
            aws s3 rm "s3://$BACKUP_S3_BUCKET/$ENVIRONMENT/$backup_path" --recursive
        fi
    done
    
    log_success "Old backups cleaned up"
}

# Verify backup integrity
verify_backup() {
    local backup_dir=$1
    
    log_info "Verifying backup integrity..."
    
    local verification_failed=false
    
    # Check database backup
    if [ -f "$backup_dir/database_$TIMESTAMP.sql.gz" ]; then
        if gzip -t "$backup_dir/database_$TIMESTAMP.sql.gz"; then
            log_success "Database backup integrity verified"
        else
            log_error "Database backup is corrupted"
            verification_failed=true
        fi
    fi
    
    # Check application backup
    if [ -f "$backup_dir/application_$TIMESTAMP.tar.gz" ]; then
        if tar -tzf "$backup_dir/application_$TIMESTAMP.tar.gz" > /dev/null; then
            log_success "Application backup integrity verified"
        else
            log_error "Application backup is corrupted"
            verification_failed=true
        fi
    fi
    
    if [ "$verification_failed" = true ]; then
        log_error "Backup verification failed"
        exit 1
    fi
    
    log_success "All backups verified successfully"
}

# Send notification
send_notification() {
    local status=$1
    local backup_dir=$2
    
    if [ -n "$BACKUP_NOTIFICATION_WEBHOOK" ]; then
        local backup_size=$(du -sh "$backup_dir" | cut -f1)
        local message
        
        if [ "$status" = "success" ]; then
            message="✅ Backup completed successfully for $ENVIRONMENT environment (Size: $backup_size)"
        else
            message="❌ Backup failed for $ENVIRONMENT environment"
        fi
        
        curl -X POST "$BACKUP_NOTIFICATION_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"$message\"}" \
            > /dev/null 2>&1 || true
    fi
}

# Main backup function
main() {
    log_info "Starting backup for $ENVIRONMENT environment (type: $BACKUP_TYPE)"
    
    # Load environment configuration
    load_environment
    
    # Validate backup configuration
    validate_backup_config
    
    # Create backup directory
    local backup_dir=$(create_backup_dir)
    
    # Perform backups based on type
    case $BACKUP_TYPE in
        full)
            backup_database "$backup_dir"
            backup_redis "$backup_dir"
            backup_application "$backup_dir"
            backup_logs "$backup_dir"
            ;;
        database)
            backup_database "$backup_dir"
            ;;
        incremental)
            backup_database "$backup_dir"
            backup_logs "$backup_dir"
            ;;
        *)
            log_error "Invalid backup type: $BACKUP_TYPE"
            log_error "Valid types: full, database, incremental"
            exit 1
            ;;
    esac
    
    # Verify backup integrity
    verify_backup "$backup_dir"
    
    # Upload to S3
    upload_to_s3 "$backup_dir"
    
    # Cleanup old backups
    cleanup_old_backups
    
    # Send success notification
    send_notification "success" "$backup_dir"
    
    # Cleanup local backup directory
    rm -rf "$backup_dir"
    
    log_success "Backup completed successfully!"
    log_info "Backup location: s3://$BACKUP_S3_BUCKET/$ENVIRONMENT/$TIMESTAMP"
}

# Trap errors and send failure notification
trap 'send_notification "failure" "$backup_dir"; exit 1' ERR

# Run main function
main "$@"