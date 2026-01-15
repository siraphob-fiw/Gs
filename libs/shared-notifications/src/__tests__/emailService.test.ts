import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmailService, EmailServiceConfig, createEmailService, DEFAULT_EMAIL_CONFIG } from '../email-service';
import { ILogger } from '@strengthos/shared-logging';
import { NotificationContent } from '@strengthos/shared-types';

describe('EmailService', () => {
  let mockLogger: ILogger;
  let emailService: EmailService;
  let config: EmailServiceConfig;

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    };

    config = {
      provider: 'mock',
      fromEmail: 'test@example.com',
      fromName: 'Test Service',
    };

    emailService = new EmailService(config, mockLogger);
  });

  describe('email address validation', () => {
    it('should validate correct email addresses', () => {
      expect(emailService.validateEmailAddress('test@example.com')).toBe(true);
      expect(emailService.validateEmailAddress('user.name+tag@example.co.uk')).toBe(true);
      expect(emailService.validateEmailAddress('test123@domain-name.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(emailService.validateEmailAddress('')).toBe(false);
      expect(emailService.validateEmailAddress('invalid')).toBe(false);
      expect(emailService.validateEmailAddress('@example.com')).toBe(false);
      expect(emailService.validateEmailAddress('test@')).toBe(false);
      expect(emailService.validateEmailAddress('test..email@example.com')).toBe(false);
      expect(emailService.validateEmailAddress('.test@example.com')).toBe(false);
      expect(emailService.validateEmailAddress('test@example.com.')).toBe(false);
    });
  });

  describe('sending single emails', () => {
    it('should send email successfully with mock provider', async () => {
      const content: NotificationContent = {
        subject: 'Test Subject',
        body: 'Test body content',
        language: 'en',
        contentType: 'text/plain',
        variables: {},
      };

      const result = await emailService.sendEmail('recipient@example.com', content);

      expect(result.isOk).toBe(true);
      expect(result.returnValue?.success).toBe(true);
      expect(result.returnValue?.messageId).toMatch(/^mock_\d+_[a-z0-9]+$/);
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should handle invalid email addresses', async () => {
      const content: NotificationContent = {
        subject: 'Test Subject',
        body: 'Test body content',
        language: 'en',
        contentType: 'text/plain',
        variables: {},
      };

      const result = await emailService.sendEmail('invalid-email', content);

      expect(result.isOk).toBe(false);
      expect(result.message).toBe('Invalid email address');
    });

    it('should handle different email providers', async () => {
      const providers: Array<{ provider: EmailServiceConfig['provider'], expectedPrefix: string }> = [
        { provider: 'sendgrid', expectedPrefix: 'sg' },
        { provider: 'ses', expectedPrefix: 'ses' },
        { provider: 'smtp', expectedPrefix: 'smtp' }
      ];
      
      for (const { provider, expectedPrefix } of providers) {
        const providerConfig = { ...config, provider };
        const providerService = new EmailService(providerConfig, mockLogger);
        
        const content: NotificationContent = {
          subject: 'Test Subject',
          body: 'Test body content',
          language: 'en',
          contentType: 'text/plain',
          variables: {},
        };

        const result = await providerService.sendEmail('recipient@example.com', content);

        expect(result.isOk).toBe(true);
        expect(result.returnValue?.success).toBe(true);
        expect(result.returnValue?.messageId).toMatch(new RegExp(`^${expectedPrefix}_\\d+_[a-z0-9]+$`));
      }
    });

    it('should handle unsupported providers', async () => {
      const invalidConfig = { ...config, provider: 'unsupported' as any };
      const invalidService = new EmailService(invalidConfig, mockLogger);
      
      const content: NotificationContent = {
        subject: 'Test Subject',
        body: 'Test body content',
        language: 'en',
        contentType: 'text/plain',
        variables: {},
      };

      const result = await invalidService.sendEmail('recipient@example.com', content);

      expect(result.isOk).toBe(false);
      expect(result.message).toContain('Unsupported email provider');
    });
  });

  describe('sending bulk emails', () => {
    it('should send bulk emails successfully', async () => {
      const recipients = ['user1@example.com', 'user2@example.com', 'user3@example.com'];
      const content: NotificationContent = {
        subject: 'Bulk Test Subject',
        body: 'Bulk test body content',
        language: 'en',
        contentType: 'text/plain',
        variables: {},
      };

      const result = await emailService.sendBulkEmail(recipients, content);

      expect(result.isOk).toBe(true);
      expect(result.returnValue).toHaveLength(recipients.length);
      
      result.returnValue?.forEach((emailResult, index) => {
        // Most should succeed (mock has 5% failure rate)
        if (emailResult.success) {
          expect(emailResult.messageId).toMatch(/^mock_\d+_[a-z0-9]+$/);
        }
      });
    });

    it('should handle mixed success/failure in bulk emails', async () => {
      const recipients = ['valid@example.com', 'invalid-email', 'another@example.com'];
      const content: NotificationContent = {
        subject: 'Mixed Test Subject',
        body: 'Mixed test body content',
        language: 'en',
        contentType: 'text/plain',
        variables: {},
      };

      const result = await emailService.sendBulkEmail(recipients, content);

      expect(result.isOk).toBe(true);
      expect(result.returnValue).toHaveLength(recipients.length);
      
      // Check that invalid email fails
      const invalidResult = result.returnValue?.[1];
      expect(invalidResult?.success).toBe(false);
      expect(invalidResult?.error?.message).toBe('Invalid email address');
    });
  });

  describe('email options', () => {
    it('should handle email options correctly', async () => {
      const content: NotificationContent = {
        subject: 'Test with Options',
        body: 'Test body with options',
        language: 'en',
        contentType: 'text/html',
        variables: {},
      };

      const options = {
        replyTo: 'reply@example.com',
        cc: ['cc1@example.com', 'cc2@example.com'],
        bcc: ['bcc1@example.com'],
        tags: ['newsletter', 'promotion'],
        trackOpens: true,
        trackClicks: true,
      };

      const result = await emailService.sendEmail('recipient@example.com', content, options);

      expect(result.isOk).toBe(true);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Reply-To:')
        })
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('CC:')
        })
      );
    });
  });

  describe('factory function', () => {
    it('should create email service using factory function', () => {
      const service = createEmailService(config, mockLogger);
      expect(service).toBeInstanceOf(EmailService);
    });
  });

  describe('default configuration', () => {
    it('should have correct default configuration', () => {
      expect(DEFAULT_EMAIL_CONFIG.provider).toBe('mock');
      expect(DEFAULT_EMAIL_CONFIG.fromEmail).toBe('noreply@strengthos.com');
      expect(DEFAULT_EMAIL_CONFIG.fromName).toBe('StrengthOS');
    });
  });
});
