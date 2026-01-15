import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

export class AssignTenantDto {
  @ApiProperty({
    description: 'Tenant ID to assign to the user',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID('4')
  @IsNotEmpty()
  tenantId: string;
}

export class BulkAssignTenantDto {
  @ApiProperty({
    type: [String],
    description: 'Array of user IDs to assign to the tenant',
    example: ['uuid1', 'uuid2', 'uuid3'],
  })
  @IsUUID('4', { each: true })
  userIds: string[];

  @ApiProperty({
    description: 'Tenant ID to assign to the users',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID('4')
  @IsNotEmpty()
  tenantId: string;
}
