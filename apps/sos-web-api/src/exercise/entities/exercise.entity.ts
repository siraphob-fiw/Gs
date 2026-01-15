import {
  MovementPattern,
  BodyPart,
  Discipline,
} from '@strengthos/shared-types';

export class ExerciseEntity {
  id: string;
  name: string;
  exerciseType: string; // Category ID from exercise_category
  experienceLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ELITE' | string;
  movementPatterns?: MovementPattern[] | string[];
  bodyPartFocus: BodyPart[];
  disciplineTags: Discipline[];
  centralStressFactor: number;
  peripheralStressFactor: number;
  createdAt: Date;
  updatedAt: Date;
  injuryContraindications: string[];
  popularityScore: number;
  effectivenessRating: number;
  techniqueComplexity: number;
  is_approved: boolean;
  createdBy: string;
  approvedBy: string;
  approvedAt: Date;

  constructor(data: Partial<ExerciseEntity>) {
    Object.assign(this, data);
  }

  // Check if exercise should be excluded due to injuries
  isContraindicatedForInjuries(injuryTypes: string[]): boolean {
    return this.injuryContraindications.some((contraindication) =>
      injuryTypes.includes(contraindication),
    );
  }

  // Check if exercise matches discipline
  isCompatibleWithDiscipline(discipline: Discipline): boolean {
    return this.disciplineTags.includes(discipline);
  }

  // Check if exercise targets specific movement pattern
  hasMovementPattern(pattern: MovementPattern | string): boolean {
    return this.movementPatterns?.includes(pattern as any) ?? false;
  }

  // Check if exercise targets specific body part
  targetsBodyPart(bodyPart: BodyPart): boolean {
    return this.bodyPartFocus.includes(bodyPart);
  }

  // Calculate total stress factor
  getTotalStressFactor(): number {
    return this.centralStressFactor + this.peripheralStressFactor;
  }

  // Get technique complexity category
  getTechniqueComplexityCategory():
    | 'simple'
    | 'moderate'
    | 'complex'
    | 'very_complex' {
    if (this.techniqueComplexity <= 3) return 'simple';
    if (this.techniqueComplexity <= 6) return 'moderate';
    if (this.techniqueComplexity <= 8) return 'complex';
    return 'very_complex';
  }

  // Calculate selection score based on various factors
  calculateSelectionScore(
    discipline: Discipline,
    experienceLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ELITE',
    availableTime: number, // minutes
    preferences: {
      varietyPreference: 'minimal' | 'moderate' | 'high';
      complexityPreference: 'simple' | 'moderate' | 'complex';
    },
  ): number {
    let score = this.effectivenessRating * 0.4 + this.popularityScore * 0.3;

    // Discipline compatibility bonus
    if (this.isCompatibleWithDiscipline(discipline)) {
      score += 20;
    }

    // Complexity preference matching
    const complexityCategory = this.getTechniqueComplexityCategory();
    if (
      (preferences.complexityPreference === 'simple' &&
        complexityCategory === 'simple') ||
      (preferences.complexityPreference === 'moderate' &&
        (complexityCategory === 'moderate' ||
          complexityCategory === 'simple')) ||
      (preferences.complexityPreference === 'complex' &&
        complexityCategory !== 'simple')
    ) {
      score += 10;
    }

    // Variety preference (affects how much popularity matters)
    if (preferences.varietyPreference === 'high') {
      score -= this.popularityScore * 0.1; // Slightly prefer less popular exercises for variety
    } else if (preferences.varietyPreference === 'minimal') {
      score += this.popularityScore * 0.1; // Prefer popular, proven exercises
    }

    return Math.max(0, score); // Ensure non-negative score
  }

  // Convert to plain object for API responses
  toJSON(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      exerciseType: this.exerciseType,
      experienceLevel: this.experienceLevel,
      movementPatterns: this.movementPatterns,
      bodyPartFocus: this.bodyPartFocus,
      disciplineTags: this.disciplineTags,
      centralStressFactor: this.centralStressFactor,
      peripheralStressFactor: this.peripheralStressFactor,
      techniqueComplexity: this.techniqueComplexity,
      effectivenessRating: this.effectivenessRating,
      popularityScore: this.popularityScore,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      is_approved: this.is_approved,
      createdBy: this.createdBy,
      approvedBy: this.approvedBy,
      approvedAt: this.approvedAt,
    };
  }
}

export class ExerciseWithUser {
  id: string;
  name: string;
  exerciseType: string; // Category ID from exercise_category
  experienceLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ELITE';
  movementPatterns?: MovementPattern[] | string[];
  bodyPartFocus: BodyPart[];
  disciplineTags: Discipline[];
  centralStressFactor: number;
  peripheralStressFactor: number;
  createdAt: Date;
  updatedAt: Date;
  injuryContraindications: string[];
  popularityScore: number;
  effectivenessRating: number;
  techniqueComplexity: number;
  is_approved: boolean;
  createdBy: string;
  approvedBy: string;
  approvedAt: Date;

  constructor(data: Partial<ExerciseWithUser>) {
    Object.assign(this, data);
  }
  // Check if exercise should be excluded due to injuries
  isContraindicatedForInjuries(injuryTypes: string[]): boolean {
    return this.injuryContraindications.some((contraindication) =>
      injuryTypes.includes(contraindication),
    );
  }

  // Check if exercise matches discipline
  isCompatibleWithDiscipline(discipline: Discipline): boolean {
    return this.disciplineTags.includes(discipline);
  }

  // Check if exercise targets specific movement pattern
  hasMovementPattern(pattern: MovementPattern | string): boolean {
    return this.movementPatterns?.includes(pattern as any) ?? false;
  }

  // Check if exercise targets specific body part
  targetsBodyPart(bodyPart: BodyPart): boolean {
    return this.bodyPartFocus.includes(bodyPart);
  }

  // Calculate total stress factor
  getTotalStressFactor(): number {
    return this.centralStressFactor + this.peripheralStressFactor;
  }
  // Get technique complexity category
  getTechniqueComplexityCategory():
    | 'simple'
    | 'moderate'
    | 'complex'
    | 'very_complex' {
    if (this.techniqueComplexity <= 3) return 'simple';
    if (this.techniqueComplexity <= 6) return 'moderate';
    if (this.techniqueComplexity <= 8) return 'complex';
    return 'very_complex';
  }

  // Calculate selection score based on various factors
  calculateSelectionScore(
    discipline: Discipline,
    experienceLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ELITE',
    availableTime: number, // minutes
    preferences: {
      varietyPreference: 'minimal' | 'moderate' | 'high';
      complexityPreference: 'simple' | 'moderate' | 'complex';
    },
  ): number {
    let score = this.effectivenessRating * 0.4 + this.popularityScore * 0.3;

    // Discipline compatibility bonus
    if (this.isCompatibleWithDiscipline(discipline)) {
      score += 20;
    }
    // Complexity preference matching
    const complexityCategory = this.getTechniqueComplexityCategory();
    if (
      (preferences.complexityPreference === 'simple' &&
        complexityCategory === 'simple') ||
      (preferences.complexityPreference === 'moderate' &&
        (complexityCategory === 'moderate' ||
          complexityCategory === 'simple')) ||
      (preferences.complexityPreference === 'complex' &&
        complexityCategory !== 'simple')
    ) {
      score += 10;
    }

    // Variety preference (affects how much popularity matters)
    if (preferences.varietyPreference === 'high') {
      score -= this.popularityScore * 0.1; // Slightly prefer less popular exercises for variety
    } else if (preferences.varietyPreference === 'minimal') {
      score += this.popularityScore * 0.1; // Prefer popular, proven exercises
    }

    return Math.max(0, score); // Ensure non-negative score
  }

  // Convert to plain object for API responses
  toJSON(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      exerciseType: this.exerciseType,
      movementPatterns: this.movementPatterns,
      disciplineTags: this.disciplineTags,
      bodyPartFocus: this.bodyPartFocus,
      centralStressFactor: this.centralStressFactor,
      peripheralStressFactor: this.peripheralStressFactor,
      injuryContraindications: this.injuryContraindications,
      popularityScore: this.popularityScore,
      effectivenessRating: this.effectivenessRating,
      techniqueComplexity: this.techniqueComplexity,
      is_approved: this.is_approved,
      createdBy: this.createdBy,
      approvedBy: this.approvedBy,
      approvedAt: this.approvedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      experienceLevel: this.experienceLevel,
    };
  }
}
