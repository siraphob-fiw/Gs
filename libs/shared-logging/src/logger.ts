// Logger class moved from human-lift-training-api/src/Helpers/Commons.ts
import { LogLevel, LogData, ILogger } from './log-levels';

// Interface for log service (to be implemented by consuming applications)
export interface ILogService {
  create(dto: CreateLogDTO): Promise<void>;
}

export interface CreateLogDTO {
  logLevel: number;
  shortMessage: string;
  fullMessage?: string | null;
  ip?: string | null;
  url?: string | null;
  userAgent?: string | null;
  stackTrace?: string | null;
  errorException?: string | null;
}

export class Logger implements ILogger {
  constructor(private readonly _logService: ILogService) {}

  private async _createLog(
    logLevel: number,
    logData: LogData,
    stackTrace?: string,
    errorException?: string
  ): Promise<void> {
    const dto: CreateLogDTO = {
      logLevel: logLevel,
      shortMessage: logData.message,
      fullMessage: logData.fullMessage ?? null,
      ip: logData.ip ?? null,
      url: logData.url ?? null,
      userAgent: logData.userAgent ?? null,
      stackTrace: stackTrace ?? null,
      errorException: errorException ?? null,
    };

    await this._logService.create(dto);
    return Promise.resolve();
  }

  public async info(logData: LogData): Promise<void> {
    return this._createLog(LogLevel.Info, logData);
  }

  public async error(logData: LogData, stackTrace?: string, errorException?: string): Promise<void> {
    return this._createLog(LogLevel.Error, logData, stackTrace, errorException);
  }

  public async warning(logData: LogData): Promise<void> {
    return this._createLog(LogLevel.Warning, logData);
  }

  public async warn(logData: LogData): Promise<void> {
    return this._createLog(LogLevel.Warning, logData);
  }

  public async debug(logData: LogData): Promise<void> {
    return this._createLog(LogLevel.Debug, logData);
  }
}