# StrengthOS API Usage Guide

## Overview

The StrengthOS API is a comprehensive REST API that provides access to all platform functionality including user management, authentication, tenant management, coach-athlete relationships, notifications, payments, and subscriptions.

## Base URL

- **Development**: `http://localhost:3000/api/v1`
- **Staging**: `https://api-staging.strengthos.com/api/v1`
- **Production**: `https://api.strengthos.com/api/v1`

## Authentication

### JWT Bearer Token Authentication

All API endpoints (except public endpoints like health checks) require authentication using JWT Bearer tokens.

#### Getting an Authentication Token

```bash
# Login to get JWT token
curl -X POST \
  http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "user@example.com",
    "password": "your-password"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

#### Using the Token

Include the JWT token in the Authorization header for all authenticated requests:

```bash
curl -X GET \
  http://localhost:3000/api/v1/users/profile \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

### Token Refresh

When your access token expires, use the refresh token to get a new one:

```bash
curl -X POST \
  http://localhost:3000/api/v1/auth/refresh \
  -H 'Content-Type: application/json' \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

## Multi-Tenancy

The StrengthOS API supports multi-tenancy. Most operations are performed within a tenant context.

### Tenant Context

The tenant context is automatically determined from your JWT token. Each user belongs to one or more tenants, and the API operations are scoped to the appropriate tenant.

### Switching Tenant Context

If you have access to multiple tenants, you can switch context:

```bash
curl -X POST \
  http://localhost:3000/api/v1/tenants/switch \
  -H 'Authorization: Bearer your-jwt-token' \
  -H 'Content-Type: application/json' \
  -d '{
    "tenantId": "tenant-456"
  }'
```

## Rate Limiting

The API implements rate limiting to ensure fair usage and system stability.

### Rate Limit Headers

All responses include rate limit information in headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Rate Limit Exceeded

When rate limits are exceeded, you'll receive a 429 status code:

```json
{
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too Many Requests",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/endpoint"
}
```

## Pagination

List endpoints support pagination using query parameters.

### Pagination Parameters

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

### Example

```bash
curl -X GET \
  'http://localhost:3000/api/v1/users?page=2&limit=20' \
  -H 'Authorization: Bearer your-jwt-token'
```

### Pagination Response

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 2,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrevious": true
    }
  }
}
```

## Filtering and Sorting

Many list endpoints support filtering and sorting.

### Sorting

Use `sortBy` and `sortOrder` parameters:

```bash
curl -X GET \
  'http://localhost:3000/api/v1/users?sortBy=createdAt&sortOrder=desc' \
  -H 'Authorization: Bearer your-jwt-token'
```

### Filtering

Use field names as query parameters:

```bash
curl -X GET \
  'http://localhost:3000/api/v1/users?status=active&role=coach' \
  -H 'Authorization: Bearer your-jwt-token'
```

## Error Handling

The API uses standard HTTP status codes and returns consistent error responses.

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/endpoint",
  "traceId": "trace-123",
  "details": ["Field is required", "Invalid format"]
}
```

### Common Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (resource already exists)
- `422`: Unprocessable Entity (business logic error)
- `429`: Too Many Requests (rate limit exceeded)
- `500`: Internal Server Error

## Request/Response Headers

### Required Headers

- `Content-Type: application/json` (for POST/PUT/PATCH requests)
- `Authorization: Bearer <token>` (for authenticated endpoints)

### Optional Headers

- `X-Correlation-ID`: Custom correlation ID for request tracking
- `X-Tenant-ID`: Override tenant context (if permitted)

### Response Headers

- `X-Correlation-ID`: Request correlation ID
- `X-Response-Time`: Response time in milliseconds
- `X-RateLimit-*`: Rate limiting information

## Data Formats

### Date/Time Format

All dates and times are in ISO 8601 format with UTC timezone:

```json
{
  "createdAt": "2024-01-01T12:00:00.000Z",
  "updatedAt": "2024-01-01T12:30:00.000Z"
}
```

### UUID Format

All IDs use UUID v4 format:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Currency Format

Currency amounts are represented as integers in the smallest currency unit (cents):

```json
{
  "amount": 2500,  // $25.00
  "currency": "USD"
}
```

## Common Workflows

### User Registration and Login

1. **Register a new user**:
```bash
curl -X POST \
  http://localhost:3000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePassword123!",
    "firstName": "Jane",
    "lastName": "Smith",
    "tenantId": "tenant-123"
  }'
```

2. **Login**:
```bash
curl -X POST \
  http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePassword123!"
  }'
```

3. **Get user profile**:
```bash
curl -X GET \
  http://localhost:3000/api/v1/users/profile \
  -H 'Authorization: Bearer your-jwt-token'
```

### Coach-Athlete Relationship Management

1. **Create coach-athlete relationship**:
```bash
curl -X POST \
  http://localhost:3000/api/v1/coach-athlete/relationships \
  -H 'Authorization: Bearer your-jwt-token' \
  -H 'Content-Type: application/json' \
  -d '{
    "coachId": "coach-123",
    "athleteId": "athlete-456",
    "startDate": "2024-01-01T00:00:00.000Z"
  }'
```

2. **List coach's athletes**:
```bash
curl -X GET \
  'http://localhost:3000/api/v1/coach-athlete/relationships?coachId=coach-123' \
  -H 'Authorization: Bearer your-jwt-token'
```

### Notification Management

1. **Send notification**:
```bash
curl -X POST \
  http://localhost:3000/api/v1/notifications \
  -H 'Authorization: Bearer your-jwt-token' \
  -H 'Content-Type: application/json' \
  -d '{
    "recipientId": "user-123",
    "type": "email",
    "templateId": "welcome-template",
    "data": {
      "firstName": "John",
      "loginUrl": "https://app.strengthos.com/login"
    }
  }'
```

2. **Get notification status**:
```bash
curl -X GET \
  http://localhost:3000/api/v1/notifications/notification-123/status \
  -H 'Authorization: Bearer your-jwt-token'
```

### Payment Processing

1. **Create payment**:
```bash
curl -X POST \
  http://localhost:3000/api/v1/payments \
  -H 'Authorization: Bearer your-jwt-token' \
  -H 'Content-Type: application/json' \
  -d '{
    "amount": 2500,
    "currency": "USD",
    "paymentMethodId": "pm_123",
    "description": "Monthly subscription"
  }'
```

2. **Get payment status**:
```bash
curl -X GET \
  http://localhost:3000/api/v1/payments/payment-123 \
  -H 'Authorization: Bearer your-jwt-token'
```

## SDK and Client Libraries

### JavaScript/TypeScript SDK

```typescript
import { StrengthOSClient } from '@strengthos/api-client';

const client = new StrengthOSClient({
  baseUrl: 'https://api.strengthos.com/api/v1',
  apiKey: 'your-api-key'
});

// Login
const { accessToken } = await client.auth.login({
  email: 'user@example.com',
  password: 'password'
});

// Set token for subsequent requests
client.setAccessToken(accessToken);

// Get user profile
const profile = await client.users.getProfile();
```

### Python SDK

```python
from strengthos_client import StrengthOSClient

client = StrengthOSClient(
    base_url='https://api.strengthos.com/api/v1',
    api_key='your-api-key'
)

# Login
response = client.auth.login(
    email='user@example.com',
    password='password'
)

# Set token for subsequent requests
client.set_access_token(response['accessToken'])

# Get user profile
profile = client.users.get_profile()
```

## Testing and Development

### Health Check

Use the health check endpoint to verify API availability:

```bash
curl -X GET http://localhost:3000/api/v1/health
```

Response:
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "cache": { "status": "up" },
    "memory": { "status": "up" }
  },
  "error": {},
  "details": {
    "database": { "status": "up" },
    "cache": { "status": "up" },
    "memory": { "status": "up" }
  }
}
```

### API Documentation

Interactive API documentation is available at:
- **Development**: `http://localhost:3000/api/docs`
- **Staging**: `https://api-staging.strengthos.com/api/docs`
- **Production**: `https://api.strengthos.com/api/docs`

## Support and Resources

- **API Documentation**: Available at `/api/docs`
- **Support Email**: support@strengthos.com
- **Developer Portal**: https://developers.strengthos.com
- **Status Page**: https://status.strengthos.com
- **GitHub Repository**: https://github.com/strengthos/api

## Changelog

### Version 1.0.0
- Initial API release
- User management and authentication
- Multi-tenant support
- Coach-athlete relationships
- Notification system
- Payment processing
- Subscription management