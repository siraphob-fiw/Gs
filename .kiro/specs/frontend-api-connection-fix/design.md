# Frontend API Connection Fix - Design Document

## Overview

This design addresses the critical issue where the sos-web-training frontend cannot communicate with the sos-web-api backend due to a mock HTTP client implementation. The solution involves replacing the mock HttpClient with a real implementation using the native fetch API, implementing proper error handling, and ensuring seamless integration with the existing authentication flow.

## Architecture

### Current Architecture Issues
- `@strengthos/shared-external/HttpClient` is a mock implementation
- Always returns success responses with empty data
- No actual network communication occurs
- Frontend auth service expects real API responses but receives mock data

### Proposed Architecture
```
Frontend (sos-web-training)
├── Real HttpClient (fetch-based)
├── Error Response Handler
├── Auth Service (updated)
└── API Client Wrapper (enhanced)
    ↓ HTTP Requests
Backend API (sos-web-api)
├── /api/v1/auth/login
├── /api/v1/auth/refresh
└── Other endpoints
```

## Components and Interfaces

### 1. Real HttpClient Implementation

**Location:** `libs/shared-external/src/services/http-client.ts`

**Interface:**
```typescript
export class HttpClient {
  constructor(config: HttpClientConfig)
  
  async get<T>(url: string): Promise<Results<HttpResponse<T>>>
  async post<T>(url: string, data?: any): Promise<Results<HttpResponse<T>>>
  async put<T>(url: string, data?: any): Promise<Results<HttpResponse<T>>>
  async delete<T>(url: string): Promise<Results<HttpResponse<T>>>
}
```

**Key Features:**
- Uses native `fetch()` API for actual HTTP requests
- Handles HTTP status codes (200-299 success, others as errors)
- Includes request/response interceptors
- Supports timeout configuration
- Proper error parsing from response bodies

### 2. Enhanced API Client Wrapper

**Location:** `apps/sos-web-training/src/lib/api-client.ts`

**Enhancements:**
- Better error handling for different HTTP status codes
- Automatic retry logic for network failures
- Request/response logging improvements
- Proper error message extraction from API responses

### 3. Error Response Handler

**New Component:** `apps/sos-web-training/src/lib/error-handler.ts`

**Responsibilities:**
- Parse API error responses
- Map HTTP status codes to user-friendly messages
- Handle specific error cases (account lockout, validation errors)
- Provide fallback messages for unknown errors

### 4. Updated Auth Service

**Location:** `apps/sos-web-training/src/lib/auth-service.ts`

**Changes:**
- Enhanced error handling for login failures
- Proper parsing of API error responses
- Better logging of authentication attempts
- Graceful handling of account lockout scenarios

## Data Models

### HTTP Response Structure
```typescript
interface HttpResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}
```

### API Error Response
```typescript
interface ApiErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
  traceId?: string;
}
```

### Login Success Response
```typescript
interface LoginResult {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
```

## Error Handling

### HTTP Status Code Mapping
- **200-299**: Success responses
- **400**: Bad Request - Display validation errors
- **401**: Unauthorized - Display authentication errors (including account lockout)
- **403**: Forbidden - Display permission errors
- **404**: Not Found - Display resource not found errors
- **429**: Too Many Requests - Display rate limiting errors
- **500-599**: Server Errors - Display generic server error message

### Account Lockout Handling
When the API returns a 401 with account lockout message:
1. Parse the lockout duration from the response
2. Display user-friendly message with retry time
3. Optionally implement countdown timer
4. Provide password reset option

### Network Error Handling
- Connection timeouts
- Network unreachable
- DNS resolution failures
- CORS issues

## Testing Strategy

### Unit Tests
- HttpClient with mocked fetch responses
- Error handler with various API response scenarios
- Auth service with different login outcomes

### Integration Tests
- End-to-end login flow with real API
- Error scenarios with actual API responses
- Token refresh functionality

### Manual Testing Scenarios
1. Successful login with valid credentials
2. Failed login with invalid credentials
3. Account lockout scenario
4. Network connectivity issues
5. API server unavailable

## Implementation Phases

### Phase 1: Core HttpClient Implementation
- Replace mock HttpClient with fetch-based implementation
- Basic GET and POST methods
- Simple error handling

### Phase 2: Enhanced Error Handling
- Comprehensive error response parsing
- User-friendly error messages
- Account lockout specific handling

### Phase 3: Integration and Testing
- Update auth service to use new HttpClient
- Comprehensive testing
- Performance optimization

## Security Considerations

### Request Security
- Validate URLs to prevent SSRF attacks
- Sanitize request headers
- Implement request size limits

### Response Security
- Validate response content types
- Sanitize error messages to prevent XSS
- Implement response size limits

### Authentication Security
- Secure token storage
- Automatic token refresh
- Proper session cleanup on errors

## Performance Considerations

### Request Optimization
- Connection pooling (browser handles this)
- Request timeout configuration
- Retry logic with exponential backoff

### Response Optimization
- Response compression support
- Efficient JSON parsing
- Memory management for large responses

### Caching Strategy
- HTTP cache headers support
- Client-side response caching for GET requests
- Cache invalidation on authentication changes

## Monitoring and Logging

### Request Logging
- Request URL, method, and headers
- Request timing and performance metrics
- Error rates and types

### Error Tracking
- API error responses with trace IDs
- Network connectivity issues
- Authentication failure patterns

### Performance Metrics
- Request/response times
- Success/failure rates
- User authentication patterns