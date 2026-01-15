import { Results } from '@strengthos/shared-utils';
import { userFactory } from '../factories/user-factory';
import { tenantFactory } from '../factories/tenant-factory';
import { programFactory } from '../factories/program-factory';
import { sessionFactory } from '../factories/session-factory';
import { 
  User, 
  Tenant, 
  UserRole,
  TenantStatus,
  PlanStatus
} from '@strengthos/shared-types';
import { TestProgram } from '../factories/program-factory';
import { TestSession } from '../factories/session-factory';

export interface SeederOptions {
  tenantCount?: number;
  usersPerTenant?: number;
  programsPerTenant?: number;
  sessionsPerUser?: number;
  includeTemplates?: boolean;
  includeHistoricalData?: boolean;
}

export interface SeededData {
  tenants: Tenant[];
  users: User[];
  programs: TestProgram[];
  sessions: TestSession[];
  relationships: {
    tenantUsers: Map<string, User[]>;
    tenantPrograms: Map<string, TestProgram[]>;
    userSessions: Map<string, TestSession[]>;
    coachAthletes: Map<string, User[]>;
  };
}

export class TestSeeder {
  private options: SeederOptions;

  constructor(options: SeederOptions = {}) {
    this.options = {
      tenantCount: 3,
      usersPerTenant: 10,
      programsPerTenant: 5,
      sessionsPerUser: 20,
      includeTemplates: true,
      includeHistoricalData: true,
      ...options
    };
  }

  /**
   * Generate a complete test dataset
   */
  async generateTestData(): Promise<Results<SeededData>> {
    try {
      console.log('🌱 Generating test data...');

      const tenants = this.generateTenants();
      const users = this.generateUsers(tenants);
      const programs = this.generatePrograms(tenants, users);
      const sessions = this.generateSessions(users, programs);

      const relationships = this.buildRelationships(tenants, users, programs, sessions);

      const seededData: SeededData = {
        tenants,
        users,
        programs,
        sessions,
        relationships,
      };

      console.log(`✅ Generated test data:
        - ${tenants.length} tenants
        - ${users.length} users
        - ${programs.length} programs
        - ${sessions.length} sessions`);

      return Results.ok(seededData);
    } catch (error) {
      return Results.error(null as any, `Failed to generate test data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate tenants
   */
  private generateTenants(): Tenant[] {
    const tenants: Tenant[] = [];

    for (let i = 0; i < this.options.tenantCount!; i++) {
      const tenant = tenantFactory.create({
        name: `Test Gym ${i + 1}`,
        domain: `testgym${i + 1}.strengthos.com`,
        status: i === 0 ? TenantStatus.ACTIVE : TenantStatus.TRIAL,
      });

      tenants.push(tenant);
    }

    return tenants;
  }

  /**
   * Generate users for each tenant
   */
  private generateUsers(tenants: Tenant[]): User[] {
    const users: User[] = [];

    tenants.forEach((tenant, tenantIndex) => {
      // Create tenant admin
      const admin = userFactory.createCoachAdmin({
        tenantId: tenant.id,
        email: `admin@testgym${tenantIndex + 1}.com`,
        firstName: 'Admin',
        lastName: `User ${tenantIndex + 1}`,
      });
      users.push(admin);

      // Create coaches (20% of users)
      const coachCount = Math.ceil(this.options.usersPerTenant! * 0.2);
      for (let i = 0; i < coachCount; i++) {
        const coach = userFactory.createCoach({
          tenantId: tenant.id,
          email: `coach${i + 1}@testgym${tenantIndex + 1}.com`,
          firstName: `Coach`,
          lastName: `${i + 1}`,
        });
        users.push(coach);
      }

      // Create athletes (60% of users)
      const athleteCount = Math.ceil(this.options.usersPerTenant! * 0.6);
      for (let i = 0; i < athleteCount; i++) {
        const athlete = userFactory.createAthlete({
          tenantId: tenant.id,
          email: `athlete${i + 1}@testgym${tenantIndex + 1}.com`,
          firstName: `Athlete`,
          lastName: `${i + 1}`,
        });
        users.push(athlete);
      }

      // Create self-coached users (20% of users)
      const selfCoachedCount = Math.ceil(this.options.usersPerTenant! * 0.2);
      for (let i = 0; i < selfCoachedCount; i++) {
        const selfCoached = userFactory.createSelfCoached({
          tenantId: tenant.id,
          email: `selfcoached${i + 1}@testgym${tenantIndex + 1}.com`,
          firstName: `SelfCoached`,
          lastName: `${i + 1}`,
        });
        users.push(selfCoached);
      }
    });

    return users;
  }

  /**
   * Generate programs for each tenant
   */
  private generatePrograms(tenants: Tenant[], users: User[]): TestProgram[] {
    const programs: TestProgram[] = [];

    tenants.forEach(tenant => {
      const tenantUsers = users.filter(u => u.tenantId === tenant.id);
      const coaches = tenantUsers.filter(u => u.role === UserRole.COACH || u.role === UserRole.COACH_ADMIN);

      // Create programs by coaches
      for (let i = 0; i < this.options.programsPerTenant!; i++) {
        const coach = coaches[i % coaches.length];
        
        const program = programFactory.create({
          tenantId: tenant.id,
          createdBy: coach.id,
          name: `Training Program ${i + 1}`,
          status: i < 2 ? PlanStatus.ACTIVE : PlanStatus.DRAFT,
        });

        programs.push(program);
      }

      // Create templates if enabled
      if (this.options.includeTemplates) {
        const template = programFactory.createTemplate({
          tenantId: tenant.id,
          createdBy: coaches[0].id,
          name: `${tenant.name} Template`,
        });
        programs.push(template);
      }
    });

    return programs;
  }

  /**
   * Generate sessions for users
   */
  private generateSessions(users: User[], programs: TestProgram[]): TestSession[] {
    const sessions: TestSession[] = [];

    users.forEach(user => {
      if (user.role === UserRole.ATHLETE || user.role === UserRole.SELF_COACHED) {
        const userPrograms = programs.filter(p => p.tenantId === user.tenantId);
        const program = userPrograms[0]; // Assign first available program

        // Generate historical sessions if enabled
        if (this.options.includeHistoricalData) {
          const historicalSessions = this.generateHistoricalSessions(user, program);
          sessions.push(...historicalSessions);
        }

        // Generate recent sessions
        const recentSessions = this.generateRecentSessions(user, program);
        sessions.push(...recentSessions);

        // Generate future sessions
        const futureSessions = this.generateFutureSessions(user, program);
        sessions.push(...futureSessions);
      }
    });

    return sessions;
  }

  /**
   * Generate historical sessions (past 3 months)
   */
  private generateHistoricalSessions(user: User, program?: TestProgram): TestSession[] {
    const sessions: TestSession[] = [];
    const sessionsToGenerate = Math.floor(this.options.sessionsPerUser! * 0.7); // 70% historical

    for (let i = 0; i < sessionsToGenerate; i++) {
      const daysAgo = Math.floor(Math.random() * 90) + 1; // 1-90 days ago
      const sessionDate = new Date();
      sessionDate.setDate(sessionDate.getDate() - daysAgo);

      const session = sessionFactory.createCompleted({
        tenantId: user.tenantId,
        userId: user.id,
        programId: program?.id,
        scheduledAt: sessionDate,
      });

      sessions.push(session);
    }

    return sessions;
  }

  /**
   * Generate recent sessions (past week)
   */
  private generateRecentSessions(user: User, program?: TestProgram): TestSession[] {
    const sessions: TestSession[] = [];
    const sessionsToGenerate = Math.floor(this.options.sessionsPerUser! * 0.2); // 20% recent

    for (let i = 0; i < sessionsToGenerate; i++) {
      const daysAgo = Math.floor(Math.random() * 7) + 1; // 1-7 days ago
      const sessionDate = new Date();
      sessionDate.setDate(sessionDate.getDate() - daysAgo);

      const session = sessionFactory.createCompleted({
        tenantId: user.tenantId,
        userId: user.id,
        programId: program?.id,
        scheduledAt: sessionDate,
      });

      sessions.push(session);
    }

    return sessions;
  }

  /**
   * Generate future sessions (next 2 weeks)
   */
  private generateFutureSessions(user: User, program?: TestProgram): TestSession[] {
    const sessions: TestSession[] = [];
    const sessionsToGenerate = Math.floor(this.options.sessionsPerUser! * 0.1); // 10% future

    for (let i = 0; i < sessionsToGenerate; i++) {
      const daysAhead = Math.floor(Math.random() * 14) + 1; // 1-14 days ahead
      const sessionDate = new Date();
      sessionDate.setDate(sessionDate.getDate() + daysAhead);

      const session = sessionFactory.createScheduled({
        tenantId: user.tenantId,
        userId: user.id,
        programId: program?.id,
        scheduledAt: sessionDate,
      });

      sessions.push(session);
    }

    return sessions;
  }

  /**
   * Build relationship mappings
   */
  private buildRelationships(
    tenants: Tenant[], 
    users: User[], 
    programs: TestProgram[], 
    sessions: TestSession[]
  ): SeededData['relationships'] {
    const tenantUsers = new Map<string, User[]>();
    const tenantPrograms = new Map<string, TestProgram[]>();
    const userSessions = new Map<string, TestSession[]>();
    const coachAthletes = new Map<string, User[]>();

    // Group users by tenant
    tenants.forEach(tenant => {
      tenantUsers.set(tenant.id, users.filter(u => u.tenantId === tenant.id));
    });

    // Group programs by tenant
    tenants.forEach(tenant => {
      tenantPrograms.set(tenant.id, programs.filter(p => p.tenantId === tenant.id));
    });

    // Group sessions by user
    users.forEach(user => {
      userSessions.set(user.id, sessions.filter(s => s.userId === user.id));
    });

    // Build coach-athlete relationships
    users.filter(u => u.role === UserRole.COACH || u.role === UserRole.COACH_ADMIN).forEach(coach => {
      const tenantAthletes = users.filter(u => 
        u.tenantId === coach.tenantId && u.role === UserRole.ATHLETE
      );
      coachAthletes.set(coach.id, tenantAthletes);
    });

    return {
      tenantUsers,
      tenantPrograms,
      userSessions,
      coachAthletes,
    };
  }

  /**
   * Generate minimal test data for quick tests
   */
  async generateMinimalData(): Promise<Results<SeededData>> {
    const minimalOptions: SeederOptions = {
      tenantCount: 1,
      usersPerTenant: 5,
      programsPerTenant: 2,
      sessionsPerUser: 5,
      includeTemplates: false,
      includeHistoricalData: false,
    };

    const originalOptions = this.options;
    this.options = minimalOptions;

    const result = await this.generateTestData();
    this.options = originalOptions;

    return result;
  }

  /**
   * Generate data for specific scenarios
   */
  async generateScenarioData(scenario: 'multi-tenant' | 'single-tenant' | 'coach-heavy' | 'athlete-heavy'): Promise<Results<SeededData>> {
    let scenarioOptions: SeederOptions;

    switch (scenario) {
      case 'multi-tenant':
        scenarioOptions = {
          tenantCount: 5,
          usersPerTenant: 8,
          programsPerTenant: 3,
          sessionsPerUser: 15,
        };
        break;

      case 'single-tenant':
        scenarioOptions = {
          tenantCount: 1,
          usersPerTenant: 20,
          programsPerTenant: 10,
          sessionsPerUser: 30,
        };
        break;

      case 'coach-heavy':
        scenarioOptions = {
          tenantCount: 2,
          usersPerTenant: 15,
          programsPerTenant: 8,
          sessionsPerUser: 10,
        };
        break;

      case 'athlete-heavy':
        scenarioOptions = {
          tenantCount: 2,
          usersPerTenant: 25,
          programsPerTenant: 5,
          sessionsPerUser: 40,
        };
        break;

      default:
        return Results.error(null as any, `Unknown scenario: ${scenario}`);
    }

    const originalOptions = this.options;
    this.options = { ...this.options, ...scenarioOptions };

    const result = await this.generateTestData();
    this.options = originalOptions;

    return result;
  }
}

/**
 * Create a test seeder with default options
 */
export function createTestSeeder(options: SeederOptions = {}): TestSeeder {
  return new TestSeeder(options);
}

/**
 * Quick seeder for common scenarios
 */
export async function seedTestData(scenario: 'minimal' | 'full' | 'multi-tenant' | 'single-tenant' = 'minimal'): Promise<Results<SeededData>> {
  const seeder = createTestSeeder();

  switch (scenario) {
    case 'minimal':
      return await seeder.generateMinimalData();
    case 'full':
      return await seeder.generateTestData();
    default:
      return await seeder.generateScenarioData(scenario as any);
  }
}