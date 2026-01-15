import { ExerciseType, MovementPattern, BodyPart, Discipline } from './enums';
export interface Exercise {
    id: string;
    name: string;
    exerciseType: string;
    movementPatterns: MovementPattern[];
    bodyPartFocus: BodyPart[];
    requiredEquipmentId?: string;
    disciplineTags: Discipline[];
    centralStressFactor: number;
    peripheralStressFactor: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface ExerciseWithEquipment extends Exercise {
    requiredEquipment?: any;
}
export interface ExerciseFilters {
    exerciseType?: string;
    movementPatterns?: MovementPattern[];
    bodyPartFocus?: BodyPart[];
    disciplineTags?: Discipline[];
    equipmentId?: string;
    search?: string;
    page?: number;
    limit?: number;
}
export interface ExerciseListResponse {
    exercises: ExerciseWithEquipment[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export interface CreateExerciseRequest {
    name: string;
    exerciseType: string;
    movementPatterns: MovementPattern[];
    bodyPartFocus: BodyPart[];
    requiredEquipmentId?: string;
    disciplineTags: Discipline[];
    centralStressFactor: number;
    peripheralStressFactor: number;
}
export interface UpdateExerciseRequest {
    name?: string;
    exerciseType?: string;
    movementPatterns?: MovementPattern[];
    bodyPartFocus?: BodyPart[];
    requiredEquipmentId?: string;
    disciplineTags?: Discipline[];
    centralStressFactor?: number;
    peripheralStressFactor?: number;
}
export interface ExerciseVariation {
    id: string;
    baseExerciseId: string;
    name: string;
    description: string;
    difficulty: 'easier' | 'same' | 'harder';
    equipmentRequired?: string[];
    instructions: string[];
    videoUrl?: string;
    imageUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface ExerciseProgression {
    id: string;
    exerciseId: string;
    progressionLevel: number;
    name: string;
    description: string;
    equipmentRequired?: string[];
    instructions: string[];
    videoUrl?: string;
    imageUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface LiftCategory {
    id: string;
    discipline: string;
    methodName: string;
    coreLifts: string[];
    accessoryLifts: string[];
    createdAt: Date;
    updatedAt: Date;
}
export interface ExerciseCategory {
    id: string;
    name: string;
    description?: string;
    parentCategoryId?: string;
    exercises: Exercise[];
    createdAt: Date;
    updatedAt: Date;
}
export interface ExerciseSearchRequest {
    query: string;
    filters?: ExerciseFilters;
    limit?: number;
}
export interface ExerciseRecommendation {
    exercise: Exercise;
    reason: string;
    confidence: number;
    alternatives: Exercise[];
}
export interface ExerciseRecommendationRequest {
    userId: string;
    goals: string[];
    experienceLevel: string;
    availableEquipment: string[];
    preferences: {
        exerciseTypes: string[];
        movementPatterns: MovementPattern[];
        bodyParts: BodyPart[];
    };
    limit?: number;
}
//# sourceMappingURL=exercise.d.ts.map