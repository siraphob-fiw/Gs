# @strengthos/shared-security

A comprehensive security library for the StrengthOS monorepo providing authentication, authorization, encryption, and security monitoring capabilities.

## Features

### Core Security Services
- **JWT Service**: Token generation, verification, and management
- **Password Utils**: Secure password hashing, validation, and strength checking
- **Encryption Service**: AES-256-GCM encryption/decryption with PBKDF2 key derivation
- **Authentication Service**: Complete user authentication flow with session management
- **Access Control Service**: Role-based access control (RBAC) with permission management

### Advanced Security Services
- **Security Monitoring Service**: Real-time security event logging and metrics collection
- **Intrusion Detection Service**: Rule-based threat detection and behavioral analysis
- **Security Incident Service**: Comprehensive incident management and response tracking

## Installation

```bash
npm install @strengthos/shared-security
```

## Quick Start

### JWT Service

```typescript
import { createJwtService } from '@strengthos/shared-security';

const jwtService = createJwtService({
  secret: 'your-secret-key',
  expiresIn: '24h'
});

// Generate token
const tokenResult = jwtService.generateToken({
  userId: 'user123',
  tenantId: 'tenant456',
  role: 'user'
});

// Verify token
const payloadResult = jwtService.verifyToken(token);
```

### Password Utils

```typescript
import { createPasswordUtils } from '@strengthos/shared-security';

const passwordUtils = createPasswordUtils({
  minLength: 12,
  requireSpecialChars: true
});

// Hash password
const hashResult = await passwordUtils.hashPassword('myPassword123!');

// Verify password
const isValid = await passwordUtils.verifyPassword('myPassword123!', hash);

// Validate password strength
const validation = passwordUtils.validatePassword('myPassword123!');
```

### Authentication Service

```typescript
import { createAuthenticationService } from '@strengthos/shared-security';

const authService = createAuthenticationService(
  db, 
  jwtService, 
  passwordUtils, 
  logger
);

// Login user
const loginResult = await authService.login({
  email: 'user@example.com',
  password: 'password123',
  ipAddress: '192.168.1.1'
});

// Refresh token
const refreshResult = await authService.refreshToken({
  refreshToken: 'refresh_token_here'
});
```

### Encryption Service

```typescript
import { createEncryptionService } from '@strengthos/shared-security';

const encryptionService = createEncryptionService(logger);

// Encrypt data
const encryptResult = await encryptionService.encrypt('sensitive data', 'password');

// Decrypt data
const decryptResult = await encryptionService.decrypt(encryptedData, 'password');
```

### Access Control Service

```typescript
import { createAccessControlService } from '@strengthos/shared-security';

const accessControl = createAccessControlService(db, logger);

// Check permission
const hasPermission = await accessControl.checkPermission(
  'user123',
  'users:read',
  'tenant456'
);

// Check role
const hasRole = await accessControl.checkRole('user123', 'admin');
```

## Advanced Services

### Security Monitoring

```typescript
import { createSecurityMonitoringService } from '@strengthos/shared-security';

const monitoring = createSecurityMonitoringService(db, logger);

// Log security event
await monitoring.logSecurityEvent({
  eventType: SecurityEventType.LOGIN_SUCCESS,
  userId: 'user123',
  severity: 'low',
  metadata: { source: 'web' }
});

// Get security metrics
const metrics = await monitoring.getSecurityMetrics(startDate, endDate);
```

### Intrusion Detection

```typescript
import { createIntrusionDetectionService } from '@strengthos/shared-security';

const intrusionDetection = createIntrusionDetectionService(db, logger);

// Analyze security event
const detections = await intrusionDetection.analyzeEvent(eventId, eventData);

// Add custom rule
await intrusionDetection.addRule({
  name: 'Multiple Failed Logins',
  eventType: SecurityEventType.LOGIN_FAILURE,
  conditions: [
    { field: 'ipAddress', operator: 'equals', value: '192.168.1.100' }
  ],
  severity: 'high'
});
```

### Security Incident Management

```typescript
import { createSecurityIncidentService } from '@strengthos/shared-security';

const incidentService = createSecurityIncidentService(db, logger);

// Create incident
const incidentId = await incidentService.createIncident({
  title: 'Suspicious Login Activity',
  description: 'Multiple failed login attempts detected',
  severity: 'high',
  category: 'unauthorized_access',
  reportedBy: 'system'
});

// Update incident
await incidentService.updateIncident(incidentId, {
  status: 'investigating',
  assignedTo: 'security_analyst'
}, 'admin');
```

## Configuration

### Environment Variables

```bash
# JWT Configuration
AUTH_JWT_SECRET=your-super-secret-key
AUTH_JWT_ALGORITHM=HS256
AUTH_JWT_EXPIRES_IN=24h
AUTH_JWT_ISSUER=strengthos
AUTH_JWT_AUDIENCE=strengthos-api

# Database Configuration
DATABASE_URL=postgresql://user:pass@localhost:5432/strengthos
```

### Service Configuration

```typescript
// Authentication Service Config
const authConfig = {
  maxLoginAttempts: 5,
  lockoutDuration: 30, // minutes
  sessionTimeout: 1440, // 24 hours
  requireEmailVerification: true
};

// Password Utils Config
const passwordConfig = {
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  saltRounds: 12
};

// Monitoring Config
const monitoringConfig = {
  enableRealTimeAlerts: true,
  alertThresholds: {
    failedLogins: 5,
    suspiciousActivity: 10,
    timeWindow: 15 // minutes
  },
  retentionPeriod: 90 // days
};
```

## Database Schema

The library requires the following database tables:

### Core Tables
- `users` - User accounts
- `user_sessions` - Active user sessions
- `user_roles` - User role assignments
- `permissions` - Available permissions
- `role_permissions` - Role-permission mappings

### Security Tables
- `security_events` - Security event log
- `security_alerts` - Generated alerts
- `login_attempts` - Failed login tracking

### Advanced Tables
- `intrusion_rules` - Detection rules
- `intrusion_detections` - Detected threats
- `security_incidents` - Security incidents
- `incident_timeline` - Incident history
- `incident_responses` - Response tasks

## Security Features

### Encryption
- **AES-256-GCM**: Industry-standard encryption
- **PBKDF2**: Secure key derivation
- **Random IV/Salt**: Unique per encryption
- **HMAC**: Message authentication

### Authentication
- **JWT Tokens**: Stateless authentication
- **Session Management**: Server-side session tracking
- **Account Lockout**: Brute force protection
- **Password Policies**: Configurable strength requirements

### Authorization
- **RBAC**: Role-based access control
- **Permission Inheritance**: Hierarchical roles
- **Tenant Isolation**: Multi-tenant support
- **Resource-level Permissions**: Fine-grained control

### Monitoring
- **Real-time Alerts**: Immediate threat notification
- **Behavioral Analysis**: Unusual pattern detection
- **Audit Logging**: Comprehensive event tracking
- **Metrics Collection**: Security analytics

## Error Handling

All services use the `Results<T>` pattern for consistent error handling:

```typescript
const result = await authService.login(credentials);

if (result.isOk) {
  const loginData = result.returnValue;
  // Handle success
} else {
  const errorMessage = result.message;
  // Handle error
}
```

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

## Contributing

1. Follow TypeScript best practices
2. Add comprehensive tests for new features
3. Update documentation for API changes
4. Follow security best practices
5. Use the Results pattern for error handling

## Security Considerations

- **Secrets Management**: Never hardcode secrets
- **Input Validation**: Validate all inputs
- **Rate Limiting**: Implement request throttling
- **Audit Logging**: Log all security events
- **Regular Updates**: Keep dependencies updated
- **Penetration Testing**: Regular security assessments

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Create an issue in the repository
- Contact the security team
- Review the documentation

---

**⚠️ Security Notice**: This library handles sensitive security operations. Ensure proper configuration and regular security audits in production environments.