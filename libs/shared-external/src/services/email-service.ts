import { Results } from '@strengthos/shared-utils';
import { EmailConfig, EmailMessage, EmailResult } from '../types/external-types';

export class EmailService {
  constructor(private config: EmailConfig) {}

  async sendEmail(message: EmailMessage): Promise<Results<EmailResult>> {
    try {
      // Mock implementation for Phase 3
      const result: EmailResult = {
        messageId: `mock-${Date.now()}`,
        accepted: Array.isArray(message.to) ? message.to : [message.to],
        rejected: []
      };
      return Results.ok(result);
    } catch (error) {
      return Results.fail<EmailResult>(undefined, `Email send failed: ${error}`);
    }
  }
}