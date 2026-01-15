import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { SystemConfigRepository } from '../repositories/system-config.repository';
import { SystemConfigEntity } from '../entities/system-config.entity';
import {
  CreateSystemConfigDto,
  UpdateSystemConfigDto,
} from '../dto/admin-request.dto';
import { AdminService } from './admin.service';
import { CacheService } from '../../shared/cache/cache.service';

@Injectable()
export class SystemConfigService {
  private readonly CACHE_PREFIX = 'system_config:';
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    private readonly systemConfigRepository: SystemConfigRepository,
    private readonly adminService: AdminService,
    private readonly cacheService: CacheService,
  ) {}

  async createConfig(
    adminUserId: string,
    configDto: CreateSystemConfigDto,
  ): Promise<SystemConfigEntity> {
    // Validate admin permissions
    await this.adminService.validateSuperAdmin(adminUserId);

    // Check if key already exists
    const existingConfig = await this.systemConfigRepository.findByKey(
      configDto.key,
    );
    if (existingConfig) {
      throw new ConflictException(
        `Configuration with key '${configDto.key}' already exists`,
      );
    }

    // Validate the configuration value if schema is provided
    if (configDto.validationSchema) {
      this.validateConfigValue(configDto.value, configDto.validationSchema);
    }

    const config = await this.systemConfigRepository.create(configDto);

    // Cache the new configuration
    await this.cacheService.setTenantData(
      'system',
      `${this.CACHE_PREFIX}${config.key}`,
      config,
      this.CACHE_TTL,
    );

    // Log admin action
    await this.adminService.logAdminAction(adminUserId, {
      action: 'create_system_config',
      targetType: 'system_config',
      targetId: config.id,
      details: { key: config.key, category: config.category },
    });

    return config;
  }

  async getAllConfigs(
    adminUserId?: string,
    filters?: { category?: string; isPublic?: boolean },
  ): Promise<SystemConfigEntity[]> {
    // If not admin user, only return public configurations
    if (!adminUserId) {
      filters = { ...filters, isPublic: true };
    } else {
      // Validate admin permissions for non-public configs
      await this.adminService.validateSuperAdmin(adminUserId);
    }

    return this.systemConfigRepository.findAll(filters);
  }

  async getConfigByKey(
    key: string,
    adminUserId?: string,
  ): Promise<SystemConfigEntity> {
    // Try to get from cache first
    const cacheResult =
      await this.cacheService.getTenantData<SystemConfigEntity>(
        'system',
        `${this.CACHE_PREFIX}${key}`,
      );
    const cached = cacheResult.isOk ? cacheResult.returnValue : null;
    if (cached) {
      // Check if user can access this config
      if (!cached.isPublic && !adminUserId) {
        throw new NotFoundException('Configuration not found');
      }
      if (!cached.isPublic && adminUserId) {
        await this.adminService.validateSuperAdmin(adminUserId);
      }
      return cached;
    }

    const config = await this.systemConfigRepository.findByKey(key);
    if (!config) {
      throw new NotFoundException('Configuration not found');
    }

    // Check if user can access this config
    if (!config.isPublic && !adminUserId) {
      throw new NotFoundException('Configuration not found');
    }
    if (!config.isPublic && adminUserId) {
      await this.adminService.validateSuperAdmin(adminUserId);
    }

    // Cache the configuration
    await this.cacheService.setTenantData(
      'system',
      `${this.CACHE_PREFIX}${key}`,
      config,
      this.CACHE_TTL,
    );

    return config;
  }

  async updateConfig(
    adminUserId: string,
    configId: string,
    updateDto: UpdateSystemConfigDto,
  ): Promise<SystemConfigEntity> {
    // Validate admin permissions
    await this.adminService.validateSuperAdmin(adminUserId);

    const existingConfig = await this.systemConfigRepository.findById(configId);
    if (!existingConfig) {
      throw new NotFoundException('Configuration not found');
    }

    // Validate the new value if schema exists
    if (updateDto.value && existingConfig.validationSchema) {
      this.validateConfigValue(
        updateDto.value,
        existingConfig.validationSchema,
      );
    }

    const updatedConfig = await this.systemConfigRepository.update(
      configId,
      updateDto,
    );
    if (!updatedConfig) {
      throw new NotFoundException('Configuration not found');
    }

    // Update cache
    await this.cacheService.setTenantData(
      'system',
      `${this.CACHE_PREFIX}${updatedConfig.key}`,
      updatedConfig,
      this.CACHE_TTL,
    );

    // Log admin action
    await this.adminService.logAdminAction(adminUserId, {
      action: 'update_system_config',
      targetType: 'system_config',
      targetId: configId,
      details: {
        key: updatedConfig.key,
        changes: updateDto,
        previousValue: existingConfig.value,
        newValue: updatedConfig.value,
      },
    });

    return updatedConfig;
  }

  async deleteConfig(adminUserId: string, configId: string): Promise<void> {
    // Validate admin permissions
    await this.adminService.validateSuperAdmin(adminUserId);

    const config = await this.systemConfigRepository.findById(configId);
    if (!config) {
      throw new NotFoundException('Configuration not found');
    }

    const deleted = await this.systemConfigRepository.delete(configId);
    if (!deleted) {
      throw new NotFoundException('Configuration not found');
    }

    // Remove from cache
    await this.cacheService.deleteTenantData(
      'system',
      `${this.CACHE_PREFIX}${config.key}`,
    );

    // Log admin action
    await this.adminService.logAdminAction(adminUserId, {
      action: 'delete_system_config',
      targetType: 'system_config',
      targetId: configId,
      details: { key: config.key, category: config.category },
    });
  }

  async getConfigsByCategory(
    category: string,
    adminUserId?: string,
  ): Promise<SystemConfigEntity[]> {
    const configs = await this.systemConfigRepository.findByCategory(category);

    // Filter out non-public configs if not admin
    if (!adminUserId) {
      return configs.filter((config) => config.isPublic);
    }

    // Validate admin permissions for accessing all configs
    await this.adminService.validateSuperAdmin(adminUserId);
    return configs;
  }

  async getCategories(adminUserId?: string): Promise<string[]> {
    if (adminUserId) {
      // Validate admin permissions
      await this.adminService.validateSuperAdmin(adminUserId);
      return this.systemConfigRepository.getCategories();
    }

    // For non-admin users, only return categories that have public configs
    const allConfigs = await this.systemConfigRepository.findAll({
      isPublic: true,
    });
    const categories = [
      ...new Set(allConfigs.map((config) => config.category)),
    ];
    return categories.sort();
  }

  private validateConfigValue(value: string, schema: string): void {
    try {
      const validationSchema = JSON.parse(schema);

      // Basic validation - in a real implementation, you'd use a proper JSON schema validator
      if (validationSchema.type === 'number') {
        const numValue = Number(value);
        if (isNaN(numValue)) {
          throw new BadRequestException('Value must be a valid number');
        }
        if (
          validationSchema.min !== undefined &&
          numValue < validationSchema.min
        ) {
          throw new BadRequestException(
            `Value must be at least ${validationSchema.min}`,
          );
        }
        if (
          validationSchema.max !== undefined &&
          numValue > validationSchema.max
        ) {
          throw new BadRequestException(
            `Value must be at most ${validationSchema.max}`,
          );
        }
      }

      if (validationSchema.type === 'string') {
        if (
          validationSchema.minLength !== undefined &&
          value.length < validationSchema.minLength
        ) {
          throw new BadRequestException(
            `Value must be at least ${validationSchema.minLength} characters`,
          );
        }
        if (
          validationSchema.maxLength !== undefined &&
          value.length > validationSchema.maxLength
        ) {
          throw new BadRequestException(
            `Value must be at most ${validationSchema.maxLength} characters`,
          );
        }
        if (
          validationSchema.pattern &&
          !new RegExp(validationSchema.pattern).test(value)
        ) {
          throw new BadRequestException(
            'Value does not match required pattern',
          );
        }
      }

      if (validationSchema.enum && !validationSchema.enum.includes(value)) {
        throw new BadRequestException(
          `Value must be one of: ${validationSchema.enum.join(', ')}`,
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Invalid validation schema or value');
    }
  }
}
