import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsArray,
  IsOptional,
  ValidateNested,
  Min,
  IsBoolean,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum WorkoutMethod {
  JIM_WENDLER = 'JIM_WENDLER',
  WESTSIDE_CONJUGATE = 'WESTSIDE_CONJUGATE',
}

export enum WorkoutType {
  CUTTING = 'CUTTING',
  HYPERTROPHY = 'HYPERTROPHY',
}

export enum WorkoutStatus {
  ACTIVE = 'ACTIVE',
  UNACTIVE = 'UNACTIVE',
}

export class CreateTrainingBlockExerciseScheduleDto {
  @ApiProperty({ description: 'Week', example: 1 })
  @IsNumber()
  week: number;

  @ApiProperty({ description: 'Day', example: 1 })
  @IsNumber()
  day: number;
}

export class CreateTrainingBlockExerciseSetValueDto {
  @ApiProperty({ description: 'Reps', example: 10 })
  @IsNumber()
  reps: number;

  @ApiProperty({ description: 'RPE', example: 8 })
  @IsNumber()
  rpe: number;
}

export class CreateTrainingBlockExerciseSetDto {
  @ApiProperty({
    description: 'Exercise ID',
    example: 'ebae27f6-ef89-4589-b8dc-c61b76343a27',
  })
  @IsString()
  exerciseId: string;

  @ApiPropertyOptional({ description: 'Exercise Name', example: 'Bench Press' })
  @IsString()
  exerciseName: string;

  @ApiProperty({ description: 'Order', example: 1 })
  @IsNumber()
  @Min(1)
  order: number;

  @ApiProperty({ description: 'Day', example: 1 })
  @IsNumber()
  day: number;

  @ApiProperty({
    description: 'Sets',
    example: [{ reps: 10, rpe: 8 }],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTrainingBlockExerciseSetValueDto)
  sets: CreateTrainingBlockExerciseSetValueDto[];

  @ApiProperty({
    description: 'Modifiers',
    example: ['Modifier1', 'Modifier2'],
  })
  @IsArray()
  @IsString({ each: true })
  modifiers: string[];

  @ApiPropertyOptional({
    description: 'Exercise summary',
    example: {
      totalStress: 100,
      centralStress: 50,
      peripheralStress: 50,
    },
  })
  @IsOptional()
  @IsObject()
  summary?: Record<string, any>;
}

export class TrainingBlockExerciseSetResponseDto {
  @ApiProperty({ description: 'Set ID' })
  id: string;

  @ApiProperty({ description: 'Training block ID' })
  trainingBlockId: string;

  @ApiProperty({ description: 'Exercise ID' })
  exerciseId: string;

  @ApiProperty({ description: 'Order' })
  order: number;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;
}

export class CreateTrainingBlockDto {
  @ApiProperty({ description: 'Workout name', example: 'Diary Training ' })
  @IsString()
  workoutName: string;

  @ApiProperty({
    enum: WorkoutMethod,
    description: 'Workout method',
    example: WorkoutMethod.JIM_WENDLER,
  })
  @IsEnum(WorkoutMethod)
  workoutMethod: WorkoutMethod;

  @ApiProperty({
    enum: WorkoutType,
    description: 'Workout type',
    example: WorkoutType.CUTTING,
  })
  @IsEnum(WorkoutType)
  workoutType: WorkoutType;

  @ApiPropertyOptional({
    description: 'is global',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isGlobal?: boolean;

  @ApiPropertyOptional({
    description: 'Is free (accessible by free plan users)',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  is_free?: boolean;

  @ApiPropertyOptional({
    description: 'Workout summary',
    example: {
      nl: 0,
      totalStress: 0,
      centralStress: 0,
      peripheralStress: 0,
      csBalance: 0,
      patterns: [
        {
          type: 'Horizontal_push',
          nl: 0,
          peripheralStress: 0,
          centralStress: 0,
          totalStress: 0,
          csBalance: 0,
        },
        {
          type: 'Vertical_pull',
          nl: 0,
          peripheralStress: 0,
          centralStress: 0,
          totalStress: 0,
          csBalance: 0,
        },
      ],
    },
  })
  @IsOptional()
  @IsObject()
  summary?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'exercises',
    type: [CreateTrainingBlockExerciseSetDto],
    example: [
      {
        exerciseId: 'ebae27f6-ef89-4589-b8dc-c61b76343a27',
        order: 1,
        day: 1,
        sets: [
          {
            reps: 10,
            rpe: 8,
          },
        ],
        modifiers: [],
      },
      {
        exerciseId: '701141c7-e8cc-44a0-9560-6d784bf20318',
        order: 2,
        day: 1,
        sets: [
          {
            reps: 10,
            rpe: 8,
          },
        ],
        modifiers: [],
        summary: {
          nl: 0,
          totalStress: 0,
          centralStress: 0,
          peripheralStress: 0,
        },
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTrainingBlockExerciseSetDto)
  exercises?: CreateTrainingBlockExerciseSetDto[];
}

export class CalculateSummaryExerciseSetDto {
  @ApiProperty({ description: 'Reps', example: 10 })
  @IsNumber()
  reps: number;

  @ApiProperty({ description: 'RPE', example: 8 })
  @IsNumber()
  rpe: number;
}

export class ModifierWithParamsDto {
  @ApiProperty({ description: 'Modifier ID' })
  @IsString()
  modifierId: string;

  @ApiPropertyOptional({
    description: 'Number of clusters for cluster-based modifiers',
  })
  @IsOptional()
  @IsNumber()
  clusters?: number;
}

export class CalculateSummaryExerciseDto {
  @ApiProperty({
    description: 'Exercise ID',
    example: 'ebae27f6-ef89-4589-b8dc-c61b76343a27',
  })
  @IsString()
  exerciseId: string;

  @ApiProperty({ description: 'Order', example: 1 })
  @IsNumber()
  @Min(1)
  order: number;

  @ApiProperty({ description: 'Day', example: 1 })
  @IsNumber()
  day: number;

  @ApiProperty({
    description: 'Sets',
    example: [{ reps: 10, rpe: 8 }],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CalculateSummaryExerciseSetDto)
  sets: CalculateSummaryExerciseSetDto[];

  @ApiProperty({
    description:
      'Modifiers (can be string IDs or objects with modifierId and clusters)',
    example: ['modifier-id-1', { modifierId: 'modifier-id-2', clusters: 5 }],
  })
  @IsArray()
  modifiers: (string | ModifierWithParamsDto)[];
}

export class CalculateSummaryDto {
  @ApiProperty({
    description: 'Exercises to calculate summary for',
    type: [CalculateSummaryExerciseDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CalculateSummaryExerciseDto)
  exercises: CalculateSummaryExerciseDto[];
}

export class UpdateTrainingBlockDto {
  @ApiPropertyOptional({ description: 'Workout name' })
  @IsOptional()
  @IsString()
  workoutName?: string;

  @ApiPropertyOptional({
    enum: WorkoutMethod,
    description: 'Workout method',
  })
  @IsOptional()
  @IsEnum(WorkoutMethod)
  workoutMethod?: WorkoutMethod;

  @ApiPropertyOptional({
    enum: WorkoutType,
    description: 'Workout type',
  })
  @IsOptional()
  @IsEnum(WorkoutType)
  workoutType?: WorkoutType;

  @ApiPropertyOptional({ description: 'Workout status' })
  @IsOptional()
  @IsEnum(WorkoutStatus)
  workoutStatus?: WorkoutStatus;

  @ApiPropertyOptional({
    description: 'Workout summary',
    example: {
      totalStress: 100,
      centralStress: 50,
      peripheralStress: 50,
    },
  })
  @IsOptional()
  @IsObject()
  summary?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Is free (accessible by free plan users)',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  is_free?: boolean;

  @ApiPropertyOptional({
    description: 'exercises',
    type: [CreateTrainingBlockExerciseSetDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTrainingBlockExerciseSetDto)
  exercises?: CreateTrainingBlockExerciseSetDto[];
}
