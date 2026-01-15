/**
 * TenantModule Integration Tests
 * 
 * Tests the complete TenantModule with minimal providers and mocked external dependencies.
 * Focuses on testing tenant creation, domain validation, multi-tenancy isolation,
 * tenant context propagation, and data isolation between tenants without loading
 * complex global providers.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';

// Import production TenantModule and related components
import { TenantService } from '@strengthos/sos-web-api/src/tenant/services/tenant.service';
import { TenantContextService } from '@strengthos/sos-web-api/src/tenant/services/tenant-context.service';
import { TenantAwareDatabaseService } from '@strengthos/sos-web-api/src/tenant/services/tenant-aware-database.service';
import { TenantRepository } from '@strengthos/sos-web-api/src/tenant/repositories/tenant.repository';
import { DatabaseService } from '@strengthos/sos-web-api/src/database/database.service';

// Import types from production
import { 
  TenantSettings,
  TenantStatus,
  Tenant
} from '@strengthos/shared-types';

// Import additional types directly from user-management
import { 
  CreateTenantRequest, 
  UpdateTenantRequest,
  TenantContext
} from '@strengthos/shared-types/src/user-management';
import { UserRole } from '@strengthos/shared-types';

// Import test utilities - using local factory to avoid vitest import issues

describe('TenantModule Integration', () => {
  let module: TestingModule;
  let tenantService: TenantService;
  let tenantContextService: TenantContextService;
  let tenantAwareDatabaseService: TenantAwareDatabaseService;
  let tenantRepository: TenantRepository;
  let mockDatabaseService: jest.Mocked<DatabaseService>;
  let mockKnex: jest.Mocked<any>;
  let mockLogger: jest.Mocked<any>;

  // Test data factory functions
  const createTestTenant = (overrides: Partial<Tenant> = {}): Tenant => {
    const sequence = Math.floor(Math.random() * 1000);
    const timestamp = new Date();
    
    return {
      id: `tenant-${sequence}`,
      name: `Test Gym ${sequence}`,
      domain: `testgym${sequence}.com`,
      status: TenantStatus.ACTIVE,
      settings: {
        allowSelfCoached: true,
        requireCoachApproval: false,
        enableVideoAnalysis: true,
        defaultLanguage: 'en',
        availableLanguages: ['en'],
        maxCoaches: 10,
        maxAthletes: 100,
        logo: '',
        complianceSettings: {
          gdprEnabled: true,
          pdpaEnabled: false,
          hipaaEnabled: false,
          consentRequired: true,
        },
      },
      subscription: {
        id: `sub-${sequence}`,
        status: 'ACTIVE' as any,
        planId: 'professional',
        planName: 'Professional',
        billingCycle: 'MONTHLY' as any,
        currentPeriodStart: timestamp,
        currentPeriodEnd: new Date(timestamp.getTime() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
        trialEnd: null,
        features: []
      },
      billing: {
        customerId: `cust-${sequence}`,
        paymentMethodId: undefined,
        billingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          postalCode: '12345',
          country: 'Test Country'
        },
        taxId: undefined,
        currency: 'USD',
        nextBillingDate: new Date(timestamp.getTime() + 30 * 24 * 60 * 60 * 1000),
        lastPaymentDate: undefined,
        outstandingBalance: 0,
      },
      users: [],
      createdAt: timestamp,
      updatedAt: timestamp,
      suspendedAt: undefined,
      ...overrides
    };
  };

  const createTestTenants = (count: number, overrides: Partial<Tenant> = {}): Tenant[] => {
    return Array.from({ length: count }, () => createTestTenant(overrides));
  };

  beforeEach(async () => {
    // Create comprehensive mocks for external dependencies
    const createMockQueryBuilder = () => ({
      // Query builder methods that return this for chaining
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      whereIn: jest.fn().mockReturnThis(),
      whereILike: jest.fn().mockReturnThis(),
      whereRaw: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      clone: jest.fn().mockReturnThis(),
      
      // Terminal methods that return promises/values
      first: jest.fn(),
      count: jest.fn(),
      del: jest.fn(),
      
      // Insert/Update methods that return this for chaining
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      returning: jest.fn(),
    });

    // Create the main knex function that returns a query builder
    mockKnex = jest.fn().mockImplementation(() => createMockQueryBuilder());
    
    // Add query builder methods to the main function as well for direct access
    Object.assign(mockKnex, createMockQueryBuilder());
    
    // Add raw method for tenant context operations
    mockKnex.raw = jest.fn().mockResolvedValue({ rows: [] });
    
    // Add schema methods for column checking
    mockKnex.schema = {
      hasColumn: jest.fn().mockResolvedValue(true),
      hasTable: jest.fn().mockResolvedValue(true),
    };

    // Add transaction support
    mockKnex.transaction = jest.fn().mockImplementation((callback) => {
      const trx = createMockQueryBuilder();
      trx.commit = jest.fn().mockResolvedValue(undefined);
      trx.rollback = jest.fn().mockResolvedValue(undefined);
      trx.raw = jest.fn().mockResolvedValue({ rows: [] });
      return callback(trx);
    });

    mockDatabaseService = {
      getKnex: jest.fn().mockReturnValue(mockKnex),
      knex: mockKnex,
      onModuleInit: jest.fn(),
      onModuleDestroy: jest.fn(),
    } as any;

    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      info: jest.fn(),
      warning: jest.fn(),
    };

    // Create test-specific TenantModule configuration with minimal providers
    // Focus on core tenant services without complex dependencies
    module = await Test.createTestingModule({
      providers: [
        TenantService,
        TenantContextService,
        TenantAwareDatabaseService,
        TenantRepository,
        // Mock external dependencies
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
        {
          provide: 'ILogger',
          useValue: mockLogger,
        },
        // Note: We exclude controllers, guards, interceptors, and middleware to avoid complex dependency setup
        // This allows us to focus on testing the core service logic with mocked dependencies
      ],
    }).compile();

    tenantService = module.get<TenantService>(TenantService);
    tenantContextService = module.get<TenantContextService>(TenantContextService);
    tenantAwareDatabaseService = module.get<TenantAwareDatabaseService>(TenantAwareDatabaseService);
    tenantRepository = module.get<TenantRepository>(TenantRepository);
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
    jest.clearAllMocks();
  });

  describe('Module Configuration', () => {
    it('should be defined and properly configured', () => {
      expect(module).toBeDefined();
      expect(tenantService).toBeDefined();
      expect(tenantContextService).toBeDefined();
      expect(tenantAwareDatabaseService).toBeDefined();
      expect(tenantRepository).toBeDefined();
    });

    it('should have core TenantService from production', () => {
      const tenantServiceInstance = module.get(TenantService);

      expect(tenantServiceInstance).toBeDefined();
      expect(tenantServiceInstance).toBeInstanceOf(TenantService);
      expect(tenantServiceInstance).toBe(tenantService);
    });

    it('should have core TenantContextService from production', () => {
      const tenantContextServiceInstance = module.get(TenantContextService);

      expect(tenantContextServiceInstance).toBeDefined();
      expect(tenantContextServiceInstance).toBeInstanceOf(TenantContextService);
      expect(tenantContextServiceInstance).toBe(tenantContextService);
    });

    it('should have core TenantAwareDatabaseService from production', () => {
      const tenantAwareDatabaseServiceInstance = module.get(TenantAwareDatabaseService);

      expect(tenantAwareDatabaseServiceInstance).toBeDefined();
      expect(tenantAwareDatabaseServiceInstance).toBeInstanceOf(TenantAwareDatabaseService);
      expect(tenantAwareDatabaseServiceInstance).toBe(tenantAwareDatabaseService);
    });

    it('should have mocked external dependencies', () => {
      const databaseService = module.get(DatabaseService);
      const logger = module.get('ILogger');

      expect(databaseService).toBeDefined();
      expect(logger).toBeDefined();
      expect(databaseService).toBe(mockDatabaseService);
      expect(logger).toBe(mockLogger);
    });

    it('should properly inject mocked dependencies into tenant services', () => {
      // Verify that the services can access their injected dependencies
      expect(tenantService).toBeDefined();
      expect(tenantContextService).toBeDefined();
      expect(tenantAwareDatabaseService).toBeDefined();
      
      // The services should be able to call methods without throwing dependency errors
      expect(() => {
        expect(tenantService.createTenant).toBeDefined();
        expect(tenantService.getTenant).toBeDefined();
        expect(tenantService.updateTenant).toBeDefined();
        expect(tenantService.deleteTenant).toBeDefined();
        expect(tenantContextService.setTenantContext).toBeDefined();
        expect(tenantContextService.validateTenantAccess).toBeDefined();
        expect(tenantAwareDatabaseService.getTenantAwareQuery).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Tenant Creation Workflow Integration', () => {
    it('should create tenant successfully with unique domain', async () => {
      const testTenant = createTestTenant({
        name: 'Test Gym',
        domain: 'testgym.com',
        status: TenantStatus.ACTIVE
      });

      const createTenantRequest: CreateTenantRequest = {
        name: testTenant.name,
        domain: testTenant.domain,
        settings: testTenant.settings
      };

      // Mock repository responses
      mockKnex.first.mockResolvedValueOnce(null); // Domain available check
      mockKnex.returning.mockResolvedValueOnce([{
        id: testTenant.id,
        name: testTenant.name,
        domain: testTenant.domain,
        status: testTenant.status,
        settings: testTenant.settings,
        billing: testTenant.billing,
        created_at: testTenant.createdAt,
        updated_at: testTenant.updatedAt,
      }]);

      const result = await tenantService.createTenant(createTenantRequest);

      expect(result).toEqual({
        id: testTenant.id,
        name: testTenant.name,
        domain: testTenant.domain,
        status: testTenant.status,
        settings: testTenant.settings,
        billing: testTenant.billing,
        users: [],
        createdAt: testTenant.createdAt,
        updatedAt: testTenant.updatedAt,
        suspendedAt: undefined,
      });

      // Verify repository interactions
      expect(mockKnex.first).toHaveBeenCalledWith(); // Domain availability check
      expect(mockKnex.insert).toHaveBeenCalled();
      expect(mockKnex.returning).toHaveBeenCalledWith('*');
      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'Tenant created successfully',
        tenantId: testTenant.id,
        tenantName: testTenant.name,
      });
    });

    it('should create tenant without domain successfully', async () => {
      const testTenant = createTestTenant({
        name: 'Test Gym Without Domain',
        domain: undefined
      });

      const createTenantRequest: CreateTenantRequest = {
        name: testTenant.name,
        settings: testTenant.settings
      };

      // Mock repository responses (no domain check needed)
      mockKnex.returning.mockResolvedValueOnce([{
        id: testTenant.id,
        name: testTenant.name,
        domain: null,
        status: testTenant.status,
        settings: testTenant.settings,
        billing: testTenant.billing,
        created_at: testTenant.createdAt,
        updated_at: testTenant.updatedAt,
      }]);

      const result = await tenantService.createTenant(createTenantRequest);

      expect(result.name).toBe(testTenant.name);
      expect(result.domain).toBeNull();

      // Verify no domain check was performed
      expect(mockKnex.insert).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should handle domain conflicts during tenant creation', async () => {
      const existingTenant = createTestTenant({
        domain: 'existing.com'
      });

      const createTenantRequest: CreateTenantRequest = {
        name: 'New Gym',
        domain: existingTenant.domain,
        settings: {} as TenantSettings
      };

      // Mock repository to return existing tenant (domain not available)
      mockKnex.first.mockResolvedValueOnce(existingTenant);

      await expect(tenantService.createTenant(createTenantRequest)).rejects.toThrow(ConflictException);
      await expect(tenantService.createTenant(createTenantRequest)).rejects.toThrow('Domain already exists');

      // Verify repository was called to check domain availability
      expect(mockKnex.first).toHaveBeenCalled();
      expect(mockKnex.insert).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should validate tenant settings during creation', async () => {
      const testTenant = createTestTenant();
      const createTenantRequest: CreateTenantRequest = {
        name: testTenant.name,
        domain: testTenant.domain,
        settings: {
          ...testTenant.settings,
          maxCoaches: 5,
          maxAthletes: 50,
          enableVideoAnalysis: true
        }
      };

      // Mock repository responses
      mockKnex.first.mockResolvedValueOnce(null); // Domain available
      mockKnex.returning.mockResolvedValueOnce([{
        id: testTenant.id,
        name: testTenant.name,
        domain: testTenant.domain,
        status: testTenant.status,
        settings: createTenantRequest.settings,
        billing: testTenant.billing,
        created_at: testTenant.createdAt,
        updated_at: testTenant.updatedAt,
      }]);

      const result = await tenantService.createTenant(createTenantRequest);

      expect(result.settings.maxCoaches).toBe(5);
      expect(result.settings.maxAthletes).toBe(50);
      expect(result.settings.enableVideoAnalysis).toBe(true);

      expect(mockKnex.insert).toHaveBeenCalled();
    });
  });

  describe('Tenant Update and Domain Validation Integration', () => {
    it('should update tenant successfully', async () => {
      const existingTenant = createTestTenant({
        name: 'Original Gym',
        domain: 'original.com'
      });

      const updateTenantRequest: UpdateTenantRequest = {
        name: 'Updated Gym',
        domain: 'updated.com'
      };

      // Mock repository responses
      mockKnex.first.mockResolvedValueOnce(null); // Domain available check
      mockKnex.returning.mockResolvedValueOnce([{
        ...existingTenant,
        name: updateTenantRequest.name,
        domain: updateTenantRequest.domain,
        updated_at: new Date(),
      }]);

      const result = await tenantService.updateTenant(existingTenant.id, updateTenantRequest);

      expect(result.name).toBe(updateTenantRequest.name);
      expect(result.domain).toBe(updateTenantRequest.domain);

      // Verify repository interactions
      expect(mockKnex.first).toHaveBeenCalled(); // Domain availability check
      expect(mockKnex.update).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'Tenant updated successfully',
        tenantId: existingTenant.id,
        updates: Object.keys(updateTenantRequest),
      });
    });

    it('should handle tenant not found during update', async () => {
      const updateTenantRequest: UpdateTenantRequest = {
        name: 'Updated Gym'
      };

      // Mock repository to return null (tenant not found)
      mockKnex.returning.mockResolvedValueOnce([]);

      await expect(tenantService.updateTenant('non-existent-id', updateTenantRequest)).rejects.toThrow(NotFoundException);
      await expect(tenantService.updateTenant('non-existent-id', updateTenantRequest)).rejects.toThrow('Tenant not found');

      expect(mockKnex.update).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle domain conflicts during update', async () => {
      const existingTenant = createTestTenant({
        domain: 'original.com'
      });

      const conflictingTenant = createTestTenant({
        domain: 'conflict.com'
      });

      const updateTenantRequest: UpdateTenantRequest = {
        domain: conflictingTenant.domain
      };

      // Mock repository responses
      mockKnex.first.mockResolvedValueOnce(conflictingTenant); // Domain conflict check

      await expect(tenantService.updateTenant(existingTenant.id, updateTenantRequest)).rejects.toThrow(ConflictException);
      await expect(tenantService.updateTenant(existingTenant.id, updateTenantRequest)).rejects.toThrow('Domain already exists');

      // Verify repository interactions
      expect(mockKnex.first).toHaveBeenCalled(); // Domain conflict check
      expect(mockKnex.update).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should validate domain uniqueness correctly', async () => {
      const domain = 'unique.com';

      // Mock repository to return null (domain available)
      mockKnex.first.mockResolvedValueOnce(null);

      const result = await tenantService.validateTenantDomain(domain);

      expect(result).toBe(true);
      expect(mockKnex.first).toHaveBeenCalled();
    });

    it('should detect domain conflicts correctly', async () => {
      const domain = 'taken.com';
      const existingTenant = createTestTenant({ domain });

      // Mock repository to return existing tenant
      mockKnex.first.mockResolvedValueOnce(existingTenant);

      const result = await tenantService.validateTenantDomain(domain);

      expect(result).toBe(false);
      expect(mockKnex.first).toHaveBeenCalled();
    });
  });

  describe('Multi-Tenancy Isolation Integration', () => {
    it('should set tenant context correctly', async () => {
      const tenantId = 'test-tenant-123';
      const userId = 'user-456';

      // Mock raw query for setting tenant context
      mockKnex.raw.mockResolvedValueOnce({ rows: [] });

      await tenantContextService.setTenantContext(userId, tenantId);

      expect(mockKnex.raw).toHaveBeenCalledWith('SELECT set_tenant_context(?, ?)', [userId, tenantId]);
    });

    it('should validate tenant access correctly', async () => {
      const userId = 'user-123';
      const tenantId = 'tenant-456';

      // Mock stored procedure response
      mockKnex.raw.mockResolvedValueOnce({
        rows: [{ is_valid: true }]
      });

      const result = await tenantContextService.validateTenantAccess(userId, tenantId);

      expect(result).toBe(true);
      expect(mockKnex.raw).toHaveBeenCalledWith(
        'SELECT validate_tenant_access(?, ?) as is_valid',
        [userId, tenantId]
      );
    });

    it('should fall back to basic validation when stored procedures are not available', async () => {
      const userId = 'user-123';
      const tenantId = 'tenant-456';

      // Mock stored procedure to throw error (not available)
      mockKnex.raw.mockRejectedValueOnce(new Error('Function does not exist'));

      // Mock basic validation query
      mockKnex.first.mockResolvedValueOnce({
        id: userId,
        tenant_id: tenantId,
        status: 'ACTIVE'
      });

      const result = await tenantContextService.validateTenantAccess(userId, tenantId);

      expect(result).toBe(true);
      expect(mockKnex.raw).toHaveBeenCalled(); // Stored procedure attempt
      expect(mockKnex.first).toHaveBeenCalled(); // Fallback query
    });

    it('should handle super admin access correctly', async () => {
      const superAdminUserId = 'super-admin-123';
      const tenantId = 'any-tenant-456';

      // Mock stored procedure to throw error (fallback to basic validation)
      mockKnex.raw.mockRejectedValueOnce(new Error('Function does not exist'));

      // Mock basic validation - no user in tenant
      mockKnex.first.mockResolvedValueOnce(null);

      // Mock super admin check
      mockKnex.first.mockResolvedValueOnce({
        id: superAdminUserId,
        role: UserRole.SUPER_ADMIN,
        status: 'ACTIVE'
      });

      const result = await tenantContextService.validateTenantAccess(superAdminUserId, tenantId);

      expect(result).toBe(true);
      expect(mockKnex.first).toHaveBeenCalledTimes(2); // User check + super admin check
    });

    it('should get user tenant context correctly', async () => {
      const userId = 'user-123';
      const tenantId = 'tenant-456';
      const testTenant = createTestTenant({ id: tenantId });

      // Mock stored procedure response
      mockKnex.raw.mockResolvedValueOnce({
        rows: [{
          tenant_id: tenantId,
          user_role: UserRole.ATHLETE
        }]
      });

      // Mock tenant repository response
      mockKnex.first.mockResolvedValueOnce({
        id: testTenant.id,
        name: testTenant.name,
        domain: testTenant.domain,
        status: testTenant.status,
        settings: testTenant.settings,
        billing: testTenant.billing,
        created_at: testTenant.createdAt,
        updated_at: testTenant.updatedAt,
      });

      const result = await tenantContextService.getUserTenantContext(userId);

      expect(result).toEqual({
        tenantId: tenantId,
        userId: userId,
        role: UserRole.ATHLETE,
        permissions: [],
        settings: testTenant.settings,
      });

      expect(mockKnex.raw).toHaveBeenCalledWith(
        'SELECT * FROM get_user_tenant_context(?)',
        [userId]
      );
    });

    it('should clear tenant context correctly', async () => {
      mockKnex.raw.mockResolvedValue({ rows: [] });

      await tenantContextService.clearTenantContext();

      expect(mockKnex.raw).toHaveBeenCalledWith(
        "SELECT set_config('app.current_tenant_id', '', true)"
      );
      expect(mockKnex.raw).toHaveBeenCalledWith(
        "SELECT set_config('app.current_user_id', '', true)"
      );
    });
  });

  describe('Tenant-Aware Database Operations Integration', () => {
    it('should create tenant-aware query with tenant filtering', async () => {
      const tenantId = 'tenant-123';
      const tableName = 'users';

      // Mock schema check
      mockKnex.schema.hasColumn.mockResolvedValueOnce(true);

      const query = await tenantAwareDatabaseService.getTenantAwareQuery(tableName, tenantId);

      expect(query).toBeDefined();
      expect(mockKnex.schema.hasColumn).toHaveBeenCalledWith(tableName, 'tenant_id');
      expect(mockKnex.where).toHaveBeenCalledWith('tenant_id', tenantId);
    });

    it('should execute tenant-aware queries correctly', async () => {
      const tenantId = 'tenant-123';
      const tableName = 'users';
      const mockResults = [{ id: '1', name: 'User 1' }, { id: '2', name: 'User 2' }];

      // Mock schema check and query results
      mockKnex.schema.hasColumn.mockResolvedValueOnce(true);
      mockKnex.mockResolvedValueOnce(mockResults);

      const result = await tenantAwareDatabaseService.executeTenantQuery(
        tableName,
        (query) => query.select('*'),
        tenantId
      );

      expect(result).toEqual(mockResults);
      expect(mockKnex.where).toHaveBeenCalledWith('tenant_id', tenantId);
      expect(mockLogger.debug).toHaveBeenCalledWith({
        message: 'Tenant-aware query executed',
        tableName,
        tenantId,
        resultCount: 2,
      });
    });

    it('should insert data with tenant ID injection', async () => {
      const tenantId = 'tenant-123';
      const tableName = 'users';
      const testData = { name: 'Test User', email: 'test@example.com' };
      const expectedResult = [{ id: '1', ...testData, tenant_id: tenantId }];

      // Mock schema check and insert result
      mockKnex.schema.hasColumn.mockResolvedValueOnce(true);
      mockKnex.returning.mockResolvedValueOnce(expectedResult);

      const result = await tenantAwareDatabaseService.insertWithTenant(tableName, testData, tenantId);

      expect(result).toEqual(expectedResult);
      expect(mockKnex.insert).toHaveBeenCalledWith({ ...testData, tenant_id: tenantId });
      expect(mockKnex.returning).toHaveBeenCalledWith('*');
      expect(mockLogger.debug).toHaveBeenCalledWith({
        message: 'Tenant-aware insert executed',
        tableName,
        tenantId,
        insertCount: 1,
      });
    });

    it('should update data with tenant isolation', async () => {
      const tenantId = 'tenant-123';
      const tableName = 'users';
      const whereClause = { id: 'user-1' };
      const updateData = { name: 'Updated User' };

      // Mock schema check and update result
      mockKnex.schema.hasColumn.mockResolvedValueOnce(true);
      mockKnex.update.mockResolvedValueOnce(1);

      const result = await tenantAwareDatabaseService.updateWithTenant(
        tableName,
        whereClause,
        updateData,
        tenantId
      );

      expect(result).toBe(1);
      expect(mockKnex.where).toHaveBeenCalledWith('tenant_id', tenantId);
      expect(mockKnex.where).toHaveBeenCalledWith(whereClause);
      expect(mockKnex.update).toHaveBeenCalledWith(updateData);
      expect(mockLogger.debug).toHaveBeenCalledWith({
        message: 'Tenant-aware update executed',
        tableName,
        tenantId,
        affectedRows: 1,
      });
    });

    it('should delete data with tenant isolation', async () => {
      const tenantId = 'tenant-123';
      const tableName = 'users';
      const whereClause = { id: 'user-1' };

      // Mock schema check and delete result
      mockKnex.schema.hasColumn.mockResolvedValueOnce(true);
      mockKnex.del.mockResolvedValueOnce(1);

      const result = await tenantAwareDatabaseService.deleteWithTenant(
        tableName,
        whereClause,
        tenantId
      );

      expect(result).toBe(1);
      expect(mockKnex.where).toHaveBeenCalledWith('tenant_id', tenantId);
      expect(mockKnex.where).toHaveBeenCalledWith(whereClause);
      expect(mockKnex.del).toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith({
        message: 'Tenant-aware delete executed',
        tableName,
        tenantId,
        affectedRows: 1,
      });
    });

    it('should execute transactions with tenant context', async () => {
      const tenantId = 'tenant-123';
      const mockTransactionResult = { success: true };

      const result = await tenantAwareDatabaseService.executeInTenantTransaction(
        tenantId,
        async (trx) => {
          expect(trx.raw).toHaveBeenCalledWith('SELECT set_tenant_context(?, ?)', ['', tenantId]);
          return mockTransactionResult;
        }
      );

      expect(result).toEqual(mockTransactionResult);
      expect(mockKnex.transaction).toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith({
        message: 'Tenant transaction completed successfully',
        tenantId,
      });
    });

    it('should validate record tenancy correctly', async () => {
      const tenantId = 'tenant-123';
      const tableName = 'users';
      const recordId = 'user-1';

      // Mock schema check and record validation
      mockKnex.schema.hasColumn.mockResolvedValueOnce(true);
      mockKnex.first.mockResolvedValueOnce({
        id: recordId,
        tenant_id: tenantId,
        name: 'Test User'
      });

      const result = await tenantAwareDatabaseService.validateRecordTenancy(
        tableName,
        recordId,
        tenantId
      );

      expect(result).toBe(true);
      expect(mockKnex.where).toHaveBeenCalledWith('id', recordId);
      expect(mockKnex.where).toHaveBeenCalledWith('tenant_id', tenantId);
      expect(mockKnex.first).toHaveBeenCalled();
    });
  });

  describe('Data Isolation Between Tenants', () => {
    it('should isolate tenant data correctly', async () => {
      const tenant1Id = 'tenant-1';
      const tenant2Id = 'tenant-2';
      const tableName = 'users';

      // Mock schema check
      mockKnex.schema.hasColumn.mockResolvedValue(true);

      // Test tenant 1 query
      const tenant1Results = [{ id: '1', name: 'Tenant 1 User', tenant_id: tenant1Id }];
      mockKnex.mockResolvedValueOnce(tenant1Results);

      const result1 = await tenantAwareDatabaseService.executeTenantQuery(
        tableName,
        (query) => query.select('*'),
        tenant1Id
      );

      // Test tenant 2 query
      const tenant2Results = [{ id: '2', name: 'Tenant 2 User', tenant_id: tenant2Id }];
      mockKnex.mockResolvedValueOnce(tenant2Results);

      const result2 = await tenantAwareDatabaseService.executeTenantQuery(
        tableName,
        (query) => query.select('*'),
        tenant2Id
      );

      // Verify isolation
      expect(result1).toEqual(tenant1Results);
      expect(result2).toEqual(tenant2Results);
      expect(result1[0].tenant_id).toBe(tenant1Id);
      expect(result2[0].tenant_id).toBe(tenant2Id);
      expect(result1[0].tenant_id).not.toBe(result2[0].tenant_id);

      // Verify separate tenant filtering was applied
      expect(mockKnex.where).toHaveBeenCalledWith('tenant_id', tenant1Id);
      expect(mockKnex.where).toHaveBeenCalledWith('tenant_id', tenant2Id);
    });

    it('should prevent cross-tenant data access', async () => {
      const tenant1Id = 'tenant-1';
      const tenant2Id = 'tenant-2';
      const recordId = 'user-1';
      const tableName = 'users';

      // Mock schema check
      mockKnex.schema.hasColumn.mockResolvedValueOnce(true);

      // Mock record that belongs to tenant 1
      mockKnex.first.mockResolvedValueOnce(null); // No record found for tenant 2

      const result = await tenantAwareDatabaseService.validateRecordTenancy(
        tableName,
        recordId,
        tenant2Id // Trying to access with wrong tenant
      );

      expect(result).toBe(false);
      expect(mockKnex.where).toHaveBeenCalledWith('id', recordId);
      expect(mockKnex.where).toHaveBeenCalledWith('tenant_id', tenant2Id);
    });

    it('should maintain tenant context across multiple operations', async () => {
      const tenantId = 'tenant-123';
      const userId = 'user-456';

      // Set tenant context
      mockKnex.raw.mockResolvedValue({ rows: [] });
      await tenantContextService.setTenantContext(userId, tenantId);

      // Get current tenant ID
      mockKnex.raw.mockResolvedValueOnce({
        rows: [{ tenant_id: tenantId }]
      });
      const currentTenantId = await tenantContextService.getCurrentTenantId();

      // Verify context is maintained
      expect(currentTenantId).toBe(tenantId);
      expect(mockKnex.raw).toHaveBeenCalledWith('SELECT set_tenant_context(?, ?)', [userId, tenantId]);
      expect(mockKnex.raw).toHaveBeenCalledWith(
        "SELECT current_setting('app.current_tenant_id', true) as tenant_id"
      );
    });
  });

  describe('Comprehensive Error Handling Tests', () => {
    it('should handle tenant creation errors gracefully', async () => {
      const createTenantRequest: CreateTenantRequest = {
        name: 'Test Gym',
        domain: 'test.com',
        settings: {} as TenantSettings
      };

      // Mock database error
      mockKnex.first.mockResolvedValueOnce(null); // Domain available
      mockKnex.returning.mockRejectedValueOnce(new Error('Database connection failed'));

      await expect(tenantService.createTenant(createTenantRequest)).rejects.toThrow('Database connection failed');

      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Create tenant error',
        fullMessage: 'Database connection failed',
        tenantName: createTenantRequest.name,
      });
    });

    it('should handle tenant context errors gracefully', async () => {
      const userId = 'user-123';
      const tenantId = 'tenant-456';

      // Mock database error
      mockKnex.raw.mockRejectedValueOnce(new Error('Connection timeout'));

      await expect(tenantContextService.setTenantContext(userId, tenantId)).rejects.toThrow('Connection timeout');
    });

    it('should handle tenant-aware database operation errors gracefully', async () => {
      const tenantId = 'tenant-123';
      const tableName = 'users';

      // Mock schema check failure
      mockKnex.schema.hasColumn.mockRejectedValueOnce(new Error('Schema access denied'));

      await expect(
        tenantAwareDatabaseService.executeTenantQuery(
          tableName,
          (query) => query.select('*'),
          tenantId
        )
      ).rejects.toThrow('Schema access denied');

      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Tenant-aware query error',
        fullMessage: 'Schema access denied',
        tableName,
        tenantId,
      });
    });

    it('should handle transaction rollback correctly', async () => {
      const tenantId = 'tenant-123';

      // Mock transaction that throws error
      const mockTransaction = {
        raw: jest.fn().mockResolvedValue({ rows: [] }),
        commit: jest.fn(),
        rollback: jest.fn().mockResolvedValue(undefined)
      };

      mockKnex.transaction.mockImplementation(async (callback) => {
        try {
          return await callback(mockTransaction);
        } catch (error) {
          await mockTransaction.rollback();
          throw error;
        }
      });

      await expect(
        tenantAwareDatabaseService.executeInTenantTransaction(tenantId, async () => {
          throw new Error('Transaction failed');
        })
      ).rejects.toThrow('Transaction failed');

      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Tenant transaction error',
        fullMessage: 'Transaction failed',
        tenantId,
      });
    });
  });

  describe('Service Integration and Workflow Tests', () => {
    it('should integrate tenant services for complete tenant lifecycle', async () => {
      const testTenant = createTestTenant({
        name: 'Integration Test Gym',
        domain: 'integration.com'
      });

      // 1. Create tenant
      const createRequest: CreateTenantRequest = {
        name: testTenant.name,
        domain: testTenant.domain,
        settings: testTenant.settings
      };

      mockKnex.first.mockResolvedValueOnce(null); // Domain available
      mockKnex.returning.mockResolvedValueOnce([{
        id: testTenant.id,
        name: testTenant.name,
        domain: testTenant.domain,
        status: testTenant.status,
        settings: testTenant.settings,
        billing: testTenant.billing,
        created_at: testTenant.createdAt,
        updated_at: testTenant.updatedAt,
      }]);

      const createdTenant = await tenantService.createTenant(createRequest);
      expect(createdTenant.id).toBe(testTenant.id);

      // 2. Set tenant context
      mockKnex.raw.mockResolvedValue({ rows: [] });
      await tenantContextService.setTenantContext('user-123', createdTenant.id);

      // 3. Validate tenant access
      mockKnex.raw.mockResolvedValueOnce({
        rows: [{ is_valid: true }]
      });
      const hasAccess = await tenantContextService.validateTenantAccess('user-123', createdTenant.id);
      expect(hasAccess).toBe(true);

      // 4. Perform tenant-aware database operation
      mockKnex.schema.hasColumn.mockResolvedValueOnce(true);
      mockKnex.mockResolvedValueOnce([{ id: '1', name: 'Test Data' }]);

      const data = await tenantAwareDatabaseService.executeTenantQuery(
        'test_table',
        (query) => query.select('*'),
        createdTenant.id
      );
      expect(data).toHaveLength(1);

      // Verify all operations were called correctly
      expect(mockKnex.insert).toHaveBeenCalled(); // Tenant creation
      expect(mockKnex.raw).toHaveBeenCalledWith('SELECT set_tenant_context(?, ?)', ['user-123', createdTenant.id]);
      expect(mockKnex.where).toHaveBeenCalledWith('tenant_id', createdTenant.id);
    });

    it('should maintain data consistency across tenant operations', async () => {
      const tenantId = 'consistency-test-tenant';
      const tableName = 'test_data';

      // Mock schema checks
      mockKnex.schema.hasColumn.mockResolvedValue(true);

      // 1. Insert data
      const insertData = { name: 'Test Item', value: 100 };
      mockKnex.returning.mockResolvedValueOnce([{ id: '1', ...insertData, tenant_id: tenantId }]);

      const insertResult = await tenantAwareDatabaseService.insertWithTenant(tableName, insertData, tenantId);
      expect(insertResult[0].tenant_id).toBe(tenantId);

      // 2. Update data
      mockKnex.update.mockResolvedValueOnce(1);
      const updateResult = await tenantAwareDatabaseService.updateWithTenant(
        tableName,
        { id: '1' },
        { value: 200 },
        tenantId
      );
      expect(updateResult).toBe(1);

      // 3. Query data
      mockKnex.mockResolvedValueOnce([{ id: '1', name: 'Test Item', value: 200, tenant_id: tenantId }]);
      const queryResult = await tenantAwareDatabaseService.executeTenantQuery(
        tableName,
        (query) => query.select('*'),
        tenantId
      );
      expect(queryResult[0].tenant_id).toBe(tenantId);

      // Verify tenant filtering was applied consistently
      const tenantFilterCalls = mockKnex.where.mock.calls.filter(call => 
        call[0] === 'tenant_id' && call[1] === tenantId
      );
      expect(tenantFilterCalls.length).toBeGreaterThan(0);
    });
  });

  describe('Mock State Management and Cleanup', () => {
    it('should reset mocks between tests', () => {
      // Call a method
      mockKnex.first();
      
      expect(mockKnex.first).toHaveBeenCalledTimes(1);
      
      // Clear mocks (this happens in afterEach)
      jest.clearAllMocks();
      
      expect(mockKnex.first).toHaveBeenCalledTimes(0);
    });

    it('should allow different mock behaviors per test', async () => {
      // Test 1: Domain available
      mockKnex.first.mockResolvedValueOnce(null);
      const available1 = await tenantService.validateTenantDomain('test1.com');
      expect(available1).toBe(true);

      // Test 2: Domain taken
      const existingTenant = createTestTenant({ domain: 'test2.com' });
      mockKnex.first.mockResolvedValueOnce(existingTenant);
      const available2 = await tenantService.validateTenantDomain('test2.com');
      expect(available2).toBe(false);

      // Verify different behaviors worked
      expect(available1).not.toBe(available2);
    });
  });
});