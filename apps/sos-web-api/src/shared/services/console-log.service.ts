import { Injectable, Logger } from '@nestjs/common';
import { ILogService, CreateLogDTO } from '@strengthos/shared-logging';

@Injectable()
export class ConsoleLogService implements ILogService {
  async create(dto: CreateLogDTO): Promise<void> {
    const timestamp = new Date();
    const logLevelName = this.getLogLevelName(dto.logLevel);

    // Format the log message
    let message = `[${timestamp}] ${logLevelName}: ${dto.shortMessage}`;

    if (dto.fullMessage) {
      message += ` - ${dto.fullMessage}`;
    }

    if (dto.url) {
      message += ` (URL: ${dto.url})`;
    }

    if (dto.ip) {
      message += ` (IP: ${dto.ip})`;
    }

    // Output based on log level
    switch (dto.logLevel) {
      case 1: // Info
        Logger.log(message);
        break;
      case 2: // Warning
        Logger.warn(message);
        break;
      case 3: // Debug
        Logger.debug(message);
        break;
      case 10: // Error
        Logger.error(message);
        if (dto.stackTrace) {
          Logger.error('Stack trace:', dto.stackTrace);
        }
        if (dto.errorException) {
          Logger.error('Exception:', dto.errorException);
        }
        break;
      default:
        Logger.log(message);
    }
  }

  private getLogLevelName(level: number): string {
    switch (level) {
      case 1:
        return 'INFO';
      case 2:
        return 'WARN';
      case 3:
        return 'DEBUG';
      case 10:
        return 'ERROR';
      default:
        return 'LOG';
    }
  }
}
