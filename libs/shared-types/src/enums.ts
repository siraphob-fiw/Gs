// StrengthOS Platform Enums

// Legacy enums - kept for backward compatibility
export enum Role {
  ADMIN = 'admin',
  COACH_ADMIN = 'coach_admin',
  COACH = 'coach',
  USER = 'user',
  SELF_COACHED = 'self_coached'
}

// Gender enum moved to user-management-enums.ts for consistency
// Re-export from user-management-enums
export { Gender } from './user-management-enums';

// WeightUnit enum moved to user-management-enums.ts for consistency
// Re-export from user-management-enums
export { WeightUnit } from './user-management-enums';

// Re-export new comprehensive enums for user management
export * from './user-management-enums';

export enum InjuryStatus {
  ACTIVE = 'active',
  RECOVERING = 'recovering',
  RESOLVED = 'resolved'
}

export enum NotificationType {
  REMINDER = 'reminder',
  WARNING = 'warning',
  FEEDBACK = 'feedback'
}

export enum DeviceType {
  BROWSER = 'browser',
  IOS = 'ios',
  ANDROID = 'android'
}

export enum ViewType {
  FRONT = 'front',
  SIDE = 'side',
  BACK = 'back'
}

export enum ExerciseType {
  HORIZONTAL_PUSH = 'HORIZONTAL_PUSH',
  VERTICAL_PUSH = 'VERTICAL_PUSH',
  HORIZONTAL_PULL = 'HORIZONTAL_PULL',
  VERTICAL_PULL = 'VERTICAL_PULL',
  KNEE_DOMINANT = 'KNEE_DOMINANT',
  HIP_DOMINANT = 'HIP_DOMINANT',
  WEIGHTLIFTING = 'WEIGHTLIFTING',
  MISC = 'MISC',
}


export enum MovementPattern {
  SQUAT = 'squat',
  HINGE = 'hinge',
  PUSH = 'push',
  PULL = 'pull',
  CARRY = 'carry',
  LOCOMOTION = 'locomotion',
  ROTATION = 'rotation'
}

export enum BodyPart {
  LEGS = 'legs',
  CORE = 'core',
  CHEST = 'chest',
  BACK = 'back',
  SHOULDERS = 'shoulders',
  ARMS = 'arms',
  FULL_BODY = 'full_body',
  ABDOMINALS = 'abdominals',
  ANTERIOR_DELTOIDS = 'anterior_deltoids',
  LATERAL_DELTOIDS = 'lateral_deltoids',
  POSTERIOR_DELTOIDS = 'posterior_deltoids',
  BICEPS = 'biceps',
  TRICEPS = 'triceps',
  GLUTES = 'glutes',
  HAMSTRINGS = 'hamstrings',
  LOWER_BACK = 'lower_back',
  UPPER_BACK = 'upper_back',
  QUADS = 'quads',
  LATISSIMUS_DORSIS = 'latissimus_dorsis',
  RHOMBOIDS = 'rhomboids',
  LATS = 'lats',
  OBLIQUES = 'obliques',
  QUADRICEPS = 'quadriceps',
  ADDUCTORS = 'adductors',
  TRAPS = 'traps'
}

// Discipline enum moved to user-management-enums.ts for consistency
// Re-export from user-management-enums
export { Discipline } from './user-management-enums';

export enum PlanStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}

export enum SessionStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SKIPPED = 'skipped'
}

export enum CompetitionStatus {
  PLANNING = 'planning',
  PREP = 'prep',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
} 