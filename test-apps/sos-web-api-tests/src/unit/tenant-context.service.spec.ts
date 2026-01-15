/**
 * TenantContextService Unit Tests
 * 
 * This test file demonstrates the new separated test application pattern:
 * - Imports production TenantContextService from @strengthos/sos-web-api
 * - Uses TestModuleBuilder from @strengthos/shared-testing for proper isolation
 * - Implements comprehensive mocking with dependency injection overrides
 * - Tests run in isolation without shared state or external dependencies
 */

import { TestingModule } from '@nestjs/testing';

// Import production code from the sos-web-api application
import { TenantContextService } from '@strengthos/sos-web-api/src/tenant/services/tenant-context.service';
import { DatabaseService } from '@strengthos/sos-web-api/src/database/database.service';
import { TenantRepository } from '@strengthos/sos-web-api/src/tenant/repositories/tenant.repository';
import { UserRole } from '@strengthos/shared-types';
import { TenantContext } from '@strengthos/shared-types';

// Import test infrastructure from libs/shared-testing
import { TestModuleBuilder } from '@strengthos/shared-testing/src/builders/test-module-builder';
import { createMockKnex, createMockRepository } from '@strengthos/shared-testing/src/mocks/database-mocks';
import { tenantFactory } from '@strengthos/shared-testing/src/factories/tenant-factory';

describe('TenantContextService', () => {
  let service: TenantContextService;
  let databaseService: jest.Mocked<DatabaseService>;
  let tenantRepository: jest.Mocked<TenantRepository>;
  let mockKnex: any;
  let module: TestingModule;

  // Test data setup using factory
  const mockTenant = tenantFactory.create({
    id: 'tenant-1',
    name: 'Test Tenant',
    status: 'ACTIVE'
  });

  const mockUser = {
    id: 'user-1',
    tenant_id: 'tenant-1',
    role: UserRole.ATHLETE,
    status: 'ACTIVE'
  };

  const mockSuperAdmin = {
    id: 'admin-1',
    tenant_id: 'system',
    role: UserRole.SUPER_ADMIN,
    status: 'ACTIVE'
  };

  beforeEach(async () => {
    // Create mock Knex instance
    mockKnex = createMockKnex();
    
    // Create mock database service
    databaseService = {
      knex: mockKnex
    } as jest.Mocked<DatabaseService>;

    // Create mock tenant repository
    tenantRepository = createMockRepository<any>() as jest.Mocked<TenantRepository>;

    // Build test module using TestModuleBuilder
    const testResult = await TestModuleBuilder
      .forService(TenantContextService)
      .withMocks([
        { provide: DatabaseService, useValue: databaseService },
        { provide: TenantRepository, useValue: tenantRepository }
      ])
      .build();

    service = testResult.service;
    module = testResult.module;
  });

  afterEach(async () => {
    await module.close();
    jest.clearAllMocks();
  });

  describe('setTenantContext', () => {
    it('should set tenant context using raw SQL', async () => {
      // Arrange
      mockKnex.raw.mockResolvedValue({ rows: [] });

      // Act
      await service.setTenantContext('user-1', 'tenant-1');

      // Assert
      expect(mockKnex.raw).toHaveBeenCalledWith('SELECT set_tenant_context(?, ?)', ['user-1', 'tenant-1']);
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      mockKnex.raw.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.setTenantContext('user-1', 'tenant-1')).rejects.toThrow('Database error');
    });
  });

  describe('validateTenantAccess', () => {
    it('should validate tenant access using stored procedure', async () => {
      // Arrange
      mockKnex.raw.mockResolvedValue({ rows: [{ is_valid: true }] });

      // Act
      const result = await service.validateTenantAccess('user-1', 'tenant-1');

      // Assert
      expect(mockKnex.raw).toHaveBeenCalledWith(
        'SELECT validate_tenant_access(?, ?) as is_valid',
        ['user-1', 'tenant-1']
      );
      expect(result).toBe(true);
    });

    it('should return false when stored procedure returns false', async () => {
      // Arrange
      mockKnex.raw.mockResolvedValue({ rows: [{ is_valid: false }] });

      // Act
      const result = await service.validateTenantAccess('user-1', 'tenant-1');

      // Assert
      expect(result).toBe(false);
    });

    it('should fallback to basic validation when stored procedure fails', async () => {
      // Arrange
      mockKnex.raw.mockRejectedValue(new Error('Stored procedure not found'));
      
      // Mock the fallback query chain
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockUser)
      };
      mockKnex.mockReturnValue(mockQuery);

      // Act
      const result = await service.validateTenantAccess('user-1', 'tenant-1');

      // Assert
      expect(mockKnex).toHaveBeenCalledWith('users');
      expect(mockQuery.where).toHaveBeenCalledWith('id', 'user-1');
      expect(mockQuery.where).toHaveBeenCalledWith('tenant_id', 'tenant-1');
      expect(mockQuery.where).toHaveBeenCalledWith('status', '!=', 'DEACTIVATED');
      expect(result).toBe(true);
    });

    it('should validate super admin access in fallback mode', async () => {
      // Arrange
      mockKnex.raw.mockRejectedValue(new Error('Stored procedure not found'));
      
      // Mock the first query (regular user) to return null
      const mockUserQuery = {
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null)
      };
      
      // Mock the second query (super admin) to return admin user
      const mockAdminQuery = {
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockSuperAdmin)
      };
      
      mockKnex
        .mockReturnValueOnce(mockUserQuery)
        .mockReturnValueOnce(mockAdminQuery);

      // Act
      const result = await service.validateTenantAccess('admin-1', 'tenant-1');

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when user has no access in fallback mode', async () => {
      // Arrange
      mockKnex.raw.mockRejectedValue(new Error('Stored procedure not found'));
      
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null)
      };
      
      mockKnex.mockReturnValue(mockQuery);

      // Act
      const result = await service.validateTenantAccess('user-1', 'tenant-1');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getUserTenantContext', () => {
    it('should get user tenant context using stored procedure', async () => {
      // Arrange
      const contextRow = {
        tenant_id: 'tenant-1',
        user_role: UserRole.ATHLETE
      };
      mockKnex.raw.mockResolvedValue({ rows: [contextRow] });
      tenantRepository.findById.mockResolvedValue(mockTenant);

      // Act
      const result = await service.getUserTenantContext('user-1');

      // Assert
      expect(mockKnex.raw).toHaveBeenCalledWith('SELECT * FROM get_user_tenant_context(?)', ['user-1']);
      expect(tenantRepository.findById).toHaveBeenCalledWith('tenant-1');
      expect(result).toEqual({
        tenantId: 'tenant-1',
        userId: 'user-1',
        role: UserRole.ATHLETE,
        permissions: [],
        settings: mockTenant.settings
      });
    });

    it('should return null when stored procedure returns no rows', async () => {
      // Arrange
      mockKnex.raw.mockResolvedValue({ rows: [] });

      // Act
      const result = await service.getUserTenantContext('user-1');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when tenant not found', async () => {
      // Arrange
      const contextRow = { tenant_id: 'tenant-1', user_role: UserRole.ATHLETE };
      mockKnex.raw.mockResolvedValue({ rows: [contextRow] });
      tenantRepository.findById.mockResolvedValue(null);

      // Act
      const result = await service.getUserTenantContext('user-1');

      // Assert
      expect(result).toBeNull();
    });

    it('should fallback to basic context retrieval when stored procedure fails', async () => {
      // Arrange
      mockKnex.raw.mockRejectedValue(new Error('Stored procedure not found'));
      
      const mockUserQuery = {
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockUser)
      };
      mockKnex.mockReturnValue(mockUserQuery);
      tenantRepository.findById.mockResolvedValue(mockTenant);

      // Act
      const result = await service.getUserTenantContext('user-1');

      // Assert
      expect(mockKnex).toHaveBeenCalledWith('users');
      expect(result).toEqual({
        tenantId: 'tenant-1',
        userId: 'user-1',
        role: UserRole.ATHLETE,
        permissions: [],
        settings: mockTenant.settings
      });
    });

    it('should return null in fallback when user not found', async () => {
      // Arrange
      mockKnex.raw.mockRejectedValue(new Error('Stored procedure not found'));
      
      const mockUserQuery = {
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null)
      };
      mockKnex.mockReturnValue(mockUserQuery);

      // Act
      const result = await service.getUserTenantContext('user-1');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('clearTenantContext', () => {
    it('should clear tenant context configuration', async () => {
      // Arrange
      mockKnex.raw.mockResolvedValue({ rows: [] });

      // Act
      await service.clearTenantContext();

      // Assert
      expect(mockKnex.raw).toHaveBeenCalledWith("SELECT set_config('app.current_tenant_id', '', true)");
      expect(mockKnex.raw).toHaveBeenCalledWith("SELECT set_config('app.current_user_id', '', true)");
    });

    it('should ignore errors when configuration variables do not exist', async () => {
      // Arrange
      mockKnex.raw.mockRejectedValue(new Error('Configuration variable not found'));

      // Act & Assert - should not throw
      await expect(service.clearTenantContext()).resolves.toBeUndefined();
    });
  });

  describe('getCurrentTenantId', () => {
    it('should get current tenant ID from database context', async () => {
      // Arrange
      mockKnex.raw.mockResolvedValue({ rows: [{ tenant_id: 'tenant-1' }] });

      // Act
      const result = await service.getCurrentTenantId();

      // Assert
      expect(mockKnex.raw).toHaveBeenCalledWith("SELECT current_setting('app.current_tenant_id', true) as tenant_id");
      expect(result).toBe('tenant-1');
    });

    it('should return null when tenant ID is empty string', async () => {
      // Arrange
      mockKnex.raw.mockResolvedValue({ rows: [{ tenant_id: '' }] });

      // Act
      const result = await service.getCurrentTenantId();

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when database query fails', async () => {
      // Arrange
      mockKnex.raw.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await service.getCurrentTenantId();

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('refreshTenantStats', () => {
    it('should refresh tenant statistics materialized view', async () => {
      // Arrange
      mockKnex.raw.mockResolvedValue({ rows: [] });

      // Act
      await service.refreshTenantStats();

      // Assert
      expect(mockKnex.raw).toHaveBeenCalledWith('SELECT refresh_tenant_stats()');
    });

    it('should ignore errors when function does not exist', async () => {
      // Arrange
      mockKnex.raw.mockRejectedValue(new Error('Function not found'));

      // Act & Assert - should not throw
      await expect(service.refreshTenantStats()).resolves.toBeUndefined();
    });
  });

  describe('getTenantStats', () => {
    const mockStats = [
      { tenant_id: 'tenant-1', user_count: 10, active_sessions: 5 }
    ];

    it('should get all tenant statistics', async () => {
      // Arrange
      const mockQuery = {
        select: jest.fn().mockResolvedValue(mockStats)
      };
      mockKnex.mockReturnValue(mockQuery);

      // Act
      const result = await service.getTenantStats();

      // Assert
      expect(mockKnex).toHaveBeenCalledWith('v_tenant_stats');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(result).toEqual(mockStats);
    });

    it('should get statistics for specific tenant', async () => {
      // Arrange
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue(mockStats)
      };
      mockKnex.mockReturnValue(mockQuery);

      // Act
      const result = await service.getTenantStats('tenant-1');

      // Assert
      expect(mockQuery.where).toHaveBeenCalledWith('tenant_id', 'tenant-1');
      expect(result).toEqual(mockStats);
    });

    it('should return empty array when view does not exist', async () => {
      // Arrange
      mockKnex.mockImplementation(() => {
        throw new Error('View not found');
      });

      // Act
      const result = await service.getTenantStats();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('isTenantActive', () => {
    it('should return true for active tenant', async () => {
      // Arrange
      const activeTenant = tenantFactory.create({ status: 'ACTIVE' });
      tenantRepository.findById.mockResolvedValue(activeTenant);

      // Act
      const result = await service.isTenantActive('tenant-1');

      // Assert
      expect(result).toBe(true);
    });

    it('should return true for trial tenant', async () => {
      // Arrange
      const trialTenant = tenantFactory.create({ status: 'TRIAL' });
      tenantRepository.findById.mockResolvedValue(trialTenant);

      // Act
      const result = await service.isTenantActive('tenant-1');

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for suspended tenant', async () => {
      // Arrange
      const suspendedTenant = tenantFactory.create({ status: 'SUSPENDED' });
      tenantRepository.findById.mockResolvedValue(suspendedTenant);

      // Act
      const result = await service.isTenantActive('tenant-1');

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when tenant not found', async () => {
      // Arrange
      tenantRepository.findById.mockResolvedValue(null);

      // Act
      const result = await service.isTenantActive('tenant-1');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getUserAccessibleTenants', () => {
    it('should return all tenants for super admin', async () => {
      // Arrange
      const mockUserQuery = {
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockSuperAdmin)
      };
      
      const mockTenantsQuery = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue([
          { id: 'tenant-1' },
          { id: 'tenant-2' }
        ])
      };
      
      mockKnex
        .mockReturnValueOnce(mockUserQuery)
        .mockReturnValueOnce(mockTenantsQuery);

      // Act
      const result = await service.getUserAccessibleTenants('admin-1');

      // Assert
      expect(mockKnex).toHaveBeenCalledWith('users');
      expect(mockKnex).toHaveBeenCalledWith('tenants');
      expect(result).toEqual(['tenant-1', 'tenant-2']);
    });

    it('should return user tenant for regular user', async () => {
      // Arrange
      const mockUserQuery = {
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockUser)
      };
      mockKnex.mockReturnValue(mockUserQuery);

      // Act
      const result = await service.getUserAccessibleTenants('user-1');

      // Assert
      expect(result).toEqual(['tenant-1']);
    });

    it('should return empty array when user not found', async () => {
      // Arrange
      const mockUserQuery = {
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null)
      };
      mockKnex.mockReturnValue(mockUserQuery);

      // Act
      const result = await service.getUserAccessibleTenants('user-1');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getTenantDomain', () => {
    it('should return null as placeholder', () => {
      // Act
      const result = service.getTenantDomain();

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('createRequestContext', () => {
    it('should create request context with provided parameters', () => {
      // Act
      const result = service.createRequestContext('user-1', 'session-1', 'request-1');

      // Assert
      expect(result).toEqual({
        userId: 'user-1',
        sessionId: 'session-1',
        requestId: 'request-1',
        tenantId: null,
        timestamp: expect.any(Date)
      });
    });
  });
});