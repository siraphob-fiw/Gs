import { SetMetadata } from '@nestjs/common';

export const REQUIRES_TENANT_KEY = 'requiresTenant';

/**
 * Decorator to mark endpoints that require a tenant_id.
 * Users without a tenant assignment will receive a 403 error with message "tenant_id is required".
 *
 * Usage:
 * @RequiresTenant()
 * @Get('some-endpoint')
 * async someMethod() { ... }
 */
export const RequiresTenant = () => SetMetadata(REQUIRES_TENANT_KEY, true);
