import { BaseEntity, EntityStatus } from '@/types';

export class ModifierEntity extends BaseEntity {
  modifier_category_id: string;
  name: string;
  status: EntityStatus;
  central_stress_factor: number;
  peripheral_stress_factor: number;
  cs_base_multiplier?: number | null;
  cs_cluster_increment?: number | null;
  ps_base_multiplier?: number | null;
  ps_cluster_increment?: number | null;
  uses_cluster_calculation: boolean;
}
