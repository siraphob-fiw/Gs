# StrengthOS API Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the StrengthOS API across different environments using various deployment methods including Docker Compose and Kubernetes.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Docker Deployment](#docker-deployment)
4. [Kubernetes Deployment](#kubernetes-deployment)
5. [Database Setup](#database-setup)
6. [Monitoring and Logging](#monitoring-and-logging)
7. [Backup and Recovery](#backup-and-recovery)
8. [Troubleshooting](#troubleshooting)
9. [Security Considerations](#security-considerations)
10. [Performance Tuning](#performance-tuning)

## Prerequisites

### System Requirements

#### Minimum Requirements
- **CPU**: 2 cores
- **Memory**: 4GB RAM
- **Storage**: 20GB available space
- **Network**: Stable internet connection

#### Recommended Requirements (Production)
- **CPU**: 4+ cores
- **Memory**: 8GB+ RAM
- **Storage**: 100GB+ SSD
- **Network**: High-speed internet with low latency

### Software Dependencies

#### Required Software
- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **Docker**: v20.0.0 or higher
- **Docker Compose**: v2.0.0 or higher

#### Optional Software (for Kubernetes)
- **kubectl**: Latest stable version
- **Helm**: v3.0.0 or higher
- **AWS CLI**: v2.0.0 or higher (for AWS deployments)

#### Database Requirements
- **PostgreSQL**: v13.0 or higher
- **Redis**: v6.0 or higher

### External Services

#### Required Services
- **Database**: PostgreSQL instance
- **Cache**: Redis instance
- **Email**: SendGrid account (or SMTP server)
- **Storage**: AWS S3 bucket (or compatible storage)

#### Optional Services
- **Monitoring**: Sentry, New Relic, or Datadog account
- **Payment**: Stripe account
- **SSL**: SSL certificate for HTTPS

## Environment Configuration

### Environment Files

Create environment-specific configuration files:

#### Development Environment
```bash
cp config/development.env .env.development
# Edit .env.development with your development settings
```

#### Staging Environment
```bash
cp config/staging.env .env.staging
# Edit .env.staging with your staging settings
```

#### Production Environment
```bash
cp config/production.env .env.production
# Edit .env.production with your production settings
```

### Required Environment Variables

#### Database Configuration
```bash
DATABASE_URL=postgresql://username:password@host:port/database
DATABASE_SSL=true
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20
```

#### Redis Configuration
```bash
REDIS_URL=redis://host:port
REDIS_PASSWORD=your-redis-password
REDIS_DB=0
```

#### Security Configuration
```bash
JWT_SECRET=your-super-secure-jwt-secret
JWT_REFRESH_SECRET=your-super-secure-refresh-secret
BCRYPT_ROUNDS=12
```

#### External Services
```bash
SENDGRID_API_KEY=your-sendgrid-api-key
STRIPE_SECRET_KEY=your-stripe-secret-key
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=your-s3-bucket
```

## Docker Deployment

### Development Deployment

#### 1. Build and Start Services
```bash
# Build the application
npm run build

# Start services with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f api
```

#### 2. Run Database Migrations
```bash
# Run migrations
docker-compose exec api npm run migration:run

# Seed database (optional)
docker-compose exec api npm run seed:run
```

#### 3. Verify Deployment
```bash
# Check service health
curl http://localhost:3000/api/v1/health

# Access API documentation
open http://localhost:3000/api/docs
```

### Staging Deployment

#### 1. Prepare Environment
```bash
# Copy and configure staging environment
cp config/staging.env .env.staging
# Edit .env.staging with staging-specific values
```

#### 2. Deploy with Docker Compose
```bash
# Deploy staging environment
docker-compose -f docker-compose.staging.yml up -d

# Run health check
./scripts/health-check.sh staging
```

### Production Deployment

#### 1. Prepare Environment
```bash
# Copy and configure production environment
cp config/production.env .env.production
# Edit .env.production with production values
```

#### 2. Deploy with Docker Compose
```bash
# Deploy production environment
docker-compose -f docker-compose.production.yml up -d

# Run comprehensive health check
./scripts/health-check.sh production
```

#### 3. Set Up SSL/TLS
```bash
# Copy SSL certificates
sudo cp /path/to/your/cert.pem /etc/ssl/certs/strengthos.crt
sudo cp /path/to/your/key.pem /etc/ssl/private/strengthos.key

# Update permissions
sudo chmod 644 /etc/ssl/certs/strengthos.crt
sudo chmod 600 /etc/ssl/private/strengthos.key
```

## Kubernetes Deployment

### Prerequisites

#### 1. Cluster Setup
```bash
# Verify kubectl connection
kubectl cluster-info

# Create namespaces
kubectl apply -f k8s/namespace.yaml
```

#### 2. Configure Secrets
```bash
# Update secrets with your values
kubectl apply -f k8s/secret.yaml

# Verify secrets
kubectl get secrets -n strengthos-production
```

### Deployment Steps

#### 1. Deploy Configuration
```bash
# Apply ConfigMaps
kubectl apply -f k8s/configmap.yaml

# Apply Service Account (if needed)
kubectl apply -f k8s/serviceaccount.yaml
```

#### 2. Deploy Application
```bash
# Deploy the application
kubectl apply -f k8s/deployment.yaml

# Deploy services
kubectl apply -f k8s/service.yaml

# Deploy ingress (if using)
kubectl apply -f k8s/ingress.yaml
```

#### 3. Verify Deployment
```bash
# Check pod status
kubectl get pods -n strengthos-production

# Check service status
kubectl get services -n strengthos-production

# View logs
kubectl logs -f deployment/sos-web-api -n strengthos-production
```

### Helm Deployment (Recommended)

#### 1. Install Helm Chart
```bash
# Add Helm repository (if using external chart)
helm repo add strengthos https://charts.strengthos.com

# Install with custom values
helm install sos-web-api ./helm/strengthos-api \
  --namespace strengthos-production \
  --create-namespace \
  --values helm/values-production.yaml
```

#### 2. Upgrade Deployment
```bash
# Upgrade to new version
helm upgrade sos-web-api ./helm/strengthos-api \
  --namespace strengthos-production \
  --values helm/values-production.yaml \
  --set image.tag=v1.1.0
```

## Database Setup

### Initial Setup

#### 1. Create Database
```sql
-- Connect to PostgreSQL as superuser
CREATE DATABASE strengthos_prod;
CREATE USER strengthos_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE strengthos_prod TO strengthos_user;

-- Enable required extensions
\c strengthos_prod
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

#### 2. Run Migrations
```bash
# Using npm scripts
npm run migration:run

# Using Docker
docker-compose exec api npm run migration:run

# Using kubectl
kubectl exec -it deployment/sos-web-api -n strengthos-production -- npm run migration:run
```

### Database Maintenance

#### Backup Database
```bash
# Manual backup
./scripts/backup.sh production database

# Automated backup (cron job)
0 2 * * * /path/to/scripts/backup.sh production full
```

#### Restore Database
```bash
# Restore from backup
pg_restore -h localhost -U strengthos_user -d strengthos_prod backup.sql
```

## Monitoring and Logging

### Application Monitoring

#### Health Checks
```bash
# Basic health check
curl https://api.strengthos.com/api/v1/health

# Detailed health check
curl https://api.strengthos.com/api/v1/health/detailed
```

#### Metrics Collection
```bash
# Prometheus metrics
curl https://api.strengthos.com/metrics

# Custom metrics endpoint
curl https://api.strengthos.com/api/v1/monitoring/metrics
```

### Log Management

#### Docker Logs
```bash
# View application logs
docker-compose logs -f api

# View specific service logs
docker-compose logs -f postgres redis
```

#### Kubernetes Logs
```bash
# View pod logs
kubectl logs -f deployment/sos-web-api -n strengthos-production

# View logs from all pods
kubectl logs -f -l app=sos-web-api -n strengthos-production
```

#### Centralized Logging
```bash
# Configure log shipping to external service
# Update monitoring configuration in environment files
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
NEW_RELIC_LICENSE_KEY=your-newrelic-license-key
DATADOG_API_KEY=your-datadog-api-key
```

## Backup and Recovery

### Automated Backups

#### Configure Backup Schedule
```bash
# Add to crontab for automated backups
crontab -e

# Add the following line for daily backups at 2 AM
0 2 * * * /path/to/sos-web-api/scripts/backup.sh production full
```

#### Backup Types
- **Full Backup**: Database, Redis, application files, and logs
- **Database Backup**: Database only
- **Incremental Backup**: Database and recent logs

### Recovery Procedures

#### Database Recovery
```bash
# Stop application
docker-compose stop api

# Restore database
pg_restore -h localhost -U strengthos_user -d strengthos_prod backup.sql

# Start application
docker-compose start api
```

#### Complete System Recovery
```bash
# Download backup from S3
aws s3 cp s3://strengthos-prod-backups/production/20240101_020000/ ./restore/ --recursive

# Restore database
pg_restore -h localhost -U strengthos_user -d strengthos_prod restore/database_20240101_020000.sql

# Restore Redis (if needed)
redis-cli --rdb restore/redis_20240101_020000.rdb

# Restart services
docker-compose restart
```

## Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check logs for errors
docker-compose logs api

# Verify environment variables
docker-compose exec api env | grep -E "(DATABASE|REDIS|JWT)"

# Test database connection
docker-compose exec api npm run db:test
```

#### Database Connection Issues
```bash
# Test database connectivity
pg_isready -h localhost -p 5432 -U strengthos_user

# Check database logs
docker-compose logs postgres

# Verify connection string
echo $DATABASE_URL
```

#### Redis Connection Issues
```bash
# Test Redis connectivity
redis-cli -h localhost -p 6379 ping

# Check Redis logs
docker-compose logs redis

# Verify Redis configuration
redis-cli config get "*"
```

#### Performance Issues
```bash
# Check resource usage
docker stats

# Monitor API response times
curl -w "@curl-format.txt" -o /dev/null -s https://api.strengthos.com/api/v1/health

# Check database performance
docker-compose exec postgres psql -U strengthos_user -d strengthos_prod -c "SELECT * FROM pg_stat_activity;"
```

### Debug Mode

#### Enable Debug Logging
```bash
# Update environment variable
LOG_LEVEL=debug

# Restart application
docker-compose restart api
```

#### Access Debug Information
```bash
# View detailed logs
docker-compose logs -f api | grep DEBUG

# Access debug endpoints (development only)
curl http://localhost:3000/api/v1/debug/info
```

## Security Considerations

### SSL/TLS Configuration

#### Certificate Management
```bash
# Generate self-signed certificate (development only)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout strengthos.key -out strengthos.crt

# Use Let's Encrypt for production
certbot certonly --standalone -d api.strengthos.com
```

#### Security Headers
```nginx
# Nginx configuration for security headers
add_header X-Content-Type-Options nosniff;
add_header X-Frame-Options DENY;
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
```

### Access Control

#### Firewall Configuration
```bash
# Allow only necessary ports
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

#### Network Security
```bash
# Configure Docker network isolation
docker network create --driver bridge strengthos-network

# Use private subnets in Kubernetes
# Configure network policies for pod-to-pod communication
```

### Secrets Management

#### Kubernetes Secrets
```bash
# Create secrets from files
kubectl create secret generic sos-web-api-secrets \
  --from-env-file=.env.production \
  --namespace=strengthos-production

# Use external secret management (recommended)
# Configure integration with AWS Secrets Manager, HashiCorp Vault, etc.
```

## Performance Tuning

### Application Optimization

#### Node.js Configuration
```bash
# Optimize Node.js settings
NODE_OPTIONS="--max-old-space-size=2048 --optimize-for-size"

# Enable clustering
CLUSTER_ENABLED=true
CLUSTER_WORKERS=0  # Auto-detect CPU cores
```

#### Database Optimization
```sql
-- Optimize PostgreSQL settings
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
SELECT pg_reload_conf();
```

#### Redis Optimization
```bash
# Configure Redis for performance
redis-cli config set maxmemory 512mb
redis-cli config set maxmemory-policy allkeys-lru
redis-cli config set save "900 1 300 10 60 10000"
```

### Infrastructure Scaling

#### Horizontal Scaling (Kubernetes)
```yaml
# Configure Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: sos-web-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: sos-web-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

#### Load Balancing
```bash
# Configure load balancer health checks
# Set appropriate timeouts and retry policies
# Implement circuit breaker patterns
```

### Monitoring and Alerting

#### Set Up Alerts
```yaml
# Prometheus alerting rules
groups:
- name: sos-web-api
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 5m
    annotations:
      summary: High error rate detected
  - alert: HighResponseTime
    expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
    for: 5m
    annotations:
      summary: High response time detected
```

## Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Database migrations tested
- [ ] External services configured
- [ ] Backup strategy implemented
- [ ] Monitoring configured

### Deployment
- [ ] Application deployed successfully
- [ ] Health checks passing
- [ ] Database connectivity verified
- [ ] Redis connectivity verified
- [ ] External services accessible
- [ ] SSL/TLS working correctly

### Post-Deployment
- [ ] Performance monitoring active
- [ ] Log aggregation working
- [ ] Backup jobs scheduled
- [ ] Alerts configured
- [ ] Documentation updated
- [ ] Team notified

## Support and Maintenance

### Regular Maintenance Tasks

#### Daily
- Monitor application health and performance
- Check error logs for issues
- Verify backup completion

#### Weekly
- Review performance metrics
- Update dependencies (security patches)
- Clean up old logs and temporary files

#### Monthly
- Review and rotate secrets
- Update SSL certificates (if needed)
- Performance optimization review
- Disaster recovery testing

### Getting Help

#### Internal Resources
- Check application logs and metrics
- Review this deployment guide
- Consult API documentation

#### External Support
- GitHub Issues: Report bugs and feature requests
- Email Support: api-support@strengthos.com
- Community Discord: StrengthOS Developer Community

---

**Last Updated**: January 2024
**Version**: 1.0.0