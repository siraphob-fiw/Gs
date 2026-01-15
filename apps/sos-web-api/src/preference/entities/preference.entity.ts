import { BaseEntity } from '../../types/entities/base.entity';

export interface UserPreferenceEntity extends BaseEntity {
  userId: string;
  key: string;
  value: string;
  category: string;
  isPrivate: boolean;
  metadata?: Record<string, any>;
}

export interface PreferenceSchemaEntity extends BaseEntity {
  key: string;
  category: string;
  displayName: string;
  description?: string;
  dataType: 'string' | 'number' | 'boolean' | 'json' | 'array';
  defaultValue?: string;
  validationRules?: Record<string, any>;
  isRequired: boolean;
  isUserEditable: boolean;
  sortOrder: number;
}

export interface PreferenceCategoryEntity extends BaseEntity {
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
}
