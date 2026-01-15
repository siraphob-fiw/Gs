import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  SystemConfigEntity,
  AdminActionEntity,
  SystemStatsEntity,
} from '../entities/system-config.entity';

export class SystemConfigResponseDto {
  @ApiProperty({ description: 'Configuration ID' })
  id: string;

  @ApiProperty({ description: 'Configuration key' })
  key: string;

  @ApiProperty({ description: 'Configuration value' })
  value: string;

  @ApiPropertyOptional({ description: 'Configuration description' })
  description?: string;

  @ApiProperty({ description: 'Configuration category' })
  category: string;

  @ApiProperty({ description: 'Whether configuration is publicly accessible' })
  isPublic: boolean;

  @ApiPropertyOptional({ description: 'JSON schema for value validation' })
  validationSchema?: string;

  @ApiPropertyOptional({ description: 'Default value for configuration' })
  defaultValue?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  static fromEntity(entity: SystemConfigEntity): SystemConfigResponseDto {
    return {
      id: entity.id,
      key: entity.key,
      value: entity.value,
      description: entity.description,
      category: entity.category,
      isPublic: entity.isPublic,
      validationSchema: entity.validationSchema,
      defaultValue: entity.defaultValue,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
    };
  }
}

export class AdminActionResponseDto {
  @ApiProperty({ description: 'Action ID' })
  id: string;

  @ApiProperty({ description: 'Admin user ID who performed the action' })
  adminUserId: string;

  @ApiProperty({ description: 'Action type' })
  action: string;

  @ApiProperty({ description: 'Target resource type' })
  targetType: string;

  @ApiProperty({ description: 'Target resource ID' })
  targetId: string;

  @ApiProperty({ description: 'Additional action details' })
  details: Record<string, any>;

  @ApiPropertyOptional({ description: 'IP address of the admin' })
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'User agent of the admin' })
  userAgent?: string;

  @ApiProperty({ description: 'Action timestamp' })
  createdAt: Date;

  static fromEntity(entity: AdminActionEntity): AdminActionResponseDto {
    return {
      id: entity.id,
      adminUserId: entity.adminUserId,
      action: entity.action,
      targetType: entity.targetType,
      targetId: entity.targetId,
      details: entity.details,
      ipAddress: entity.ipAddress,
      userAgent: entity.userAgent,
      createdAt: entity.created_at,
    };
  }
}

export class SystemStatsResponseDto {
  @ApiProperty({ description: 'Total number of users' })
  totalUsers: number;

  @ApiProperty({ description: 'Total number of tenants' })
  totalTenants: number;

  @ApiProperty({ description: 'Number of active users' })
  activeUsers: number;

  @ApiProperty({ description: 'Number of active tenants' })
  activeTenants: number;

  @ApiProperty({ description: 'Total number of transactions' })
  totalTransactions: number;

  @ApiProperty({ description: 'Overall system health status' })
  systemHealth: 'healthy' | 'warning' | 'critical';

  @ApiProperty({ description: 'Last update timestamp' })
  lastUpdated: Date;

  static fromEntity(entity: SystemStatsEntity): SystemStatsResponseDto {
    return {
      totalUsers: entity.totalUsers,
      totalTenants: entity.totalTenants,
      activeUsers: entity.activeUsers,
      activeTenants: entity.activeTenants,
      totalTransactions: entity.totalTransactions,
      systemHealth: entity.systemHealth,
      lastUpdated: entity.lastUpdated,
    };
  }
}

export class ReportResponseDto {
  @ApiProperty({ description: 'Report data' })
  data: any[];

  @ApiProperty({ description: 'Total count of items' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Report generation timestamp' })
  generatedAt: Date;
}
