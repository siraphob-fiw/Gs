// Coaching-related types for the frontend

import { WeeklyAvailability } from '@strengthos/shared-types/src/user-management';

export interface CoachDiscoveryProfile {
  id: string;
  coachId: string;
  tenantId: string;
  bio?: string;
  specializations: string[];
  certifications: string[];
  availability: WeeklyAvailability;
  socialLinks: string[];
  hourlyRate?: number;
  currency?: string;
  is_available: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactPreference {
  method: 'EMAIL' | 'WHATSAPP' | 'LINE' | 'PHONE';
  value: string;
  isPreferred: boolean;
  isPublic: boolean;
}

export interface CoachRequest {
  id: string;
  tenantId: string;
  athleteId: string;
  coachId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';
  message?: string;
  requestedAt: Date;
  respondedAt?: Date;
  responseMessage?: string;
  expiresAt: Date;
  metadata?: Record<string, string>;
}

export interface CreateCoachRequestRequest {
  coachId: string;
  message?: string;
  expiresIn?: number; // Hours until expiration, default 72
}

export interface RespondToCoachRequestRequest {
  status: 'ACCEPTED' | 'REJECTED';
  responseMessage?: string;
}

export interface CoachAthleteRelationship {
  id: string;
  tenantId: string;
  coachId: string;
  athleteId: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'TERMINATED';
  permissions: CoachPermission[];
  notes?: string;
  startDate: Date;
  endDate?: Date;
  createdBy?: string;
  terminatedBy?: string;
  terminationReason?: string;
  // Enhanced fields for complex User interface support
  coachEmail?: string;
  coachPhoneNumber?: string;
  athleteEmail?: string;
  athletePhoneNumber?: string;
  // History tracking
  previousCoachId?: string;
  transitionHistory: RelationshipTransition[];
  // Discovery and request system
  requestedAt?: Date;
  requestedBy?: string;
  approvedAt?: Date;
  approvedBy?: string;
  rejectedAt?: Date;
  rejectedBy?: string;
  rejectionReason?: string;
}

export interface CoachPermission {
  resource: string;
  actions: string[];
  conditions?: PermissionCondition[];
  grantedAt: Date;
  grantedBy: string;
}

export interface PermissionCondition {
  field: string;
  operator: string;
  value: string;
}

export interface RelationshipTransition {
  id: string;
  fromStatus: string;
  toStatus: string;
  reason?: string;
  triggeredBy: string;
  triggeredAt: Date;
  metadata?: Record<string, string>;
}

export interface SeamlessTransitionRequest {
  athleteId: string;
  fromCoachId: string;
  toCoachId: string;
  reason?: string;
  preserveData?: boolean;
}

export interface SeamlessTransitionResult {
  terminatedRelationship: CoachAthleteRelationship;
  newRelationship: CoachAthleteRelationship;
  dataTransferred: string[];
}

// Coach Profile Management
export interface CreateCoachDiscoveryProfileRequest {
  bio?: string;
  specializations: string[];
  experience?: string;
  certifications?: string[];
  availability: WeeklyAvailability;
  socialLinks: string[];
}

export interface UpdateCoachDiscoveryProfileRequest {
  bio?: string;
  specializations?: string[];
  certifications?: string[];
  availability?: WeeklyAvailability;
  socialLinks?: string[];
  hourlyRate?: number;
  currency?: string;
  isAvailable?: boolean;
}

// Search and Discovery
export interface CoachDiscoveryFilters {
  specializations?: string[];
  languages?: string[];
  location?: string;
  maxHourlyRate?: number;
  minRating?: number;
  availableSlots?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CoachSearchResult {
  coaches: CoachDiscoveryProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
