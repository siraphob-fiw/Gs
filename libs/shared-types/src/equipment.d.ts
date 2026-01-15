export interface Equipment {
    id: string;
    name: string;
    type: string;
    availability: 'common_gym' | 'home' | 'specialty_gym';
    createdAt: Date;
    updatedAt: Date;
}
export interface EquipmentCategory {
    id: string;
    name: string;
    description?: string;
    parentCategoryId?: string;
    equipment: Equipment[];
    createdAt: Date;
    updatedAt: Date;
}
export interface EquipmentFilters {
    type?: string;
    availability?: string;
    search?: string;
    page?: number;
    limit?: number;
}
export interface EquipmentListResponse {
    equipment: Equipment[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export interface CreateEquipmentRequest {
    name: string;
    type: string;
    availability: 'common_gym' | 'home' | 'specialty_gym';
}
export interface UpdateEquipmentRequest {
    name?: string;
    type?: string;
    availability?: 'common_gym' | 'home' | 'specialty_gym';
}
export interface UserEquipmentProfile {
    id: string;
    userId: string;
    equipment: {
        equipmentId: string;
        quantity: number;
        notes?: string;
    }[];
    gymAccess: {
        gymName?: string;
        gymType: 'home' | 'commercial' | 'specialty' | 'other';
        availableEquipment: string[];
    };
    createdAt: Date;
    updatedAt: Date;
}
export interface UpdateEquipmentProfileRequest {
    equipment?: {
        equipmentId: string;
        quantity: number;
        notes?: string;
    }[];
    gymAccess?: {
        gymName?: string;
        gymType: 'home' | 'commercial' | 'specialty' | 'other';
        availableEquipment: string[];
    };
}
//# sourceMappingURL=equipment.d.ts.map