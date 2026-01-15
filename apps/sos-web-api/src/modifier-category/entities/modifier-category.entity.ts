import { BaseEntity, EntityStatus } from '@/types';

export class ModifierCategoryEntity extends BaseEntity {
  name: string;
  description: string;
  status: EntityStatus;
}
