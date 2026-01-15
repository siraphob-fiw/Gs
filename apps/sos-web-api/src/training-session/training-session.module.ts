import { forwardRef, Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { TenantModule } from '../tenant/tenant.module';
import { TrainingSessionController } from './controllers/training-session.controller';
import { TrainingSessionService } from './services/training-session.service';
import { TrainingSessionRepository } from './repositories/training-session.repository';
import { EmailModule } from '@/email/email.module';
import { RpeCalculationService } from './services/rpe-calculation.service';
import { StressMetricsService } from './services/stress-metrics.service';
import { WeightCalculationService } from './services/weight-calculation.service';
import { UserModule } from '@/user/user.module';

@Module({
  imports: [
    DatabaseModule,
    forwardRef(() => TenantModule),
    EmailModule,
    UserModule,
  ],
  controllers: [TrainingSessionController],
  providers: [
    TrainingSessionService,
    TrainingSessionRepository,
    RpeCalculationService,
    StressMetricsService,
    WeightCalculationService,
  ],
  exports: [
    TrainingSessionService,
    TrainingSessionRepository,
    StressMetricsService,
  ],
})
export class TrainingSessionModule {}
