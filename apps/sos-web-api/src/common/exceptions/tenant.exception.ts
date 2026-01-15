import { HttpStatus } from '@nestjs/common';
import { ErrorCategory, ErrorSeverity } from '@strengthos/shared-types';
import { BaseException, ErrorContext } from './base.exception';

export class TenantException extends BaseException {
  constructor(
    message: string,
    code: string = 'TENANT_ERROR',
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
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class TenantNotFoundException extends TenantException {
  constructor(tenantId: string, context?: ErrorContext) {
    super(`Tenant not found: ${tenantId}`, 'TENANT_NOT_FOUND', context, {
      tenantId,
    });

    this.getStatus = () => HttpStatus.NOT_FOUND;
  }
}

export class TenantInactiveException extends TenantException {
  constructor(tenantId: string, context?: ErrorContext) {
    super(`Tenant is inactive: ${tenantId}`, 'TENANT_INACTIVE', context, {
      tenantId,
    });

    this.getStatus = () => HttpStatus.FORBIDDEN;
  }
}

export class TenantSuspendedException extends TenantException {
  constructor(
    tenantId: string,
    reason: string,
    suspendedUntil?: Date,
    context?: ErrorContext,
  ) {
    super(`Tenant is suspended: ${reason}`, 'TENANT_SUSPENDED', context, {
      tenantId,
      reason,
      suspendedUntil,
    });

    this.getStatus = () => HttpStatus.FORBIDDEN;
  }
}

export class TenantContextMissingException extends TenantException {
  constructor(context?: ErrorContext) {
    super(
      'Tenant context is required for this operation',
      'TENANT_CONTEXT_MISSING',
      context,
    );
  }
}

export class InvalidTenantContextException extends TenantException {
  constructor(tenantId: string, context?: ErrorContext) {
    super(
      `Invalid tenant context: ${tenantId}`,
      'INVALID_TENANT_CONTEXT',
      context,
      { tenantId },
    );
  }
}

export class TenantLimitExceededException extends TenantException {
  constructor(
    limitType: string,
    currentValue: number,
    maxValue: number,
    context?: ErrorContext,
  ) {
    super(
      `Tenant limit exceeded for ${limitType}: ${currentValue}/${maxValue}`,
      'TENANT_LIMIT_EXCEEDED',
      context,
      { limitType, currentValue, maxValue },
    );

    this.getStatus = () => HttpStatus.PAYMENT_REQUIRED;
  }
}

export class TenantConfigurationException extends TenantException {
  constructor(configKey: string, issue: string, context?: ErrorContext) {
    super(
      `Tenant configuration error for '${configKey}': ${issue}`,
      'TENANT_CONFIGURATION_ERROR',
      context,
      { configKey, issue },
    );
  }
}
