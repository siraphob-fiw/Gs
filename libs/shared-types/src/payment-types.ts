// Payment and Billing Types
// Moved from human-lift-training-api/src/Types/SharedTypes.ts

// Payment Enums
export enum BillingPeriod {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY'
}

export enum UsageMetricType {
  ACTIVE_USERS = 'ACTIVE_USERS',
  ACTIVE_COACHES = 'ACTIVE_COACHES',
  STORAGE_USED = 'STORAGE_USED',
  API_CALLS = 'API_CALLS',
  NOTIFICATIONS_SENT = 'NOTIFICATIONS_SENT'
}

export enum ExportFormat {
  JSON = 'JSON',
  CSV = 'CSV',
  XML = 'XML',
  PDF = 'PDF'
}

// Payment Interfaces
export interface PaymentRequest {
  amount: number;
  currency: string;
  customerId: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export interface PaymentMethod {
  id: string;
  tenantId: string;
  type: string;
  provider: string;
  details: Record<string, any>;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  tenantId: string;
  subscriptionId: string;
  number: string;
  status: string;
  amount: number;
  currency: string;
  dueDate: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Usage and Billing Types
export interface UsageData {
  tenantId: string;
  metricType: UsageMetricType;
  value: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface UsageMetrics {
  tenantId: string;
  period: BillingPeriod;
  metrics: Record<string, number>;
  limits: Record<string, number>;
  overages: Record<string, number>;
}

export interface UsageReport {
  tenantId: string;
  period: BillingPeriod;
  startDate: Date;
  endDate: Date;
  metrics: UsageMetrics;
  costs: Record<string, number>;
  totalCost: number;
}

// Subscription interface (moved from shared-types.ts)
export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  TRIAL = 'TRIAL'
}

export interface Subscription {
  id: string;
  tenant_id: string;  
  plan_id: string;
  status: SubscriptionStatus;
  start_date: Date;
  end_date: Date;
  auto_renew: boolean;
  createdAt: Date;
  updatedAt: Date;
}