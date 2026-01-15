// Service Interfaces
// Moved from human-lift-training-api/src/Types/SharedTypes.ts

import { Results } from './shared-types';
import { UserRole } from './shared-types';
import { PaymentMethod, Subscription, Invoice } from './payment-types';
import { Permission } from './security-types';

// Payment Processing Service Interface
export interface IPaymentProcessingService {
  processPayment(request: any): Promise<Results<any>>;
  getPaymentMethods(tenantId: string): Promise<Results<PaymentMethod[]>>;
  createPaymentMethod(tenantId: string, paymentData: any): Promise<Results<PaymentMethod>>;
  getSubscription(subscriptionId: string): Promise<Results<Subscription>>;
  generateInvoice(subscriptionId: string): Promise<Results<Invoice>>;
}

// Tenant Context Service Interface
export interface ITenantContextService {
  validateTenantAccess(userId: string, tenantId: string): Promise<boolean>;
  getCurrentTenantId(request?: any): Promise<string>;
  setTenantContext(tenantId: string): Promise<void>;
  refreshTenantStats?(): Promise<void>;
}

// Access Control Service Interface
export interface IAccessControlService {
  checkPermission(userId: string, resource: string, action: string): Promise<boolean>;
  getUserPermissions(userId: string): Promise<Results<UserRole | null>>;
  assignRole(userId: string, role: UserRole, assignedBy: string): Promise<void>;
  revokeRole(userId: string, role: UserRole, revokedBy: string): Promise<void>;
  validateTenantAccess(userId: string, tenantId: string): Promise<boolean>;
}