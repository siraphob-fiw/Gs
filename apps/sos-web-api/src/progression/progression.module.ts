import { forwardRef, Module } from '@nestjs/common';
import { ProgressionController } from './controllers/progression.controller';
import { ProgressionService } from './services/progression.service';
import { ProgressionRepository } from './repositories/progression.repositorie';
import { DatabaseModule } from '../database/database.module';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [DatabaseModule, forwardRef(() => TenantModule)],
  controllers: [ProgressionController],
  providers: [ProgressionService, ProgressionRepository],
  exports: [ProgressionService, ProgressionRepository],
})
export class ProgressionModule {}
