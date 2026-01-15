import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateExerciseCategoryDto {
  @ApiProperty({ description: 'Exercise category name', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Exercise category description' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateExerciseCategoryDto {
  @ApiPropertyOptional({
    description: 'Exercise category name',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Exercise category description' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class ExerciseCategoryResponseDto {
  @ApiProperty({ description: 'Exercise category ID' })
  id: string;

  @ApiProperty({ description: 'Exercise category name' })
  name: string;

  @ApiPropertyOptional({ description: 'Exercise category description' })
  description?: string | null;

  @ApiProperty({ description: 'Created at timestamp' })
  created_at: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  updated_at: Date;
}

export class ExerciseCategoryFiltersDto {
  @ApiPropertyOptional({ description: 'Filter by name (partial match)' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ description: 'Sort by', default: 'created_at' })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', default: 'desc' })
  @IsString()
  @IsOptional()
  sortOrder?: string;
}

export class ExerciseCategoryListResponseDto {
  @ApiProperty({ type: [ExerciseCategoryResponseDto] })
  exercise_categories: ExerciseCategoryResponseDto[];

  @ApiProperty({ description: 'Total count' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;
}

