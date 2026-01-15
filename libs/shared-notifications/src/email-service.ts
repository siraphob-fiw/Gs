// Email service migrated from human-lift-training-api/src/Services/Notifications/EmailService.ts
import { Results } from '@strengthos/shared-utils';
import { ILogger } from '@strengthos/shared-logging';
import { NotificationContent, NotificationError, NotificationErrorCode } from '@strengthos/shared-types';
import Mailgun from 'mailgun.js';

export interface EmailServiceConfig {
  provider: 'sendgrid' | 'ses' | 'smtp' | 'mock' | 'mailgun';
  apiKey?: string;
  region?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  fromEmail: string;
  fromName: string;
  domain: string;
}

export interface EmailDeliveryResult {
  success: boolean;
  messageId?: string;
  error?: NotificationError;
}

export interface EmailServiceInterface {
  sendEmail(
    to: string,
    content: NotificationContent,
    options?: EmailOptions,
  ): Promise<Results<EmailDeliveryResult>>;
  
  sendBulkEmail(
    recipients: string[],
    content: NotificationContent,
    options?: EmailOptions,
  ): Promise<Results<EmailDeliveryResult[]>>;
  
  validateEmailAddress(email: string): boolean;
}

export interface EmailOptions {
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: EmailAttachment[];
  trackOpens?: boolean;
  trackClicks?: boolean;
  tags?: string[];
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType: string;
  disposition?: 'attachment' | 'inline';
  contentId?: string;
}

/**
 * Email Service Implementation
 * Supports multiple email providers with fallback capabilities
 */
export class EmailService implements EmailServiceInterface {
  private config: EmailServiceConfig;

  constructor(
    config: EmailServiceConfig,
    private readonly logger: ILogger
  ) {
    this.config = config;
  }

  async sendEmail(
    to: string,
    content: NotificationContent,
    options: EmailOptions = {},
  ): Promise<Results<EmailDeliveryResult>> {
    try {
      if (!this.validateEmailAddress(to)) {
        return Results.fail<EmailDeliveryResult>(null, 'Invalid email address');
      }

      let result: EmailDeliveryResult;
      
      switch (this.config.provider) {
        case 'sendgrid':
          result = await this.sendWithSendGrid(to, content, options);
          break;
        case 'ses':
          result = await this.sendWithSES(to, content, options);
          break;
        case 'smtp':
          result = await this.sendWithSMTP(to, content, options);
          break;
        case 'mock':
          result = await this.sendWithMock(to, content, options);
          break;
        case 'mailgun':
          result = await this.sendWithMailgun(to, content, options);
          break;
        default:
          return Results.fail<EmailDeliveryResult>(null, `Unsupported email provider: ${this.config.provider}`);
      }

      return Results.ok(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error || 'Unknown error');
      this.logger.error({ 
        message: 'Email sending error', 
        fullMessage: errorMessage 
      });
      
      return Results.fail<EmailDeliveryResult>(null, 'Failed to send email');
    }
  }

  async sendBulkEmail(
    recipients: string[],
    content: NotificationContent,
    options: EmailOptions = {},
  ): Promise<Results<EmailDeliveryResult[]>> {
    try {
      const results: EmailDeliveryResult[] = [];
      
      // For now, send individually. In production, use bulk APIs
      for (const recipient of recipients) {
        const result = await this.sendEmail(recipient, content, options);
        if (result.isOk && result.returnValue) {
          results.push(result.returnValue);
        } else {
          results.push({
            success: false,
            error: {
              code: NotificationErrorCode.DELIVERY_FAILED,
              message: result.message || 'Failed to send email',
              retryable: true,
            },
          });
        }
      }

      return Results.ok(results);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error || 'Unknown error');
      this.logger.error({ 
        message: 'Bulk email sending error', 
        fullMessage: errorMessage 
      });
      
      return Results.fail<EmailDeliveryResult[]>(null, 'Failed to send bulk emails');
    }
  }

  validateEmailAddress(email: string): boolean {
    if (!email || email.length === 0) {
      return false;
    }
    
    // More comprehensive email validation
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    // Additional checks for common invalid patterns
    if (email.includes('..') || email.startsWith('.') || email.endsWith('.')) {
      return false;
    }
    
    return emailRegex.test(email);
  }

  // ============================================================================
  // PROVIDER-SPECIFIC IMPLEMENTATIONS
  // ============================================================================

  private async sendWithSendGrid(
    to: string,
    content: NotificationContent,
    options: EmailOptions,
  ): Promise<EmailDeliveryResult> {
    // Mock implementation - in production, use @sendgrid/mail
    this.logger.info({ 
      message: 'SendGrid: Sending email',
      fullMessage: `To: ${to}, Subject: ${content.subject}`
    });
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      success: true,
      messageId: `sg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  private async sendWithSES(
    to: string,
    content: NotificationContent,
    options: EmailOptions,
  ): Promise<EmailDeliveryResult> {
    // Mock implementation - in production, use AWS SDK
    this.logger.info({ 
      message: 'AWS SES: Sending email',
      fullMessage: `To: ${to}, Subject: ${content.subject}`
    });
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 150));
    
    return {
      success: true,
      messageId: `ses_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  private async sendWithSMTP(
    to: string,
    content: NotificationContent,
    options: EmailOptions,
  ): Promise<EmailDeliveryResult> {
    // Mock implementation - in production, use nodemailer
    this.logger.info({ 
      message: 'SMTP: Sending email',
      fullMessage: `To: ${to}, Host: ${this.config.smtpHost}, Subject: ${content.subject}`
    });
    
    // Simulate SMTP send
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      success: true,
      messageId: `smtp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  private async sendWithMock(
    to: string,
    content: NotificationContent,
    options: EmailOptions,
  ): Promise<EmailDeliveryResult> {
    this.logger.info({ 
      message: 'Mock Email Service: Sending email',
      fullMessage: `To: ${to}, From: ${this.config.fromName} <${this.config.fromEmail}>, Subject: ${content.subject}, Language: ${content.language}`
    });
    
    if (options.replyTo) this.logger.debug({ message: `Reply-To: ${options.replyTo}` });
    if (options.cc?.length) this.logger.debug({ message: `CC: ${options.cc.join(', ')}` });
    if (options.bcc?.length) this.logger.debug({ message: `BCC: ${options.bcc.join(', ')}` });
    if (options.tags?.length) this.logger.debug({ message: `Tags: ${options.tags.join(', ')}` });
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Simulate occasional failures for testing
    if (Math.random() < 0.05) { // 5% failure rate
      return {
        success: false,
        error: {
          code: NotificationErrorCode.DELIVERY_FAILED,
          message: 'Mock delivery failure',
          retryable: true,
        },
      };
    }
    
    return {
      success: true,
      messageId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  private async sendWithMailgun(
    to: string,
    content: NotificationContent,
    options: EmailOptions,
  ): Promise<EmailDeliveryResult> {
    if (!this.config.apiKey) {
      return {
        success: false,
        error: {
          code: NotificationErrorCode.DELIVERY_FAILED,
          message: 'Mailgun API key is required',
          retryable: false,
        },
      };
    }
    if (!this.config.domain) {
      return {
        success: false,
        error: {
          code: NotificationErrorCode.DELIVERY_FAILED,
          message: 'Mailgun domain is required',
          retryable: false,
        },
      };
    }

    let mailgun: any;
    let mg: any;
    try {
      // Use import instead of require for FormData and Mailgun
      // (if using ESM, otherwise require is fine, but let's try to fix for commonjs/tsc)
      // Also, Mailgun expects FormData to be passed in
      const FormData = require('form-data');
      mailgun = new Mailgun(FormData);
      mg = mailgun.client({
        username: 'api',
        key: this.config.apiKey,
        url: 'https://api.mailgun.net', // Explicitly set API URL
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err || 'Unknown error');
      this.logger.error({
        message: 'Mailgun FormData or client import failed',
        fullMessage: errorMessage,
      });
      return {
        success: false,
        error: {
          code: NotificationErrorCode.DELIVERY_FAILED,
          message: 'Mailgun FormData or client import failed',
          retryable: false,
        },
      };
    }

    // Prepare message data
    const messageData: any = {
      from: `${this.config.fromName} <${this.config.fromEmail}>`,
      to: to,
      subject: content.subject,
      text: content.body,
    };

    // If content.html exists, use it for html, otherwise use content.body
    if ((content as any).html) {
      messageData.html = (content as any).html;
    } else if (content.body) {
      messageData.html = content.body;
    }

    if (options.replyTo) {
      messageData['h:Reply-To'] = options.replyTo;
    }
    if (options.cc && options.cc.length) {
      messageData.cc = options.cc.join(',');
    }
    if (options.bcc && options.bcc.length) {
      messageData.bcc = options.bcc.join(',');
    }
    if (options.tags && options.tags.length) {
      messageData['o:tag'] = options.tags;
    }
    if (options.trackOpens !== undefined) {
      messageData['o:tracking-opens'] = options.trackOpens ? 'yes' : 'no';
    }
    if (options.trackClicks !== undefined) {
      messageData['o:tracking-clicks'] = options.trackClicks ? 'yes' : 'no';
    }
    if (options.attachments && options.attachments.length) {
      // Mailgun expects attachments as array of Buffer or streams
      // See: https://github.com/mailgun/mailgun-js#sending-attachments
      // The mailgun.js v3 expects attachments as array of objects with data and filename
      messageData.attachment = options.attachments.map(att => {
        if (typeof att.content === 'string') {
          // Assume base64 string
          return {
            data: Buffer.from(att.content, 'base64'),
            filename: att.filename,
            contentType: att.contentType,
          };
        }
        return {
          data: att.content,
          filename: att.filename,
          contentType: att.contentType,
        };
      });
    }

    try {
      // mailgun.js v3: mg.messages.create(domain, data)
      const data = await mg.messages.create(this.config.domain, messageData);

      this.logger.info({
        message: 'Mailgun: Email sent',
        fullMessage: JSON.stringify(data),
      });

      return {
        success: true,
        messageId: data.id || `mailgun_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
    } catch (error) {
      let errorMsg = 'Mailgun delivery failed';
      
      if (error) {
        if (error instanceof Error) {
          errorMsg = error.message;
        } else if (typeof error === 'object' && error !== null) {
          // Try to extract error details from Mailgun error response
          if ((error as any)?.response?.body?.message) {
            errorMsg = (error as any).response.body.message;
          } else if ((error as any)?.message) {
            errorMsg = (error as any).message;
          } else {
            errorMsg = String(error);
          }
        } else {
          errorMsg = String(error);
        }
      }
      
      this.logger.error({
        message: 'Mailgun: Failed to send email',
        fullMessage: errorMsg,
      });
      return {
        success: false,
        error: {
          code: NotificationErrorCode.DELIVERY_FAILED,
          message: errorMsg,
          retryable: true,
        },
      };
    }
  }
}

/**
 * Factory function to create email service based on configuration
 */
export function createEmailService(
  config: EmailServiceConfig,
  logger: ILogger,
): EmailService {
  return new EmailService(config, logger);
}

// Default configuration
export const DEFAULT_EMAIL_CONFIG: EmailServiceConfig = {
  provider: process.env.EMAIL_PROVIDER as 'smtp' | 'sendgrid' | 'ses' | 'mailgun' || 'smtp', // Using SMTP with Mailgun
  smtpHost: process.env.EMAIL_SMTP_HOST || 'smtp.mailgun.org',
  smtpPort: process.env.EMAIL_SMTP_PORT ? parseInt(process.env.EMAIL_SMTP_PORT as string, 10) : 587,
  smtpUser: process.env.EMAIL_SMTP_USER || '', // Replace with your Mailgun SMTP username
  smtpPassword: process.env.EMAIL_SMTP_PASSWORD || '', // Replace with your Mailgun SMTP password
  fromEmail: process.env.EMAIL_FROM_EMAIL || 'noreply@strengthos.com',
  fromName: process.env.EMAIL_FROM_NAME || 'StrengthOS',
  domain: process.env.EMAIL_DOMAIN || 'strengthos.com',
};