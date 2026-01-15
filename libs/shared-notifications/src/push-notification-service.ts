// Push notification service migrated from human-lift-training-api/src/Services/Notifications/PushNotificationService.ts
import { Results } from '@strengthos/shared-utils';
import { ILogger } from '@strengthos/shared-logging';
import { 
  PushDeviceToken, 
  PushPlatform, 
  NotificationError, 
  NotificationErrorCode 
} from '@strengthos/shared-types';

export interface PushServiceConfig {
  firebase?: {
    projectId: string;
    privateKey: string;
    clientEmail: string;
  };
  apns?: {
    keyId: string;
    teamId: string;
    privateKey: string;
    bundleId: string;
    production: boolean;
  };
  mock?: boolean;
}

export interface PushDeliveryResult {
  success: boolean;
  messageId?: string;
  error?: NotificationError;
  deviceToken: string;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  badge?: number;
  sound?: string;
  clickAction?: string;
  imageUrl?: string;
  priority?: 'normal' | 'high';
  timeToLive?: number;
}

export interface PushServiceInterface {
  sendPushNotification(
    deviceTokens: PushDeviceToken[],
    payload: PushNotificationPayload,
  ): Promise<Results<PushDeliveryResult[]>>;
  
  sendToTopic(
    topic: string,
    payload: PushNotificationPayload,
  ): Promise<Results<PushDeliveryResult>>;
  
  subscribeToTopic(
    deviceTokens: string[],
    topic: string,
  ): Promise<Results<boolean>>;
  
  unsubscribeFromTopic(
    deviceTokens: string[],
    topic: string,
  ): Promise<Results<boolean>>;
  
  validateDeviceToken(token: string, platform: PushPlatform): boolean;
}

/**
 * Push Notification Service Implementation
 * Supports Firebase Cloud Messaging and Apple Push Notification Service
 */
export class PushNotificationService implements PushServiceInterface {
  private config: PushServiceConfig;

  constructor(
    config: PushServiceConfig,
    private readonly logger: ILogger
  ) {
    this.config = config;
  }

  async sendPushNotification(
    deviceTokens: PushDeviceToken[],
    payload: PushNotificationPayload,
  ): Promise<Results<PushDeliveryResult[]>> {
    try {
      const results: PushDeliveryResult[] = [];

      for (const deviceToken of deviceTokens) {
        try {
          let result: PushDeliveryResult;

          switch (deviceToken.platform) {
            case PushPlatform.ANDROID:
            case PushPlatform.WEB:
              result = await this.sendWithFirebase(deviceToken, payload);
              break;
            case PushPlatform.IOS:
              result = await this.sendWithAPNS(deviceToken, payload);
              break;
            default:
              result = {
                success: false,
                deviceToken: deviceToken.token,
                error: {
                  code: NotificationErrorCode.CHANNEL_UNAVAILABLE,
                  message: `Unsupported platform: ${deviceToken.platform}`,
                  retryable: false,
                },
              };
          }

          results.push(result);
        } catch (error) {
          results.push({
            success: false,
            deviceToken: deviceToken.token,
            error: {
              code: NotificationErrorCode.EXTERNAL_SERVICE_ERROR,
              message: (error as Error).message,
              retryable: true,
            },
          });
        }
      }

      return Results.ok(results);
    } catch (error) {
      this.logger.error({ 
        message: 'Push notification sending error', 
        fullMessage: (error as Error).message 
      });
      
      return Results.fail<PushDeliveryResult[]>(null, 'Failed to send push notifications');
    }
  }

  async sendToTopic(
    topic: string,
    payload: PushNotificationPayload,
  ): Promise<Results<PushDeliveryResult>> {
    try {
      let result: PushDeliveryResult;

      if (this.config.mock) {
        result = await this.sendTopicWithMock(topic, payload);
      } else if (this.config.firebase) {
        result = await this.sendTopicWithFirebase(topic, payload);
      } else {
        return Results.fail<PushDeliveryResult>(null, 'No push notification service configured');
      }

      return Results.ok(result);
    } catch (error) {
      this.logger.error({ 
        message: 'Topic push notification error', 
        fullMessage: (error as Error).message 
      });
      
      return Results.fail<PushDeliveryResult>(null, 'Failed to send topic push notification');
    }
  }

  async subscribeToTopic(
    deviceTokens: string[],
    topic: string,
  ): Promise<Results<boolean>> {
    try {
      if (this.config.mock) {
        this.logger.info({ 
          message: `Mock: Subscribing ${deviceTokens.length} devices to topic: ${topic}` 
        });
        return Results.ok(true);
      }

      // In production, use Firebase Admin SDK
      this.logger.info({ 
        message: `Subscribing ${deviceTokens.length} devices to topic: ${topic}` 
      });
      
      return Results.ok(true);
    } catch (error) {
      this.logger.error({ 
        message: 'Topic subscription error', 
        fullMessage: (error as Error).message 
      });
      
      return Results.fail<boolean>(null, 'Failed to subscribe to topic');
    }
  }

  async unsubscribeFromTopic(
    deviceTokens: string[],
    topic: string,
  ): Promise<Results<boolean>> {
    try {
      if (this.config.mock) {
        this.logger.info({ 
          message: `Mock: Unsubscribing ${deviceTokens.length} devices from topic: ${topic}` 
        });
        return Results.ok(true);
      }

      // In production, use Firebase Admin SDK
      this.logger.info({ 
        message: `Unsubscribing ${deviceTokens.length} devices from topic: ${topic}` 
      });
      
      return Results.ok(true);
    } catch (error) {
      this.logger.error({ 
        message: 'Topic unsubscription error', 
        fullMessage: (error as Error).message 
      });
      
      return Results.fail<boolean>(null, 'Failed to unsubscribe from topic');
    }
  }

  validateDeviceToken(token: string, platform: PushPlatform): boolean {
    if (!token || token.length === 0) {
      return false;
    }

    switch (platform) {
      case PushPlatform.ANDROID:
      case PushPlatform.WEB:
        // Firebase tokens are typically 152+ characters
        return token.length >= 140;
      case PushPlatform.IOS:
        // APNS tokens are 64 hex characters
        return /^[a-fA-F0-9]{64}$/.test(token);
      default:
        return false;
    }
  }

  // ============================================================================
  // FIREBASE CLOUD MESSAGING
  // ============================================================================

  private async sendWithFirebase(
    deviceToken: PushDeviceToken,
    payload: PushNotificationPayload,
  ): Promise<PushDeliveryResult> {
    if (this.config.mock) {
      return await this.sendWithMock(deviceToken, payload);
    }

    // Mock implementation - in production, use Firebase Admin SDK
    this.logger.info({ 
      message: 'Firebase: Sending push notification',
      fullMessage: `Device Token: ${deviceToken.token}, Platform: ${deviceToken.platform}, Title: ${payload.title}`
    });

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simulate occasional failures
    if (Math.random() < 0.02) { // 2% failure rate
      return {
        success: false,
        deviceToken: deviceToken.token,
        error: {
          code: NotificationErrorCode.DELIVERY_FAILED,
          message: 'Firebase delivery failed',
          retryable: true,
        },
      };
    }

    return {
      success: true,
      messageId: `fcm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      deviceToken: deviceToken.token,
    };
  }

  private async sendTopicWithFirebase(
    topic: string,
    payload: PushNotificationPayload,
  ): Promise<PushDeliveryResult> {
    this.logger.info({ 
      message: 'Firebase: Sending to topic',
      fullMessage: `Topic: ${topic}, Title: ${payload.title}`
    });

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 150));

    return {
      success: true,
      messageId: `fcm_topic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      deviceToken: `topic:${topic}`,
    };
  }

  // ============================================================================
  // APPLE PUSH NOTIFICATION SERVICE
  // ============================================================================

  private async sendWithAPNS(
    deviceToken: PushDeviceToken,
    payload: PushNotificationPayload,
  ): Promise<PushDeliveryResult> {
    if (this.config.mock) {
      return await this.sendWithMock(deviceToken, payload);
    }

    // Mock implementation - in production, use node-apn or similar
    this.logger.info({ 
      message: 'APNS: Sending push notification',
      fullMessage: `Device Token: ${deviceToken.token}, Bundle ID: ${this.config.apns?.bundleId}, Title: ${payload.title}`
    });

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 120));

    // Simulate occasional failures
    if (Math.random() < 0.03) { // 3% failure rate
      return {
        success: false,
        deviceToken: deviceToken.token,
        error: {
          code: NotificationErrorCode.DELIVERY_FAILED,
          message: 'APNS delivery failed',
          retryable: true,
        },
      };
    }

    return {
      success: true,
      messageId: `apns_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      deviceToken: deviceToken.token,
    };
  }

  // ============================================================================
  // MOCK IMPLEMENTATION
  // ============================================================================

  private async sendWithMock(
    deviceToken: PushDeviceToken,
    payload: PushNotificationPayload,
  ): Promise<PushDeliveryResult> {
    this.logger.info({ 
      message: 'Mock Push Service: Sending notification',
      fullMessage: `Device Token: ${deviceToken.token}, Platform: ${deviceToken.platform}, App Version: ${deviceToken.appVersion}, Title: ${payload.title}, Body: ${payload.body}`
    });

    if (payload.data) {
      this.logger.debug({ message: `Data: ${JSON.stringify(payload.data)}` });
    }
    if (payload.badge) {
      this.logger.debug({ message: `Badge: ${payload.badge}` });
    }
    if (payload.sound) {
      this.logger.debug({ message: `Sound: ${payload.sound}` });
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 80));

    // Simulate occasional failures
    if (Math.random() < 0.01) { // 1% failure rate
      return {
        success: false,
        deviceToken: deviceToken.token,
        error: {
          code: NotificationErrorCode.DELIVERY_FAILED,
          message: 'Mock delivery failure',
          retryable: true,
        },
      };
    }

    return {
      success: true,
      messageId: `mock_push_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      deviceToken: deviceToken.token,
    };
  }

  private async sendTopicWithMock(
    topic: string,
    payload: PushNotificationPayload,
  ): Promise<PushDeliveryResult> {
    this.logger.info({ 
      message: 'Mock Push Service: Sending to topic',
      fullMessage: `Topic: ${topic}, Title: ${payload.title}, Body: ${payload.body}`
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      success: true,
      messageId: `mock_topic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      deviceToken: `topic:${topic}`,
    };
  }
}

/**
 * Factory function to create push notification service
 */
export function createPushNotificationService(
  config: PushServiceConfig, 
  logger: ILogger
): PushNotificationService {
  return new PushNotificationService(config, logger);
}

// Default configuration
export const DEFAULT_PUSH_CONFIG: PushServiceConfig = {
  mock: true,
};