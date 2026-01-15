import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { NotificationPreferencesService } from '../services/notification-preferences.service';
import { NotificationRepository } from '../repositories/notification.repository';
import { ILogger } from '@strengthos/shared-logging';
import {
  NotificationChannelType,
  NotificationPreferences,
  QuietHours,
} from '@strengthos/shared-types';

describe('NotificationPreferencesService', () => {
  let service: NotificationPreferencesService;
  let repository: jest.Mocked<NotificationRepository>;
  let logger: jest.Mocked<ILogger>;

  const mockPreferences: NotificationPreferences = {
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
    quietHours: {
      enabled: true,
      startHour: 22,
      endHour: 7,
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    },
    timezone: 'America/New_York',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  };

  beforeEach(async () => {
    const mockRepository = {
      createNotificationPreferences: jest.fn(),
      findNotificationPreferences: jest.fn(),
      updateNotificationPreferences: jest.fn(),
      deleteNotificationPreferences: jest.fn(),
      markNotificationAsRead: jest.fn(),
      markAllNotificationsAsRead: jest.fn(),
      getNotificationHistory: jest.fn(),
    };

    const mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationPreferencesService,
        {
          provide: NotificationRepository,
          useValue: mockRepository,
        },
        {
          provide: 'ILogger',
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<NotificationPreferencesService>(NotificationPreferencesService);
    repository = module.get(NotificationRepository);
    logger = module.get('ILogger');
  });

  describe('createUserPreferences', () => {
    it('should create notification preferences successfully', async () => {
      repository.createNotificationPreferences.mockResolvedValue(mockPreferences);

      const result = await service.createUserPreferences({
        userId: 'user-123',
        tenantId: 'tenant-123',
        channels: [NotificationChannelType.PUSH, NotificationChannelType.EMAIL],
        settings: mockPreferences.settings,
        quietHours: mockPreferences.quietHours,
        timezone: 'America/New_York',
      });

      expect(result).toEqual(mockPreferences);
      expect(repository.createNotificationPreferences).toHaveBeenCalledWith({
        userId: 'user-123',
        tenantId: 'tenant-123',
        channels: [NotificationChannelType.PUSH, NotificationChannelType.EMAIL],
        settings: mockPreferences.settings,
        quietHours: mockPreferences.quietHours,
        timezone: 'America/New_York',
      });
      expect(logger.info).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid channels', async () => {
      await expect(
        service.createUserPreferences({
          userId: 'user-123',
          tenantId: 'tenant-123',
          channels: [],
          settings: mockPreferences.settings,
          timezone: 'UTC',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid quiet hours', async () => {
      const invalidQuietHours: QuietHours = {
        enabled: true,
        startHour: 25, // Invalid hour
        endHour: 7,
      };

      await expect(
        service.createUserPreferences({
          userId: 'user-123',
          tenantId: 'tenant-123',
          channels: [NotificationChannelType.PUSH],
          settings: mockPreferences.settings,
          quietHours: invalidQuietHours,
          timezone: 'UTC',
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getUserPreferences', () => {
    it('should return user preferences', async () => {
      repository.findNotificationPreferences.mockResolvedValue(mockPreferences);

      const result = await service.getUserPreferences('user-123', 'tenant-123');

      expect(result).toEqual(mockPreferences);
      expect(repository.findNotificationPreferences).toHaveBeenCalledWith('user-123', 'tenant-123');
    });

    it('should return null if preferences not found', async () => {
      repository.findNotificationPreferences.mockResolvedValue(null);

      const result = await service.getUserPreferences('user-123', 'tenant-123');

      expect(result).toBeNull();
    });
  });

  describe('updateUserPreferences', () => {
    it('should update user preferences successfully', async () => {
      const updatedPreferences = { ...mockPreferences, timezone: 'UTC' };
      repository.updateNotificationPreferences.mockResolvedValue(updatedPreferences);

      const result = await service.updateUserPreferences('user-123', 'tenant-123', {
        timezone: 'UTC',
      });

      expect(result).toEqual(updatedPreferences);
      expect(repository.updateNotificationPreferences).toHaveBeenCalledWith(
        'user-123',
        'tenant-123',
        { timezone: 'UTC' }
      );
    });

    it('should throw NotFoundException if preferences not found', async () => {
      repository.updateNotificationPreferences.mockResolvedValue(null);

      await expect(
        service.updateUserPreferences('user-123', 'tenant-123', { timezone: 'UTC' })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('enableChannel', () => {
    it('should enable a new channel', async () => {
      const preferencesWithoutSMS = {
        ...mockPreferences,
        channels: [NotificationChannelType.PUSH, NotificationChannelType.EMAIL],
      };
      const preferencesWithSMS = {
        ...mockPreferences,
        channels: [NotificationChannelType.PUSH, NotificationChannelType.EMAIL, NotificationChannelType.SMS],
      };

      repository.findNotificationPreferences.mockResolvedValue(preferencesWithoutSMS);
      repository.updateNotificationPreferences.mockResolvedValue(preferencesWithSMS);

      const result = await service.enableChannel('user-123', 'tenant-123', NotificationChannelType.SMS);

      expect(result).toEqual(preferencesWithSMS);
      expect(repository.updateNotificationPreferences).toHaveBeenCalledWith(
        'user-123',
        'tenant-123',
        { channels: [NotificationChannelType.PUSH, NotificationChannelType.EMAIL, NotificationChannelType.SMS] }
      );
    });

    it('should return existing preferences if channel already enabled', async () => {
      repository.findNotificationPreferences.mockResolvedValue(mockPreferences);

      const result = await service.enableChannel('user-123', 'tenant-123', NotificationChannelType.PUSH);

      expect(result).toEqual(mockPreferences);
      expect(repository.updateNotificationPreferences).not.toHaveBeenCalled();
    });
  });

  describe('isInQuietHours', () => {
    beforeEach(() => {
      repository.findNotificationPreferences.mockResolvedValue(mockPreferences);
    });

    it('should return true when in quiet hours', async () => {
      // Mock time to be 11 PM (23:00)
      const mockTime = new Date('2024-01-01T23:00:00-05:00'); // EST time
      
      const result = await service.isInQuietHours('user-123', 'tenant-123', mockTime);

      expect(result).toBe(true);
    });

    it('should return false when not in quiet hours', async () => {
      // Mock time to be 2 PM (14:00)
      const mockTime = new Date('2024-01-01T14:00:00-05:00'); // EST time
      
      const result = await service.isInQuietHours('user-123', 'tenant-123', mockTime);

      expect(result).toBe(false);
    });

    it('should return false when quiet hours are disabled', async () => {
      const preferencesWithoutQuietHours = {
        ...mockPreferences,
        quietHours: { ...mockPreferences.quietHours!, enabled: false },
      };
      repository.findNotificationPreferences.mockResolvedValue(preferencesWithoutQuietHours);

      const result = await service.isInQuietHours('user-123', 'tenant-123');

      expect(result).toBe(false);
    });

    it('should handle quiet hours spanning midnight', async () => {
      const preferencesSpanningMidnight = {
        ...mockPreferences,
        quietHours: {
          enabled: true,
          startHour: 22,
          endHour: 6,
        },
      };
      repository.findNotificationPreferences.mockResolvedValue(preferencesSpanningMidnight);

      // Test at 1 AM (should be in quiet hours)
      const mockTime = new Date('2024-01-01T01:00:00-05:00');
      
      const result = await service.isInQuietHours('user-123', 'tenant-123', mockTime);

      expect(result).toBe(true);
    });
  });

  describe('shouldSendNotification', () => {
    it('should allow sending when all conditions are met', async () => {
      repository.findNotificationPreferences.mockResolvedValue(mockPreferences);

      const result = await service.shouldSendNotification(
        'user-123',
        'tenant-123',
        NotificationChannelType.PUSH,
        new Date('2024-01-01T14:00:00-05:00') // 2 PM EST, not in quiet hours
      );

      expect(result.shouldSend).toBe(true);
    });

    it('should block sending when channel is disabled', async () => {
      const preferencesWithoutPush = {
        ...mockPreferences,
        channels: [NotificationChannelType.EMAIL],
      };
      repository.findNotificationPreferences.mockResolvedValue(preferencesWithoutPush);

      const result = await service.shouldSendNotification(
        'user-123',
        'tenant-123',
        NotificationChannelType.PUSH
      );

      expect(result.shouldSend).toBe(false);
      expect(result.reason).toContain('disabled');
    });

    it('should block sending during quiet hours', async () => {
      repository.findNotificationPreferences.mockResolvedValue(mockPreferences);

      const result = await service.shouldSendNotification(
        'user-123',
        'tenant-123',
        NotificationChannelType.PUSH,
        new Date('2024-01-01T23:00:00-05:00') // 11 PM EST, in quiet hours
      );

      expect(result.shouldSend).toBe(false);
      expect(result.reason).toContain('quiet hours');
      expect(result.suggestedDelay).toBeGreaterThan(0);
    });

    it('should allow sending when no preferences found', async () => {
      repository.findNotificationPreferences.mockResolvedValue(null);

      const result = await service.shouldSendNotification(
        'user-123',
        'tenant-123',
        NotificationChannelType.PUSH
      );

      expect(result.shouldSend).toBe(true);
      expect(result.reason).toContain('No preferences found');
    });
  });

  describe('markNotificationAsRead', () => {
    it('should mark notification as read successfully', async () => {
      repository.markNotificationAsRead.mockResolvedValue(true);

      const result = await service.markNotificationAsRead('notification-123', 'user-123');

      expect(result).toBe(true);
      expect(repository.markNotificationAsRead).toHaveBeenCalledWith('notification-123', 'user-123');
      expect(logger.debug).toHaveBeenCalled();
    });

    it('should return false if notification not found', async () => {
      repository.markNotificationAsRead.mockResolvedValue(false);

      const result = await service.markNotificationAsRead('notification-123', 'user-123');

      expect(result).toBe(false);
    });
  });

  describe('bulkUpdatePreferences', () => {
    it('should update multiple preferences successfully', async () => {
      repository.updateNotificationPreferences
        .mockResolvedValueOnce(mockPreferences)
        .mockResolvedValueOnce(mockPreferences);

      const updates = [
        {
          userId: 'user-1',
          tenantId: 'tenant-123',
          preferences: { timezone: 'UTC' },
        },
        {
          userId: 'user-2',
          tenantId: 'tenant-123',
          preferences: { timezone: 'UTC' },
        },
      ];

      const result = await service.bulkUpdatePreferences(updates);

      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle partial failures in bulk update', async () => {
      repository.updateNotificationPreferences
        .mockResolvedValueOnce(mockPreferences)
        .mockRejectedValueOnce(new Error('Update failed'));

      const updates = [
        {
          userId: 'user-1',
          tenantId: 'tenant-123',
          preferences: { timezone: 'UTC' },
        },
        {
          userId: 'user-2',
          tenantId: 'tenant-123',
          preferences: { timezone: 'UTC' },
        },
      ];

      const result = await service.bulkUpdatePreferences(updates);

      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].userId).toBe('user-2');
    });
  });
});