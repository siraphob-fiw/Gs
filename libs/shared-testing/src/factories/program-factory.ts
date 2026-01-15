import { TraitableFactory, FactoryOptions } from './base-factory';
import { 
  PlanStatus,
  Discipline,
  TrainingGoal,
  ExperienceLevel,
  WeightUnit
} from '@strengthos/shared-types';

export interface ProgramFactoryOptions extends FactoryOptions {
  tenantId?: string;
  createdBy?: string;
  name?: string;
  description?: string;
  status?: PlanStatus;
  discipline?: Discipline;
  goals?: TrainingGoal[];
  experienceLevel?: ExperienceLevel;
  durationWeeks?: number;
  sessionsPerWeek?: number;
  isTemplate?: boolean;
  isPublic?: boolean;
  tags?: string[];
}

// Simple Program interface for testing
export interface TestProgram {
  id: string;
  tenantId: string;
  createdBy: string;
  name: string;
  description: string;
  status: PlanStatus;
  discipline: Discipline;
  goals: TrainingGoal[];
  experienceLevel: ExperienceLevel;
  durationWeeks: number;
  sessionsPerWeek: number;
  isTemplate: boolean;
  isPublic: boolean;
  tags: string[];
  phases: any[];
  sessions: any[];
  metadata: {
    estimatedDuration: number;
    totalSessions: number;
    averageSessionDuration: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export class ProgramFactory extends TraitableFactory<TestProgram> {
  protected static defaultOptions: Partial<ProgramFactoryOptions> = {
    status: PlanStatus.DRAFT,
    discipline: Discipline.POWERBUILDING,
    goals: [TrainingGoal.STRENGTH],
    experienceLevel: ExperienceLevel.BEGINNER,
    durationWeeks: 12,
    sessionsPerWeek: 3,
    isTemplate: false,
    isPublic: false,
    tags: [],
  };

  constructor() {
    super();
    this.registerTraits();
  }

  create(options: ProgramFactoryOptions = {}): TestProgram {
    const opts = this.mergeOptions(options, ProgramFactory.defaultOptions) as ProgramFactoryOptions;
    const programId = this.generateId();
    const timestamp = this.generateTimestamp();

    return {
      id: programId,
      tenantId: opts.tenantId || this.generateId(),
      createdBy: opts.createdBy || this.generateId(),
      name: opts.name || `Test Program ${programId.slice(0, 8)}`,
      description: opts.description || 'A test program for development and testing',
      status: opts.status!,
      discipline: opts.discipline!,
      goals: opts.goals!,
      experienceLevel: opts.experienceLevel!,
      durationWeeks: opts.durationWeeks!,
      sessionsPerWeek: opts.sessionsPerWeek!,
      isTemplate: opts.isTemplate!,
      isPublic: opts.isPublic!,
      tags: opts.tags!,
      phases: [],
      sessions: [],
      metadata: {
        estimatedDuration: opts.durationWeeks! * 7 * 24 * 60, // minutes
        totalSessions: opts.durationWeeks! * opts.sessionsPerWeek!,
        averageSessionDuration: 60,
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  // Convenience methods for specific program types
  createStrengthProgram(options: ProgramFactoryOptions = {}): TestProgram {
    return this.create({
      ...options,
      discipline: Discipline.POWERBUILDING,
      goals: [TrainingGoal.STRENGTH],
    });
  }

  createHypertrophyProgram(options: ProgramFactoryOptions = {}): TestProgram {
    return this.create({
      ...options,
      goals: [TrainingGoal.MUSCLE_GAIN],
    });
  }

  createEnduranceProgram(options: ProgramFactoryOptions = {}): TestProgram {
    return this.create({
      ...options,
      goals: [TrainingGoal.ENDURANCE],
    });
  }

  createTemplate(options: ProgramFactoryOptions = {}): TestProgram {
    return this.create({
      ...options,
      isTemplate: true,
      status: PlanStatus.ACTIVE,
      isPublic: true,
    });
  }

  // Create program variations
  createBeginnerProgram(options: ProgramFactoryOptions = {}): TestProgram {
    return this.create({
      ...options,
      experienceLevel: ExperienceLevel.BEGINNER,
      durationWeeks: 8,
      sessionsPerWeek: 3,
    });
  }

  createAdvancedProgram(options: ProgramFactoryOptions = {}): TestProgram {
    return this.create({
      ...options,
      experienceLevel: ExperienceLevel.ADVANCED,
      durationWeeks: 16,
      sessionsPerWeek: 5,
    });
  }

  private registerTraits(): void {
    // Published trait
    this.registerTrait({
      name: 'published',
      apply: (program: TestProgram) => {
        program.status = PlanStatus.ACTIVE;
        program.isPublic = true;
        return program;
      }
    });

    // Template trait
    this.registerTrait({
      name: 'template',
      apply: (program: TestProgram) => {
        program.isTemplate = true;
        program.status = PlanStatus.ACTIVE;
        program.isPublic = true;
        return program;
      }
    });

    // Archived trait
    this.registerTrait({
      name: 'archived',
      apply: (program: TestProgram) => {
        program.status = PlanStatus.ARCHIVED;
        return program;
      }
    });

    // Popular trait
    this.registerTrait({
      name: 'popular',
      apply: (program: TestProgram) => {
        program.tags = [...program.tags, 'popular', 'featured'];
        program.isPublic = true;
        return program;
      }
    });
  }
}

// Export singleton instance
export const programFactory = new ProgramFactory();