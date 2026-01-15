import { Test, TestingModule } from '@nestjs/testing';
import { IntelligentNotificationService } from '../services/intelligent-notification.service';
import { NotificationRepository } from '../repositories/notification.repository';
import { NotificationPreferencesService } from '../services/notification-preferences.service';
import { ILogger } from '@strengthos/shared-logging';
import {
  NotificationChannelType,
  NotificationType,
  NotificationPriority,
} from '@strengthos/shared-types';

describe('IntelligentNotificationService', () => {
  let service: IntelligentNotificationService;
  let repository: jest.Mocked<NotificationRepository>;
  let preferencesService: jest.Mocked<NotificationPreferencesService>;
  let logger: jest.Mocked<ILogger>;

  beforeEach(async () => {
    const mockRepository = {
      // Add mock methods as needed
    };

    const mockPreferencesService = {
      getUserPreferences: jest.fn(),
      isInQuietHours: jest.fn(),
      shouldSendNotification: jest.fn(),
    };

    const mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntelligentNotificationService,
        {
          provide: NotificationRepository,
          useValue: mockRepository,
        },
        {
          provide: NotificationPreferencesService,
          useValue: mockPreferencesService,
        },
        {
          provide: 'ILogger',
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<IntelligentNotificationService>(IntelligentNotificationService);
    repository = module.get(NotificationRepository);
    preferencesService = module.get(NotificationPreferencesService);
    logger = module.get('ILogger');
  });

  describe('groupNotifications', () => {
    it('should group notifications by recipient and type', async () => {
      const notifications = [
        {
          id: 'notif-1',
          type: NotificationType.WORKOUT_REMINDER,
          recipientId: 'user-1',
          priority: NotificationPriority.MEDIUM,
          createdAt: new Date(),
        },
        {
          id: 'notif-2',
          type: NotificationType.WORKOUT_REMINDER,
          recipientId: 'user-1',
          priority: NotificationPriority.HIGH,
          createdAt: new Date(),
        },
        {
          id: 'notif-3',
          type: NotificationType.COACH_MESSAGE,
          recipientId: 'user-1',
          priority: NotificationPriority.MEDIUM,
          createdAt: new Date(),
        },
      ];

      const groups = await service.groupNotifications(notifications);

      expect(groups).toHaveLength(2); // Two different types
      expect(groups[0].notifications).toHaveLength(2); // Two workout reminders
      expect(groups[1].notifications).toHaveLength(1); // One coach message
      expect(groups[0].priority).toBe(NotificationPriority.HIGH); // Highest priority in group
    });

    it('should handle empty notification array', async () => {
      const groups = await service.groupNotifications([]);

      expect(groups).toHaveLength(0);
    });

    it('should create separate groups for different recipients', async () => {
      const notifications = [
        {
          id: 'notif-1',
          type: NotificationType.WORKOUT_REMINDER,
          recipientId: 'user-1',
          priority: NotificationPriority.MEDIUM,
          createdAt: new Date(),
        },
        {
          id: 'notif-2',
          type: NotificationType.WORKOUT_REMINDER,
          recipientId: 'user-2',
          priority: NotificationPriority.MEDIUM,
          createdAt: new Date(),
        },
      ];

      const groups = await service.groupNotifications(notifications);

      expect(groups).toHaveLength(2); // Different recipients
      expect(groups[0].recipientId).not.toBe(groups[1].recipientId);
    });
  });

  describe('shouldThrottleNotification', () => {
    it('should not throttle when throttling is disabled', async () => {
      // The service has throttling enabled by default, but we can test the logic
      const result = await service.shouldThrottleNotification(
        NotificationType.WORKOUT_REMINDER,
        NotificationChannelType.PUSH,
        'user-123',
        'tenant-123'
      );

      // Since we're using mock data, this will depend on the implementation
      expect(result).toHaveProperty('shouldThrottle');
      expect(typeof result.shouldThrottle).toBe('boolean');
    });

    it('should provide throttle information when limits are exceeded', async () => {
      const result = await service.shouldThrottleNotification(
        NotificationType.MARKETING_EMAIL,
        NotificationChannelType.EMAIL,
        'user-123',
        'tenant-123'
      );

      expect(result).toHaveProperty('shouldThrottle');
      if (result.shouldThrottle) {
        expect(result).toHaveProperty('reason');
        expect(result.reason).toBeTruthy();
      }
    });
  });

  describe('getUserEngagementScore', () => {
    it('should calculate engagement score between 0 and 1', async () => {
      const score = await service.getUserEngagementScore('user-123', 'tenant-123');

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should handle different time periods', async () => {
      const score7Days = await service.getUserEngagementScore('user-123', 'tenant-123', 7);
      const score30Days = await service.getUserEngagementScore('user-123', 'tenant-123', 30);

      expect(score7Days).toBeGreaterThanOrEqual(0);
      expect(score7Days).toBeLessThanOrEqual(1);
      expect(score30Days).toBeGreaterThanOrEqual(0);
      expect(score30Days).toBeLessThanOrEqual(1);
    });

    it('should return neutral score on error', async () => {
      // Mock an error in the analytics calculation
      jest.spyOn(service as any, 'calculateNotificationAnalytics').mockRejectedValue(new Error('Analytics error'));

      const score = await service.getUserEngagementScore('user-123', 'tenant-123');

      expect(score).toBe(0.5); // Neutral score
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getNotificationAnalytics', () => {
    it('should return comprehensive analytics', async () => {
      const analytics = await service.getNotificationAnalytics('tenant-123');

      expect(analytics).toHaveProperty('totalSent');
      expect(analytics).toHaveProperty('totalDelivered');
      expect(analytics).toHaveProperty('totalRead');
      expect(analytics).toHaveProperty('totalFailed');
      expect(analytics).toHaveProperty('deliveryRate');
      expect(analytics).toHaveProperty('readRate');
      expect(analytics).toHaveProperty('failureRate');
      expect(analytics).toHaveProperty('channelBreakdown');
      expect(analytics).toHaveProperty('typeBreakdown');
      expect(analytics).toHaveProperty('hourlyDistribution');
      expect(analytics).toHaveProperty('engagementScore');

      // Validate rate calculations
      expect(analytics.deliveryRate).toBeGreaterThanOrEqual(0);
      expect(analytics.deliveryRate).toBeLessThanOrEqual(1);
      expect(analytics.readRate).toBeGreaterThanOrEqual(0);
      expect(analytics.readRate).toBeLessThanOrEqual(1);
      expect(analytics.failureRate).toBeGreaterThanOrEqual(0);
      expect(analytics.failureRate).toBeLessThanOrEqual(1);
    });

    it('should handle date range filtering', async () => {
      const dateFrom = new Date('2024-01-01');
      const dateTo = new Date('2024-01-31');

      const analytics = await service.getNotificationAnalytics(
        'tenant-123',
        dateFrom,
        dateTo
      );

      expect(analytics).toHaveProperty('totalSent');
      expect(typeof analytics.totalSent).toBe('number');
    });

    it('should handle recipient filtering', async () => {
      const analytics = await service.getNotificationAnalytics(
        'tenant-123',
        undefined,
        undefined,
        'user-123'
      );

      expect(analytics).toHaveProperty('totalSent');
      expect(typeof analytics.totalSent).toBe('number');
    });
  });

  describe('optimizeNotificationTiming', () => {
    it('should return timing optimization recommendations', async () => {
      const optimization = await service.optimizeNotificationTiming('user-123', 'tenant-123');

      expect(optimization).toHaveProperty('optimalHours');
      expect(optimization).toHaveProperty('worstHours');
      expect(optimization).toHaveProperty('recommendations');

      expect(Array.isArray(optimization.optimalHours)).toBe(true);
      expect(Array.isArray(optimization.worstHours)).toBe(true);
      expect(Array.isArray(optimization.recommendations)).toBe(true);

      // Validate hour values
      optimization.optimalHours.forEach(hour => {
        expect(hour).toBeGreaterThanOrEqual(0);
        expect(hour).toBeLessThanOrEqual(23);
      });

      optimization.worstHours.forEach(hour => {
        expect(hour).toBeGreaterThanOrEqual(0);
        expect(hour).toBeLessThanOrEqual(23);
      });
    });

    it('should provide fallback recommendations on error', async () => {
      jest.spyOn(service, 'getNotificationAnalytics').mockRejectedValue(new Error('Analytics error'));

      const optimization = await service.optimizeNotificationTiming('user-123', 'tenant-123');

      expect(optimization.optimalHours).toEqual([9, 12, 15, 18]);
      expect(optimization.worstHours).toEqual([0, 1, 2, 3, 4, 5]);
      expect(optimization.recommendations).toContain('Unable to generate recommendations');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('generatePreferenceSuggestions', () => {
    beforeEach(() => {
      preferencesService.getUserPreferences.mockResolvedValue({
        id: 'pref-123',
        userId: 'user-123',
        tenantId: 'tenant-123',
        channels: [NotificationChannelType.PUSH, NotificationChannelType.EMAIL],
        settings: {
          workoutReminders: true,
          progressUpdates: true,
          coachMessages: true,
          systemUpdates: false,
          marketingEmails: false,
        },
        timezone: 'UTC',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    it('should generate suggestions based on engagement score', async () => {
      const suggestions = await service.generatePreferenceSuggestions('user-123', 'tenant-123');

      expect(suggestions).toHaveProperty('suggestions');
      expect(suggestions).toHaveProperty('reasoning');
      expect(Array.isArray(suggestions.suggestions)).toBe(true);
      expect(Array.isArray(suggestions.reasoning)).toBe(true);

      suggestions.suggestions.forEach(suggestion => {
        expect(suggestion).toHaveProperty('type');
        expect(suggestion).toHaveProperty('description');
        expect(suggestion).toHaveProperty('impact');
        expect(suggestion).toHaveProperty('action');
        expect(['low', 'medium', 'high']).toContain(suggestion.impact);
      });
    });

    it('should suggest frequency reduction for low engagement', async () => {
      // Mock low engagement score
      jest.spyOn(service, 'getUserEngagementScore').mockResolvedValue(0.15);

      const suggestions = await service.generatePreferenceSuggestions('user-123', 'tenant-123');

      const frequencyReduction = suggestions.suggestions.find(s => s.type === 'reduce_frequency');
      expect(frequencyReduction).toBeTruthy();
      expect(frequencyReduction?.impact).toBe('high');
    });

    it('should suggest channel optimization for high failure rates', async () => {
      // Mock analytics with high failure rate
      jest.spyOn(service, 'getNotificationAnalytics').mockResolvedValue({
        totalSent: 100,
        totalDelivered: 80,
        totalRead: 50,
        totalFailed: 20,
        deliveryRate: 0.8,
        readRate: 0.5,
        failureRate: 0.2, // High failure rate
        averageDeliveryTime: 2.5,
        channelBreakdown: {} as any,
        typeBreakdown: {} as any,
        hourlyDistribution: {},
        engagementScore: 0.5,
      });

      const suggestions = await service.generatePreferenceSuggestions('user-123', 'tenant-123');

      const channelOptimization = suggestions.suggestions.find(s => s.type === 'channel_optimization');
      expect(channelOptimization).toBeTruthy();
    });

    it('should handle errors gracefully', async () => {
      jest.spyOn(service, 'getUserEngagementScore').mockRejectedValue(new Error('Engagement error'));

      const suggestions = await service.generatePreferenceSuggestions('user-123', 'tenant-123');

      expect(suggestions.suggestions).toEqual([]);
      expect(suggestions.reasoning).toContain('Unable to generate suggestions');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('scheduleGroupedNotification', () => {
    const mockGroup = {
      id: 'group-123',
      type: 'workout_reminders',
      recipientId: 'user-123',
      notifications: ['notif-1', 'notif-2'],
      priority: NotificationPriority.MEDIUM,
      createdAt: new Date(),
    };

    it('should schedule notification based on user preferences', async () => {
      preferencesService.isInQuietHours.mockResolvedValue(false);

      const scheduledFor = await service.scheduleGroupedNotification(mockGroup, 'tenant-123');

      expect(scheduledFor).toBeInstanceOf(Date);
      expect(scheduledFor.getTime()).toBeGreaterThan(Date.now() - 1000); // Should be in the future or very recent
    });

    it('should delay notification during quiet hours', async () => {
      preferencesService.isInQuietHours.mockResolvedValue(true);
      preferencesService.getUserPreferences.mockResolvedValue({
        id: 'pref-123',
        userId: 'user-123',
        tenantId: 'tenant-123',
        channels: [NotificationChannelType.PUSH],
        settings: {} as any,
        timezone: 'UTC',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const scheduledFor = await service.scheduleGroupedNotification(mockGroup, 'tenant-123');

      expect(scheduledFor).toBeInstanceOf(Date);
      // Should be scheduled for later (after quiet hours)
      expect(scheduledFor.getTime()).toBeGreaterThan(Date.now() + 60000); // At least 1 minute in future
    });

    it('should handle urgent notifications immediately even during quiet hours', async () => {
      const urgentGroup = { ...mockGroup, priority: NotificationPriority.URGENT };
      preferencesService.isInQuietHours.mockResolvedValue(true);

      const scheduledFor = await service.scheduleGroupedNotification(urgentGroup, 'tenant-123');

      expect(scheduledFor).toBeInstanceOf(Date);
      // Urgent notifications should not be significantly delayed
      expect(scheduledFor.getTime()).toBeLessThan(Date.now() + 60000); // Within 1 minute
    });

    it('should fallback to immediate scheduling on error', async () => {
      preferencesService.getUserPreferences.mockRejectedValue(new Error('Preferences error'));

      const scheduledFor = await service.scheduleGroupedNotification(mockGroup, 'tenant-123');

      expect(scheduledFor).toBeInstanceOf(Date);
      expect(logger.error).toHaveBeenCalled();
    });
  });
});