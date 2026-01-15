import { BaseEntity } from '../../database/base.repository';

export enum PostStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export interface Post extends BaseEntity {
  id: string;
  tenant_id?: string;
  title: string;
  details: string;
  status: PostStatus;
  created_at: Date;
  updated_at: Date;
}
