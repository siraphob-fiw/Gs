import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Response } from 'express';

@Injectable()
export class SecurityHeadersInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      tap(() => {
        // Check if response headers have already been sent (e.g., redirect)
        if (response.headersSent) {
          return;
        }

        // Security headers
        response.setHeader('X-Content-Type-Options', 'nosniff');
        response.setHeader('X-Frame-Options', 'DENY');
        response.setHeader('X-XSS-Protection', '1; mode=block');
        // response.setHeader(
        //   'Referrer-Policy',
        //   'strict-origin-when-cross-origin',
        // );
        response.setHeader(
          'Permissions-Policy',
          'geolocation=(), microphone=(), camera=()',
        );

        // HSTS (HTTP Strict Transport Security)
        if (process.env.NODE_ENV === 'production') {
          response.setHeader(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains; preload',
          );
        }

        // Content Security Policy (basic)
        response.setHeader(
          'Content-Security-Policy',
          "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';",
        );

        // Remove server information
        response.removeHeader('X-Powered-By');
      }),
    );
  }
}
