import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCategory, ErrorSeverity } from '@strengthos/shared-types';

export interface ErrorContext {
  userId?: string;
  tenantId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  path?: string;
  method?: string;
  timestamp?: Date;
  [key: string]: any;
}

export interface ErrorDetails {
  code: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  context?: ErrorContext;
  metadata?: Record<string, any>;
  stackTrace?: string;
}

export abstract class BaseException extends HttpException {
  public readonly code: string;
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly context?: ErrorContext;
  public readonly metadata?: Record<string, any>;
  public readonly timestamp: Date;

  constructor(
    details: ErrorDetails,
    status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
  ) {
    super(details.message, status);

    this.code = details.code;
    this.category = details.category;
    this.severity = details.severity;
    this.context = details.context;
    this.metadata = details.metadata;
    this.timestamp = details.context?.timestamp || new Date();

    // Ensure the name of this error is the same as the class name
    this.name = this.constructor.name;

    // This clips the constructor invocation from the stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  public toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      category: this.category,
      severity: this.severity,
      statusCode: this.getStatus(),
      context: this.context,
      metadata: this.metadata,
      timestamp: this.timestamp,
    };
  }

  public getErrorResponse() {
    return {
      statusCode: this.getStatus(),
      message: this.message,
      error: this.name,
      code: this.code,
      timestamp: this.timestamp.toISOString(),
      path: this.context?.path,
      traceId: this.context?.requestId,
    };
  }
}
