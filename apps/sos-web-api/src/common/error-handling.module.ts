import { Module, Global } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { RequestLoggingInterceptor } from './interceptors/request-logging.interceptor';
import { SecurityModule } from '../shared/security/security.module';
// SharedLoggingModule not needed - using shared logging interfaces directly
import { SharedCacheModule } from '../shared/cache/cache.module';

@Global()
@Module({
  imports: [SecurityModule, SharedCacheModule],
  providers: [
    // Regular providers for export
    GlobalExceptionFilter,
    RateLimitGuard,
    RequestLoggingInterceptor,
    // Global exception filter
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    // Global rate limiting guard
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
    // Global request logging interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggingInterceptor,
    },
  ],
  exports: [GlobalExceptionFilter, RateLimitGuard, RequestLoggingInterceptor],
})
export class ErrorHandlingModule {}
