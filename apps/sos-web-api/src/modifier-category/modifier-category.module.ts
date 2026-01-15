import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ModifierCategoryController } from './controllers/modifier-category.controller';
import { ModifierCategoryService } from './services/modifier-category.service';
import { ModifierCategoryCacheService } from './services/modifier-category-cache.service';
import { ModifierCategoryCacheSyncService } from './services/modifier-category-cache-sync.service';
import { DatabaseModule } from '../database/database.module';
import { ModifierCategoryRepository } from './repositories/modifier-category.repositiory';
import { SharedModule } from '@/shared/shared.module';

@Module({
  imports: [DatabaseModule, SharedModule, ScheduleModule.forRoot()],
  controllers: [ModifierCategoryController],
  providers: [
    ModifierCategoryService,
    ModifierCategoryCacheService,
    ModifierCategoryCacheSyncService,
    ModifierCategoryRepository,
  ],
  exports: [
    ModifierCategoryService,
    ModifierCategoryCacheService,
    ModifierCategoryCacheSyncService,
  ],
})
export class ModifierCategoryModule {}
