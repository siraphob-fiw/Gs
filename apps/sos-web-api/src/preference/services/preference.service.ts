import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PreferenceRepository } from '../repositories/preference.repository';
import { PreferenceValidationService } from './preference-validation.service';
import {
  UserPreferenceEntity,
  PreferenceSchemaEntity,
  PreferenceCategoryEntity,
} from '../entities/preference.entity';
import {
  CreateUserPreferenceDto,
  UpdateUserPreferenceDto,
  BulkUpdatePreferencesDto,
} from '../dto/preference-request.dto';
import {
  UserPreferencesGroupedResponseDto,
  BulkPreferenceUpdateResponseDto,
  UserPreferenceResponseDto,
} from '../dto/preference-response.dto';
import { CacheService } from '../../shared/cache/cache.service';
import { UserService } from '../../user/services/user.service';

@Injectable()
export class PreferenceService {
  private readonly CACHE_PREFIX = 'user_preferences:';
  private readonly CACHE_TTL = 1800; // 30 minutes

  constructor(
    private readonly preferenceRepository: PreferenceRepository,
    private readonly preferenceValidationService: PreferenceValidationService,
    private readonly cacheService: CacheService,
    private readonly userService: UserService,
  ) {}

  async createUserPreference(
    userId: string,
    preferenceDto: CreateUserPreferenceDto,
  ): Promise<UserPreferenceEntity> {
    // Validate user exists
    await this.validateUserExists(userId);

    // Check if preference already exists
    const existingPreference =
      await this.preferenceRepository.findUserPreferenceByKey(
        userId,
        preferenceDto.key,
      );
    if (existingPreference) {
      throw new ConflictException(
        `Preference with key '${preferenceDto.key}' already exists for this user`,
      );
    }

    // Validate preference value
    await this.preferenceValidationService.validatePreferenceValue(
      preferenceDto.key,
      preferenceDto.value,
    );

    const preference = await this.preferenceRepository.createUserPreference(
      userId,
      preferenceDto,
    );

    // Clear cache for this user
    await this.clearUserPreferencesCache(userId);

    return preference;
  }

  async getUserPreferences(
    userId: string,
    filters?: { category?: string; key?: string },
  ): Promise<UserPreferenceEntity[]> {
    // Validate user exists
    await this.validateUserExists(userId);

    // Try to get from cache if no filters
    if (!filters?.category && !filters?.key) {
      const cacheResult = await this.cacheService.getTenantData<
        UserPreferenceEntity[]
      >('user', `${this.CACHE_PREFIX}${userId}`);
      if (cacheResult.isOk && cacheResult.returnValue) {
        return cacheResult.returnValue;
      }
    }

    const preferences = await this.preferenceRepository.findUserPreferences(
      userId,
      filters,
    );

    // Cache all preferences if no filters
    if (!filters?.category && !filters?.key) {
      await this.cacheService.setTenantData(
        'user',
        `${this.CACHE_PREFIX}${userId}`,
        preferences,
        this.CACHE_TTL,
      );
    }

    return preferences;
  }

  async getUserPreferenceByKey(
    userId: string,
    key: string,
  ): Promise<UserPreferenceEntity> {
    // Validate user exists
    await this.validateUserExists(userId);

    const preference = await this.preferenceRepository.findUserPreferenceByKey(
      userId,
      key,
    );
    if (!preference) {
      // Try to get default value from schema
      const defaultValue =
        await this.preferenceValidationService.getDefaultValue(key);
      if (defaultValue !== null) {
        // Create preference with default value
        const schema =
          await this.preferenceRepository.findPreferenceSchemaByKey(key);
        const defaultPreference: CreateUserPreferenceDto = {
          key,
          value: defaultValue,
          category: schema?.category || 'general',
          isPrivate: false,
        };
        return this.preferenceRepository.createUserPreference(
          userId,
          defaultPreference,
        );
      }
      throw new NotFoundException('Preference not found');
    }

    return preference;
  }

  async updateUserPreference(
    userId: string,
    key: string,
    updateDto: UpdateUserPreferenceDto,
  ): Promise<UserPreferenceEntity> {
    // Validate user exists
    await this.validateUserExists(userId);

    // Validate preference update
    if (updateDto.value !== undefined) {
      await this.preferenceValidationService.validatePreferenceUpdate(
        key,
        updateDto.value,
        userId,
      );
    }

    const updatedPreference =
      await this.preferenceRepository.updateUserPreference(
        userId,
        key,
        updateDto,
      );
    if (!updatedPreference) {
      throw new NotFoundException('Preference not found');
    }

    // Clear cache for this user
    await this.clearUserPreferencesCache(userId);

    return updatedPreference;
  }

  async upsertUserPreference(
    userId: string,
    preferenceDto: CreateUserPreferenceDto,
  ): Promise<UserPreferenceEntity> {
    // Validate user exists
    await this.validateUserExists(userId);

    // Validate preference value
    await this.preferenceValidationService.validatePreferenceValue(
      preferenceDto.key,
      preferenceDto.value,
    );

    const preference = await this.preferenceRepository.upsertUserPreference(
      userId,
      preferenceDto,
    );

    // Clear cache for this user
    await this.clearUserPreferencesCache(userId);

    return preference;
  }

  async deleteUserPreference(userId: string, key: string): Promise<void> {
    // Validate user exists
    await this.validateUserExists(userId);

    // Check if preference is required
    const isRequired =
      await this.preferenceValidationService.isPreferenceRequired(key);
    if (isRequired) {
      throw new BadRequestException(
        `Preference '${key}' is required and cannot be deleted`,
      );
    }

    const deleted = await this.preferenceRepository.deleteUserPreference(
      userId,
      key,
    );
    if (!deleted) {
      throw new NotFoundException('Preference not found');
    }

    // Clear cache for this user
    await this.clearUserPreferencesCache(userId);
  }

  async bulkUpdateUserPreferences(
    userId: string,
    bulkUpdateDto: BulkUpdatePreferencesDto,
  ): Promise<BulkPreferenceUpdateResponseDto> {
    // Validate user exists
    await this.validateUserExists(userId);

    const results: BulkPreferenceUpdateResponseDto = {
      updated: 0,
      failed: 0,
      errors: [],
      preferences: [],
    };

    const validPreferences: CreateUserPreferenceDto[] = [];

    // Validate all preferences first
    for (const pref of bulkUpdateDto.preferences) {
      try {
        await this.preferenceValidationService.validatePreferenceValue(
          pref.key,
          pref.value,
        );
        validPreferences.push({
          key: pref.key,
          value: pref.value,
          category: pref.category || 'general',
          isPrivate: pref.isPrivate || false,
          metadata: pref.metadata,
        });
      } catch (error) {
        results.failed++;
        results.errors.push({
          key: pref.key,
          error: error.message,
        });
      }
    }

    // Bulk upsert valid preferences
    if (validPreferences.length > 0) {
      try {
        const updatedPreferences =
          await this.preferenceRepository.bulkUpsertUserPreferences(
            userId,
            validPreferences,
          );
        results.updated = updatedPreferences.length;
        results.preferences = updatedPreferences.map((pref) =>
          UserPreferenceResponseDto.fromEntity(pref),
        );

        // Clear cache for this user
        await this.clearUserPreferencesCache(userId);
      } catch (error) {
        // If bulk operation fails, try individual operations
        Logger.error('Failed to bulk update preferences', error);
        for (const pref of validPreferences) {
          try {
            const updated =
              await this.preferenceRepository.upsertUserPreference(
                userId,
                pref,
              );
            results.preferences.push(
              UserPreferenceResponseDto.fromEntity(updated),
            );
            results.updated++;
          } catch (individualError) {
            results.failed++;
            results.errors.push({
              key: pref.key,
              error: individualError.message,
            });
          }
        }
      }
    }

    return results;
  }

  async getUserPreferencesGrouped(
    userId: string,
  ): Promise<UserPreferencesGroupedResponseDto[]> {
    // Validate user exists
    await this.validateUserExists(userId);

    const categories =
      await this.preferenceRepository.findPreferenceCategories(true);
    const schemas = await this.preferenceRepository.findPreferenceSchemas();
    const userPreferences = await this.getUserPreferences(userId);

    const grouped: UserPreferencesGroupedResponseDto[] = [];

    for (const category of categories) {
      const categorySchemas = schemas.filter(
        (schema) => schema.category === category.name,
      );
      const categoryPreferences = userPreferences.filter(
        (pref) => pref.category === category.name,
      );

      // Add default preferences for missing required preferences
      for (const schema of categorySchemas) {
        if (
          schema.isRequired &&
          !categoryPreferences.find((pref) => pref.key === schema.key)
        ) {
          const defaultValue = schema.defaultValue;
          if (defaultValue !== null && defaultValue !== undefined) {
            try {
              const defaultPreference =
                await this.preferenceRepository.upsertUserPreference(userId, {
                  key: schema.key,
                  value: defaultValue,
                  category: schema.category,
                  isPrivate: false,
                });
              categoryPreferences.push(defaultPreference);
            } catch (error) {
              Logger.error('Failed to create default preference', error);
            }
          }
        }
      }

      grouped.push({
        category: {
          id: category.id,
          name: category.name,
          displayName: category.displayName,
          description: category.description,
          icon: category.icon,
          sortOrder: category.sortOrder,
          isActive: category.isActive,
          createdAt: category.created_at,
          updatedAt: category.updated_at,
        },
        schemas: categorySchemas.map((schema) => ({
          id: schema.id,
          key: schema.key,
          category: schema.category,
          displayName: schema.displayName,
          description: schema.description,
          dataType: schema.dataType,
          defaultValue: schema.defaultValue,
          validationRules: schema.validationRules,
          isRequired: schema.isRequired,
          isUserEditable: schema.isUserEditable,
          sortOrder: schema.sortOrder,
          createdAt: schema.created_at,
          updatedAt: schema.updated_at,
        })),
        preferences: categoryPreferences.map((pref) => ({
          id: pref.id,
          userId: pref.userId,
          key: pref.key,
          value: pref.value,
          category: pref.category,
          isPrivate: pref.isPrivate,
          metadata: pref.metadata,
          createdAt: pref.created_at,
          updatedAt: pref.updated_at,
        })),
      });
    }

    return grouped;
  }

  async resetUserPreferencesToDefaults(
    userId: string,
    category?: string,
  ): Promise<UserPreferenceEntity[]> {
    // Validate user exists
    await this.validateUserExists(userId);

    // Delete existing preferences
    if (category) {
      await this.preferenceRepository.deleteUserPreferencesByCategory(
        userId,
        category,
      );
    } else {
      // Delete all user preferences - this would need a method in repository
      const allPreferences = await this.getUserPreferences(userId);
      for (const pref of allPreferences) {
        await this.preferenceRepository.deleteUserPreference(userId, pref.key);
      }
    }

    // Get schemas and create default preferences
    const schemas = await this.preferenceRepository.findPreferenceSchemas(
      category ? { category } : undefined,
    );
    const defaultPreferences: CreateUserPreferenceDto[] = [];

    for (const schema of schemas) {
      if (schema.defaultValue !== null && schema.defaultValue !== undefined) {
        defaultPreferences.push({
          key: schema.key,
          value: schema.defaultValue,
          category: schema.category,
          isPrivate: false,
        });
      }
    }

    let createdPreferences: UserPreferenceEntity[] = [];
    if (defaultPreferences.length > 0) {
      createdPreferences =
        await this.preferenceRepository.bulkUpsertUserPreferences(
          userId,
          defaultPreferences,
        );
    }

    // Clear cache for this user
    await this.clearUserPreferencesCache(userId);

    return createdPreferences;
  }

  async getPreferenceSchemas(
    category?: string,
  ): Promise<PreferenceSchemaEntity[]> {
    return this.preferenceRepository.findPreferenceSchemas(
      category ? { category } : undefined,
    );
  }

  async getPreferenceCategories(): Promise<PreferenceCategoryEntity[]> {
    return this.preferenceRepository.findPreferenceCategories(true);
  }

  private async validateUserExists(userId: string): Promise<void> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
  }

  private async clearUserPreferencesCache(userId: string): Promise<void> {
    await this.cacheService.deleteTenantData(
      'user',
      `${this.CACHE_PREFIX}${userId}`,
    );
  }
}
