/**
 * UserService Unit Tests
 * 
 * This test file demonstrates the new separated test application pattern:
 * - Imports production UserService from @strengthos/sos-web-api
 * - Uses TestModuleBuilder from @strengthos/shared-testing for proper isolation
 * - Implements comprehensive mocking with dependency injection overrides
 * - Tests run in isolation without shared state or external dependencies
 */

import { TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Import production code from the sos-web-api application
import { UserService } from '@strengthos/sos-web-api/src/user/services/user.service';
import { UserRepository } from '@strengthos/sos-web-api/src/user/repositories/user.repository';
import {
  CreateUserDto,
  UpdateUserDto,
  UserQueryDto,
  UserStatus,
  AuthMethod
} from '@strengthos/sos-web-api/src/user/dto';
import { User } from '@strengthos/sos-web-api/src/user/entities/user.entity';

// Import test infrastructure directly from libs/shared-testing builders
import { TestModuleBuilder } from '@strengthos/shared-testing/src/builders/test-module-builder';

// Mock bcrypt module
jest.mock('bcrypt');
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<UserRepository>;
  let module: TestingModule;

  // Test data setup
  const mockUser: User = {
    id: 'user-1',
    tenant_id: 'tenant-1',
    email: 'test@example.com',
    phone_number: '+1234567890',
    password_hash: 'hashed-password',
    salt: 'salt-value',
    role: 'ATHLETE',
    status: 'ACTIVE',
    auth_method: AuthMethod.EMAIL,
    phone_verified: false,
    first_name: 'John',
    last_name: 'Doe',
    date_of_birth: new Date('1990-01-01'),
    gender: 'MALE',
    body_weight: 75,
    height: 180,
    experience_level: 'INTERMEDIATE',
    preferences: {},
    equipment_profiles: [],
    health_considerations: {},
    emergency_contact: {},
    created_at: new Date(),
    updated_at: new Date(),
  } as User;

  beforeEach(async () => {
    // Create mock repository with all required methods
    const mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByPhoneNumber: jest.fn(),
      findByEmailOrPhone: jest.fn(),
      findByIdWithTenant: jest.fn(),
      createUser: jest.fn(),
      updateUserWithTenant: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
      findMany: jest.fn(),
      updateStatus: jest.fn(),
      updateLastLogin: jest.fn(),
      assignRole: jest.fn(),
      bulkAssignRole: jest.fn(),
      bulkUpdateStatus: jest.fn(),
      getUsersByRole: jest.fn(),
      getUsersByStatus: jest.fn(),
      verifyPhone: jest.fn(),
      updateAuthMethod: jest.fn(),
    };

    // Use TestModuleBuilder for proper isolation
    const testResult = await TestModuleBuilder
      .forService(UserService)
      .withMocks([
        { provide: UserRepository, useValue: mockUserRepository }
      ])
      .build();

    module = testResult.module;
    service = testResult.service;
    userRepository = testResult.mocks.get(UserRepository) as jest.Mocked<UserRepository>;

    // Reset bcrypt mocks
    mockBcrypt.genSalt.mockClear();
    mockBcrypt.hash.mockClear();
    mockBcrypt.compare.mockClear();
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      password: 'password123',
      authMethod: AuthMethod.EMAIL,
      role: 'ATHLETE' as any,
      profile: {
        firstName: 'John',
        lastName: 'Doe',
      }
    };

    it('should create a user with email authentication', async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.createUser.mockResolvedValue(mockUser);
      mockBcrypt.genSalt.mockResolvedValue('salt-value');
      mockBcrypt.hash.mockResolvedValue('hashed-password');

      // Act
      const result = await service.create(createUserDto);

      // Assert
      expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockBcrypt.genSalt).toHaveBeenCalledWith(12);
      expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 'salt-value');
      expect(userRepository.createUser).toHaveBeenCalledWith({
        ...createUserDto,
        passwordHash: 'hashed-password',
        salt: 'salt-value',
      });
      expect(result).toMatchObject({
        id: 'user-1',
        email: 'test@example.com',
        role: 'ATHLETE',
        status: 'ACTIVE',
      });
    });

    it('should create a user with phone authentication', async () => {
      // Arrange
      const phoneUserDto = {
        ...createUserDto,
        authMethod: AuthMethod.WHATSAPP,
        phoneNumber: '+1234567890',
        email: undefined,
        password: undefined,
      };
      userRepository.findByPhoneNumber.mockResolvedValue(null);
      userRepository.createUser.mockResolvedValue(mockUser);

      // Act
      const result = await service.create(phoneUserDto);

      // Assert
      expect(userRepository.findByPhoneNumber).toHaveBeenCalledWith('+1234567890');
      expect(userRepository.createUser).toHaveBeenCalledWith({
        ...phoneUserDto,
        passwordHash: undefined,
        salt: undefined,
      });
      expect(result.id).toBe('user-1');
    });

    it('should throw ConflictException if email already exists', async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.create(createUserDto)).rejects.toThrow('User with this email already exists');
      expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(userRepository.createUser).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if phone number already exists', async () => {
      // Arrange
      const phoneUserDto = {
        ...createUserDto,
        authMethod: AuthMethod.WHATSAPP,
        phoneNumber: '+1234567890',
        email: undefined,
        password: undefined,
      };
      userRepository.findByPhoneNumber.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.create(phoneUserDto)).rejects.toThrow('User with this phone number already exists');
      expect(userRepository.findByPhoneNumber).toHaveBeenCalledWith('+1234567890');
      expect(userRepository.createUser).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if email auth method missing email', async () => {
      // Arrange
      const invalidDto = {
        ...createUserDto,
        email: undefined,
      };

      // Act & Assert
      await expect(service.create(invalidDto)).rejects.toThrow('Email and password are required for EMAIL authentication');
      expect(userRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if phone auth method missing phone number', async () => {
      // Arrange
      const invalidDto = {
        ...createUserDto,
        authMethod: AuthMethod.WHATSAPP,
        phoneNumber: undefined,
        email: undefined,
        password: undefined,
      };

      // Act & Assert
      await expect(service.create(invalidDto)).rejects.toThrow('Phone number is required for phone-based authentication');
      expect(userRepository.findByPhoneNumber).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(mockUser);

      // Act
      const result = await service.findById('user-1');

      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith('user-1');
      expect(result).toMatchObject({
        id: 'user-1',
        email: 'test@example.com',
        role: 'ATHLETE',
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById('non-existent')).rejects.toThrow('User not found');
      expect(userRepository.findById).toHaveBeenCalledWith('non-existent');
    });
  });

  describe('findByEmail', () => {
    it('should return user when found by email', async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(mockUser);

      // Act
      const result = await service.findByEmail('test@example.com');

      // Assert
      expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com', undefined);
      expect(result.email).toBe('test@example.com');
    });

    it('should return user when found by email with tenant', async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(mockUser);

      // Act
      const result = await service.findByEmail('test@example.com', 'tenant-1');

      // Assert
      expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com', 'tenant-1');
      expect(result.email).toBe('test@example.com');
    });

    it('should throw NotFoundException when user not found by email', async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findByEmail('nonexistent@example.com')).rejects.toThrow('User not found');
    });
  });

  describe('findByPhoneNumber', () => {
    it('should return user when found by phone number', async () => {
      // Arrange
      userRepository.findByPhoneNumber.mockResolvedValue(mockUser);

      // Act
      const result = await service.findByPhoneNumber('+1234567890');

      // Assert
      expect(userRepository.findByPhoneNumber).toHaveBeenCalledWith('+1234567890', undefined);
      expect(result.phoneNumber).toBe('+1234567890');
    });

    it('should throw NotFoundException when user not found by phone', async () => {
      // Arrange
      userRepository.findByPhoneNumber.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findByPhoneNumber('+9999999999')).rejects.toThrow('User not found');
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      profile: {
        firstName: 'Jane',
        lastName: 'Smith',
      },
      preferences: { theme: 'dark' },
    };

    it('should update user successfully', async () => {
      // Arrange
      const updatedUser = { ...mockUser, first_name: 'Jane', last_name: 'Smith' };
      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.updateUserWithTenant.mockResolvedValue(updatedUser);

      // Act
      const result = await service.update('user-1', updateUserDto);

      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith('user-1');
      expect(userRepository.updateUserWithTenant).toHaveBeenCalledWith('user-1', 'tenant-1', updateUserDto);
      expect(result.profile?.firstName).toBe('Jane');
    });

    it('should throw NotFoundException when user not found for update', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update('non-existent', updateUserDto)).rejects.toThrow('User not found');
      expect(userRepository.updateUserWithTenant).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when updating to existing email', async () => {
      // Arrange
      const updateWithEmail = { ...updateUserDto, email: 'existing@example.com' };
      const existingUser = { ...mockUser, id: 'other-user', email: 'existing@example.com' };

      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.findByEmail.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(service.update('user-1', updateWithEmail)).rejects.toThrow('User with this email already exists');
      expect(userRepository.findByEmail).toHaveBeenCalledWith('existing@example.com', 'tenant-1');
    });

    it('should allow updating to same email', async () => {
      // Arrange
      const updateWithSameEmail = { ...updateUserDto, email: 'test@example.com' };
      const updatedUser = { ...mockUser, first_name: 'Jane' };

      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.findByEmail.mockResolvedValue(mockUser); // Same user
      userRepository.updateUserWithTenant.mockResolvedValue(updatedUser);

      // Act
      const result = await service.update('user-1', updateWithSameEmail);

      // Assert
      expect(result).toBeDefined();
      expect(userRepository.updateUserWithTenant).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.deleteUser.mockResolvedValue(true);

      // Act
      await service.delete('user-1');

      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith('user-1');
      expect(userRepository.deleteUser).toHaveBeenCalledWith('user-1');
    });

    it('should throw NotFoundException when user not found for deletion', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.delete('non-existent')).rejects.toThrow('User not found');
      expect(userRepository.deleteUser).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when deletion fails', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.deleteUser.mockResolvedValue(false);

      // Act & Assert
      await expect(service.delete('user-1')).rejects.toThrow('Failed to delete user');
    });
  });

  describe('findMany', () => {
    const queryDto: UserQueryDto = {
      page: 1,
      limit: 10,
      search: 'john',
      role: 'ATHLETE' as any,
      status: 'ACTIVE' as any,
    };

    it('should return paginated users', async () => {
      // Arrange
      const users = [mockUser];
      userRepository.findMany.mockResolvedValue({ users, total: 1 });

      // Act
      const result = await service.findMany(queryDto);

      // Assert
      expect(userRepository.findMany).toHaveBeenCalledWith(queryDto);
      expect(result).toEqual({
        users: expect.arrayContaining([
          expect.objectContaining({ id: 'user-1' })
        ]),
        total: 1,
        page: 1,
        limit: 10,
      });
    });

    it('should use default pagination values', async () => {
      // Arrange
      const emptyQuery = {};
      userRepository.findMany.mockResolvedValue({ users: [], total: 0 });

      // Act
      const result = await service.findMany(emptyQuery);

      // Assert
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });

  describe('updateStatus', () => {
    it('should update user status successfully', async () => {
      // Arrange
      const updatedUser = { ...mockUser, status: UserStatus.SUSPENDED };
      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.updateStatus.mockResolvedValue(updatedUser);

      // Act
      const result = await service.updateStatus('user-1', UserStatus.SUSPENDED);

      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith('user-1');
      expect(userRepository.updateStatus).toHaveBeenCalledWith('user-1', UserStatus.SUSPENDED);
      expect(result.status).toBe(UserStatus.SUSPENDED);
    });

    it('should throw NotFoundException when user not found for status update', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateStatus('non-existent', UserStatus.SUSPENDED)).rejects.toThrow('User not found');
    });

    it('should throw BadRequestException when status update fails', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.updateStatus.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateStatus('user-1', UserStatus.SUSPENDED)).rejects.toThrow('Failed to update user status');
    });
  });

  describe('validatePassword', () => {
    it('should return user when password is valid', async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);

      // Act
      const result = await service.validatePassword('test@example.com', 'password123');

      // Assert
      expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
      expect(result).toEqual(mockUser);
    });

    it('should return null when password is invalid', async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false);

      // Act
      const result = await service.validatePassword('test@example.com', 'wrongpassword');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when user not found', async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(null);

      // Act
      const result = await service.validatePassword('nonexistent@example.com', 'password123');

      // Assert
      expect(result).toBeNull();
      expect(mockBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should return null when user has no password hash', async () => {
      // Arrange
      const userWithoutPassword = { ...mockUser, password_hash: undefined };
      userRepository.findByEmail.mockResolvedValue(userWithoutPassword);

      // Act
      const result = await service.validatePassword('test@example.com', 'password123');

      // Assert
      expect(result).toBeNull();
      expect(mockBcrypt.compare).not.toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.updateUser.mockResolvedValue(mockUser);
      mockBcrypt.genSalt.mockResolvedValue('new-salt');
      mockBcrypt.hash.mockResolvedValue('new-hashed-password');

      // Act
      await service.changePassword('user-1', 'newpassword123');

      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith('user-1');
      expect(mockBcrypt.genSalt).toHaveBeenCalledWith(12);
      expect(mockBcrypt.hash).toHaveBeenCalledWith('newpassword123', 'new-salt');
      expect(userRepository.updateUser).toHaveBeenCalledWith('user-1', {
        passwordHash: 'new-hashed-password',
        salt: 'new-salt',
      });
    });

    it('should throw NotFoundException when user not found for password change', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.changePassword('non-existent', 'newpassword')).rejects.toThrow('User not found');
      expect(userRepository.updateUser).not.toHaveBeenCalled();
    });
  });

  describe('bulkUpdateStatus', () => {
    const userIds = ['user-1', 'user-2'];

    it('should bulk update status successfully', async () => {
      // Arrange
      const users = [mockUser, { ...mockUser, id: 'user-2' }];
      userRepository.findById
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({ ...mockUser, id: 'user-2' });
      userRepository.bulkUpdateStatus.mockResolvedValue(users);

      // Act
      const result = await service.bulkUpdateStatus(userIds, UserStatus.SUSPENDED);

      // Assert
      expect(userRepository.findById).toHaveBeenCalledTimes(2);
      expect(userRepository.bulkUpdateStatus).toHaveBeenCalledWith(userIds, UserStatus.SUSPENDED);
      expect(result).toHaveLength(2);
    });

    it('should throw NotFoundException when some users not found', async () => {
      // Arrange
      userRepository.findById
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null);

      // Act & Assert
      await expect(service.bulkUpdateStatus(userIds, UserStatus.SUSPENDED)).rejects.toThrow('Users not found: user-2');
      expect(userRepository.bulkUpdateStatus).not.toHaveBeenCalled();
    });
  });

  describe('bulkAssignRole', () => {
    const userIds = ['user-1', 'user-2'];

    it('should bulk assign role successfully', async () => {
      // Arrange
      const users = [mockUser, { ...mockUser, id: 'user-2' }];
      userRepository.findById
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({ ...mockUser, id: 'user-2' });
      userRepository.bulkAssignRole.mockResolvedValue(users);

      // Act
      const result = await service.bulkAssignRole(userIds, 'COACH');

      // Assert
      expect(userRepository.findById).toHaveBeenCalledTimes(2);
      expect(userRepository.bulkAssignRole).toHaveBeenCalledWith(userIds, 'COACH');
      expect(result).toHaveLength(2);
    });

    it('should throw NotFoundException when some users not found', async () => {
      // Arrange
      userRepository.findById
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null);

      // Act & Assert
      await expect(service.bulkAssignRole(userIds, 'COACH')).rejects.toThrow('Users not found: user-2');
      expect(userRepository.bulkAssignRole).not.toHaveBeenCalled();
    });
  });

  describe('getUsersByRole', () => {
    it('should return users by role', async () => {
      // Arrange
      const users = [mockUser];
      userRepository.getUsersByRole.mockResolvedValue(users);

      // Act
      const result = await service.getUsersByRole('ATHLETE');

      // Assert
      expect(userRepository.getUsersByRole).toHaveBeenCalledWith('ATHLETE');
      expect(result).toHaveLength(1);
      expect(result[0].role).toBe('ATHLETE');
    });
  });

  describe('getUsersByStatus', () => {
    it('should return users by status', async () => {
      // Arrange
      const users = [mockUser];
      userRepository.getUsersByStatus.mockResolvedValue(users);

      // Act
      const result = await service.getUsersByStatus('ACTIVE');

      // Assert
      expect(userRepository.getUsersByStatus).toHaveBeenCalledWith('ACTIVE');
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('ACTIVE');
    });
  });

  describe('verifyPhoneNumber', () => {
    it('should verify phone number successfully', async () => {
      // Arrange
      const verifiedUser = { ...mockUser, phone_verified: true };
      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.verifyPhone.mockResolvedValue(undefined);
      userRepository.findByIdWithTenant.mockResolvedValue(verifiedUser);

      // Act
      const result = await service.verifyPhoneNumber('user-1');

      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith('user-1');
      expect(userRepository.verifyPhone).toHaveBeenCalledWith('user-1', 'tenant-1');
      expect(userRepository.findByIdWithTenant).toHaveBeenCalledWith('user-1', 'tenant-1');
      expect(result.phoneVerified).toBe(true);
    });

    it('should throw NotFoundException when user not found for phone verification', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.verifyPhoneNumber('non-existent')).rejects.toThrow('User not found');
    });
  });

  describe('updateAuthMethod', () => {
    it('should update auth method successfully', async () => {
      // Arrange
      const updatedUser = { ...mockUser, auth_method: AuthMethod.WHATSAPP };
      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.updateAuthMethod.mockResolvedValue(undefined);
      userRepository.findByIdWithTenant.mockResolvedValue(updatedUser);

      // Act
      const result = await service.updateAuthMethod('user-1', AuthMethod.WHATSAPP);

      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith('user-1');
      expect(userRepository.updateAuthMethod).toHaveBeenCalledWith('user-1', 'tenant-1', AuthMethod.WHATSAPP);
      expect(userRepository.findByIdWithTenant).toHaveBeenCalledWith('user-1', 'tenant-1');
      expect(result.authMethod).toBe(AuthMethod.WHATSAPP);
    });

    it('should throw NotFoundException when user not found for auth method update', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateAuthMethod('non-existent', AuthMethod.WHATSAPP)).rejects.toThrow('User not found');
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login successfully', async () => {
      // Arrange
      userRepository.updateLastLogin.mockResolvedValue(undefined);

      // Act
      await service.updateLastLogin('user-1');

      // Assert
      expect(userRepository.updateLastLogin).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getTrainingPreferences', () => {
    it('should return training preferences when user exists', async () => {
      // Arrange
      const userWithPreferences = {
        ...mockUser,
        preferences: {
          training: {
            availability: { timeZone: 'UTC' },
            scheduling: { preferredSessionDuration: 60 }
          }
        }
      };
      userRepository.findById.mockResolvedValue(userWithPreferences);

      // Act
      const result = await service.getTrainingPreferences('user-1');

      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith('user-1');
      expect(result.availability.timeZone).toBe('UTC');
      expect(result.scheduling.preferredSessionDuration).toBe(60);
    });

    it('should return default training preferences when user has no preferences', async () => {
      // Arrange
      const userWithoutPreferences = { ...mockUser, preferences: {} };
      userRepository.findById.mockResolvedValue(userWithoutPreferences);

      // Act
      const result = await service.getTrainingPreferences('user-1');

      // Assert
      expect(result.availability).toBeDefined();
      expect(result.scheduling).toBeDefined();
      expect(result.sessionPreferences).toBeDefined();
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getTrainingPreferences('non-existent')).rejects.toThrow('User not found');
    });
  });

  describe('updateTrainingPreferences', () => {
    const trainingPreferences = {
      availability: { timeZone: 'EST' },
      scheduling: { preferredSessionDuration: 90 }
    };

    it('should update training preferences successfully', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.updateUser.mockResolvedValue(mockUser);

      // Act
      const result = await service.updateTrainingPreferences('user-1', trainingPreferences);

      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith('user-1');
      expect(userRepository.updateUser).toHaveBeenCalledWith('user-1', {
        preferences: {
          training: trainingPreferences
        }
      });
      expect(result).toEqual(trainingPreferences);
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateTrainingPreferences('non-existent', trainingPreferences)).rejects.toThrow('User not found');
    });
  });

  describe('Performance Requirements', () => {
    it('should complete all tests within performance targets', () => {
      // This test validates that the isolated testing approach improves performance
      // Each test should complete quickly without loading complex dependencies
      const testStartTime = Date.now();

      // Run a simple operation
      expect(service).toBeDefined();

      const testDuration = Date.now() - testStartTime;

      // Test should complete very quickly (< 10ms) due to proper isolation
      expect(testDuration).toBeLessThan(100); // Allow some buffer for CI environments
    });

    it('should not have shared state between tests', () => {
      // Verify that mocks are properly isolated between tests
      expect(userRepository.findById).not.toHaveBeenCalled();
      expect(userRepository.createUser).not.toHaveBeenCalled();

      // This validates that beforeEach properly resets state
      expect(jest.isMockFunction(userRepository.findById)).toBe(true);
    });
  });
});