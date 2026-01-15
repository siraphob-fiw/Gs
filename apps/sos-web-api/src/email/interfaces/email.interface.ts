export interface EmailContent {
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  templateData?: Record<string, any>;
}

export interface EmailOptions {
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: EmailAttachment[];
  trackOpens?: boolean;
  trackClicks?: boolean;
  tags?: string[];
  priority?: 'low' | 'normal' | 'high';
  headers?: Record<string, string>;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType: string;
  disposition?: 'attachment' | 'inline';
  contentId?: string;
}

export interface EmailDeliveryResult {
  success: boolean;
  messageId?: string;
  error?: EmailError;
  provider?: string;
  timestamp?: Date;
}

export interface EmailError {
  code: string;
  message: string;
  retryable: boolean;
  details?: any;
}

export interface EmailProviderConfig {
  provider: EmailProviderType;
  apiKey?: string;
  region?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  fromEmail: string;
  fromName: string;
  domain?: string;
  webhookSecret?: string;
  sandboxMode?: boolean;
}

export type EmailProviderType = 'ses' | 'smtp';

export interface IEmailProvider {
  sendEmail(
    to: string,
    content: EmailContent,
    options?: EmailOptions,
  ): Promise<EmailDeliveryResult>;

  sendBulkEmail(
    recipients: string[],
    content: EmailContent,
    options?: EmailOptions,
  ): Promise<EmailDeliveryResult[]>;

  validateEmailAddress(email: string): boolean;

  getProviderName(): string;
}
