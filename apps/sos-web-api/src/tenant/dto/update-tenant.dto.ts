import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';
import { TenantStatus } from '@strengthos/shared-types';
import { TenantSettings as TenantSettingsType } from '@strengthos/shared-types/user-management';

export class UpdateTenantDto {
  @ApiPropertyOptional({
    description: 'Tenant business name',
    example: 'Elite Fitness Coaching Updated',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Tenant description',
    example: 'A premium fitness coaching facility.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Tenant status',
    enum: TenantStatus,
    example: TenantStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;

  @ApiPropertyOptional({
    description: 'Tenant Contact',
    type: 'object',
    additionalProperties: {
      type: 'string',
    },
    example: {
      'email': 'john.doe@example.com',
    }
  })
  @IsObject({ each: true })
  @IsOptional()
  contact?: { [key:string]: string };
}
