import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ModifierController } from './controllers/modifier.controller';
import { ModifierService } from './services/modifier.service';
import { ModifierCacheService } from './services/modifier-cache.service';
import { ModifierCacheSyncService } from './services/modifier-cache-sync.service';
import { ModifierRepository } from './repositories/modifier.repository';
import { DatabaseModule } from '../database/database.module';
import { UserService } from '@/user/services/user.service';
import { UserRepository } from '@/user/repositories/user.repository';
import { UserModule } from '@/user/user.module';
import { TenantContextService } from '@/tenant/services/tenant-context.service';
import { TenantRepository } from '@/tenant';
import { SharedModule } from '@/shared/shared.module';

@Module({
  imports: [DatabaseModule, UserModule, SharedModule, ScheduleModule.forRoot()],
  controllers: [ModifierController],
  providers: [
    ModifierService,
    ModifierCacheService,
    ModifierCacheSyncService,
    ModifierRepository,
    UserService,
    UserRepository,
    TenantContextService,
    TenantRepository,
  ],
  exports: [ModifierService, ModifierCacheService, ModifierCacheSyncService],
})
export class ModifierModule {}
