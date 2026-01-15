import { describe, it, expect, beforeEach } from 'vitest';
import { 
  userFactory, 
  tenantFactory, 
  programFactory, 
  sessionFactory,
  createServiceMocks,
  createTestSeeder,
  TestTimer,
  AssertionHelper
} from '../index';
import { UserRole, UserStatus, PlanStatus, SessionStatus } from '@strengthos/shared-types';

describe('StrengthOS Testing Library', () => {
  describe('Factories', () => {
    it('should create a test user with default values', () => {
      const user = userFactory.create();
      
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user.role).toBe(UserRole.ATHLETE);
      expect(user.status).toBe(UserStatus.ACTIVE);
      expect(user.profile.firstName).toBeTruthy();
      expect(user.profile.lastName).toBeTruthy();
    });

    it('should create a test user with custom options', () => {
      const user = userFactory.create({
        email: 'custom@example.com',
        firstName: 'Custom',
        lastName: 'User',
        role: UserRole.COACH,
      });
      
      expect(user.email).toBe('custom@example.com');
      expect(user.profile.firstName).toBe('Custom');
      expect(user.profile.lastName).toBe('User');
      expect(user.role).toBe(UserRole.COACH);
    });

    it('should create users with traits', () => {
      const user = userFactory.createWithTraits(['verified', 'recentLogin']);
      
      expect(user.status).toBe(UserStatus.ACTIVE);
      expect(user.emailVerifiedAt).toBeTruthy();
      expect(user.lastLoginAt).toBeTruthy();
    });

    it('should create a batch of users', () => {
      const users = userFactory.createBatch(5, {
        email: 'user@example.com',
        role: UserRole.ATHLETE,
      });
      
      expect(users).toHaveLength(5);
      users.forEach((user, index) => {
        expect(user.email).toBe(`user${index}@example.com`);
        expect(user.role).toBe(UserRole.ATHLETE);
      });
    });

    it('should create a tenant', () => {
      const tenant = tenantFactory.create({
        name: 'Test Gym',
        domain: 'testgym.strengthos.com',
      });
      
      expect(tenant.name).toBe('Test Gym');
      expect(tenant.domain).toBe('testgym.strengthos.com');
      expect(tenant).toHaveProperty('id');
      expect(tenant).toHaveProperty('createdAt');
    });

    it('should create a program', () => {
      const program = programFactory.create({
        name: 'Beginner Strength Program',
        durationWeeks: 8,
      });
      
      expect(program.name).toBe('Beginner Strength Program');
      expect(program.durationWeeks).toBe(8);
      expect(program.status).toBe(PlanStatus.DRAFT);
    });

    it('should create a training session', () => {
      const session = sessionFactory.createCompleted({
        name: 'Upper Body Workout',
        duration: 90,
      });
      
      expect(session.name).toBe('Upper Body Workout');
      expect(session.duration).toBe(90);
      expect(session.completedAt).toBeTruthy();
    });
  });

  describe('Mock Services', () => {
    let mockServices: ReturnType<typeof createServiceMocks>;

    beforeEach(() => {
      mockServices = createServiceMocks({
        tenantId: 'test-tenant',
        autoSuccess: true,
      });
    });

    it('should create and retrieve a user', async () => {
      const userData = {
        email: 'test@example.com',
        role: UserRole.ATHLETE,
      };

      const createResult = await mockServices.userService.createUser(userData);
      AssertionHelper.expectSuccess(createResult);

      const user = createResult.returnValue!;
      expect(user.email).toBe('test@example.com');
      expect(user.role).toBe(UserRole.ATHLETE);

      const getResult = await mockServices.userService.getUserById(user.id);
      AssertionHelper.expectSuccess(getResult);
      expect(getResult.returnValue).toEqual(user);
    });

    it('should handle user search', async () => {
      // Create some test users
      await mockServices.userService.createUser({ email: 'john@example.com', firstName: 'John' });
      await mockServices.userService.createUser({ email: 'jane@example.com', firstName: 'Jane' });

      const searchResult = await mockServices.userService.searchUsers({ name: 'john' });
      AssertionHelper.expectSuccess(searchResult);

      const users = searchResult.returnValue!;
      expect(users).toHaveLength(1);
      expect(users[0].profile.firstName).toBe('John');
    });

    it('should manage tenant operations', async () => {
      const tenantData = {
        name: 'Test Fitness Center',
        domain: 'testfitness.com',
      };

      const createResult = await mockServices.tenantService.createTenant(tenantData);
      AssertionHelper.expectSuccess(createResult);

      const tenant = createResult.returnValue!;
      expect(tenant.name).toBe('Test Fitness Center');

      const getResult = await mockServices.tenantService.getTenant(tenant.id);
      AssertionHelper.expectSuccess(getResult);
      expect(getResult.returnValue).toEqual(tenant);
    });
  });

  describe('Test Seeder', () => {
    it('should generate minimal test data', async () => {
      const seeder = createTestSeeder();
      const result = await seeder.generateMinimalData();
      
      AssertionHelper.expectSuccess(result);
      const data = result.returnValue!;
      
      expect(data.tenants).toHaveLength(1);
      expect(data.users.length).toBeGreaterThan(0);
      expect(data.programs.length).toBeGreaterThan(0);
      expect(data.sessions.length).toBeGreaterThan(0);
      
      // Check relationships
      expect(data.relationships.tenantUsers.size).toBe(1);
      expect(data.relationships.tenantPrograms.size).toBe(1);
    });

    it('should generate scenario-specific data', async () => {
      const seeder = createTestSeeder();
      const result = await seeder.generateScenarioData('multi-tenant');
      
      AssertionHelper.expectSuccess(result);
      const data = result.returnValue!;
      
      expect(data.tenants.length).toBeGreaterThan(1);
      expect(data.relationships.tenantUsers.size).toBe(data.tenants.length);
    });
  });

  describe('Test Utilities', () => {
    it('should measure execution time', async () => {
      const slowFunction = async () => {
        // Use a more reliable delay for testing
        const start = Date.now();
        while (Date.now() - start < 100) {
          // Busy wait to ensure measurable time
        }
        return 'result';
      };

      const { result, duration } = await TestTimer.measure(slowFunction);
      
      expect(result).toBe('result');
      expect(duration).toBeGreaterThan(90);
      expect(duration).toBeLessThan(150);
    });

    it('should validate Results objects', () => {
      const successResult = { isOk: true, returnValue: 'success' } as any;
      const errorResult = { isOk: false, message: 'error occurred' } as any;

      expect(() => AssertionHelper.expectSuccess(successResult)).not.toThrow();
      expect(() => AssertionHelper.expectError(errorResult)).not.toThrow();
      expect(() => AssertionHelper.expectError(errorResult, 'error occurred')).not.toThrow();
    });

    it('should validate array contents', () => {
      const users = [
        { role: UserRole.COACH, active: true },
        { role: UserRole.ATHLETE, active: true },
        { role: UserRole.ATHLETE, active: false },
      ];

      AssertionHelper.expectArrayContains(
        users, 
        user => user.role === UserRole.ATHLETE, 
        2
      );

      AssertionHelper.expectArrayContains(
        users, 
        user => user.active === true
      );
    });

    it('should validate object shapes', () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        createdAt: new Date(),
      };

      AssertionHelper.expectObjectShape(user, {
        id: 'string',
        email: 'string',
        createdAt: 'object',
      });
    });
  });

  describe('Test Cohorts', () => {
    it('should create a complete test cohort', () => {
      const tenantId = 'test-tenant-123';
      const cohort = userFactory.createTestCohort(tenantId);
      
      expect(cohort.coachAdmin.tenantId).toBe(tenantId);
      expect(cohort.coachAdmin.role).toBe(UserRole.COACH_ADMIN);
      
      expect(cohort.coaches).toHaveLength(3);
      cohort.coaches.forEach(coach => {
        expect(coach.tenantId).toBe(tenantId);
        expect(coach.role).toBe(UserRole.COACH);
      });
      
      expect(cohort.athletes).toHaveLength(10);
      cohort.athletes.forEach(athlete => {
        expect(athlete.tenantId).toBe(tenantId);
        expect(athlete.role).toBe(UserRole.ATHLETE);
      });
      
      expect(cohort.selfCoached).toHaveLength(5);
      cohort.selfCoached.forEach(user => {
        expect(user.tenantId).toBe(tenantId);
        expect(user.role).toBe(UserRole.SELF_COACHED);
      });
    });

    it('should create a training week', () => {
      const userId = 'athlete-123';
      const startDate = new Date('2024-01-01');
      const sessions = sessionFactory.createTrainingWeek(userId, startDate);
      
      expect(sessions).toHaveLength(3);
      sessions.forEach(session => {
        expect(session.userId).toBe(userId);
        expect(session.completedAt).toBeTruthy();
      });
      
      // Check that sessions are on different days
      const dates = sessions.map(s => s.scheduledAt.getDate());
      expect(new Set(dates).size).toBe(3);
    });
  });
});