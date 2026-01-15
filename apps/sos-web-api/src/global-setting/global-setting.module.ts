import { Module } from '@nestjs/common';
import { GlobalSettingController } from './controllers/global-setting.controller';
import { GlobalSettingService } from './services/global-setting.service';
import { GlobalSettingRepository } from './repositories/global-setting.repository';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [GlobalSettingController],
  providers: [GlobalSettingService, GlobalSettingRepository],
  exports: [GlobalSettingService],
})
export class GlobalSettingModule {}
