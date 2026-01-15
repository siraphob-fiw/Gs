// Core shared types, enums, and interfaces
// Moved from human-lift-training-api/src/Types/SharedTypes.ts

import { TenantStatus } from './user-management-enums';

// Re-export TenantStatus for compatibility
export { TenantStatus };

// Results class with proper typing
export class Results<T> {
  public success: boolean;
  public data: T | null;
  public message: string | null;
  public error: string | null;

  constructor(success: boolean, data: T | null = null, message: string | null = null, error: string | null = null) {
    this.success = success;
    this.data = data;
    this.message = message;
    this.error = error;
  }

  // Compatibility properties
  get isError(): boolean {
    return !this.success;
  }

  get isSuccess(): boolean {
    return this.success;
  }

  static ok<T>(data: T, message?: string): Results<T> {
    return new Results<T>(true, data, message || null);
  }

  static fail<T>(data: T | null = null, message?: string): Results<T> {
    return new Results<T>(false, data, null, message || null);
  }
}

// Core User and Security Enums
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  TENANT_ADMIN = 'TENANT_ADMIN',
  COACH = 'COACH',
  COACH_ADMIN = 'COACH_ADMIN',
  ATHLETE = 'ATHLETE',
  SELF_COACHED = 'SELF_COACHED',
  USER = 'USER'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  DEACTIVATED = 'DEACTIVATED'
}

// SecurityEventType moved to security-monitoring.ts for comprehensive coverage

// Tenant and Subscription Enums
// TenantStatus is now imported from user-management-enums.ts for consistency

// SubscriptionStatus moved to payment-types.ts

// Basic Enums
export enum WeightUnit {
  KG = 'KG',
  LBS = 'LBS'
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY'
}

export enum NotificationType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
  WORKOUT_REMINDER = 'WORKOUT_REMINDER',
  COACH_MESSAGE = 'COACH_MESSAGE',
  TRANSITION_REQUEST = 'TRANSITION_REQUEST',
  TRANSITION_APPROVED = 'TRANSITION_APPROVED',
  TRANSITION_REJECTED = 'TRANSITION_REJECTED',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
  WELCOME = 'WELCOME',
  SECURITY_ALERT = 'SECURITY_ALERT'
}

// Core Interfaces
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId: string;
  tenantName: string;
  freePlan: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tenant {
  id: string;
  name: string;
  description: string;
  status: TenantStatus;
  settings: TenantSettings;
  subscription_info: string; //SubscriptionInfo;
  billing_info: BillingInfo;
  contact: { [key: string]: string };
  created_at: Date;
  updated_at: Date;
  suspended_at: Date | null;
}

export interface tenantWithSubscription extends Tenant {
  subscription_info_details: SubscriptionInfo | null;
}

// Tenant Settings
export interface TenantSettings {
  allowSelfCoached: boolean;
  requireCoachApproval: boolean;
  enableVideoAnalysis: boolean;
  defaultLanguage: string;
  availableLanguages: string[];
  maxCoaches: number;
  maxAthletes: number;
  logo?: string;
  complianceSettings: ComplianceSettings;
}

export interface ComplianceSettings {
  gdprEnabled: boolean;
  pdpaEnabled: boolean;
  hipaaEnabled: boolean;
}

// Subscription and Billing
export interface SubscriptionInfo {
  planId: string;
  status: string;
  start_date?: Date;
  end_date?: Date;
  auto_renew?: boolean;
}

export interface BillingInfo {
  amount: number;
  currency: string;
  billingCycle: string | 'MONTHLY' | 'YEARLY' | 'QUARTERLY';
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

// Subscription interface moved to payment-types.ts

// Error handling
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

// Request Context Types
export interface RequestContext {
  userId?: string;
  tenantId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

// Logging interfaces
export interface LogData {
  message: string;
  fullMessage?: string;
  level?: string;
  timestamp?: Date;
  userId?: string;
  tenantId?: string;
  method?: string;
  [key: string]: any;
}

export interface ILogger {
  info(data: LogData): Promise<void>;
  warn(data: LogData): Promise<void>;
  error(data: LogData): Promise<void>;
  debug(data: LogData): Promise<void>;
}
