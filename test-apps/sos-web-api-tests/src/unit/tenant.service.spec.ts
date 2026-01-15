/**
 * TenantService Unit Tests
 * 
 * This test file demonstrates the new separated test application pattern:
 * - Imports production TenantService from @strengthos/sos-web-api
 * - Uses TestModuleBuilder from @strengthos/shared-testing for proper isolation
 * - Implements comprehensive mocking with dependency injection overrides
 * - Tests run in isolation without shared state or external dependencies
 */

import { TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';

// Import production code from the sos-web-api application
import { TenantService } from '@strengthos/sos-web-api/src/tenant/services/tenant.service';
import { TenantRepository } from '@strengthos/sos-web-api/src/tenant/repositories/tenant.repository';
import {
  Tenant,
  TenantSettings
} from '@strengthos/shared-types';

// Import test infrastructure from libs/shared-testing
import { TestModuleBuilder } from '@strengthos/shared-testing/src/builders/test-module-builder';
import { createMockRepository } from '@strengthos/shared-testing/src/mocks/database-mocks';
import { tenantFactory } from '@strengthos/shared-testing/src/factories/tenant-factory';

describe('TenantService', () => {
  let service: TenantService;
  let tenantRepository: jest.Mocked<TenantRepository>;
  let mockLogger: any;
  let module: TestingModule;

  // Test data setup using factory
  const mockTenant = tenantFactory.create({
    id: 'tenant-1',
    name: 'Test Tenant',
    domain: 'test.strengthos.com',
    status: 'ACTIVE'
  });

  const createTenantRequest: CreateTenantRequest = {
    name: 'New Tenant',
    domain: 'new.strengthos.com',
    settings: {
      allowSelfCoached: true,
      requireCoachApproval: false,
      enableVideoAnalysis: true,
      enableAIFeedback: true,
      defaultLanguage: 'en',
      availableLanguages: ['en'],
      maxCoaches: 10,
      maxAthletes: 100,
      logo: '',
      complianceSettings: {
        gdprEnabled: true,
        pdpaEnabled: false,
        hipaaEnabled: false,
        consentRequired: true
      }
    }
  };

  beforeEach(async () => {
    // Create mock logger
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    };

    // Create mock repository with enhanced methods
    const mockRepo = createMockRepository<Tenant>();
    tenantRepository = {
      ...mockRepo,
      isDomainAvailable: jest.fn(),
      suspend: jest.fn(),
      reactivate: jest.fn()
    } as jest.Mocked<TenantRepository>;

    // Build test module using TestModuleBuilder
    const testResult = await TestModuleBuilder
      .forService(TenantService)
      .withMocks([
        { provide: TenantRepository, useValue: tenantRepository },
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

  describe('createTenant', () => {
    it('should create a tenant successfully', async () => {
      // Arrange
      tenantRepository.isDomainAvailable.mockResolvedValue(true);
      tenantRepository.create.mockResolvedValue(mockTenant);

      // Act
      const result = await service.createTenant(createTenantRequest);

      // Assert
      expect(tenantRepository.isDomainAvailable).toHaveBeenCalledWith('new.strengthos.com');
      expect(tenantRepository.create).toHaveBeenCalledWith(createTenantRequest);
      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'Tenant created successfully',
        tenantId: mockTenant.id,
        tenantName: createTenantRequest.name
      });
      expect(result).toEqual(mockTenant);
    });

    it('should throw ConflictException when domain already exists', async () => {
      // Arrange
      tenantRepository.isDomainAvailable.mockResolvedValue(false);

      // Act & Assert
      await expect(service.createTenant(createTenantRequest)).rejects.toThrow('Domain already exists');
      expect(tenantRepository.isDomainAvailable).toHaveBeenCalledWith('new.strengthos.com');
      expect(tenantRepository.create).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should create tenant without domain validation when domain is not provided', async () => {
      // Arrange
      const requestWithoutDomain = { ...createTenantRequest, domain: undefined };
      tenantRepository.create.mockResolvedValue(mockTenant);

      // Act
      const result = await service.createTenant(requestWithoutDomain);

      // Assert
      expect(tenantRepository.isDomainAvailable).not.toHaveBeenCalled();
      expect(tenantRepository.create).toHaveBeenCalledWith(requestWithoutDomain);
      expect(result).toEqual(mockTenant);
    });

    it('should log error and rethrow when repository throws error', async () => {
      // Arrange
      const error = new Error('Database error');
      tenantRepository.isDomainAvailable.mockResolvedValue(true);
      tenantRepository.create.mockRejectedValue(error);

      // Act & Assert
      await expect(service.createTenant(createTenantRequest)).rejects.toThrow(error);
      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Create tenant error',
        fullMessage: 'Database error',
        tenantName: createTenantRequest.name
      });
    });
  });

  describe('updateTenant', () => {
    const updateRequest: UpdateTenantRequest = {
      name: 'Updated Tenant',
      domain: 'updated.strengthos.com'
    };

    it('should update tenant successfully', async () => {
      // Arrange
      const updatedTenant = { ...mockTenant, ...updateRequest };
      tenantRepository.isDomainAvailable.mockResolvedValue(true);
      tenantRepository.update.mockResolvedValue(updatedTenant);

      // Act
      const result = await service.updateTenant('tenant-1', updateRequest);

      // Assert
      expect(tenantRepository.isDomainAvailable).toHaveBeenCalledWith('updated.strengthos.com', 'tenant-1');
      expect(tenantRepository.update).toHaveBeenCalledWith('tenant-1', updateRequest);
      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'Tenant updated successfully',
        tenantId: 'tenant-1',
        updates: ['name', 'domain']
      });
      expect(result).toEqual(updatedTenant);
    });

    it('should throw ConflictException when domain already exists', async () => {
      // Arrange
      tenantRepository.isDomainAvailable.mockResolvedValue(false);

      // Act & Assert
      await expect(service.updateTenant('tenant-1', updateRequest)).rejects.toThrow('Domain already exists');
      expect(tenantRepository.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when tenant not found', async () => {
      // Arrange
      tenantRepository.isDomainAvailable.mockResolvedValue(true);
      tenantRepository.update.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateTenant('tenant-1', updateRequest)).rejects.toThrow('Tenant not found');
    });

    it('should update tenant without domain validation when domain is not provided', async () => {
      // Arrange
      const updateWithoutDomain = { name: 'Updated Name' };
      const updatedTenant = { ...mockTenant, name: 'Updated Name' };
      tenantRepository.update.mockResolvedValue(updatedTenant);

      // Act
      const result = await service.updateTenant('tenant-1', updateWithoutDomain);

      // Assert
      expect(tenantRepository.isDomainAvailable).not.toHaveBeenCalled();
      expect(tenantRepository.update).toHaveBeenCalledWith('tenant-1', updateWithoutDomain);
      expect(result).toEqual(updatedTenant);
    });
  });

  describe('getTenant', () => {
    it('should return tenant when found', async () => {
      // Arrange
      tenantRepository.findById.mockResolvedValue(mockTenant);

      // Act
      const result = await service.getTenant('tenant-1');

      // Assert
      expect(tenantRepository.findById).toHaveBeenCalledWith('tenant-1');
      expect(result).toEqual(mockTenant);
    });

    it('should throw NotFoundException when tenant not found', async () => {
      // Arrange
      tenantRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getTenant('tenant-1')).rejects.toThrow('Tenant not found');
    });
  });

  describe('deleteTenant', () => {
    it('should delete tenant successfully', async () => {
      // Arrange
      tenantRepository.findById.mockResolvedValue(mockTenant);
      tenantRepository.delete.mockResolvedValue(true);

      // Act
      await service.deleteTenant('tenant-1');

      // Assert
      expect(tenantRepository.findById).toHaveBeenCalledWith('tenant-1');
      expect(tenantRepository.delete).toHaveBeenCalledWith('tenant-1');
      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'Tenant deleted successfully',
        tenantId: 'tenant-1',
        tenantName: mockTenant.name
      });
    });

    it('should throw NotFoundException when tenant not found', async () => {
      // Arrange
      tenantRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deleteTenant('tenant-1')).rejects.toThrow('Tenant not found');
      expect(tenantRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when delete fails', async () => {
      // Arrange
      tenantRepository.findById.mockResolvedValue(mockTenant);
      tenantRepository.delete.mockResolvedValue(false);

      // Act & Assert
      await expect(service.deleteTenant('tenant-1')).rejects.toThrow('Failed to delete tenant');
    });
  });

  describe('getAllTenants', () => {
    it('should return all tenants', async () => {
      // Arrange
      const tenants = [mockTenant, tenantFactory.create({ id: 'tenant-2' })];
      tenantRepository.findAll.mockResolvedValue(tenants);

      // Act
      const result = await service.getAllTenants();

      // Assert
      expect(tenantRepository.findAll).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(tenants);
    });

    it('should return filtered tenants when filters provided', async () => {
      // Arrange
      const filters = { status: 'ACTIVE' };
      const tenants = [mockTenant];
      tenantRepository.findAll.mockResolvedValue(tenants);

      // Act
      const result = await service.getAllTenants(filters);

      // Assert
      expect(tenantRepository.findAll).toHaveBeenCalledWith(filters);
      expect(result).toEqual(tenants);
    });

    it('should log error and rethrow when repository throws error', async () => {
      // Arrange
      const error = new Error('Database error');
      tenantRepository.findAll.mockRejectedValue(error);

      // Act & Assert
      await expect(service.getAllTenants()).rejects.toThrow(error);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('updateTenantSettings', () => {
    const settingsUpdate: Partial<TenantSettings> = {
      maxCoaches: 20,
      enableVideoAnalysis: false
    };

    it('should update tenant settings successfully', async () => {
      // Arrange
      const updatedTenant = {
        ...mockTenant,
        settings: { ...mockTenant.settings, ...settingsUpdate }
      };
      tenantRepository.findById.mockResolvedValue(mockTenant);
      tenantRepository.update.mockResolvedValue(updatedTenant);

      // Act
      const result = await service.updateTenantSettings('tenant-1', settingsUpdate);

      // Assert
      expect(tenantRepository.findById).toHaveBeenCalledWith('tenant-1');
      expect(tenantRepository.update).toHaveBeenCalledWith('tenant-1', { settings: settingsUpdate });
      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'Tenant settings updated',
        tenantId: 'tenant-1',
        updatedFields: ['maxCoaches', 'enableVideoAnalysis']
      });
      expect(result).toEqual(updatedTenant.settings);
    });

    it('should throw NotFoundException when tenant not found', async () => {
      // Arrange
      tenantRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateTenantSettings('tenant-1', settingsUpdate)).rejects.toThrow('Tenant not found');
      expect(tenantRepository.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when update fails', async () => {
      // Arrange
      tenantRepository.findById.mockResolvedValue(mockTenant);
      tenantRepository.update.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateTenantSettings('tenant-1', settingsUpdate)).rejects.toThrow('Failed to update tenant settings');
    });
  });

  describe('getTenantSettings', () => {
    it('should return tenant settings', async () => {
      // Arrange
      tenantRepository.findById.mockResolvedValue(mockTenant);

      // Act
      const result = await service.getTenantSettings('tenant-1');

      // Assert
      expect(result).toEqual(mockTenant.settings);
    });
  });

  describe('suspendTenant', () => {
    it('should suspend tenant successfully', async () => {
      // Arrange
      tenantRepository.findById.mockResolvedValue(mockTenant);
      tenantRepository.suspend.mockResolvedValue(true);

      // Act
      await service.suspendTenant('tenant-1', 'Policy violation', 'admin-1');

      // Assert
      expect(tenantRepository.findById).toHaveBeenCalledWith('tenant-1');
      expect(tenantRepository.suspend).toHaveBeenCalledWith('tenant-1', 'Policy violation');
      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'Tenant suspended',
        tenantId: 'tenant-1',
        reason: 'Policy violation',
        suspendedBy: 'admin-1'
      });
    });

    it('should throw NotFoundException when tenant not found', async () => {
      // Arrange
      tenantRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.suspendTenant('tenant-1', 'reason', 'admin-1')).rejects.toThrow('Tenant not found');
      expect(tenantRepository.suspend).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when suspend fails', async () => {
      // Arrange
      tenantRepository.findById.mockResolvedValue(mockTenant);
      tenantRepository.suspend.mockResolvedValue(false);

      // Act & Assert
      await expect(service.suspendTenant('tenant-1', 'reason', 'admin-1')).rejects.toThrow('Failed to suspend tenant');
    });
  });

  describe('reactivateTenant', () => {
    it('should reactivate tenant successfully', async () => {
      // Arrange
      tenantRepository.findById.mockResolvedValue(mockTenant);
      tenantRepository.reactivate.mockResolvedValue(true);

      // Act
      await service.reactivateTenant('tenant-1', 'admin-1');

      // Assert
      expect(tenantRepository.findById).toHaveBeenCalledWith('tenant-1');
      expect(tenantRepository.reactivate).toHaveBeenCalledWith('tenant-1');
      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'Tenant reactivated',
        tenantId: 'tenant-1',
        reactivatedBy: 'admin-1'
      });
    });

    it('should throw NotFoundException when tenant not found', async () => {
      // Arrange
      tenantRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.reactivateTenant('tenant-1', 'admin-1')).rejects.toThrow('Tenant not found');
      expect(tenantRepository.reactivate).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when reactivate fails', async () => {
      // Arrange
      tenantRepository.findById.mockResolvedValue(mockTenant);
      tenantRepository.reactivate.mockResolvedValue(false);

      // Act & Assert
      await expect(service.reactivateTenant('tenant-1', 'admin-1')).rejects.toThrow('Failed to reactivate tenant');
    });
  });

  describe('validateTenantDomain', () => {
    it('should validate domain availability', async () => {
      // Arrange
      tenantRepository.isDomainAvailable.mockResolvedValue(true);

      // Act
      const result = await service.validateTenantDomain('new.domain.com');

      // Assert
      expect(tenantRepository.isDomainAvailable).toHaveBeenCalledWith('new.domain.com', undefined);
      expect(result).toBe(true);
    });

    it('should validate domain availability excluding specific tenant', async () => {
      // Arrange
      tenantRepository.isDomainAvailable.mockResolvedValue(false);

      // Act
      const result = await service.validateTenantDomain('existing.domain.com', 'tenant-1');

      // Assert
      expect(tenantRepository.isDomainAvailable).toHaveBeenCalledWith('existing.domain.com', 'tenant-1');
      expect(result).toBe(false);
    });
  });

  describe('alias methods', () => {
    it('should call getTenant when findById is called', async () => {
      // Arrange
      tenantRepository.findById.mockResolvedValue(mockTenant);

      // Act
      const result = await service.findById('tenant-1');

      // Assert
      expect(result).toEqual(mockTenant);
    });

    it('should call updateTenant when update is called', async () => {
      // Arrange
      const updateRequest = { name: 'Updated' };
      const updatedTenant = { ...mockTenant, name: 'Updated' };
      tenantRepository.update.mockResolvedValue(updatedTenant);

      // Act
      const result = await service.update('tenant-1', updateRequest);

      // Assert
      expect(result).toEqual(updatedTenant);
    });

    it('should call getAllTenants when findMany is called', async () => {
      // Arrange
      const tenants = [mockTenant];
      tenantRepository.findAll.mockResolvedValue(tenants);

      // Act
      const result = await service.findMany();

      // Assert
      expect(result).toEqual(tenants);
    });
  });
});