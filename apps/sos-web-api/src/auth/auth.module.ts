import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { TenantRequiredGuard } from './guards/tenant-required.guard';
import { AuditLoggingInterceptor } from './interceptors/audit-logging.interceptor';
import { SecurityHeadersInterceptor } from './interceptors/security-headers.interceptor';
import { GoogleOAuthStrategy } from './strategies/google-oauth.strategy';
import { UserModule } from '@/user/user.module';
import { EmailModule } from '@/email/email.module';
import { TenantModule } from '@/tenant';
import { PasswordUtils } from '@strengthos/shared-security';

@Module({
  imports: [PassportModule, UserModule, EmailModule, TenantModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleOAuthStrategy,
    JwtAuthGuard,
    RolesGuard,
    TenantRequiredGuard,
    SecurityHeadersInterceptor,
    AuditLoggingInterceptor,
    // Provide PasswordUtils as a service
    {
      provide: PasswordUtils,
      useFactory: () => new PasswordUtils(),
    },
    // Global guards (order matters: JWT -> Roles -> TenantRequired)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantRequiredGuard,
    },
    // Global interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: SecurityHeadersInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLoggingInterceptor,
    },
  ],
  exports: [
    AuthService,
    JwtAuthGuard,
    RolesGuard,
    TenantRequiredGuard,
    PasswordUtils,
  ],
})
export class AuthModule {}
