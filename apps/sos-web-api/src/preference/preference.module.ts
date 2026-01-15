import { Module } from '@nestjs/common';
import { PreferenceController } from './controllers/preference.controller';
import { PreferenceService } from './services/preference.service';
import { PreferenceValidationService } from './services/preference-validation.service';
import { PreferenceRepository } from './repositories/preference.repository';
import { SharedModule } from '../shared/shared.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [SharedModule, UserModule],
  controllers: [PreferenceController],
  providers: [
    PreferenceService,
    PreferenceValidationService,
    PreferenceRepository,
  ],
  exports: [PreferenceService, PreferenceValidationService],
})
export class PreferenceModule {}
