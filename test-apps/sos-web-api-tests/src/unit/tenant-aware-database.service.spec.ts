/**
 * TenantAwareDatabaseService Unit Tests
 * 
 * This test file demonstrates the new separated test application pattern:
 * - Imports production TenantAwareDatabaseService from @strengthos/sos-web-api
 * - Uses TestModuleBuilder from @strengthos/shared-testing for proper isolation
 * - Implements comprehensive mocking with dependency injection overrides
 * - Tests run in isolation without shared state or external dependencies
 */

import { TestingModule } from '@nestjs/testing';

// Import production code from the sos-web-api application
import { TenantAwareDatabaseService } from '@strengthos/sos-web-api/src/tenant/services/tenant-aware-database.service';
import { DatabaseService } from '@strengthos/sos-web-api/src/database/database.service';
import { TenantContextService } from '@strengthos/sos-web-api/src/tenant/services/tenant-context.service';

// Import test infrastructure from libs/shared-testing
import { TestModuleBuilder } from '@strengthos/shared-testing/src/builders/test-module-builder';

describe('TenantAwareDatabaseService', () => {
  let service: TenantAwareDatabaseService;
  let databaseService: jest.Mocked<DatabaseService>;
  let tenantContextService: jest.Mocked<TenantContextService>;
  let mockLogger: any;
  let mockKnex: any;
  let module: TestingModule;

  beforeEach(async () => {
    // Create mock query builder
    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      del: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(null),
      then: jest.fn().mockImplementation((onResolve) => Promise.resolve([]).then(onResolve))
    };

    // Create mock Knex instance
    mockKnex = jest.fn().mockReturnValue(mockQueryBuilder);
    mockKnex.raw = jest.fn().mockResolvedValue({ rows: [] });
    mockKnex.transaction = jest.fn().mockImplementation((callback) => {
      const mockTrx = {
        ...mockQueryBuilder,
        raw: jest.fn().mockResolvedValue({ rows: [] }),
        commit: jest.fn().mockResolvedValue(undefined),
        rollback: jest.fn().mockResolvedValue(undefined)
      };
      return callback(mockTrx);
    });
    mockKnex.schema = {
      hasColumn: jest.fn().mockResolvedValue(true)
    };
    
    // Create mock database service
    databaseService = {
      knex: mockKnex
    } as jest.Mocked<DatabaseService>;

    // Create mock tenant context service
    tenantContextService = {
      setTenantContext: jest.fn().mockResolvedValue(undefined)
    } as jest.Mocked<TenantContextService>;

    // Create mock logger
    mockLogger = {
      debug: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn()
    };

    // Build test module using TestModuleBuilder
    const testResult = await TestModuleBuilder
      .forService(TenantAwareDatabaseService)
      .withMocks([
        { provide: DatabaseService, useValue: databaseService },
        { provide: TenantContextService, useValue: tenantContextService },
        { provide: 'ILogger', useValue: mockLogger }
      ])
      .build();

    service = testResult.service;
    module = testResult.module;
  });

  afterEach(async () => {
    await module.close();
    jest.clearAllMocks();
  });

  describe('getTenantAwareQuery', () => {
    it('should return query builder without tenant filtering when no tenant ID provided', async () => {
      // Act
      const result = await service.getTenantAwareQuery('users');

      // Assert
      expect(mockKnex).toHaveBeenCalledWith('users');
      expect(tenantContextService.setTenantContext).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should apply tenant filtering when tenant ID is provided and table has tenant_id column', async () => {
      // Arrange
      mockKnex.schema.hasColumn.mockResolvedValue(true);

      // Act
      const result = await service.getTenantAwareQuery('users', 'tenant-1');

      // Assert
      expect(mockKnex).toHaveBeenCalledWith('users');
      expect(tenantContextService.setTenantContext).toHaveBeenCalledWith('', 'tenant-1');
      expect(mockKnex.schema.hasColumn).toHaveBeenCalledWith('users', 'tenant_id');
      expect(result).toBeDefined();
    });

    it('should set tenant context but not apply filtering when table has no tenant_id column', async () => {
      // Arrange
      mockKnex.schema.hasColumn.mockResolvedValue(false);

      // Act
      const result = await service.getTenantAwareQuery('system_config', 'tenant-1');

      // Assert
      expect(tenantContextService.setTenantContext).toHaveBeenCalledWith('', 'tenant-1');
      expect(result).toBeDefined();
    });
  });

  describe('executeTenantQuery', () => {
    it('should execute tenant-aware query and log results', async () => {
      // Arrange
      const mockResults = [{ id: 1, name: 'Test' }, { id: 2, name: 'Test2' }];
      const mockQueryBuilder = mockKnex();
      mockQueryBuilder.select.mockResolvedValue(mockResults);
      mockKnex.schema.hasColumn.mockResolvedValue(true);

      const queryBuilderFn = (query: any) => query.select('*');

      // Act
      const result = await service.executeTenantQuery('users', queryBuilderFn, 'tenant-1');

      // Assert
      expect(result).toEqual(mockResults);
      expect(mockLogger.debug).toHaveBeenCalledWith({
        message: 'Tenant-aware query executed',
        tableName: 'users',
        tenantId: 'tenant-1',
        resultCount: 2
      });
    });

    it('should log error and rethrow when query fails', async () => {
      // Arrange
      const error = new Error('Database error');
      const mockQueryBuilder = mockKnex();
      mockQueryBuilder.select.mockRejectedValue(error);
      mockKnex.schema.hasColumn.mockResolvedValue(true);

      const queryBuilderFn = (query: any) => query.select('*');

      // Act & Assert
      await expect(service.executeTenantQuery('users', queryBuilderFn, 'tenant-1')).rejects.toThrow(error);
      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Tenant-aware query error',
        fullMessage: 'Database error',
        tableName: 'users',
        tenantId: 'tenant-1'
      });
    });
  });

  describe('insertWithTenant', () => {
    it('should insert single record with tenant ID injection', async () => {
      // Arrange
      const insertData = { name: 'Test User', email: 'test@example.com' };
      const expectedData = { ...insertData, tenant_id: 'tenant-1' };
      const insertResult = [{ id: 1, ...expectedData }];
      
      mockKnex.schema.hasColumn.mockResolvedValue(true);
      const mockQueryBuilder = mockKnex();
      mockQueryBuilder.returning.mockResolvedValue(insertResult);

      // Act
      const result = await service.insertWithTenant('users', insertData, 'tenant-1');

      // Assert
      expect(tenantContextService.setTenantContext).toHaveBeenCalledWith('', 'tenant-1');
      expect(mockKnex.schema.hasColumn).toHaveBeenCalledWith('users', 'tenant_id');
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(expectedData);
      expect(mockQueryBuilder.returning).toHaveBeenCalledWith('*');
      expect(result).toEqual(insertResult);
      expect(mockLogger.debug).toHaveBeenCalledWith({
        message: 'Tenant-aware insert executed',
        tableName: 'users',
        tenantId: 'tenant-1',
        insertCount: 1
      });
    });

    it('should insert multiple records with tenant ID injection', async () => {
      // Arrange
      const insertData = [
        { name: 'User 1', email: 'user1@example.com' },
        { name: 'User 2', email: 'user2@example.com' }
      ];
      const expectedData = insertData.map(item => ({ ...item, tenant_id: 'tenant-1' }));
      const insertResult = expectedData.map((item, index) => ({ id: index + 1, ...item }));
      
      mockKnex.schema.hasColumn.mockResolvedValue(true);
      const mockQueryBuilder = mockKnex();
      mockQueryBuilder.returning.mockResolvedValue(insertResult);

      // Act
      const result = await service.insertWithTenant('users', insertData, 'tenant-1');

      // Assert
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(expectedData);
      expect(result).toEqual(insertResult);
      expect(mockLogger.debug).toHaveBeenCalledWith({
        message: 'Tenant-aware insert executed',
        tableName: 'users',
        tenantId: 'tenant-1',
        insertCount: 2
      });
    });

    it('should insert without tenant ID injection when table has no tenant_id column', async () => {
      // Arrange
      const insertData = { config_key: 'test', config_value: 'value' };
      const insertResult = [{ id: 1, ...insertData }];
      
      mockKnex.schema.hasColumn.mockResolvedValue(false);
      const mockQueryBuilder = mockKnex();
      mockQueryBuilder.returning.mockResolvedValue(insertResult);

      // Act
      const result = await service.insertWithTenant('system_config', insertData, 'tenant-1');

      // Assert
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(insertData); // No tenant_id added
      expect(result).toEqual(insertResult);
    });

    it('should log error and rethrow when insert fails', async () => {
      // Arrange
      const error = new Error('Insert failed');
      const insertData = { name: 'Test' };
      
      mockKnex.schema.hasColumn.mockResolvedValue(true);
      const mockQueryBuilder = mockKnex();
      mockQueryBuilder.returning.mockRejectedValue(error);

      // Act & Assert
      await expect(service.insertWithTenant('users', insertData, 'tenant-1')).rejects.toThrow(error);
      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Tenant-aware insert error',
        fullMessage: 'Insert failed',
        tableName: 'users',
        tenantId: 'tenant-1'
      });
    });
  });

  describe('updateWithTenant', () => {
    it('should update records with tenant isolation', async () => {
      // Arrange
      const whereClause = { id: 'user-1' };
      const updateData = { name: 'Updated Name' };
      const affectedRows = 1;
      
      mockKnex.schema.hasColumn.mockResolvedValue(true);
      const mockQueryBuilder = mockKnex();
      mockQueryBuilder.update.mockResolvedValue(affectedRows);

      // Act
      const result = await service.updateWithTenant('users', whereClause, updateData, 'tenant-1');

      // Assert
      expect(tenantContextService.setTenantContext).toHaveBeenCalledWith('', 'tenant-1');
      expect(mockKnex.schema.hasColumn).toHaveBeenCalledWith('users', 'tenant_id');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('tenant_id', 'tenant-1');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(whereClause);
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(updateData);
      expect(result).toBe(affectedRows);
      expect(mockLogger.debug).toHaveBeenCalledWith({
        message: 'Tenant-aware update executed',
        tableName: 'users',
        tenantId: 'tenant-1',
        affectedRows
      });
    });

    it('should update without tenant filtering when table has no tenant_id column', async () => {
      // Arrange
      const whereClause = { config_key: 'test' };
      const updateData = { config_value: 'new_value' };
      const affectedRows = 1;
      
      mockKnex.schema.hasColumn.mockResolvedValue(false);
      const mockQueryBuilder = mockKnex();
      mockQueryBuilder.update.mockResolvedValue(affectedRows);

      // Act
      const result = await service.updateWithTenant('system_config', whereClause, updateData, 'tenant-1');

      // Assert
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(whereClause);
      expect(result).toBe(affectedRows);
    });
  });

  describe('deleteWithTenant', () => {
    it('should delete records with tenant isolation', async () => {
      // Arrange
      const whereClause = { id: 'user-1' };
      const affectedRows = 1;
      
      mockKnex.schema.hasColumn.mockResolvedValue(true);
      const mockQueryBuilder = mockKnex();
      mockQueryBuilder.del.mockResolvedValue(affectedRows);

      // Act
      const result = await service.deleteWithTenant('users', whereClause, 'tenant-1');

      // Assert
      expect(tenantContextService.setTenantContext).toHaveBeenCalledWith('', 'tenant-1');
      expect(mockKnex.schema.hasColumn).toHaveBeenCalledWith('users', 'tenant_id');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('tenant_id', 'tenant-1');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(whereClause);
      expect(mockQueryBuilder.del).toHaveBeenCalled();
      expect(result).toBe(affectedRows);
      expect(mockLogger.debug).toHaveBeenCalledWith({
        message: 'Tenant-aware delete executed',
        tableName: 'users',
        tenantId: 'tenant-1',
        affectedRows
      });
    });
  });

  describe('executeInTenantTransaction', () => {
    it('should execute callback in tenant transaction and commit', async () => {
      // Arrange
      const callback = jest.fn().mockResolvedValue('success');

      // Act
      const result = await service.executeInTenantTransaction('tenant-1', callback);

      // Assert
      expect(mockKnex.transaction).toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();
      expect(result).toBe('success');
      expect(mockLogger.debug).toHaveBeenCalledWith({
        message: 'Tenant transaction completed successfully',
        tenantId: 'tenant-1'
      });
    });

    it('should rollback transaction and rethrow error when callback fails', async () => {
      // Arrange
      const error = new Error('Transaction failed');
      const callback = jest.fn().mockRejectedValue(error);

      // Act & Assert
      await expect(service.executeInTenantTransaction('tenant-1', callback)).rejects.toThrow(error);
      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Tenant transaction error',
        fullMessage: 'Transaction failed',
        tenantId: 'tenant-1'
      });
    });
  });

  describe('validateRecordTenancy', () => {
    it('should validate record belongs to tenant', async () => {
      // Arrange
      const mockRecord = { id: 'user-1', tenant_id: 'tenant-1' };
      mockKnex.schema.hasColumn.mockResolvedValue(true);
      const mockQueryBuilder = mockKnex();
      mockQueryBuilder.first.mockResolvedValue(mockRecord);

      // Act
      const result = await service.validateRecordTenancy('users', 'user-1', 'tenant-1');

      // Assert
      expect(mockKnex.schema.hasColumn).toHaveBeenCalledWith('users', 'tenant_id');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('id', 'user-1');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('tenant_id', 'tenant-1');
      expect(result).toBe(true);
    });

    it('should return false when record does not belong to tenant', async () => {
      // Arrange
      mockKnex.schema.hasColumn.mockResolvedValue(true);
      const mockQueryBuilder = mockKnex();
      mockQueryBuilder.first.mockResolvedValue(null);

      // Act
      const result = await service.validateRecordTenancy('users', 'user-1', 'tenant-1');

      // Assert
      expect(result).toBe(false);
    });

    it('should return true when table has no tenant_id column', async () => {
      // Arrange
      mockKnex.schema.hasColumn.mockResolvedValue(false);

      // Act
      const result = await service.validateRecordTenancy('system_config', 'config-1', 'tenant-1');

      // Assert
      expect(result).toBe(true);
    });

    it('should use custom ID column when specified', async () => {
      // Arrange
      const mockRecord = { uuid: 'user-uuid', tenant_id: 'tenant-1' };
      mockKnex.schema.hasColumn.mockResolvedValue(true);
      const mockQueryBuilder = mockKnex();
      mockQueryBuilder.first.mockResolvedValue(mockRecord);

      // Act
      const result = await service.validateRecordTenancy('users', 'user-uuid', 'tenant-1', 'uuid');

      // Assert
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('uuid', 'user-uuid');
      expect(result).toBe(true);
    });

    it('should log error and return false when validation fails', async () => {
      // Arrange
      const error = new Error('Validation error');
      mockKnex.schema.hasColumn.mockRejectedValue(error);

      // Act
      const result = await service.validateRecordTenancy('users', 'user-1', 'tenant-1');

      // Assert
      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Record tenancy validation error',
        fullMessage: 'Validation error',
        tableName: 'users',
        recordId: 'user-1',
        tenantId: 'tenant-1'
      });
    });
  });
});