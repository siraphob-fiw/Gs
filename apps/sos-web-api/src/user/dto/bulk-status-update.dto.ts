import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';
import { UserStatus } from './create-user.dto';

export class BulkStatusUpdateDto {
  @ApiProperty({
    type: [String],
    description: 'Array of user IDs to update status for',
    example: ['uuid1', 'uuid2', 'uuid3'],
  })
  @IsUUID('4', { each: true })
  userIds: string[];

  @ApiProperty({
    enum: UserStatus,
    description: 'Status to assign to all users',
  })
  @IsEnum(UserStatus)
  status: UserStatus;
}
