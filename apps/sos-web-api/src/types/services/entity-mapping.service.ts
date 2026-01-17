import { Injectable } from '@nestjs/common';
import {
  User,
  Tenant,
  UserRole,
  UserStatus,
  TenantStatus,
  Results,
  TenantSettings,
  SubscriptionInfo,
  BillingInfo,
  tenantWithSubscription,
} from '@strengthos/shared-types';
import { TypeTransformationService } from './type-transformation.service';
import { DatabaseService } from '@/database';

// Database entity interfaces (these would typically be defined elsewhere)
export interface UserEntity {
  id: string;
  email: string;
  phone_number?: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: string;
  status: string;
  phone_verified: boolean;
  phone_verified_at?: Date;
  tenant_id: string;
  phone?: string; // Legacy field for backward compatibility
  date_of_birth?: Date;
  gender?: string;
  body_weight?: number;
  height?: number;
  experience_level?: string;
  preferences?: any;
  equipment_profiles?: any;
  health_considerations?: any;
  auth_providers?: any;
  whatsapp_data?: any;
  line_data?: any;
  last_login_at?: Date;
  email_verified_at?: Date;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface TenantEntity {
  id: string;
  name: string;
  description?: string;
  status: string;
  settings: TenantSettings;
  subscription_info: string;
  subscription_info_details: SubscriptionInfo | null;
  billing_info: BillingInfo;
  contact: { [key: string]: string };
  availableEquipment?: string[];
  created_at: Date;
  updated_at: Date;
  suspended_at?: Date | null;
}

// DTO interfaces
export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  tenantId: string;
  phone?: string;
  dateOfBirth?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantDto {
  id: string;
  name: string;
  status: TenantStatus;
  settings: TenantSettings;
  subscription_info: string;
  subscription_info_details: SubscriptionInfo | null;
  billing_info: BillingInfo;
  created_at: Date;
  updated_at: Date;
  suspended_at: Date | null;
}

@Injectable()
export class EntityMappingService {
  constructor(
    private readonly typeTransformationService: TypeTransformationService,
    private readonly databaseService: DatabaseService,
  ) { }

  /**
   * Map database user entity to domain user object
   */
  async mapUserEntityToUser(entity: UserEntity): Promise<Results<User>> {
    try {
      const role = this.typeTransformationService.transformUserRole(
        entity.role,
      );
      const status = this.typeTransformationService.transformUserStatus(
        entity.status,
      );

      const tenant = await this.databaseService
        .knex('tenants')
        .where('id', entity.tenant_id)
        .first();

      if (!tenant) {
        return Results.fail<User>(null, `Invalid tenant: ${entity.tenant_id}`);
      }

      if (!role) {
        return Results.fail<User>(null, `Invalid user role: ${entity.role}`);
      }

      if (!status) {
        return Results.fail<User>(
          null,
          `Invalid user status: ${entity.status}`,
        );
      }

      const user: User = {
        id: entity.id,
        email: entity.email,
        firstName: entity.first_name,
        lastName: entity.last_name,
        role,
        tenantId: entity.tenant_id,
        tenantName: tenant.name,
        freePlan: tenant.free_plan,
        isActive: entity.status === 'ACTIVE',
        createdAt: entity.created_at,
        updatedAt: entity.updated_at,
      };

      return Results.ok(user);
    } catch (error) {
      return Results.fail<User>(
        null,
        `Failed to map user entity: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Map domain user object to database user entity
   */
  mapUserToUserEntity(
    user: User,
    passwordHash?: string,
  ): Results<Partial<UserEntity>> {
    try {
      const entity: Partial<UserEntity> & { tenant_name?: string } = {
        id: user.id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        role: user.role,
        status: user.isActive ? 'ACTIVE' : 'INACTIVE',
        tenant_id: user.tenantId,
        tenant_name: user.tenantName || '',
        created_at: user.createdAt,
        updated_at: user.updatedAt,
      };

      if (passwordHash) {
        entity.password_hash = passwordHash;
      }

      return Results.ok(entity);
    } catch (error) {
      return Results.fail<Partial<UserEntity>>(
        null,
        `Failed to map user to entity: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Map database user entity to user DTO
   */
  mapUserEntityToDto(entity: UserEntity): Results<UserDto> {
    try {
      const role = this.typeTransformationService.transformUserRole(
        entity.role,
      );
      const status = this.typeTransformationService.transformUserStatus(
        entity.status,
      );

      if (!role) {
        return Results.fail<UserDto>(null, `Invalid user role: ${entity.role}`);
      }

      if (!status) {
        return Results.fail<UserDto>(
          null,
          `Invalid user status: ${entity.status}`,
        );
      }

      const dto: UserDto = {
        id: entity.id,
        email: entity.email,
        firstName: entity.first_name,
        lastName: entity.last_name,
        role,
        status,
        tenantId: entity.tenant_id,
        phone: entity.phone,
        dateOfBirth: entity.date_of_birth,
        createdAt: entity.created_at,
        updatedAt: entity.updated_at,
      };

      return Results.ok(dto);
    } catch (error) {
      return Results.fail<UserDto>(
        null,
        `Failed to map user entity to DTO: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Map database tenant entity to domain tenant object
   */
  mapTenantEntityToTenant(entity: TenantEntity): Results<tenantWithSubscription> {
    try {
      const status = this.typeTransformationService.transformTenantStatus(
        entity.status,
      );

      if (!status) {
        return Results.fail<tenantWithSubscription>(
          null,
          `Invalid tenant status: ${entity.status}`,
        );
      }

      const tenant: tenantWithSubscription = {
        id: entity.id,
        name: entity.name,
        description: entity.description,
        status: status as any, // Cast to simple TenantStatus
        settings: entity.settings,
        subscription_info: entity.subscription_info,
        subscription_info_details: entity.subscription_info_details,
        billing_info: entity.billing_info,
        contact: entity.contact,
        availableEquipment: entity.availableEquipment,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
        suspended_at: entity.suspended_at || null,
      };

      return Results.ok(tenant);
    } catch (error) {
      return Results.fail<tenantWithSubscription>(
        null,
        `Failed to map tenant entity: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Map domain tenant object to database tenant entity
   */
  mapTenantToTenantEntity(tenant: Tenant): Results<Partial<TenantEntity>> {
    try {
      const entity: Partial<TenantEntity> = {
        id: tenant.id,
        name: tenant.name,
        status: tenant.status,
        settings: tenant.settings,
        subscription_info: tenant.subscription_info,
        billing_info: tenant.billing_info,
        contact: tenant.contact,
        availableEquipment: tenant.availableEquipment,
        created_at: tenant.created_at,
        updated_at: tenant.updated_at,
        suspended_at: tenant.suspended_at,
      };

      return Results.ok(entity);
    } catch (error) {
      return Results.fail<Partial<TenantEntity>>(
        null,
        `Failed to map tenant to entity: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Map database tenant entity to tenant DTO
   */
  mapTenantEntityToDto(entity: TenantEntity): Results<TenantDto> {
    try {
      const status = this.typeTransformationService.transformTenantStatus(
        entity.status,
      );

      if (!status) {
        return Results.fail<TenantDto>(
          null,
          `Invalid tenant status: ${entity.status}`,
        );
      }

      const dto: TenantDto = {
        id: entity.id,
        name: entity.name,
        status,
        settings: entity.settings,
        subscription_info: entity.subscription_info,
        subscription_info_details: entity.subscription_info_details,
        billing_info: entity.billing_info,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
        suspended_at: entity.suspended_at || null,
      };

      return Results.ok(dto);
    } catch (error) {
      return Results.fail<TenantDto>(
        null,
        `Failed to map tenant entity to DTO: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Map array of entities to array of DTOs
   */
  mapEntitiesToDtos<TEntity, TDto>(
    entities: TEntity[],
    mapper: (entity: TEntity) => Results<TDto>,
  ): Results<TDto[]> {
    try {
      const dtos: TDto[] = [];
      const errors: string[] = [];

      for (const entity of entities) {
        const result = mapper(entity);
        if (result.success && result.data) {
          dtos.push(result.data);
        } else {
          errors.push(result.message || 'Mapping failed');
        }
      }

      if (errors.length > 0) {
        return Results.fail<TDto[]>(
          dtos,
          `Some entities failed to map: ${errors.join(', ')}`,
        );
      }

      return Results.ok(dtos);
    } catch (error) {
      return Results.fail<TDto[]>(
        [],
        `Batch mapping failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Map user entities to user DTOs
   */
  mapUserEntitiesToDtos(entities: UserEntity[]): Results<UserDto[]> {
    return this.mapEntitiesToDtos(entities, (entity) =>
      this.mapUserEntityToDto(entity),
    );
  }

  /**
   * Map tenant entities to tenant DTOs
   */
  mapTenantEntitiesToDtos(entities: TenantEntity[]): Results<TenantDto[]> {
    return this.mapEntitiesToDtos(entities, (entity) =>
      this.mapTenantEntityToDto(entity),
    );
  }

  /**
   * Generic mapping with custom transformation
   */
  mapWithTransformation<TSource, TTarget>(
    source: TSource,
    transformationRules: Record<keyof TTarget, (source: TSource) => any>,
  ): Results<TTarget> {
    try {
      const target = {} as TTarget;

      for (const [targetKey, transformer] of Object.entries(
        transformationRules,
      )) {
        try {
          target[targetKey as keyof TTarget] = (transformer as any)(source);
        } catch (error) {
          return Results.fail<TTarget>(
            null,
            `Transformation failed for field ${targetKey}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
      }

      return Results.ok(target);
    } catch (error) {
      return Results.fail<TTarget>(
        null,
        `Generic mapping failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Map database column names to camelCase
   */
  mapSnakeCaseToCamelCase<T extends Record<string, any>>(
    obj: T,
  ): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
        letter.toUpperCase(),
      );
      result[camelKey] = value;
    }

    return result;
  }

  /**
   * Map camelCase to database column names
   */
  mapCamelCaseToSnakeCase<T extends Record<string, any>>(
    obj: T,
  ): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = key.replace(
        /[A-Z]/g,
        (letter) => `_${letter.toLowerCase()}`,
      );
      result[snakeKey] = value;
    }

    return result;
  }

  /**
   * Create mapping configuration for automatic entity-DTO conversion
   */
  createMappingConfig<TEntity, TDto>(config: {
    entityToDto: Record<keyof TDto, keyof TEntity | ((entity: TEntity) => any)>;
    dtoToEntity?: Record<keyof TEntity, keyof TDto | ((dto: TDto) => any)>;
  }) {
    return {
      mapEntityToDto: (entity: TEntity): Results<TDto> => {
        try {
          const dto = {} as TDto;

          for (const [dtoKey, entityKeyOrTransformer] of Object.entries(
            config.entityToDto,
          )) {
            if (typeof entityKeyOrTransformer === 'function') {
              dto[dtoKey as keyof TDto] = entityKeyOrTransformer(entity);
            } else {
              dto[dtoKey as keyof TDto] = entity[
                entityKeyOrTransformer as keyof TEntity
              ] as any;
            }
          }

          return Results.ok(dto);
        } catch (error) {
          return Results.fail<TDto>(
            null,
            `Entity to DTO mapping failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
      },

      mapDtoToEntity: config.dtoToEntity
        ? (dto: TDto): Results<Partial<TEntity>> => {
          try {
            const entity = {} as Partial<TEntity>;

            for (const [entityKey, dtoKeyOrTransformer] of Object.entries(
              config.dtoToEntity!,
            )) {
              if (typeof dtoKeyOrTransformer === 'function') {
                entity[entityKey as keyof TEntity] = dtoKeyOrTransformer(dto);
              } else {
                entity[entityKey as keyof TEntity] = dto[
                  dtoKeyOrTransformer as keyof TDto
                ] as any;
              }
            }

            return Results.ok(entity);
          } catch (error) {
            return Results.fail<Partial<TEntity>>(
              null,
              `DTO to entity mapping failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
          }
        }
        : undefined,
    };
  }
}
