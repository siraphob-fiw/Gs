// Log levels and types moved from human-lift-training-api/src/Helpers/Commons.ts

export enum LogLevel {
  Info = 1,
  Warning = 2,
  Debug = 3,
  Error = 10
}

export interface LogData {
  message: string;
  fullMessage?: string | null;
  ip?: string | null;
  url?: string | null;
  userAgent?: string | null;
  stackTrace?: string | null;
  innerException?: string | null;
  userId?: string;
  tenantId?: string;
  requestId?: string;
  [key: string]: any;
}

export interface ILogger {
  info(logData: LogData): Promise<void>;
  error(logData: LogData, stackTrace?: string, innerException?: string): Promise<void>;
  warning(logData: LogData): Promise<void>;
  warn(logData: LogData): Promise<void>;
  debug(logData: LogData): Promise<void>;
}