import { Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AuthenticationService,
  AccessControlService,
  SecurityMonitoringService,
  JwtService,
  PasswordUtils,
  createJwtService,
  createPasswordUtils,
} from '@strengthos/shared-security';
import { IDb } from '@strengthos/shared-database';
import { ILogger } from '@strengthos/shared-logging';

// JWT Service provider
const JwtServiceProvider: Provider = {
  provide: 'JwtService',
  useFactory: (configService: ConfigService): JwtService => {
    return createJwtService({
      secret: configService.get<string>(
        'JWT_SECRET',
        'default-secret-change-in-production',
      ),
      algorithm: configService.get<string>('JWT_ALGORITHM', 'HS256'),
      expiresIn: configService.get<string>('JWT_EXPIRES_IN', '24h'),
      issuer: configService.get<string>('JWT_ISSUER', 'strengthos'),
      audience: configService.get<string>('JWT_AUDIENCE', 'strengthos-api'),
    });
  },
  inject: [ConfigService],
};

// Password Utils provider
const PasswordUtilsProvider: Provider = {
  provide: 'PasswordUtils',
  useFactory: (): PasswordUtils => {
    return createPasswordUtils({
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      saltRounds: 12,
    });
  },
};

// Authentication service provider
const AuthenticationServiceProvider: Provider = {
  provide: 'AuthenticationService',
  useFactory: (
    db: IDb,
    jwtService: JwtService,
    passwordUtils: PasswordUtils,
    logger: ILogger,
  ): AuthenticationService => {
    return new AuthenticationService(db, jwtService, passwordUtils, logger);
  },
  inject: ['IDb', 'JwtService', 'PasswordUtils', 'ILogger'],
};

// Access control service provider
const AccessControlServiceProvider: Provider = {
  provide: 'AccessControlService',
  useFactory: (db: IDb, logger: ILogger): AccessControlService => {
    return new AccessControlService(db, logger);
  },
  inject: ['IDb', 'ILogger'],
};

// Security monitoring service provider
const SecurityMonitoringServiceProvider: Provider = {
  provide: 'SecurityMonitoringService',
  useFactory: (db: IDb, logger: ILogger): SecurityMonitoringService => {
    return new SecurityMonitoringService(db, logger);
  },
  inject: ['IDb', 'ILogger'],
};

@Module({
  providers: [
    JwtServiceProvider,
    PasswordUtilsProvider,
    AuthenticationServiceProvider,
    AccessControlServiceProvider,
    SecurityMonitoringServiceProvider,
  ],
  exports: [
    'JwtService',
    'PasswordUtils',
    'AuthenticationService',
    'AccessControlService',
    'SecurityMonitoringService',
  ],
})
export class SecurityModule {}
