# StrengthOS API Documentation

Welcome to the comprehensive documentation for the StrengthOS API. This documentation provides everything you need to integrate with our platform effectively and securely.

## 📚 Documentation Overview

### Quick Start Guides
- **[API Usage Guide](./api-usage-guide.md)** - Complete guide to using the StrengthOS API
- **[Authentication Guide](./authentication-guide.md)** - Detailed authentication and authorization documentation
- **[API Examples](./api-examples.md)** - Practical examples and common use cases
- **[Best Practices](./api-best-practices.md)** - Guidelines for optimal API usage

### Interactive Documentation
- **[Swagger/OpenAPI Documentation](http://localhost:3000/api/docs)** - Interactive API explorer and testing interface

## 🚀 Getting Started

### 1. Authentication
All API requests require authentication using JWT Bearer tokens. Start by obtaining an access token:

```bash
curl -X POST \
  http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

### 2. Making Your First Request
Use the access token to make authenticated requests:

```bash
curl -X GET \
  http://localhost:3000/api/v1/users/profile \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

### 3. Explore the API
Visit our [interactive documentation](http://localhost:3000/api/docs) to explore all available endpoints and test them directly in your browser.

## 🏗️ API Architecture

### Base URLs
- **Development**: `http://localhost:3000/api/v1`
- **Staging**: `https://api-staging.strengthos.com/api/v1`
- **Production**: `https://api.strengthos.com/api/v1`

### Core Features
- **RESTful Design**: Standard HTTP methods and status codes
- **JSON API**: All requests and responses use JSON format
- **JWT Authentication**: Secure token-based authentication
- **Multi-Tenancy**: Built-in tenant isolation and context switching
- **Rate Limiting**: Automatic rate limiting for API protection
- **Comprehensive Error Handling**: Consistent error responses with detailed information
- **Pagination**: Efficient pagination for large datasets
- **Filtering & Sorting**: Flexible query capabilities
- **Real-time Notifications**: WebSocket and webhook support

## 📖 API Modules

### Core Modules
- **Authentication** (`/auth`) - User authentication and session management
- **Users** (`/users`) - User account management and profiles
- **Tenants** (`/tenants`) - Multi-tenant organization management
- **Health** (`/health`) - System health checks and monitoring

### Feature Modules
- **Coach-Athlete** (`/coach-athlete`) - Relationship management and transitions
- **Notifications** (`/notifications`) - Notification system and templates
- **Payments** (`/payments`) - Payment processing and billing
- **Subscriptions** (`/subscriptions`) - Subscription lifecycle management
- **Preferences** (`/preferences`) - User and system preferences
- **Admin** (`/admin`) - Administrative functions and system management

### System Modules
- **Cache** (`/cache`) - Caching operations and management
- **Monitoring** (`/monitoring`) - System monitoring and metrics
- **Security** (`/security`) - Security auditing and access control

## 🔐 Security

### Authentication Methods
- **JWT Bearer Tokens** - Primary authentication method
- **API Keys** - For server-to-server communication
- **OAuth 2.0** - Third-party integrations (coming soon)

### Security Features
- **Role-Based Access Control (RBAC)** - Granular permission system
- **Multi-Tenant Isolation** - Automatic tenant context enforcement
- **Rate Limiting** - Protection against abuse and DoS attacks
- **Request Signing** - Optional request signing for sensitive operations
- **Audit Logging** - Comprehensive security event logging
- **HTTPS Enforcement** - TLS encryption for all communications

## 📊 Rate Limits

### Default Limits
- **Authentication**: 5 requests per 15 minutes per IP
- **General API**: 100 requests per minute per user
- **Bulk Operations**: 10 requests per minute per user
- **File Uploads**: 5 requests per minute per user

### Rate Limit Headers
All responses include rate limit information:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## 🔄 Pagination

### Standard Pagination
```bash
GET /api/v1/users?page=2&limit=20&sortBy=createdAt&sortOrder=desc
```

### Cursor-Based Pagination (for large datasets)
```bash
GET /api/v1/users?cursor=eyJpZCI6InVzZXItMTIzIn0&limit=50
```

### Response Format
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

## 🚨 Error Handling

### Standard Error Response
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "path": "/api/v1/users",
  "traceId": "trace-123456789",
  "details": [
    "email must be a valid email address",
    "password must be at least 8 characters long"
  ]
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (resource already exists)
- `422` - Unprocessable Entity (business logic error)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## 🔔 Webhooks

### Supported Events
- `user.created` - New user registration
- `user.updated` - User profile changes
- `payment.succeeded` - Successful payment
- `payment.failed` - Failed payment
- `subscription.created` - New subscription
- `subscription.updated` - Subscription changes
- `subscription.cancelled` - Subscription cancellation

### Webhook Configuration
```bash
POST /api/v1/webhooks
{
  "url": "https://your-app.com/webhooks/strengthos",
  "events": ["user.created", "payment.succeeded"],
  "secret": "your-webhook-secret"
}
```

## 📱 SDKs and Client Libraries

### Official SDKs
- **JavaScript/TypeScript** - `@strengthos/api-client`
- **Python** - `strengthos-client`
- **PHP** - `strengthos/api-client` (coming soon)
- **Ruby** - `strengthos-api` (coming soon)

### Community SDKs
- **Go** - Community maintained
- **Java** - Community maintained
- **C#** - Community maintained

## 🧪 Testing

### Test Environment
- **Base URL**: `https://api-test.strengthos.com/api/v1`
- **Test Credentials**: Available in developer portal
- **Test Data**: Automatically reset daily

### Postman Collection
Download our [Postman collection](./postman/StrengthOS-API.postman_collection.json) for easy API testing.

## 📈 Monitoring and Analytics

### Health Checks
Monitor API health at `/health`:
```bash
GET /api/v1/health
```

### Status Page
Check system status at [status.strengthos.com](https://status.strengthos.com)

### Performance Metrics
- **Average Response Time**: < 200ms
- **99th Percentile**: < 500ms
- **Uptime SLA**: 99.9%

## 🆘 Support

### Documentation
- **Interactive Docs**: [localhost:3000/api/docs](http://localhost:3000/api/docs)
- **Developer Portal**: [developers.strengthos.com](https://developers.strengthos.com)
- **GitHub Repository**: [github.com/strengthos/api](https://github.com/strengthos/api)

### Contact
- **Email**: [api-support@strengthos.com](mailto:api-support@strengthos.com)
- **Discord**: [StrengthOS Developer Community](https://discord.gg/strengthos-dev)
- **Stack Overflow**: Tag your questions with `strengthos-api`

### Response Times
- **Critical Issues**: < 2 hours
- **General Support**: < 24 hours
- **Feature Requests**: < 1 week

## 📋 Changelog

### Version 1.0.0 (Current)
- Initial API release
- Complete user management system
- Authentication and authorization
- Multi-tenant support
- Coach-athlete relationship management
- Notification system
- Payment processing
- Subscription management
- Comprehensive documentation

### Upcoming Features
- **v1.1.0** - Enhanced analytics and reporting
- **v1.2.0** - Real-time messaging system
- **v1.3.0** - Advanced workout planning tools
- **v2.0.0** - GraphQL API support

## 🤝 Contributing

We welcome contributions to improve our API and documentation:

1. **Report Issues**: Use GitHub issues for bug reports
2. **Suggest Features**: Submit feature requests via GitHub
3. **Improve Documentation**: Submit PRs for documentation improvements
4. **Community SDKs**: Help maintain community client libraries

## 📄 License

The StrengthOS API is proprietary software. Usage is governed by our [Terms of Service](https://strengthos.com/terms) and [API License Agreement](https://strengthos.com/api-license).

## 🔗 Quick Links

- [🚀 Getting Started](#-getting-started)
- [📖 API Usage Guide](./api-usage-guide.md)
- [🔐 Authentication Guide](./authentication-guide.md)
- [💡 API Examples](./api-examples.md)
- [⚡ Best Practices](./api-best-practices.md)
- [🔍 Interactive Documentation](http://localhost:3000/api/docs)
- [📞 Support](#-support)

---

**Happy coding! 🎉**

*Last updated: January 2024*