/**
 * UserModule Integration Tests
 * 
 * Tests the complete UserModule with minimal providers and mocked external dependencies.
 * Focuses on testing service interactions, user creation/update/status management workflows,
 * and proper interaction between UserService, UserRepository, and validation services
 * without loading complex global providers.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';

// Import production UserModule and related components
import { UserService } from '@strengthos/sos-web-api/src/user/services/user.service';
import { UserRepository } from '@strengthos/sos-web-api/src/user/repositories/user.repository';
import { DatabaseService } from '@strengthos/sos-web-api/src/database/database.service';
import { TenantContextService } from '@strengthos/sos-web-api/src/tenant/services/tenant-context.service';
import { 
  CreateUserDto, 
  UpdateUserDto, 
  UserQueryDto, 
  UserStatus, 
  AuthMethod 
} from '@strengthos/sos-web-api/src/user/dto';
import { User } from '@strengthos/sos-web-api/src/user/entities/user.entity';

describe('UserModule Integration', () => {
  let module: TestingModule;
  let userService: UserService;
  let userRepository: UserRepository;
  let mockDatabaseService: jest.Mocked<DatabaseService>;
  let mockTenantContextService: jest.Mocked<TenantContextService>;
  let mockKnex: jest.Mocked<any>;

  // Simple test data factory functions
  const createTestUser = (overrides: Partial<User> = {}): User => {
    const sequence = Math.floor(Math.random() * 1000);
    return {
      id: `user-${sequence}`,
      tenant_id: 'default-tenant',
      email: `test${sequence}@example.com`,
      first_name: 'Test',
      last_name: 'User',
      role: 'ATHLETE',
      status: 'ACTIVE',
      auth_method: 'EMAIL',
      phone_verified: false,
      created_at: new Date(),
      updated_at: new Date(),
      preferences: {},
      equipment_profiles: [],
      health_considerations: {},
      ...overrides
    } as User;
  };

  const createTestUsers = (count: number, overrides: Partial<User> = {}): User[] => {
    return Array.from({ length: count }, () => createTestUser(overrides));
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

    mockDatabaseService = {
      getKnex: jest.fn().mockReturnValue(mockKnex),
      knex: mockKnex, // Add the knex property that BaseRepository accesses
      onModuleInit: jest.fn(),
      onModuleDestroy: jest.fn(),
    } as any;

    mockTenantContextService = {
      getCurrentTenantId: jest.fn().mockReturnValue('default-tenant'),
      setCurrentTenantId: jest.fn(),
      clearCurrentTenantId: jest.fn(),
      getCurrentTenant: jest.fn(),
      setCurrentTenant: jest.fn(),
      clearCurrentTenant: jest.fn(),
    };

    // Create test-specific UserModule configuration with minimal providers
    // Focus on core UserService and UserRepository without complex dependencies
    module = await Test.createTestingModule({
      providers: [
        UserService,
        UserRepository,
        // Mock external dependencies
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
        {
          provide: TenantContextService,
          useValue: mockTenantContextService,
        },
        // Note: We exclude controllers, guards and interceptors to avoid complex dependency setup
        // This allows us to focus on testing the core service and repository logic with mocked dependencies
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    userRepository = module.get<UserRepository>(UserRepository);
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
      expect(userService).toBeDefined();
      expect(userRepository).toBeDefined();
    });

    it('should have core UserService from production', () => {
      const userServiceInstance = module.get(UserService);

      expect(userServiceInstance).toBeDefined();
      
      // Verify this is the actual production class
      expect(userServiceInstance).toBeInstanceOf(UserService);
      expect(userServiceInstance).toBe(userService);
    });

    it('should have core UserRepository from production', () => {
      const userRepositoryInstance = module.get(UserRepository);

      expect(userRepositoryInstance).toBeDefined();
      
      // Verify this is the actual production class
      expect(userRepositoryInstance).toBeInstanceOf(UserRepository);
      expect(userRepositoryInstance).toBe(userRepository);
    });

    it('should have mocked external dependencies', () => {
      const databaseService = module.get(DatabaseService);
      const tenantContextService = module.get(TenantContextService);

      expect(databaseService).toBeDefined();
      expect(tenantContextService).toBeDefined();
      expect(databaseService).toBe(mockDatabaseService);
      expect(tenantContextService).toBe(mockTenantContextService);
    });

    it('should properly inject mocked dependencies into UserService and UserRepository', () => {
      // Verify that the services can access their injected dependencies
      // This tests that the dependency injection is working correctly
      expect(userService).toBeDefined();
      expect(userRepository).toBeDefined();
      
      // The services should be able to call methods without throwing dependency errors
      expect(() => {
        // This doesn't actually call the methods, just verifies the services are properly constructed
        expect(userService.create).toBeDefined();
        expect(userService.findById).toBeDefined();
        expect(userService.update).toBeDefined();
        expect(userService.delete).toBeDefined();
        expect(userRepository.createUser).toBeDefined();
        expect(userRepository.findById).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('User Creation Workflow Integration', () => {
    it('should create user with email authentication successfully', async () => {
      const testUser = createTestUser({
        email: 'test@example.com',
        role: 'ATHLETE'
      });

      const createUserDto: CreateUserDto = {
        email: testUser.email,
        password: 'password123',
        authMethod: AuthMethod.EMAIL,
        role: testUser.role,
        profile: {
          firstName: testUser.first_name,
          lastName: testUser.last_name,
        }
      };

      // Mock repository responses
      mockKnex.first.mockResolvedValueOnce(null); // No existing user
      mockKnex.returning.mockResolvedValueOnce([{
        id: testUser.id,
        tenant_id: testUser.tenant_id,
        email: testUser.email,
        first_name: testUser.first_name,
        last_name: testUser.last_name,
        role: testUser.role,
        status: 'ACTIVE',
        auth_method: 'EMAIL',
        phone_verified: false,
        created_at: testUser.created_at,
        updated_at: testUser.updated_at,
        preferences: {},
        equipment_profiles: [],
        health_considerations: {},
      }]);

      const result = await userService.create(createUserDto);

      expect(result).toEqual({
        id: testUser.id,
        tenantId: testUser.tenant_id,
        email: testUser.email,
        phoneNumber: undefined,
        authMethod: AuthMethod.EMAIL,
        role: testUser.role,
        status: 'ACTIVE',
        phoneVerified: false,
        phoneVerifiedAt: undefined,
        profile: {
          firstName: testUser.first_name,
          lastName: testUser.last_name,
          dateOfBirth: undefined,
          gender: undefined,
          bodyWeight: undefined,
          height: undefined,
          experienceLevel: undefined,
          emergencyContact: undefined,
        },
        preferences: {},
        equipmentProfiles: [],
        healthConsiderations: {},
        healthProfile: undefined,
        oauthProviders: undefined,
        whatsappData: undefined,
        lineData: undefined,
        createdAt: testUser.created_at,
        updatedAt: testUser.updated_at,
        lastLoginAt: undefined,
        emailVerifiedAt: undefined,
      });

      // Verify repository interactions
      expect(mockKnex.first).toHaveBeenCalledWith(); // Check for existing user
      expect(mockKnex.insert).toHaveBeenCalled();
      expect(mockKnex.returning).toHaveBeenCalledWith('*');
    });

    it('should create user with phone authentication successfully', async () => {
      const testUser = createTestUser({
        phone_number: '+1234567890',
        role: 'ATHLETE'
      });

      const createUserDto: CreateUserDto = {
        phoneNumber: testUser.phone_number,
        authMethod: AuthMethod.WHATSAPP,
        role: testUser.role,
        profile: {
          firstName: testUser.first_name,
          lastName: testUser.last_name,
        }
      };

      // Mock repository responses
      mockKnex.first.mockResolvedValueOnce(null); // No existing user
      mockKnex.returning.mockResolvedValueOnce([{
        id: testUser.id,
        tenant_id: testUser.tenant_id,
        phone_number: testUser.phone_number,
        first_name: testUser.first_name,
        last_name: testUser.last_name,
        role: testUser.role,
        status: 'ACTIVE',
        auth_method: 'WHATSAPP',
        phone_verified: true,
        created_at: testUser.created_at,
        updated_at: testUser.updated_at,
        preferences: {},
        equipment_profiles: [],
        health_considerations: {},
      }]);

      const result = await userService.create(createUserDto);

      expect(result.phoneNumber).toBe(testUser.phone_number);
      expect(result.authMethod).toBe(AuthMethod.WHATSAPP);
      expect(result.phoneVerified).toBe(true);

      // Verify repository interactions
      expect(mockKnex.first).toHaveBeenCalledWith(); // Check for existing user
      expect(mockKnex.insert).toHaveBeenCalled();
    });

    it('should handle user creation conflicts correctly', async () => {
      const existingUser = createTestUser({
        email: 'existing@example.com'
      });

      const createUserDto: CreateUserDto = {
        email: existingUser.email,
        password: 'password123',
        authMethod: AuthMethod.EMAIL,
        role: 'ATHLETE',
      };

      // Mock repository to return existing user
      mockKnex.first.mockResolvedValueOnce(existingUser);

      await expect(userService.create(createUserDto)).rejects.toThrow(ConflictException);
      await expect(userService.create(createUserDto)).rejects.toThrow('User with this email already exists');

      // Verify repository was called to check for existing user
      expect(mockKnex.first).toHaveBeenCalled();
      expect(mockKnex.insert).not.toHaveBeenCalled();
    });

    it('should validate required fields based on auth method', async () => {
      // Test EMAIL auth method without email
      const emailAuthDto: CreateUserDto = {
        password: 'password123',
        authMethod: AuthMethod.EMAIL,
        role: 'ATHLETE',
      } as any; // Cast to bypass TypeScript validation for testing

      await expect(userService.create(emailAuthDto)).rejects.toThrow(BadRequestException);
      await expect(userService.create(emailAuthDto)).rejects.toThrow('Email and password are required for EMAIL authentication');

      // Test WHATSAPP auth method without phone number
      const whatsappAuthDto: CreateUserDto = {
        authMethod: AuthMethod.WHATSAPP,
        role: 'ATHLETE',
      } as any;

      await expect(userService.create(whatsappAuthDto)).rejects.toThrow(BadRequestException);
      await expect(userService.create(whatsappAuthDto)).rejects.toThrow('Phone number is required for phone-based authentication');
    });

    it('should hash passwords correctly during user creation', async () => {
      const testUser = createTestUser();
      const createUserDto: CreateUserDto = {
        email: testUser.email,
        password: 'plainTextPassword',
        authMethod: AuthMethod.EMAIL,
        role: testUser.role,
      };

      // Mock repository responses
      mockKnex.first.mockResolvedValueOnce(null);
      mockKnex.returning.mockResolvedValueOnce([{
        id: testUser.id,
        tenant_id: testUser.tenant_id,
        email: testUser.email,
        role: testUser.role,
        status: 'ACTIVE',
        auth_method: 'EMAIL',
        password_hash: 'hashedPassword',
        salt: 'salt',
        created_at: testUser.created_at,
        updated_at: testUser.updated_at,
        preferences: {},
        equipment_profiles: [],
        health_considerations: {},
      }]);

      await userService.create(createUserDto);

      // Verify that insert was called (password hashing happens before insert)
      expect(mockKnex.insert).toHaveBeenCalled();
      
      // Get the insert call arguments to verify password was hashed
      const insertCall = mockKnex.insert.mock.calls[0][0];
      expect(insertCall.password_hash).toBeDefined();
      expect(insertCall.salt).toBeDefined();
      expect(insertCall.password_hash).not.toBe('plainTextPassword'); // Should be hashed
    });
  });

  describe('User Update Workflow Integration', () => {
    it('should update user successfully', async () => {
      const existingUser = createTestUser({
        email: 'original@example.com',
        first_name: 'Original',
        last_name: 'User'
      });

      const updateUserDto: UpdateUserDto = {
        email: 'updated@example.com',
        profile: {
          firstName: 'Updated',
          lastName: 'User'
        }
      };

      // Mock repository responses
      mockKnex.first.mockResolvedValueOnce(existingUser); // findById
      mockKnex.first.mockResolvedValueOnce(null); // Check for email conflict
      mockKnex.returning.mockResolvedValueOnce([{
        ...existingUser,
        email: updateUserDto.email,
        first_name: updateUserDto.profile?.firstName,
        last_name: updateUserDto.profile?.lastName,
        updated_at: new Date(),
      }]);

      const result = await userService.update(existingUser.id, updateUserDto);

      expect(result.email).toBe(updateUserDto.email);
      expect(result.profile.firstName).toBe(updateUserDto.profile?.firstName);
      expect(result.profile.lastName).toBe(updateUserDto.profile?.lastName);

      // Verify repository interactions
      expect(mockKnex.first).toHaveBeenCalledTimes(2); // findById + email conflict check
      expect(mockKnex.update).toHaveBeenCalled();
    });

    it('should handle user not found during update', async () => {
      const updateUserDto: UpdateUserDto = {
        email: 'updated@example.com'
      };

      // Mock repository to return null (user not found)
      mockKnex.first.mockResolvedValueOnce(null);

      await expect(userService.update('non-existent-id', updateUserDto)).rejects.toThrow(NotFoundException);
      await expect(userService.update('non-existent-id', updateUserDto)).rejects.toThrow('User not found');

      // Verify repository was called
      expect(mockKnex.first).toHaveBeenCalled();
      expect(mockKnex.update).not.toHaveBeenCalled();
    });

    it('should handle email conflicts during update', async () => {
      const existingUser = createTestUser({
        email: 'original@example.com'
      });

      const conflictingUser = createTestUser({
        email: 'conflict@example.com'
      });

      const updateUserDto: UpdateUserDto = {
        email: conflictingUser.email
      };

      // Mock repository responses
      mockKnex.first.mockResolvedValueOnce(existingUser); // findById
      mockKnex.first.mockResolvedValueOnce(conflictingUser); // Email conflict check

      await expect(userService.update(existingUser.id, updateUserDto)).rejects.toThrow(ConflictException);
      await expect(userService.update(existingUser.id, updateUserDto)).rejects.toThrow('User with this email already exists');

      // Verify repository interactions
      expect(mockKnex.first).toHaveBeenCalledTimes(2);
      expect(mockKnex.update).not.toHaveBeenCalled();
    });
  });

  describe('User Status Management Integration', () => {
    it('should update user status successfully', async () => {
      const testUser = createTestUser({
        status: 'ACTIVE'
      });

      // Mock repository responses
      mockKnex.first.mockResolvedValueOnce(testUser); // findById
      mockKnex.returning.mockResolvedValueOnce([{
        ...testUser,
        status: 'SUSPENDED',
        suspended_at: new Date(),
        updated_at: new Date(),
      }]);

      const result = await userService.updateStatus(testUser.id, UserStatus.SUSPENDED);

      expect(result.status).toBe('SUSPENDED');

      // Verify repository interactions
      expect(mockKnex.first).toHaveBeenCalled(); // findById
      expect(mockKnex.update).toHaveBeenCalled();
    });

    it('should handle bulk status updates successfully', async () => {
      const testUsers = createTestUsers(3, {
        status: 'ACTIVE'
      });

      const userIds = testUsers.map(u => u.id);

      // Mock repository responses for individual user checks
      testUsers.forEach(user => {
        mockKnex.first.mockResolvedValueOnce(user);
      });

      // Mock bulk update response
      const updatedUsers = testUsers.map(user => ({
        ...user,
        status: 'SUSPENDED',
        suspended_at: new Date(),
        updated_at: new Date(),
      }));
      mockKnex.returning.mockResolvedValueOnce(updatedUsers);

      const result = await userService.bulkUpdateStatus(userIds, UserStatus.SUSPENDED);

      expect(result).toHaveLength(3);
      expect(result.every(user => user.status === 'SUSPENDED')).toBe(true);

      // Verify repository interactions
      expect(mockKnex.first).toHaveBeenCalledTimes(3); // Individual user checks
      expect(mockKnex.whereIn).toHaveBeenCalledWith('id', userIds);
      expect(mockKnex.update).toHaveBeenCalled();
    });
  });

  describe('Role Assignment Integration', () => {
    it('should assign role to user successfully', async () => {
      const testUser = createTestUser({
        role: 'ATHLETE'
      });

      // Mock repository responses
      mockKnex.first.mockResolvedValueOnce(testUser); // findById
      mockKnex.returning.mockResolvedValueOnce([{
        ...testUser,
        role: 'COACH',
        updated_at: new Date(),
      }]);

      const result = await userService.assignRole(testUser.id, 'COACH');

      expect(result.role).toBe('COACH');

      // Verify repository interactions
      expect(mockKnex.first).toHaveBeenCalled(); // findById
      expect(mockKnex.update).toHaveBeenCalled();
    });

    it('should handle bulk role assignment successfully', async () => {
      const testUsers = createTestUsers(3, {
        role: 'ATHLETE'
      });

      const userIds = testUsers.map(u => u.id);

      // Mock repository responses for individual user checks
      testUsers.forEach(user => {
        mockKnex.first.mockResolvedValueOnce(user);
      });

      // Mock bulk update response
      const updatedUsers = testUsers.map(user => ({
        ...user,
        role: 'COACH',
        updated_at: new Date(),
      }));
      mockKnex.returning.mockResolvedValueOnce(updatedUsers);

      const result = await userService.bulkAssignRole(userIds, 'COACH');

      expect(result).toHaveLength(3);
      expect(result.every(user => user.role === 'COACH')).toBe(true);

      // Verify repository interactions
      expect(mockKnex.first).toHaveBeenCalledTimes(3); // Individual user checks
      expect(mockKnex.whereIn).toHaveBeenCalledWith('id', userIds);
      expect(mockKnex.update).toHaveBeenCalled();
    });
  });

  describe('User Query and Search Integration', () => {
    it('should find users with search and filters', async () => {
      const testUsers = createTestUsers(5, {
        tenant_id: 'test-tenant'
      });

      const queryDto: UserQueryDto = {
        search: 'test',
        role: 'ATHLETE',
        status: 'ACTIVE',
        page: 1,
        limit: 10,
        sortBy: 'created_at',
        sortOrder: 'desc'
      };

      // Mock repository responses
      mockKnex.count.mockResolvedValueOnce([{ count: '5' }]); // Total count
      mockKnex.mockResolvedValueOnce(testUsers); // Query results

      const result = await userService.findMany(queryDto);

      expect(result.users).toHaveLength(5);
      expect(result.total).toBe(5);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);

      // Verify repository interactions
      expect(mockKnex.where).toHaveBeenCalledWith({ tenant_id: 'default-tenant' });
      expect(mockKnex.where).toHaveBeenCalledWith({ role: 'ATHLETE' });
      expect(mockKnex.where).toHaveBeenCalledWith({ status: 'ACTIVE' });
      expect(mockKnex.orderBy).toHaveBeenCalledWith('created_at', 'desc');
      expect(mockKnex.limit).toHaveBeenCalledWith(10);
      expect(mockKnex.offset).toHaveBeenCalledWith(0);
    });

    it('should find user by email successfully', async () => {
      const testUser = createTestUser({
        email: 'test@example.com'
      });

      // Mock repository response
      mockKnex.first.mockResolvedValueOnce(testUser);

      const result = await userService.findByEmail(testUser.email);

      expect(result.email).toBe(testUser.email);
      expect(result.id).toBe(testUser.id);

      // Verify repository interactions
      expect(mockKnex.where).toHaveBeenCalledWith({ 
        email: testUser.email, 
        tenant_id: 'default-tenant' 
      });
      expect(mockKnex.first).toHaveBeenCalled();
    });

    it('should handle user not found by email', async () => {
      // Mock repository to return null
      mockKnex.first.mockResolvedValueOnce(null);

      await expect(userService.findByEmail('nonexistent@example.com')).rejects.toThrow(NotFoundException);
      await expect(userService.findByEmail('nonexistent@example.com')).rejects.toThrow('User not found');

      expect(mockKnex.first).toHaveBeenCalled();
    });
  });

  describe('User Deletion Integration', () => {
    it('should delete user successfully', async () => {
      const testUser = createTestUser();

      // Mock repository responses
      mockKnex.first.mockResolvedValueOnce(testUser); // findById
      mockKnex.del.mockResolvedValueOnce(1); // Successful deletion

      await userService.delete(testUser.id);

      // Verify repository interactions
      expect(mockKnex.first).toHaveBeenCalled(); // findById
      expect(mockKnex.del).toHaveBeenCalled();
    });

    it('should handle user not found during deletion', async () => {
      // Mock repository to return null (user not found)
      mockKnex.first.mockResolvedValueOnce(null);

      await expect(userService.delete('non-existent-id')).rejects.toThrow(NotFoundException);
      await expect(userService.delete('non-existent-id')).rejects.toThrow('User not found');

      expect(mockKnex.first).toHaveBeenCalled();
      expect(mockKnex.del).not.toHaveBeenCalled();
    });
  });

  describe('Service and Repository Integration', () => {
    it('should properly integrate UserService with UserRepository for complex operations', async () => {
      const testUser = createTestUser();
      
      // Test a complex operation that involves multiple repository calls
      const createUserDto: CreateUserDto = {
        email: testUser.email,
        password: 'password123',
        authMethod: AuthMethod.EMAIL,
        role: testUser.role,
        profile: {
          firstName: testUser.first_name,
          lastName: testUser.last_name,
        }
      };

      // Mock repository responses for user creation
      mockKnex.first.mockResolvedValueOnce(null); // No existing user
      mockKnex.returning.mockResolvedValueOnce([{
        id: testUser.id,
        tenant_id: testUser.tenant_id,
        email: testUser.email,
        first_name: testUser.first_name,
        last_name: testUser.last_name,
        role: testUser.role,
        status: 'ACTIVE',
        auth_method: 'EMAIL',
        created_at: testUser.created_at,
        updated_at: testUser.updated_at,
        preferences: {},
        equipment_profiles: [],
        health_considerations: {},
      }]);

      // Create user
      const createdUser = await userService.create(createUserDto);
      expect(createdUser.id).toBe(testUser.id);

      // Mock repository responses for user update
      mockKnex.first.mockResolvedValueOnce({
        ...testUser,
        id: createdUser.id,
        tenant_id: createdUser.tenantId,
        email: createdUser.email,
        first_name: createdUser.profile.firstName,
        last_name: createdUser.profile.lastName,
      }); // findById for update
      mockKnex.first.mockResolvedValueOnce(null); // No email conflict
      mockKnex.returning.mockResolvedValueOnce([{
        ...testUser,
        id: createdUser.id,
        tenant_id: createdUser.tenantId,
        email: 'updated@example.com',
        first_name: createdUser.profile.firstName,
        last_name: createdUser.profile.lastName,
        updated_at: new Date(),
      }]);

      // Update user
      const updatedUser = await userService.update(createdUser.id, {
        email: 'updated@example.com'
      });
      expect(updatedUser.email).toBe('updated@example.com');

      // Verify all repository interactions occurred
      expect(mockKnex.first).toHaveBeenCalledTimes(3); // Create check + Update findById + Update conflict check
      expect(mockKnex.insert).toHaveBeenCalledTimes(1);
      expect(mockKnex.update).toHaveBeenCalledTimes(1);
    });

    it('should handle tenant context correctly across service operations', async () => {
      const tenantId = 'specific-tenant';
      mockTenantContextService.getCurrentTenantId.mockReturnValue(tenantId);

      const testUser = createTestUser({
        tenant_id: tenantId
      });

      // Mock repository response
      mockKnex.first.mockResolvedValueOnce(testUser);

      const result = await userService.findById(testUser.id);

      expect(result.tenantId).toBe(tenantId);
      
      // Verify tenant context was used
      expect(mockTenantContextService.getCurrentTenantId).toHaveBeenCalled();
      expect(mockKnex.where).toHaveBeenCalledWith({ 
        id: testUser.id, 
        tenant_id: tenantId 
      });
    });

    it('should maintain data consistency across multiple operations', async () => {
      const testUsers = createTestUsers(3);
      const userIds = testUsers.map(u => u.id);

      // Mock repository responses for bulk operations
      testUsers.forEach(user => {
        mockKnex.first.mockResolvedValueOnce(user);
      });

      const updatedUsers = testUsers.map(user => ({
        ...user,
        role: 'COACH',
        updated_at: new Date(),
      }));
      mockKnex.returning.mockResolvedValueOnce(updatedUsers);

      // Perform bulk role assignment
      const result = await userService.bulkAssignRole(userIds, 'COACH');

      expect(result).toHaveLength(3);
      expect(result.every(user => user.role === 'COACH')).toBe(true);

      // Verify consistency - all users should have the same role
      const roles = result.map(user => user.role);
      expect(new Set(roles).size).toBe(1); // All roles should be the same
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
      const user1 = createTestUser({ email: 'user1@example.com' });
      const user2 = createTestUser({ email: 'user2@example.com' });

      // First behavior - user found
      mockKnex.first.mockResolvedValueOnce(user1);

      const result1 = await userService.findById(user1.id);
      expect(result1.email).toBe(user1.email);

      // Second behavior - user not found
      mockKnex.first.mockResolvedValueOnce(null);

      await expect(userService.findById('non-existent')).rejects.toThrow(NotFoundException);

      expect(mockKnex.first).toHaveBeenCalledTimes(2);
    });

    it('should handle complex mock scenarios with proper isolation', async () => {
      // Setup complex mock scenario for different user operations
      const testUser = createTestUser();

      // Mock user creation
      mockKnex.first.mockResolvedValueOnce(null); // No existing user
      mockKnex.returning.mockResolvedValueOnce([testUser]);

      // Mock user retrieval
      mockKnex.first.mockResolvedValueOnce(testUser);

      // Mock user update
      mockKnex.first.mockResolvedValueOnce(testUser); // findById
      mockKnex.first.mockResolvedValueOnce(null); // No conflict
      mockKnex.returning.mockResolvedValueOnce([{
        ...testUser,
        email: 'updated@example.com',
        updated_at: new Date(),
      }]);

      // Test user creation
      const createResult = await userService.create({
        email: testUser.email,
        password: 'password',
        authMethod: AuthMethod.EMAIL,
        role: testUser.role,
      });
      expect(createResult.email).toBe(testUser.email);

      // Test user retrieval
      const getResult = await userService.findById(testUser.id);
      expect(getResult.id).toBe(testUser.id);

      // Test user update
      const updateResult = await userService.update(testUser.id, {
        email: 'updated@example.com'
      });
      expect(updateResult.email).toBe('updated@example.com');

      // Verify all mocked services were called correctly
      expect(mockKnex.first).toHaveBeenCalledTimes(4); // Create check + Get + Update findById + Update conflict check
      expect(mockKnex.insert).toHaveBeenCalledTimes(1);
      expect(mockKnex.update).toHaveBeenCalledTimes(1);
    });

    it('should verify module interactions work correctly with mocked dependencies', async () => {
      const testUser = createTestUser();

      // Mock successful user creation
      mockKnex.first.mockResolvedValueOnce(null); // No existing user
      mockKnex.returning.mockResolvedValueOnce([testUser]);

      // Mock successful user retrieval
      mockKnex.first.mockResolvedValueOnce(testUser);

      // Test user creation through service
      const createResult = await userService.create({
        email: testUser.email,
        password: 'password',
        authMethod: AuthMethod.EMAIL,
        role: testUser.role,
      });

      // Test user retrieval through service
      const getResult = await userService.findById(testUser.id);

      // Verify the complete flow worked
      expect(createResult.id).toBe(testUser.id);
      expect(getResult.id).toBe(testUser.id);
      expect(createResult.email).toBe(getResult.email);
      
      // Verify all mocked services were called correctly
      expect(mockKnex.first).toHaveBeenCalledTimes(2);
      expect(mockKnex.insert).toHaveBeenCalledTimes(1);
      expect(mockTenantContextService.getCurrentTenantId).toHaveBeenCalled();
    });
  });
});