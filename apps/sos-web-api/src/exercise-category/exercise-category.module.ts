import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ExerciseCategoryController } from './controllers/exercise-category.controller';
import { ExerciseCategoryService } from './services/exercise-category.service';
import { ExerciseCategoryCacheService } from './services/exercise-category-cache.service';
import { ExerciseCategoryCacheSyncService } from './services/exercise-category-cache-sync.service';
import { ExerciseCategoryRepository } from './repositories/exercise-category.repository';
import { DatabaseModule } from '../database/database.module';
import { SharedModule } from '@/shared/shared.module';

@Module({
  imports: [DatabaseModule, SharedModule, ScheduleModule.forRoot()],
  controllers: [ExerciseCategoryController],
  providers: [
    ExerciseCategoryService,
    ExerciseCategoryCacheService,
    ExerciseCategoryCacheSyncService,
    ExerciseCategoryRepository,
  ],
  exports: [
    ExerciseCategoryService,
    ExerciseCategoryCacheService,
    ExerciseCategoryCacheSyncService,
  ],
})
export class ExerciseCategoryModule {}
