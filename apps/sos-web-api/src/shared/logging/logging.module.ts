import { Module } from '@nestjs/common';
import { Logger, ILogger } from '@strengthos/shared-logging';
import { ConsoleLogService } from '../services/console-log.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule], // Import DatabaseModule to access DATABASE_SERVICE and ConsoleLogService
  providers: [
    {
      provide: 'ILogger',
      useFactory: (logService: ConsoleLogService): ILogger => {
        return new Logger(logService);
      },
      inject: [ConsoleLogService],
    },
  ],
  exports: ['ILogger'],
})
export class LoggingModule {}
