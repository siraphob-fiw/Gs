# Design Document

## Overview

The Intelligent Program Generation system is a sophisticated AI-ready component of the StrengthOS platform that automates the creation of personalized training programs. The system integrates multiple data sources including performance history, health metrics, injury status, and equipment availability to generate optimal training plans for powerlifters, weightlifters, and general strength athletes.

The design follows a microservices architecture within the existing monorepo structure, leveraging shared libraries for consistency and maintainability. The system supports multi-tenant SaaS requirements with role-based access control, real-time adaptations, and comprehensive audit logging.

## Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "Client Applications"
        UP[User Portal]
        AP[Admin Portal]
        MA[Mobile App]
    end

    subgraph "API Gateway"
        AG[API Gateway/Router]
    end

    subgraph "Core Services"
        PGS[Program Generation Service]
        AAS[Adaptation Service]
        TMS[Template Management Service]
        HIS[Health Integration Service]
        CPS[Competition Planning Service]
    end

    subgraph "Shared Libraries"
        ST[@strengthos/shared-types]
        SV[@strengthos/shared-validation]
        SA[@strengthos/shared-auth]
        SU[@strengthos/shared-utils]
    end

    subgraph "Data Layer"
        PDB[(Primary Database)]
        RDB[(Redis Cache)]
        S3[(S3 Storage)]
    end

    subgraph "External Integrations"
        WD[Wearable APIs]
        AI[AI/ML Services]
        NS[Notification Service]
    end

    UP --> AG
    AP --> AG
    MA --> AG

    AG --> PGS
    AG --> AAS
    AG --> TMS
    AG --> HIS
    AG --> CPS

    PGS --> ST
    PGS --> SV
    PGS --> SA
    PGS --> SU

    PGS --> PDB
    PGS --> RDB

    HIS --> WD
    PGS --> AI
    AAS --> NS
```

### Service Architecture

The intelligent program generation system consists of five core services:

1. **Program Generation Service**: Core logic for creating training programs
2. **Adaptation Service**: Real-time program adjustments based on feedback
3. **Template Management Service**: Manages predefined program templates
4. **Health Integration Service**: Processes health metrics and injury data
5. **Competition Planning Service**: Handles meet preparation and periodization

## Components and Interfaces

### Program Generation Service

**Responsibilities:**

- Generate personalized training programs based on athlete data
- Apply discipline-specific methodologies (powerlifting, weightlifting, general strength)
- Create modular training blocks (training/pivot/peaking/tapering)
- Calculate appropriate loads, volumes, and progressions

**Key Interfaces:**

```typescript
interface ProgramGenerationService {
  generateProgram(request: ProgramGenerationRequest): Promise<GeneratedProgram>;
  customizeTemplate(
    templateId: string,
    customizations: TemplateCustomizations,
  ): Promise<CustomizedProgram>;
  validateProgramConstraints(program: Program, athlete: Athlete): Promise<ValidationResult>;
}

interface ProgramGenerationRequest {
  athleteId: string;
  templateId: string;
  startDate: Date;
  endDate?: Date;
  competitionDate?: Date;
  customizations?: TemplateCustomizations;
  constraints: ProgramConstraints;
}

interface ProgramConstraints {
  availableEquipment: Equipment[];
  injuryRestrictions: InjuryRestriction[];
  timeConstraints: TimeConstraint[];
  experienceLevel: ExperienceLevel;
  genderSpecificModifications: boolean;
  disabilityAccommodations?: DisabilityAccommodation[];
}
```

### Adaptation Service

**Responsibilities:**

- Monitor athlete performance and feedback
- Automatically adjust programs based on RPE, health metrics, and performance data
- Implement deload protocols and recovery strategies
- Generate notifications for coaches and athletes

**Key Interfaces:**

```typescript
interface AdaptationService {
  processPerformanceFeedback(sessionData: SessionData): Promise<AdaptationRecommendation>;
  applyAutomaticAdjustments(athleteId: string, adjustments: ProgramAdjustment[]): Promise<void>;
  calculateSessionStress(session: TrainingSession): Promise<SessionStress>;
  flagConcerningPatterns(athleteId: string): Promise<PerformanceAlert[]>;
}

interface SessionStress {
  central: number;
  peripheral: number;
  total: number;
  fatigueIndex: number;
}

interface AdaptationRecommendation {
  adjustmentType: 'INTENSITY' | 'VOLUME' | 'DELOAD' | 'RECOVERY';
  magnitude: number;
  reasoning: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  requiresApproval: boolean;
}
```

### Template Management Service

**Responsibilities:**

- Manage predefined program templates created by super-admins
- Handle template versioning and approval workflows
- Provide template discovery and filtering capabilities
- Support custom template creation by coaches

**Key Interfaces:**

```typescript
interface TemplateManagementService {
  createTemplate(template: ProgramTemplate): Promise<string>;
  updateTemplate(templateId: string, updates: Partial<ProgramTemplate>): Promise<void>;
  getTemplatesByDiscipline(discipline: Discipline): Promise<ProgramTemplate[]>;
  approveTemplate(templateId: string, approverId: string): Promise<void>;
  searchTemplates(criteria: TemplateSearchCriteria): Promise<ProgramTemplate[]>;
}

interface ProgramTemplate {
  id: string;
  name: string;
  discipline: Discipline;
  createdBy: string;
  approvedBy?: string;
  version: string;
  blocks: TrainingBlock[];
  exerciseSelection: ExerciseSelectionRules;
  progressionRules: ProgressionRules;
  metadata: TemplateMetadata;
}
```

### Health Integration Service

**Responsibilities:**

- Process health metrics from wearables and manual entries
- Determine fatigue status and recovery indicators
- Integrate injury status and restrictions
- Provide health-based program modification recommendations

**Key Interfaces:**

```typescript
interface HealthIntegrationService {
  processHealthMetrics(athleteId: string, metrics: HealthMetrics): Promise<HealthStatus>;
  importWearableData(athleteId: string, source: WearableSource): Promise<void>;
  calculateFatigueStatus(athleteId: string): Promise<FatigueStatus>;
  getInjuryRestrictions(athleteId: string): Promise<InjuryRestriction[]>;
}

interface HealthMetrics {
  date: Date;
  hrv?: number;
  sleepDuration?: number;
  sleepQuality?: number;
  restingHeartRate?: number;
  stepCount?: number;
  stressScore?: number;
  manualEntries?: ManualHealthEntry[];
}

interface FatigueStatus {
  level: 'GREEN' | 'YELLOW' | 'RED';
  score: number;
  indicators: FatigueIndicator[];
  recommendations: string[];
}
```

### Competition Planning Service

**Responsibilities:**

- Manage competition schedules and meet preparation
- Calculate optimal peaking timelines
- Generate competition attempt recommendations
- Handle post-competition analysis

**Key Interfaces:**

```typescript
interface CompetitionPlanningService {
  createCompetitionPlan(competition: Competition, athleteId: string): Promise<CompetitionPlan>;
  calculatePeakingTimeline(competitionDate: Date, currentDate: Date): Promise<PeakingTimeline>;
  generateAttemptRecommendations(
    athleteId: string,
    competitionId: string,
  ): Promise<AttemptRecommendations>;
  analyzeCompetitionPerformance(results: CompetitionResults): Promise<PerformanceAnalysis>;
}

interface CompetitionPlan {
  competitionId: string;
  athleteId: string;
  peakingBlocks: TrainingBlock[];
  taperProtocol: TaperProtocol;
  attemptStrategy: AttemptStrategy;
  timeline: PeakingTimeline;
}
```

## Data Models

### Core Entities

```typescript
// Athlete and User Management
interface Athlete {
  id: string;
  userId: string;
  tenantId: string;
  profile: AthleteProfile;
  preferences: AthletePreferences;
  currentProgram?: string;
  coachId?: string;
  healthMetrics: HealthMetrics[];
  injuries: Injury[];
  competitions: Competition[];
  createdAt: Date;
  updatedAt: Date;
}

interface AthleteProfile {
  discipline: Discipline;
  experienceLevel: ExperienceLevel;
  gender: Gender;
  birthDate: Date;
  bodyWeight: number;
  availableEquipment: Equipment[];
  trainingFrequency: number;
  goals: TrainingGoal[];
  disabilityAccommodations?: DisabilityAccommodation[];
}

// Program and Template Management
interface Program {
  id: string;
  athleteId: string;
  templateId: string;
  name: string;
  startDate: Date;
  endDate?: Date;
  status: ProgramStatus;
  blocks: TrainingBlock[];
  adaptations: ProgramAdaptation[];
  metadata: ProgramMetadata;
  createdAt: Date;
  updatedAt: Date;
}

interface TrainingBlock {
  id: string;
  name: string;
  type: BlockType; // 'TRAINING' | 'PIVOT' | 'PEAKING' | 'TAPERING'
  duration: number; // weeks
  sessions: TrainingSession[];
  objectives: string[];
  progressionRules: ProgressionRules;
}

interface TrainingSession {
  id: string;
  blockId: string;
  dayOfWeek: number;
  exercises: ProgrammedExercise[];
  estimatedDuration: number;
  sessionType: SessionType;
  stressTargets: SessionStress;
}

interface ProgrammedExercise {
  id: string;
  exerciseId: string;
  sets: ExerciseSet[];
  restPeriods: number[];
  notes?: string;
  alternatives?: string[];
  progressionRules: ExerciseProgressionRules;
}

interface ExerciseSet {
  setNumber: number;
  reps: number | RepRange;
  intensity: number | IntensityRange; // %1RM
  rpe?: number | RPERange;
  weight?: number;
  isWarmup: boolean;
  isBackoff: boolean;
}

// Health and Performance Tracking
interface PerformanceData {
  id: string;
  athleteId: string;
  sessionId: string;
  exerciseId: string;
  sets: CompletedSet[];
  sessionRPE: number;
  duration: number;
  notes?: string;
  videoUploads?: string[];
  completedAt: Date;
}

interface CompletedSet {
  setNumber: number;
  reps: number;
  weight: number;
  rpe: number;
  completed: boolean;
  notes?: string;
}

// Injury and Health Management
interface Injury {
  id: string;
  athleteId: string;
  name: string;
  bodyPart: BodyPart;
  severity: InjurySeverity;
  status: InjuryStatus; // 'ACTIVE' | 'RECOVERING' | 'RESOLVED'
  restrictions: ExerciseRestriction[];
  declaredAt: Date;
  resolvedAt?: Date;
  notes?: string;
}

interface ExerciseRestriction {
  exerciseId?: string;
  movementPattern?: MovementPattern;
  restriction: RestrictionType; // 'EXCLUDE' | 'MODIFY' | 'LIMIT_LOAD' | 'LIMIT_ROM'
  parameters?: RestrictionParameters;
}
```

### Shared Type Definitions

```typescript
// Enums and Constants
enum Discipline {
  BODYBUILDING = 'BODYBUILDING',
  SPORTS_SPECIFIC = 'SPORTS_SPECIFIC',
  POWERBUILDING = 'POWERBUILDING', 
}

enum ExperienceLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  ELITE = 'ELITE',
}

enum BlockType {
  TRAINING = 'TRAINING',
  PIVOT = 'PIVOT',
  PEAKING = 'PEAKING',
  TAPERING = 'TAPERING',
}

enum ProgramStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// Utility Types
interface RepRange {
  min: number;
  max: number;
}

interface IntensityRange {
  min: number; // %1RM
  max: number; // %1RM
}

interface RPERange {
  min: number;
  max: number;
}
```

## Error Handling

### Error Classification

The system implements a comprehensive error handling strategy with the following error categories:

1. **Validation Errors**: Invalid input data, constraint violations
2. **Business Logic Errors**: Program generation failures, adaptation conflicts
3. **Integration Errors**: External API failures, wearable data sync issues
4. **System Errors**: Database connectivity, service unavailability

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: Date;
    requestId: string;
  };
}

// Example error codes
enum ErrorCodes {
  INVALID_PROGRAM_CONSTRAINTS = 'INVALID_PROGRAM_CONSTRAINTS',
  TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND',
  INSUFFICIENT_PERFORMANCE_DATA = 'INSUFFICIENT_PERFORMANCE_DATA',
  HEALTH_DATA_SYNC_FAILED = 'HEALTH_DATA_SYNC_FAILED',
  ADAPTATION_CONFLICT = 'ADAPTATION_CONFLICT',
  COMPETITION_DATE_INVALID = 'COMPETITION_DATE_INVALID',
}
```

### Error Recovery Strategies

- **Graceful Degradation**: When health data is unavailable, use conservative defaults
- **Retry Logic**: Implement exponential backoff for external API calls
- **Fallback Templates**: Use basic templates when advanced generation fails
- **Manual Override**: Allow coaches to override system decisions when errors occur

## Testing Strategy

### Unit Testing

- **Service Layer**: Test each service independently with mocked dependencies
- **Business Logic**: Comprehensive testing of program generation algorithms
- **Validation**: Test all input validation and constraint checking
- **Calculations**: Verify load calculations, progression formulas, and stress metrics

### Integration Testing

- **Database Operations**: Test data persistence and retrieval
- **External APIs**: Test wearable integrations with mock services
- **Service Communication**: Test inter-service communication patterns
- **Authentication**: Test role-based access control across services

### End-to-End Testing

- **Program Generation Flow**: Complete program creation from template to deployment
- **Adaptation Workflow**: Test automatic adjustments based on performance feedback
- **Competition Planning**: Test meet preparation and peaking protocols
- **Multi-tenant Scenarios**: Test data isolation and tenant-specific configurations

### Performance Testing

- **Load Testing**: Test system performance under concurrent program generation requests
- **Stress Testing**: Test system behavior with large datasets and complex programs
- **Memory Usage**: Monitor memory consumption during intensive calculations
- **Database Performance**: Test query performance with large athlete datasets

### Test Data Management

```typescript
// Shared test utilities
interface TestDataFactory {
  createAthlete(overrides?: Partial<Athlete>): Athlete;
  createProgram(overrides?: Partial<Program>): Program;
  createTemplate(discipline: Discipline): ProgramTemplate;
  createPerformanceData(athleteId: string): PerformanceData[];
  createHealthMetrics(athleteId: string): HealthMetrics[];
}

// Mock services for testing
interface MockWearableService {
  simulateHealthData(athleteId: string, days: number): HealthMetrics[];
  simulateDataSyncFailure(): void;
}
```

### Continuous Integration

- **Automated Testing**: Run full test suite on every commit
- **Code Coverage**: Maintain minimum 80% code coverage
- **Type Checking**: Ensure TypeScript compilation without errors
- **Linting**: Enforce code style and quality standards
- **Security Scanning**: Check for vulnerabilities in dependencies

The testing strategy ensures reliability, performance, and maintainability of the intelligent program generation system while supporting the multi-tenant SaaS requirements of the StrengthOS platform.
