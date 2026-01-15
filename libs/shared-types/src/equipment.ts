// Equipment-related types
export interface Equipment {
  id: string;
  tenant_id: string;
  name: string;
  type: string;
  availability: 'common_gym' | 'home' | 'specialty_gym';
  category_id?: string;
  specifications?: EquipmentSpecifications;
  description?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AvailabilitySchedule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  capacity?: number;
}

export interface EquipmentSpecifications {
  weight?: number;
  length?: number;
  width?: number;
  weightRange?: {
    min: number; 
    max: number
  };
  increments?: number[];
  capacity?: number;
  features?: string[];
  dimensions?: {
    width: number;
    height: number;
    length: number;
  }
}

export interface EquipmentCategory {
  id: string;
  name: string;
  tenant_id: string;
  description: string;
  created_at: Date;
  updated_at: Date;
}

export interface EquipmentFilters {
  availability?: 'common_gym' | 'home' | 'specialty_gym';
  category_id?: string;
  is_active?: boolean;
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
  category_id?: string;
  specifications?: EquipmentSpecifications;
  description?: string;
  is_active?: boolean;
}

export interface UpdateEquipmentRequest {
  name?: string;
  tenant_id?: string;
  type?: string;
  availability?: 'common_gym' | 'home' | 'specialty_gym';
  category_id?: string;
  specifications?: EquipmentSpecifications;
  description?: string;
  is_active?: boolean;
}

export interface UpdateEquipmentCategoryRequest {
  name?: string;
  tenant_id?: string;
  description?: string;
}

export interface DeleteEquipmentCategoryRequest {
  id: string;
  tenant_id: string;
}

// User equipment profile
export interface UserEquipmentProfile {
  id: string;
  userId: string;
  tenant_id: string;
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
  tenant_id?: string;
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