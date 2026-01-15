import { HttpStatus } from '@nestjs/common';
import { ErrorCategory, ErrorSeverity } from '@strengthos/shared-types';
import { BaseException, ErrorContext } from './base.exception';

export class AuthenticationException extends BaseException {
  constructor(
    message: string,
    code: string = 'AUTHENTICATION_ERROR',
    context?: ErrorContext,
    metadata?: Record<string, any>,
  ) {
    super(
      {
        code,
        message,
        category: ErrorCategory.AUTHENTICATION,
        severity: ErrorSeverity.HIGH,
        context,
        metadata,
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class InvalidCredentialsException extends AuthenticationException {
  constructor(context?: ErrorContext) {
    super('Invalid credentials provided', 'INVALID_CREDENTIALS', context);
  }
}

export class TokenExpiredException extends AuthenticationException {
  constructor(tokenType: string = 'access', context?: ErrorContext) {
    super(`${tokenType} token has expired`, 'TOKEN_EXPIRED', context, {
      tokenType,
    });
  }
}

export class InvalidTokenException extends AuthenticationException {
  constructor(tokenType: string = 'access', context?: ErrorContext) {
    super(`Invalid ${tokenType} token provided`, 'INVALID_TOKEN', context, {
      tokenType,
    });
  }
}

export class MissingTokenException extends AuthenticationException {
  constructor(context?: ErrorContext) {
    super('Authentication token is required', 'MISSING_TOKEN', context);
  }
}

export class AccountLockedException extends AuthenticationException {
  constructor(reason: string, unlockTime?: Date, context?: ErrorContext) {
    super(`Account is locked: ${reason}`, 'ACCOUNT_LOCKED', context, {
      reason,
      unlockTime,
    });
  }
}

export class TooManyAttemptsException extends AuthenticationException {
  constructor(retryAfter: number, context?: ErrorContext) {
    super(
      'Too many authentication attempts. Please try again later.',
      'TOO_MANY_ATTEMPTS',
      context,
      { retryAfter },
    );

    this.getStatus = () => HttpStatus.TOO_MANY_REQUESTS;
  }
}

export class SessionExpiredException extends AuthenticationException {
  constructor(context?: ErrorContext) {
    super(
      'Session has expired. Please log in again.',
      'SESSION_EXPIRED',
      context,
    );
  }
}

export class InvalidSessionException extends AuthenticationException {
  constructor(context?: ErrorContext) {
    super('Invalid session. Please log in again.', 'INVALID_SESSION', context);
  }
}
