import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsArray,
  IsOptional,
  ValidateNested,
  IsDate,
  IsUUID,
  Min,
  Max,
} from 'class-validator';

// Use the SessionStatus enum from the service file for consistency
export enum SessionStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  OVERDUE = 'OVERDUE',
  SKIPPED = 'SKIPPED',
}

/**
 * Modifier with optional parameters for cluster-based methods like Myo-reps.
 * Can be either a simple modifier ID string or an object with modifierId and clusters.
 */
export class ModifierWithParams {
  @ApiProperty({ description: 'Modifier ID' })
  @IsString()
  @IsUUID()
  modifierId: string;

  @ApiPropertyOptional({
    description: 'Number of clusters (for Myo-reps, typically 3-5)',
    minimum: 1,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  clusters?: number;
}

/**
 * Type for modifier input - can be simple string ID or object with params
 */
export type ModifierInput = string | ModifierWithParams;

export class SessionWarmupValues {
  @ApiProperty({ description: 'Sets' })
  @IsNumber()
  sets: number;

  @ApiProperty({ description: 'Weight' })
  @IsNumber()
  weight: number;

  @ApiProperty({ description: 'Reps' })
  @IsNumber()
  reps: number;
}

export class SessionExerciseValues {
  @ApiProperty({ description: 'Sets' })
  @IsNumber()
  sets: number;

  @ApiProperty({ description: 'Reps' })
  @IsNumber()
  reps: number;

  @ApiProperty({ description: 'Weight' })
  @IsNumber()
  weight: number;

  @ApiProperty({ description: 'RPE' })
  @IsNumber()
  rpe: number;
}

export class SessionExerciseActualValues {
  @ApiProperty({ description: 'Sets' })
  @IsNumber()
  sets: number;

  @ApiProperty({ description: 'Reps' })
  @IsNumber()
  reps: number;

  @ApiProperty({ description: 'Weight' })
  @IsNumber()
  weight: number;

  @ApiProperty({ description: 'RPE' })
  @IsNumber()
  rpe: number;

  @ApiProperty({ description: 'Central stress' })
  @IsNumber()
  central_stress: number;

  @ApiProperty({ description: 'Peripheral stress' })
  @IsNumber()
  peripheral_stress: number;

  @ApiProperty({ description: 'Total stress' })
  @IsNumber()
  total_stress: number;
}

// DTO for creating a training session, matches the provided "create data" structure.

export class CreateSessionExerciseMetricsDto {
  @ApiProperty({ description: 'Estimated 1RM' })
  @IsNumber()
  e1rm: number;

  @ApiProperty({ description: 'NL' })
  @IsNumber()
  nl: number;

  @ApiProperty({ description: 'Tonnage' })
  @IsNumber()
  tonnage: number;

  @ApiProperty({ description: 'Total stress' })
  @IsNumber()
  total_stress: number;

  @ApiProperty({ description: 'Peripheral stress' })
  @IsNumber()
  peripheral_stress: number;

  @ApiProperty({ description: 'Central stress' })
  @IsNumber()
  central_stress: number;
}

export class CreateSessionExerciseDto {
  @ApiProperty({ description: 'Exercise ID' })
  @IsString()
  exerciseId: string;

  @ApiProperty({ description: 'Exercise date' })
  @IsDate()
  exerciseDate: Date;

  @ApiProperty({ description: 'Order' })
  @IsNumber()
  order: number;

  @ApiProperty({ description: 'Target' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SessionExerciseValues)
  target: SessionExerciseValues[];

  @ApiProperty({ description: 'Actual' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SessionExerciseActualValues)
  actual: SessionExerciseActualValues[];

  @ApiProperty({ description: 'Modifiers' })
  @IsArray()
  @IsString({ each: true })
  modifiers: string[];

  @ApiProperty({ description: 'Metrics' })
  @ValidateNested()
  @Type(() => CreateSessionExerciseMetricsDto)
  metrics: CreateSessionExerciseMetricsDto;

  @ApiProperty({ description: 'Notes' })
  @IsString()
  notes: string;
}

// DTO for creating a training session
export class CreateTrainingSessionDto {
  @ApiProperty({ description: 'Session name' })
  @IsString()
  sessionName: string;

  @ApiProperty({ description: 'Athlete ID' })
  @IsString()
  athleteId: string;

  @ApiProperty({ description: 'Coach ID' })
  @IsOptional()
  @IsString()
  coachId?: string;

  @ApiProperty({ description: 'Start date' })
  @IsDate()
  startDate: Date;

  @ApiProperty({ description: 'End date' })
  @IsDate()
  endDate: Date;

  @ApiProperty({ description: 'Exercises' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSessionExerciseDto)
  exercises: CreateSessionExerciseDto[];
}

// DTO for returning a training session exercise, matching the TrainingSessionAthlete interface
export class TrainingSessionExerciseResponseDto {
  @ApiProperty({ description: 'ID' })
  id: string;

  @ApiProperty({ description: 'Session ID' })
  sessionId: string;

  @ApiProperty({ description: 'Exercise ID' })
  exerciseId: string;

  @ApiProperty({ description: 'Exercise name' })
  exerciseName?: string;

  @ApiProperty({ description: 'Order' })
  order: number;

  @ApiProperty({ description: 'Exercise date' })
  exerciseDate: Date;

  @ApiProperty({ description: 'Target' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SessionExerciseValues)
  target: SessionExerciseValues[];

  @ApiPropertyOptional({ description: 'Warmup' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SessionWarmupValues)
  warmup?: SessionWarmupValues[];

  @ApiProperty({ description: 'Actual' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SessionExerciseActualValues)
  actual: SessionExerciseActualValues[];

  @ApiProperty({ description: 'Modifiers' })
  @IsArray()
  @IsString({ each: true })
  modifiers: string[];

  @ApiProperty({ description: 'Metrics' })
  @ValidateNested()
  @Type(() => CreateSessionExerciseMetricsDto)
  metrics: CreateSessionExerciseMetricsDto;

  @ApiProperty({ description: 'Notes' })
  @IsString()
  notes: string;

  @ApiProperty({ description: 'Is completed', default: false })
  isCompleted: boolean;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;
}

export class TrainingSessionResponseDto {
  @ApiProperty({ description: 'ID' })
  id: string;

  @ApiProperty({ description: 'Session name' })
  sessionName: string;

  @ApiProperty({ description: 'Athlete ID' })
  athleteId: string;

  @ApiProperty({ description: 'Athlete name' })
  athleteName?: string;

  @ApiProperty({ description: 'Tenant ID' })
  tenantId: string;

  @ApiProperty({ description: 'Start date' })
  startDate: Date;

  @ApiProperty({ description: 'End date' })
  endDate: Date;

  @ApiProperty({ description: 'Session status' })
  sessionStatus: SessionStatus;

  @ApiProperty({
    description: 'Exercises',
    type: [TrainingSessionExerciseResponseDto],
  })
  exercises: TrainingSessionExerciseResponseDto[];

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;
}

// DTO for updating a training session
export class UpdateTrainingSessionDto {
  @ApiPropertyOptional({ description: 'Session name' })
  @IsOptional()
  @IsString()
  sessionName?: string;

  @ApiPropertyOptional({ description: 'Session status' })
  @IsOptional()
  @IsEnum(SessionStatus)
  sessionStatus?: SessionStatus;

  @ApiPropertyOptional({ description: 'exercise' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateTrainingSessionExerciseDto)
  exercises?: UpdateTrainingSessionExerciseDto[];

  @ApiPropertyOptional({
    description:
      'Array of exercise identifiers to delete (format: exerciseId:order:exerciseDate)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deletedExercises?: string[];

  @ApiPropertyOptional({
    description:
      'If true, all existing exercises will be deleted and replaced with the provided list',
  })
  @IsOptional()
  replaceAllExercises?: boolean;
}

export class UpdateTrainingSessionExerciseDto {
  @ApiPropertyOptional({ description: 'Exercise ID' })
  @IsOptional()
  @IsString()
  exerciseId?: string;

  @ApiPropertyOptional({ description: 'Order of the exercise within the day' })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiPropertyOptional({ description: 'Exercise date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  exerciseDate?: string;

  @ApiPropertyOptional({ description: 'Warmup' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SessionWarmupValues)
  warmup?: SessionWarmupValues[];

  @ApiPropertyOptional({ description: 'Actual' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SessionExerciseActualValues)
  actual?: SessionExerciseActualValues[];

  @ApiPropertyOptional({ description: 'Metrics' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateSessionExerciseMetricsDto)
  metrics?: CreateSessionExerciseMetricsDto;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Targets' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SessionExerciseValues)
  targets?: SessionExerciseValues[];

  @ApiPropertyOptional({ description: 'Modifiers' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  modifiers?: string[];
}

export class ProgressSessionExerciseDto {
  @ApiProperty({ description: 'Exercise ID' })
  @IsString()
  exerciseId: string;

  @ApiProperty({ description: 'Order' })
  @IsNumber()
  order: number;

  @ApiProperty({ description: 'Warmup values for this exercise' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SessionWarmupValues)
  warmup?: SessionWarmupValues[];

  @ApiProperty({ description: 'Actual values for this exercise' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SessionExerciseActualValues)
  actual: SessionExerciseActualValues[];

  @ApiPropertyOptional({ description: 'Metrics for this exercise' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateSessionExerciseMetricsDto)
  metrics?: CreateSessionExerciseMetricsDto;

  @ApiPropertyOptional({ description: 'Notes for this exercise' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CalculateWeightDto {
  @ApiProperty({ description: 'Exercise ID' })
  @IsString()
  exerciseId: string;

  @ApiProperty({ description: 'Reps' })
  @IsNumber()
  reps: number;

  @ApiProperty({ description: 'RPE' })
  @IsNumber()
  rpe: number;

  @ApiProperty({ description: 'Athlete ID' })
  @IsOptional()
  @IsString()
  athleteId?: string;
}
