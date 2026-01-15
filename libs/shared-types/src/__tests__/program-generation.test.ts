// Basic type tests for program generation types
import {
  BlockType,
  ProgramStatus,
  Athlete,
  Program,
  TrainingBlock,
  ProgramTemplate,
  AdaptationType,
  FatigueLevel,
  CompetitionType,
} from '../program-generation';

import {
  ProgramGenerationRequest,
  ProgramGenerationService,
  TemplateManagementService,
  HealthIntegrationService,
  AdaptationService,
  CompetitionPlanningService,
} from '../program-generation-services';

describe('Program Generation Types', () => {
  it('should have correct enum values', () => {
    expect(BlockType.TRAINING).toBe('TRAINING');
    expect(BlockType.PIVOT).toBe('PIVOT');
    expect(BlockType.PEAKING).toBe('PEAKING');
    expect(BlockType.TAPERING).toBe('TAPERING');

    expect(ProgramStatus.DRAFT).toBe('DRAFT');
    expect(ProgramStatus.ACTIVE).toBe('ACTIVE');
    expect(ProgramStatus.COMPLETED).toBe('COMPLETED');

    expect(AdaptationType.INTENSITY).toBe('INTENSITY');
    expect(AdaptationType.VOLUME).toBe('VOLUME');
    expect(AdaptationType.DELOAD).toBe('DELOAD');

    expect(FatigueLevel.GREEN).toBe('GREEN');
    expect(FatigueLevel.YELLOW).toBe('YELLOW');
    expect(FatigueLevel.RED).toBe('RED');

    expect(CompetitionType.POWERLIFTING).toBe('POWERLIFTING');
    expect(CompetitionType.WEIGHTLIFTING).toBe('WEIGHTLIFTING');
  });

  it('should create valid athlete interface', () => {
    const athlete: Athlete = {
      id: 'athlete-1',
      userId: 'user-1',
      tenantId: 'tenant-1',
      profile: {
        discipline: 'POWERLIFTING',
        experienceLevel: 'INTERMEDIATE',
        gender: 'MALE',
        birthDate: new Date('1990-01-01'),
        bodyWeight: 80,
        availableEquipment: [],
        trainingFrequency: 4,
        goals: ['STRENGTH'],
      },
      preferences: {
        preferredTrainingTimes: [],
        maxSessionDuration: 120,
        restDayPreferences: [0, 6],
        intensityPreference: 'moderate',
        volumePreference: 'moderate',
        exerciseVariety: 'moderate',
        autoAdjustments: true,
        coachApprovalRequired: false,
      },
      healthMetrics: [],
      injuries: [],
      competitions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(athlete.id).toBe('athlete-1');
    expect(athlete.profile.discipline).toBe('POWERLIFTING');
    expect(athlete.preferences.intensityPreference).toBe('moderate');
  });

  it('should create valid program interface', () => {
    const program: Program = {
      id: 'program-1',
      athleteId: 'athlete-1',
      templateId: 'template-1',
      name: 'Test Program',
      startDate: new Date(),
      status: ProgramStatus.ACTIVE,
      blocks: [],
      adaptations: [],
      metadata: {
        generatedBy: 'system',
        generationParameters: {},
        totalAdaptations: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(program.status).toBe(ProgramStatus.ACTIVE);
    expect(program.metadata.generatedBy).toBe('system');
  });

  it('should create valid training block interface', () => {
    const block: TrainingBlock = {
      id: 'block-1',
      name: 'Training Block 1',
      type: BlockType.TRAINING,
      duration: 4,
      sessions: [],
      objectives: ['Build strength base'],
      progressionRules: {
        volumeProgression: {
          type: 'linear',
          startingVolume: 100,
          weeklyIncrease: 5,
          maxVolume: 150,
          deloadFrequency: 4,
        },
        intensityProgression: {
          type: 'linear',
          startingIntensity: 70,
          weeklyIncrease: 2.5,
          maxIntensity: 90,
          testingFrequency: 4,
        },
        frequencyProgression: {
          startingFrequency: 3,
          maxFrequency: 4,
          progressionTrigger: 'time',
        },
        deloadProtocol: {
          trigger: 'scheduled',
          volumeReduction: 40,
          intensityReduction: 10,
          duration: 1,
        },
      },
      volumeTarget: 120,
      intensityTarget: { min: 70, max: 85 },
    };

    expect(block.type).toBe(BlockType.TRAINING);
    expect(block.duration).toBe(4);
    expect(block.progressionRules.volumeProgression.type).toBe('linear');
  });

  it('should create valid program generation request', () => {
    const request: ProgramGenerationRequest = {
      athleteId: 'athlete-1',
      templateId: 'template-1',
      startDate: new Date(),
      constraints: {
        availableEquipment: [],
        injuryRestrictions: [],
        timeConstraints: [],
        experienceLevel: 'INTERMEDIATE',
        genderSpecificModifications: false,
      },
    };

    expect(request.athleteId).toBe('athlete-1');
    expect(request.constraints.experienceLevel).toBe('INTERMEDIATE');
  });
});

// Type-only tests to ensure interfaces are properly defined
describe('Service Interface Types', () => {
  it('should define service interfaces correctly', () => {
    // These are compile-time checks - if they compile, the interfaces are correct
    const programService: ProgramGenerationService = {} as ProgramGenerationService;
    const templateService: TemplateManagementService = {} as TemplateManagementService;
    const healthService: HealthIntegrationService = {} as HealthIntegrationService;
    const adaptationService: AdaptationService = {} as AdaptationService;
    const competitionService: CompetitionPlanningService = {} as CompetitionPlanningService;

    // Check that methods exist (compile-time check)
    expect(typeof programService.generateProgram).toBe('undefined'); // Will be undefined in mock
    expect(typeof templateService.createTemplate).toBe('undefined');
    expect(typeof healthService.processHealthMetrics).toBe('undefined');
    expect(typeof adaptationService.processPerformanceFeedback).toBe('undefined');
    expect(typeof competitionService.createCompetitionPlan).toBe('undefined');
  });
});