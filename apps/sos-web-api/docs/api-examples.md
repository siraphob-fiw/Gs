# API Examples and Use Cases

## Overview

This document provides comprehensive examples of common API usage patterns and real-world use cases for the StrengthOS API.

## Table of Contents

1. [User Management Examples](#user-management-examples)
2. [Authentication Examples](#authentication-examples)
3. [Coach-Athlete Relationship Examples](#coach-athlete-relationship-examples)
4. [Notification Examples](#notification-examples)
5. [Payment and Subscription Examples](#payment-and-subscription-examples)
6. [Tenant Management Examples](#tenant-management-examples)
7. [Advanced Use Cases](#advanced-use-cases)
8. [Error Handling Examples](#error-handling-examples)

## User Management Examples

### Create a New User

```bash
curl -X POST \
  http://localhost:3000/api/v1/users \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "athlete@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "athlete",
    "phoneNumber": "+1234567890",
    "dateOfBirth": "1990-05-15",
    "preferences": {
      "notifications": {
        "email": true,
        "sms": false,
        "push": true
      },
      "timezone": "America/New_York"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-456",
    "email": "athlete@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "athlete",
    "status": "active",
    "tenantId": "tenant-123",
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### Update User Profile

```bash
curl -X PUT \
  http://localhost:3000/api/v1/users/user-456 \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json' \
  -d '{
    "firstName": "Jane",
    "lastName": "Johnson",
    "phoneNumber": "+1234567891",
    "preferences": {
      "notifications": {
        "email": true,
        "sms": true,
        "push": true
      }
    }
  }'
```

### Search Users with Filters

```bash
curl -X GET \
  'http://localhost:3000/api/v1/users?role=athlete&status=active&page=1&limit=20&sortBy=createdAt&sortOrder=desc' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "user-456",
        "email": "athlete@example.com",
        "firstName": "Jane",
        "lastName": "Johnson",
        "role": "athlete",
        "status": "active",
        "createdAt": "2024-01-01T12:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1,
      "hasNext": false,
      "hasPrevious": false
    }
  }
}
```

## Authentication Examples

### Complete Authentication Flow

#### 1. User Registration
```bash
curl -X POST \
  http://localhost:3000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "newcoach@example.com",
    "password": "SecurePassword123!",
    "firstName": "Mike",
    "lastName": "Wilson",
    "role": "coach",
    "tenantId": "tenant-123"
  }'
```

#### 2. Email Verification
```bash
curl -X POST \
  http://localhost:3000/api/v1/auth/verify-email \
  -H 'Content-Type: application/json' \
  -d '{
    "token": "verification-token-from-email"
  }'
```

#### 3. Login
```bash
curl -X POST \
  http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "newcoach@example.com",
    "password": "SecurePassword123!"
  }'
```

#### 4. Access Protected Resource
```bash
curl -X GET \
  http://localhost:3000/api/v1/users/profile \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

#### 5. Refresh Token
```bash
curl -X POST \
  http://localhost:3000/api/v1/auth/refresh \
  -H 'Content-Type: application/json' \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

### Password Reset Flow

#### 1. Request Password Reset
```bash
curl -X POST \
  http://localhost:3000/api/v1/auth/forgot-password \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "newcoach@example.com"
  }'
```

#### 2. Reset Password
```bash
curl -X POST \
  http://localhost:3000/api/v1/auth/reset-password \
  -H 'Content-Type: application/json' \
  -d '{
    "token": "reset-token-from-email",
    "newPassword": "NewSecurePassword456!"
  }'
```

## Coach-Athlete Relationship Examples

### Create Coach-Athlete Relationship

```bash
curl -X POST \
  http://localhost:3000/api/v1/coach-athlete/relationships \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json' \
  -d '{
    "coachId": "coach-123",
    "athleteId": "athlete-456",
    "startDate": "2024-01-01T00:00:00.000Z",
    "notes": "New athlete onboarding",
    "goals": [
      "Increase strength",
      "Improve technique",
      "Prepare for competition"
    ]
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "relationship-789",
    "coachId": "coach-123",
    "athleteId": "athlete-456",
    "status": "active",
    "startDate": "2024-01-01T00:00:00.000Z",
    "notes": "New athlete onboarding",
    "goals": [
      "Increase strength",
      "Improve technique",
      "Prepare for competition"
    ],
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### List Coach's Athletes

```bash
curl -X GET \
  'http://localhost:3000/api/v1/coach-athlete/relationships?coachId=coach-123&status=active' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

### Request Coach Transition

```bash
curl -X POST \
  http://localhost:3000/api/v1/coach-athlete/transitions \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json' \
  -d '{
    "athleteId": "athlete-456",
    "currentCoachId": "coach-123",
    "newCoachId": "coach-789",
    "reason": "Specialization change",
    "requestedDate": "2024-02-01T00:00:00.000Z"
  }'
```

### Approve Coach Transition

```bash
curl -X PUT \
  http://localhost:3000/api/v1/coach-athlete/transitions/transition-123/approve \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json' \
  -d '{
    "notes": "Approved for specialization training"
  }'
```

## Notification Examples

### Send Email Notification

```bash
curl -X POST \
  http://localhost:3000/api/v1/notifications \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json' \
  -d '{
    "recipientId": "user-456",
    "type": "email",
    "templateId": "workout-reminder",
    "data": {
      "athleteName": "Jane Johnson",
      "workoutDate": "2024-01-02",
      "workoutTime": "10:00 AM",
      "coachName": "Mike Wilson"
    },
    "scheduledFor": "2024-01-02T08:00:00.000Z"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "notification-123",
    "recipientId": "user-456",
    "type": "email",
    "status": "scheduled",
    "scheduledFor": "2024-01-02T08:00:00.000Z",
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### Send Push Notification

```bash
curl -X POST \
  http://localhost:3000/api/v1/notifications \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json' \
  -d '{
    "recipientId": "user-456",
    "type": "push",
    "title": "Workout Reminder",
    "message": "Your workout with Mike Wilson starts in 30 minutes!",
    "data": {
      "workoutId": "workout-789",
      "deepLink": "/workouts/workout-789"
    }
  }'
```

### Create Notification Template

```bash
curl -X POST \
  http://localhost:3000/api/v1/notifications/templates \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "progress-update",
    "type": "email",
    "subject": "Progress Update - {{athleteName}}",
    "body": "Hi {{coachName}},\n\n{{athleteName}} has completed their workout and logged the following progress:\n\n{{progressDetails}}\n\nBest regards,\nStrengthOS Team",
    "variables": [
      "athleteName",
      "coachName",
      "progressDetails"
    ]
  }'
```

### Get Notification Status

```bash
curl -X GET \
  http://localhost:3000/api/v1/notifications/notification-123/status \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "notification-123",
    "status": "delivered",
    "deliveredAt": "2024-01-02T08:00:15.000Z",
    "attempts": 1,
    "lastAttemptAt": "2024-01-02T08:00:15.000Z",
    "deliveryDetails": {
      "provider": "sendgrid",
      "messageId": "msg-456",
      "opened": true,
      "openedAt": "2024-01-02T08:05:30.000Z"
    }
  }
}
```

## Payment and Subscription Examples

### Create Payment Method

```bash
curl -X POST \
  http://localhost:3000/api/v1/payments/methods \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "card",
    "cardToken": "tok_visa_4242",
    "isDefault": true,
    "billingAddress": {
      "line1": "123 Main St",
      "city": "New York",
      "state": "NY",
      "postalCode": "10001",
      "country": "US"
    }
  }'
```

### Process Payment

```bash
curl -X POST \
  http://localhost:3000/api/v1/payments \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json' \
  -d '{
    "amount": 2500,
    "currency": "USD",
    "paymentMethodId": "pm_123",
    "description": "Monthly subscription - January 2024",
    "metadata": {
      "subscriptionId": "sub_456",
      "userId": "user-456"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "payment-789",
    "amount": 2500,
    "currency": "USD",
    "status": "succeeded",
    "paymentMethodId": "pm_123",
    "description": "Monthly subscription - January 2024",
    "createdAt": "2024-01-01T12:00:00.000Z",
    "processedAt": "2024-01-01T12:00:05.000Z"
  }
}
```

### Create Subscription

```bash
curl -X POST \
  http://localhost:3000/api/v1/subscriptions \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json' \
  -d '{
    "planId": "plan_premium",
    "paymentMethodId": "pm_123",
    "trialDays": 14,
    "metadata": {
      "source": "web_signup",
      "campaign": "winter_promotion"
    }
  }'
```

### Update Subscription

```bash
curl -X PUT \
  http://localhost:3000/api/v1/subscriptions/sub_456 \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json' \
  -d '{
    "planId": "plan_enterprise",
    "prorationBehavior": "create_prorations"
  }'
```

### Cancel Subscription

```bash
curl -X DELETE \
  http://localhost:3000/api/v1/subscriptions/sub_456 \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json' \
  -d '{
    "cancelAtPeriodEnd": true,
    "reason": "customer_request"
  }'
```

## Tenant Management Examples

### Create New Tenant

```bash
curl -X POST \
  http://localhost:3000/api/v1/tenants \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Elite Fitness Gym",
    "domain": "elitefitness",
    "settings": {
      "timezone": "America/New_York",
      "currency": "USD",
      "features": {
        "payments": true,
        "notifications": true,
        "analytics": true
      }
    },
    "adminUser": {
      "email": "admin@elitefitness.com",
      "firstName": "John",
      "lastName": "Admin",
      "password": "SecurePassword123!"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "tenant-789",
    "name": "Elite Fitness Gym",
    "domain": "elitefitness",
    "status": "active",
    "settings": {
      "timezone": "America/New_York",
      "currency": "USD",
      "features": {
        "payments": true,
        "notifications": true,
        "analytics": true
      }
    },
    "createdAt": "2024-01-01T12:00:00.000Z",
    "adminUser": {
      "id": "user-admin-123",
      "email": "admin@elitefitness.com",
      "role": "tenant_admin"
    }
  }
}
```

### Update Tenant Settings

```bash
curl -X PUT \
  http://localhost:3000/api/v1/tenants/tenant-789/settings \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json' \
  -d '{
    "timezone": "America/Los_Angeles",
    "features": {
      "payments": true,
      "notifications": true,
      "analytics": true,
      "advanced_reporting": true
    },
    "branding": {
      "primaryColor": "#007bff",
      "logo": "https://cdn.elitefitness.com/logo.png"
    }
  }'
```

### Switch Tenant Context

```bash
curl -X POST \
  http://localhost:3000/api/v1/tenants/switch \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json' \
  -d '{
    "tenantId": "tenant-789"
  }'
```

## Advanced Use Cases

### Bulk User Import

```bash
curl -X POST \
  http://localhost:3000/api/v1/users/bulk-import \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json' \
  -d '{
    "users": [
      {
        "email": "athlete1@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "athlete"
      },
      {
        "email": "athlete2@example.com",
        "firstName": "Jane",
        "lastName": "Smith",
        "role": "athlete"
      }
    ],
    "sendWelcomeEmail": true,
    "requirePasswordReset": true
  }'
```

### Analytics and Reporting

```bash
curl -X GET \
  'http://localhost:3000/api/v1/analytics/user-activity?startDate=2024-01-01&endDate=2024-01-31&groupBy=day' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "metrics": [
      {
        "date": "2024-01-01",
        "activeUsers": 150,
        "newRegistrations": 12,
        "workoutsCompleted": 89
      },
      {
        "date": "2024-01-02",
        "activeUsers": 165,
        "newRegistrations": 8,
        "workoutsCompleted": 102
      }
    ],
    "summary": {
      "totalActiveUsers": 1250,
      "totalNewRegistrations": 245,
      "totalWorkoutsCompleted": 2890,
      "averageDailyActive": 158
    }
  }
}
```

### Webhook Configuration

```bash
curl -X POST \
  http://localhost:3000/api/v1/webhooks \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://your-app.com/webhooks/strengthos",
    "events": [
      "user.created",
      "payment.succeeded",
      "subscription.updated"
    ],
    "secret": "your-webhook-secret"
  }'
```

### File Upload

```bash
curl -X POST \
  http://localhost:3000/api/v1/files/upload \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -F 'file=@profile-picture.jpg' \
  -F 'type=profile_picture' \
  -F 'userId=user-456'
```

## Error Handling Examples

### Validation Error

**Request:**
```bash
curl -X POST \
  http://localhost:3000/api/v1/users \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "invalid-email",
    "firstName": "",
    "role": "invalid_role"
  }'
```

**Response:**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "path": "/api/v1/users",
  "details": [
    "email must be a valid email address",
    "firstName should not be empty",
    "role must be one of: athlete, coach, admin"
  ]
}
```

### Resource Not Found

**Request:**
```bash
curl -X GET \
  http://localhost:3000/api/v1/users/non-existent-user \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**Response:**
```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "path": "/api/v1/users/non-existent-user"
}
```

### Rate Limit Exceeded

**Response:**
```json
{
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too Many Requests",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "path": "/api/v1/auth/login",
  "retryAfter": 900
}
```

### Insufficient Permissions

**Response:**
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions to access this resource",
  "error": "Forbidden",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "path": "/api/v1/admin/users",
  "requiredPermissions": ["manage:users"],
  "userPermissions": ["read:users"]
}
```

## SDK Usage Examples

### JavaScript/TypeScript SDK

```typescript
import { StrengthOSClient } from '@strengthos/api-client';

const client = new StrengthOSClient({
  baseUrl: 'https://api.strengthos.com/api/v1',
  apiKey: 'your-api-key'
});

// Authentication
const { accessToken, user } = await client.auth.login({
  email: 'coach@example.com',
  password: 'password'
});

client.setAccessToken(accessToken);

// Create coach-athlete relationship
const relationship = await client.coachAthlete.createRelationship({
  coachId: user.id,
  athleteId: 'athlete-123',
  startDate: new Date().toISOString()
});

// Send notification
await client.notifications.send({
  recipientId: 'athlete-123',
  type: 'email',
  templateId: 'workout-reminder',
  data: {
    athleteName: 'John Doe',
    workoutDate: '2024-01-02'
  }
});

// Process payment
const payment = await client.payments.create({
  amount: 2500,
  currency: 'USD',
  paymentMethodId: 'pm_123',
  description: 'Monthly subscription'
});
```

### Python SDK

```python
from strengthos_client import StrengthOSClient

client = StrengthOSClient(
    base_url='https://api.strengthos.com/api/v1',
    api_key='your-api-key'
)

# Authentication
auth_response = client.auth.login(
    email='coach@example.com',
    password='password'
)

client.set_access_token(auth_response['accessToken'])

# Create user
user = client.users.create({
    'email': 'athlete@example.com',
    'firstName': 'Jane',
    'lastName': 'Doe',
    'role': 'athlete'
})

# Get user profile
profile = client.users.get_profile()

# Create subscription
subscription = client.subscriptions.create({
    'planId': 'plan_premium',
    'paymentMethodId': 'pm_123'
})
```

This comprehensive set of examples covers the most common use cases and provides practical guidance for integrating with the StrengthOS API.