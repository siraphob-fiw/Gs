import { BaseEntity } from '../../types/entities/base.entity';

export type EquipmentAvailability = 'common_gym' | 'home' | 'specialty_gym';

export interface EquipmentSpecifications {
    weight?: number;
    length?: number;
    width?: number;
    weightRange?: {
        min: number;
        max: number;
    };
    increments?: number[];
    capacity?: number;
    features?: string[];
    dimensions?: {
        width: number;
        height: number;
        length: number;
    };
}

export interface EquipmentEntity extends BaseEntity {
    name: string;
    type: string;
    availability: EquipmentAvailability;
    category_id?: string;
    specifications?: EquipmentSpecifications;
    description?: string;
    is_active: boolean;
}

export interface EquipmentCategoryEntity extends BaseEntity {
    name: string;
    description?: string;
}

export interface EquipmentListResponseDto {
    equipments: EquipmentEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface EquipmentCategoryListResponseDto {
    categories: EquipmentCategoryEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
