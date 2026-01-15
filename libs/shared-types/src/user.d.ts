import { Role, Gender, WeightUnit } from './enums';
export interface User {
    id: string;
    email: string;
    password: string;
    name: string;
    role: Role;
    preferredLocale: string;
    preferredWeightUnit: WeightUnit;
    biologicalSex?: Gender;
    genderIdentity?: string;
    menstrualTrackingEnabled: boolean;
    coachingMode: string;
    equipmentProfile: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export interface CoachSubscription {
    id: string;
    coachId: string;
    plan: string;
    status: string;
    startedAt: Date;
    expiresAt: Date;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    coach: User;
}
export interface UserProfile {
    id: string;
    userId: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: Date;
    height?: number;
    heightUnit: WeightUnit;
    phoneNumber?: string;
    emergencyContact?: string;
    medicalConditions?: string[];
    allergies?: string[];
    medications?: string[];
    goals?: string[];
    experienceLevel?: string;
    preferredTrainingStyle?: string;
    availability?: string[];
    timezone?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface UserPreferences {
    id: string;
    userId: string;
    notifications: {
        email: boolean;
        push: boolean;
        sms: boolean;
        workoutReminders: boolean;
        progressUpdates: boolean;
        coachMessages: boolean;
    };
    privacy: {
        profileVisibility: 'public' | 'private' | 'coaches_only';
        showProgress: boolean;
        showWorkouts: boolean;
        allowMessaging: boolean;
    };
    training: {
        showRPE: boolean;
        showPercentage: boolean;
        autoRestTimer: boolean;
        restTimerDuration: number;
    };
    createdAt: Date;
    updatedAt: Date;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface LoginResponse {
    user: User;
    token: string;
    refreshToken: string;
    expiresIn: number;
}
export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
    role?: Role;
    preferredLocale?: string;
    preferredWeightUnit?: WeightUnit;
}
export interface PasswordResetRequest {
    email: string;
}
export interface PasswordResetConfirm {
    token: string;
    newPassword: string;
}
export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}
export interface UserListFilters {
    role?: Role;
    coachingMode?: string;
    search?: string;
    page?: number;
    limit?: number;
}
export interface UserListResponse {
    users: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export interface CoachAthleteRelationship {
    id: string;
    coachId: string;
    athleteId: string;
    status: 'pending' | 'active' | 'paused' | 'terminated';
    startedAt: Date;
    endedAt?: Date;
    coach: User;
    athlete: User;
}
export interface AssignCoachRequest {
    athleteId: string;
    coachId: string;
}
export interface CoachAssignmentResponse {
    relationship: CoachAthleteRelationship;
    message: string;
}
//# sourceMappingURL=user.d.ts.map