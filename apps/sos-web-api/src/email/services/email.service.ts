import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import {
  IEmailProvider,
  EmailContent,
  EmailOptions,
  EmailDeliveryResult,
  EmailProviderConfig,
} from '../interfaces/email.interface';
import { DatabaseService } from '@/database/database.service';

@Injectable()
export class EmailService {
  constructor(
    @Inject('EMAIL_PROVIDER') private readonly provider: IEmailProvider,
    private readonly databaseService: DatabaseService,
  ) {}

  async sendEmail(
    to: string,
    content: EmailContent,
    options?: EmailOptions,
  ): Promise<EmailDeliveryResult> {
    try {
      if (!this.validateEmailAddress(to)) {
        this.databaseService.knex('logs').insert({
          log_level: 'ERROR',
          short_message: `Invalid email address: ${to}`,
          full_message: JSON.stringify({ to, content, options }),
        });
        throw new BadRequestException('Invalid email address');
      }

      const result = await this.provider.sendEmail(to, content, options);
      result.provider = this.provider.getProviderName();
      result.timestamp = new Date();

      if (result) {
        this.databaseService.knex('logs').insert({
          log_level: 'INFO',
          short_message: `Email sent to ${to}`,
          full_message: JSON.stringify(result),
        });
      }

      return result;
    } catch (error) {
      this.databaseService.knex('logs').insert({
        log_level: 'ERROR',
        short_message: `Failed to send email to ${to}`,
        full_message: JSON.stringify(error),
      });
      throw error;
    }
  }

  async sendBulkEmail(
    recipients: string[],
    content: EmailContent,
    options?: EmailOptions,
  ): Promise<EmailDeliveryResult[]> {
    try {
      this.databaseService.knex('logs').insert({
        log_level: 'DEBUG',
        short_message: `Sending bulk email to ${recipients.length} recipients`,
      });

      const validRecipients = recipients.filter((email) =>
        this.validateEmailAddress(email),
      );
      const invalidEmails = recipients.filter(
        (email) => !this.validateEmailAddress(email),
      );

      if (invalidEmails.length > 0) {
        this.databaseService.knex('logs').insert({
          log_level: 'WARN',
          short_message: `Invalid email addresses found: ${invalidEmails.join(', ')}`,
        });
      }

      const results = await this.provider.sendBulkEmail(
        validRecipients,
        content,
        options,
      );

      // Add provider and timestamp info
      results.forEach((result) => {
        result.provider = this.provider.getProviderName();
        result.timestamp = new Date();
      });

      const successCount = results.filter((r) => r.success).length;
      this.databaseService.knex('logs').insert({
        log_level: 'INFO',
        short_message: `Bulk email completed: ${successCount}/${validRecipients.length} successful`,
      });

      return results;
    } catch (error) {
      this.databaseService.knex('logs').insert({
        log_level: 'ERROR',
        short_message: `Bulk email sending error`,
        full_message: JSON.stringify(error),
      });
      throw error;
    }
  }

  validateEmailAddress(email: string): boolean {
    if (!email || email.length === 0) {
      return false;
    }

    // Comprehensive email validation
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    // Additional checks for common invalid patterns
    if (email.includes('..') || email.startsWith('.') || email.endsWith('.')) {
      return false;
    }

    return emailRegex.test(email);
  }

  getProviderName(): string {
    return this.provider.getProviderName();
  }

  // Method to switch providers at runtime
  async switchProvider(config: EmailProviderConfig): Promise<void> {
    try {
      // Note: This would require a different approach since provider is readonly
      // For now, we'll just log the attempt
      this.databaseService.knex('logs').insert({
        log_level: 'WARN',
        short_message: `Provider switching not supported in current implementation. Requested: ${config.provider}`,
      });
    } catch (error) {
      this.databaseService.knex('logs').insert({
        log_level: 'ERROR',
        short_message: `Failed to switch email provider`,
        full_message: JSON.stringify(error),
      });
      throw error;
    }
  }
}
