import {
  UserRole,
  UserStatus,
  Gender as GenderType,
} from '@strengthos/shared-types';
import { BaseEntity } from '../../database/base.repository';

export interface User extends BaseEntity {
  id: string;
  tenant_id: string;
  email?: string;
  phone?: string;
  password_hash?: string;
  salt?: string;
  role: UserRole;
  status: UserStatus;
  phone_verified: boolean;
  phone_verified_at?: Date;
  phone_verification_token?: string;
  phone_verification_expires_at?: Date;

  // Profile fields (flattened from AthleteProfile)
  first_name?: string;
  last_name?: string;
  date_of_birth?: Date;
  gender?: GenderType;
  body_weight?: number;
  height?: number;

  // JSON fields for complex nested data
  preferences?: Record<string, any>;
  auth_providers?: Record<string, any>;
  whatsapp_data?: Record<string, any>;
  line_data?: Record<string, any>;

  // Timestamps
  created_at: Date;
  updated_at: Date;
  last_login_at?: Date;
  email_verified_at?: Date;
  suspended_at?: Date;
}
