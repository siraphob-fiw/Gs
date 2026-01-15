import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsObject,
  IsEnum,
  IsNumber,
  Min,
  IsArray,
} from 'class-validator';

export class CreateUserPreferenceDto {
  @ApiProperty({ description: 'Preference key' })
  @IsString()
  key: string;

  @ApiProperty({ description: 'Preference value' })
  @IsString()
  value: string;

  @ApiProperty({ description: 'Preference category' })
  @IsString()
  category: string;

  @ApiPropertyOptional({
    description: 'Whether preference is private to user',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiPropertyOptional({
    description: 'Additional metadata for the preference',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateUserPreferenceDto {
  @ApiPropertyOptional({ description: 'Preference value' })
  @IsOptional()
  @IsString()
  value?: string;

  @ApiPropertyOptional({ description: 'Whether preference is private to user' })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiPropertyOptional({
    description: 'Additional metadata for the preference',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class BulkUpdatePreferencesDto {
  @ApiProperty({ description: 'Array of preference updates' })
  @IsArray()
  preferences: Array<{
    key: string;
    value: string;
    category?: string;
    isPrivate?: boolean;
    metadata?: Record<string, any>;
  }>;
}

export class CreatePreferenceSchemaDto {
  @ApiProperty({ description: 'Preference key' })
  @IsString()
  key: string;

  @ApiProperty({ description: 'Preference category' })
  @IsString()
  category: string;

  @ApiProperty({ description: 'Display name for the preference' })
  @IsString()
  displayName: string;

  @ApiPropertyOptional({ description: 'Description of the preference' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Data type of the preference',
    enum: ['string', 'number', 'boolean', 'json', 'array'],
  })
  @IsEnum(['string', 'number', 'boolean', 'json', 'array'])
  dataType: 'string' | 'number' | 'boolean' | 'json' | 'array';

  @ApiPropertyOptional({ description: 'Default value for the preference' })
  @IsOptional()
  @IsString()
  defaultValue?: string;

  @ApiPropertyOptional({
    description: 'Validation rules for the preference value',
  })
  @IsOptional()
  @IsObject()
  validationRules?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Whether the preference is required',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({
    description: 'Whether users can edit this preference',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isUserEditable?: boolean;

  @ApiPropertyOptional({ description: 'Sort order for display', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}

export class UpdatePreferenceSchemaDto {
  @ApiPropertyOptional({ description: 'Display name for the preference' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ description: 'Description of the preference' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Default value for the preference' })
  @IsOptional()
  @IsString()
  defaultValue?: string;

  @ApiPropertyOptional({
    description: 'Validation rules for the preference value',
  })
  @IsOptional()
  @IsObject()
  validationRules?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Whether the preference is required' })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({
    description: 'Whether users can edit this preference',
  })
  @IsOptional()
  @IsBoolean()
  isUserEditable?: boolean;

  @ApiPropertyOptional({ description: 'Sort order for display' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}

export class CreatePreferenceCategoryDto {
  @ApiProperty({ description: 'Category name (internal identifier)' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Display name for the category' })
  @IsString()
  displayName: string;

  @ApiPropertyOptional({ description: 'Description of the category' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Icon for the category' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: 'Sort order for display', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Whether the category is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePreferenceCategoryDto {
  @ApiPropertyOptional({ description: 'Display name for the category' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ description: 'Description of the category' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Icon for the category' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: 'Sort order for display' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Whether the category is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
