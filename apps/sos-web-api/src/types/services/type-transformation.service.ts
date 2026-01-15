import { Injectable } from '@nestjs/common';
import {
  UserRole,
  UserStatus,
  TenantStatus,
  WeightUnit,
  Gender,
  NotificationType,
  Results,
} from '@strengthos/shared-types';
import { plainToClass, classToPlain } from 'class-transformer';

@Injectable()
export class TypeTransformationService {
  /**
   * Transform plain object to typed class instance
   */
  transformToClass<T>(cls: new () => T, plain: any): T {
    return plainToClass(cls, plain, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });
  }

  /**
   * Transform class instance to plain object
   */
  transformToPlain<T>(instance: T): any {
    return classToPlain(instance, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Transform array of plain objects to typed class instances
   */
  transformArrayToClass<T>(cls: new () => T, plainArray: any[]): T[] {
    return plainArray.map((item) => this.transformToClass(cls, item));
  }

  /**
   * Transform array of class instances to plain objects
   */
  transformArrayToPlain<T>(instances: T[]): any[] {
    return instances.map((instance) => this.transformToPlain(instance));
  }

  /**
   * Safe type conversion with validation
   */
  safeTransform<T>(
    cls: new () => T,
    data: any,
    options?: {
      strict?: boolean;
      excludeExtraneous?: boolean;
      enableImplicitConversion?: boolean;
    },
  ): Results<T> {
    try {
      const transformed = plainToClass(cls, data, {
        excludeExtraneousValues: options?.excludeExtraneous ?? true,
        enableImplicitConversion: options?.enableImplicitConversion ?? true,
      });

      return Results.ok(transformed);
    } catch (error) {
      return Results.fail<T>(
        null,
        `Type transformation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Transform database entity to DTO
   */
  entityToDto<TEntity, TDto>(
    dtoClass: new () => TDto,
    entity: TEntity,
    transformOptions?: any,
  ): TDto {
    return plainToClass(dtoClass, entity, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
      ...transformOptions,
    });
  }

  /**
   * Transform DTO to database entity
   */
  dtoToEntity<TDto, TEntity>(
    entityClass: new () => TEntity,
    dto: TDto,
    transformOptions?: any,
  ): TEntity {
    return plainToClass(entityClass, dto, {
      excludeExtraneousValues: false,
      enableImplicitConversion: true,
      ...transformOptions,
    });
  }

  /**
   * Transform enum string to enum value with validation
   */
  transformEnum<T extends Record<string, string>>(
    enumObject: T,
    value: string,
    defaultValue?: T[keyof T],
  ): T[keyof T] | undefined {
    const enumValues = Object.values(enumObject);

    if (enumValues.includes(value as T[keyof T])) {
      return value as T[keyof T];
    }

    return defaultValue;
  }

  /**
   * Transform user role string to UserRole enum
   */
  transformUserRole(role: string): UserRole | undefined {
    return this.transformEnum(UserRole, role, UserRole.ATHLETE);
  }

  /**
   * Transform user status string to UserStatus enum
   */
  transformUserStatus(status: string): UserStatus | undefined {
    return this.transformEnum(UserStatus, status, UserStatus.ACTIVE);
  }

  /**
   * Transform tenant status string to TenantStatus enum
   */
  transformTenantStatus(status: string): TenantStatus | undefined {
    return this.transformEnum(TenantStatus, status, TenantStatus.ACTIVE);
  }

  /**
   * Transform weight unit string to WeightUnit enum
   */
  transformWeightUnit(unit: string): WeightUnit | undefined {
    return this.transformEnum(WeightUnit, unit, WeightUnit.KG);
  }

  /**
   * Transform gender string to Gender enum
   */
  transformGender(gender: string): Gender | undefined {
    return this.transformEnum(Gender, gender, Gender.PREFER_NOT_TO_SAY);
  }

  /**
   * Transform notification type string to NotificationType enum
   */
  transformNotificationType(type: string): NotificationType | undefined {
    return this.transformEnum(NotificationType, type);
  }

  /**
   * Transform date string to Date object with validation
   */
  transformDate(dateString: string | Date): Date | null {
    if (dateString instanceof Date) {
      return dateString;
    }

    if (typeof dateString === 'string') {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    }

    return null;
  }

  /**
   * Transform number string to number with validation
   */
  transformNumber(
    value: string | number,
    options?: {
      min?: number;
      max?: number;
      integer?: boolean;
    },
  ): number | null {
    let num: number;

    if (typeof value === 'number') {
      num = value;
    } else if (typeof value === 'string') {
      num = options?.integer ? parseInt(value, 10) : parseFloat(value);
    } else {
      return null;
    }

    if (isNaN(num)) {
      return null;
    }

    if (options?.min !== undefined && num < options.min) {
      return null;
    }

    if (options?.max !== undefined && num > options.max) {
      return null;
    }

    return num;
  }

  /**
   * Transform boolean string to boolean
   */
  transformBoolean(value: string | boolean): boolean | null {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      if (lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes') {
        return true;
      }
      if (lowerValue === 'false' || lowerValue === '0' || lowerValue === 'no') {
        return false;
      }
    }

    return null;
  }

  /**
   * Deep clone object with type safety
   */
  deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime()) as unknown as T;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.deepClone(item)) as unknown as T;
    }

    const cloned = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }

    return cloned;
  }

  /**
   * Merge objects with type safety
   */
  mergeObjects<T extends Record<string, any>>(
    target: T,
    ...sources: Partial<T>[]
  ): T {
    const result = this.deepClone(target);

    for (const source of sources) {
      if (source) {
        for (const key in source) {
          if (
            Object.prototype.hasOwnProperty.call(source, key) &&
            source[key] !== undefined
          ) {
            if (
              typeof result[key] === 'object' &&
              result[key] !== null &&
              !Array.isArray(result[key]) &&
              !((result[key] as any) instanceof Date) &&
              typeof source[key] === 'object' &&
              source[key] !== null &&
              !Array.isArray(source[key]) &&
              !((source[key] as any) instanceof Date)
            ) {
              result[key] = this.mergeObjects(result[key], source[key]);
            } else {
              result[key] = source[key] as T[Extract<keyof T, string>];
            }
          }
        }
      }
    }

    return result;
  }

  /**
   * Pick specific properties from object with type safety
   */
  pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    const result = {} as Pick<T, K>;

    for (const key of keys) {
      if (key in obj) {
        result[key] = obj[key];
      }
    }

    return result;
  }

  /**
   * Omit specific properties from object with type safety
   */
  omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
    const result = { ...obj } as any;

    for (const key of keys) {
      delete result[key];
    }

    return result as Omit<T, K>;
  }

  /**
   * Transform pagination parameters
   */
  transformPaginationParams(params: {
    page?: string | number;
    limit?: string | number;
    sortBy?: string;
    sortOrder?: string;
  }): {
    page: number;
    limit: number;
    offset: number;
    sortBy?: string;
    sortOrder: 'asc' | 'desc';
  } {
    const page =
      this.transformNumber(params.page || 1, { min: 1, integer: true }) || 1;
    const limit =
      this.transformNumber(params.limit || 20, {
        min: 1,
        max: 100,
        integer: true,
      }) || 20;
    const offset = (page - 1) * limit;
    const sortOrder = params.sortOrder === 'desc' ? 'desc' : 'asc';

    return {
      page,
      limit,
      offset,
      sortBy: params.sortBy,
      sortOrder,
    };
  }
}
