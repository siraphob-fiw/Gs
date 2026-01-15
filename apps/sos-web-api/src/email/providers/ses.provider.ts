import { Injectable, Logger } from '@nestjs/common';
import {
  IEmailProvider,
  EmailContent,
  EmailOptions,
  EmailDeliveryResult,
  EmailProviderConfig,
} from '../interfaces/email.interface';

@Injectable()
export class SESProvider implements IEmailProvider {
  private readonly logger = new Logger(SESProvider.name);
  private readonly config: EmailProviderConfig;

  constructor(config: EmailProviderConfig) {
    this.config = config;
    this.validateConfig();
  }

  private validateConfig(): void {
    if (!this.config.apiKey) {
      throw new Error('SES API key is required');
    }
    if (!this.config.region) {
      throw new Error('SES region is required');
    }
  }

  async sendEmail(
    to: string,
    content: EmailContent,
    options: EmailOptions = {},
  ): Promise<EmailDeliveryResult> {
    try {
      const params = {
        Source: `${this.config.fromName} <${this.config.fromEmail}>`,
        Destination: {
          ToAddresses: [to],
          CcAddresses: options.cc || [],
          BccAddresses: options.bcc || [],
        },
        Message: {
          Subject: {
            Data: content.subject,
            Charset: 'UTF-8',
          },
          Body: {
            Text: content.text
              ? {
                  Data: content.text,
                  Charset: 'UTF-8',
                }
              : undefined,
            Html: content.html
              ? {
                  Data: content.html,
                  Charset: 'UTF-8',
                }
              : undefined,
          },
        },
        ReplyToAddresses: options.replyTo ? [options.replyTo] : undefined,
        Tags: options.tags?.map((tag) => ({
          Name: 'Tag',
          Value: tag,
        })),
        ConfigurationSetName: options.tags?.[0], // Use first tag as config set
      };
      Logger.log(JSON.stringify(params));

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 150));

      Logger.log(`SES: Email sent successfully to ${to}`);

      return {
        success: true,
        messageId: `ses_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
    } catch (error) {
      Logger.error(`SES: Failed to send email to ${to}:`, error);
      return {
        success: false,
        error: {
          code: 'SES_ERROR',
          message: error instanceof Error ? error.message : 'Unknown SES error',
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
        `SES: Sending bulk email to ${recipients.length} recipients`,
      );

      // SES supports bulk sending with multiple destinations
      const results: EmailDeliveryResult[] = [];

      // Process in batches of 50 (SES limit)
      const batchSize = 50;
      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);

        for (const recipient of batch) {
          const result = await this.sendEmail(recipient, content, options);
          results.push(result);
        }
      }

      return results;
    } catch (error) {
      this.logger.error('SES: Bulk email failed:', error);
      return recipients.map(() => ({
        success: false,
        error: {
          code: 'SES_BULK_ERROR',
          message:
            error instanceof Error ? error.message : 'Unknown SES bulk error',
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
    return 'AWS SES';
  }
}
