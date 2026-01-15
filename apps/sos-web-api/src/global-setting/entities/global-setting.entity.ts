import { BaseEntity } from '../../types/entities/base.entity';

/**
 * Global Setting Entity
 * Stores key-value configuration pairs with JSON value support
 */
export interface GlobalSettingEntity extends BaseEntity {
  config_key: string;
  config_value: Record<string, any>;
}

export interface GlobalSettingListResponseDto {
  data: GlobalSettingEntity[];
  total: number;
  page: number;
  limit: number;
}
