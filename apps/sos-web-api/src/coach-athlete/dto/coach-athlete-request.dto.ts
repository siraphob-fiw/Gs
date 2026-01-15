import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsString, IsEnum } from 'class-validator';
import { RelationshipStatus } from '../entities/coach-athlete-relationship.entity';

export class CreateCoachAthleteRelationshipDto {
  @ApiProperty({ description: 'Coach user ID' })
  @IsUUID()
  coach_id: string;

  @ApiProperty({ description: 'Athlete user ID' })
  @IsUUID()
  athlete_id: string;

  @ApiPropertyOptional({ description: 'Relationship notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateCoachAthleteRelationshipDto {
  @ApiPropertyOptional({
    description: 'Relationship status',
    enum: RelationshipStatus,
  })
  @IsOptional()
  @IsEnum(RelationshipStatus)
  status?: RelationshipStatus;
}

export class CoachAthleteQueryDto {
  @ApiPropertyOptional({ description: 'Filter by coach ID' })
  @IsOptional()
  @IsUUID()
  coach_id?: string;

  @ApiPropertyOptional({ description: 'Filter by athlete ID' })
  @IsOptional()
  @IsUUID()
  athlete_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: RelationshipStatus,
  })
  @IsOptional()
  @IsEnum(RelationshipStatus)
  status?: RelationshipStatus;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  limit?: number = 20;
}
