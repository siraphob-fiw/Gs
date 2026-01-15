import { registerAs } from '@nestjs/config';
import { EmailProviderConfig } from '../interfaces/email.interface';

export default registerAs(
  'email',
  (): EmailProviderConfig => ({
    provider: (process.env.EMAIL_PROVIDER as any) || 'smtp',
    apiKey: process.env.EMAIL_API_KEY,
    region: process.env.EMAIL_REGION,
    smtpHost: process.env.EMAIL_SMTP_HOST,
    smtpPort: process.env.EMAIL_SMTP_PORT
      ? parseInt(process.env.EMAIL_SMTP_PORT, 10)
      : undefined,
    smtpUser: process.env.EMAIL_SMTP_USER,
    smtpPassword: process.env.EMAIL_SMTP_PASSWORD,
    fromEmail: process.env.EMAIL_FROM_EMAIL || 'noreply@strengthos.com',
    fromName: process.env.EMAIL_FROM_NAME || 'StrengthOS',
    domain: process.env.EMAIL_DOMAIN,
    webhookSecret: process.env.EMAIL_WEBHOOK_SECRET,
    sandboxMode: process.env.EMAIL_SANDBOX_MODE === 'true',
  }),
);

export const emailConfigValidation = {
  EMAIL_PROVIDER: {
    type: 'string',
    enum: ['sendgrid', 'ses', 'smtp', 'mailgun'],
    default: 'smtp',
  },
  EMAIL_API_KEY: {
    type: 'string',
    required: false,
  },
  EMAIL_REGION: {
    type: 'string',
    required: false,
  },
  EMAIL_SMTP_HOST: {
    type: 'string',
    required: false,
  },
  EMAIL_SMTP_PORT: {
    type: 'number',
    required: false,
  },
  EMAIL_SMTP_USER: {
    type: 'string',
    required: false,
  },
  EMAIL_SMTP_PASSWORD: {
    type: 'string',
    required: false,
  },
  EMAIL_FROM_EMAIL: {
    type: 'string',
    default: 'noreply@strengthos.com',
  },
  EMAIL_FROM_NAME: {
    type: 'string',
    default: 'StrengthOS',
  },
  EMAIL_DOMAIN: {
    type: 'string',
    required: false,
  },
  EMAIL_WEBHOOK_SECRET: {
    type: 'string',
    required: false,
  },
  EMAIL_SANDBOX_MODE: {
    type: 'boolean',
    default: false,
  },
};
