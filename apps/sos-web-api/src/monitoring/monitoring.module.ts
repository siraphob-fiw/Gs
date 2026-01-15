import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConnectionMonitoringService } from './connection-monitoring.service';

@Module({
  imports: [ConfigModule],
  providers: [ConnectionMonitoringService],
  exports: [ConnectionMonitoringService],
})
export class MonitoringModule {}
