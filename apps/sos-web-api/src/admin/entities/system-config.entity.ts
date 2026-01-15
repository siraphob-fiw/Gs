import { BaseEntity } from '../../types/entities/base.entity';

export interface SystemConfigEntity extends BaseEntity {
  key: string;
  value: string;
  description?: string;
  category: string;
  isPublic: boolean;
  validationSchema?: string;
  defaultValue?: string;
}

export interface AdminActionEntity extends BaseEntity {
  adminUserId: string;
  action: string;
  targetType: string;
  targetId: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface SystemStatsEntity {
  totalUsers: number;
  totalTenants: number;
  activeUsers: number;
  activeTenants: number;
  totalTransactions: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  lastUpdated: Date;
}
