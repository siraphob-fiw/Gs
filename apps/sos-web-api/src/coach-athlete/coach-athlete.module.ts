import { Module } from '@nestjs/common';
import { CoachAthleteController } from './controllers/coach-athlete.controller';
import { CoachDiscoveryController } from './controllers/coach-discovery.controller';
import { CoachAthleteService } from './services/coach-athlete.service';
import { CoachTransitionService } from './services/coach-transition.service';
import { CoachDiscoveryService } from './services/coach-discovery.service';
import { CoachAthleteRepository } from './repositories/coach-athlete.repository';
import { TransitionRequestRepository } from './repositories/transition-request.repository';
import { CoachDiscoveryRepository } from './repositories/coach-discovery.repository';
import { CoachRequestRepository } from './repositories/coach-request.repository';
import { SharedModule } from '../shared/shared.module';
import { TenantModule } from '../tenant/tenant.module';
import { UserModule } from '../user/user.module';
import { TrainingBlockService } from '@/training-block/services/training-block.service';
import { TrainingBlockRepository } from '@/training-block/repositories/training-block.repository';
import { TrainingSessionService } from '@/training-session/services/training-session.service';
import { TrainingSessionRepository } from '@/training-session/repositories/training-session.repository';
import { EmailModule } from '@/email';
import { DatabaseService } from '../database/database.service';
import { RpeCalculationService } from '@/training-session/services/rpe-calculation.service';
import { WeightCalculationService } from '@/training-session/services/weight-calculation.service';
import { StressMetricsService } from '@/training-session/services/stress-metrics.service';
@Module({
  imports: [
    SharedModule,
    // forwardRef(() => NotificationModule),
    TenantModule,
    UserModule,
    EmailModule,
  ],
  controllers: [CoachAthleteController, CoachDiscoveryController],
  providers: [
    CoachAthleteService,
    CoachTransitionService,
    CoachDiscoveryService,
    CoachAthleteRepository,
    TransitionRequestRepository,
    CoachDiscoveryRepository,
    CoachRequestRepository,
    TrainingBlockService,
    TrainingBlockRepository,
    TrainingSessionService,
    TrainingSessionRepository,
    DatabaseService,
    RpeCalculationService,
    StressMetricsService,
    WeightCalculationService,
  ],
  exports: [CoachAthleteService, CoachTransitionService, CoachDiscoveryService],
})
export class CoachAthleteModule {}
