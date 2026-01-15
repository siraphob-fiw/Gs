# API Integration Infrastructure

This directory contains the core API integration infrastructure for the sos-web-training application.

## Components

### API Client (`api-client.ts`)

- Configured using the `@strengthos/shared-external` HttpClient
- Provides a wrapper with familiar REST API methods (GET, POST, PUT, DELETE)
- Integrates with logging and error handling
- Uses environment configuration for base URL

### Error Handler (`error-handler.ts`)

- Centralized error handling for API responses and application errors
- Integrates with `@strengthos/shared-logging` for error logging
- Provides user-friendly error messages based on HTTP status codes
- Supports both synchronous and asynchronous error handling

### Environment Configuration (`env-config.ts`)

- Validates and provides environment variables
- Supports development, staging, and production configurations
- Provides utility functions for environment detection
- Ensures required API URL is configured

### Console Logger (`console-logger.ts`)

- Implementation of `ILogService` for browser console logging
- Used by the shared logging library in the frontend
- Formats log messages with timestamps and levels

### API Hooks (`../hooks/api/use-api.ts`)

- React hooks for common API operations
- Provides loading states and error handling
- Integrates with the API client and error handler

## Environment Variables

The following environment variables are required:

- `NEXT_PUBLIC_API_URL`: Base URL for the API (required)
- `NEXT_PUBLIC_LOG_LEVEL`: Log level (optional, defaults to 'info')
- `NODE_ENV`: Node environment (optional, defaults to 'development')

## Environment Files

- `.env.development`: Development configuration
- `.env.staging`: Staging configuration
- `.env.production`: Production configuration
- `.env.local.example`: Example local configuration

## Usage

```typescript
import apiClient from '@/lib/api-client';
import { ErrorHandler } from '@/lib/error-handler';
import { useApiGet } from '@/hooks/api/use-api';

// Direct API client usage
const response = await apiClient.get('/workouts');

// With error handling
const result = await ErrorHandler.handleAsync(() => apiClient.post('/workouts', workoutData));

// Using React hooks
const { data, loading, error, execute } = useApiGet('/workouts');
```

## Testing

All components include comprehensive unit tests and integration tests to ensure proper functionality and integration between components.
