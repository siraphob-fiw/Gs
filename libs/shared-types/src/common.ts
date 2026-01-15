// Common types and utilities for StrengthOS platform

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SoftDeleteEntity extends BaseEntity {
  deletedAt?: Date;
}

export interface TenantEntity extends BaseEntity {
  tenantId: string;
}

export interface AuditableEntity extends TenantEntity {
  createdBy: string;
  updatedBy: string;
}

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export interface KeyValuePair<T = any> {
  key: string;
  value: T;
}

export interface SelectOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
}

export interface FileUpload {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface NumericRange {
  min: number;
  max: number;
}