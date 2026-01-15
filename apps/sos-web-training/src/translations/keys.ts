// Navigation keys
export const NAV_KEYS = {
  DASHBOARD: 'nav.dashboard',
  WORKOUTS: 'nav.workouts',
  EXERCISES: 'nav.exercises',
  EQUIPMENT: 'nav.equipment',
  PROFILE: 'nav.profile',
  SETTINGS: 'nav.settings',
  LOGOUT: 'nav.logout',
  HOME: 'nav.home',
  CALENDAR: 'nav.calendar',
  PROGRAMS: 'nav.programs',
  CLIENTS: 'nav.clients', // For coaches
} as const;

// Common UI keys
export const COMMON_KEYS = {
  LOADING: 'common.loading',
  SAVE: 'common.save',
  CANCEL: 'common.cancel',
  DELETE: 'common.delete',
  EDIT: 'common.edit',
  ADD: 'common.add',
  REMOVE: 'common.remove',
  CONFIRM: 'common.confirm',
  YES: 'common.yes',
  NO: 'common.no',
  OK: 'common.ok',
  CLOSE: 'common.close',
  BACK: 'common.back',
  NEXT: 'common.next',
  PREVIOUS: 'common.previous',
  SEARCH: 'common.search',
  FILTER: 'common.filter',
  SORT: 'common.sort',
  VIEW: 'common.view',
  DOWNLOAD: 'common.download',
  UPLOAD: 'common.upload',
  SUBMIT: 'common.submit',
  RESET: 'common.reset',
  CLEAR: 'common.clear',
  SELECT: 'common.select',
  DESELECT: 'common.deselect',
  ALL: 'common.all',
  NONE: 'common.none',
  MORE: 'common.more',
  LESS: 'common.less',
  SHOW: 'common.show',
  HIDE: 'common.hide',
  EXPAND: 'common.expand',
  COLLAPSE: 'common.collapse',
} as const;

// Authentication keys
export const AUTH_KEYS = {
  LOGIN: 'auth.login',
  LOGOUT: 'auth.logout',
  EMAIL: 'auth.email',
  PASSWORD: 'auth.password',
  REMEMBER_ME: 'auth.rememberMe',
  FORGOT_PASSWORD: 'auth.forgotPassword',
  RESET_PASSWORD: 'auth.resetPassword',
  SIGN_UP: 'auth.signUp',
  WELCOME: 'auth.welcome',
  WELCOME_BACK: 'auth.welcomeBack',
  INVALID_CREDENTIALS: 'auth.invalidCredentials',
  SESSION_EXPIRED: 'auth.sessionExpired',
} as const;

// Workout keys
export const WORKOUT_KEYS = {
  WORKOUT: 'workout.workout',
  WORKOUTS: 'workout.workouts',
  CREATE: 'workout.create',
  EDIT: 'workout.edit',
  DELETE: 'workout.delete',
  START: 'workout.start',
  FINISH: 'workout.finish',
  PAUSE: 'workout.pause',
  RESUME: 'workout.resume',
  STOP: 'workout.stop',
  NAME: 'workout.name',
  DESCRIPTION: 'workout.description',
  DURATION: 'workout.duration',
  EXERCISES: 'workout.exercises',
  SETS: 'workout.sets',
  REPS: 'workout.reps',
  WEIGHT: 'workout.weight',
  REST: 'workout.rest',
  NOTES: 'workout.notes',
  COMPLETED: 'workout.completed',
  IN_PROGRESS: 'workout.inProgress',
  SCHEDULED: 'workout.scheduled',
  COUNT: 'workout.count', // Supports pluralization
  TOTAL_TIME: 'workout.totalTime',
  TOTAL_VOLUME: 'workout.totalVolume',
  PERSONAL_RECORD: 'workout.personalRecord',
  NEW_PR: 'workout.newPR',
} as const;

// Exercise keys
export const EXERCISE_KEYS = {
  EXERCISE: 'exercise.exercise',
  EXERCISES: 'exercise.exercises',
  NAME: 'exercise.name',
  DESCRIPTION: 'exercise.description',
  CATEGORY: 'exercise.category',
  MUSCLE_GROUP: 'exercise.muscleGroup',
  EQUIPMENT: 'exercise.equipment',
  INSTRUCTIONS: 'exercise.instructions',
  TIPS: 'exercise.tips',
  VARIATIONS: 'exercise.variations',
  BEGINNER: 'exercise.beginner',
  INTERMEDIATE: 'exercise.intermediate',
  ADVANCED: 'exercise.advanced',
  COMPOUND: 'exercise.compound',
  ISOLATION: 'exercise.isolation',
  CARDIO: 'exercise.cardio',
  STRENGTH: 'exercise.strength',
  FLEXIBILITY: 'exercise.flexibility',
} as const;

// Equipment keys
export const EQUIPMENT_KEYS = {
  EQUIPMENT: 'equipment.equipment',
  BARBELL: 'equipment.barbell',
  DUMBBELL: 'equipment.dumbbell',
  KETTLEBELL: 'equipment.kettlebell',
  MACHINE: 'equipment.machine',
  CABLE: 'equipment.cable',
  BODYWEIGHT: 'equipment.bodyweight',
  RESISTANCE_BAND: 'equipment.resistanceBand',
  MEDICINE_BALL: 'equipment.medicineBall',
  FOAM_ROLLER: 'equipment.foamRoller',
  BENCH: 'equipment.bench',
  RACK: 'equipment.rack',
  PLATES: 'equipment.plates',
  AVAILABLE: 'equipment.available',
  UNAVAILABLE: 'equipment.unavailable',
  IN_USE: 'equipment.inUse',
} as const;

// User/Profile keys
export const USER_KEYS = {
  PROFILE: 'user.profile',
  NAME: 'user.name',
  EMAIL: 'user.email',
  PHONE: 'user.phone',
  AGE: 'user.age',
  HEIGHT: 'user.height',
  WEIGHT: 'user.weight',
  GOAL: 'user.goal',
  EXPERIENCE: 'user.experience',
  PREFERENCES: 'user.preferences',
  SETTINGS: 'user.settings',
  STATISTICS: 'user.statistics',
  ACHIEVEMENTS: 'user.achievements',
  PROGRESS: 'user.progress',
  WELCOME_USER: 'user.welcome', // Supports interpolation: "Welcome, {{name}}!"
} as const;

// Coach-specific keys
export const COACH_KEYS = {
  CLIENTS: 'coach.clients',
  CLIENT: 'coach.client',
  ASSIGN_WORKOUT: 'coach.assignWorkout',
  CREATE_PROGRAM: 'coach.createProgram',
  VIEW_PROGRESS: 'coach.viewProgress',
  SEND_MESSAGE: 'coach.sendMessage',
  SCHEDULE_SESSION: 'coach.scheduleSession',
  CERTIFICATIONS: 'coach.certifications',
  SPECIALIZATIONS: 'coach.specializations',
  EXPERIENCE_YEARS: 'coach.experienceYears',
} as const;

// Form validation keys
export const VALIDATION_KEYS = {
  REQUIRED: 'validation.required',
  INVALID_EMAIL: 'validation.invalidEmail',
  INVALID_PHONE: 'validation.invalidPhone',
  MIN_LENGTH: 'validation.minLength',
  MAX_LENGTH: 'validation.maxLength',
  MIN_VALUE: 'validation.minValue',
  MAX_VALUE: 'validation.maxValue',
  PASSWORDS_DONT_MATCH: 'validation.passwordsDontMatch',
  INVALID_FORMAT: 'validation.invalidFormat',
  ALREADY_EXISTS: 'validation.alreadyExists',
  NOT_FOUND: 'validation.notFound',
} as const;

// Error keys
export const ERROR_KEYS = {
  GENERIC: 'error.generic',
  NETWORK: 'error.network',
  SERVER: 'error.server',
  NOT_FOUND: 'error.notFound',
  UNAUTHORIZED: 'error.unauthorized',
  FORBIDDEN: 'error.forbidden',
  TIMEOUT: 'error.timeout',
  OFFLINE: 'error.offline',
  RETRY: 'error.retry',
  CONTACT_SUPPORT: 'error.contactSupport',
} as const;

// Success keys
export const SUCCESS_KEYS = {
  SAVED: 'success.saved',
  DELETED: 'success.deleted',
  UPDATED: 'success.updated',
  CREATED: 'success.created',
  COMPLETED: 'success.completed',
  SENT: 'success.sent',
  UPLOADED: 'success.uploaded',
  DOWNLOADED: 'success.downloaded',
} as const;

// Date/Time keys
export const DATE_KEYS = {
  TODAY: 'date.today',
  YESTERDAY: 'date.yesterday',
  TOMORROW: 'date.tomorrow',
  THIS_WEEK: 'date.thisWeek',
  LAST_WEEK: 'date.lastWeek',
  NEXT_WEEK: 'date.nextWeek',
  THIS_MONTH: 'date.thisMonth',
  LAST_MONTH: 'date.lastMonth',
  NEXT_MONTH: 'date.nextMonth',
  MONDAY: 'date.monday',
  TUESDAY: 'date.tuesday',
  WEDNESDAY: 'date.wednesday',
  THURSDAY: 'date.thursday',
  FRIDAY: 'date.friday',
  SATURDAY: 'date.saturday',
  SUNDAY: 'date.sunday',
  JANUARY: 'date.january',
  FEBRUARY: 'date.february',
  MARCH: 'date.march',
  APRIL: 'date.april',
  MAY: 'date.may',
  JUNE: 'date.june',
  JULY: 'date.july',
  AUGUST: 'date.august',
  SEPTEMBER: 'date.september',
  OCTOBER: 'date.october',
  NOVEMBER: 'date.november',
  DECEMBER: 'date.december',
} as const;

// Units keys
export const UNITS_KEYS = {
  KG: 'units.kg',
  LBS: 'units.lbs',
  CM: 'units.cm',
  INCHES: 'units.inches',
  FEET: 'units.feet',
  METERS: 'units.meters',
  SECONDS: 'units.seconds',
  MINUTES: 'units.minutes',
  HOURS: 'units.hours',
  REPS: 'units.reps',
  SETS: 'units.sets',
} as const;

// Program Generation keys
export const PROGRAM_GENERATION_KEYS = {
  SELECT_TEMPLATE: 'programGeneration.selectTemplate',
  SELECT_TEMPLATE_DESCRIPTION: 'programGeneration.selectTemplateDescription',
  CREATE_NEW_TEMPLATE: 'programGeneration.createNewTemplate',
  SEARCH_TEMPLATES: 'programGeneration.searchTemplates',
  DISCIPLINE: 'programGeneration.discipline',
  BEGINNER: 'programGeneration.beginner',
  INTERMEDIATE: 'programGeneration.intermediate',
  ADVANCED: 'programGeneration.advanced',
  EXPERT: 'programGeneration.expert',
  DURATION: 'programGeneration.duration',
  FREQUENCY: 'programGeneration.frequency',
  TRAINING_BLOCKS: 'programGeneration.trainingBlocks',
  REQUIRED_EQUIPMENT: 'programGeneration.requiredEquipment',
  NO_TEMPLATES_FOUND: 'programGeneration.noTemplatesFound',
  NO_TEMPLATES_AVAILABLE: 'programGeneration.noTemplatesAvailable',
  TRY_DIFFERENT_FILTERS: 'programGeneration.tryDifferentFilters',
  TEMPLATES_WILL_APPEAR_HERE: 'programGeneration.templatesWillAppearHere',
  SHOWING_TEMPLATES: 'programGeneration.showingTemplates',
  PROGRAM_GENERATOR: 'programGeneration.programGenerator',
  ATHLETE_DATA: 'programGeneration.athleteData',
  PERFORMANCE_HISTORY: 'programGeneration.performanceHistory',
  HEALTH_METRICS: 'programGeneration.healthMetrics',
  INJURIES: 'programGeneration.injuries',
  EQUIPMENT_AVAILABILITY: 'programGeneration.equipmentAvailability',
  TRAINING_PREFERENCES: 'programGeneration.trainingPreferences',
  GENERATE_PROGRAM: 'programGeneration.generateProgram',
  PROGRAM_PREVIEW: 'programGeneration.programPreview',
  CUSTOMIZE_PROGRAM: 'programGeneration.customizeProgram',
  BLOCK_TYPE: 'programGeneration.blockType',
  TRAINING_BLOCK: 'programGeneration.trainingBlock',
  PIVOT_BLOCK: 'programGeneration.pivotBlock',
  PEAKING_BLOCK: 'programGeneration.peakingBlock',
  TAPERING_BLOCK: 'programGeneration.taperingBlock',
  COMPETITION_PLANNING: 'programGeneration.competitionPlanning',
  COMPETITION_DATE: 'programGeneration.competitionDate',
  PEAKING_PROTOCOL: 'programGeneration.peakingProtocol',
  RPE_FEEDBACK: 'programGeneration.rpeFeedback',
  SESSION_RATING: 'programGeneration.sessionRating',
  ADAPTATION_SYSTEM: 'programGeneration.adaptationSystem',
  DELOAD_PROTOCOL: 'programGeneration.deloadProtocol',
  STRESS_TRACKING: 'programGeneration.stressTracking',
  CENTRAL_STRESS: 'programGeneration.centralStress',
  PERIPHERAL_STRESS: 'programGeneration.peripheralStress',
  TOTAL_STRESS: 'programGeneration.totalStress',
  COACH_ASSIGNMENT: 'programGeneration.coachAssignment',
  ASSIGN_PROGRAM: 'programGeneration.assignProgram',
  PROGRAM_CUSTOMIZATION: 'programGeneration.programCustomization',
  COACH_APPROVAL: 'programGeneration.coachApproval',
  AUTO_ADJUSTMENTS: 'programGeneration.autoAdjustments',
} as const;

/**
 * All translation keys combined for easy access
 */
export const TRANSLATION_KEYS = {
  NAV: NAV_KEYS,
  COMMON: COMMON_KEYS,
  AUTH: AUTH_KEYS,
  WORKOUT: WORKOUT_KEYS,
  EXERCISE: EXERCISE_KEYS,
  EQUIPMENT: EQUIPMENT_KEYS,
  USER: USER_KEYS,
  COACH: COACH_KEYS,
  VALIDATION: VALIDATION_KEYS,
  ERROR: ERROR_KEYS,
  SUCCESS: SUCCESS_KEYS,
  DATE: DATE_KEYS,
  UNITS: UNITS_KEYS,
  PROGRAM_GENERATION: PROGRAM_GENERATION_KEYS,
} as const;

/**
 * Type-safe translation key type
 */
export type TranslationKeyType =
  (typeof TRANSLATION_KEYS)[keyof typeof TRANSLATION_KEYS][keyof (typeof TRANSLATION_KEYS)[keyof typeof TRANSLATION_KEYS]];
