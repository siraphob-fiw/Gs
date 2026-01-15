import { Injectable, Logger } from '@nestjs/common';
import {
  IEmailProvider,
  EmailProviderConfig,
  EmailProviderType,
} from '../interfaces/email.interface';
import { SESProvider } from './ses.provider';
import { SMTPProvider } from './smtp.provider';

@Injectable()
export class EmailProviderFactory {
  private readonly logger = new Logger(EmailProviderFactory.name);

  createProvider(config: EmailProviderConfig): IEmailProvider {
    this.logger.debug(`Creating email provider: ${config.provider}`);

    switch (config.provider) {
      case 'ses':
        return new SESProvider(config);
      case 'smtp':
        return new SMTPProvider(config);
      default:
        throw new Error(`Unsupported email provider: ${config.provider}`);
    }
  }

  getSupportedProviders(): EmailProviderType[] {
    return ['ses', 'smtp'];
  }

  validateConfig(config: EmailProviderConfig): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!config.provider) {
      errors.push('Provider is required');
    }

    if (!config.fromEmail) {
      errors.push('From email is required');
    }

    if (!config.fromName) {
      errors.push('From name is required');
    }

    // Provider-specific validation
    switch (config.provider) {
      case 'ses':
        if (!config.apiKey) {
          errors.push('API key is required for SES');
        }
        if (!config.region) {
          errors.push('Region is required for SES');
        }
        break;
      case 'smtp':
        if (!config.smtpHost) {
          errors.push('SMTP host is required');
        }
        if (!config.smtpPort) {
          errors.push('SMTP port is required');
        }
        if (!config.smtpUser) {
          errors.push('SMTP user is required');
        }
        if (!config.smtpPassword) {
          errors.push('SMTP password is required');
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
