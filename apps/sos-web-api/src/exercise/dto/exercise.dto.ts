import {
  IsEnum,
  IsArray,
  IsNumber,
  IsString,
  IsOptional,
  IsBoolean,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import {
  MovementPattern,
  BodyPart,
  Discipline,
} from '@strengthos/shared-types';

export class InjuryRestrictionDto {
  @IsString()
  injuryType: string;

  @IsEnum(BodyPart)
  bodyPart: BodyPart;

  @IsEnum(['EXCLUDE', 'MODIFY', 'LIMIT_LOAD', 'LIMIT_ROM'])
  restrictionType: 'EXCLUDE' | 'MODIFY' | 'LIMIT_LOAD' | 'LIMIT_ROM';

  @IsOptional()
  parameters?: Record<string, any>;
}

export class ExercisePreferencesDto {
  @IsEnum(['minimal', 'moderate', 'high'])
  varietyPreference: 'minimal' | 'moderate' | 'high';

  @IsEnum(['simple', 'moderate', 'complex'])
  complexityPreference: 'simple' | 'moderate' | 'complex';
}

export class ExerciseRequirementDto {
  @IsString()
  exerciseType: string; // Category ID from exercise_category

  @IsOptional()
  @IsEnum(MovementPattern)
  movementPattern?: MovementPattern;

  @IsOptional()
  @IsEnum(BodyPart)
  bodyPart?: BodyPart;

  @IsNumber()
  @Min(1)
  count: number;
}

export class ExerciseSelectionRequestDto {
  @IsEnum(Discipline)
  discipline: Discipline;

  @IsEnum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ELITE'])
  experienceLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ELITE';

  @IsArray()
  @IsString({ each: true })
  availableEquipmentIds: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InjuryRestrictionDto)
  injuryRestrictions: InjuryRestrictionDto[];

  @IsNumber()
  @Min(15)
  @Max(300)
  sessionDuration: number;

  @ValidateNested()
  @Type(() => ExercisePreferencesDto)
  preferences: ExercisePreferencesDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseRequirementDto)
  requirements: ExerciseRequirementDto[];
}

export class ExerciseFiltersDto {
  @IsOptional()
  @IsEnum(Discipline)
  discipline?: Discipline;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  movementPatterns?: string[];

  @IsOptional()
  @IsArray()
  @IsEnum(BodyPart, { each: true })
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    return Array.isArray(value) ? value : [value];
  })
  bodyParts?: BodyPart[];

  @IsOptional()
  @IsString()
  exerciseType?: string; // Category ID from exercise_category

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  availableEquipmentIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludeInjuryTypes?: string[];

  @IsOptional()
  @IsEnum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ELITE'])
  experienceLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ELITE';

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  maxComplexity?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minEffectiveness?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  page?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['name', 'exerciseType', 'created_at'])
  sortBy?: 'name' | 'exerciseType' | 'created_at';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @IsString()
  tenantId?: string;
}

export class CreateExerciseDto {
  @IsString()
  name: string;

  @IsString()
  exerciseType: string; // Category ID from exercise_category

  @IsOptional()
  @IsEnum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ELITE'])
  experienceLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ELITE';

  @IsArray()
  @IsString({ each: true })
  movementPatterns: string[];

  @IsArray()
  @IsEnum(BodyPart, { each: true })
  bodyPartFocus: BodyPart[];

  @IsArray()
  @IsEnum(Discipline, { each: true })
  disciplineTags: Discipline[];

  @IsNumber()
  @Min(0)
  @Max(100)
  centralStressFactor: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  peripheralStressFactor: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  injuryContraindications?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  popularityScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  effectivenessRating?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  techniqueComplexity?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  needEquipment?: string[];
}

export class UpdateExerciseDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  exerciseType?: string; // Category ID from exercise_category

  @IsOptional()
  @IsEnum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ELITE'])
  experienceLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ELITE';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  movementPatterns?: string[];

  @IsOptional()
  @IsArray()
  @IsEnum(BodyPart, { each: true })
  bodyPartFocus?: BodyPart[];

  @IsOptional()
  @IsArray()
  @IsEnum(Discipline, { each: true })
  disciplineTags?: Discipline[];

  @IsOptional()
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    {
      message: 'centralStressFactor must be a number (float or double allowed)',
    },
  )
  @Min(0)
  @Max(100)
  centralStressFactor?: number; // can be float/double

  @IsOptional()
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    {
      message:
        'peripheralStressFactor must be a number (float or double allowed)',
    },
  )
  @Min(0)
  @Max(100)
  peripheralStressFactor?: number; // can be float/double

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  injuryContraindications?: string[];

  @IsOptional()
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'popularityScore must be a number (float or double allowed)' },
  )
  @Min(0)
  @Max(100)
  popularityScore?: number; // can be float/double

  @IsOptional()
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    {
      message: 'effectivenessRating must be a number (float or double allowed)',
    },
  )
  @Min(0)
  @Max(100)
  effectivenessRating?: number; // can be float/double

  @IsOptional()
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    {
      message: 'techniqueComplexity must be a number (float or double allowed)',
    },
  )
  @Min(1)
  @Max(10)
  techniqueComplexity?: number; // can be float/double

  @IsOptional()
  @IsBoolean()
  is_approved?: boolean;

  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredEquipmentIds?: string[];
}

export class ExerciseCompatibilityRequestDto {
  @IsArray()
  @IsString({ each: true })
  exerciseIds: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InjuryRestrictionDto)
  injuryRestrictions: InjuryRestrictionDto[];
}

export class ExerciseRecommendationResponseDto {
  exercise: any; // Will be populated with ExerciseEntity data
  reason: string;
  confidence: number;
}

export class ExerciseSelectionResponseDto {
  @IsArray()
  recommendations: ExerciseRecommendationResponseDto[];

  @IsNumber()
  totalSelected: number;

  @IsString()
  selectionCriteria: string;
}
