# Authentication and Authorization Guide

## Overview

The StrengthOS API uses JWT (JSON Web Token) based authentication with role-based access control (RBAC) and multi-tenant isolation. This guide covers all aspects of authentication and authorization.

## Authentication Flow

### 1. User Registration

New users can register through the registration endpoint:

```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "tenantId": "tenant-123",
  "role": "athlete"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "athlete",
      "tenantId": "tenant-123",
      "status": "pending_verification"
    },
    "message": "Registration successful. Please check your email for verification."
  }
}
```

### 2. Email Verification

After registration, users must verify their email:

```bash
POST /api/v1/auth/verify-email
Content-Type: application/json

{
  "token": "verification-token-from-email"
}
```

### 3. User Login

Authenticate with email and password:

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "tokenType": "Bearer",
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "athlete",
      "tenantId": "tenant-123",
      "permissions": ["read:profile", "update:profile"]
    }
  }
}
```

### 4. Using Access Tokens

Include the access token in the Authorization header:

```bash
GET /api/v1/users/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5. Token Refresh

When the access token expires, use the refresh token:

```bash
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "tokenType": "Bearer"
  }
}
```

### 6. Logout

Invalidate tokens on logout:

```bash
POST /api/v1/auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## JWT Token Structure

### Access Token Claims

```json
{
  "sub": "user-123",
  "email": "user@example.com",
  "tenantId": "tenant-123",
  "role": "athlete",
  "permissions": ["read:profile", "update:profile"],
  "iat": 1640995200,
  "exp": 1640998800,
  "iss": "strengthos-api",
  "aud": "strengthos-app"
}
```

### Refresh Token Claims

```json
{
  "sub": "user-123",
  "type": "refresh",
  "iat": 1640995200,
  "exp": 1643587200,
  "iss": "strengthos-api",
  "aud": "strengthos-app"
}
```

## Role-Based Access Control (RBAC)

### User Roles

The system supports the following roles:

#### Super Admin
- **Description**: System-wide administrative access
- **Permissions**: All permissions across all tenants
- **Scope**: Global

#### Tenant Admin
- **Description**: Administrative access within a tenant
- **Permissions**: All permissions within their tenant
- **Scope**: Tenant-specific

#### Coach
- **Description**: Coach with access to athlete management
- **Permissions**: 
  - `read:athletes`
  - `update:athletes`
  - `create:workouts`
  - `read:workouts`
  - `update:workouts`
  - `read:progress`
- **Scope**: Tenant-specific

#### Athlete
- **Description**: Individual athlete account
- **Permissions**:
  - `read:profile`
  - `update:profile`
  - `read:workouts`
  - `read:progress`
  - `create:progress`
- **Scope**: Tenant-specific, own data only

#### Support
- **Description**: Customer support representative
- **Permissions**:
  - `read:users`
  - `read:tickets`
  - `update:tickets`
  - `read:logs`
- **Scope**: Tenant-specific or global

### Permission System

Permissions follow the format: `action:resource[:scope]`

#### Actions
- `create`: Create new resources
- `read`: Read/view resources
- `update`: Modify existing resources
- `delete`: Remove resources
- `manage`: Full CRUD access

#### Resources
- `users`: User accounts
- `athletes`: Athlete profiles
- `coaches`: Coach profiles
- `workouts`: Workout plans and sessions
- `progress`: Progress tracking data
- `payments`: Payment information
- `subscriptions`: Subscription data
- `notifications`: Notification system
- `reports`: Analytics and reports
- `settings`: System and user settings

#### Scopes (Optional)
- `own`: User's own data only
- `team`: Team/group data
- `tenant`: Tenant-wide data
- `global`: System-wide data

### Permission Examples

```json
{
  "permissions": [
    "read:profile:own",
    "update:profile:own",
    "read:workouts:own",
    "create:progress:own",
    "read:athletes:team",
    "manage:workouts:team"
  ]
}
```

## Multi-Tenant Security

### Tenant Isolation

All data access is automatically scoped to the user's tenant context:

1. **JWT Token**: Contains `tenantId` claim
2. **Database Queries**: Automatically filtered by tenant
3. **API Responses**: Only return tenant-specific data
4. **File Storage**: Tenant-specific storage buckets

### Tenant Switching

Users with access to multiple tenants can switch context:

```bash
POST /api/v1/tenants/switch
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "tenantId": "tenant-456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tenant": {
      "id": "tenant-456",
      "name": "New Tenant",
      "role": "coach"
    }
  }
}
```

## Password Security

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- Cannot be a common password
- Cannot contain user's email or name

### Password Reset Flow

1. **Request Password Reset**:
```bash
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

2. **Reset Password**:
```bash
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "newPassword": "NewSecurePassword123!"
}
```

### Password Change

For authenticated users:

```bash
POST /api/v1/auth/change-password
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewSecurePassword123!"
}
```

## Security Features

### Rate Limiting

Authentication endpoints have strict rate limiting:

- **Login**: 5 attempts per 15 minutes per IP
- **Registration**: 3 attempts per hour per IP
- **Password Reset**: 3 attempts per hour per email
- **Token Refresh**: 10 attempts per minute per user

### Account Lockout

After 5 failed login attempts, accounts are temporarily locked:

- **First lockout**: 15 minutes
- **Second lockout**: 30 minutes
- **Third lockout**: 1 hour
- **Subsequent lockouts**: 24 hours

### Session Management

- **Access Token Lifetime**: 1 hour (configurable)
- **Refresh Token Lifetime**: 30 days (configurable)
- **Concurrent Sessions**: Limited to 5 per user
- **Session Invalidation**: On password change or security events

### Security Headers

All responses include security headers:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
```

## API Key Authentication (Optional)

For server-to-server communication, API keys can be used:

```bash
GET /api/v1/users
Authorization: ApiKey your-api-key
```

### API Key Management

```bash
# Create API key
POST /api/v1/auth/api-keys
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Integration Key",
  "permissions": ["read:users", "create:notifications"],
  "expiresAt": "2024-12-31T23:59:59.000Z"
}
```

## Error Handling

### Authentication Errors

#### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/auth/login"
}
```

#### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/admin/users",
  "requiredPermissions": ["manage:users"]
}
```

#### 429 Too Many Requests
```json
{
  "statusCode": 429,
  "message": "Too many login attempts",
  "error": "Too Many Requests",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/auth/login",
  "retryAfter": 900
}
```

## Best Practices

### Client Implementation

1. **Store tokens securely** (httpOnly cookies or secure storage)
2. **Implement automatic token refresh**
3. **Handle token expiration gracefully**
4. **Clear tokens on logout**
5. **Validate tokens before API calls**

### Security Considerations

1. **Use HTTPS in production**
2. **Implement CSRF protection**
3. **Validate all inputs**
4. **Log security events**
5. **Monitor for suspicious activity**
6. **Implement proper session management**

### Example Client Code

#### JavaScript/TypeScript

```typescript
class AuthService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  async login(email: string, password: string) {
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (response.ok) {
      const data = await response.json();
      this.accessToken = data.data.accessToken;
      this.refreshToken = data.data.refreshToken;
      this.scheduleTokenRefresh(data.data.expiresIn);
      return data.data.user;
    }

    throw new Error('Login failed');
  }

  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: this.refreshToken })
    });

    if (response.ok) {
      const data = await response.json();
      this.accessToken = data.data.accessToken;
      this.scheduleTokenRefresh(data.data.expiresIn);
      return this.accessToken;
    }

    throw new Error('Token refresh failed');
  }

  private scheduleTokenRefresh(expiresIn: number) {
    // Refresh token 5 minutes before expiration
    const refreshTime = (expiresIn - 300) * 1000;
    setTimeout(() => this.refreshAccessToken(), refreshTime);
  }

  getAuthHeaders() {
    return this.accessToken 
      ? { 'Authorization': `Bearer ${this.accessToken}` }
      : {};
  }

  async logout() {
    if (this.refreshToken) {
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken: this.refreshToken })
      });
    }

    this.accessToken = null;
    this.refreshToken = null;
  }
}
```

## Testing Authentication

### Unit Tests

```typescript
describe('AuthService', () => {
  it('should login successfully with valid credentials', async () => {
    const authService = new AuthService();
    const user = await authService.login('test@example.com', 'password');
    expect(user).toBeDefined();
    expect(user.email).toBe('test@example.com');
  });

  it('should refresh token when expired', async () => {
    const authService = new AuthService();
    await authService.login('test@example.com', 'password');
    const newToken = await authService.refreshAccessToken();
    expect(newToken).toBeDefined();
  });
});
```

### Integration Tests

```typescript
describe('Authentication Integration', () => {
  it('should protect endpoints requiring authentication', async () => {
    const response = await request(app)
      .get('/api/v1/users/profile')
      .expect(401);

    expect(response.body.message).toBe('Unauthorized');
  });

  it('should allow access with valid token', async () => {
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'password' })
      .expect(200);

    const token = loginResponse.body.data.accessToken;

    await request(app)
      .get('/api/v1/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
```