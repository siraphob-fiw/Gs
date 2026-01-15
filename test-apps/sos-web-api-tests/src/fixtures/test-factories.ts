/**
 * App-specific test data factories for sos-web-api
 * These factories create test data that matches the production application's data models
 */
import { 
  MockFactory, 
  BaseMockFactory, 
  TestDataBuilder,
  MockFactoryUtils
} from '@strengthos/shared-testing';

// Import production types from the sos-web-api application
// TODO: Replace with actual imports from @strengthos/sos-web-api once types are properly exported
// For now, using local interfaces that match the expected production structure

interface User {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ATHLETE' | 'COACH' | 'TENANT_ADMIN' | 'SUPER_ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  emailVerifiedAt?: Date;
}

interface Tenant {
  id: string;
  name: string;
  domain?: string;
  status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'CANCELLED';
  settings: {
    allowSelfCoached: boolean;
    requireCoachApproval: boolean;
    enableVideoAnalysis: boolean;
    enableAIFeedback: boolean;
    defaultLanguage: string;
    availableLanguages: string[];
    maxCoaches: number;
    maxAthletes: number;
    features: Array<{ name: string; enabled: boolean }>;
  };
  createdAt: Date;
  updatedAt: Date;
  suspendedAt?: Date;
}

interface Program {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  coachId: string;
  athleteIds: string[];
  isActive: boolean;
  isTemplate: boolean;
  tags: string[];
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  estimatedDuration: number; // in weeks
  createdAt: Date;
  updatedAt: Date;
}

interface Session {
  id: string;
  tenantId: string;
  programId: string;
  athleteId: string;
  scheduledAt: Date;
  completedAt?: Date;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'MISSED';
  notes?: string;
  rpe?: number; // Rate of Perceived Exertion (1-10)
  duration?: number; // in minutes
  exercises: Array<{
    id: string;
    name: string;
    sets: Array<{
      reps: number;
      weight: number;
      rpe?: number;
      completed: boolean;
    }>;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User factory for creating test users with realistic data
 */
export class UserTestFactory extends BaseMockFactory<User> {
  private static readonly FIRST_NAMES = [
    'Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Avery', 'Quinn',
    'Blake', 'Cameron', 'Drew', 'Emery', 'Finley', 'Harper', 'Hayden', 'Jamie'
  ];

  private static readonly LAST_NAMES = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas'
  ];

  create(overrides?: Partial<User>): User {
    const sequence = this.nextSequence();
    const firstName = this.getRandomChoice(UserTestFactory.FIRST_NAMES);
    const lastName = this.getRandomChoice(UserTestFactory.LAST_NAMES);
    const timestamp = new Date();
    
    const defaults: User = {
      id: `user-${sequence}`,
      tenantId: this.getCached('defaultTenantId') || 'default-tenant',
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${sequence}@example.com`,
      firstName,
      lastName,
      role: 'ATHLETE',
      status: 'ACTIVE',
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
      emailVerifiedAt: timestamp
    };

    return this.mergeOverrides(defaults, overrides);
  }

  /**
   * Create a user with coach role
   */
  createCoach(overrides?: Partial<User>): User {
    return this.create({
      role: 'COACH',
      firstName: 'Coach',
      ...overrides
    });
  }

  /**
   * Create a user with admin role
   */
  createAdmin(overrides?: Partial<User>): User {
    return this.create({
      role: 'TENANT_ADMIN',
      firstName: 'Admin',
      ...overrides
    });
  }

  /**
   * Create a super admin user
   */
  createSuperAdmin(overrides?: Partial<User>): User {
    return this.create({
      role: 'SUPER_ADMIN',
      firstName: 'SuperAdmin',
      tenantId: 'system', // Super admins belong to system tenant
      ...overrides
    });
  }

  /**
   * Create an inactive user
   */
  createInactiveUser(overrides?: Partial<User>): User {
    return this.create({
      status: 'INACTIVE',
      isActive: false,
      emailVerifiedAt: undefined,
      ...overrides
    });
  }

  /**
   * Create a suspended user
   */
  createSuspendedUser(overrides?: Partial<User>): User {
    return this.create({
      status: 'SUSPENDED',
      isActive: false,
      ...overrides
    });
  }

  /**
   * Create a user with recent login
   */
  createRecentlyActiveUser(overrides?: Partial<User>): User {
    const recentDate = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Within last 7 days
    return this.create({
      lastLoginAt: recentDate,
      ...overrides
    });
  }

  /**
   * Create a batch of users for a specific tenant
   */
  createTenantUsers(tenantId: string, counts: {
    coaches?: number;
    athletes?: number;
    admins?: number;
  } = {}): {
    coaches: User[];
    athletes: User[];
    admins: User[];
  } {
    const { coaches = 2, athletes = 10, admins = 1 } = counts;

    return {
      coaches: this.createMany(coaches, { tenantId, role: 'COACH' }),
      athletes: this.createMany(athletes, { tenantId, role: 'ATHLETE' }),
      admins: this.createMany(admins, { tenantId, role: 'TENANT_ADMIN' })
    };
  }

  private getRandomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
}

/**
 * Tenant factory for creating test tenants with realistic configurations
 */
export class TenantTestFactory extends BaseMockFactory<Tenant> {
  private static readonly COMPANY_NAMES = [
    'Elite Fitness Center', 'PowerHouse Gym', 'Strength Academy', 'Iron Temple',
    'Fitness First', 'Gold\'s Gym', 'CrossFit Box', 'Athletic Performance Center',
    'Muscle Factory', 'Training Ground', 'Fitness Hub', 'Performance Lab'
  ];

  create(overrides?: Partial<Tenant>): Tenant {
    const sequence = this.nextSequence();
    const companyName = this.getRandomChoice(TenantTestFactory.COMPANY_NAMES);
    const timestamp = new Date();
    
    const defaults: Tenant = {
      id: `tenant-${sequence}`,
      name: `${companyName} ${sequence}`,
      domain: `${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}${sequence}.strengthos.com`,
      status: 'ACTIVE',
      settings: {
        allowSelfCoached: true,
        requireCoachApproval: false,
        enableVideoAnalysis: true,
        enableAIFeedback: true,
        defaultLanguage: 'en',
        availableLanguages: ['en'],
        maxCoaches: 10,
        maxAthletes: 100,
        features: [
          { name: 'USER_MANAGEMENT', enabled: true },
          { name: 'PROGRAM_CREATION', enabled: true },
          { name: 'SESSION_TRACKING', enabled: true },
          { name: 'PROGRESS_ANALYTICS', enabled: true },
          { name: 'VIDEO_ANALYSIS', enabled: true }
        ]
      },
      createdAt: timestamp,
      updatedAt: timestamp
    };

    return this.mergeOverrides(defaults, overrides);
  }

  /**
   * Create a trial tenant with limited features
   */
  createTrialTenant(overrides?: Partial<Tenant>): Tenant {
    return this.create({
      status: 'TRIAL',
      settings: {
        allowSelfCoached: true,
        requireCoachApproval: false,
        enableVideoAnalysis: false,
        enableAIFeedback: false,
        defaultLanguage: 'en',
        availableLanguages: ['en'],
        maxCoaches: 2,
        maxAthletes: 10,
        features: [
          { name: 'USER_MANAGEMENT', enabled: true },
          { name: 'PROGRAM_CREATION', enabled: true },
          { name: 'SESSION_TRACKING', enabled: true },
          { name: 'PROGRESS_ANALYTICS', enabled: false },
          { name: 'VIDEO_ANALYSIS', enabled: false }
        ]
      },
      ...overrides
    });
  }

  /**
   * Create a suspended tenant
   */
  createSuspendedTenant(overrides?: Partial<Tenant>): Tenant {
    const suspendedAt = new Date();
    return this.create({
      status: 'SUSPENDED',
      suspendedAt,
      ...overrides
    });
  }

  /**
   * Create an enterprise tenant with premium features
   */
  createEnterpriseTenant(overrides?: Partial<Tenant>): Tenant {
    return this.create({
      settings: {
        allowSelfCoached: true,
        requireCoachApproval: true,
        enableVideoAnalysis: true,
        enableAIFeedback: true,
        defaultLanguage: 'en',
        availableLanguages: ['en', 'es', 'fr', 'de'],
        maxCoaches: 50,
        maxAthletes: 500,
        features: [
          { name: 'USER_MANAGEMENT', enabled: true },
          { name: 'PROGRAM_CREATION', enabled: true },
          { name: 'SESSION_TRACKING', enabled: true },
          { name: 'PROGRESS_ANALYTICS', enabled: true },
          { name: 'VIDEO_ANALYSIS', enabled: true },
          { name: 'ADVANCED_ANALYTICS', enabled: true },
          { name: 'CUSTOM_INTEGRATIONS', enabled: true },
          { name: 'WHITE_LABEL', enabled: true },
          { name: 'API_ACCESS', enabled: true }
        ]
      },
      ...overrides
    });
  }

  /**
   * Create a cancelled tenant
   */
  createCancelledTenant(overrides?: Partial<Tenant>): Tenant {
    return this.create({
      status: 'CANCELLED',
      ...overrides
    });
  }

  /**
   * Create an international tenant with specific locale settings
   */
  createInternationalTenant(locale: 'th' | 'es' | 'fr' | 'de' = 'th', overrides?: Partial<Tenant>): Tenant {
    const localeSettings = {
      th: {
        defaultLanguage: 'th',
        availableLanguages: ['th', 'en'],
        name: 'Thai Fitness Center'
      },
      es: {
        defaultLanguage: 'es',
        availableLanguages: ['es', 'en'],
        name: 'Centro de Fitness Español'
      },
      fr: {
        defaultLanguage: 'fr',
        availableLanguages: ['fr', 'en'],
        name: 'Centre de Fitness Français'
      },
      de: {
        defaultLanguage: 'de',
        availableLanguages: ['de', 'en'],
        name: 'Deutsches Fitnesszentrum'
      }
    };

    const config = localeSettings[locale];
    
    return this.create({
      name: config.name,
      settings: {
        allowSelfCoached: true,
        requireCoachApproval: false,
        enableVideoAnalysis: true,
        enableAIFeedback: true,
        defaultLanguage: config.defaultLanguage,
        availableLanguages: config.availableLanguages,
        maxCoaches: 10,
        maxAthletes: 100,
        features: [
          { name: 'USER_MANAGEMENT', enabled: true },
          { name: 'PROGRAM_CREATION', enabled: true },
          { name: 'SESSION_TRACKING', enabled: true },
          { name: 'PROGRESS_ANALYTICS', enabled: true },
          { name: 'VIDEO_ANALYSIS', enabled: true }
        ]
      },
      ...overrides
    });
  }

  private getRandomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
}

/**
 * Program factory for creating test training programs
 */
export class ProgramTestFactory extends BaseMockFactory<Program> {
  private static readonly PROGRAM_NAMES = [
    'Beginner Strength Building', 'Powerlifting Prep', 'Olympic Lifting Fundamentals',
    'Bodybuilding Split', 'CrossFit Conditioning', 'Strongman Training',
    'Athletic Performance', 'Rehabilitation Program', 'Weight Loss Circuit',
    'Muscle Building Phase', 'Competition Prep', 'General Fitness'
  ];

  private static readonly PROGRAM_TAGS = [
    'strength', 'hypertrophy', 'powerlifting', 'olympic-lifting', 'crossfit',
    'bodybuilding', 'conditioning', 'rehabilitation', 'weight-loss', 'athletic-performance'
  ];

  create(overrides?: Partial<Program>): Program {
    const sequence = this.nextSequence();
    const programName = this.getRandomChoice(ProgramTestFactory.PROGRAM_NAMES);
    const difficulty = this.getRandomChoice(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const);
    const timestamp = new Date();
    
    const defaults: Program = {
      id: `program-${sequence}`,
      tenantId: this.getCached('defaultTenantId') || 'default-tenant',
      name: `${programName} ${sequence}`,
      description: `A comprehensive ${difficulty.toLowerCase()} level program focusing on ${programName.toLowerCase()}. Designed to help athletes achieve their fitness goals through structured training.`,
      coachId: this.getCached('defaultCoachId') || `coach-${sequence}`,
      athleteIds: [],
      isActive: true,
      isTemplate: false,
      tags: this.getRandomTags(),
      difficulty,
      estimatedDuration: this.getEstimatedDuration(difficulty),
      createdAt: timestamp,
      updatedAt: timestamp
    };

    return this.mergeOverrides(defaults, overrides);
  }

  /**
   * Create an inactive program
   */
  createInactiveProgram(overrides?: Partial<Program>): Program {
    return this.create({
      isActive: false,
      ...overrides
    });
  }

  /**
   * Create a program template
   */
  createTemplate(overrides?: Partial<Program>): Program {
    return this.create({
      isTemplate: true,
      athleteIds: [], // Templates don't have assigned athletes
      ...overrides
    });
  }

  /**
   * Create a beginner program
   */
  createBeginnerProgram(overrides?: Partial<Program>): Program {
    return this.create({
      difficulty: 'BEGINNER',
      estimatedDuration: 8, // 8 weeks
      tags: ['beginner', 'strength', 'fundamentals'],
      name: 'Beginner Strength Foundation',
      description: 'A foundational program designed for beginners to build basic strength and learn proper movement patterns.',
      ...overrides
    });
  }

  /**
   * Create an advanced program
   */
  createAdvancedProgram(overrides?: Partial<Program>): Program {
    return this.create({
      difficulty: 'ADVANCED',
      estimatedDuration: 16, // 16 weeks
      tags: ['advanced', 'competition', 'specialized'],
      name: 'Advanced Competition Prep',
      description: 'An intensive program for advanced athletes preparing for competition or seeking maximum performance gains.',
      ...overrides
    });
  }

  /**
   * Create a program with assigned athletes
   */
  createWithAthletes(athleteIds: string[], overrides?: Partial<Program>): Program {
    return this.create({
      athleteIds,
      ...overrides
    });
  }

  /**
   * Create multiple programs for a coach
   */
  createCoachPrograms(coachId: string, tenantId: string, count: number = 3): Program[] {
    return this.createMany(count, {
      coachId,
      tenantId
    });
  }

  private getRandomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private getRandomTags(): string[] {
    const tagCount = Math.floor(Math.random() * 3) + 1; // 1-3 tags
    const shuffled = [...ProgramTestFactory.PROGRAM_TAGS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, tagCount);
  }

  private getEstimatedDuration(difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'): number {
    const durations = {
      BEGINNER: [6, 8, 10],
      INTERMEDIATE: [8, 12, 16],
      ADVANCED: [12, 16, 20, 24]
    };
    
    return this.getRandomChoice(durations[difficulty]);
  }
}

/**
 * Session factory for creating test training sessions
 */
export class SessionTestFactory extends BaseMockFactory<Session> {
  private static readonly EXERCISE_NAMES = [
    'Squat', 'Bench Press', 'Deadlift', 'Overhead Press', 'Barbell Row',
    'Pull-ups', 'Dips', 'Lunges', 'Romanian Deadlift', 'Incline Press',
    'Lat Pulldown', 'Leg Press', 'Shoulder Press', 'Bicep Curls', 'Tricep Extensions'
  ];

  create(overrides?: Partial<Session>): Session {
    const sequence = this.nextSequence();
    const scheduledAt = this.getRandomScheduledTime();
    const timestamp = new Date();
    
    const defaults: Session = {
      id: `session-${sequence}`,
      tenantId: this.getCached('defaultTenantId') || 'default-tenant',
      programId: this.getCached('defaultProgramId') || `program-${sequence}`,
      athleteId: this.getCached('defaultAthleteId') || `athlete-${sequence}`,
      scheduledAt,
      status: 'SCHEDULED',
      exercises: this.generateExercises(),
      createdAt: timestamp,
      updatedAt: timestamp
    };

    return this.mergeOverrides(defaults, overrides);
  }

  /**
   * Create a completed session with realistic data
   */
  createCompletedSession(overrides?: Partial<Session>): Session {
    const completedAt = new Date();
    const duration = Math.floor(Math.random() * 60) + 45; // 45-105 minutes
    const rpe = Math.floor(Math.random() * 4) + 7; // RPE 7-10
    
    return this.create({
      status: 'COMPLETED',
      completedAt,
      duration,
      rpe,
      notes: 'Great session! Felt strong throughout the workout.',
      exercises: this.generateCompletedExercises(),
      ...overrides
    });
  }

  /**
   * Create an in-progress session
   */
  createInProgressSession(overrides?: Partial<Session>): Session {
    return this.create({
      status: 'IN_PROGRESS',
      exercises: this.generatePartiallyCompletedExercises(),
      ...overrides
    });
  }

  /**
   * Create a cancelled session
   */
  createCancelledSession(overrides?: Partial<Session>): Session {
    return this.create({
      status: 'CANCELLED',
      notes: 'Session cancelled due to scheduling conflict',
      ...overrides
    });
  }

  /**
   * Create a missed session
   */
  createMissedSession(overrides?: Partial<Session>): Session {
    const pastDate = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Up to 7 days ago
    return this.create({
      status: 'MISSED',
      scheduledAt: pastDate,
      notes: 'Athlete did not attend scheduled session',
      ...overrides
    });
  }

  /**
   * Create multiple sessions for a program
   */
  createProgramSessions(
    programId: string, 
    athleteId: string, 
    tenantId: string, 
    count: number = 5
  ): Session[] {
    return this.createMany(count, {
      programId,
      athleteId,
      tenantId
    });
  }

  /**
   * Create a week's worth of sessions
   */
  createWeeklySchedule(
    programId: string,
    athleteId: string,
    tenantId: string,
    startDate: Date = new Date()
  ): Session[] {
    const sessions: Session[] = [];
    const sessionDays = [1, 3, 5]; // Monday, Wednesday, Friday
    
    sessionDays.forEach((dayOffset, index) => {
      const sessionDate = new Date(startDate);
      sessionDate.setDate(startDate.getDate() + dayOffset);
      sessionDate.setHours(10 + index * 2, 0, 0, 0); // 10am, 12pm, 2pm
      
      sessions.push(this.create({
        programId,
        athleteId,
        tenantId,
        scheduledAt: sessionDate
      }));
    });
    
    return sessions;
  }

  private getRandomScheduledTime(): Date {
    const now = new Date();
    const futureDate = new Date(now.getTime() + Math.random() * 14 * 24 * 60 * 60 * 1000); // Up to 14 days in future
    
    // Set to typical workout hours (6am - 10pm)
    const hour = Math.floor(Math.random() * 16) + 6;
    futureDate.setHours(hour, 0, 0, 0);
    
    return futureDate;
  }

  private generateExercises(): Session['exercises'] {
    const exerciseCount = Math.floor(Math.random() * 4) + 3; // 3-6 exercises
    const selectedExercises = this.getRandomExercises(exerciseCount);
    
    return selectedExercises.map((name, index) => ({
      id: `exercise-${index + 1}`,
      name,
      sets: this.generateSets()
    }));
  }

  private generateCompletedExercises(): Session['exercises'] {
    const exercises = this.generateExercises();
    
    return exercises.map(exercise => ({
      ...exercise,
      sets: exercise.sets.map(set => ({
        ...set,
        completed: true,
        rpe: Math.floor(Math.random() * 3) + 7 // RPE 7-9 for completed sets
      }))
    }));
  }

  private generatePartiallyCompletedExercises(): Session['exercises'] {
    const exercises = this.generateExercises();
    
    return exercises.map((exercise, exerciseIndex) => ({
      ...exercise,
      sets: exercise.sets.map((set, setIndex) => ({
        ...set,
        completed: exerciseIndex < 2 || (exerciseIndex === 2 && setIndex < 2), // First 2 exercises complete, 3rd partially
        rpe: exerciseIndex < 2 ? Math.floor(Math.random() * 3) + 7 : undefined
      }))
    }));
  }

  private generateSets(): Session['exercises'][0]['sets'] {
    const setCount = Math.floor(Math.random() * 3) + 3; // 3-5 sets
    const baseReps = Math.floor(Math.random() * 8) + 5; // 5-12 reps
    const baseWeight = Math.floor(Math.random() * 100) + 50; // 50-150 kg
    
    return Array.from({ length: setCount }, (_, index) => ({
      reps: baseReps + Math.floor(Math.random() * 3) - 1, // ±1 rep variation
      weight: baseWeight + (index * 2.5), // Progressive weight increase
      completed: false
    }));
  }

  private getRandomExercises(count: number): string[] {
    const shuffled = [...SessionTestFactory.EXERCISE_NAMES].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
}

/**
 * Composite factory for creating related test data with proper relationships
 */
export class SosWebApiTestDataBuilder extends TestDataBuilder {
  private userFactory = new UserTestFactory();
  private tenantFactory = new TenantTestFactory();
  private programFactory = new ProgramTestFactory();
  private sessionFactory = new SessionTestFactory();

  constructor() {
    super();
    this.registerFactory('user', this.userFactory);
    this.registerFactory('tenant', this.tenantFactory);
    this.registerFactory('program', this.programFactory);
    this.registerFactory('session', this.sessionFactory);
  }

  /**
   * Create a complete tenant ecosystem with users, programs, and sessions
   */
  createTenantEcosystem(options: {
    tenantOverrides?: Partial<Tenant>;
    coachCount?: number;
    athleteCount?: number;
    adminCount?: number;
    programsPerCoach?: number;
    sessionsPerProgram?: number;
  } = {}): {
    tenant: Tenant;
    coaches: User[];
    athletes: User[];
    admins: User[];
    programs: Program[];
    sessions: Session[];
  } {
    const {
      tenantOverrides = {},
      coachCount = 2,
      athleteCount = 8,
      adminCount = 1,
      programsPerCoach = 2,
      sessionsPerProgram = 3
    } = options;

    // Create tenant
    const tenant = this.tenantFactory.create(tenantOverrides);
    
    // Set tenant context for other factories
    this.userFactory.setCached('defaultTenantId', tenant.id);
    this.programFactory.setCached('defaultTenantId', tenant.id);
    this.sessionFactory.setCached('defaultTenantId', tenant.id);

    // Create users with proper roles
    const { coaches, athletes, admins } = this.userFactory.createTenantUsers(tenant.id, {
      coaches: coachCount,
      athletes: athleteCount,
      admins: adminCount
    });

    // Create programs for each coach
    const programs: Program[] = [];
    coaches.forEach(coach => {
      this.programFactory.setCached('defaultCoachId', coach.id);
      const coachPrograms = this.programFactory.createCoachPrograms(
        coach.id, 
        tenant.id, 
        programsPerCoach
      );
      
      // Assign athletes to programs
      coachPrograms.forEach((program, index) => {
        const assignedAthletes = athletes.slice(
          index * Math.floor(athletes.length / programsPerCoach),
          (index + 1) * Math.floor(athletes.length / programsPerCoach)
        );
        program.athleteIds = assignedAthletes.map(a => a.id);
      });
      
      programs.push(...coachPrograms);
    });

    // Create sessions for each program
    const sessions: Session[] = [];
    programs.forEach(program => {
      program.athleteIds.forEach(athleteId => {
        this.sessionFactory.setCached('defaultProgramId', program.id);
        this.sessionFactory.setCached('defaultAthleteId', athleteId);
        
        const programSessions = this.sessionFactory.createProgramSessions(
          program.id,
          athleteId,
          tenant.id,
          sessionsPerProgram
        );
        sessions.push(...programSessions);
      });
    });

    return { tenant, coaches, athletes, admins, programs, sessions };
  }

  /**
   * Create a realistic training scenario for testing
   */
  createTrainingScenario(scenarioType: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'): {
    tenant: Tenant;
    coach: User;
    athletes: User[];
    program: Program;
    sessions: Session[];
  } {
    const scenarioConfigs = {
      beginner: {
        athleteCount: 3,
        sessionCount: 4,
        tenantType: 'trial' as const
      },
      intermediate: {
        athleteCount: 6,
        sessionCount: 8,
        tenantType: 'active' as const
      },
      advanced: {
        athleteCount: 10,
        sessionCount: 12,
        tenantType: 'enterprise' as const
      }
    };

    const config = scenarioConfigs[scenarioType];
    
    // Create tenant based on scenario
    const tenant = config.tenantType === 'trial' 
      ? this.tenantFactory.createTrialTenant()
      : config.tenantType === 'enterprise'
      ? this.tenantFactory.createEnterpriseTenant()
      : this.tenantFactory.create();

    // Create coach and athletes
    const coach = this.userFactory.createCoach({ tenantId: tenant.id });
    const athletes = this.userFactory.createMany(config.athleteCount, { 
      tenantId: tenant.id, 
      role: 'ATHLETE' 
    });

    // Create program appropriate for scenario
    const program = scenarioType === 'beginner'
      ? this.programFactory.createBeginnerProgram({
          tenantId: tenant.id,
          coachId: coach.id,
          athleteIds: athletes.map(a => a.id)
        })
      : scenarioType === 'advanced'
      ? this.programFactory.createAdvancedProgram({
          tenantId: tenant.id,
          coachId: coach.id,
          athleteIds: athletes.map(a => a.id)
        })
      : this.programFactory.create({
          tenantId: tenant.id,
          coachId: coach.id,
          athleteIds: athletes.map(a => a.id),
          difficulty: 'INTERMEDIATE'
        });

    // Create sessions with varied completion states
    const sessions: Session[] = [];
    athletes.forEach(athlete => {
      const athleteSessions = this.sessionFactory.createMany(config.sessionCount, {
        tenantId: tenant.id,
        programId: program.id,
        athleteId: athlete.id
      });

      // Mix session statuses for realism
      athleteSessions.forEach((session, index) => {
        if (index < Math.floor(athleteSessions.length * 0.6)) {
          // 60% completed
          Object.assign(session, this.sessionFactory.createCompletedSession());
        } else if (index < Math.floor(athleteSessions.length * 0.8)) {
          // 20% scheduled
          session.status = 'SCHEDULED';
        } else if (index < Math.floor(athleteSessions.length * 0.9)) {
          // 10% in progress
          Object.assign(session, this.sessionFactory.createInProgressSession());
        } else {
          // 10% missed
          Object.assign(session, this.sessionFactory.createMissedSession());
        }
      });

      sessions.push(...athleteSessions);
    });

    return { tenant, coach, athletes, program, sessions };
  }

  /**
   * Create test data for multi-tenant scenarios
   */
  createMultiTenantScenario(tenantCount: number = 3): {
    tenants: Tenant[];
    allUsers: User[];
    allPrograms: Program[];
    allSessions: Session[];
  } {
    const tenants: Tenant[] = [];
    const allUsers: User[] = [];
    const allPrograms: Program[] = [];
    const allSessions: Session[] = [];

    for (let i = 0; i < tenantCount; i++) {
      const ecosystem = this.createTenantEcosystem({
        coachCount: Math.floor(Math.random() * 3) + 1, // 1-3 coaches
        athleteCount: Math.floor(Math.random() * 10) + 5, // 5-14 athletes
        programsPerCoach: Math.floor(Math.random() * 2) + 1, // 1-2 programs per coach
        sessionsPerProgram: Math.floor(Math.random() * 5) + 3 // 3-7 sessions per program
      });

      tenants.push(ecosystem.tenant);
      allUsers.push(...ecosystem.coaches, ...ecosystem.athletes, ...ecosystem.admins);
      allPrograms.push(...ecosystem.programs);
      allSessions.push(...ecosystem.sessions);
    }

    return { tenants, allUsers, allPrograms, allSessions };
  }

  /**
   * Create a performance testing dataset
   */
  createPerformanceTestData(scale: 'small' | 'medium' | 'large' = 'medium'): {
    tenant: Tenant;
    users: User[];
    programs: Program[];
    sessions: Session[];
  } {
    const scales = {
      small: { users: 50, programs: 20, sessions: 200 },
      medium: { users: 500, programs: 200, sessions: 2000 },
      large: { users: 5000, programs: 2000, sessions: 20000 }
    };

    const config = scales[scale];
    const tenant = this.tenantFactory.createEnterpriseTenant();

    // Create users with realistic role distribution
    const coachCount = Math.floor(config.users * 0.1); // 10% coaches
    const adminCount = Math.floor(config.users * 0.02); // 2% admins
    const athleteCount = config.users - coachCount - adminCount;

    const { coaches, athletes, admins } = this.userFactory.createTenantUsers(tenant.id, {
      coaches: coachCount,
      athletes: athleteCount,
      admins: adminCount
    });

    // Create programs
    const programs = this.programFactory.createMany(config.programs, {
      tenantId: tenant.id
    });

    // Assign coaches to programs
    programs.forEach((program, index) => {
      program.coachId = coaches[index % coaches.length].id;
      
      // Assign athletes to programs (each athlete can be in multiple programs)
      const athletesPerProgram = Math.floor(athletes.length / programs.length) + 1;
      const startIndex = (index * athletesPerProgram) % athletes.length;
      program.athleteIds = athletes
        .slice(startIndex, startIndex + athletesPerProgram)
        .map(a => a.id);
    });

    // Create sessions
    const sessions = this.sessionFactory.createMany(config.sessions, {
      tenantId: tenant.id
    });

    // Assign sessions to programs and athletes
    sessions.forEach((session, index) => {
      const program = programs[index % programs.length];
      session.programId = program.id;
      session.athleteId = program.athleteIds[index % program.athleteIds.length];
    });

    return {
      tenant,
      users: [...coaches, ...athletes, ...admins],
      programs,
      sessions
    };
  }

  /**
   * Reset all factories and clear cached values
   */
  resetAll(): void {
    super.resetAll();
    this.userFactory.reset();
    this.tenantFactory.reset();
    this.programFactory.reset();
    this.sessionFactory.reset();
  }
}

// Export factory instances for convenience
export const userTestFactory = new UserTestFactory();
export const tenantTestFactory = new TenantTestFactory();
export const programTestFactory = new ProgramTestFactory();
export const sessionTestFactory = new SessionTestFactory();
export const sosWebApiTestDataBuilder = new SosWebApiTestDataBuilder();