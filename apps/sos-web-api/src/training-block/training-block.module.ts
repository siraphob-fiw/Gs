import { forwardRef, Module } from '@nestjs/common';
import { TrainingBlockController } from './controllers/training-block.controller';
import { TrainingBlockService } from './services/training-block.service';
import { TrainingBlockRepository } from './repositories/training-block.repository';
import { WorkoutSummaryService } from './services/workout-summary.service';
import { DatabaseModule } from '../database/database.module';
import { TenantModule } from '../tenant/tenant.module';
import { TrainingSessionModule } from '../training-session/training-session.module';

@Module({
  imports: [
    DatabaseModule,
    forwardRef(() => TenantModule),
    forwardRef(() => TrainingSessionModule),
  ],
  controllers: [TrainingBlockController],
  providers: [
    TrainingBlockService,
    TrainingBlockRepository,
    WorkoutSummaryService,
  ],
  exports: [
    TrainingBlockService,
    TrainingBlockRepository,
    WorkoutSummaryService,
  ],
})
export class TrainingBlockModule {}
