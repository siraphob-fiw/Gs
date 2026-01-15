// Define the complex User interface locally to avoid import path issues
// This is based on the complex User interface from user-management.ts

export interface AthleteProfile {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  bodyWeight: number;
  height: number;
}

export interface UserPreferences {
  language: string;
  weightUnit: 'KG' | 'LBS';
  dateFormat: string;
  timeFormat: string;
  timezone: string;
  notifications: {
    email: { enabled: boolean; workoutReminders: boolean; progressUpdates: boolean; coachMessages: boolean; systemUpdates: boolean; marketingEmails: boolean; frequency: string };
    push: { enabled: boolean; workoutReminders: boolean; coachMessages: boolean; systemAlerts: boolean; quietHours: any };
    sms: { enabled: boolean; emergencyOnly: boolean };
    inApp: { enabled: boolean; showBadges: boolean; playSound: boolean; categories: any[] };
  };
  privacy: {
    profileVisibility: string;
    showProgress: boolean;
    showWorkouts: boolean;
    allowMessaging: boolean;
    dataSharing: any;
    consentGiven: any[];
  };
  accessibility: {
    screenReader: boolean;
    highContrast: boolean;
    largeText: boolean;
    reducedMotion: boolean;
    keyboardNavigation: boolean;
    voiceControl: boolean;
    customizations: any[];
  };
  training: {
    availability: any; // TrainingAvailability
    scheduling: any; // SchedulingPreferences
    sessionPreferences: any; // SessionPreferences
    autoAdjustments: any; // AutoAdjustmentSettings
    coachingPreferences: any; // CoachingPreferences
  };
  equipment: {
    defaultEquipmentProfile: string;
    equipmentPriorities: any[]; // EquipmentPriority[]
    maintenanceReminders: any[]; // MaintenanceReminder[]
    safetyPreferences: any; // SafetyPreferences
    upgradeWishlist: any[]; // EquipmentWishlistItem[]
  };
}

export interface EquipmentProfile {
  id: string;
  userId: string;
  name: string;
  location: string;
  description?: string;
  availableEquipment: any[];
  plateConfiguration: any;
  spaceConstraints?: any;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface HealthConsiderations {
  disabilities: any[];
  rangeOfMotionLimitations: any[];
  chronicConditions: any[];
  medications: any[];
  allergies: any[];
  physicalLimitations: any[]; // PhysicalLimitation[]
  disabilityAccommodations: any[]; // DisabilityAccommodationSettings[]
  lastUpdated: Date;
}

export interface UserSession {
  id: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
  createdAt: Date;
  lastUsedAt: Date;
}

export interface AuditEntry {
  id: string;
  tenantId?: string;
  userId?: string;
  sessionId?: string;
  action: string;
  success?: boolean;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  apiEndpoint?: string;
  httpMethod?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
  errorMessage?: string;
  stackTrace?: string;
  containsPii?: boolean;
  containsPhi?: boolean;
  retentionUntil?: Date;
  createdAt?: Date;
  timestamp?: Date;
  resource?: string;
}

export interface ComplexUser {
  id: string;
  tenantId: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  phoneVerified: boolean;
  phoneVerifiedAt?: Date;
  profile: AthleteProfile;
  preferences: UserPreferences;
  sessions: UserSession[];
  auditLog: AuditEntry[];
  auth_providers?: Record<string, any>;
  whatsappData?: Record<string, any>;
  lineData?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  lastLoginAt?: Date;
  emailVerifiedAt?: Date;
}

// Define the enums locally to avoid import path issues
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  TENANT_ADMIN = 'TENANT_ADMIN',
  COACH_ADMIN = 'COACH_ADMIN',
  COACH = 'COACH',
  ATHLETE = 'ATHLETE',
  SELF_COACHED = 'SELF_COACHED',
  USER = 'USER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  DEACTIVATED = 'DEACTIVATED',
}

/**
 * Database User model that maps to the complex User interface
 * This model handles the mapping between database fields and the complex nested structure
 */
export interface DatabaseUser {
  id: string;
  tenant_id: string;
  email: string;
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
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  body_weight?: number;
  height?: number;
  
  // JSON fields for complex nested data
  preferences?: any; // UserPreferences JSON
  auth_providers?: any; // OAuth provider data JSON
  whatsapp_data?: any; // WhatsApp authentication data JSON
  line_data?: any; // LINE authentication data JSON
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
  last_login_at?: Date;
  email_verified_at?: Date;
  suspended_at?: Date;

  // Coach relationship fields
  coach_id?: string;
  coach_first_name?: string;
  coach_last_name?: string;
}

/**
 * Maps database user record to complex User interface
 */
export function mapDatabaseUserToComplexUser(dbUser: DatabaseUser): ComplexUser {
  const profile: AthleteProfile = {
    firstName: dbUser.first_name || '',
    lastName: dbUser.last_name || '',
    dateOfBirth: dbUser.date_of_birth || new Date(),
    gender: dbUser.gender as any || 'PREFER_NOT_TO_SAY',
    bodyWeight: dbUser.body_weight || 0,
    height: dbUser.height || 0,
  };

  const preferences: UserPreferences = dbUser.preferences || {
    language: 'en',
    weightUnit: 'KG',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    timezone: 'UTC',
    notifications: {
      email: { enabled: true, workoutReminders: true, progressUpdates: true, coachMessages: true, systemUpdates: true, marketingEmails: false, frequency: 'DAILY' },
      push: { enabled: true, workoutReminders: true, coachMessages: true, systemAlerts: true, quietHours: { enabled: false, startTime: '22:00', endTime: '08:00', timezone: 'UTC', daysOfWeek: [] } },
      sms: { enabled: false, emergencyOnly: true },
      inApp: { enabled: true, showBadges: true, playSound: true, categories: [] }
    },
    privacy: {
      profileVisibility: 'PRIVATE',
      showProgress: false,
      showWorkouts: false,
      allowMessaging: true,
      dataSharing: { shareWithCoach: true, shareForResearch: false, shareForMarketing: false, shareAggregated: false, thirdPartyIntegrations: false },
      consentGiven: []
    },
    accessibility: {
      screenReader: false,
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      keyboardNavigation: false,
      voiceControl: false,
      customizations: []
    },
    training: {
      availability: {
        weeklySchedule: {
          monday: { isAvailable: true, timeSlots: [], preferredTimes: [], maxSessions: 1 },
          tuesday: { isAvailable: true, timeSlots: [], preferredTimes: [], maxSessions: 1 },
          wednesday: { isAvailable: true, timeSlots: [], preferredTimes: [], maxSessions: 1 },
          thursday: { isAvailable: true, timeSlots: [], preferredTimes: [], maxSessions: 1 },
          friday: { isAvailable: true, timeSlots: [], preferredTimes: [], maxSessions: 1 },
          saturday: { isAvailable: true, timeSlots: [], preferredTimes: [], maxSessions: 1 },
          sunday: { isAvailable: false, timeSlots: [], preferredTimes: [], maxSessions: 0 }
        },
        timeZone: 'UTC',
        flexibilityLevel: 'MODERATE',
        advanceNotice: 1,
        blackoutDates: [],
        seasonalAdjustments: []
      },
      scheduling: {
        preferredSessionDuration: 60,
        minSessionDuration: 30,
        maxSessionDuration: 120,
        preferredRestDays: [0], // Sunday
        minRestBetweenSessions: 24,
        maxConsecutiveTrainingDays: 3,
        preferredTrainingFrequency: 3,
        allowBackToBackSessions: false,
        preferredTimeOfDay: ['MORNING'],
        avoidTimeSlots: []
      },
      sessionPreferences: {
        warmupDuration: 10,
        cooldownDuration: 10,
        restTimerPreferences: {
          enabled: true,
          defaultRestTime: 120,
          autoStart: false,
          soundEnabled: true,
          vibrationEnabled: false,
          customRestTimes: { compound: 180, isolation: 90, cardio: 60, stretching: 30 }
        },
        musicPreferences: { enabled: false, preferredGenres: [], energyLevel: 'MEDIUM', allowExplicit: false, volumeLevel: 50 },
        environmentPreferences: { preferredTemperature: 20, lightingPreference: 'MODERATE', noiseLevel: 'MODERATE', crowdPreference: 'MODERATE', airQualityRequirements: [] },
        trackingPreferences: { trackRPE: true, trackHeartRate: false, trackCalories: false, trackVolume: true, trackTempo: false, trackRestTimes: false, autoLogSets: false, requirePhotos: false, shareProgressWithCoach: true, publicProgressSharing: false }
      },
      autoAdjustments: {
        enabled: false,
        adjustmentSensitivity: 'MEDIUM',
        adjustmentTypes: { intensity: false, volume: false, frequency: false, exerciseSelection: false, restPeriods: false },
        triggerConditions: { rpeThreshold: 8, consecutiveHighRPE: 3, consecutiveLowRPE: 3, missedSessionThreshold: 2, injuryRiskScore: 70 },
        maxAdjustmentPercentage: 20,
        requireCoachApproval: true
      },
      coachingPreferences: {
        communicationStyle: 'FLEXIBLE',
        feedbackFrequency: 'AS_NEEDED',
        motivationStyle: 'SUPPORTIVE',
        preferredContactMethods: ['IN_APP', 'EMAIL'],
        availableForContact: [],
        emergencyContactPreference: 'EMAIL'
      }
    },
    equipment: {
      defaultEquipmentProfile: '',
      equipmentPriorities: [],
      maintenanceReminders: [],
      safetyPreferences: {
        requireSpotter: false,
        maxWeightWithoutSpotter: 100,
        safetyEquipmentRequired: [],
        emergencyProcedures: [],
        riskTolerance: 'MODERATE'
      },
      upgradeWishlist: []
    }
  };

  return {
    id: dbUser.id,
    tenantId: dbUser.tenant_id,
    email: dbUser.email,
    phone: dbUser.phone,
    passwordHash: dbUser.password_hash || '',
    role: dbUser.role,
    status: dbUser.status,
    phoneVerified: dbUser.phone_verified,
    phoneVerifiedAt: dbUser.phone_verified_at,
    profile,
    preferences,
    sessions: [], // Will be populated from user_sessions table
    auditLog: [], // Will be populated from audit_logs table
    created_at: dbUser.created_at,
    updated_at: dbUser.updated_at,
    lastLoginAt: dbUser.last_login_at,
    emailVerifiedAt: dbUser.email_verified_at,
    auth_providers: dbUser.auth_providers || {},
    whatsappData: dbUser.whatsapp_data,
    lineData: dbUser.line_data
  };
}

/**
 * Maps complex User interface to database user record
 */
export function mapComplexUserToDatabaseUser(user: ComplexUser): Partial<DatabaseUser> {
  return {
    id: user.id,
    tenant_id: user.tenantId,
    email: user.email,
    phone: user.phone,
    password_hash: user.passwordHash,
    role: user.role,
    status: user.status,
    phone_verified: user.phoneVerified || false,
    phone_verified_at: user.phoneVerifiedAt,
    
    // Profile fields
    first_name: user.profile.firstName,
    last_name: user.profile.lastName,
    date_of_birth: user.profile.dateOfBirth,
    gender: user.profile.gender as any,
    body_weight: user.profile.bodyWeight,
    height: user.profile.height,
    
    // JSON fields
    preferences: user.preferences,
    auth_providers: user.auth_providers || {},
    whatsapp_data: user.whatsappData,
    line_data: user.lineData,
    
    // Timestamps
    created_at: user.created_at,
    updated_at: user.updated_at,
    last_login_at: user.lastLoginAt,
    email_verified_at: user.emailVerifiedAt
  };
}

/**
 * User repository interface for database operations
 */
export interface UserRepository {
  findById(id: string, tenantId: string): Promise<ComplexUser | null>;
  findByEmail(email: string, tenantId: string): Promise<ComplexUser | null>;
  findByPhoneNumber(phoneNumber: string, tenantId: string): Promise<ComplexUser | null>;
  findByEmailOrPhone(identifier: string, tenantId: string): Promise<ComplexUser | null>;
  create(user: Partial<ComplexUser>): Promise<ComplexUser>;
  update(id: string, tenantId: string, updates: Partial<ComplexUser>): Promise<ComplexUser>;
  delete(id: string, tenantId: string): Promise<void>;
  list(tenantId: string, filters?: any): Promise<ComplexUser[]>;
  verifyPhone(id: string, tenantId: string): Promise<void>;
}

/**
 * Phone verification utilities
 */
export interface PhoneVerificationService {
  generateVerificationToken(): string;
  sendVerificationSMS(phoneNumber: string, token: string): Promise<void>;
  sendVerificationWhatsApp(phoneNumber: string, token: string): Promise<void>;
  verifyToken(userId: string, tenantId: string, token: string): Promise<boolean>;
  isTokenExpired(expiresAt: Date): boolean;
}

/**
 * Multi-method authentication utilities
 */
export interface AuthenticationService {
  authenticateWithEmail(email: string, password: string, tenantId: string): Promise<ComplexUser | null>;
  authenticateWithPhone(phoneNumber: string, tenantId: string): Promise<ComplexUser | null>;
  authenticateWithWhatsApp(whatsappData: any, tenantId: string): Promise<ComplexUser | null>;
  authenticateWithLINE(lineData: any, tenantId: string): Promise<ComplexUser | null>;
  authenticateWithOAuth(provider: string, oauthData: any, tenantId: string): Promise<ComplexUser | null>;
  validateIdentifier(identifier: string): { type: 'email' | 'phone'; valid: boolean };
  hashPassword(password: string): Promise<{ hash: string; salt: string }>;
  verifyPassword(password: string, hash: string, salt: string): Promise<boolean>;
}

export type { ComplexUser as User };