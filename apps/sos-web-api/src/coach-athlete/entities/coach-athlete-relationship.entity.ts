import { WeeklyAvailability } from '@strengthos/shared-types/user-management';
import { BaseEntity } from '../../types/entities/base.entity';

export enum RelationshipStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED',
}

export interface CoachAthleteRelationship extends BaseEntity {
  tenant_id: string;
  coach_id: string;
  athlete_id: string;
  created_at: Date;
  updated_at: Date;
  status: RelationshipStatus;
  athlete_firstName: string;
  athlete_lastName: string;
  athlete_role: string;
  athlete_email: string;
  coach_email: string;
  coach_firstName: string;
  coach_lastName: string;
}

export interface CoachAthleteRelationshipWithAthlete
  extends CoachAthleteRelationship {
  athlete_firstName: string;
  athlete_lastName: string;
  athlete_role: string;
}

export interface RelationshipTransition {
  id: string;
  fromStatus: RelationshipStatus;
  toStatus: RelationshipStatus;
  reason?: string;
  triggeredBy: string;
  triggeredAt: Date;
  metadata?: Record<string, any>;
}

export interface CoachDiscoveryProfile {
  id: string;
  coach_id: string;
  tenant_id: string;
  bio?: string;
  specializations?: string[];
  certifications?: string[];
  availability?: WeeklyAvailability;
  socialLinks?: string[];
  hourlyRate?: number;
  currency?: string;
  is_available: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ContactPreference {
  method: 'EMAIL' | 'WHATSAPP' | 'LINE' | 'PHONE';
  value: string;
  isPreferred: boolean;
  isPublic: boolean;
}

export interface CoachRequest {
  id: string;
  tenant_id: string;
  athlete_id: string;
  coach_id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  message?: string;
  requested_at: Date;
  responded_at?: Date;
  response_message?: string;
  expires_at: Date;
  metadata?: Record<string, any>;
}

export interface CreateCoachAthleteRelationshipRequest {
  coach_id: string;
  athlete_id: string;
  notes?: string;
}

export interface CreateCoachDiscoveryProfileRequest {
  bio?: string;
  specializations?: string[];
  certifications?: string[];
  experience?: string;
  availability?: WeeklyAvailability;
  socialLinks?: string[];
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

export interface CreateCoachRequestRequest {
  coach_id: string;
  message?: string;
  expiresIn?: number; // Hours until expiration, default 72
}

export interface RespondToCoachRequestRequest {
  status: 'ACCEPTED' | 'REJECTED';
  response_message?: string;
}
