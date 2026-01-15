import { ApiProperty } from '@nestjs/swagger';
import {
  RelationshipStatus,
  CoachAthleteRelationship,
} from '../entities/coach-athlete-relationship.entity';

export class CoachAthleteRelationshipResponseDto {
  @ApiProperty({ description: 'Relationship ID' })
  id: string;

  @ApiProperty({ description: 'Tenant ID' })
  tenant_id: string;

  @ApiProperty({ description: 'Coach user ID' })
  coach_id: string;

  @ApiProperty({ description: 'Athlete user ID' })
  athlete_id: string;

  @ApiProperty({ description: 'Relationship status', enum: RelationshipStatus })
  status: RelationshipStatus;

  @ApiProperty({ description: 'Creation timestamp' })
  created_at: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updated_at: Date;

  @ApiProperty({ description: 'Athlete first name' })
  athlete_firstName: string;

  @ApiProperty({ description: 'Athlete last name' })
  athlete_lastName: string;

  @ApiProperty({ description: 'Athlete role' })
  athlete_role: string;

  @ApiProperty({ description: 'Athlete email' })
  athlete_email: string;

  @ApiProperty({ description: 'Coach email' })
  coach_email: string;

  @ApiProperty({ description: 'Coach first name' })
  coach_firstName: string;

  @ApiProperty({ description: 'Coach last name' })
  coach_lastName: string;

  static fromEntity(
    entity: CoachAthleteRelationship,
  ): CoachAthleteRelationshipResponseDto {
    return {
      id: entity.id,
      tenant_id: entity.tenant_id,
      coach_id: entity.coach_id,
      athlete_id: entity.athlete_id,
      status: entity.status,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
      athlete_firstName: entity.athlete_firstName,
      athlete_lastName: entity.athlete_lastName,
      athlete_role: entity.athlete_role,
      athlete_email: entity.athlete_email,
      coach_email: entity.coach_email,
      coach_firstName: entity.coach_firstName,
      coach_lastName: entity.coach_lastName,
    };
  }
}

export class CoachAthleteRelationshipListResponseDto {
  @ApiProperty({ type: [CoachAthleteRelationshipResponseDto] })
  relationships: CoachAthleteRelationshipResponseDto[];

  @ApiProperty({ description: 'Total number of relationships' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;
}

export class CoachAthleteRelationshipWithTrainingBlocksResponseDto {
  @ApiProperty({
    type: [CoachAthleteRelationshipResponseDto],
    description:
      'List of coach-athlete relationships with training blocks count and last activity',
  })
  relationships: Array<
    CoachAthleteRelationshipResponseDto & {
      training_session_count: number;
      last_activity: Date | null;
    }
  >;

  @ApiProperty({ description: 'Total number of relationships' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;
}
