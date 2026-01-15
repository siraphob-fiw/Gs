import { TraitableFactory, FactoryOptions } from './base-factory';
import { 
  SessionStatus,
  WeightUnit
} from '@strengthos/shared-types';

export interface SessionFactoryOptions extends FactoryOptions {
  tenantId?: string;
  userId?: string;
  programId?: string;
  coachId?: string;
  name?: string;
  status?: SessionStatus;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  notes?: string;
  rpe?: number;
  bodyWeight?: number;
  weightUnit?: WeightUnit;
}

// Simple Session interface for testing
export interface TestSession {
  id: string;
  tenantId: string;
  userId: string;
  programId?: string;
  coachId?: string;
  name: string;
  status: SessionStatus;
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  notes: string;
  rpe?: number;
  bodyWeight?: number;
  weightUnit: WeightUnit;
  exercises: any[];
  metrics: {
    totalVolume: number;
    averageIntensity: number;
    totalReps: number;
    totalSets: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export class SessionFactory extends TraitableFactory<TestSession> {
  protected static defaultOptions: Partial<SessionFactoryOptions> = {
    status: SessionStatus.PLANNED,
    duration: 60,
    rpe: 7,
    bodyWeight: 70,
    weightUnit: WeightUnit.KG,
  };

  constructor() {
    super();
    this.registerTraits();
  }

  create(options: SessionFactoryOptions = {}): TestSession {
    const opts = this.mergeOptions(options, SessionFactory.defaultOptions) as SessionFactoryOptions;
    const sessionId = this.generateId();
    const timestamp = this.generateTimestamp();

    return {
      id: sessionId,
      tenantId: opts.tenantId || this.generateId(),
      userId: opts.userId || this.generateId(),
      programId: opts.programId,
      coachId: opts.coachId,
      name: opts.name || `Training Session ${sessionId.slice(0, 8)}`,
      status: opts.status!,
      scheduledAt: opts.scheduledAt || timestamp,
      startedAt: opts.startedAt,
      completedAt: opts.completedAt,
      duration: opts.duration,
      notes: opts.notes || '',
      rpe: opts.rpe,
      bodyWeight: opts.bodyWeight,
      weightUnit: opts.weightUnit!,
      exercises: [],
      metrics: {
        totalVolume: 0,
        averageIntensity: 0,
        totalReps: 0,
        totalSets: 0,
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  // Convenience methods for different session states
  createScheduled(options: SessionFactoryOptions = {}): TestSession {
    return this.create({
      ...options,
      status: SessionStatus.PLANNED,
      scheduledAt: this.generateFutureTimestamp(7),
    });
  }

  createInProgress(options: SessionFactoryOptions = {}): TestSession {
    const startTime = this.generatePastTimestamp(1);
    return this.create({
      ...options,
      status: SessionStatus.IN_PROGRESS,
      scheduledAt: startTime,
      startedAt: startTime,
    });
  }

  createCompleted(options: SessionFactoryOptions = {}): TestSession {
    const scheduledTime = this.generatePastTimestamp(7);
    const startTime = new Date(scheduledTime.getTime() + 5 * 60 * 1000); // 5 min after scheduled
    const endTime = new Date(startTime.getTime() + (options.duration || 60) * 60 * 1000);

    return this.create({
      ...options,
      status: SessionStatus.COMPLETED,
      scheduledAt: scheduledTime,
      startedAt: startTime,
      completedAt: endTime,
      duration: Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60)),
    });
  }

  createSkipped(options: SessionFactoryOptions = {}): TestSession {
    return this.create({
      ...options,
      status: SessionStatus.SKIPPED,
      scheduledAt: this.generatePastTimestamp(3),
      notes: 'Session skipped due to scheduling conflict',
    });
  }

  // Create session with exercises
  createWithExercises(exerciseCount: number = 3, options: SessionFactoryOptions = {}): TestSession {
    const session = this.create(options);
    
    // Add mock exercises
    for (let i = 0; i < exerciseCount; i++) {
      session.exercises.push({
        id: this.generateId(),
        sessionId: session.id,
        exerciseId: this.generateId(),
        name: `Exercise ${i + 1}`,
        order: i + 1,
        sets: [
          {
            id: this.generateId(),
            setNumber: 1,
            reps: 10,
            weight: 100,
            rpe: 7,
            completed: true,
          },
          {
            id: this.generateId(),
            setNumber: 2,
            reps: 10,
            weight: 100,
            rpe: 7,
            completed: true,
          },
          {
            id: this.generateId(),
            setNumber: 3,
            reps: 8,
            weight: 105,
            rpe: 8,
            completed: true,
          },
        ],
        notes: '',
        restTime: 180,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      });
    }

    // Update session metrics
    session.metrics = {
      totalVolume: session.exercises.reduce((total, ex) => 
        total + ex.sets.reduce((setTotal: number, set: any) => setTotal + (set.reps * set.weight), 0), 0),
      averageIntensity: 7.5,
      totalReps: session.exercises.reduce((total, ex) => 
        total + ex.sets.reduce((setTotal: number, set: any) => setTotal + set.reps, 0), 0),
      totalSets: session.exercises.reduce((total, ex) => total + ex.sets.length, 0),
    };

    return session;
  }

  // Create training week
  createTrainingWeek(userId: string, startDate: Date = new Date()): TestSession[] {
    const sessions: TestSession[] = [];
    const sessionDays = [1, 3, 5]; // Monday, Wednesday, Friday

    sessionDays.forEach((dayOffset, index) => {
      const sessionDate = new Date(startDate);
      // Add the day offset to get different days
      sessionDate.setDate(sessionDate.getDate() + dayOffset);

      sessions.push(this.createCompleted({
        userId,
        name: `Training Session ${index + 1}`,
        scheduledAt: sessionDate,
        type: 'STRENGTH',
      }));
    });

    return sessions;
  }

  private registerTraits(): void {
    // High intensity trait
    this.registerTrait({
      name: 'highIntensity',
      apply: (session: TestSession) => {
        session.rpe = this.randomInt(8, 10);
        session.notes = 'High intensity training session';
        return session;
      }
    });

    // Recovery trait
    this.registerTrait({
      name: 'recovery',
      apply: (session: TestSession) => {
        session.rpe = this.randomInt(3, 5);
        session.duration = 30;
        session.notes = 'Light recovery session';
        return session;
      }
    });

    // Long session trait
    this.registerTrait({
      name: 'long',
      apply: (session: TestSession) => {
        session.duration = this.randomInt(90, 120);
        session.notes = 'Extended training session';
        return session;
      }
    });

    // Perfect execution trait
    this.registerTrait({
      name: 'perfect',
      apply: (session: TestSession) => {
        session.status = SessionStatus.COMPLETED;
        session.rpe = 8;
        session.notes = 'Perfect execution, all targets hit';
        return session;
      }
    });
  }
}

// Export singleton instance
export const sessionFactory = new SessionFactory();