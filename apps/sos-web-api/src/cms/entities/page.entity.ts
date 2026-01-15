import { BaseEntity } from '../../database/base.repository';
import { PageOptions } from '../dto/page.dto';

export enum PageStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export interface Page extends BaseEntity {
  id: string;
  tenant_id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  status: PageStatus;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
  author_id: string;
  published_at?: Date;
  created_at: Date;
  updated_at: Date;
  options?: PageOptions | null;
}
