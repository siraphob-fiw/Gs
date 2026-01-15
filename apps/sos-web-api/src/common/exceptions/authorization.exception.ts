import { HttpStatus } from '@nestjs/common';
import { ErrorCategory, ErrorSeverity } from '@strengthos/shared-types';
import { BaseException, ErrorContext } from './base.exception';

export class AuthorizationException extends BaseException {
  constructor(
    message: string,
    code: string = 'AUTHORIZATION_ERROR',
    context?: ErrorContext,
    metadata?: Record<string, any>,
  ) {
    super(
      {
        code,
        message,
        category: ErrorCategory.AUTHORIZATION,
        severity: ErrorSeverity.HIGH,
        context,
        metadata,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

export class InsufficientPermissionsException extends AuthorizationException {
  constructor(
    requiredPermission: string,
    resource?: string,
    context?: ErrorContext,
  ) {
    super(
      `Insufficient permissions to access ${resource || 'resource'}. Required: ${requiredPermission}`,
      'INSUFFICIENT_PERMISSIONS',
      context,
      { requiredPermission, resource },
    );
  }
}

export class ResourceAccessDeniedException extends AuthorizationException {
  constructor(resource: string, action: string, context?: ErrorContext) {
    super(
      `Access denied to ${action} ${resource}`,
      'RESOURCE_ACCESS_DENIED',
      context,
      { resource, action },
    );
  }
}

export class TenantAccessDeniedException extends AuthorizationException {
  constructor(tenantId: string, context?: ErrorContext) {
    super(
      `Access denied to tenant: ${tenantId}`,
      'TENANT_ACCESS_DENIED',
      context,
      { tenantId },
    );
  }
}

export class RoleRequiredException extends AuthorizationException {
  constructor(requiredRole: string, userRole?: string, context?: ErrorContext) {
    super(
      `Role '${requiredRole}' is required. Current role: ${userRole || 'none'}`,
      'ROLE_REQUIRED',
      context,
      { requiredRole, userRole },
    );
  }
}

export class OwnershipRequiredException extends AuthorizationException {
  constructor(resource: string, resourceId: string, context?: ErrorContext) {
    super(
      `Ownership of ${resource} '${resourceId}' is required`,
      'OWNERSHIP_REQUIRED',
      context,
      { resource, resourceId },
    );
  }
}

export class FeatureNotAvailableException extends AuthorizationException {
  constructor(feature: string, plan?: string, context?: ErrorContext) {
    super(
      `Feature '${feature}' is not available${plan ? ` for plan '${plan}'` : ''}`,
      'FEATURE_NOT_AVAILABLE',
      context,
      { feature, plan },
    );
  }
}
