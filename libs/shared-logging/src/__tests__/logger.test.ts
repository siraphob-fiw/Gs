import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Logger, ILogService, CreateLogDTO } from '../logger';
import { LogLevel, LogData } from '../log-levels';

describe('Logger', () => {
  let mockLogService: ILogService;
  let logger: Logger;

  beforeEach(() => {
    mockLogService = {
      create: vi.fn().mockResolvedValue(undefined),
    };
    logger = new Logger(mockLogService);
  });

  describe('info logging', () => {
    it('should log info messages correctly', async () => {
      const logData: LogData = {
        message: 'Test info message',
        url: '/api/test',
        ip: '127.0.0.1',
      };

      await logger.info(logData);

      expect(mockLogService.create).toHaveBeenCalledWith({
        logLevel: LogLevel.Info,
        shortMessage: 'Test info message',
        fullMessage: null,
        ip: '127.0.0.1',
        url: '/api/test',
        userAgent: null,
        stackTrace: null,
        errorException: null,
      });
    });
  });

  describe('error logging', () => {
    it('should log error messages with optional stack trace', async () => {
      const logData: LogData = {
        message: 'Test error message',
        fullMessage: 'Detailed error information',
      };
      const stackTrace = 'Error stack trace';
      const errorException = 'Exception details';

      await logger.error(logData, stackTrace, errorException);

      expect(mockLogService.create).toHaveBeenCalledWith({
        logLevel: LogLevel.Error,
        shortMessage: 'Test error message',
        fullMessage: 'Detailed error information',
        ip: null,
        url: null,
        userAgent: null,
        stackTrace: 'Error stack trace',
        errorException: 'Exception details',
      });
    });
  });

  describe('warning logging', () => {
    it('should log warning messages correctly', async () => {
      const logData: LogData = {
        message: 'Test warning message',
        userId: 'user123',
        tenantId: 'tenant456',
      };

      await logger.warning(logData);

      expect(mockLogService.create).toHaveBeenCalledWith({
        logLevel: LogLevel.Warning,
        shortMessage: 'Test warning message',
        fullMessage: null,
        ip: null,
        url: null,
        userAgent: null,
        stackTrace: null,
        errorException: null,
      });
    });

    it('should support warn alias', async () => {
      const logData: LogData = {
        message: 'Test warn message',
      };

      await logger.warn(logData);

      expect(mockLogService.create).toHaveBeenCalledWith({
        logLevel: LogLevel.Warning,
        shortMessage: 'Test warn message',
        fullMessage: null,
        ip: null,
        url: null,
        userAgent: null,
        stackTrace: null,
        errorException: null,
      });
    });
  });

  describe('debug logging', () => {
    it('should log debug messages correctly', async () => {
      const logData: LogData = {
        message: 'Test debug message',
        userAgent: 'Mozilla/5.0 Test Browser',
        requestId: 'req-123',
      };

      await logger.debug(logData);

      expect(mockLogService.create).toHaveBeenCalledWith({
        logLevel: LogLevel.Debug,
        shortMessage: 'Test debug message',
        fullMessage: null,
        ip: null,
        url: null,
        userAgent: 'Mozilla/5.0 Test Browser',
        stackTrace: null,
        errorException: null,
      });
    });
  });

  describe('log service interaction', () => {
    it('should handle log service errors gracefully', async () => {
      const error = new Error('Log service unavailable');
      mockLogService.create = vi.fn().mockRejectedValue(error);

      const logData: LogData = { message: 'Test message' };

      await expect(logger.info(logData)).rejects.toThrow('Log service unavailable');
    });
  });
});
