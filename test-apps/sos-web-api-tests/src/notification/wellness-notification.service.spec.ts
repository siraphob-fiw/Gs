import { Test, TestingModule } from '@nestjs/testing';
import { WellnessNotificationService, WellnessCheckInType, WellnessCheckIn } from '../services/wellness-notification.service';
import { NotificationService } from '../services/notification.service';
import { NotificationPreferencesService } from '../services/notification-preferences.service';
import { IntelligentNotificationService } from '../services/intelligent-notification.service';
import { ILogger } from '@strengthos/shared-logging';
import {
  NotificationChannelType,
  NotificationType,
  NotificationPriority,
} from '@strengthos/shared-types';

describe('WellnessNotificationService', () => {
  let service: WellnessNotificationService;
  let notificationService: jest.Mocked<NotificationService>;
  let preferencesService: jest.Mocked<NotificationPreferencesService>;
  let intelligentService: jest.Mocked<IntelligentNotificationService>;
  let logger: jest.Mocked<ILogger>;

  const mockNotification = {
    id: 'notification-123',
    type: NotificationType.WELLNESS_CHECKIN,
    channels: [NotificationChannelType.PUSH],
    recipientId: 'user-123',
    content: {
      subject: 'Daily Wellness Check-in',
      body: 'How are you feeling today?',
      language: 'en' as any,
    },
    status: 'pending' as any,
    priority: NotificationPriority.LOW,
    tenantId: 'tenant-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    sentAt: null,
  };

  beforeEach(async () => {
    const mockNotificationService = {
      createNotification: jest.fn(),
    };

    const mockPreferencesService = {
      shouldSendNotification: jest.fn(),
      getUserPreferences: jest.fn(),
      isInQuietHours: jest.fn(),
    };

    const mockIntelligentService = {
      getUserEngagementScore: jest.fn(),
    };

    const mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WellnessNotificationService,
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
        {
          provide: NotificationPreferencesService,
          useValue: mockPreferencesService,
        },
        {
          provide: IntelligentNotificationService,
          useValue: mockIntelligentService,
        },
        {
          provide: 'ILogger',
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<WellnessNotificationService>(WellnessNotificationService);
    notificationService = module.get(NotificationService);
    preferencesService = module.get(NotificationPreferencesService);
    intelligentService = module.get(IntelligentNotificationService);
    logger = module.get('ILogger');
  });

  describe('scheduleWellnessCheckIn', () => {
    it('should schedule a daily wellness check-in successfully', async () => {
      preferencesService.shouldSendNotification.mockResolvedValue({
        shouldSend: true,
      });
      notificationService.createNotification.mockResolvedValue(mockNotification);

      const result = await service.scheduleWellnessCheckIn(
        'user-123',
        'tenant-123',
        WellnessCheckInType.DAILY
      );

      expect(result).toBe('notification-123');
      expect(notificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.WELLNESS_CHECKIN,
          channel: NotificationChannelType.PUSH,
          recipientId: 'user-123',
          title: 'Daily Wellness Check-in',
          message: expect.stringContaining('How are you feeling today?'),
        }),
        'tenant-123'
      );
      expect(logger.info).toHaveBeenCalled();
    });

    it('should skip notification when user preferences block it', async () => {
      preferencesService.shouldSendNotification.mockResolvedValue({
        shouldSend: false,
        reason: 'Channel disabled',
      });

      const result = await service.scheduleWellnessCheckIn(
        'user-123',
        'tenant-123',
        WellnessCheckInType.DAILY
      );

      expect(result).toBe('skipped');
      expect(notificationService.createNotification).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Wellness check-in notification skipped',
        })
      );
    });

    it('should schedule post-workout check-in with correct timing', async () => {
      preferencesService.shouldSendNotification.mockResolvedValue({
        shouldSend: true,
      });
      notificationService.createNotification.mockResolvedValue(mockNotification);

      const result = await service.scheduleWellnessCheckIn(
        'user-123',
        'tenant-123',
        WellnessCheckInType.POST_WORKOUT
      );

      expect(result).toBe('notification-123');
      expect(notificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Post-Workout Check-in',
          message: expect.stringContaining('How did that workout feel?'),
        }),
        'tenant-123'
      );
    });

    it('should handle high priority for injury follow-up', async () => {
      preferencesService.shouldSendNotification.mockResolvedValue({
        shouldSend: true,
      });
      notificationService.createNotification.mockResolvedValue(mockNotification);

      await service.scheduleWellnessCheckIn(
        'user-123',
        'tenant-123',
        WellnessCheckInType.INJURY_FOLLOWUP
      );

      expect(notificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Injury Follow-up',
          metadata: expect.objectContaining({
            priority: NotificationPriority.HIGH,
          }),
        }),
        'tenant-123'
      );
    });
  });

  describe('sendPostWorkoutMoodPrompt', () => {
    it('should schedule post-workout mood prompt with delay', async () => {
      notificationService.createNotification.mockResolvedValue(mockNotification);

      const result = await service.sendPostWorkoutMoodPrompt(
        'user-123',
        'tenant-123',
        'workout-456',
        45 // 45 minutes delay
      );

      expect(result).toBe('notification-123');
      expect(notificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'How was your workout?',
          message: expect.stringContaining('Take a moment to reflect'),
          metadata: expect.objectContaining({
            checkInType: WellnessCheckInType.POST_WORKOUT,
            workoutId: 'workout-456',
          }),
        }),
        'tenant-123'
      );
    });

    it('should use default delay when not specified', async () => {
      notificationService.createNotification.mockResolvedValue(mockNotification);

      await service.sendPostWorkoutMoodPrompt(
        'user-123',
        'tenant-123',
        'workout-456'
      );

      expect(notificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            scheduledFor: expect.any(Date),
          }),
        }),
        'tenant-123'
      );
    });
  });

  describe('processWellnessCheckIn', () => {
    const mockCheckIn: WellnessCheckIn = {
      id: 'checkin-123',
      userId: 'user-123',
      tenantId: 'tenant-123',
      type: WellnessCheckInType.DAILY,
      moodScore: 3, // Low mood score
      energyLevel: 6,
      stressLevel: 8, // High stress
      sleepQuality: 4, // Poor sleep
      motivation: 5,
      physicalWellbeing: 7,
      notes: 'Feeling stressed today',
      tags: ['stress', 'tired'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should process check-in and generate appropriate alerts', async () => {
      const result = await service.processWellnessCheckIn(mockCheckIn);

      expect(result.alerts).toHaveLength(3); // Low mood, high stress, poor sleep
      expect(result.recommendations).toContain('Consider speaking with a mental health professional');
      expect(result.followUpNotifications).toHaveLength(1); // Follow-up for low mood

      // Check alert types
      const alertTypes = result.alerts.map(alert => alert.type);
      expect(alertTypes).toContain('low_mood_pattern');
      expect(alertTypes).toContain('high_stress_pattern');
      expect(alertTypes).toContain('poor_sleep_pattern');
    });

    it('should generate positive recommendations for good scores', async () => {
      const positiveCheckIn: WellnessCheckIn = {
        ...mockCheckIn,
        moodScore: 8,
        energyLevel: 9,
        stressLevel: 3,
        sleepQuality: 8,
        motivation: 8,
        physicalWellbeing: 8,
      };

      const result = await service.processWellnessCheckIn(positiveCheckIn);

      expect(result.alerts).toHaveLength(0);
      expect(result.recommendations).toContain('Great energy and mood!');
      expect(result.followUpNotifications).toHaveLength(0);
    });

    it('should handle critical scores with high severity alerts', async () => {
      const criticalCheckIn: WellnessCheckIn = {
        ...mockCheckIn,
        moodScore: 1, // Critical mood score
        physicalWellbeing: 2, // Critical physical wellbeing
      };

      const result = await service.processWellnessCheckIn(criticalCheckIn);

      const highSeverityAlerts = result.alerts.filter(alert => alert.severity === 'high');
      expect(highSeverityAlerts.length).toBeGreaterThan(0);
    });

    it('should schedule follow-up check-ins when needed', async () => {
      notificationService.createNotification.mockResolvedValue(mockNotification);

      const result = await service.processWellnessCheckIn(mockCheckIn);

      expect(result.followUpNotifications).toHaveLength(1);
      expect(notificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            checkInType: WellnessCheckInType.DAILY,
          }),
        }),
        'tenant-123'
      );
    });
  });

  describe('detectWellnessPatterns', () => {
    it('should detect wellness patterns over specified period', async () => {
      const result = await service.detectWellnessPatterns('user-123', 'tenant-123', 14);

      expect(result.patterns).toBeInstanceOf(Array);
      expect(result.insights).toBeInstanceOf(Array);
      expect(result.recommendations).toBeInstanceOf(Array);

      // Check pattern structure
      result.patterns.forEach(pattern => {
        expect(pattern).toHaveProperty('type');
        expect(pattern).toHaveProperty('description');
        expect(pattern).toHaveProperty('severity');
        expect(pattern).toHaveProperty('trend');
        expect(pattern).toHaveProperty('confidence');
        expect(['low', 'medium', 'high']).toContain(pattern.severity);
        expect(['improving', 'stable', 'declining']).toContain(pattern.trend);
        expect(pattern.confidence).toBeGreaterThanOrEqual(0);
        expect(pattern.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('should provide meaningful insights and recommendations', async () => {
      const result = await service.detectWellnessPatterns('user-123', 'tenant-123');

      expect(result.insights.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);

      result.insights.forEach(insight => {
        expect(typeof insight).toBe('string');
        expect(insight.length).toBeGreaterThan(0);
      });

      result.recommendations.forEach(recommendation => {
        expect(typeof recommendation).toBe('string');
        expect(recommendation.length).toBeGreaterThan(0);
      });
    });
  });

  describe('generateWellnessReport', () => {
    it('should generate comprehensive wellness report', async () => {
      const result = await service.generateWellnessReport('user-123', 'tenant-123', 'week');

      expect(result.summary).toHaveProperty('averageMood');
      expect(result.summary).toHaveProperty('averageEnergy');
      expect(result.summary).toHaveProperty('averageStress');
      expect(result.summary).toHaveProperty('averageSleep');
      expect(result.summary).toHaveProperty('checkInCompliance');

      expect(result.trends).toHaveProperty('mood');
      expect(result.trends).toHaveProperty('energy');
      expect(result.trends).toHaveProperty('stress');
      expect(result.trends).toHaveProperty('sleep');

      expect(result.alerts).toBeInstanceOf(Array);
      expect(result.recommendations).toBeInstanceOf(Array);

      // Validate score ranges
      expect(result.summary.averageMood).toBeGreaterThanOrEqual(1);
      expect(result.summary.averageMood).toBeLessThanOrEqual(10);
      expect(result.summary.checkInCompliance).toBeGreaterThanOrEqual(0);
      expect(result.summary.checkInCompliance).toBeLessThanOrEqual(1);

      // Validate trend values
      Object.values(result.trends).forEach(trend => {
        expect(['up', 'down', 'stable']).toContain(trend);
      });
    });

    it('should handle different report periods', async () => {
      const weeklyReport = await service.generateWellnessReport('user-123', 'tenant-123', 'week');
      const monthlyReport = await service.generateWellnessReport('user-123', 'tenant-123', 'month');
      const quarterlyReport = await service.generateWellnessReport('user-123', 'tenant-123', 'quarter');

      [weeklyReport, monthlyReport, quarterlyReport].forEach(report => {
        expect(report.summary).toBeDefined();
        expect(report.trends).toBeDefined();
        expect(report.alerts).toBeDefined();
        expect(report.recommendations).toBeDefined();
      });
    });
  });

  describe('notifyCoachOfWellnessAlert', () => {
    const mockAlert = {
      id: 'alert-123',
      userId: 'user-123',
      tenantId: 'tenant-123',
      type: 'low_mood_pattern' as any,
      severity: 'medium' as const,
      message: 'Low mood pattern detected',
      recommendations: ['Consider rest day'],
      triggeredBy: 'wellness_checkin',
      isResolved: false,
      createdAt: new Date(),
    };

    it('should notify coach of wellness alert', async () => {
      // Mock getUserCoach to return a coach ID
      jest.spyOn(service as any, 'getUserCoach').mockResolvedValue('coach-456');
      notificationService.createNotification.mockResolvedValue(mockNotification);

      const result = await service.notifyCoachOfWellnessAlert(mockAlert);

      expect(result).toBe('notification-123');
      expect(notificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.COACH_ALERT,
          recipientId: 'coach-456',
          title: expect.stringContaining('Wellness Alert'),
          message: expect.stringContaining('Low mood pattern detected'),
          metadata: expect.objectContaining({
            alertId: 'alert-123',
            athleteId: 'user-123',
            severity: 'medium',
          }),
        }),
        'tenant-123'
      );
    });

    it('should return null when no coach is found', async () => {
      jest.spyOn(service as any, 'getUserCoach').mockResolvedValue(null);

      const result = await service.notifyCoachOfWellnessAlert(mockAlert);

      expect(result).toBeNull();
      expect(notificationService.createNotification).not.toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'No coach found for wellness alert',
        })
      );
    });

    it('should handle critical alerts with high priority', async () => {
      const criticalAlert = { ...mockAlert, severity: 'critical' as const };
      jest.spyOn(service as any, 'getUserCoach').mockResolvedValue('coach-456');
      notificationService.createNotification.mockResolvedValue(mockNotification);

      await service.notifyCoachOfWellnessAlert(criticalAlert);

      expect(notificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            priority: NotificationPriority.HIGH,
          }),
        }),
        'tenant-123'
      );
    });
  });

  describe('sendWellnessSummaryToCoach', () => {
    it('should send wellness summaries for athletes with concerns', async () => {
      // Mock generateWellnessReport to return concerning data
      jest.spyOn(service, 'generateWellnessReport').mockResolvedValue({
        summary: {
          averageMood: 4, // Low mood
          averageEnergy: 6,
          averageStress: 8, // High stress
          averageSleep: 7,
          checkInCompliance: 0.6, // Low compliance
        },
        trends: {
          mood: 'down',
          energy: 'stable',
          stress: 'up',
          sleep: 'stable',
        },
        alerts: [mockAlert], // Has alerts
        recommendations: ['Consider rest day'],
      });

      notificationService.createNotification.mockResolvedValue(mockNotification);

      const result = await service.sendWellnessSummaryToCoach(
        'coach-456',
        'tenant-123',
        ['user-123', 'user-456'],
        'week'
      );

      expect(result).toHaveLength(2); // Both athletes have concerns
      expect(notificationService.createNotification).toHaveBeenCalledTimes(2);
      expect(notificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.WELLNESS_SUMMARY,
          channel: NotificationChannelType.EMAIL,
          recipientId: 'coach-456',
          title: expect.stringContaining('Wellness Summary'),
        }),
        'tenant-123'
      );
    });

    it('should not send summaries for athletes without concerns', async () => {
      // Mock generateWellnessReport to return good data
      jest.spyOn(service, 'generateWellnessReport').mockResolvedValue({
        summary: {
          averageMood: 8, // Good mood
          averageEnergy: 8,
          averageStress: 3, // Low stress
          averageSleep: 8,
          checkInCompliance: 0.9, // High compliance
        },
        trends: {
          mood: 'up',
          energy: 'stable',
          stress: 'down',
          sleep: 'up',
        },
        alerts: [], // No alerts
        recommendations: ['Keep up the good work'],
      });

      const result = await service.sendWellnessSummaryToCoach(
        'coach-456',
        'tenant-123',
        ['user-123'],
        'week'
      );

      expect(result).toHaveLength(0); // No concerns, no summaries sent
      expect(notificationService.createNotification).not.toHaveBeenCalled();
    });
  });
});