// Messaging and Communication Types for StrengthOS
// Supports secure in-app messaging between coaches and athletes

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  VOICE = 'voice',
  SYSTEM = 'system',
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

export enum ConversationType {
  DIRECT = 'direct',           // 1-on-1 conversation
  GROUP = 'group',             // Group conversation
  ANNOUNCEMENT = 'announcement', // Coach to multiple athletes
}

export enum ConversationStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  BLOCKED = 'blocked',
}

export enum ParticipantRole {
  COACH = 'coach',
  ATHLETE = 'athlete',
  ADMIN = 'admin',
}

export enum ParticipantStatus {
  ACTIVE = 'active',
  LEFT = 'left',
  REMOVED = 'removed',
  INVITED = 'invited',
}

export enum AttachmentType {
  IMAGE = 'image',
  DOCUMENT = 'document',
  VIDEO = 'video',
  AUDIO = 'audio',
}

export enum ExternalMessageChannel {
  WHATSAPP = 'whatsapp',
  LINE = 'line',
  SMS = 'sms',
  EMAIL = 'email',
}

// Core Message Interface
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content: string;
  status: MessageStatus;
  attachments?: MessageAttachment[];
  replyToId?: string;
  editedAt?: Date;
  deletedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
}

// Message Attachment
export interface MessageAttachment {
  id: string;
  messageId: string;
  type: AttachmentType;
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// Conversation Interface
export interface Conversation {
  id: string;
  type: ConversationType;
  title?: string;
  description?: string;
  status: ConversationStatus;
  participants: ConversationParticipant[];
  lastMessage?: Message;
  lastMessageAt?: Date;
  unreadCount?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
}

// Conversation Participant
export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  role: ParticipantRole;
  status: ParticipantStatus;
  joinedAt: Date;
  leftAt?: Date;
  lastReadAt?: Date;
  notificationSettings?: ParticipantNotificationSettings;
  metadata?: Record<string, any>;
}

// Participant Notification Settings
export interface ParticipantNotificationSettings {
  muted: boolean;
  muteUntil?: Date;
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

// Message Thread (for replies)
export interface MessageThread {
  id: string;
  parentMessageId: string;
  conversationId: string;
  messages: Message[];
  participantCount: number;
  lastReplyAt: Date;
  createdAt: Date;
}

// External Message Integration
export interface ExternalMessage {
  id: string;
  messageId: string;
  channel: ExternalMessageChannel;
  externalId: string;
  externalStatus: string;
  deliveredAt?: Date;
  readAt?: Date;
  errorMessage?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Message Delivery Receipt
export interface MessageDeliveryReceipt {
  id: string;
  messageId: string;
  recipientId: string;
  status: MessageStatus;
  deliveredAt?: Date;
  readAt?: Date;
  channel?: ExternalMessageChannel;
  errorMessage?: string;
  createdAt: Date;
}

// Message Search and Filtering
export interface MessageSearchQuery {
  conversationId?: string;
  senderId?: string;
  type?: MessageType;
  content?: string;
  dateFrom?: Date;
  dateTo?: Date;
  hasAttachments?: boolean;
  attachmentType?: AttachmentType;
  limit?: number;
  offset?: number;
}

export interface MessageSearchResult {
  messages: Message[];
  totalCount: number;
  hasMore: boolean;
}

// Conversation Management
export interface CreateConversationRequest {
  type: ConversationType;
  title?: string;
  description?: string;
  participantIds: string[];
  initialMessage?: string;
}

export interface UpdateConversationRequest {
  title?: string;
  description?: string;
  status?: ConversationStatus;
}

export interface AddParticipantRequest {
  userId: string;
  role: ParticipantRole;
}

// Message Sending
export interface SendMessageRequest {
  conversationId: string;
  type: MessageType;
  content: string;
  attachments?: CreateAttachmentRequest[];
  replyToId?: string;
  externalChannels?: ExternalMessageChannel[];
}

export interface CreateAttachmentRequest {
  type: AttachmentType;
  filename: string;
  mimeType: string;
  size: number;
  content: string; // Base64 encoded for API
}

// Message History and Pagination
export interface MessageHistoryQuery {
  conversationId: string;
  limit?: number;
  before?: string; // Message ID for pagination
  after?: string;  // Message ID for pagination
  includeDeleted?: boolean;
}

export interface MessageHistoryResponse {
  messages: Message[];
  hasMore: boolean;
  nextCursor?: string;
  prevCursor?: string;
}

// Real-time Events
export interface MessageEvent {
  type: 'message_sent' | 'message_delivered' | 'message_read' | 'message_deleted' | 'message_edited';
  conversationId: string;
  message: Message;
  userId: string;
  timestamp: Date;
}

export interface ConversationEvent {
  type: 'conversation_created' | 'conversation_updated' | 'participant_added' | 'participant_removed' | 'participant_left';
  conversation: Conversation;
  userId: string;
  timestamp: Date;
}

export interface TypingEvent {
  conversationId: string;
  userId: string;
  isTyping: boolean;
  timestamp: Date;
}

// Message Statistics
export interface MessageStats {
  totalMessages: number;
  totalConversations: number;
  unreadMessages: number;
  activeConversations: number;
  messagesByType: Record<MessageType, number>;
  messagesByChannel: Record<ExternalMessageChannel, number>;
}

// Conversation Summary
export interface ConversationSummary {
  id: string;
  type: ConversationType;
  title?: string;
  participantCount: number;
  messageCount: number;
  unreadCount: number;
  lastMessage?: {
    content: string;
    senderId: string;
    senderName: string;
    createdAt: Date;
  };
  lastActivity: Date;
}

// Message Moderation
export interface MessageModerationAction {
  id: string;
  messageId: string;
  moderatorId: string;
  action: 'flag' | 'hide' | 'delete' | 'warn';
  reason: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// Message Templates (for common responses)
export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  variables?: string[];
  isActive: boolean;
  createdBy: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Bulk Message Operations
export interface BulkMessageRequest {
  conversationIds: string[];
  action: 'mark_read' | 'archive' | 'delete' | 'mute';
  metadata?: Record<string, any>;
}

export interface BulkMessageResponse {
  successCount: number;
  failureCount: number;
  errors: Array<{
    conversationId: string;
    error: string;
  }>;
}

// Message Encryption (for sensitive data)
export interface EncryptedMessage {
  id: string;
  conversationId: string;
  senderId: string;
  encryptedContent: string;
  encryptionKeyId: string;
  encryptionAlgorithm: string;
  createdAt: Date;
}

// Message Backup and Export
export interface MessageExportRequest {
  conversationIds?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  format: 'json' | 'csv' | 'pdf';
  includeAttachments: boolean;
}

export interface MessageExportResponse {
  exportId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  expiresAt?: Date;
  createdAt: Date;
}