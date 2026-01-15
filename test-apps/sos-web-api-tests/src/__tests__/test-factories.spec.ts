import { 
  UserTestFactory, 
  TenantTestFactory, 
  ProgramTestFactory, 
  SessionTestFactory,
  SosWebApiTestDataBuilder,
  userTestFactory,
  tenantTestFactory,
  programTestFactory,
  sessionTestFactory,
  sosWebApiTestDataBuilder
} from '../fixtures/test-factories';

describe('SOS Web API Test Factories', () => {
  describe('UserTestFactory', () => {
    let factory: UserTestFactory;

    beforeEach(() => {
      factory = new UserTestFactory();
    });

    it('should create a basic user with realistic data', () => {
      const user = factory.create();

      expect(user.id).toMatch(/^user-\d+$/);
      expect(user.email).toMatch(/^[a-z]+\.[a-z]+\d+@example\.com$/);
      expect(user.firstName).toBeTruthy();
      expect(user.lastName).toBeTruthy();
      expect(user.role).toBe('ATHLETE');
      expect(user.status).toBe('ACTIVE');
      expect(user.isActive).toBe(true);
      expect(user.emailVerifiedAt).toBeInstanceOf(Date);
    });

    it('should create users with different roles', () => {
      const coach = factory.createCoach();
      const admin = factory.createAdmin();
      const superAdmin = factory.createSuperAdmin();

      expect(coach.role).toBe('COACH');
      expect(coach.firstName).toBe('Coach');

      expect(admin.role).toBe('TENANT_ADMIN');
      expect(admin.firstName).toBe('Admin');

      expect(superAdmin.role).toBe('SUPER_ADMIN');
      expect(superAdmin.firstName).toBe('SuperAdmin');
      expect(superAdmin.tenantId).toBe('system');
    });

    it('should create inactive and suspended users', () => {
      const inactive = factory.createInactiveUser();
      const suspended = factory.createSuspendedUser();

      expect(inactive.status).toBe('INACTIVE');
      expect(inactive.isActive).toBe(false);
      expect(inactive.emailVerifiedAt).toBeUndefined();

      expect(suspended.status).toBe('SUSPENDED');
      expect(suspended.isActive).toBe(false);
    });

    it('should create recently active users', () => {
      const recentUser = factory.createRecentlyActiveUser();

      expect(recentUser.lastLoginAt).toBeInstanceOf(Date);
      expect(recentUser.lastLoginAt!.getTime()).toBeGreaterThan(Date.now() - 7 * 24 * 60 * 60 * 1000);
    });

    it('should create tenant users with proper distribution', () => {
      const tenantId = 'test-tenant';
      const { coaches, athletes, admins } = factory.createTenantUsers(tenantId, {
        coaches: 2,
        athletes: 5,
        admins: 1
      });

      expect(coaches).toHaveLength(2);
      expect(athletes).toHaveLength(5);
      expect(admins).toHaveLength(1);

      [...coaches, ...athletes, ...admins].forEach(user => {
        expect(user.tenantId).toBe(tenantId);
      });

      coaches.forEach(coach => expect(coach.role).toBe('COACH'));
      athletes.forEach(athlete => expect(athlete.role).toBe('ATHLETE'));
      admins.forEach(admin => expect(admin.role).toBe('TENANT_ADMIN'));
    });
  });

  describe('TenantTestFactory', () => {
    let factory: TenantTestFactory;

    beforeEach(() => {
      factory = new TenantTestFactory();
    });

    it('should create a basic tenant with realistic settings', () => {
      const tenant = factory.create();

      expect(tenant.id).toMatch(/^tenant-\d+$/);
      expect(tenant.name).toContain('Fitness');
      expect(tenant.domain).toMatch(/\.strengthos\.com$/);
      expect(tenant.status).toBe('ACTIVE');
      expect(tenant.settings.features).toHaveLength(5);
      expect(tenant.settings.maxCoaches).toBe(10);
      expect(tenant.settings.maxAthletes).toBe(100);
    });

    it('should create different tenant types', () => {
      const trial = factory.createTrialTenant();
      const enterprise = factory.createEnterpriseTenant();
      const suspended = factory.createSuspendedTenant();
      const cancelled = factory.createCancelledTenant();

      expect(trial.status).toBe('TRIAL');
      expect(trial.settings.maxCoaches).toBe(2);
      expect(trial.settings.maxAthletes).toBe(10);
      expect(trial.settings.enableVideoAnalysis).toBe(false);

      expect(enterprise.settings.maxCoaches).toBe(50);
      expect(enterprise.settings.maxAthletes).toBe(500);
      expect(enterprise.settings.features.length).toBeGreaterThan(5);

      expect(suspended.status).toBe('SUSPENDED');
      expect(suspended.suspendedAt).toBeInstanceOf(Date);

      expect(cancelled.status).toBe('CANCELLED');
    });

    it('should create international tenants with proper locale settings', () => {
      const thai = factory.createInternationalTenant('th');
      const spanish = factory.createInternationalTenant('es');
      const french = factory.createInternationalTenant('fr');
      const german = factory.createInternationalTenant('de');

      expect(thai.settings.defaultLanguage).toBe('th');
      expect(thai.settings.availableLanguages).toContain('th');
      expect(thai.name).toContain('Thai');

      expect(spanish.settings.defaultLanguage).toBe('es');
      expect(spanish.name).toContain('Español');

      expect(french.settings.defaultLanguage).toBe('fr');
      expect(french.name).toContain('Français');

      expect(german.settings.defaultLanguage).toBe('de');
      expect(german.name).toContain('Deutsches');
    });
  });

  describe('ProgramTestFactory', () => {
    let factory: ProgramTestFactory;

    beforeEach(() => {
      factory = new ProgramTestFactory();
    });

    it('should create a basic program with realistic data', () => {
      const program = factory.create();

      expect(program.id).toMatch(/^program-\d+$/);
      expect(program.name).toBeTruthy();
      expect(program.description).toContain('comprehensive');
      expect(program.difficulty).toMatch(/^(BEGINNER|INTERMEDIATE|ADVANCED)$/);
      expect(program.tags.length).toBeGreaterThan(0);
      expect(program.estimatedDuration).toBeGreaterThan(0);
      expect(program.isActive).toBe(true);
      expect(program.isTemplate).toBe(false);
    });

    it('should create different program types', () => {
      const inactive = factory.createInactiveProgram();
      const template = factory.createTemplate();
      const beginner = factory.createBeginnerProgram();
      const advanced = factory.createAdvancedProgram();

      expect(inactive.isActive).toBe(false);

      expect(template.isTemplate).toBe(true);
      expect(template.athleteIds).toHaveLength(0);

      expect(beginner.difficulty).toBe('BEGINNER');
      expect(beginner.estimatedDuration).toBe(8);
      expect(beginner.tags).toContain('beginner');

      expect(advanced.difficulty).toBe('ADVANCED');
      expect(advanced.estimatedDuration).toBe(16);
      expect(advanced.tags).toContain('advanced');
    });

    it('should create programs with assigned athletes', () => {
      const athleteIds = ['athlete-1', 'athlete-2', 'athlete-3'];
      const program = factory.createWithAthletes(athleteIds);

      expect(program.athleteIds).toEqual(athleteIds);
    });

    it('should create multiple programs for a coach', () => {
      const coachId = 'coach-123';
      const tenantId = 'tenant-456';
      const programs = factory.createCoachPrograms(coachId, tenantId, 3);

      expect(programs).toHaveLength(3);
      programs.forEach(program => {
        expect(program.coachId).toBe(coachId);
        expect(program.tenantId).toBe(tenantId);
      });
    });
  });

  describe('SessionTestFactory', () => {
    let factory: SessionTestFactory;

    beforeEach(() => {
      factory = new SessionTestFactory();
    });

    it('should create a basic session with exercises', () => {
      const session = factory.create();

      expect(session.id).toMatch(/^session-\d+$/);
      expect(session.status).toBe('SCHEDULED');
      expect(session.scheduledAt).toBeInstanceOf(Date);
      expect(session.exercises.length).toBeGreaterThanOrEqual(3);
      
      session.exercises.forEach(exercise => {
        expect(exercise.name).toBeTruthy();
        expect(exercise.sets.length).toBeGreaterThanOrEqual(3);
        
        exercise.sets.forEach(set => {
          expect(set.reps).toBeGreaterThan(0);
          expect(set.weight).toBeGreaterThan(0);
          expect(set.completed).toBe(false);
        });
      });
    });

    it('should create different session types', () => {
      const completed = factory.createCompletedSession();
      const inProgress = factory.createInProgressSession();
      const cancelled = factory.createCancelledSession();
      const missed = factory.createMissedSession();

      expect(completed.status).toBe('COMPLETED');
      expect(completed.completedAt).toBeInstanceOf(Date);
      expect(completed.duration).toBeGreaterThan(0);
      expect(completed.rpe).toBeGreaterThanOrEqual(7);
      expect(completed.exercises.every(ex => ex.sets.every(set => set.completed))).toBe(true);

      expect(inProgress.status).toBe('IN_PROGRESS');
      expect(inProgress.exercises.some(ex => ex.sets.some(set => set.completed))).toBe(true);
      expect(inProgress.exercises.some(ex => ex.sets.some(set => !set.completed))).toBe(true);

      expect(cancelled.status).toBe('CANCELLED');
      expect(cancelled.notes).toContain('cancelled');

      expect(missed.status).toBe('MISSED');
      expect(missed.scheduledAt.getTime()).toBeLessThan(Date.now());
    });

    it('should create program sessions', () => {
      const programId = 'program-123';
      const athleteId = 'athlete-456';
      const tenantId = 'tenant-789';
      const sessions = factory.createProgramSessions(programId, athleteId, tenantId, 4);

      expect(sessions).toHaveLength(4);
      sessions.forEach(session => {
        expect(session.programId).toBe(programId);
        expect(session.athleteId).toBe(athleteId);
        expect(session.tenantId).toBe(tenantId);
      });
    });

    it('should create weekly schedule', () => {
      const programId = 'program-123';
      const athleteId = 'athlete-456';
      const tenantId = 'tenant-789';
      const startDate = new Date('2024-01-01'); // Monday
      
      const sessions = factory.createWeeklySchedule(programId, athleteId, tenantId, startDate);

      expect(sessions).toHaveLength(3); // Monday, Wednesday, Friday
      
      // Check that sessions are on correct days
      expect(sessions[0].scheduledAt.getDay()).toBe(1); // Monday
      expect(sessions[1].scheduledAt.getDay()).toBe(3); // Wednesday
      expect(sessions[2].scheduledAt.getDay()).toBe(5); // Friday
    });
  });

  describe('SosWebApiTestDataBuilder', () => {
    let builder: SosWebApiTestDataBuilder;

    beforeEach(() => {
      builder = new SosWebApiTestDataBuilder();
    });

    it('should create a complete tenant ecosystem', () => {
      const ecosystem = builder.createTenantEcosystem({
        coachCount: 2,
        athleteCount: 6,
        adminCount: 1,
        programsPerCoach: 2,
        sessionsPerProgram: 3
      });

      expect(ecosystem.tenant).toBeDefined();
      expect(ecosystem.coaches).toHaveLength(2);
      expect(ecosystem.athletes).toHaveLength(6);
      expect(ecosystem.admins).toHaveLength(1);
      expect(ecosystem.programs).toHaveLength(4); // 2 coaches * 2 programs each
      expect(ecosystem.sessions.length).toBeGreaterThan(0);

      // Verify relationships
      ecosystem.coaches.forEach(coach => {
        expect(coach.tenantId).toBe(ecosystem.tenant.id);
        expect(coach.role).toBe('COACH');
      });

      ecosystem.programs.forEach(program => {
        expect(program.tenantId).toBe(ecosystem.tenant.id);
        expect(ecosystem.coaches.some(c => c.id === program.coachId)).toBe(true);
        expect(program.athleteIds.length).toBeGreaterThan(0);
      });

      ecosystem.sessions.forEach(session => {
        expect(session.tenantId).toBe(ecosystem.tenant.id);
        expect(ecosystem.programs.some(p => p.id === session.programId)).toBe(true);
        expect(ecosystem.athletes.some(a => a.id === session.athleteId)).toBe(true);
      });
    });

    it('should create different training scenarios', () => {
      const beginner = builder.createTrainingScenario('beginner');
      const intermediate = builder.createTrainingScenario('intermediate');
      const advanced = builder.createTrainingScenario('advanced');

      expect(beginner.athletes).toHaveLength(3);
      expect(beginner.program.difficulty).toBe('BEGINNER');
      expect(beginner.tenant.status).toBe('TRIAL');

      expect(intermediate.athletes).toHaveLength(6);
      expect(intermediate.program.difficulty).toBe('INTERMEDIATE');

      expect(advanced.athletes).toHaveLength(10);
      expect(advanced.program.difficulty).toBe('ADVANCED');
      expect(advanced.tenant.settings.maxCoaches).toBe(50); // Enterprise tenant
    });

    it('should create multi-tenant scenario', () => {
      const scenario = builder.createMultiTenantScenario(3);

      expect(scenario.tenants).toHaveLength(3);
      expect(scenario.allUsers.length).toBeGreaterThan(0);
      expect(scenario.allPrograms.length).toBeGreaterThan(0);
      expect(scenario.allSessions.length).toBeGreaterThan(0);

      // Verify tenant isolation
      scenario.tenants.forEach(tenant => {
        const tenantUsers = scenario.allUsers.filter(u => u.tenantId === tenant.id);
        const tenantPrograms = scenario.allPrograms.filter(p => p.tenantId === tenant.id);
        const tenantSessions = scenario.allSessions.filter(s => s.tenantId === tenant.id);

        expect(tenantUsers.length).toBeGreaterThan(0);
        expect(tenantPrograms.length).toBeGreaterThan(0);
        expect(tenantSessions.length).toBeGreaterThan(0);
      });
    });

    it('should create performance test data at different scales', () => {
      const small = builder.createPerformanceTestData('small');
      const medium = builder.createPerformanceTestData('medium');

      expect(small.users).toHaveLength(50);
      expect(small.programs).toHaveLength(20);
      expect(small.sessions).toHaveLength(200);

      expect(medium.users).toHaveLength(500);
      expect(medium.programs).toHaveLength(200);
      expect(medium.sessions).toHaveLength(2000);

      // Verify realistic role distribution
      const coaches = small.users.filter(u => u.role === 'COACH');
      const admins = small.users.filter(u => u.role === 'TENANT_ADMIN');
      const athletes = small.users.filter(u => u.role === 'ATHLETE');

      expect(coaches.length).toBeGreaterThan(0);
      expect(admins.length).toBeGreaterThan(0);
      expect(athletes.length).toBeGreaterThan(coaches.length + admins.length);
    });

    it('should reset all factories', () => {
      // Create some data to increment sequences
      builder.createTenantEcosystem();
      
      builder.resetAll();
      
      // Create new data and verify sequences reset
      const ecosystem = builder.createTenantEcosystem();
      expect(ecosystem.tenant.id).toBe('tenant-1');
      expect(ecosystem.coaches[0].id).toBe('user-1');
    });
  });

  describe('Singleton factory instances', () => {
    it('should provide working singleton instances', () => {
      const user = userTestFactory.create();
      const tenant = tenantTestFactory.create();
      const program = programTestFactory.create();
      const session = sessionTestFactory.create();

      expect(user.id).toMatch(/^user-\d+$/);
      expect(tenant.id).toMatch(/^tenant-\d+$/);
      expect(program.id).toMatch(/^program-\d+$/);
      expect(session.id).toMatch(/^session-\d+$/);
    });

    it('should provide working singleton test data builder', () => {
      const ecosystem = sosWebApiTestDataBuilder.createTenantEcosystem();
      
      expect(ecosystem.tenant).toBeDefined();
      expect(ecosystem.coaches.length).toBeGreaterThan(0);
      expect(ecosystem.athletes.length).toBeGreaterThan(0);
    });
  });
});