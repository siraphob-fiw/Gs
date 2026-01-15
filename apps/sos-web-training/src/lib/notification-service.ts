import { NotificationType, NotificationChannelType } from '@strengthos/shared-types';
import { Logger } from '@strengthos/shared-logging';
import { consoleLogService } from './console-logger';

const logger = new Logger(consoleLogService);

// Simple client-side notification service
class ClientNotificationService {
  private serviceName: string;

  constructor(config: { serviceName: string }) {
    this.serviceName = config.serviceName;
  }

  async send(notification: {
    userId: string;
    template: any;
    data: Record<string, string>;
  }): Promise<void> {
    // In a real implementation, this would send to a notification service
    console.log(
      `[NOTIFICATION] Sending to user ${notification.userId}:`,
      notification.template.title,
    );

    // For web, we can show browser notifications if permission is granted
    if ('Notification' in window && Notification.permission === 'granted') {
      const title = this.interpolateTemplate(notification.template.title, notification.data);
      const body = this.interpolateTemplate(notification.template.body, notification.data);

      new Notification(title, {
        body,
        icon: '/favicon.ico',
      });
    }
  }

  async registerDevice(
    userId: string,
    device: { type: string; token: string; metadata?: any },
  ): Promise<void> {
    console.log(`[NOTIFICATION] Registering device for user ${userId}:`, device.type);
  }

  async unregisterDevice(userId: string, token: string): Promise<void> {
    console.log(`[NOTIFICATION] Unregistering device for user ${userId}`);
  }

  private interpolateTemplate(template: string, data: Record<string, string>): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => data[key] || match);
  }
}

// Create notification service instance
export const notificationService = new ClientNotificationService({
  serviceName: 'sos-web-training',
});

// Notification templates for the training app
export const NotificationTemplates = {
  WORKOUT_REMINDER: {
    type: NotificationType.WORKOUT_REMINDER,
    title: 'Workout Reminder',
    body: 'Your workout "{workoutName}" is scheduled to start in {minutes} minutes.',
    channels: [NotificationChannelType.PUSH, NotificationChannelType.EMAIL],
  },

  WORKOUT_COMPLETED: {
    type: NotificationType.PROGRESS_UPDATE,
    title: 'Workout Completed!',
    body: 'Great job completing "{workoutName}"! You burned {calories} calories.',
    channels: [NotificationChannelType.PUSH],
  },

  PROGRAM_GENERATED: {
    type: NotificationType.PROGRESS_UPDATE,
    title: 'New Program Ready',
    body: 'Your personalized training program "{programName}" has been generated and is ready to start.',
    channels: [NotificationChannelType.PUSH, NotificationChannelType.EMAIL],
  },

  COACH_MESSAGE: {
    type: NotificationType.COACH_MESSAGE,
    title: 'Message from Coach',
    body: 'You have a new message from your coach: "{message}"',
    channels: [NotificationChannelType.PUSH, NotificationChannelType.EMAIL],
  },

  ADAPTATION_APPROVED: {
    type: NotificationType.PROGRESS_UPDATE,
    title: 'Program Adaptation Approved',
    body: 'Your coach has approved the program adaptation. Your training plan has been updated.',
    channels: [NotificationChannelType.PUSH],
  },

  PERFORMANCE_MILESTONE: {
    type: NotificationType.PROGRESS_UPDATE,
    title: 'Performance Milestone!',
    body: "Congratulations! You've achieved a new personal best in {exercise}: {value}",
    channels: [NotificationChannelType.PUSH],
  },
} as const;

// Helper functions for common notification patterns
export const NotificationHelpers = {
  /**
   * Send workout reminder notification
   */
  async sendWorkoutReminder(
    userId: string,
    workoutName: string,
    minutesUntilStart: number,
  ): Promise<void> {
    try {
      await notificationService.send({
        userId,
        template: NotificationTemplates.WORKOUT_REMINDER,
        data: {
          workoutName,
          minutes: minutesUntilStart.toString(),
        },
      });

      await logger.info({
        message: 'Workout reminder sent',
        fullMessage: `Sent workout reminder to user ${userId} for workout "${workoutName}"`,
      });
    } catch (error) {
      await logger.error({
        message: 'Failed to send workout reminder',
        fullMessage: `Error sending workout reminder to user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  },

  /**
   * Send workout completion notification
   */
  async sendWorkoutCompleted(
    userId: string,
    workoutName: string,
    caloriesBurned: number,
  ): Promise<void> {
    try {
      await notificationService.send({
        userId,
        template: NotificationTemplates.WORKOUT_COMPLETED,
        data: {
          workoutName,
          calories: caloriesBurned.toString(),
        },
      });

      await logger.info({
        message: 'Workout completion notification sent',
        fullMessage: `Sent workout completion notification to user ${userId} for workout "${workoutName}"`,
      });
    } catch (error) {
      await logger.error({
        message: 'Failed to send workout completion notification',
        fullMessage: `Error sending workout completion notification to user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  },

  /**
   * Send program generation notification
   */
  async sendProgramGenerated(userId: string, programName: string): Promise<void> {
    try {
      await notificationService.send({
        userId,
        template: NotificationTemplates.PROGRAM_GENERATED,
        data: {
          programName,
        },
      });

      await logger.info({
        message: 'Program generation notification sent',
        fullMessage: `Sent program generation notification to user ${userId} for program "${programName}"`,
      });
    } catch (error) {
      await logger.error({
        message: 'Failed to send program generation notification',
        fullMessage: `Error sending program generation notification to user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  },

  /**
   * Send coach message notification
   */
  async sendCoachMessage(userId: string, message: string): Promise<void> {
    try {
      await notificationService.send({
        userId,
        template: NotificationTemplates.COACH_MESSAGE,
        data: {
          message: message.length > 100 ? message.substring(0, 100) + '...' : message,
        },
      });

      await logger.info({
        message: 'Coach message notification sent',
        fullMessage: `Sent coach message notification to user ${userId}`,
      });
    } catch (error) {
      await logger.error({
        message: 'Failed to send coach message notification',
        fullMessage: `Error sending coach message notification to user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  },

  /**
   * Send performance milestone notification
   */
  async sendPerformanceMilestone(userId: string, exercise: string, value: string): Promise<void> {
    try {
      await notificationService.send({
        userId,
        template: NotificationTemplates.PERFORMANCE_MILESTONE,
        data: {
          exercise,
          value,
        },
      });

      await logger.info({
        message: 'Performance milestone notification sent',
        fullMessage: `Sent performance milestone notification to user ${userId} for ${exercise}: ${value}`,
      });
    } catch (error) {
      await logger.error({
        message: 'Failed to send performance milestone notification',
        fullMessage: `Error sending performance milestone notification to user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  },

  /**
   * Register for push notifications
   */
  async registerPushNotifications(userId: string): Promise<void> {
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        });

        await notificationService.registerDevice(userId, {
          type: 'web_push',
          token: JSON.stringify(subscription),
          metadata: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
          },
        });

        await logger.info({
          message: 'Push notifications registered',
          fullMessage: `Registered push notifications for user ${userId}`,
        });
      }
    } catch (error) {
      await logger.error({
        message: 'Failed to register push notifications',
        fullMessage: `Error registering push notifications for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  },

  /**
   * Unregister from push notifications
   */
  async unregisterPushNotifications(userId: string): Promise<void> {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
          await subscription.unsubscribe();
          await notificationService.unregisterDevice(userId, JSON.stringify(subscription));
        }

        await logger.info({
          message: 'Push notifications unregistered',
          fullMessage: `Unregistered push notifications for user ${userId}`,
        });
      }
    } catch (error) {
      await logger.error({
        message: 'Failed to unregister push notifications',
        fullMessage: `Error unregistering push notifications for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  },
};

export default notificationService;
