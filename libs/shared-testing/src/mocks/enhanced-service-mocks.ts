// Conditional Jest import for compatibility
declare const jest: any;
import { v4 as uuidv4 } from 'uuid';

export interface MockServiceOptions {
  enableLogging?: boolean;
  throwErrors?: boolean;
  responseDelay?: number;
  customResponses?: Record<string, any>;
}

export class MockServiceBase {
  protected options: MockServiceOptions;
  protected callHistory: Array<{ method: string; args: any[]; timestamp: Date }> = [];

  constructor(options: MockServiceOptions = {}) {
    this.options = {
      enableLogging: false,
      throwErrors: false,
      responseDelay: 0,
      customResponses: {},
      ...options
    };
  }

  protected logCall(method: string, args: any[]): void {
    if (this.options.enableLogging) {
      console.log(`MockService.${method} called with:`, args);
    }
    
    this.callHistory.push({
      method,
      args,
      timestamp: new Date()
    });
  }

  protected async simulateDelay(): Promise<void> {
    if (this.options.responseDelay && this.options.responseDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.options.responseDelay));
    }
  }

  protected getCustomResponse(method: string): any {
    return this.options.customResponses?.[method];
  }

  public getCallHistory(): Array<{ method: string; args: any[]; timestamp: Date }> {
    return [...this.callHistory];
  }

  public clearCallHistory(): void {
    this.callHistory = [];
  }

  public getCallCount(method?: string): number {
    if (method) {
      return this.callHistory.filter(call => call.method === method).length;
    }
    return this.callHistory.length;
  }

  public wasMethodCalled(method: string): boolean {
    return this.callHistory.some(call => call.method === method);
  }

  public getLastCall(method?: string): { method: string; args: any[]; timestamp: Date } | undefined {
    if (method) {
      const calls = this.callHistory.filter(call => call.method === method);
      return calls[calls.length - 1];
    }
    return this.callHistory[this.callHistory.length - 1];
  }
}

/**
 * Enhanced mock implementations for shared library services
 */
export class MockNotificationService extends MockServiceBase {
  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    this.logCall('sendEmail', [to, subject, body]);
    await this.simulateDelay();

    const customResponse = this.getCustomResponse('sendEmail');
    if (customResponse !== undefined) {
      return customResponse;
    }

    if (this.options.throwErrors) {
      throw new Error('Mock email sending failed');
    }

    return true;
  }

  async sendSMS(to: string, message: string): Promise<boolean> {
    this.logCall('sendSMS', [to, message]);
    await this.simulateDelay();

    const customResponse = this.getCustomResponse('sendSMS');
    if (customResponse !== undefined) {
      return customResponse;
    }

    if (this.options.throwErrors) {
      throw new Error('Mock SMS sending failed');
    }

    return true;
  }

  async sendPushNotification(userId: string, title: string, body: string): Promise<boolean> {
    this.logCall('sendPushNotification', [userId, title, body]);
    await this.simulateDelay();

    const customResponse = this.getCustomResponse('sendPushNotification');
    if (customResponse !== undefined) {
      return customResponse;
    }

    if (this.options.throwErrors) {
      throw new Error('Mock push notification failed');
    }

    return true;
  }

  async getNotificationHistory(userId: string): Promise<any[]> {
    this.logCall('getNotificationHistory', [userId]);
    await this.simulateDelay();

    const customResponse = this.getCustomResponse('getNotificationHistory');
    if (customResponse !== undefined) {
      return customResponse;
    }

    return [
      {
        id: uuidv4(),
        userId,
        type: 'email',
        subject: 'Test Email',
        sentAt: new Date(),
        status: 'delivered'
      }
    ];
  }
}

export class MockSecurityMonitoringService extends MockServiceBase {
  async logSecurityEvent(event: any): Promise<void> {
    this.logCall('logSecurityEvent', [event]);
    await this.simulateDelay();

    if (this.options.throwErrors) {
      throw new Error('Mock security logging failed');
    }
  }

  async trackFailedLogin(userId: string, ipAddress: string): Promise<void> {
    this.logCall('trackFailedLogin', [userId, ipAddress]);
    await this.simulateDelay();

    if (this.options.throwErrors) {
      throw new Error('Mock failed login tracking failed');
    }
  }

  async isBlocked(ipAddress: string): Promise<boolean> {
    this.logCall('isBlocked', [ipAddress]);
    await this.simulateDelay();

    const customResponse = this.getCustomResponse('isBlocked');
    if (customResponse !== undefined) {
      return customResponse;
    }

    return false;
  }

  async getSecurityEvents(userId?: string): Promise<any[]> {
    this.logCall('getSecurityEvents', [userId]);
    await this.simulateDelay();

    const customResponse = this.getCustomResponse('getSecurityEvents');
    if (customResponse !== undefined) {
      return customResponse;
    }

    return [];
  }
}

export class MockLoggerService extends MockServiceBase {
  private logs: Array<{ level: string; message: string; context?: any; timestamp: Date }> = [];

  log(message: string, context?: any): void {
    this.logCall('log', [message, context]);
    this.logs.push({ level: 'log', message, context, timestamp: new Date() });
  }

  error(message: string, trace?: string, context?: any): void {
    this.logCall('error', [message, trace, context]);
    this.logs.push({ level: 'error', message, context: { ...context, trace }, timestamp: new Date() });
  }

  warn(message: string, context?: any): void {
    this.logCall('warn', [message, context]);
    this.logs.push({ level: 'warn', message, context, timestamp: new Date() });
  }

  debug(message: string, context?: any): void {
    this.logCall('debug', [message, context]);
    this.logs.push({ level: 'debug', message, context, timestamp: new Date() });
  }

  verbose(message: string, context?: any): void {
    this.logCall('verbose', [message, context]);
    this.logs.push({ level: 'verbose', message, context, timestamp: new Date() });
  }

  // Test utility methods
  getLogs(level?: string): Array<{ level: string; message: string; context?: any; timestamp: Date }> {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  getLogCount(level?: string): number {
    if (level) {
      return this.logs.filter(log => log.level === level).length;
    }
    return this.logs.length;
  }

  hasLogMessage(message: string, level?: string): boolean {
    return this.logs.some(log => 
      log.message.includes(message) && (!level || log.level === level)
    );
  }
}

/**
 * Mock configuration utilities for different test scenarios
 */
export class MockConfigurationUtils {
  /**
   * Create mock configuration for unit tests
   */
  static forUnitTests(): MockServiceOptions {
    return {
      enableLogging: false,
      throwErrors: false,
      responseDelay: 0,
      customResponses: {}
    };
  }

  /**
   * Create mock configuration for integration tests
   */
  static forIntegrationTests(): MockServiceOptions {
    return {
      enableLogging: true,
      throwErrors: false,
      responseDelay: 10, // Small delay to simulate real service calls
      customResponses: {}
    };
  }

  /**
   * Create mock configuration for error testing
   */
  static forErrorTesting(): MockServiceOptions {
    return {
      enableLogging: true,
      throwErrors: true,
      responseDelay: 0,
      customResponses: {}
    };
  }

  /**
   * Create mock configuration with custom responses
   */
  static withCustomResponses(responses: Record<string, any>): MockServiceOptions {
    return {
      enableLogging: false,
      throwErrors: false,
      responseDelay: 0,
      customResponses: responses
    };
  }
}

// Factory functions for creating mock services
export function createEnhancedServiceMocks(options: MockServiceOptions = {}): {
  notificationService: MockNotificationService;
  securityMonitoringService: MockSecurityMonitoringService;
  loggerService: MockLoggerService;
} {
  return {
    notificationService: new MockNotificationService(options),
    securityMonitoringService: new MockSecurityMonitoringService(options),
    loggerService: new MockLoggerService(options)
  };
}

// Utility function to create mock service providers for NestJS testing
export function createEnhancedMockServiceProviders(options: MockServiceOptions = {}): any[] {
  const mocks = createEnhancedServiceMocks(options);
  
  return [
    { provide: 'NotificationService', useValue: mocks.notificationService },
    { provide: 'SecurityMonitoringService', useValue: mocks.securityMonitoringService },
    { provide: 'LoggerService', useValue: mocks.loggerService },
    { provide: 'ILogger', useValue: mocks.loggerService }
  ];
}

/**
 * Create Jest mock functions for services that match production interfaces
 */
export function createJestServiceMocks(): Record<string, any> {
  return {
    // Notification service mocks
    sendEmail: jest.fn().mockResolvedValue(true),
    sendSMS: jest.fn().mockResolvedValue(true),
    sendPushNotification: jest.fn().mockResolvedValue(true),
    getNotificationHistory: jest.fn().mockResolvedValue([]),

    // Security monitoring mocks
    logSecurityEvent: jest.fn().mockResolvedValue(undefined),
    trackFailedLogin: jest.fn().mockResolvedValue(undefined),
    isBlocked: jest.fn().mockResolvedValue(false),
    getSecurityEvents: jest.fn().mockResolvedValue([]),

    // Logger mocks
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn()
  };
}

// Reset all mock services
export function resetAllEnhancedMockServices(services: any[]): void {
  services.forEach(service => {
    if (service instanceof MockServiceBase) {
      service.clearCallHistory();
      if (service instanceof MockLoggerService) {
        service.clearLogs();
      }
    }
  });
}