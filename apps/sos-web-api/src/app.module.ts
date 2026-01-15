import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SharedModule } from './shared/shared.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { MiddlewareModule } from './middleware/middleware.module';
import { UserModule } from './user/user.module';
import { TenantModule } from './tenant/tenant.module';
import { TypesModule } from './types/types.module';
import { CoachAthleteModule } from './coach-athlete/coach-athlete.module';
import { AdminModule } from './admin/admin.module';
import { PreferenceModule } from './preference/preference.module';
import { ExerciseModule } from './exercise/exercise.module';
import { ErrorHandlingModule } from './common/error-handling.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { configValidationSchema } from './config/config.validation';
import { LogsModule } from './logsModule/logs.module';
import { TrainingBlockModule } from './training-block/training-block.module';
import { EmailModule } from './email/email.module';
import { TrainingSessionModule } from './training-session/training-session.module';
import { ModifierModule } from './modifier/modifier.module';
import { ModifierCategoryModule } from './modifier-category/modifier-category.module';
import { ProgressionModule } from './progression/progression.module';
import { CmsModule } from './cms/cms.module';
import { ExerciseCategoryModule } from './exercise-category/exercise-category.module';
import { GlobalSettingModule } from './global-setting/global-setting.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      validationSchema: configValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),

    DatabaseModule,

    TerminusModule,

    SharedModule,

    ErrorHandlingModule,
    MiddlewareModule,

    MonitoringModule,

    TypesModule,

    AuthModule,
    UserModule,
    TenantModule,
    CoachAthleteModule,
    AdminModule,
    PreferenceModule,
    ExerciseModule,
    LogsModule,
    TrainingBlockModule,
    EmailModule,
    TrainingSessionModule,
    ModifierModule,
    ModifierCategoryModule,
    ProgressionModule,
    CmsModule,
    ExerciseCategoryModule,
    GlobalSettingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
