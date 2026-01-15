import { ILogService, CreateLogDTO } from '@strengthos/shared-logging';

export class ConsoleLogService implements ILogService {
  async create(dto: CreateLogDTO): Promise<void> {
    const timestamp = new Date().toISOString();
    const level = this.getLevelName(dto.logLevel);

    // console.log(`[${timestamp}] ${level}: ${dto.shortMessage}`, {
    //   fullMessage: dto.fullMessage,
    //   ip: dto.ip,
    //   url: dto.url,
    //   userAgent: dto.userAgent,
    //   stackTrace: dto.stackTrace,
    //   errorException: dto.errorException,
    // });
  }

  private getLevelName(level: number): string {
    switch (level) {
      case 1:
        return 'DEBUG';
      case 2:
        return 'INFO';
      case 3:
        return 'WARNING';
      case 4:
        return 'ERROR';
      default:
        return 'UNKNOWN';
    }
  }
}

export const consoleLogService = new ConsoleLogService();
