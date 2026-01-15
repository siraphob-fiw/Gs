// Notification and Communication Types
// Moved from human-lift-training-api/src/Types/SharedTypes.ts

import { NotificationType } from "./user-management-enums";

// Notification Enums
export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED'
}

export enum PriorityLevel {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum TransitionNotificationType {
  TRANSITION_REQUESTED = 'TRANSITION_REQUESTED',
  TRANSITION_APPROVED = 'TRANSITION_APPROVED',
  TRANSITION_REJECTED = 'TRANSITION_REJECTED',
  TRANSITION_COMPLETED = 'TRANSITION_COMPLETED'
}

export enum NotificationChannelEnum {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  SLACK = 'SLACK',
  WEBHOOK = 'WEBHOOK',
  IN_APP = 'IN_APP'
}

export enum SupportedLanguage {
  EN = 'EN',
  TH = 'TH',
  ZH = 'ZH',
  ES = 'ES',
  FR = 'FR'
}

export enum TemplateVariableType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  BOOLEAN = 'BOOLEAN',
  OBJECT = 'OBJECT',
  URL = 'URL',
  EMAIL = 'EMAIL'
}

export enum NotificationChannelType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
  WEBHOOK = 'WEBHOOK'
}

export enum NotificationErrorCode {
  INVALID_RECIPIENT = 'INVALID_RECIPIENT',
  CONTENT_TOO_LARGE = 'CONTENT_TOO_LARGE',
  DELIVERY_FAILED = 'DELIVERY_FAILED',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  CHANNEL_UNAVAILABLE = 'CHANNEL_UNAVAILABLE',
  RATE_LIMITED = 'RATE_LIMITED',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED'
}

export enum PushPlatform {
  IOS = 'IOS',
  ANDROID = 'ANDROID',
  WEB = 'WEB'
}

// Notification Interfaces
export interface NotificationContent {
  subject: string;
  body: string;
  bodyHtml?: string;
  language: SupportedLanguage;
  templateId?: string;
  templateVariables?: Record<string, any>;
  data?: Record<string, any>;
  imageUrl?: string;
  actionUrl?: string;
}

export interface NotificationError {
  code: NotificationErrorCode;
  message: string;
  retryable: boolean;
  details?: Record<string, any>;
}

export interface PushDeviceToken {
  token: string;
  platform: PushPlatform;
  appVersion?: string;
  deviceId?: string;
}

export interface NotificationTemplate {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  type: NotificationType;
  subject: string;
  body: string;
  variables: string[];
  metadata: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationChannel {
  type: NotificationChannelType;
  address: string;
  status: string;
  retryCount: number;
  maxRetries: number;
  sentAt?: Date;
  deliveredAt?: Date;
  failureReason?: string;
}

export interface Notification {
  id: string;
  tenantId: string;
  type: NotificationType;
  channel: NotificationChannelType;
  recipientId: string;
  title: string;
  message: string;
  templateId?: string;
  templateVariables?: Record<string, any>;
  metadata: Record<string, any>;
  status: NotificationStatus;
  priority: PriorityLevel;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date;
  readAt?: Date;
}

export interface CreateNotificationRequest {
  type: NotificationType;
  title: string;
  message: string;
  templateId?: string;
  templateVariables?: Record<string, any>;
  metadata?: Record<string, any>;
  recipientId: string;
  data?: Record<string, any>;
  priority?: PriorityLevel;
  scheduledFor?: Date;
  expiresAt?: Date;
}

export interface NotificationFilters {
  type?: NotificationType;
  status?: NotificationStatus;
  priority?: PriorityLevel;
  channel?: NotificationChannelType;
  recipientId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface BulkNotificationRequest {
  type: NotificationType;
  title: string;
  body: string;
  channel: NotificationChannelType;
  recipientIds: string[];
  data?: Record<string, any>;
  priority?: PriorityLevel;
  scheduledFor?: Date;
}

export interface NotificationPreferences {
  userId: string;
  channel: NotificationChannelType;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  quietHours?: {
    start: string;
    end: string;
    timezone: string;
  };
  categories: Record<string, boolean>;
  // Extended properties for advanced notification preferences
  channels?: NotificationChannelType[];
  settings?: NotificationPreferenceSettings;
  timezone?: string;
}

export interface NotificationPreferenceSettings {
  digestEnabled: boolean;
  digestFrequency: 'daily' | 'weekly' | 'monthly';
  quietHoursEnabled: boolean;
  marketingEnabled: boolean;
  securityAlertsEnabled: boolean;
  workoutRemindersEnabled: boolean;
  coachMessagesEnabled: boolean;
  progressUpdatesEnabled: boolean;
}

export interface QuietHours {
  enabled: boolean;
  start: string; // HH:MM format
  end: string; // HH:MM format
  timezone: string;
  startHour?: number;
  startMinute?: number;
  endHour?: number;
  endMinute?: number;
}

export interface TransitionNotificationRequest {
  transitionId: string;
  type: TransitionNotificationType;
  recipientIds: string[];
  data?: Record<string, any>;
}