import { ApiProperty } from '@nestjs/swagger';
import { UserRole, UserStatus } from './create-user.dto';
import { WeeklyAvailability } from '@strengthos/shared-types/dist/user-management';

export class ApprovalCoachDto {
  @ApiProperty({ type: () => CoachWithProfile, isArray: true })
  coaches: CoachWithProfile[];

  @ApiProperty({ type: Number, description: 'Total number of coaches' })
  total: number;
}

export class CoachWithProfileProfile {
  @ApiProperty({ description: 'Short bio of the coach' })
  bio: string;

  @ApiProperty({ type: [String], description: 'Specializations of the coach' })
  specializations: string[];

  @ApiProperty({ type: [String], description: 'Certifications of the coach' })
  certifications: string[];

  @ApiProperty({ type: Number, description: 'Hourly rate for the coach' })
  hourly_rate: number;

  @ApiProperty({ type: String, description: 'Currency of the hourly rate' })
  currency: string;

  @ApiProperty({
    type: Boolean,
    description: 'Availability status of the coach',
  })
  is_available: boolean;

  @ApiProperty({
    description: 'Weekly availability of the coach',
  })
  availability: WeeklyAvailability;

  @ApiProperty({ type: [String], description: 'Social links of the coach' })
  social_links: string[];
}

export class CoachWithProfile {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ type: String, description: 'First name of the coach' })
  firstName: string;

  @ApiProperty({ type: String, description: 'Last name of the coach' })
  lastName: string;

  @ApiProperty({ type: String, description: 'Email of the coach' })
  email: string;

  @ApiProperty({ enum: UserStatus, description: 'Status of the coach' })
  status: UserStatus;

  @ApiProperty({ enum: UserRole, description: 'Role of the coach' })
  role: UserRole;

  @ApiProperty({
    type: () => CoachWithProfileProfile,
    description: 'Profile of the coach',
  })
  profile: CoachWithProfileProfile;

  @ApiProperty({ type: Date, description: 'Created at date of the coach' })
  createdAt: Date;

  @ApiProperty({ type: Date, description: 'Updated at date of the coach' })
  updatedAt: Date;
}
