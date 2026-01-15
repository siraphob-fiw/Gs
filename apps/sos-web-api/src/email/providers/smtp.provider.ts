import { Injectable, Logger } from '@nestjs/common';
import {
  IEmailProvider,
  EmailContent,
  EmailOptions,
  EmailDeliveryResult,
  EmailProviderConfig,
} from '../interfaces/email.interface';
import nodemailer from 'nodemailer';

@Injectable()
export class SMTPProvider implements IEmailProvider {
  private readonly logger = new Logger(SMTPProvider.name);
  private readonly config: EmailProviderConfig;

  constructor(config: EmailProviderConfig) {
    this.config = config;
    this.validateConfig();
  }

  private validateConfig(): void {
    if (!this.config.smtpHost) {
      throw new Error('SMTP host is required');
    }
    if (!this.config.smtpPort) {
      throw new Error('SMTP port is required');
    }
    if (!this.config.smtpUser) {
      throw new Error('SMTP user is required');
    }
    if (!this.config.smtpPassword) {
      throw new Error('SMTP password is required');
    }
  }

  async sendEmail(
    to: string,
    content: EmailContent,
    options: EmailOptions = {},
  ): Promise<EmailDeliveryResult> {
    try {
      // Create a transporter object using SMTP transport
      const transporter = nodemailer.createTransport({
        host: this.config.smtpHost,
        port: this.config.smtpPort,
        secure: Number(this.config.smtpPort) === 857,
        auth: {
          user: this.config.smtpUser,
          pass: this.config.smtpPassword,
        },
      });

      // Build the mail options object
      const mailOptions: Record<string, any> = {
        from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
        to: to,
        subject: content.subject,
        text: content.text,
        html: content.html,
      };

      if (options.replyTo) mailOptions.replyTo = options.replyTo;
      if (options.cc) mailOptions.cc = options.cc;
      if (options.bcc) mailOptions.bcc = options.bcc;
      if (options.headers) mailOptions.headers = options.headers;
      if (options.priority) mailOptions.priority = options.priority;

      // Handle attachments if present
      if (options.attachments && Array.isArray(options.attachments)) {
        mailOptions.attachments = options.attachments.map((att) => {
          const attachment: Record<string, any> = {
            filename: att.filename,
            content: att.content,
            contentType: att.contentType,
          };

          if (att.disposition) {
            // nodemailer uses "contentDisposition" or "contentDisposition" (case insensitive)
            attachment.contentDisposition = att.disposition;
          }
          if (att.contentId) {
            attachment.cid = att.contentId;
          }
          return attachment;
        });
      }

      const info = await transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId:
          info?.messageId ||
          (typeof info === 'object' ? info.messageId : undefined),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SMTP_ERROR',
          message:
            error instanceof Error ? error.message : 'Unknown SMTP error',
          retryable: true,
          details: error,
        },
      };
    }
  }

  async sendBulkEmail(
    recipients: string[],
    content: EmailContent,
    options: EmailOptions = {},
  ): Promise<EmailDeliveryResult[]> {
    try {
      this.logger.debug(
        `SMTP: Sending bulk email to ${recipients.length} recipients`,
      );

      const results: EmailDeliveryResult[] = [];

      // SMTP typically sends individually
      for (const recipient of recipients) {
        const result = await this.sendEmail(recipient, content, options);
        results.push(result);
      }

      return results;
    } catch (error) {
      this.logger.error('SMTP: Bulk email failed:', error);
      return recipients.map(() => ({
        success: false,
        error: {
          code: 'SMTP_BULK_ERROR',
          message:
            error instanceof Error ? error.message : 'Unknown SMTP bulk error',
          retryable: true,
          details: error,
        },
      }));
    }
  }

  validateEmailAddress(email: string): boolean {
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return (
      emailRegex.test(email) &&
      !email.includes('..') &&
      !email.startsWith('.') &&
      !email.endsWith('.')
    );
  }

  getProviderName(): string {
    return 'SMTP';
  }
}
