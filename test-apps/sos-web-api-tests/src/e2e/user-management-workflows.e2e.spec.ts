/**
 * E2E tests for user management workflows
 * Tests complete user lifecycle management, bulk operations, role assignments,
 * tenant-specific operations, error handling, and performance requirements
 */
import { INestApplication } from '@nestjs/common';
import { 
  SosWebApiTestApplicationFactory, 
  SosWebApiTestUtils, 
  TestApplicationHooks 
} from '../utils/test-application-factory';
import { SosWebApiTestConfigs } from '../utils/test-config';
import { UserTestFactory, TenantTestFactory, SosWebApiTestDataBuilder } from '../fixtures/test-factories';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'mock://test-database';
process.env.JWT_SECRET = 'test-jwt-secret-for-user-management-e2e';
process.env.JWT_EXPIRES_IN = '1h';

describe('User Management E2E Workflows', () => {
  let app: INestApplication;
  let request: any;
  let testDataBuilder: SosWebApiTestDataBuilder;
  let userFactory: UserTestFactory;
  let tenantFactory: TenantTestFactory;

  // Test data
  let testTenant: any;
  let adminUser: any;
  let coachUser: any;
  let adminToken: string;
  let coachToken: string;

  // Performance tracking
  const performanceMetrics: { [key: string]: number } = {};

  beforeAll(async () => {
    // Create test application with E2E configuration
    const config = SosWebApiTestConfigs.custom(
      SosWebApiTestConfigs.forE2ETests(),
      {
        auth: {
          mockJwt: false, // Use real JWT for E2E tests
          defaultUserId: 'user-mgmt-test-admin',
          defaultRole: 'TENANT_ADMIN'
        },
        monitoring: {
          enabled: true,
          mockSecurityEvents: true
        },
        features: {
          enableVideoAnalysis: true,
          enableAIFeedback: true,
          enableNotifications: true
        }
      }
    );

    app = await SosWebApiTestApplicationFactory.createForE2ETests(config);
    request = await SosWebApiTestUtils.request(app);

    // Initialize test data factories
    testDataBuilder = new SosWebApiTestDataBuilder();
    userFactory = new UserTestFactory();
    tenantFactory = new TenantTestFactory();

    // Create test tenant and admin users
    testTenant = tenantFactory.create({
      id: 'user-mgmt-test-tenant',
      name: 'User Management Test Tenant',
      domain: 'user-mgmt-test.example.com'
    });

    adminUser = userFactory.createAdmin({
      id: 'user-mgmt-admin',
      tenantId: testTenant.id,
      email: 'admin@user-mgmt-test.example.com'
    });

    coachUser = userFactory.createCoach({
      id: 'user-mgmt-coach',
      tenantId: testTenant.id,
      email: 'coach@user-mgmt-test.example.com'
    });

    // Setup authentication tokens
    adminToken = await SosWebApiTestUtils.setupAuth(
      app,
      adminUser.id,
      adminUser.role,
      testTenant.id
    );

    coachToken = await SosWebApiTestUtils.setupAuth(
      app,
      coachUser.id,
      coachUser.role,
      testTenant.id
    );

    await TestApplicationHooks.beforeAll(app, config);
  });

  beforeEach(async () => {
    await TestApplicationHooks.beforeEach(app);
    SosWebApiTestUtils.resetAllMocks(app);
  });

  afterEach(async () => {
    await TestApplicationHooks.afterEach(app);
  });

  afterAll(async () => {
    await TestApplicationHooks.afterAll(app);
    SosWebApiTestApplicationFactory.reset();

    // Log performance metrics
    console.log('\n=== User Management E2E Performance Metrics ===');
    Object.entries(performanceMetrics).forEach(([operation, duration]) => {
      console.log(`${operation}: ${duration}ms`);
    });
  });

  describe('User Lifecycle Management', () => {
    describe('User Creation', () => {
      it('should create new athlete user successfully', async () => {
        const startTime = Date.now();
        
        // Arrange
        const newUserData = {
          email: 'newathlete@user-mgmt-test.example.com',
          firstName: 'New',
          lastName: 'Athlete',
          role: 'ATHLETE',
          tenantId: testTenant.id,
          profile: {
            dateOfBirth: '1995-06-15',
            gender: 'male',
            height: 180,
            weight: 75
          }
        };

        // Mock user service to simulate successful creation
        const userService = SosWebApiTestUtils.getService(app, 'UserService');
        const createdUser = userFactory.create({
          ...newUserData,
          id: 'new-athlete-id',
          status: 'ACTIVE',
          isActive: true
        });
        userService.create = jest.fn().mockResolvedValue(createdUser);

        const headers = SosWebApiTestUtils.createAuthHeaders(adminToken);

        // Act
        const response = await request
          .post('/users')
          .set(headers)
          .send(newUserData)
          .expect(201);

        // Assert
        expect(response.body).toHaveProperty('id');
        expect(response.body.email).toBe(newUserData.email);
        expect(response.body.firstName).toBe(newUserData.firstName);
        expect(response.body.lastName).toBe(newUserData.lastName);
        expect(response.body.role).toBe(newUserData.role);
        expect(response.body.tenantId).toBe(testTenant.id);
        expect(response.body.status).toBe('ACTIVE');

        // Verify service was called correctly
        expect(userService.create).toHaveBeenCalledWith(
          expect.objectContaining(newUserData),
          expect.objectContaining({ userId: adminUser.id, tenantId: testTenant.id })
        );

        // Verify monitoring
        const monitoringService = SosWebApiTestUtils.getService(app, 'MonitoringService');
        expect(monitoringService.logUserActivity).toHaveBeenCalledWith(
          'USER_CREATED',
          expect.objectContaining({
            createdUserId: createdUser.id,
            createdByUserId: adminUser.id,
            tenantId: testTenant.id
          })
        );

        performanceMetrics['User Creation'] = Date.now() - startTime;
      });

      it('should create new coach user with proper permissions', async () => {
        // Arrange
        const newCoachData = {
          email: 'newcoach@user-mgmt-test.example.com',
          firstName: 'New',
          lastName: 'Coach',
          role: 'COACH',
          tenantId: testTenant.id,
          permissions: ['MANAGE_ATHLETES', 'CREATE_PROGRAMS', 'VIEW_ANALYTICS'],
          specializations: ['Strength Training', 'Olympic Lifting']
        };

        const userService = SosWebApiTestUtils.getService(app, 'UserService');
        const createdCoach = userFactory.createCoach({
          ...newCoachData,
          id: 'new-coach-id'
        });
        userService.create = jest.fn().mockResolvedValue(createdCoach);

        const headers = SosWebApiTestUtils.createAuthHeaders(adminToken);

        // Act
        const response = await request
          .post('/users')
          .set(headers)
          .send(newCoachData)
          .expect(201);

        // Assert
        expect(response.body.role).toBe('COACH');
        expect(response.body.permissions).toEqual(expect.arrayContaining(newCoachData.permissions));
        expect(response.body.specializations).toEqual(expect.arrayContaining(newCoachData.specializations));
      });

      it('should reject user creation with invalid email format', async () => {
        // Arrange
        const invalidUserData = {
          email: 'invalid-email-format',
          firstName: 'Test',
          lastName: 'User',
          role: 'ATHLETE',
          tenantId: testTenant.id
        };

        const userService = SosWebApiTestUtils.getService(app, 'UserService');
        userService.create = jest.fn().mockRejectedValue(new Error('Invalid email format'));

        const headers = SosWebApiTestUtils.createAuthHeaders(adminToken);

        // Act & Assert
        const response = await request
          .post('/users')
          .set(headers)
          .send(invalidUserData)
          .expect(400);

        expect(response.body.message).toContain('Invalid email format');
      });

      it('should reject user creation with duplicate email', async () => {
        // Arrange
        const duplicateUserData = {
          email: adminUser.email, // Using existing admin email
          firstName: 'Duplicate',
          lastName: 'User',
          role: 'ATHLETE',
          tenantId: testTenant.id
        };

        const userService = SosWebApiTestUtils.getService(app, 'UserService');
        userService.create = jest.fn().mockRejectedValue(new Error('Email already exists'));

        const headers = SosWebApiTestUtils.createAuthHeaders(adminToken);

        // Act & Assert
        const response = await request
          .post('/users')
          .set(headers)
          .send(duplicateUserData)
          .expect(409);

        expect(response.body.message).toContain('Email already exists');
      });

      it('should enforce tenant isolation during user creation', async () => {
        // Arrange - Try to create user for different tenant
        const crossTenantData = {
          email: 'crosstenant@other-tenant.example.com',
          firstName: 'Cross',
          lastName: 'Tenant',
          role: 'ATHLETE',
          tenantId: 'other-tenant-id' // Different tenant
        };

        const userService = SosWebApiTestUtils.getService(app, 'UserService');
        userService.create = jest.fn().mockRejectedValue(new Error('Access denied: Cannot create user for different tenant'));

        const headers = SosWebApiTestUtils.createAuthHeaders(adminToken);

        // Act & Assert
        const response = await request
          .post('/users')
          .set(headers)
          .send(crossTenantData)
          .expect(403);

        expect(response.body.message).toContain('Cannot create user for different tenant');
      });
    });

    describe('User Updates', () => {
      let testUser: any;

      beforeEach(() => {
        testUser = userFactory.create({
          id: 'user-to-update',
          tenantId: testTenant.id,
          email: 'updateme@user-mgmt-test.example.com',
          firstName: 'Update',
          lastName: 'Me',
          role: 'ATHLETE'
        });
      });

      it('should update user profile information successfully', async () => {
        const startTime = Date.now();

        // Arrange
        const updateData = {
          firstName: 'Updated',
          lastName: 'Name',
          profile: {
            height: 185,
            weight: 80,
            dateOfBirth: '1990-01-01'
          }
        };

        const userService = SosWebApiTestUtils.getService(app, 'UserService');
        const updatedUser = { ...testUser, ...updateData };
        userService.update = jest.fn().mockResolvedValue(updatedUser);
        userService.findById = jest.fn().mockResolvedValue(testUser);

        const headers = SosWebApiTestUtils.createAuthHeaders(adminToken);

        // Act
        const response = await request
          .patch(`/users/${testUser.id}`)
          .set(headers)
          .send(updateData)
          .expect(200);

        // Assert
        expect(response.body.firstName).toBe(updateData.firstName);
        expect(response.body.lastName).toBe(updateData.lastName);
        expect(response.body.profile.height).toBe(updateData.profile.height);
        expect(response.body.profile.weight).toBe(updateData.profile.weight);

        expect(userService.update).toHaveBeenCalledWith(
          testUser.id,
          updateData,
          expect.objectContaining({ userId: adminUser.id, tenantId: testTenant.id })
        );

        performanceMetrics['User Update'] = Date.now() - startTime;
      });

      it('should update user role with proper authorization', async () => {
        // Arrange
        const roleUpdateData = {
          role: 'COACH',
          permissions: ['MANAGE_ATHLETES', 'CREATE_PROGRAMS']
        };

        const userService = SosWebApiTestUtils.getService(app, 'UserService');
        const updatedUser = { ...testUser, ...roleUpdateData };
        userService.update = jest.fn().mockResolvedValue(updatedUser);
        userService.findById = jest.fn().mockResolvedValue(testUser);

        const headers = SosWebApiTestUtils.createAuthHeaders(adminToken);

        // Act
        const response = await request
          .patch(`/users/${testUser.id}`)
          .set(headers)
          .send(roleUpdateData)
          .expect(200);

        // Assert
        expect(response.body.role).toBe('COACH');
        expect(response.body.permissions).toEqual(expect.arrayContaining(roleUpdateData.permissions));

        // Verify role change monitoring
        const monitoringService = SosWebApiTestUtils.getService(app, 'MonitoringService');
        expect(monitoringService.logUserActivity).toHaveBeenCalledWith(
          'USER_ROLE_CHANGED',
          expect.objectContaining({
            userId: testUser.id,
            oldRole: 'ATHLETE',
            newRole: 'COACH',
            changedByUserId: adminUser.id
          })
        );
      });

      it('should reject role update by non-admin user', async () => {
        // Arrange
        const roleUpdateData = {
          role: 'TENANT_ADMIN'
        };

        const userService = SosWebApiTestUtils.getService(app, 'UserService');
        userService.update = jest.fn().mockRejectedValue(new Error('Insufficient permissions to change user role'));

        const headers = SosWebApiTestUtils.createAuthHeaders(coachToken); // Using coach token

        // Act & Assert
        const response = await request
          .patch(`/users/${testUser.id}`)
          .set(headers)
          .send(roleUpdateData)
          .expect(403);

        expect(response.body.message).toContain('Insufficient permissions');
      });

      it('should prevent updating user from different tenant', async () => {
        // Arrange
        const crossTenantUser = userFactory.create({
          id: 'cross-tenant-user',
          tenantId: 'other-tenant-id',
          email: 'other@other-tenant.example.com'
        });

        const updateData = { firstName: 'Hacked' };

        const userService = SosWebApiTestUtils.getService(app, 'UserService');
        userService.findById = jest.fn().mockResolvedValue(crossTenantUser);
        userService.update = jest.fn().mockRejectedValue(new Error('User not found in tenant'));

        const headers = SosWebApiTestUtils.createAuthHeaders(adminToken);

        // Act & Assert
        const response = await request
          .patch(`/users/${crossTenantUser.id}`)
          .set(headers)
          .send(updateData)
          .expect(404);

        expect(response.body.message).toContain('User not found in tenant');
      });
    });

    describe('User Status Management', () => {
      let activeUser: any;

      beforeEach(() => {
        activeUser = userFactory.create({
          id: 'status-test-user',
          tenantId: testTenant.id,
          email: 'statustest@user-mgmt-test.example.com',
          status: 'ACTIVE',
          isActive: true
        });
      });

      it('should suspend user successfully', async () => {
        const startTime = Date.now();

        // Arrange
        const suspensionData = {
          status: 'SUSPENDED',
          reason: 'Policy violation',
          suspendedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        };

        const userService = SosWebApiTestUtils.getService(app, 'UserService');
        const suspendedUser = { ...activeUser, ...suspensionData, isActive: false };
        userService.updateStatus = jest.fn().mockResolvedValue(suspendedUser);
        userService.findById = jest.fn().mockResolvedValue(activeUser);

        const headers = SosWebApiTestUtils.createAuthHeaders(adminToken);

        // Act
        const response = await request
          .patch(`/users/${activeUser.id}/status`)
          .set(headers)
          .send(suspensionData)
          .expect(200);

        // Assert
        expect(response.body.status).toBe('SUSPENDED');
        expect(response.body.isActive).toBe(false);
        expect(response.body.reason).toBe(suspensionData.reason);

        // Verify monitoring
        const monitoringService = SosWebApiTestUtils.getService(app, 'MonitoringService');
        expect(monitoringService.logUserActivity).toHaveBeenCalledWith(
          'USER_SUSPENDED',
          expect.objectContaining({
            userId: activeUser.id,
            reason: suspensionData.reason,
            suspendedByUserId: adminUser.id
          })
        );

        performanceMetrics['User Status Change'] = Date.now() - startTime;
      });

      it('should reactivate suspended user', async () => {
        // Arrange
        const suspendedUser = userFactory.createSuspendedUser({
          id: 'suspended-user',
          tenantId: testTenant.id
        });

        const reactivationData = {
          status: 'ACTIVE',
          reason: 'Suspension period completed'
        };

        const userService = SosWebApiTestUtils.getService(app, 'UserService');
        const reactivatedUser = { ...suspendedUser, ...reactivationData, isActive: true };
        userService.updateStatus = jest.fn().mockResolvedValue(reactivatedUser);
        userService.findById = jest.fn().mockResolvedValue(suspendedUser);

        const headers = SosWebApiTestUtils.createAuthHeaders(adminToken);

        // Act
        const response = await request
          .patch(`/users/${suspendedUser.id}/status`)
          .set(headers)
          .send(reactivationData)
          .expect(200);

        // Assert
        expect(response.body.status).toBe('ACTIVE');
        expect(response.body.isActive).toBe(true);

        // Verify monitoring
        const monitoringService = SosWebApiTestUtils.getService(app, 'MonitoringService');
        expect(monitoringService.logUserActivity).toHaveBeenCalledWith(
          'USER_REACTIVATED',
          expect.objectContaining({
            userId: suspendedUser.id,
            reactivatedByUserId: adminUser.id
          })
        );
      });

      it('should deactivate user account', async () => {
        // Arrange
        const deactivationData = {
          status: 'INACTIVE',
          reason: 'User requested account deactivation'
        };

        const userService = SosWebApiTestUtils.getService(app, 'UserService');
        const deactivatedUser = { ...activeUser, ...deactivationData, isActive: false };
        userService.updateStatus = jest.fn().mockResolvedValue(deactivatedUser);
        userService.findById = jest.fn().mockResolvedValue(activeUser);

        const headers = SosWebApiTestUtils.createAuthHeaders(adminToken);

        // Act
        const response = await request
          .patch(`/users/${activeUser.id}/status`)
          .set(headers)
          .send(deactivationData)
          .expect(200);

        // Assert
        expect(response.body.status).toBe('INACTIVE');
        expect(response.body.isActive).toBe(false);
      });
    });

    describe('User Deletion', () => {
      let userToDelete: any;

      beforeEach(() => {
        userToDelete = userFactory.create({
          id: 'user-to-delete',
          tenantId: testTenant.id,
          email: 'deleteme@user-mgmt-test.example.com'
        });
      });

      it('should soft delete user successfully', async () => {
        const startTime = Date.now();

        // Arrange
        const deletionData = {
          reason: 'User requested account deletion',
          hardDelete: false
        };

        const userService = SosWebApiTestUtils.getService(app, 'UserService');
        userService.delete = jest.fn().mockResolvedValue({ deleted: true, hardDelete: false });
        userService.findById = jest.fn().mockResolvedValue(userToDelete);

        const headers = SosWebApiTestUtils.createAuthHeaders(adminToken);

        // Act
        const response = await request
          .delete(`/users/${userToDelete.id}`)
          .set(headers)
          .send(deletionData)
          .expect(200);

        // Assert
        expect(response.body.deleted).toBe(true);
        expect(response.body.hardDelete).toBe(false);

        expect(userService.delete).toHaveBeenCalledWith(
          userToDelete.id,
          expect.objectContaining({
            reason: deletionData.reason,
            hardDelete: false,
            deletedBy: adminUser.id
          })
        );

        // Verify monitoring
        const monitoringService = SosWebApiTestUtils.getService(app, 'MonitoringService');
        expect(monitoringService.logUserActivity).toHaveBeenCalledWith(
          'USER_DELETED',
          expect.objectContaining({
            userId: userToDelete.id,
            deletedByUserId: adminUser.id,
            hardDelete: false
          })
        );

        performanceMetrics['User Deletion'] = Date.now() - startTime;
      });

      it('should hard delete user with proper authorization', async () => {
        // Arrange
        const hardDeletionData = {
          reason: 'GDPR compliance - user data removal request',
          hardDelete: true,
          confirmationToken: 'CONFIRM_HARD_DELETE'
        };

        const userService = SosWebApiTestUtils.getService(app, 'UserService');
        userService.delete = jest.fn().mockResolvedValue({ deleted: true, hardDelete: true });
        userService.findById = jest.fn().mockResolvedValue(userToDelete);

        const headers = SosWebApiTestUtils.createAuthHeaders(adminToken);

        // Act
        const response = await request
          .delete(`/users/${userToDelete.id}`)
          .set(headers)
          .send(hardDeletionData)
          .expect(200);

        // Assert
        expect(response.body.deleted).toBe(true);
        expect(response.body.hardDelete).toBe(true);

        // Verify security monitoring for hard delete
        const monitoringService = SosWebApiTestUtils.getService(app, 'MonitoringService');
        expect(monitoringService.logSecurityEvent).toHaveBeenCalledWith(
          'USER_HARD_DELETED',
          expect.objectContaining({
            userId: userToDelete.id,
            deletedByUserId: adminUser.id,
            reason: hardDeletionData.reason
          })
        );
      });

      it('should prevent deletion of user with active sessions', async () => {
        // Arrange
        const activeUser = userFactory.create({
          id: 'active-session-user',
          tenantId: testTenant.id,
          lastLoginAt: new Date() // Recent login
        });

        const userService = SosWebApiTestUtils.getService(app, 'UserService');
        userService.findById = jest.fn().mockResolvedValue(activeUser);
        userService.delete = jest.fn().mockRejectedValue(new Error('Cannot delete user with active sessions'));

        const headers = SosWebApiTestUtils.createAuthHeaders(adminToken);

        // Act & Assert
        const response = await request
          .delete(`/users/${activeUser.id}`)
          .set(headers)
          .send({ reason: 'Test deletion' })
          .expect(409);

        expect(response.body.message).toContain('Cannot delete user with active sessions');
      });
    });
  });

  describe('Bulk Operations', () => {
    let bulkTestUsers: any[];

    beforeEach(() => {
      // Create test users for bulk operations
      bulkTestUsers = userFactory.createMany(10, {
        tenantId: testTenant.id,
        role: 'ATHLETE'
      });
    });

    describe('Bulk User Creation', () => {
      it('should create multiple users in batch successfully', async () => {
        const startTime = Date.now();

        // Arrange
        const bulkCreateData = {
          users: [
            {
              email: 'bulk1@user-mgmt-test.example.com',
              firstName: 'Bulk',
              lastName: 'User1',
              role: 'ATHLETE'
            },
            {
              email: 'bulk2@user-mgmt-test.example.com',
              firstName: 'Bulk',
              lastName: 'User2',
              role: 'ATHLETE'
            },
            {
              email: 'bulk3@user-mgmt-test.example.com',
              firstName: 'Bulk',
              lastName: 'User3',
              role: 'COACH'
            }
          ]
        };

        const userService = SosWebApiTestUtils.getService(app, 'UserService');
        const createdUsers = bulkCreateData.users.map((userData, index) => 
          userFactory.create({
            ...userData,
            id: `bulk-created-${index + 1}`,
            tenantId: testTenant.id
          })
        );
        userService.bulkCreate = jest.fn().mockResolvedValue({
          created: createdUsers,
          failed: [],
          summary: { total: 3, successful: 3, failed: 0 }
        });

        const headers = SosWebApiTestUtils.createAuthHeaders(adminToken);

        // Act
        const response = await request
          .post('/users/bulk')
          .set(headers)
          .send(bulkCreateData)
          .expect(201);

        // Assert
        expect(response.body.summary.total).toBe(3);
        expect(response.body.summary.successful).toBe(3);
        expect(response.body.summary.failed).toBe(0);
        expect(response.body.created).toHaveLength(3);

        expect(userService.bulkCreate).toHaveBeenCalledWith(
          bulkCreateData.users,
          expect.objectContaining({ userId: adminUser.id, tenantId: testTenant.id })
        );

        performanceMetrics['Bulk User Creation'] = Date.now() - startTime;
      });

      it('should handle partial failures in bulk creation', async () => {
        // Arrange
        const bulkCreateData = {
          users: [
            {
              email: 'valid@user-mgmt-test.example.com',
              firstName: 'Valid',
              lastName: 'User',
              role: 'ATHLETE'
            },
            {
              email: 'invalid-email', // Invalid email
              firstName: 'Invalid',
              lastName: 'User',
              role: 'ATHLETE'
            },
            {
              email: adminUser.email, // Duplicate email
              firstName: 'Duplicate',
              lastName: 'User',
              role: 'ATHLETE'
            }
          ]
        };

        const userService = SosWebApiTestUtils.getService(app, 'UserService');
        userService.bulkCreate = jest.fn().mockResolvedValue({
          created: [userFactory.create({ id: 'bulk-success-1', tenantId: testTenant.id })],
          failed: [
            { index: 1, error: 'Invalid email format', data: bulkCreateData.users[1] },
            { index: 2, error: 'Email already exists', data: bulkCreateData.users[2] }
          ],
          summary: { total: 3, successful: 1, failed: 2 }
        });

        const headers = SosWebApiTestUtils.createAuthHeaders(adminToken);

        // Act
        const response = await request
          .post('/users/bulk')
          .set(headers)
          .send(bulkCreateData)
          .expect(207); // Multi-status

        // Assert
        expect(response.body.summary.total).toBe(3);
        expect(response.body.summary.successful).toBe(1);
        expect(response.body.summary.failed).toBe(2);
        expect(response.body.created).toHaveLength(1);
        expect(response.body.failed).toHaveLength(2);
      });
    });

    describe('Bulk User Updates', () => {
      it('should update multiple users in batch', async () => {
        const startTime = Date.now();

        // Arrange
        const bulkUpdateData = {
          userIds: bulkTestUsers.slice(0, 5).map(u => u.id),
          updates: {
            status: 'ACTIVE',
            tags: ['bulk-updated']
          }
        };

        const userService = SosWebApiTestUtils.getService(app, 'UserService');
        const updatedUsers = bulkTestUsers.slice(0, 5).map(user => ({
          ...user,
          ...bulkUpdateData.updates
        }));
        userService.bulkUpdate = jest.fn().mockResolvedValue({
          updated: updatedUsers,
          failed: [],
          summary: { total: 5, successful: 5, failed: 0 }
        });

        const headers = SosWebApiTestUtils.createAuthHeaders(adminToken);

        // Act
        const response = await request
          .patch('/users/bulk')
          .set(headers)
          .send(bulkUpdateData)
          .expect(200);

        // Assert
        expect(response.body.summary.successful).toBe(5);
        expect(response.body.updated).toHaveLength(5);

        expect(userService.bulkUpdate).toHaveBeenCalledWith(
          bulkUpdateData.userIds,
          bulkUpdateData.updates,
          expect.objectContaining({ userId: adminUser.id, tenantId: testTenant.id })
        );

        performanceMetrics['Bulk User Update'] = Date.now() - startTime;
      });

      it('should handle bulk role assignments', async () => {
        // Arrange
        const roleAssignmentData = {
          userIds: bulkTestUsers.slice(0, 3).map(u => u.id),
          updates: {
            role: 'COACH',
            permissions: ['MANAGE_ATHLETES', 'CREATE_PROGRAMS']
          }
        };

        const userService = SosWebApiTestUtils.getService(app, 'UserService');
        const updatedUsers = bulkTestUsers.slice(0, 3).map(user => ({
          ...user,
          role: 'COACH',
          permissions: roleAssignmentData.updates.permissions
        }));
        userService.bulkUpdate = jest.fn().mockResolvedValue({
          updated: updatedUsers,
          failed: [],
          summary: { total: 3, successful: 3, failed: 0 }
        });

        const headers = SosWebApiTestUtils.createAuthHeaders(adminToken);

        // Act
        const response = await request
          .patch('/users/bulk')
          .set(headers)
          .send(roleAssignmentData)
          .expect(200);

        // Assert
        expect(response.body.summary.successful).toBe(3);
        response.body.updated.forEach((user: any) => {
          expect(user.role).toBe('COACH');
          expect(user.permissions).toEqual(expect.arrayContaining(roleAssignmentData.updates.permissions));
        });

        // Verify bulk role change monitoring
        const monitoringService = SosWebApiTestUtils.getService(app, 'MonitoringService');
        expect(monitoringService.logUserActivity).toHaveBeenCalledWith(
          'BULK_ROLE_ASSIGNMENT',
          expect.objectContaining({
            userIds: roleAssignmentData.userIds,
            newRole: 'COACH',
            changedByUserId: adminUser.id
          })
        );
      });
    });

    describe('Bulk User Deletion', () => {
      it('should delete multiple users in batch', async () => {
        const startTime = Date.now();

        // Arrange
        const bulkDeleteData = {
          userIds: bulkTestUsers.slice(0, 3).map(u => u.id),
          reason: 'Bulk cleanup operation',
          hardDelete: false
        };

        const userService = SosWebApiTestUtils.getService(app, 'UserService');
        userService.bulkDelete = jest.fn().mockResolvedValue({
          deleted: bulkDeleteData.userIds,
          failed: [],
          summary: { total: 3, successful: 3, failed: 0 }
        });

        const headers = SosWebApiTestUtils.createAuthHeaders(adminToken);

        // Act
        const response = await request
          .delete('/users/bulk')
          .set(headers)
          .send(bulkDeleteData)
          .expect(200);

        // Assert
        expect(response.body.summary.successful).toBe(3);
        expect(response.body.deleted).toHaveLength(3);

        expect(userService.bulkDelete).toHaveBeenCalledWith(
          bulkDeleteData.userIds,
          expect.objectContaining({
            reason: bulkDeleteData.reason,
            hardDelete: false,
            deletedBy: adminUser.id
          })
        );

        performanceMetrics['Bulk User Deletion'] = Date.now() - startTime;
      });
    });
  });

  describe('Role Assignment and Management', () => {
    let testUser: any;

    beforeEach(() => {
      testUser = userFactory.create({
        id: 'role-test-user',
        tenantId: testTenant.id,
        role: 'ATHLETE'
      });
    });

    describe('Individual Role Changes', () => {
      it('should promote athlete to coach role', async () => {
        // Arrange
        const promotionData = {
          role: 'COACH',
          permissions: ['MANAGE_ATHLETES', 'CREATE_PROGRAMS', 'VIEW_ANALYTICS'],
          specializations: ['Strength Training', 'Powerlifting'],
          certifications: ['NSCA-CSCS', 'USAW Level 1']
        };

        const userService = SosWebApiTestUtils.getService(app, 'UserService');
        const promotedUser = { ...testUser, ...promotionData };
        userService.updateRole = jest.fn().mockResolvedValue(promotedUser);
        userService.findById = jest.fn().mockResolvedValue(testUser);

        const headers = SosWebApiTestUtils.createAuthHeaders(adminToken);

        // Act
        const response = await request
          .patch(`/users/${testUser.id}/role`)
          .set(headers)
          .send(promotionData)
          .expect(200);

        // Assert
        expect(response.body.role).toBe('COACH');
        expect(response.body.permissions).toEqual(expect.arrayContaining(promotionData.permissions));
        expect(response.body.specializations).toEqual(expect.arrayContaining(promotionData.specializations));

        // Verify role change audit
        const monitoringService = SosWebApiTestUtils.getService(app, 'MonitoringService');
        expect(monitoringService.logUserActivity).toHaveBeenCalledWith(
          'USER_ROLE_PROMOTED',
          expect.objectContaining({
            userId: testUser.id,
            oldRole: 'ATHLETE',
            newRole: 'COACH',
            promotedByUserId: adminUser.id
          })
        );
      });

      it('should demote coach to athlete role', async () => {
        // Arrange
        const coachUser = userFactory.createCoach({
          id: 'coach-to-demote',
          tenantId: testTenant.id
        });

        const demotionData = {
          role: 'ATHLETE',
          reason: 'Role change requested by user'
        };

        const userService = SosWebApiTestUtils.getService(app, 'UserService');
        const demotedUser = { ...coachUser, role: 'ATHLETE', permissions: [] };
        userService.updateRole = jest.fn().mockResolvedValue(demotedUser);
        userService.findById = jest.fn().mockResolvedValue(coachUser);

        const headers = SosWebApiTestUtils.createAuthHeaders(adminToken);

        // Act
        const response = await request
          .patch(`/users/${coachUser.id}/role`)
          .set(headers)
          .send(demotionData)
          .expect(200);

        // Assert
        expect(response.body.role).toBe('ATHLETE');
        expect(response.body.permissions).toEqual([]);

        // Verify demotion monitoring
        const monitoringService = SosWebApiTestUtils.getService(app, 'MonitoringService');
        expect(monitoringService.logUserActivity).toHaveBeenCalledWith(
          'USER_ROLE_DEMOTED',
          expect.objectContaining({
            userId: coachUser.id,
            oldRole: 'COACH',
            newRole: 'ATHLETE',
            demotedByUserId: adminUser.id,
            reason: demotionData.reason
          })
        );
      });

      it('should assign admin role with proper authorization', async () => {
        // Arrange
        const adminPromotionData = {
          role: 'TENANT_ADMIN',
          permissions: ['MANAGE_USERS', 'MANAGE_SETTINGS', 'VIEW_ANALYTICS', 'MANAGE_BILLING']
        };

        const userService = SosWebApiTestUtils.getService(app, 'UserService');
        const newAdmin = { ...testUser, ...adminPromotionData };
        userService.updateRole = jest.fn().mockResolvedValue(newAdmin);
        userService.findById = jest.fn().mockResolvedValue(testUser);

        const headers = SosWebApiTestUtils.createAuthHeaders(adminToken);

        // Act
        const response = await request
          .patch(`/users/${testUser.id}/role`)
          .set(headers)
          .send(adminPromotionData)
          .expect(200);

        // Assert
        expect(response.body.role).toBe('TENANT_ADMIN');
        expect(response.body.permissions).toEqual(expect.arrayContaining(adminPromotionData.permissions));

        // Verify admin assignment security monitoring
        const monitoringService = SosWebApiTestUtils.getService(app, 'MonitoringService');
        expect(monitoringService.logSecurityEvent).toHaveBeenCalledWith(
          'ADMIN_ROLE_ASSIGNED',
          expect.objectContaining({
            userId: testUser.id,
            assignedByUserId: adminUser.id,
            tenantId: testTenant.id
          })
        );
      });

      it('should reject unauthorized role assignments', async () => {
        // Arrange - Coach trying to assign admin role
        const unauthorizedRoleData = {
          role: 'TENANT_ADMIN'
        };

        const userService = SosWebApiTestUtils.getService(app, 'UserService');
        userService.updateRole = jest.fn().mockRejectedValue(new Error('Insufficient permissions to assign admin role'));

        const headers = SosWebApiTestUtils.createAuthHeaders(coachToken); // Using coach token

        // Act & Assert
        const response = await request
          .patch(`/users/${testUser.id}/role`)
          .set(headers)
          .send(unauthorizedRoleData)
          .expect(403);

        expect(response.body.message).toContain('Insufficient permissions');
      });
    });

    describe('Permission Management', () => {
      it('should update user permissions independently', async () => {
        // Arrange
        const coachUser = userFactory.createCoach({
          id: 'permission-test-coach',
          tenantId: testTenant.id,
          permissions: ['MANAGE_ATHLETES']
        });

        const permissionUpdateData = {
          permissions: ['MANAGE_ATHLETES', 'CREATE_PROGRAMS', 'VIEW_ANALYTICS', 'EXPORT_DATA']
        };

        const userService = SosWebApiTestUtils.getService(app, 'UserService');
        const updatedUser = { ...coachUser, permissions: permissionUpdateData.permissions };
        userService.updatePermissions = jest.fn().mockResolvedValue(updatedUser);
        userService.findById = jest.fn().mockResolvedValue(coachUser);

        const headers = SosWebApiTestUtils.createAuthHeaders(adminToken);

        // Act
        const response = await request
          .patch(`/users/${coachUser.id}/permissions`)
          .set(headers)
          .send(permissionUpdateData)
          .expect(200);

        // Assert
        expect(response.body.permissions).toEqual(expect.arrayContaining(permissionUpdateData.permissions));
        expect(response.body.permissions).toHaveLength(4);

        expect(userService.updatePermissions).toHaveBeenCalledWith(
          coachUser.id,
          permissionUpdateData.permissions,
          expect.objectContaining({ userId: adminUser.id, tenantId: testTenant.id })
        );
      });

      it('should revoke specific permissions', async () => {
        // Arrange
        const coachUser = userFactory.createCoach({
          id: 'revoke-permission-coach',
          tenantId: testTenant.id,
          permissions: ['MANAGE_ATHLETES', 'CREATE_PROGRAMS', 'VIEW_ANALYTICS']
        });

        const permissionRevocationData = {
          revokePermissions: ['VIEW_ANALYTICS', 'CREATE_PROGRAMS']
        };

        const userService = SosWebApiTestUtils.getService(app, 'UserService');
        const updatedUser = { ...coachUser, permissions: ['MANAGE_ATHLETES'] };
        userService.revokePermissions = jest.fn().mockResolvedValue(updatedUser);
        userService.findById = jest.fn().mockResolvedValue(coachUser);

        const headers = SosWebApiTestUtils.createAuthHeaders(adminToken);

        // Act
        const response = await request
          .patch(`/users/${coachUser.id}/permissions/revoke`)
          .set(headers)
          .send(permissionRevocationData)
          .expect(200);

        // Assert
        expect(response.body.permissions).toEqual(['MANAGE_ATHLETES']);
        expect(response.body.permissions).not.toContain('VIEW_ANALYTICS');
        expect(response.body.permissions).not.toContain('CREATE_PROGRAMS');
      });
    });
  });

  describe('Tenant-Specific Operations', () => {
    let secondTenant: any;
    let secondTenantAdmin: any;
    let secondTenantToken: string;

    beforeAll(async () => {
      // Create second tenant for isolation testing
      secondTenant = tenantFactory.create({
        id: 'second-test-tenant',
        name: 'Second Test Tenant',
        domain: 'second-test.example.com'
      });

      secondTenantAdmin = userFactory.createAdmin({
        id: 'second-tenant-admin',
        tenantId: secondTenant.id,
        email: 'admin@second-test.example.com'
      });

      secondTenantToken = await SosWebApiTestUtils.setupAuth(
        app,
        secondTenantAdmin.id,
        secondTenantAdmin.role,
        secondTenant.id
      );
    });

    describe('Tenant Isolation', () => {
      it('should only return users from current tenant', async () => {
        const startTime = Date.now();

        // Arrange
        const userService = SosWebApiTestUtils.getService(app, 'UserService');
        const tenantUsers = userFactory.createMany(5, { tenantId: testTenant.id });
        userService.findByTenant = jest.fn().mockResolvedValue({
          users: tenantUsers,
          total: 5,
          page: 1,
          limit: 10
        });

        const headers = SosWebApiTestUtils.createAuthHeaders(adminToken);

        // Act
        const response = await request
          .get('/users')
          .set(headers)
          .query({ page: 1, limit: 10 })
          .expect(200);

        // Assert
        expect(response.body.users).toHaveLength(5);
        response.body.users.forEach((user: any) => {
          expect(user.tenantId).toBe(testTenant.id);
        });

        expect(userService.findByTenant).toHaveBeenCalledWith(
          testTenant.id,
          expect.objectContaining({ page: 1, limit: 10 })
        );

        performanceMetrics['Tenant User List'] = Date.now() - startTime;
      });

      it('should prevent cross-tenant user access', async () => {
        // Arrange
        const crossTenantUser = userFactory.create({
          id: 'cross-tenant-user',
          tenantId: secondTenant.id,
          email: 'cross@second-test.example.com'
        });

        const userService = SosWebApiTestUtils.getService(app, 'UserService');
        userService.findById = jest.fn().mockRejectedValue(new Error('User not found in tenant'));

        const headers = SosWebApiTestUtils.createAuthHeaders(adminToken); // First tenant admin

        // Act & Assert
        const response = await request
          .get(`/users/${crossTenantUser.id}`)
          .set(headers)
          .expect(404);

        expect(response.body.message).toContain('User not found in tenant');
      });

      it('should enforce tenant-specific user limits', async () => {
        // Arrange
        const trialTenant = tenantFactory.createTrialTenant({
          id: 'trial-tenant',
          settings: {
            ...tenantFactory.create().settings,
            maxAthletes: 5 // Trial limit
          }
        });

        const newUserData = {
          email: 'overlimit@trial-tenant.example.com',
          firstName: 'Over',
          lastName: 'Limit',
          role: 'ATHLETE',
          tenantId: trialTenant.id
        };

        const userService = SosWebApiTestUtils.getService(app, 'UserService');
        userService.create = jest.fn().mockRejectedValue(new Error('Tenant user limit exceeded'));

        const trialAdminToken = await SosWebApiTestUtils.setupAuth(
          app,
          'trial-admin',
          'TENANT_ADMIN',
          trialTenant.id
        );
        const headers = SosWebApiTestUtils.createAuthHeaders(trialAdminToken);

        // Act & Assert
        const response = await request
          .post('/users')
          .set(headers)
          .send(newUserData)
          .expect(402); // Payment Required

        expect(response.body.message).toContain('Tenant user limit exceeded');
      });
    });

    describe('Multi-Tenant User Search', () => {
      it('should search users within tenant scope', async () => {
        // Arrange
        const searchQuery = {
          query: 'test',
          filters: {
            role: 'ATHLETE',
            status: 'ACTIVE'
          }
        };

        const userService = SosWebApiTestUtils.getService(app, 'UserService');
        const searchResults = userFactory.createMany(3, { 
          tenantId: testTenant.id,
          role: 'ATHLETE',
          firstName: 'Test'
        });
        userService.search = jest.fn().mockResolvedValue({
          users: searchResults,
          total: 3,
          query: searchQuery.query
        });

        const headers = SosWebApiTestUtils.createAuthHeaders(adminToken);

        // Act
        const response = await request
          .post('/users/search')
          .set(headers)
          .send(searchQuery)
          .expect(200);

        // Assert
        expect(response.body.users).toHaveLength(3);
        response.body.users.forEach((user: any) => {
          expect(user.tenantId).toBe(testTenant.id);
          expect(user.role).toBe('ATHLETE');
        });

        expect(userService.search).toHaveBeenCalledWith(
          testTenant.id,
          searchQuery,
          expect.any(Object)
        );
      });
    });
  });

  describe('Error Handling and Validation', () => {
    describe('Input Validation', () => {
      it('should validate required fields for user creation', async () => {
        // Arrange
        const incompleteUserData = {
          email: 'incomplete@test.example.com'
          // Missing required fields: firstName, lastName, role
        };

        const headers = SosWebApiTestUtils.createAuthHeaders(adminToken);

        // Act & Assert
        const response = await request
          .post('/users')
          .set(headers)
          .send(incompleteUserData)
          .expect(400);

        expect(response.body.message).toContain('Validation failed');
        expect(response.body.errors).toEqual(expect.arrayContaining([
          expect.objectContaining({ field: 'firstName' }),
          expect.objectContaining({ field: 'lastName' }),
          expect.objectContaining({ field: 'role' })
        ]));
      });

      it('should validate email format', async () => {
        // Arrange
        const invalidEmailData = {
          email: 'not-an-email',
          firstName: 'Test',
          lastName: 'User',
          role: 'ATHLETE',
          tenantId: testTenant.id
        };

        const headers = SosWebApiTestUtils.createAuthHeaders(adminToken);

        // Act & Assert
        const response = await request
          .post('/users')
          .set(headers)
          .send(invalidEmailData)
          .expect(400);

        expect(response.body.message).toContain('Invalid email format');
      });

      it('should validate role values', async () => {
        // Arrange
        const invalidRoleData = {
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'INVALID_ROLE',
          tenantId: testTenant.id
        };

        const headers = SosWebApiTestUtils.createAuthHeaders(adminToken);

        // Act & Assert
        const response = await request
          .post('/users')
          .set(headers)
          .send(invalidRoleData)
          .expect(400);

        expect(response.body.message).toContain('Invalid role');
      });
    });

    describe('Authorization Errors', () => {
      it('should reject requests without authentication', async () => {
        // Arrange
        const userData = {
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'ATHLETE'
        };

        // Act & Assert - No authorization header
        const response = await request
          .post('/users')
          .send(userData)
          .expect(401);

        expect(response.body.message).toContain('Unauthorized');
      });

      it('should reject requests with invalid token', async () => {
        // Arrange
        const userData = {
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'ATHLETE'
        };

        const headers = SosWebApiTestUtils.createAuthHeaders('invalid-token');

        // Act & Assert
        const response = await request
          .post('/users')
          .set(headers)
          .send(userData)
          .expect(401);

        expect(response.body.message).toContain('Invalid token');
      });

      it('should reject insufficient permissions', async () => {
        // Arrange - Athlete trying to create user
        const athleteUser = userFactory.create({
          id: 'athlete-user',
          tenantId: testTenant.id,
          role: 'ATHLETE'
        });

        const athleteToken = await SosWebApiTestUtils.setupAuth(
          app,
          athleteUser.id,
          athleteUser.role,
          testTenant.id
        );

        const userData = {
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'ATHLETE'
        };

        const headers = SosWebApiTestUtils.createAuthHeaders(athleteToken);

        // Act & Assert
        const response = await request
          .post('/users')
          .set(headers)
          .send(userData)
          .expect(403);

        expect(response.body.message).toContain('Insufficient permissions');
      });
    });

    describe('Resource Not Found', () => {
      it('should handle user not found gracefully', async () => {
        // Arrange
        const nonExistentUserId = 'non-existent-user-id';

        const userService = SosWebApiTestUtils.getService(app, 'UserService');
        userService.findById = jest.fn().mockResolvedValue(null);

        const headers = SosWebApiTestUtils.createAuthHeaders(adminToken);

        // Act & Assert
        const response = await request
          .get(`/users/${nonExistentUserId}`)
          .set(headers)
          .expect(404);

        expect(response.body.message).toContain('User not found');
      });
    });

    describe('Conflict Errors', () => {
      it('should handle email conflicts during creation', async () => {
        // Arrange
        const conflictUserData = {
          email: adminUser.email, // Existing email
          firstName: 'Conflict',
          lastName: 'User',
          role: 'ATHLETE',
          tenantId: testTenant.id
        };

        const userService = SosWebApiTestUtils.getService(app, 'UserService');
        userService.create = jest.fn().mockRejectedValue(new Error('Email already exists'));

        const headers = SosWebApiTestUtils.createAuthHeaders(adminToken);

        // Act & Assert
        const response = await request
          .post('/users')
          .set(headers)
          .send(conflictUserData)
          .expect(409);

        expect(response.body.message).toContain('Email already exists');
      });
    });
  });

  describe('Performance Requirements', () => {
    describe('Response Time Validation', () => {
      it('should complete user creation within acceptable timeframe', async () => {
        const startTime = Date.now();

        // Arrange
        const userData = {
          email: 'performance@test.example.com',
          firstName: 'Performance',
          lastName: 'Test',
          role: 'ATHLETE',
          tenantId: testTenant.id
        };

        const userService = SosWebApiTestUtils.getService(app, 'UserService');
        const createdUser = userFactory.create({ ...userData, id: 'perf-test-user' });
        userService.create = jest.fn().mockResolvedValue(createdUser);

        const headers = SosWebApiTestUtils.createAuthHeaders(adminToken);

        // Act
        const response = await request
          .post('/users')
          .set(headers)
          .send(userData)
          .expect(201);

        const duration = Date.now() - startTime;

        // Assert
        expect(response.body).toHaveProperty('id');
        expect(duration).toBeLessThan(2000); // Should complete within 2 seconds

        performanceMetrics['User Creation Performance'] = duration;
      });

      it('should complete bulk operations within acceptable timeframe', async () => {
        const startTime = Date.now();

        // Arrange
        const bulkData = {
          users: Array.from({ length: 50 }, (_, index) => ({
            email: `bulk${index}@performance-test.example.com`,
            firstName: 'Bulk',
            lastName: `User${index}`,
            role: 'ATHLETE'
          }))
        };

        const userService = SosWebApiTestUtils.getService(app, 'UserService');
        const createdUsers = bulkData.users.map((userData, index) => 
          userFactory.create({ ...userData, id: `bulk-perf-${index}`, tenantId: testTenant.id })
        );
        userService.bulkCreate = jest.fn().mockResolvedValue({
          created: createdUsers,
          failed: [],
          summary: { total: 50, successful: 50, failed: 0 }
        });

        const headers = SosWebApiTestUtils.createAuthHeaders(adminToken);

        // Act
        const response = await request
          .post('/users/bulk')
          .set(headers)
          .send(bulkData)
          .expect(201);

        const duration = Date.now() - startTime;

        // Assert
        expect(response.body.summary.successful).toBe(50);
        expect(duration).toBeLessThan(5000); // Should complete within 5 seconds for 50 users

        performanceMetrics['Bulk Creation Performance (50 users)'] = duration;
      });

      it('should handle large user list queries efficiently', async () => {
        const startTime = Date.now();

        // Arrange
        const userService = SosWebApiTestUtils.getService(app, 'UserService');
        const largeUserList = userFactory.createMany(1000, { tenantId: testTenant.id });
        userService.findByTenant = jest.fn().mockResolvedValue({
          users: largeUserList.slice(0, 100), // Paginated result
          total: 1000,
          page: 1,
          limit: 100
        });

        const headers = SosWebApiTestUtils.createAuthHeaders(adminToken);

        // Act
        const response = await request
          .get('/users')
          .set(headers)
          .query({ page: 1, limit: 100 })
          .expect(200);

        const duration = Date.now() - startTime;

        // Assert
        expect(response.body.users).toHaveLength(100);
        expect(response.body.total).toBe(1000);
        expect(duration).toBeLessThan(1000); // Should complete within 1 second

        performanceMetrics['Large User List Query'] = duration;
      });
    });

    describe('Concurrent Operations', () => {
      it('should handle concurrent user creation requests', async () => {
        const startTime = Date.now();

        // Arrange
        const concurrentRequests = Array.from({ length: 10 }, (_, index) => ({
          email: `concurrent${index}@test.example.com`,
          firstName: 'Concurrent',
          lastName: `User${index}`,
          role: 'ATHLETE',
          tenantId: testTenant.id
        }));

        const userService = SosWebApiTestUtils.getService(app, 'UserService');
        userService.create = jest.fn().mockImplementation((userData) => 
          Promise.resolve(userFactory.create({ 
            ...userData, 
            id: `concurrent-${Date.now()}-${Math.random()}` 
          }))
        );

        const headers = SosWebApiTestUtils.createAuthHeaders(adminToken);

        // Act
        const promises = concurrentRequests.map(userData =>
          request
            .post('/users')
            .set(headers)
            .send(userData)
        );

        const responses = await Promise.all(promises);
        const duration = Date.now() - startTime;

        // Assert
        responses.forEach(response => {
          expect(response.status).toBe(201);
          expect(response.body).toHaveProperty('id');
        });

        expect(duration).toBeLessThan(3000); // Should handle 10 concurrent requests within 3 seconds

        performanceMetrics['Concurrent User Creation (10 requests)'] = duration;
      });
    });
  });
});