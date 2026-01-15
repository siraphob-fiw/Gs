import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ExerciseController } from './constrollers/exercise.controller';
import { ExerciseRepository } from './repositories/exercise.repository';
import { ExerciseCacheService } from './services/exercise-cache.service';
import { ExerciseCacheSyncService } from './services/exercise-cache-sync.service';
import { SharedModule } from '../shared/shared.module';
import { DatabaseModule } from '../database/database.module';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [SharedModule, DatabaseModule, TenantModule, ScheduleModule.forRoot()],
  controllers: [ExerciseController],
  providers: [
    ExerciseRepository,
    ExerciseCacheService,
    ExerciseCacheSyncService,
  ],
  exports: [ExerciseRepository, ExerciseCacheService, ExerciseCacheSyncService],
})
export class ExerciseModule {}
