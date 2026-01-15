import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GlobalSettingEntity } from '../entities/global-setting.entity';

export class GlobalSettingResponseDto {
  @ApiProperty({
    description: 'Global setting ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Configuration key',
    example: 'app.theme.default',
  })
  configKey: string;

  @ApiProperty({
    description: 'Configuration value (JSON object)',
    example: { theme: 'dark', fontSize: 14 },
  })
  configValue: Record<string, any>;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Soft deletion timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  deletedAt?: Date;

  static fromEntity(entity: GlobalSettingEntity): GlobalSettingResponseDto {
    return {
      id: entity.id,
      configKey: entity.config_key,
      configValue: entity.config_value,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
      deletedAt: entity.deleted_at,
    };
  }
}

