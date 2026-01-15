# @strengthos/shared-validation

Comprehensive validation schemas and utilities for StrengthOS applications, providing consistent data validation across the entire platform.

## Features

- **Multiple Validation Libraries**: Support for both Joi and Zod validation schemas
- **Express Middleware**: Ready-to-use middleware for request validation
- **Decorator Support**: Class and method decorators for TypeScript validation
- **Utility Functions**: Common validation and sanitization utilities
- **Type Safety**: Full TypeScript support with proper type inference
- **Consistent Error Handling**: Integration with shared Results pattern

## Installation

```bash
npm install @strengthos/shared-validation
```

## Quick Start

### Basic Validation Service

```typescript
import { createValidationService, JoiSchemas } from '@strengthos/shared-validation';

const validationService = createValidationService();

// Validate user creation data
const result = await validationService.validateUserCreation({
  email: 'user@example.com',
  username: 'johndoe',
  password: 'SecurePass123!',
  firstName: 'John',
  lastName: 'Doe',
  tenantId: '123e4567-e89b-12d3-a456-426614174000'
});

if (result.isOk) {
  console.log('Valid user data:', result.value);
} else {
  console.error('Validation failed:', result.message);
}
```

### Express Middleware

```typescript
import express from 'express';
import { 
  validateUserCreation, 
  validatePagination,
  validateUUIDParam 
} from '@strengthos/shared-validation';

const app = express();

// Validate user creation
app.post('/users', validateUserCreation(), (req, res) => {
  // req.validatedBody contains the validated data
  const userData = req.validatedBody;
  // ... create user
});

// Validate pagination parameters
app.get('/users', validatePagination(), (req, res) => {
  const { page, limit, sortBy, sortOrder } = req.validatedQuery;
  // ... fetch paginated users
});

// Validate UUID parameters
app.get('/users/:id', validateUUIDParam('id'), (req, res) => {
  const { id } = req.validatedParams;
  // ... fetch user by ID
});
```

### Validation Decorators

```typescript
import { 
  Validatable, 
  ValidateEmail, 
  ValidateUsername, 
  ValidatePassword,
  ValidateUUID 
} from '@strengthos/shared-validation';

@Validatable()
class User {
  @ValidateEmail()
  email!: string;

  @ValidateUsername()
  username!: string;

  @ValidatePassword()
  password!: string;

  @ValidateUUID()
  tenantId!: string;
}

// Usage
const user = new User();
user.email = 'user@example.com';
user.username = 'johndoe';
user.password = 'SecurePass123!';
user.tenantId = '123e4567-e89b-12d3-a456-426614174000';

const validationResult = await user.validate();
if (validationResult.isOk) {
  console.log('User is valid');
} else {
  console.error('Validation failed:', validationResult.message);
}
```

## Validation Schemas

### Available Joi Schemas

```typescript
import { JoiSchemas } from '@strengthos/shared-validation';

// Individual field schemas
JoiSchemas.email        // Email validation
JoiSchemas.username     // Username validation (3-30 chars, alphanumeric + _-)
JoiSchemas.password     // Strong password validation
JoiSchemas.phone        // International phone number
JoiSchemas.uuid         // UUID validation

// Object schemas
JoiSchemas.createUser   // User creation validation
JoiSchemas.updateUser   // User update validation
JoiSchemas.login        // Login validation
JoiSchemas.createTenant // Tenant creation validation
JoiSchemas.pagination   // Pagination parameters
```

### Available Zod Schemas

```typescript
import { ZodSchemas } from '@strengthos/shared-validation';

// Individual field schemas
ZodSchemas.email        // Email validation
ZodSchemas.username     // Username validation
ZodSchemas.password     // Strong password validation
ZodSchemas.phone        // International phone number
ZodSchemas.uuid         // UUID validation

// Object schemas
ZodSchemas.createUser   // User creation validation
ZodSchemas.updateUser   // User update validation
ZodSchemas.login        // Login validation
ZodSchemas.createTenant // Tenant creation validation
ZodSchemas.pagination   // Pagination parameters
```

## Validation Utilities

### Email Validation

```typescript
import { ValidationUtils } from '@strengthos/shared-validation';

// Basic email validation
const isValid = ValidationUtils.isValidEmail('user@example.com'); // true

// Normalize email
const normalized = ValidationUtils.normalizeEmail('User@Example.COM'); // user@example.com

// Check if business email
const isBusiness = ValidationUtils.isBusinessEmail('user@company.com'); // true
const isPersonal = ValidationUtils.isBusinessEmail('user@gmail.com'); // false

// Get email domain
const domain = ValidationUtils.getEmailDomain('user@example.com'); // example.com
```

### Password Validation

```typescript
import { ValidationUtils } from '@strengthos/shared-validation';

// Check password strength
const isStrong = ValidationUtils.isStrongPassword('SecurePass123!'); // true

// Get password strength level
const strength = ValidationUtils.getPasswordStrength('password'); // 'weak'
const strength2 = ValidationUtils.getPasswordStrength('SecurePass123!'); // 'strong'

// Generate secure password
const newPassword = ValidationUtils.generatePasswordSuggestion(12);
console.log(newPassword); // e.g., "K9$mP2nQ@xR4"
```

### Username Validation

```typescript
import { ValidationUtils } from '@strengthos/shared-validation';

// Validate username
const isValid = ValidationUtils.isValidUsername('john_doe'); // true
const isInvalid = ValidationUtils.isValidUsername('john@doe'); // false

// Sanitize username
const sanitized = ValidationUtils.sanitizeUsername('John Doe!'); // 'johndoe'

// Generate username from name
const username = ValidationUtils.generateUsername('John', 'Doe'); // 'johndoe'
const uniqueUsername = ValidationUtils.generateUsername('John', 'Doe', '123'); // 'johndoe123'
```

### Phone Number Validation

```typescript
import { ValidationUtils } from '@strengthos/shared-validation';

// Validate phone number
const isValid = ValidationUtils.isValidPhone('+1234567890'); // true

// Format phone number
const formatted = ValidationUtils.formatPhone('1234567890', 'international'); // '+1234567890'
const national = ValidationUtils.formatPhone('1234567890', 'national'); // '(123) 456-7890'
```

### String Sanitization

```typescript
import { ValidationUtils } from '@strengthos/shared-validation';

// Basic sanitization
const sanitized = ValidationUtils.sanitizeString('  Hello World!  ', {
  trim: true,
  toLowerCase: true,
  maxLength: 10
}); // 'hello worl'

// HTML escaping
const escaped = ValidationUtils.escapeHtml('<script>alert("xss")</script>');
// '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'

// Strip HTML tags
const stripped = ValidationUtils.stripHtml('<p>Hello <b>World</b></p>'); // 'Hello World'
```

## Express Middleware

### Individual Validation Middleware

```typescript
import { ValidationMiddleware } from '@strengthos/shared-validation';

const validator = new ValidationMiddleware();

// Body validation
app.post('/users', validator.validateBody(JoiSchemas.createUser), handler);

// Query validation
app.get('/users', validator.validateQuery(JoiSchemas.pagination), handler);

// Parameter validation
app.get('/users/:id', validator.validateParams(Joi.object({ id: JoiSchemas.uuid })), handler);
```

### Combined Validation and Sanitization

```typescript
import { validateAndSanitizeUserCreation } from '@strengthos/shared-validation';

// This middleware will:
// 1. Sanitize input fields (trim, normalize email, etc.)
// 2. Validate against the user creation schema
app.post('/users', validateAndSanitizeUserCreation(), (req, res) => {
  // req.validatedBody contains clean, validated data
  const userData = req.validatedBody;
});
```

### Custom Validation Middleware

```typescript
import { createValidationMiddleware, JoiSchemas } from '@strengthos/shared-validation';

const customValidator = createValidationMiddleware({
  abortEarly: false,
  stripUnknown: true,
  skipOnError: false
});

app.post('/custom', customValidator.validateBody(JoiSchemas.createUser), handler);
```

## Method Decorators

```typescript
import { ValidateParams, ValidateReturn } from '@strengthos/shared-validation';

class UserService {
  @ValidateParams(
    JoiSchemas.email,
    JoiSchemas.uuid
  )
  async createUser(email: string, tenantId: string): Promise<User> {
    // Parameters are automatically validated
    // ...
  }

  @ValidateReturn(Joi.object({
    id: JoiSchemas.uuid,
    email: JoiSchemas.email,
    username: JoiSchemas.username
  }))
  async getUser(id: string): Promise<User> {
    // Return value is automatically validated
    // ...
  }
}
```

## Batch Validation

```typescript
import { createValidationService } from '@strengthos/shared-validation';

const validationService = createValidationService();

const validations = [
  { schema: JoiSchemas.createUser, data: userData1, identifier: 'user1' },
  { schema: JoiSchemas.createUser, data: userData2, identifier: 'user2' },
  { schema: JoiSchemas.createUser, data: userData3, identifier: 'user3' }
];

const result = await validationService.validateBatch(validations);

if (result.isOk) {
  console.log('All users valid:', result.value);
} else {
  console.error('Batch validation failed:', result.message);
}
```

## Custom Validation Rules

```typescript
import Joi from 'joi';
import { createValidationService } from '@strengthos/shared-validation';

// Create custom schema
const customUserSchema = Joi.object({
  email: JoiSchemas.email,
  username: JoiSchemas.username,
  age: Joi.number().integer().min(13).max(120).required(),
  preferences: Joi.object({
    theme: Joi.string().valid('light', 'dark').default('light'),
    notifications: Joi.boolean().default(true)
  }).optional()
});

const validationService = createValidationService();
const result = await validationService.validateWithJoi(customUserSchema, userData);
```

## Error Handling

All validation methods return `Results<T>` objects for consistent error handling:

```typescript
import { createValidationService } from '@strengthos/shared-validation';

const validationService = createValidationService();
const result = await validationService.validateUserCreation(userData);

if (result.isOk) {
  // Success - use result.value
  const validatedData = result.value;
} else {
  // Error - use result.message
  console.error('Validation failed:', result.message);
  
  // For detailed error information, parse the message
  // or use the validation service's detailed error responses
}
```

## Integration with Other Libraries

### With Express Error Handler

```typescript
import { ValidationMiddleware } from '@strengthos/shared-validation';

// Add validation error handler
app.use(ValidationMiddleware.handleValidationErrors());

// Your other error handlers
app.use((error, req, res, next) => {
  // Handle other errors
});
```

### With Database Services

```typescript
import { createValidationService } from '@strengthos/shared-validation';
import { createUserService } from '@strengthos/shared-database';

const validationService = createValidationService();
const userService = createUserService();

async function createUser(userData: any) {
  // Validate first
  const validationResult = await validationService.validateUserCreation(userData);
  if (!validationResult.isOk) {
    return validationResult; // Return validation error
  }

  // Then create user with validated data
  return await userService.createUser(validationResult.value);
}
```

## Best Practices

1. **Always validate user input** before processing
2. **Use sanitization** in combination with validation
3. **Validate at the boundary** (API endpoints, service entry points)
4. **Use consistent error handling** with Results pattern
5. **Combine validation with authorization** checks
6. **Cache validation schemas** for better performance
7. **Use TypeScript types** for compile-time safety

## Common Patterns

### API Endpoint Validation

```typescript
import { 
  validateAndSanitizeUserCreation,
  validatePagination,
  validateUUIDParam 
} from '@strengthos/shared-validation';

// Create user with full validation
app.post('/api/users', 
  validateAndSanitizeUserCreation(),
  async (req, res) => {
    const userData = req.validatedBody;
    // ... create user
  }
);

// List users with pagination
app.get('/api/users',
  validatePagination(),
  async (req, res) => {
    const { page, limit, sortBy, sortOrder } = req.validatedQuery;
    // ... fetch users
  }
);

// Get user by ID
app.get('/api/users/:id',
  validateUUIDParam('id'),
  async (req, res) => {
    const { id } = req.validatedParams;
    // ... fetch user
  }
);
```

### Service Layer Validation

```typescript
import { createValidationService, JoiSchemas } from '@strengthos/shared-validation';

class UserService {
  private validationService = createValidationService();

  async createUser(userData: any) {
    // Validate input
    const validationResult = await this.validationService.validateUserCreation(userData);
    if (!validationResult.isOk) {
      return validationResult;
    }

    // Process validated data
    const validatedData = validationResult.value;
    // ... database operations
  }

  async updateUser(userId: string, updateData: any) {
    // Validate UUID
    const uuidResult = this.validationService.validateUUID(userId);
    if (!uuidResult.isValid) {
      return Results.validationError(null, 'Invalid user ID');
    }

    // Validate update data
    const validationResult = await this.validationService.validateUserUpdate(updateData);
    if (!validationResult.isOk) {
      return validationResult;
    }

    // Process update
    // ... database operations
  }
}
```

## Contributing

When adding new validation schemas or utilities:

1. Add comprehensive tests
2. Update TypeScript types
3. Document new features in README
4. Follow existing patterns and conventions
5. Ensure compatibility with Results pattern

## Dependencies

- `joi` - Schema validation library
- `zod` - TypeScript-first schema validation
- `validator` - String validation utilities
- `@strengthos/shared-types` - Shared type definitions
- `@strengthos/shared-utils` - Results pattern and utilities
- `reflect-metadata` - Decorator metadata support