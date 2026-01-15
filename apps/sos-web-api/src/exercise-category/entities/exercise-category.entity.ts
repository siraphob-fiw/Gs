import { BaseEntity } from '@/types';

export class ExerciseCategoryEntity extends BaseEntity {
  name: string;
  description?: string | null;
}

