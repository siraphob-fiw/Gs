import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';
import { UserRole } from './create-user.dto';

export class AssignRoleDto {
  @ApiProperty({ enum: UserRole, description: 'Role to assign to the user' })
  @IsEnum(UserRole)
  role: UserRole;
}

export class BulkAssignRoleDto {
  @ApiProperty({
    type: [String],
    description: 'Array of user IDs to assign the role to',
    example: ['uuid1', 'uuid2', 'uuid3'],
  })
  @IsUUID('4', { each: true })
  userIds: string[];

  @ApiProperty({ enum: UserRole, description: 'Role to assign to all users' })
  @IsEnum(UserRole)
  role: UserRole;
}
