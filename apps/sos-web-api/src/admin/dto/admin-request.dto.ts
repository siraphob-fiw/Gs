import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsObject,
  IsEnum,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateSystemConfigDto {
  @ApiProperty({ description: 'Configuration key' })
  @IsString()
  key: string;

  @ApiProperty({ description: 'Configuration value' })
  @IsString()
  value: string;

  @ApiPropertyOptional({ description: 'Configuration description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Configuration category' })
  @IsString()
  category: string;

  @ApiProperty({ description: 'Whether configuration is publicly accessible' })
  @IsBoolean()
  isPublic: boolean;

  @ApiPropertyOptional({ description: 'JSON schema for value validation' })
  @IsOptional()
  @IsString()
  validationSchema?: string;

  @ApiPropertyOptional({ description: 'Default value for configuration' })
  @IsOptional()
  @IsString()
  defaultValue?: string;
}

export class UpdateSystemConfigDto {
  @ApiPropertyOptional({ description: 'Configuration value' })
  @IsOptional()
  @IsString()
  value?: string;

  @ApiPropertyOptional({ description: 'Configuration description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether configuration is publicly accessible',
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'JSON schema for value validation' })
  @IsOptional()
  @IsString()
  validationSchema?: string;

  @ApiPropertyOptional({ description: 'Default value for configuration' })
  @IsOptional()
  @IsString()
  defaultValue?: string;
}

export class AdminActionDto {
  @ApiProperty({ description: 'Action type' })
  @IsString()
  action: string;

  @ApiProperty({ description: 'Target resource type' })
  @IsString()
  targetType: string;

  @ApiProperty({ description: 'Target resource ID' })
  @IsString()
  targetId: string;

  @ApiPropertyOptional({ description: 'Additional action details' })
  @IsOptional()
  @IsObject()
  details?: Record<string, any>;
}

export class ReportQueryDto {
  @ApiPropertyOptional({
    description: 'Report type',
    enum: ['users', 'tenants', 'transactions', 'system'],
  })
  @IsOptional()
  @IsEnum(['users', 'tenants', 'transactions', 'system'])
  type?: string;

  @ApiPropertyOptional({ description: 'Start date for report' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for report' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Page number for pagination' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}
