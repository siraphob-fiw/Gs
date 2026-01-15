import { NotificationService } from '@strengthos/sos-web-api/src/notification/services/notification.service';
import { NotificationRepository } from '@strengthos/sos-web-api/src/notification/repositories/notification.repository';
import { NotificationTemplateService } from '@strengthos/sos-web-api/src/notification/services/notification-template.service';
import { NotificationDeliveryService } from '@strengthos/sos-web-api/src/notification/services/notification-delivery.service';
import { TestModuleBuilder } from '../utils/test-module-builder';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import {
  Notification,
  NotificationStatus,
  NotificationType,
  NotificationChannelType,
} from '@strengthos/shared-notifications';
import {
  CreateNotificationDto,
  SendBulkNotificationDto,
  SendNotificationDto,
} from '@strengthos/sos-web-api/src/notification/dto/notification-request.dto';

describe('NotificationService', () => {
  let service: NotificationService;
  let mockNotificationRepository: jest.Mocked<NotificationRepository>;
  let mockTemplateService: jest.Mocked<NotificationTemplateService>;
  let mockDeliveryService: jest.Mocked<NotificationDeliveryService>;

  const mockNotification: Notification = {
    id: 'notification-1',
    type: NotificationType.INFO,
    channel: NotificationChannelType.EMAIL,
    recipientId: 'user-1',
    title: 'Test Notification',
    message: 'This is a test notification',
    status: NotificationStatus.PENDING,
    templateId: null,
    templateVariables: null,
    metadata: null,
    tenantId: 'tenant-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockNotificationRepository = {
      createNotification: jest.fn(),
      findNotificationById: jest.fn(),
      findNotificationsByRecipient: jest.fn(),
      updateNotificationStatus: jest.fn(),
    } as any;

    mockTemplateService = {
      findById: jest.fn(),
      renderTemplate: jest.fn(),
    } as any;

    mockDeliveryService = {
      deliverNotification: jest.fn(),
    } as any;

    const { service: testService } = await TestModuleBuilder
      .forService(NotificationService)
      .withMocks([
        { provide: NotificationRepository, useValue: mockNotificationRepository },
        { provide: NotificationTemplateService, useValue: mockTemplateService },
        { provide: NotificationDeliveryService, useValue: mockDeliveryService },
      ])
      .build();

    service = testService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    const createDto: CreateNotificationDto = {
      type: NotificationType.INFO,
      channel: NotificationChannelType.EMAIL,
      recipientId: 'user-1',
      title: 'Test Notification',
      message: 'This is a test notification',
    };

    it('should create notification without template', async () => {
      mockNotificationRepository.createNotification.mockResolvedValue(mockNotification);
      
      // Mock the async delivery method
      jest.spyOn(service as any, 'deliverNotificationAsync').mockImplementation(() => Promise.resolve());

      const result = await service.createNotification(createDto, 'tenant-1');

      expect(mockNotificationRepository.createNotification).toHaveBeenCalledWith({
        type: createDto.type,
        channel: createDto.channel,
        recipientId: createDto.recipientId,
        title: createDto.title,
        message: createDto.message,
        templateId: undefined,
        templateVariables: undefined,
        metadata: undefined,
        tenantId: 'tenant-1',
      });
      expect(result).toBe(mockNotification);
    });

    it('should create notification with template', async () => {
      const createDtoWithTemplate = {
        ...createDto,
        templateId: 'template-1',
        templateVariables: { userName: 'John Doe' },
      };

      const mockTemplate = {
        id: 'template-1',
        name: 'Welcome Template',
        subject: 'Welcome {{userName}}',
        body: 'Hello {{userName}}, welcome to our platform!',
      };

      const renderedTemplate = {
        subject: 'Welcome John Doe',
        body: 'Hello John Doe, welcome to our platform!',
      };

      mockTemplateService.findById.mockResolvedValue(mockTemplate);
      mockTemplateService.renderTemplate.mockResolvedValue(renderedTemplate);
      mockNotificationRepository.createNotification.mockResolvedValue({
        ...mockNotification,
        title: renderedTemplate.subject,
        message: renderedTemplate.body,
      });

      jest.spyOn(service as any, 'deliverNotificationAsync').mockImplementation(() => Promise.resolve());

      const result = await service.createNotification(createDtoWithTemplate, 'tenant-1');

      expect(mockTemplateService.findById).toHaveBeenCalledWith('template-1', 'tenant-1');
      expect(mockTemplateService.renderTemplate).toHaveBeenCalledWith(
        'template-1',
        { userName: 'John Doe' },
        'tenant-1'
      );
      expect(mockNotificationRepository.createNotification).toHaveBeenCalledWith({
        type: createDtoWithTemplate.type,
        channel: createDtoWithTemplate.channel,
        recipientId: createDtoWithTemplate.recipientId,
        title: renderedTemplate.subject,
        message: renderedTemplate.body,
        templateId: 'template-1',
        templateVariables: { userName: 'John Doe' },
        metadata: undefined,
        tenantId: 'tenant-1',
      });
      expect(result.title).toBe(renderedTemplate.subject);
      expect(result.message).toBe(renderedTemplate.body);
    });

    it('should throw NotFoundException when template not found', async () => {
      const createDtoWithTemplate = {
        ...createDto,
        templateId: 'non-existent-template',
      };

      mockTemplateService.findById.mockResolvedValue(null);

      await expect(
        service.createNotification(createDtoWithTemplate, 'tenant-1')
      ).rejects.toThrow(NotFoundException);
      expect(mockTemplateService.findById).toHaveBeenCalledWith('non-existent-template', 'tenant-1');
    });
  });

  describe('sendNotification', () => {
    const sendDto: SendNotificationDto = {
      type: NotificationType.INFO,
      channel: NotificationChannelType.EMAIL,
      recipientId: 'user-1',
      title: 'Test Notification',
      message: 'This is a test notification',
    };

    it('should send notification successfully', async () => {
      mockNotificationRepository.createNotification.mockResolvedValue(mockNotification);
      jest.spyOn(service as any, 'deliverNotificationAsync').mockImplementation(() => Promise.resolve());

      const result = await service.sendNotification(sendDto, 'tenant-1');

      expect(result).toEqual({
        id: mockNotification.id,
        type: mockNotification.type,
        channel: mockNotification.channel,
        recipientId: mockNotification.recipientId,
        title: mockNotification.title,
        message: mockNotification.message,
        status: mockNotification.status,
        createdAt: mockNotification.createdAt,
        updatedAt: mockNotification.updatedAt,
      });
    });
  });

  describe('sendBulkNotification', () => {
    const bulkDto: SendBulkNotificationDto = {
      type: NotificationType.INFO,
      channel: NotificationChannelType.EMAIL,
      recipientIds: ['user-1', 'user-2', 'user-3'],
      title: 'Bulk Notification',
      message: 'This is a bulk notification',
    };

    it('should send bulk notifications successfully', async () => {
      mockNotificationRepository.createNotification
        .mockResolvedValueOnce({ ...mockNotification, id: 'notification-1', recipientId: 'user-1' })
        .mockResolvedValueOnce({ ...mockNotification, id: 'notification-2', recipientId: 'user-2' })
        .mockResolvedValueOnce({ ...mockNotification, id: 'notification-3', recipientId: 'user-3' });

      jest.spyOn(service as any, 'deliverNotificationAsync').mockImplementation(() => Promise.resolve());

      const result = await service.sendBulkNotification(bulkDto, 'tenant-1');

      expect(result.totalProcessed).toBe(3);
      expect(result.successCount).toBe(3);
      expect(result.failureCount).toBe(0);
      expect(result.notificationIds).toHaveLength(3);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle partial failures in bulk notifications', async () => {
      mockNotificationRepository.createNotification
        .mockResolvedValueOnce({ ...mockNotification, id: 'notification-1', recipientId: 'user-1' })
        .mockRejectedValueOnce(new Error('Database error'))
        .mockResolvedValueOnce({ ...mockNotification, id: 'notification-3', recipientId: 'user-3' });

      jest.spyOn(service as any, 'deliverNotificationAsync').mockImplementation(() => Promise.resolve());

      const result = await service.sendBulkNotification(bulkDto, 'tenant-1');

      expect(result.totalProcessed).toBe(3);
      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(1);
      expect(result.notificationIds).toHaveLength(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors![0]).toEqual({
        recipientId: 'user-2',
        error: 'Database error',
      });
    });

    it('should process large batches in chunks', async () => {
      const largeBulkDto = {
        ...bulkDto,
        recipientIds: Array.from({ length: 100 }, (_, i) => `user-${i + 1}`),
      };

      mockNotificationRepository.createNotification.mockImplementation((data) =>
        Promise.resolve({ ...mockNotification, id: `notification-${data.recipientId}`, recipientId: data.recipientId })
      );

      jest.spyOn(service as any, 'deliverNotificationAsync').mockImplementation(() => Promise.resolve());

      const result = await service.sendBulkNotification(largeBulkDto, 'tenant-1');

      expect(result.totalProcessed).toBe(100);
      expect(result.successCount).toBe(100);
      expect(result.failureCount).toBe(0);
      expect(mockNotificationRepository.createNotification).toHaveBeenCalledTimes(100);
    });
  });

  describe('findById', () => {
    it('should find notification by id', async () => {
      mockNotificationRepository.findNotificationById.mockResolvedValue(mockNotification);

      const result = await service.findById('notification-1');

      expect(mockNotificationRepository.findNotificationById).toHaveBeenCalledWith('notification-1');
      expect(result).toBe(mockNotification);
    });

    it('should return null when notification not found', async () => {
      mockNotificationRepository.findNotificationById.mockResolvedValue(null);

      const result = await service.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByRecipient', () => {
    it('should find notifications by recipient', async () => {
      const notifications = [mockNotification];
      mockNotificationRepository.findNotificationsByRecipient.mockResolvedValue(notifications);

      const result = await service.findByRecipient('user-1', 'tenant-1', 10, 0);

      expect(mockNotificationRepository.findNotificationsByRecipient).toHaveBeenCalledWith(
        'user-1',
        'tenant-1',
        10,
        0
      );
      expect(result).toBe(notifications);
    });

    it('should use default pagination parameters', async () => {
      const notifications = [mockNotification];
      mockNotificationRepository.findNotificationsByRecipient.mockResolvedValue(notifications);

      await service.findByRecipient('user-1', 'tenant-1');

      expect(mockNotificationRepository.findNotificationsByRecipient).toHaveBeenCalledWith(
        'user-1',
        'tenant-1',
        50,
        0
      );
    });
  });

  describe('updateStatus', () => {
    it('should update notification status', async () => {
      mockNotificationRepository.updateNotificationStatus.mockResolvedValue(undefined);

      await service.updateStatus('notification-1', NotificationStatus.SENT);

      expect(mockNotificationRepository.updateNotificationStatus).toHaveBeenCalledWith(
        'notification-1',
        NotificationStatus.SENT,
        undefined
      );
    });

    it('should update notification status with error message', async () => {
      mockNotificationRepository.updateNotificationStatus.mockResolvedValue(undefined);

      await service.updateStatus('notification-1', NotificationStatus.FAILED, 'Delivery failed');

      expect(mockNotificationRepository.updateNotificationStatus).toHaveBeenCalledWith(
        'notification-1',
        NotificationStatus.FAILED,
        'Delivery failed'
      );
    });
  });

  describe('retryFailedNotification', () => {
    it('should retry failed notification successfully', async () => {
      const failedNotification = { ...mockNotification, status: NotificationStatus.FAILED };
      const updatedNotification = { ...mockNotification, status: NotificationStatus.PENDING };

      mockNotificationRepository.findNotificationById
        .mockResolvedValueOnce(failedNotification)
        .mockResolvedValueOnce(updatedNotification);
      mockNotificationRepository.updateNotificationStatus.mockResolvedValue(undefined);
      jest.spyOn(service as any, 'deliverNotificationAsync').mockImplementation(() => Promise.resolve());

      const result = await service.retryFailedNotification('notification-1');

      expect(mockNotificationRepository.updateNotificationStatus).toHaveBeenCalledWith(
        'notification-1',
        NotificationStatus.PENDING
      );
      expect(result).toBe(updatedNotification);
    });

    it('should throw NotFoundException when notification not found', async () => {
      mockNotificationRepository.findNotificationById.mockResolvedValue(null);

      await expect(service.retryFailedNotification('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when notification is not failed', async () => {
      const sentNotification = { ...mockNotification, status: NotificationStatus.SENT };
      mockNotificationRepository.findNotificationById.mockResolvedValue(sentNotification);

      await expect(service.retryFailedNotification('notification-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when notification not found after update', async () => {
      const failedNotification = { ...mockNotification, status: NotificationStatus.FAILED };

      mockNotificationRepository.findNotificationById
        .mockResolvedValueOnce(failedNotification)
        .mockResolvedValueOnce(null);
      mockNotificationRepository.updateNotificationStatus.mockResolvedValue(undefined);

      await expect(service.retryFailedNotification('notification-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deliverNotificationAsync', () => {
    it('should deliver notification successfully', async () => {
      mockNotificationRepository.updateNotificationStatus.mockResolvedValue(undefined);
      mockDeliveryService.deliverNotification.mockResolvedValue(true);

      await (service as any).deliverNotificationAsync(mockNotification);

      expect(mockNotificationRepository.updateNotificationStatus).toHaveBeenCalledWith(
        mockNotification.id,
        NotificationStatus.PENDING
      );
      expect(mockDeliveryService.deliverNotification).toHaveBeenCalledWith(mockNotification);
      expect(mockNotificationRepository.updateNotificationStatus).toHaveBeenCalledWith(
        mockNotification.id,
        NotificationStatus.SENT
      );
    });

    it('should handle delivery failure', async () => {
      mockNotificationRepository.updateNotificationStatus.mockResolvedValue(undefined);
      mockDeliveryService.deliverNotification.mockResolvedValue(false);

      await (service as any).deliverNotificationAsync(mockNotification);

      expect(mockNotificationRepository.updateNotificationStatus).toHaveBeenCalledWith(
        mockNotification.id,
        NotificationStatus.FAILED,
        'Delivery failed - unknown error'
      );
    });

    it('should handle delivery exception', async () => {
      mockNotificationRepository.updateNotificationStatus.mockResolvedValue(undefined);
      mockDeliveryService.deliverNotification.mockRejectedValue(new Error('Network error'));

      await (service as any).deliverNotificationAsync(mockNotification);

      expect(mockNotificationRepository.updateNotificationStatus).toHaveBeenCalledWith(
        mockNotification.id,
        NotificationStatus.FAILED,
        'Network error'
      );
    });

    it('should handle delivery exception with no message', async () => {
      mockNotificationRepository.updateNotificationStatus.mockResolvedValue(undefined);
      mockDeliveryService.deliverNotification.mockRejectedValue({});

      await (service as any).deliverNotificationAsync(mockNotification);

      expect(mockNotificationRepository.updateNotificationStatus).toHaveBeenCalledWith(
        mockNotification.id,
        NotificationStatus.FAILED,
        'Delivery failed with exception'
      );
    });
  });

  describe('getNotificationStats', () => {
    it('should return notification statistics for recipient', async () => {
      const notifications = [
        { ...mockNotification, status: NotificationStatus.SENT },
        { ...mockNotification, status: NotificationStatus.FAILED },
        { ...mockNotification, status: NotificationStatus.PENDING },
      ];

      mockNotificationRepository.findNotificationsByRecipient.mockResolvedValue(notifications);

      const result = await service.getNotificationStats('user-1', 'tenant-1');

      expect(result).toEqual({
        total: 3,
        sent: 1,
        failed: 1,
        pending: 1,
        processing: 0,
      });
    });

    it('should return empty stats when no recipient provided', async () => {
      const result = await service.getNotificationStats();

      expect(result).toEqual({
        total: 0,
        sent: 0,
        failed: 0,
        pending: 0,
        processing: 0,
      });
    });
  });

  describe('Performance benchmarks', () => {
    it('should complete notification operations within acceptable time limits', async () => {
      const startTime = Date.now();

      mockNotificationRepository.createNotification.mockResolvedValue(mockNotification);
      mockNotificationRepository.findNotificationById.mockResolvedValue(mockNotification);
      mockNotificationRepository.findNotificationsByRecipient.mockResolvedValue([mockNotification]);
      jest.spyOn(service as any, 'deliverNotificationAsync').mockImplementation(() => Promise.resolve());

      const createDto: CreateNotificationDto = {
        type: NotificationType.INFO,
        channel: NotificationChannelType.EMAIL,
        recipientId: 'user-1',
        title: 'Test Notification',
        message: 'This is a test notification',
      };

      // Test multiple operations
      await Promise.all([
        service.createNotification(createDto, 'tenant-1'),
        service.findById('notification-1'),
        service.findByRecipient('user-1', 'tenant-1'),
      ]);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Operations should complete quickly (under 100ms for this test)
      expect(executionTime).toBeLessThan(100);
    });

    it('should handle bulk operations efficiently', async () => {
      const startTime = Date.now();

      const bulkDto: SendBulkNotificationDto = {
        type: NotificationType.INFO,
        channel: NotificationChannelType.EMAIL,
        recipientIds: Array.from({ length: 50 }, (_, i) => `user-${i + 1}`),
        title: 'Bulk Notification',
        message: 'This is a bulk notification',
      };

      mockNotificationRepository.createNotification.mockImplementation((data) =>
        Promise.resolve({ ...mockNotification, id: `notification-${data.recipientId}`, recipientId: data.recipientId })
      );
      jest.spyOn(service as any, 'deliverNotificationAsync').mockImplementation(() => Promise.resolve());

      await service.sendBulkNotification(bulkDto, 'tenant-1');

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Bulk operations should complete within reasonable time (under 1 second for 50 items)
      expect(executionTime).toBeLessThan(1000);
    });
  });

  describe('Error handling patterns', () => {
    it('should provide consistent error handling across all methods', async () => {
      mockNotificationRepository.createNotification.mockRejectedValue(new Error('Database error'));

      const createDto: CreateNotificationDto = {
        type: NotificationType.INFO,
        channel: NotificationChannelType.EMAIL,
        recipientId: 'user-1',
        title: 'Test Notification',
        message: 'This is a test notification',
      };

      await expect(service.createNotification(createDto, 'tenant-1')).rejects.toThrow('Database error');
    });

    it('should handle null and undefined inputs gracefully', async () => {
      await expect(service.findById(null as any)).resolves.toBeNull();
      await expect(service.findByRecipient(null as any)).resolves.toEqual([]);
    });
  });
});