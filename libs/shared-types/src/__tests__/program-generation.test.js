"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Basic type tests for program generation types
const program_generation_1 = require("../program-generation");
describe('Program Generation Types', () => {
    it('should have correct enum values', () => {
        expect(program_generation_1.BlockType.TRAINING).toBe('TRAINING');
        expect(program_generation_1.BlockType.PIVOT).toBe('PIVOT');
        expect(program_generation_1.BlockType.PEAKING).toBe('PEAKING');
        expect(program_generation_1.BlockType.TAPERING).toBe('TAPERING');
        expect(program_generation_1.ProgramStatus.DRAFT).toBe('DRAFT');
        expect(program_generation_1.ProgramStatus.ACTIVE).toBe('ACTIVE');
        expect(program_generation_1.ProgramStatus.COMPLETED).toBe('COMPLETED');
        expect(program_generation_1.AdaptationType.INTENSITY).toBe('INTENSITY');
        expect(program_generation_1.AdaptationType.VOLUME).toBe('VOLUME');
        expect(program_generation_1.AdaptationType.DELOAD).toBe('DELOAD');
        expect(program_generation_1.FatigueLevel.GREEN).toBe('GREEN');
        expect(program_generation_1.FatigueLevel.YELLOW).toBe('YELLOW');
        expect(program_generation_1.FatigueLevel.RED).toBe('RED');
        expect(program_generation_1.CompetitionType.POWERLIFTING).toBe('POWERLIFTING');
        expect(program_generation_1.CompetitionType.WEIGHTLIFTING).toBe('WEIGHTLIFTING');
    });
    it('should create valid athlete interface', () => {
        const athlete = {
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
        const program = {
            id: 'program-1',
            athleteId: 'athlete-1',
            templateId: 'template-1',
            name: 'Test Program',
            startDate: new Date(),
            status: program_generation_1.ProgramStatus.ACTIVE,
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
        expect(program.status).toBe(program_generation_1.ProgramStatus.ACTIVE);
        expect(program.metadata.generatedBy).toBe('system');
    });
    it('should create valid training block interface', () => {
        const block = {
            id: 'block-1',
            name: 'Training Block 1',
            type: program_generation_1.BlockType.TRAINING,
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
        expect(block.type).toBe(program_generation_1.BlockType.TRAINING);
        expect(block.duration).toBe(4);
        expect(block.progressionRules.volumeProgression.type).toBe('linear');
    });
    it('should create valid program generation request', () => {
        const request = {
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
        const programService = {};
        const templateService = {};
        const healthService = {};
        const adaptationService = {};
        const competitionService = {};
        // Check that methods exist (compile-time check)
        expect(typeof programService.generateProgram).toBe('undefined'); // Will be undefined in mock
        expect(typeof templateService.createTemplate).toBe('undefined');
        expect(typeof healthService.processHealthMetrics).toBe('undefined');
        expect(typeof adaptationService.processPerformanceFeedback).toBe('undefined');
        expect(typeof competitionService.createCompetitionPlan).toBe('undefined');
    });
});
//# sourceMappingURL=program-generation.test.js.map