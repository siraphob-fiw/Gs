import { Module } from '@nestjs/common';
import { AdminController } from './controllers/admin.controller';
import { SuperAdminController } from './controllers/super-admin.controller';
import { AdminService } from './services/admin.service';
import { SuperAdminService } from './services/super-admin.service';
import { SystemConfigService } from './services/system-config.service';
import { AdminReportingService } from './services/admin-reporting.service';
import { AdminRepository } from './repositories/admin.repository';
import { SystemConfigRepository } from './repositories/system-config.repository';
import { SharedModule } from '../shared/shared.module';
import { UserModule } from '../user/user.module';
import { TenantModule } from '../tenant/tenant.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [SharedModule, UserModule, TenantModule, DatabaseModule],
  controllers: [AdminController, SuperAdminController],
  providers: [
    AdminService,
    SuperAdminService,
    SystemConfigService,
    AdminReportingService,
    AdminRepository,
    SystemConfigRepository,
  ],
  exports: [
    AdminService,
    SuperAdminService,
    SystemConfigService,
    AdminReportingService,
  ],
})
export class AdminModule {}
