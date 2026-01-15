// Dynamic import for test framework compatibility
let mockFramework: any;
try {
  mockFramework = require('vitest').vi;
} catch {
  try {
    mockFramework = require('@jest/globals').jest;
  } catch {
    // Fallback mock implementation
    mockFramework = {
      fn: () => {
        const fn = (...args: any[]) => {};
        fn.mockImplementation = (impl: any) => fn;
        fn.mockReturnValue = (value: any) => fn;
        fn.mockResolvedValue = (value: any) => fn;
        fn.mockReturnThis = () => fn;
        return fn;
      }
    };
  }
}
import { Results } from '@strengthos/shared-utils';
import { 
  User, 
  Tenant, 
  UserRole, 
  UserStatus,
  TenantStatus,
  SecurityEvent,
  SecurityEventType,
  tenantWithSubscription,
} from '@strengthos/shared-types';
import { randomUUID } from 'crypto';

export interface MockServiceOptions {
  tenantId?: string;
  autoSuccess?: boolean;
  simulateErrors?: boolean;
  responseDelay?: number;
}

/**
 * Base mock service with common functionality
 */
export abstract class BaseMockService {
  protected options: MockServiceOptions;
  protected data: Map<string, any> = new Map();

  constructor(options: MockServiceOptions = {}) {
    this.options = {
      autoSuccess: true,
      simulateErrors: false,
      responseDelay: 0,
      ...options
    };
  }

  protected async simulateDelay(): Promise<void> {
    if (this.options.responseDelay && this.options.responseDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.options.responseDelay));
    }
  }

  protected shouldSimulateError(): boolean {
    return (this.options.simulateErrors ?? false) && Math.random() < 0.1; // 10% error rate
  }

  protected generateId(): string {
    return randomUUID();
  }

  protected createSuccessResult<T>(data: T): Results<T> {
    return Results.ok(data);
  }

  protected createErrorResult<T>(message: string): Results<T> {
    return Results.error(null as any, message);
  }

  // Test helper methods
  _clearData(): void {
    this.data.clear();
  }

  _setData(key: string, value: any): void {
    this.data.set(key, value);
  }

  _getData(key: string): any {
    return this.data.get(key);
  }

  _getAllData(): Map<string, any> {
    return new Map(this.data);
  }
}

/**
 * Mock User Management Service
 */
export class MockUserManagementService extends BaseMockService {
  private users = new Map<string, User>();
  private currentTenantId: string | null = null;

  constructor(options: MockServiceOptions = {}) {
    super(options);
    this.currentTenantId = options.tenantId || null;
  }

  setTenantContext(tenantId: string): void {
    this.currentTenantId = tenantId;
  }

  async createUser(userData: Partial<User>): Promise<Results<User>> {
    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      return this.createErrorResult('Failed to create user');
    }

    const userId = this.generateId();
    const user: User = {
      id: userId,
      tenantId: this.currentTenantId || this.generateId(),
      tenantName: 'Test Tenant',
      freePlan: userData.freePlan || false,
      email: userData.email || `user${userId.slice(0, 8)}@example.com`,
      firstName: (userData as any).firstName || 'Test',
      lastName: (userData as any).lastName || 'User',
      role: userData.role || UserRole.ATHLETE,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(userId, user);
    return this.createSuccessResult(user);
  }

  async getUserById(userId: string): Promise<Results<User | null>> {
    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      return this.createErrorResult('Failed to get user');
    }

    const user = this.users.get(userId);
    if (!user || user.tenantId !== this.currentTenantId) {
      return this.createSuccessResult(null);
    }

    return this.createSuccessResult(user);
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<Results<User>> {
    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      return this.createErrorResult('Failed to update user');
    }

    const user = this.users.get(userId);
    if (!user || user.tenantId !== this.currentTenantId) {
      return this.createErrorResult('User not found');
    }

    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(userId, updatedUser);
    return this.createSuccessResult(updatedUser);
  }

  async deleteUser(userId: string): Promise<Results<boolean>> {
    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      return this.createErrorResult('Failed to delete user');
    }

    const user = this.users.get(userId);
    if (!user || user.tenantId !== this.currentTenantId) {
      return this.createErrorResult('User not found');
    }

    this.users.delete(userId);
    return this.createSuccessResult(true);
  }

  async getUsersByRole(role: UserRole): Promise<Results<User[]>> {
    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      return this.createErrorResult('Failed to get users by role');
    }

    const users = Array.from(this.users.values()).filter(
      user => user.role === role && user.tenantId === this.currentTenantId
    );

    return this.createSuccessResult(users);
  }

  async searchUsers(filters: any): Promise<Results<User[]>> {
    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      return this.createErrorResult('Failed to search users');
    }

    let results = Array.from(this.users.values()).filter(
      user => user.tenantId === this.currentTenantId
    );

    if (filters.email) {
      results = results.filter(user => 
        user.email.toLowerCase().includes(filters.email.toLowerCase())
      );
    }

    if (filters.name) {
      results = results.filter(user => 
        user.firstName.toLowerCase().includes(filters.name.toLowerCase()) ||
        user.lastName.toLowerCase().includes(filters.name.toLowerCase())
      );
    }

    if (filters.role) {
      results = results.filter(user => user.role === filters.role);
    }

    if (filters.limit) {
      results = results.slice(filters.offset || 0, (filters.offset || 0) + filters.limit);
    }

    return this.createSuccessResult(results);
  }

  async verifyEmail(userId: string): Promise<Results<boolean>> {
    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      return this.createErrorResult('Failed to verify email');
    }

    const user = this.users.get(userId);
    if (!user || user.tenantId !== this.currentTenantId) {
      return this.createErrorResult('User not found');
    }

    (user as any).status = UserStatus.ACTIVE;
    (user as any).emailVerifiedAt = new Date();
    return this.createSuccessResult(true);
  }

  // Test helper methods
  _getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  _clearUsers(): void {
    this.users.clear();
  }

  _setUser(userId: string, user: User): void {
    this.users.set(userId, user);
  }
}

/**
 * Mock Tenant Management Service
 */
export class MockTenantManagementService extends BaseMockService {
  private tenants = new Map<string, Tenant>();

  async createTenant(tenantData: Partial<Tenant>): Promise<Results<Tenant>> {
    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      return this.createErrorResult('Failed to create tenant');
    }

    const tenantId = this.generateId();
    // Use extended Tenant structure for mocking
    const tenant: tenantWithSubscription = {
      id: tenantId,
      name: tenantData.name || `Test Tenant ${tenantId.slice(0, 8)}`,
      description: tenantData.description || 'This is a test tenant',
      status: TenantStatus.TRIAL,
      settings: {
        allowSelfCoached: true,
        requireCoachApproval: false,
        enableVideoAnalysis: false,
        defaultLanguage: 'en',
        availableLanguages: ['en'],
        maxCoaches: 10,
        maxAthletes: 100,
        logo: 'https://example.com/logo.png',
        complianceSettings: {
          gdprEnabled: true,
          pdpaEnabled: false,
          hipaaEnabled: false,
        },
      },
      subscription_info: 'trial',
      subscription_info_details: null,
      billing_info: {
        amount: 0,
        billingCycle: 'MONTHLY',
        currency: 'USD',
      },
      contact: {
        email: 'test@tenant.com',
        phone: '1234567890',
      },
      created_at: new Date(),
      updated_at: new Date(),
      suspended_at: null,
    };

    this.tenants.set(tenantId, tenant);
    return this.createSuccessResult(tenant as Tenant);
  }

  async getTenant(tenantId: string): Promise<Results<Tenant | null>> {
    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      return this.createErrorResult('Failed to get tenant');
    }

    const tenant = this.tenants.get(tenantId);
    return this.createSuccessResult(tenant || null);
  }

  async updateTenant(tenantId: string, updates: Partial<Tenant>): Promise<Results<Tenant>> {
    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      return this.createErrorResult('Failed to update tenant');
    }

    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      return this.createErrorResult('Tenant not found');
    }

    const updatedTenant = { ...tenant, ...updates, updatedAt: new Date() };
    this.tenants.set(tenantId, updatedTenant);
    return this.createSuccessResult(updatedTenant);
  }

  async deleteTenant(tenantId: string): Promise<Results<boolean>> {
    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      return this.createErrorResult('Failed to delete tenant');
    }

    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      return this.createErrorResult('Tenant not found');
    }

    this.tenants.delete(tenantId);
    return this.createSuccessResult(true);
  }

  async suspendTenant(tenantId: string, _reason: string): Promise<Results<boolean>> {
    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      return this.createErrorResult('Failed to suspend tenant');
    }

    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      return this.createErrorResult('Tenant not found');
    }

    tenant.status = TenantStatus.SUSPENDED;
    return this.createSuccessResult(true);
  }

  async reactivateTenant(tenantId: string): Promise<Results<boolean>> {
    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      return this.createErrorResult('Failed to reactivate tenant');
    }

    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      return this.createErrorResult('Tenant not found');
    }

    tenant.status = TenantStatus.ACTIVE;
    return this.createSuccessResult(true);
  }

  // Test helper methods
  _getAllTenants(): Tenant[] {
    return Array.from(this.tenants.values());
  }

  _clearTenants(): void {
    this.tenants.clear();
  }

  _setTenant(tenantId: string, tenant: Tenant): void {
    this.tenants.set(tenantId, tenant);
  }
}

/**
 * Mock Access Control Service
 */
export class MockAccessControlService extends BaseMockService {
  private permissions = new Map<string, string[]>();
  private auditLogs: SecurityEvent[] = [];

  async checkPermission(userId: string, resource: string, action: string): Promise<Results<boolean>> {
    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      return this.createErrorResult('Failed to check permission');
    }

    const userPermissions = this.permissions.get(userId) || [];
    
    // Super admin has all permissions
    if (userPermissions.includes('*:*')) {
      return this.createSuccessResult(true);
    }

    // Check specific permission
    const permissionKey = `${resource}:${action}`;
    const hasPermission = userPermissions.includes(permissionKey) || userPermissions.includes(`${resource}:*`);
    
    return this.createSuccessResult(hasPermission);
  }

  async getUserPermissions(userId: string): Promise<Results<string[]>> {
    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      return this.createErrorResult('Failed to get user permissions');
    }

    const permissions = this.permissions.get(userId) || [];
    return this.createSuccessResult(permissions);
  }

  async assignRole(userId: string, role: UserRole, assignedBy: string): Promise<Results<boolean>> {
    await this.simulateDelay();

    if (this.shouldSimulateError()) {
      return this.createErrorResult('Failed to assign role');
    }

    const rolePermissions = this.getRolePermissions(role);
    this.permissions.set(userId, rolePermissions);

    await this.logSecurityEvent({
      userId: assignedBy,
      tenantId: this.options.tenantId || 'mock-tenant',
      eventType: SecurityEventType.USER_ROLE_CHANGED,
      resource: 'users',
      action: 'assign_role',
      success: true,
      ipAddress: '127.0.0.1',
      userAgent: 'Mock Browser',
      timestamp: new Date(),
      metadata: { targetUserId: userId, role },
    });

    return this.createSuccessResult(true);
  }

  async logSecurityEvent(event: Partial<SecurityEvent>): Promise<Results<boolean>> {
    await this.simulateDelay();

    const securityEvent = {
      id: this.generateId(),
      eventType: event.eventType!,
      severity: 'LOW' as any,
      status: 'RESOLVED' as any,
      timestamp: event.timestamp || new Date(),
      userId: event.userId,
      tenantId: event.tenantId,
      ipAddress: event.ipAddress || '127.0.0.1',
      userAgent: event.userAgent,
      resource: event.resource,
      action: event.action,
      success: event.success ?? true,
      metadata: event.metadata || {},
    } as SecurityEvent;

    this.auditLogs.push(securityEvent);
    return this.createSuccessResult(true);
  }

  private getRolePermissions(role: UserRole): string[] {
    const rolePermissions: Record<UserRole, string[]> = {
      [UserRole.SUPER_ADMIN]: ['*:*'],
      [UserRole.TENANT_ADMIN]: ['*:*'],
      [UserRole.COACH_ADMIN]: [
        'users:create', 'users:read', 'users:update', 'users:delete',
        'coaches:assign', 'athletes:manage',
      ],
      [UserRole.COACH]: [
        'programs:create', 'programs:read', 'programs:update',
        'sessions:review', 'athletes:read', 'athletes:update',
      ],
      [UserRole.ATHLETE]: [
        'profile:read', 'profile:update', 'sessions:log', 'programs:read',
      ],
      [UserRole.SELF_COACHED]: [
        'profile:read', 'profile:update', 'sessions:log', 'programs:read',
        'programs:create', 'templates:access',
      ],
    };

    return rolePermissions[role] || [];
  }

  // Test helper methods
  _setUserPermissions(userId: string, permissions: string[]): void {
    this.permissions.set(userId, permissions);
  }

  _clearAuditLogs(): void {
    this.auditLogs = [];
  }

  _getAuditLogs(): SecurityEvent[] {
    return [...this.auditLogs];
  }
}

/**
 * Factory function to create all service mocks
 */
export function createServiceMocks(options: MockServiceOptions = {}) {
  return {
    userService: new MockUserManagementService(options),
    tenantService: new MockTenantManagementService(options),
    accessControlService: new MockAccessControlService(options),
  };
}

/**
 * Test framework compatible mock helpers
 */
export function mockUserManagementService(options: MockServiceOptions = {}) {
  return mockFramework.fn().mockImplementation(() => new MockUserManagementService(options));
}

export function mockTenantManagementService(options: MockServiceOptions = {}) {
  return mockFramework.fn().mockImplementation(() => new MockTenantManagementService(options));
}

export function mockAccessControlService(options: MockServiceOptions = {}) {
  return mockFramework.fn().mockImplementation(() => new MockAccessControlService(options));
}

/**
 * Mock database service
 */
export function mockDatabaseService() {
  return {
    knex: mockFramework.fn().mockReturnValue({
      select: mockFramework.fn().mockReturnThis(),
      from: mockFramework.fn().mockReturnThis(),
      where: mockFramework.fn().mockReturnThis(),
      insert: mockFramework.fn().mockReturnThis(),
      update: mockFramework.fn().mockReturnThis(),
      delete: mockFramework.fn().mockReturnThis(),
      returning: mockFramework.fn().mockResolvedValue([]),
      first: mockFramework.fn().mockResolvedValue(null),
      then: mockFramework.fn().mockResolvedValue([]),
    }),
    transaction: mockFramework.fn().mockImplementation((callback: (knex: any) => any) => callback(mockDatabaseService().knex)),
    raw: mockFramework.fn().mockResolvedValue({ rows: [] }),
  };
}

/**
 * Mock cache service
 */
export function mockCacheService() {
  const cache = new Map();
  
  return {
    get: mockFramework.fn().mockImplementation((key: string) => Promise.resolve(cache.get(key))),
    set: mockFramework.fn().mockImplementation((key: string, value: any, _ttl?: number) => {
      cache.set(key, value);
      return Promise.resolve(true);
    }),
    del: mockFramework.fn().mockImplementation((key: string) => {
      cache.delete(key);
      return Promise.resolve(true);
    }),
    clear: mockFramework.fn().mockImplementation(() => {
      cache.clear();
      return Promise.resolve(true);
    }),
    keys: mockFramework.fn().mockImplementation(() => Promise.resolve(Array.from(cache.keys()))),
    _getCache: () => cache,
  };
}

/**
 * Mock notification service
 */
export function mockNotificationService() {
  const sentNotifications: any[] = [];

  return {
    sendEmail: mockFramework.fn().mockImplementation((to: string, subject: string, body: string) => {
      sentNotifications.push({ type: 'email', to, subject, body, timestamp: new Date() });
      return Promise.resolve(Results.ok(true));
    }),
    sendSMS: mockFramework.fn().mockImplementation((to: string, message: string) => {
      sentNotifications.push({ type: 'sms', to, message, timestamp: new Date() });
      return Promise.resolve(Results.ok(true));
    }),
    sendPushNotification: mockFramework.fn().mockImplementation((userId: string, title: string, body: string) => {
      sentNotifications.push({ type: 'push', userId, title, body, timestamp: new Date() });
      return Promise.resolve(Results.ok(true));
    }),
    _getSentNotifications: () => [...sentNotifications],
    _clearNotifications: () => sentNotifications.length = 0,
  };
}