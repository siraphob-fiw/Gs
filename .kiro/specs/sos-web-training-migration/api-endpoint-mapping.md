# API Endpoint Mapping Analysis

## Current State Analysis

The sos-web-training frontend is currently using outdated API endpoints that don't exist in the current sos-web-api backend. This document maps the current frontend API calls to the correct backend endpoints.

## Frontend API Usage Audit

### 1. Plans/Workouts Endpoints (Currently Broken)

**Current Frontend Usage:**
- `GET /plans` - Get list of plans
- `GET /plans/{id}` - Get specific plan
- `POST /plans` - Create new plan
- `PUT /plans/{id}` - Update plan
- `DELETE /plans/{id}` - Delete plan
- `GET /plans/assignments` - Get plan assignments
- `POST /plans/assign` - Assign plan to user
- `GET /plans/{id}/progress` - Get plan progress
- `POST /plans/{id}/sessions/{sessionId}/start` - Start session
- `POST /plans/{id}/sessions/{sessionId}/complete` - Complete session

**Backend Reality:**
These endpoints don't exist. The backend uses program-generation endpoints instead.

**Required Mapping:**
- `GET /plans` → `GET /program-generation/training-blocks`
- `GET /plans/{id}` → `GET /program-generation/training-blocks/{id}`
- `POST /plans` → `POST /program-generation/training-blocks`
- `PUT /plans/{id}` → `PUT /program-generation/training-blocks/{id}`
- `DELETE /plans/{id}` → `DELETE /program-generation/training-blocks/{id}`

### 2. Exercises Endpoints (Currently Broken)

**Current Frontend Usage:**
- `GET /exercises` - Get list of exercises
- `GET /exercises/{id}` - Get specific exercise
- `POST /exercises` - Create new exercise
- `PUT /exercises/{id}` - Update exercise
- `POST /exercises/search` - Search exercises
- `GET /exercises/{id}/variations` - Get exercise variations
- `GET /exercises/{id}/progressions` - Get exercise progressions
- `POST /exercises/recommendations` - Get exercise recommendations

**Backend Reality:**
These endpoints don't exist in the current API structure.

**Required Action:**
Need to determine if exercises should be managed through program-generation endpoints or if separate exercise endpoints need to be created.

### 3. Equipment Endpoints (Currently Broken)

**Current Frontend Usage:**
- `GET /equipment` - Get list of equipment
- `GET /equipment/{id}` - Get specific equipment
- `POST /equipment` - Create new equipment
- `PUT /equipment/{id}` - Update equipment
- `GET /equipment/categories` - Get equipment categories
- `GET /equipment/profile` - Get user equipment profile
- `GET /equipment/available` - Get available equipment

**Backend Reality:**
These endpoints don't exist in the current API structure.

### 4. Authentication Endpoints (Working)

**Current Frontend Usage:**
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh token
- `POST /auth/reset-password` - Reset password
- `GET /auth/sessions/{userId}` - Get user sessions

**Backend Reality:**
These endpoints exist and are working correctly.

### 5. Tenant Endpoints (Working)

**Current Frontend Usage:**
- `GET /tenants/{tenantId}/theme` - Get tenant theme

**Backend Reality:**
This endpoint exists and is working correctly.

## Type System Mismatches

### Frontend Types vs Backend Types

**Frontend Uses:**
- `Plan` interface for workout plans
- `Exercise` interface for exercises
- `Equipment` interface for equipment
- `PlanAssignment` for plan assignments
- `PlanProgress` for progress tracking

**Backend Provides:**
- `TrainingBlock` for training blocks
- `ProgramTemplate` for program templates
- `GeneratedProgram` for generated programs
- Program generation DTOs and entities

## Required Changes Summary

### 1. Immediate Fixes Needed

1. **Update useWorkouts hook** to use `/program-generation/training-blocks` endpoints
2. **Create missing backend endpoints** for exercises and equipment management
3. **Update frontend types** to match backend data structures
4. **Implement proper data transformation** between frontend and backend formats

### 2. Backend Endpoints That Need to be Created

Based on frontend usage, the following endpoints are missing from the backend:

```typescript
// Exercise Management (missing)
GET /exercises
GET /exercises/{id}
POST /exercises
PUT /exercises/{id}
DELETE /exercises/{id}
POST /exercises/search
GET /exercises/{id}/variations
POST /exercises/{id}/variations
GET /exercises/{id}/progressions
POST /exercises/{id}/progressions
POST /exercises/recommendations

// Equipment Management (missing)
GET /equipment
GET /equipment/{id}
POST /equipment
PUT /equipment/{id}
DELETE /equipment/{id}
GET /equipment/categories
GET /equipment/categories/{id}
GET /equipment/profile
PUT /equipment/profile
GET /equipment/available
```

### 3. Data Transformation Requirements

The frontend needs to transform between:
- `Plan` ↔ `TrainingBlock`
- Frontend exercise data ↔ Backend exercise data (when endpoints are created)
- Frontend equipment data ↔ Backend equipment data (when endpoints are created)

## Implementation Priority

1. **High Priority**: Fix training block/plan endpoints (breaks core functionality)
2. **Medium Priority**: Create exercise management endpoints
3. **Medium Priority**: Create equipment management endpoints
4. **Low Priority**: Optimize data transformation and caching

## Next Steps

1. Update frontend hooks to use correct program-generation endpoints
2. Create missing backend controllers for exercises and equipment
3. Update frontend components to use correct data types
4. Implement proper error handling for new API structure
5. Test all API integrations end-to-end