import { Module } from '@nestjs/common';
import { LogsController } from './logs.controller';
import { ConsoleLogService } from '../shared/services/console-log.service';

@Module({
  controllers: [LogsController],
  providers: [ConsoleLogService],
  exports: [ConsoleLogService],
})
export class LogsModule {}
