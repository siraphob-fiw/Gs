import { TraitableFactory, FactoryOptions } from './base-factory';
import { 
  UserRole, 
  UserStatus, 
  Gender, 
  ExperienceLevel, 
  WeightUnit
} from '@strengthos/shared-types';

// Import the complete User interface from user-management
import type { User } from '@strengthos/shared-types';

export interface UserFactoryOptions extends FactoryOptions {
  tenantId?: string;
  role?: UserRole;
  status?: UserStatus;
  email?: string;
  firstName?: string;
  lastName?: string;
  gender?: Gender;
  experienceLevel?: ExperienceLevel;
  bodyWeight?: number;
  height?: number;
  dateOfBirth?: Date;
  disciplines?: string[];
  goals?: string[];
  language?: string;
  weightUnit?: WeightUnit;
  emailVerified?: boolean;
  lastLoginAt?: Date;
}

// Use the actual User interface from shared-types
export type TestUser = User;

export class UserFactory extends TraitableFactory<TestUser> {
  protected static defaultOptions: Partial<UserFactoryOptions> = {
    role: UserRole.ATHLETE,
    status: UserStatus.ACTIVE,
    gender: Gender.MALE,
    experienceLevel: ExperienceLevel.BEGINNER,
    bodyWeight: 70,
    height: 175,
    disciplines: ['POWERLIFTING'],
    goals: ['STRENGTH'],
    language: 'en',
    weightUnit: WeightUnit.KG,
    emailVerified: true,
  };

  constructor() {
    super();
    this.registerTraits();
  }

  create(options: UserFactoryOptions = {}): any {
    const opts = this.mergeOptions(options, UserFactory.defaultOptions) as UserFactoryOptions;
    const userId = this.generateId();
    const timestamp = this.generateTimestamp();
    const name = this.generateRealistic.name();

    // Create extended user object for testing (includes profile and status)
    return {
      id: userId,
      email: opts.email || this.generateRealistic.email(),
      firstName: opts.firstName || name.firstName,
      lastName: opts.lastName || name.lastName,
      role: opts.role!,
      status: opts.status!,
      tenantId: opts.tenantId || this.generateId(),
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
      profile: {
        firstName: opts.firstName || name.firstName,
        lastName: opts.lastName || name.lastName,
        gender: opts.gender,
        experienceLevel: opts.experienceLevel,
        bodyWeight: opts.bodyWeight,
        height: opts.height,
        disciplines: opts.disciplines,
        goals: opts.goals,
        language: opts.language,
        weightUnit: opts.weightUnit,
      }
    };
    
    /* Original complex structure - commented out for base User interface compatibility
    return {
      id: userId,
      tenantId: opts.tenantId || this.generateId(),
      email: opts.email || this.generateRealistic.email(),
      // passwordHash: '$2b$10$mock.hash.for.testing', // Removed - not in base User interface
      role: opts.role!,
      // status: opts.status!, // Removed - not in base User interface
      profile: {
    */
  }

  // Convenience methods for specific roles
  createCoach(options: UserFactoryOptions = {}): TestUser {
    return this.create({
      ...options,
      role: UserRole.COACH,
    });
  }

  createCoachAdmin(options: UserFactoryOptions = {}): TestUser {
    return this.create({
      ...options,
      role: UserRole.COACH_ADMIN,
    });
  }

  createAthlete(options: UserFactoryOptions = {}): TestUser {
    return this.create({
      ...options,
      role: UserRole.ATHLETE,
    });
  }

  createSelfCoached(options: UserFactoryOptions = {}): TestUser {
    return this.create({
      ...options,
      role: UserRole.SELF_COACHED,
    });
  }

  createSuperAdmin(options: UserFactoryOptions = {}): TestUser {
    return this.create({
      ...options,
      role: UserRole.SUPER_ADMIN,
    });
  }

  // Create test cohorts
  createTestCohort(tenantId: string): {
    coachAdmin: TestUser;
    coaches: TestUser[];
    athletes: TestUser[];
    selfCoached: TestUser[];
  } {
    return {
      coachAdmin: this.createCoachAdmin({ 
        tenantId,
        email: 'admin@testcohort.com',
        firstName: 'Admin',
        lastName: 'User',
      }),
      coaches: this.createBatch(3, { 
        tenantId,
        role: UserRole.COACH,
        email: 'coach@testcohort.com',
        firstName: 'Coach',
      }),
      athletes: this.createBatch(10, { 
        tenantId,
        role: UserRole.ATHLETE,
        email: 'athlete@testcohort.com',
        firstName: 'Athlete',
      }),
      selfCoached: this.createBatch(5, { 
        tenantId,
        role: UserRole.SELF_COACHED,
        email: 'selfcoached@testcohort.com',
        firstName: 'SelfCoached',
      }),
    };
  }

  // Create international users
  createInternational(options: UserFactoryOptions = {}): TestUser {
    const languages = ['en', 'th', 'zh', 'es', 'fr', 'de', 'ja'];
    
    const randomLang = this.randomChoice(languages);
    
    return this.create({
      ...options,
      language: randomLang,
      weightUnit: randomLang === 'en' ? WeightUnit.LBS : WeightUnit.KG,
    });
  }

  private registerTraits(): void {
    // Verified trait
    this.registerTrait({
      name: 'verified',
      apply: (user: TestUser) => {
        (user as any).status = UserStatus.ACTIVE;
        (user as any).emailVerifiedAt = new Date();
        return user;
      }
    });

    // Suspended trait
    this.registerTrait({
      name: 'suspended',
      apply: (user: TestUser) => {
        (user as any).status = UserStatus.SUSPENDED;
        return user;
      }
    });

    // Recent login trait
    this.registerTrait({
      name: 'recentLogin',
      apply: (user: TestUser) => {
        (user as any).lastLoginAt = this.generatePastTimestamp(7); // Within last 7 days
        return user;
      }
    });
  }
}

// Export singleton instance
export const userFactory = new UserFactory();