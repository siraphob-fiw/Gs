import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  UserPreferenceEntity,
  PreferenceSchemaEntity,
  PreferenceCategoryEntity,
} from '../entities/preference.entity';

export class UserPreferenceResponseDto {
  @ApiProperty({ description: 'Preference ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Preference key' })
  key: string;

  @ApiProperty({ description: 'Preference value' })
  value: string;

  @ApiProperty({ description: 'Preference category' })
  category: string;

  @ApiProperty({ description: 'Whether preference is private to user' })
  isPrivate: boolean;

  @ApiPropertyOptional({
    description: 'Additional metadata for the preference',
  })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  static fromEntity(entity: UserPreferenceEntity): UserPreferenceResponseDto {
    return {
      id: entity.id,
      userId: entity.userId,
      key: entity.key,
      value: entity.value,
      category: entity.category,
      isPrivate: entity.isPrivate,
      metadata: entity.metadata,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
    };
  }
}

export class PreferenceSchemaResponseDto {
  @ApiProperty({ description: 'Schema ID' })
  id: string;

  @ApiProperty({ description: 'Preference key' })
  key: string;

  @ApiProperty({ description: 'Preference category' })
  category: string;

  @ApiProperty({ description: 'Display name for the preference' })
  displayName: string;

  @ApiPropertyOptional({ description: 'Description of the preference' })
  description?: string;

  @ApiProperty({ description: 'Data type of the preference' })
  dataType: 'string' | 'number' | 'boolean' | 'json' | 'array';

  @ApiPropertyOptional({ description: 'Default value for the preference' })
  defaultValue?: string;

  @ApiPropertyOptional({
    description: 'Validation rules for the preference value',
  })
  validationRules?: Record<string, any>;

  @ApiProperty({ description: 'Whether the preference is required' })
  isRequired: boolean;

  @ApiProperty({ description: 'Whether users can edit this preference' })
  isUserEditable: boolean;

  @ApiProperty({ description: 'Sort order for display' })
  sortOrder: number;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  static fromEntity(
    entity: PreferenceSchemaEntity,
  ): PreferenceSchemaResponseDto {
    return {
      id: entity.id,
      key: entity.key,
      category: entity.category,
      displayName: entity.displayName,
      description: entity.description,
      dataType: entity.dataType,
      defaultValue: entity.defaultValue,
      validationRules: entity.validationRules,
      isRequired: entity.isRequired,
      isUserEditable: entity.isUserEditable,
      sortOrder: entity.sortOrder,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
    };
  }
}

export class PreferenceCategoryResponseDto {
  @ApiProperty({ description: 'Category ID' })
  id: string;

  @ApiProperty({ description: 'Category name (internal identifier)' })
  name: string;

  @ApiProperty({ description: 'Display name for the category' })
  displayName: string;

  @ApiPropertyOptional({ description: 'Description of the category' })
  description?: string;

  @ApiPropertyOptional({ description: 'Icon for the category' })
  icon?: string;

  @ApiProperty({ description: 'Sort order for display' })
  sortOrder: number;

  @ApiProperty({ description: 'Whether the category is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  static fromEntity(
    entity: PreferenceCategoryEntity,
  ): PreferenceCategoryResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      displayName: entity.displayName,
      description: entity.description,
      icon: entity.icon,
      sortOrder: entity.sortOrder,
      isActive: entity.isActive,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
    };
  }
}

export class UserPreferencesGroupedResponseDto {
  @ApiProperty({ description: 'Category information' })
  category: PreferenceCategoryResponseDto;

  @ApiProperty({ description: 'Preference schemas for this category' })
  schemas: PreferenceSchemaResponseDto[];

  @ApiProperty({ description: 'User preferences for this category' })
  preferences: UserPreferenceResponseDto[];
}

export class BulkPreferenceUpdateResponseDto {
  @ApiProperty({ description: 'Number of preferences successfully updated' })
  updated: number;

  @ApiProperty({ description: 'Number of preferences that failed to update' })
  failed: number;

  @ApiProperty({ description: 'Details of failed updates' })
  errors: Array<{
    key: string;
    error: string;
  }>;

  @ApiProperty({ description: 'Updated preferences' })
  preferences: UserPreferenceResponseDto[];
}
