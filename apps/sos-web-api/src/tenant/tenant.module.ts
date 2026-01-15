import {
  Module,
  MiddlewareConsumer,
  NestModule,
  forwardRef,
} from '@nestjs/common';
import { TenantController } from './controllers/tenant.controller';
import { TenantUserManagementController } from './controllers/tenant-user-management.controller';
import { CoachAdminController } from './controllers/coach-admin.controller';
import { TenantService } from './services/tenant.service';
import { TenantUserManagementService } from './services/tenant-user-management.service';
import { CoachAdminService } from './services/coach-admin.service';
import { TenantRepository } from './repositories/tenant.repository';
import { TenantContextService } from './services/tenant-context.service';
import { TenantAwareDatabaseService } from './services/tenant-aware-database.service';
import { TenantContextMiddleware } from './middleware/tenant-context.middleware';
import { TenantAccessGuard } from './guards/tenant-access.guard';
import { TenantIsolationInterceptor } from './interceptors/tenant-isolation.interceptor';
import { DatabaseModule } from '../database/database.module';
import { UserModule } from '../user/user.module';
import { AuthService } from '@/auth/auth.service';
import { EmailModule } from '@/email';
import { AuthModule } from '@/auth/auth.module';

@Module({
  imports: [
    DatabaseModule,
    forwardRef(() => UserModule),
    forwardRef(() => AuthModule),
    EmailModule,
  ],
  controllers: [
    TenantController,
    TenantUserManagementController,
    CoachAdminController,
  ],
  providers: [
    TenantService,
    TenantUserManagementService,
    CoachAdminService,
    TenantRepository,
    TenantContextService,
    TenantAwareDatabaseService,
    TenantAccessGuard,
    TenantIsolationInterceptor,
    TenantContextMiddleware,
    AuthService,
  ],
  exports: [
    TenantService,
    TenantUserManagementService,
    CoachAdminService,
    TenantRepository,
    TenantContextService,
    TenantAwareDatabaseService,
    TenantAccessGuard,
    TenantIsolationInterceptor,
  ],
})
export class TenantModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantContextMiddleware).forRoutes('*'); // Apply to all routes
  }
}
