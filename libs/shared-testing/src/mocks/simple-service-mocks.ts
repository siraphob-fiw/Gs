/**
 * Simplified service mocks that work with both Jest and Vitest
 * These provide mock implementations for common shared library services
 */

// Dynamic mock framework detection
let mockFn: any;
try {
  mockFn = require('vitest').vi.fn;
} catch {
  try {
    mockFn = require('@jest/globals').jest.fn;
  } catch {
    // Fallback mock implementation that actually works
    mockFn = () => {
      let implementation: any = null;
      let returnValue: any = undefined;
      let resolvedValue: any = undefined;
      let rejectedValue: any = undefined;
      const calls: any[][] = [];
      
      const fn = (...args: any[]) => {
        calls.push(args);
        if (implementation) {
          return implementation(...args);
        }
        if (resolvedValue !== undefined) {
          return Promise.resolve(resolvedValue);
        }
        if (rejectedValue !== undefined) {
          return Promise.reject(rejectedValue);
        }
        return returnValue;
      };
      
      fn.mockImplementation = (impl: any) => { implementation = impl; return fn; };
      fn.mockReturnValue = (value: any) => { returnValue = value; return fn; };
      fn.mockResolvedValue = (value: any) => { resolvedValue = value; return fn; };
      fn.mockRejectedValue = (value: any) => { rejectedValue = value; return fn; };
      fn.getMockImplementation = () => implementation;
      fn.mockClear = () => { calls.length = 0; return fn; };
      
      // Add mock property for compatibility
      fn.mock = {
        get calls() { return calls; }
      };
      
      return fn;
    };
  }
}

/**
 * Mock notification service for testing email, SMS, and push notifications
 */
export function createMockNotificationService(): any {
  const sentNotifications: any[] = [];

  return {
    sendEmail: mockFn().mockImplementation((to: string, subject: string, body: string, options?: any) => {
      const notification = {
        type: 'email',
        to,
        subject,
        body,
        options,
        timestamp: new Date(),
        id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
      sentNotifications.push(notification);
      return Promise.resolve({ success: true, id: notification.id });
    }),

    sendSMS: mockFn().mockImplementation((to: string, message: string, options?: any) => {
      const notification = {
        type: 'sms',
        to,
        message,
        options,
        timestamp: new Date(),
        id: `sms-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
      sentNotifications.push(notification);
      return Promise.resolve({ success: true, id: notification.id });
    }),

    sendPushNotification: mockFn().mockImplementation((userId: string, title: string, body: string, options?: any) => {
      const notification = {
        type: 'push',
        userId,
        title,
        body,
        options,
        timestamp: new Date(),
        id: `push-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
      sentNotifications.push(notification);
      return Promise.resolve({ success: true, id: notification.id });
    }),

    sendBulkEmail: mockFn().mockImplementation((recipients: string[], subject: string, body: string) => {
      const notifications = recipients.map(to => ({
        type: 'email',
        to,
        subject,
        body,
        timestamp: new Date(),
        id: `bulk-email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }));
      sentNotifications.push(...notifications);
      return Promise.resolve({ success: true, sent: notifications.length });
    }),

    // Template-based notifications
    sendTemplateEmail: mockFn().mockImplementation((to: string, templateId: string, data: any) => {
      const notification = {
        type: 'template-email',
        to,
        templateId,
        data,
        timestamp: new Date(),
        id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
      sentNotifications.push(notification);
      return Promise.resolve({ success: true, id: notification.id });
    }),

    // Test utilities
    _getSentNotifications: () => [...sentNotifications],
    _getNotificationsByType: (type: string) => sentNotifications.filter(n => n.type === type),
    _getNotificationsForRecipient: (recipient: string) => 
      sentNotifications.filter(n => n.to === recipient || n.userId === recipient),
    _clearNotifications: () => { sentNotifications.length = 0; },
    _getNotificationCount: () => sentNotifications.length
  };
}

/**
 * Mock cache service for testing caching operations
 */
export function createMockCacheService(): any {
  const cache = new Map<string, { value: any; expiry?: number }>();

  return {
    get: mockFn().mockImplementation((key: string) => {
      const item = cache.get(key);
      if (!item) return Promise.resolve(null);
      
      if (item.expiry && Date.now() > item.expiry) {
        cache.delete(key);
        return Promise.resolve(null);
      }
      
      return Promise.resolve(item.value);
    }),

    set: mockFn().mockImplementation((key: string, value: any, ttlSeconds?: number) => {
      const expiry = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : undefined;
      cache.set(key, { value, expiry });
      return Promise.resolve(true);
    }),

    del: mockFn().mockImplementation((key: string) => {
      const existed = cache.has(key);
      cache.delete(key);
      return Promise.resolve(existed);
    }),

    exists: mockFn().mockImplementation((key: string) => {
      const item = cache.get(key);
      if (!item) return Promise.resolve(false);
      
      if (item.expiry && Date.now() > item.expiry) {
        cache.delete(key);
        return Promise.resolve(false);
      }
      
      return Promise.resolve(true);
    }),

    clear: mockFn().mockImplementation(() => {
      cache.clear();
      return Promise.resolve(true);
    }),

    keys: mockFn().mockImplementation((pattern?: string) => {
      const allKeys = Array.from(cache.keys());
      if (!pattern) return Promise.resolve(allKeys);
      
      // Simple pattern matching (supports * wildcard)
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      const matchingKeys = allKeys.filter(key => regex.test(key));
      return Promise.resolve(matchingKeys);
    }),

    ttl: mockFn().mockImplementation((key: string) => {
      const item = cache.get(key);
      if (!item || !item.expiry) return Promise.resolve(-1);
      
      const remaining = Math.max(0, Math.floor((item.expiry - Date.now()) / 1000));
      return Promise.resolve(remaining);
    }),

    // Atomic operations
    incr: mockFn().mockImplementation((key: string, amount: number = 1) => {
      const current = cache.get(key)?.value || 0;
      const newValue = (typeof current === 'number' ? current : 0) + amount;
      cache.set(key, { value: newValue });
      return Promise.resolve(newValue);
    }),

    decr: mockFn().mockImplementation((key: string, amount: number = 1) => {
      const current = cache.get(key)?.value || 0;
      const newValue = (typeof current === 'number' ? current : 0) - amount;
      cache.set(key, { value: newValue });
      return Promise.resolve(newValue);
    }),

    // Test utilities
    _getCache: () => new Map(cache),
    _getCacheSize: () => cache.size,
    _simulateExpiry: (key: string) => {
      const item = cache.get(key);
      if (item) {
        cache.set(key, { ...item, expiry: Date.now() - 1 });
      }
    }
  };
}

/**
 * Mock monitoring service for testing metrics and logging
 */
export function createMockMonitoringService(): any {
  const metrics: any[] = [];
  const logs: any[] = [];
  const alerts: any[] = [];

  return {
    // Metrics
    recordMetric: mockFn().mockImplementation((name: string, value: number, tags?: Record<string, string>) => {
      metrics.push({
        name,
        value,
        tags: tags || {},
        timestamp: new Date()
      });
      return Promise.resolve(true);
    }),

    incrementCounter: mockFn().mockImplementation((name: string, tags?: Record<string, string>) => {
      metrics.push({
        name,
        value: 1,
        type: 'counter',
        tags: tags || {},
        timestamp: new Date()
      });
      return Promise.resolve(true);
    }),

    recordTiming: mockFn().mockImplementation((name: string, duration: number, tags?: Record<string, string>) => {
      metrics.push({
        name,
        value: duration,
        type: 'timing',
        tags: tags || {},
        timestamp: new Date()
      });
      return Promise.resolve(true);
    }),

    // Logging
    log: mockFn().mockImplementation((level: string, message: string, context?: any) => {
      logs.push({
        level,
        message,
        context: context || {},
        timestamp: new Date()
      });
      return Promise.resolve(true);
    }),

    error: mockFn().mockImplementation((message: string, error?: Error, context?: any) => {
      logs.push({
        level: 'error',
        message,
        error: error?.message,
        stack: error?.stack,
        context: context || {},
        timestamp: new Date()
      });
      return Promise.resolve(true);
    }),

    warn: mockFn().mockImplementation((message: string, context?: any) => {
      logs.push({
        level: 'warn',
        message,
        context: context || {},
        timestamp: new Date()
      });
      return Promise.resolve(true);
    }),

    info: mockFn().mockImplementation((message: string, context?: any) => {
      logs.push({
        level: 'info',
        message,
        context: context || {},
        timestamp: new Date()
      });
      return Promise.resolve(true);
    }),

    debug: mockFn().mockImplementation((message: string, context?: any) => {
      logs.push({
        level: 'debug',
        message,
        context: context || {},
        timestamp: new Date()
      });
      return Promise.resolve(true);
    }),

    // Alerts
    sendAlert: mockFn().mockImplementation((severity: string, message: string, context?: any) => {
      const alert = {
        severity,
        message,
        context: context || {},
        timestamp: new Date(),
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
      alerts.push(alert);
      return Promise.resolve({ success: true, id: alert.id });
    }),

    // Health checks
    healthCheck: mockFn().mockResolvedValue({
      status: 'healthy',
      timestamp: new Date(),
      checks: {
        database: 'healthy',
        cache: 'healthy',
        external_apis: 'healthy'
      }
    }),

    // Test utilities
    _getMetrics: () => [...metrics],
    _getLogs: () => [...logs],
    _getAlerts: () => [...alerts],
    _getMetricsByName: (name: string) => metrics.filter(m => m.name === name),
    _getLogsByLevel: (level: string) => logs.filter(l => l.level === level),
    _clearMetrics: () => { metrics.length = 0; },
    _clearLogs: () => { logs.length = 0; },
    _clearAlerts: () => { alerts.length = 0; },
    _clearAll: () => {
      metrics.length = 0;
      logs.length = 0;
      alerts.length = 0;
    }
  };
}

/**
 * Mock security service for testing authentication and authorization
 */
export function createMockSecurityService(): any {
  const securityEvents: any[] = [];
  const sessions: Map<string, any> = new Map();
  const tokens: Map<string, any> = new Map();

  return {
    // Authentication
    authenticate: mockFn().mockImplementation((credentials: any) => {
      const { username, password } = credentials;
      
      // Simple mock authentication logic
      if (username === 'test@example.com' && password === 'password123') {
        const token = `mock-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const user = {
          id: 'user-123',
          email: username,
          role: 'user',
          tenantId: 'tenant-123'
        };
        
        tokens.set(token, { user, expiresAt: Date.now() + (60 * 60 * 1000) }); // 1 hour
        
        return Promise.resolve({
          success: true,
          token,
          user,
          expiresAt: new Date(Date.now() + (60 * 60 * 1000))
        });
      }
      
      return Promise.resolve({ success: false, error: 'Invalid credentials' });
    }),

    validateToken: mockFn().mockImplementation((token: string) => {
      const tokenData = tokens.get(token);
      if (!tokenData) {
        return Promise.resolve({ valid: false, error: 'Token not found' });
      }
      
      if (Date.now() > tokenData.expiresAt) {
        tokens.delete(token);
        return Promise.resolve({ valid: false, error: 'Token expired' });
      }
      
      return Promise.resolve({ valid: true, user: tokenData.user });
    }),

    refreshToken: mockFn().mockImplementation((token: string) => {
      const tokenData = tokens.get(token);
      if (!tokenData) {
        return Promise.resolve({ success: false, error: 'Token not found' });
      }
      
      const newToken = `mock-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newExpiresAt = Date.now() + (60 * 60 * 1000);
      
      tokens.delete(token);
      tokens.set(newToken, { user: tokenData.user, expiresAt: newExpiresAt });
      
      return Promise.resolve({
        success: true,
        token: newToken,
        expiresAt: new Date(newExpiresAt)
      });
    }),

    logout: mockFn().mockImplementation((token: string) => {
      const existed = tokens.has(token);
      tokens.delete(token);
      return Promise.resolve({ success: existed });
    }),

    // Authorization
    checkPermission: mockFn().mockImplementation((userId: string, resource: string, action: string) => {
      // Simple mock authorization logic
      const adminUsers = ['admin-123', 'super-admin-456'];
      if (adminUsers.includes(userId)) {
        return Promise.resolve({ allowed: true });
      }
      
      // Basic user permissions
      const allowedActions = ['read', 'update'];
      const userResources = ['profile', 'sessions'];
      
      const allowed = userResources.includes(resource) && allowedActions.includes(action);
      return Promise.resolve({ allowed });
    }),

    // Security events
    logSecurityEvent: mockFn().mockImplementation((event: any) => {
      const securityEvent = {
        ...event,
        id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date()
      };
      securityEvents.push(securityEvent);
      return Promise.resolve({ success: true, id: securityEvent.id });
    }),

    // Rate limiting
    checkRateLimit: mockFn().mockImplementation((key: string, limit: number, windowMs: number) => {
      // Simple mock rate limiting
      return Promise.resolve({
        allowed: true,
        remaining: limit - 1,
        resetTime: new Date(Date.now() + windowMs)
      });
    }),

    // Password utilities
    hashPassword: mockFn().mockImplementation((password: string) => {
      return Promise.resolve(`hashed-${password}-${Date.now()}`);
    }),

    verifyPassword: mockFn().mockImplementation((password: string, hash: string) => {
      return Promise.resolve(hash.includes(password));
    }),

    // Test utilities
    _getSecurityEvents: () => [...securityEvents],
    _getSessions: () => new Map(sessions),
    _getTokens: () => new Map(tokens),
    _addMockUser: (credentials: any, userData: any) => {
      // Allow adding custom mock users for testing
      const originalAuth = mockFn().getMockImplementation();
      mockFn().mockImplementation((creds: any) => {
        if (creds.username === credentials.username && creds.password === credentials.password) {
          const token = `mock-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          tokens.set(token, { user: userData, expiresAt: Date.now() + (60 * 60 * 1000) });
          return Promise.resolve({ success: true, token, user: userData });
        }
        return originalAuth ? originalAuth(creds) : Promise.resolve({ success: false });
      });
    },
    _clearSecurityEvents: () => { securityEvents.length = 0; },
    _clearSessions: () => { sessions.clear(); },
    _clearTokens: () => { tokens.clear(); },
    _clearAll: () => {
      securityEvents.length = 0;
      sessions.clear();
      tokens.clear();
    }
  };
}

/**
 * Factory function to create all common service mocks
 */
export function createCommonServiceMocks(): {
  notificationService: any;
  cacheService: any;
  monitoringService: any;
  securityService: any;
} {
  return {
    notificationService: createMockNotificationService(),
    cacheService: createMockCacheService(),
    monitoringService: createMockMonitoringService(),
    securityService: createMockSecurityService()
  };
}

/**
 * Utility to configure mock services for different test scenarios
 */
export interface ServiceMockConfig {
  notifications?: {
    failureRate?: number;
    delay?: number;
  };
  cache?: {
    hitRate?: number;
    defaultTtl?: number;
  };
  monitoring?: {
    enableAlerts?: boolean;
    logLevel?: string;
  };
  security?: {
    defaultUser?: any;
    tokenExpiry?: number;
  };
}

export function configureMockServices(services: any, config: ServiceMockConfig): void {
  // Configure notification service
  if (config.notifications?.failureRate) {
    const originalSendEmail = services.notificationService.sendEmail.getMockImplementation();
    services.notificationService.sendEmail.mockImplementation((...args: any[]) => {
      if (Math.random() < config.notifications!.failureRate!) {
        return Promise.reject(new Error('Mock notification failure'));
      }
      return originalSendEmail ? originalSendEmail(...args) : Promise.resolve({ success: true });
    });
  }

  // Configure cache service
  if (config.cache?.hitRate !== undefined) {
    const originalGet = services.cacheService.get.getMockImplementation();
    services.cacheService.get.mockImplementation((key: string) => {
      if (Math.random() > config.cache!.hitRate!) {
        return Promise.resolve(null); // Cache miss
      }
      return originalGet ? originalGet(key) : Promise.resolve(`cached-${key}`);
    });
  }

  // Configure monitoring service
  if (config.monitoring?.logLevel) {
    const levels = ['debug', 'info', 'warn', 'error'];
    const minLevel = levels.indexOf(config.monitoring.logLevel);
    
    levels.forEach((level, index) => {
      if (index < minLevel) {
        services.monitoringService[level].mockImplementation(() => Promise.resolve(true));
      }
    });
  }

  // Configure security service
  if (config.security?.defaultUser) {
    services.securityService._addMockUser(
      { username: 'test@example.com', password: 'password123' },
      config.security.defaultUser
    );
  }
}