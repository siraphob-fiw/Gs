// SMS service migrated from human-lift-training-api/src/Services/Notifications/SMSService.ts
import { Results } from '@strengthos/shared-utils';
import { ILogger } from '@strengthos/shared-logging';
import { NotificationError, NotificationErrorCode } from '@strengthos/shared-types';

export interface SMSServiceConfig {
  provider: 'twilio' | 'aws-sns' | 'mock';
  accountSid?: string;
  authToken?: string;
  fromNumber: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

export interface SMSDeliveryResult {
  success: boolean;
  messageId?: string;
  error?: NotificationError;
  phoneNumber: string;
}

export interface SMSServiceInterface {
  sendSMS(
    phoneNumber: string,
    message: string,
    options?: SMSOptions,
  ): Promise<Results<SMSDeliveryResult>>;
  
  sendBulkSMS(
    phoneNumbers: string[],
    message: string,
    options?: SMSOptions,
  ): Promise<Results<SMSDeliveryResult[]>>;
  
  validatePhoneNumber(phoneNumber: string): boolean;
  formatPhoneNumber(phoneNumber: string, countryCode?: string): string;
}

export interface SMSOptions {
  mediaUrls?: string[];
  statusCallback?: string;
  maxPrice?: number;
  provideFeedback?: boolean;
}

/**
 * SMS Service Implementation
 * Supports multiple SMS providers with international capabilities
 */
export class SMSService implements SMSServiceInterface {
  private config: SMSServiceConfig;

  constructor(
    config: SMSServiceConfig,
    private readonly logger: ILogger
  ) {
    this.config = config;
  }

  async sendSMS(
    phoneNumber: string,
    message: string,
    options: SMSOptions = {},
  ): Promise<Results<SMSDeliveryResult>> {
    try {
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      
      if (!this.validatePhoneNumber(formattedNumber)) {
        return Results.fail<SMSDeliveryResult>(null, 'Invalid phone number format');
      }

      // Check message length (SMS limit is typically 160 characters)
      if (message.length > 1600) { // Allow for concatenated SMS
        return Results.fail<SMSDeliveryResult>(null, 'Message too long for SMS');
      }

      let result: SMSDeliveryResult;

      switch (this.config.provider) {
        case 'twilio':
          result = await this.sendWithTwilio(formattedNumber, message, options);
          break;
        case 'aws-sns':
          result = await this.sendWithAWSSNS(formattedNumber, message, options);
          break;
        case 'mock':
          result = await this.sendWithMock(formattedNumber, message, options);
          break;
        default:
          return Results.fail<SMSDeliveryResult>(null, `Unsupported SMS provider: ${this.config.provider}`);
      }

      return Results.ok(result);
    } catch (error) {
      this.logger.error({ 
        message: 'SMS sending error', 
        fullMessage: (error as Error).message 
      });
      
      return Results.fail<SMSDeliveryResult>(null, 'Failed to send SMS');
    }
  }

  async sendBulkSMS(
    phoneNumbers: string[],
    message: string,
    options: SMSOptions = {},
  ): Promise<Results<SMSDeliveryResult[]>> {
    try {
      const results: SMSDeliveryResult[] = [];
      
      // Send to each number individually
      // In production, use bulk APIs where available
      for (const phoneNumber of phoneNumbers) {
        const result = await this.sendSMS(phoneNumber, message, options);
        if (result.isOk && result.returnValue) {
          results.push(result.returnValue);
        } else {
          results.push({
            success: false,
            phoneNumber,
            error: {
              code: NotificationErrorCode.DELIVERY_FAILED,
              message: result.message || 'Failed to send SMS',
              retryable: true,
            },
          });
        }
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return Results.ok(results);
    } catch (error) {
      this.logger.error({ 
        message: 'Bulk SMS sending error', 
        fullMessage: (error as Error).message 
      });
      
      return Results.fail<SMSDeliveryResult[]>(null, 'Failed to send bulk SMS');
    }
  }

  validatePhoneNumber(phoneNumber: string): boolean {
    // Basic E.164 format validation
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
  }

  formatPhoneNumber(phoneNumber: string, countryCode: string = '+1'): string {
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');
    
    // If it already starts with +, return as is
    if (phoneNumber.startsWith('+')) {
      return phoneNumber;
    }
    
    // If it starts with country code digits, add +
    if (digits.length > 10) {
      return `+${digits}`;
    }
    
    // If it's a local number, add default country code
    if (digits.length === 10) {
      return `${countryCode}${digits}`;
    }
    
    // Return original if we can't format it
    return phoneNumber;
  }

  // ============================================================================
  // PROVIDER-SPECIFIC IMPLEMENTATIONS
  // ============================================================================

  private async sendWithTwilio(
    phoneNumber: string,
    message: string,
    options: SMSOptions,
  ): Promise<SMSDeliveryResult> {
    // Mock implementation - in production, use twilio SDK
    this.logger.info({ 
      message: 'Twilio: Sending SMS',
      fullMessage: `To: ${phoneNumber}, From: ${this.config.fromNumber}, Account SID: ${this.config.accountSid}`
    });
    
    if (options.mediaUrls?.length) {
      this.logger.debug({ message: `Media URLs: ${options.mediaUrls.join(', ')}` });
    }
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Simulate occasional failures
    if (Math.random() < 0.02) { // 2% failure rate
      return {
        success: false,
        phoneNumber,
        error: {
          code: NotificationErrorCode.DELIVERY_FAILED,
          message: 'Twilio delivery failed',
          retryable: true,
        },
      };
    }
    
    return {
      success: true,
      messageId: `twilio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      phoneNumber,
    };
  }

  private async sendWithAWSSNS(
    phoneNumber: string,
    message: string,
    options: SMSOptions,
  ): Promise<SMSDeliveryResult> {
    // Mock implementation - in production, use AWS SDK
    this.logger.info({ 
      message: 'AWS SNS: Sending SMS',
      fullMessage: `To: ${phoneNumber}, Region: ${this.config.region}`
    });
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Simulate occasional failures
    if (Math.random() < 0.03) { // 3% failure rate
      return {
        success: false,
        phoneNumber,
        error: {
          code: NotificationErrorCode.DELIVERY_FAILED,
          message: 'AWS SNS delivery failed',
          retryable: true,
        },
      };
    }
    
    return {
      success: true,
      messageId: `sns_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      phoneNumber,
    };
  }

  private async sendWithMock(
    phoneNumber: string,
    message: string,
    options: SMSOptions,
  ): Promise<SMSDeliveryResult> {
    this.logger.info({ 
      message: 'Mock SMS Service: Sending SMS',
      fullMessage: `To: ${phoneNumber}, From: ${this.config.fromNumber}, Message Length: ${message.length}`
    });
    
    if (options.mediaUrls?.length) {
      this.logger.debug({ message: `Media URLs: ${options.mediaUrls.join(', ')}` });
    }
    
    if (options.statusCallback) {
      this.logger.debug({ message: `Status Callback: ${options.statusCallback}` });
    }
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate occasional failures
    if (Math.random() < 0.01) { // 1% failure rate
      return {
        success: false,
        phoneNumber,
        error: {
          code: NotificationErrorCode.DELIVERY_FAILED,
          message: 'Mock SMS delivery failure',
          retryable: true,
        },
      };
    }
    
    return {
      success: true,
      messageId: `mock_sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      phoneNumber,
    };
  }
}

/**
 * Factory function to create SMS service
 */
export function createSMSService(config: SMSServiceConfig, logger: ILogger): SMSService {
  return new SMSService(config, logger);
}

// Default configuration
export const DEFAULT_SMS_CONFIG: SMSServiceConfig = {
  provider: 'mock',
  fromNumber: '+1234567890',
};