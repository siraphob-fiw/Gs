// Main exports for @strengthos/shared-notifications

// Core notification services
export * from './email-service';
export * from './sms-service';
export * from './push-notification-service';

// Template and real-time services
export * from './notification-template-service';
export * from './real-time-notification-service';

// Re-export notification types from shared-types
export type {
  NotificationContent,
  NotificationError,
  NotificationTemplate,
  PushDeviceToken,
  Notification,
  NotificationPreferences,
} from '@strengthos/shared-types';

export {
  NotificationErrorCode,
  NotificationType,
  NotificationStatus,
  NotificationChannelType,
  TemplateVariableType,
  SupportedLanguage,
  PushPlatform,
} from '@strengthos/shared-types';