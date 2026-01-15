import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MessagingService } from '../services/messaging.service';
import { ExternalMessagingService } from '../services/external-messaging.service';
import { MessagingRepository } from '../repositories/messaging.repository';
import { ILogger } from '@strengthos/shared-logging';
import {
  ConversationType,
  MessageType,
  ParticipantRole,
  ParticipantStatus,
  MessageStatus,
  ExternalMessageChannel,
  CreateConversationRequest,
  SendMessageRequest,
} from '@strengthos/shared-types';

describe('MessagingService Integration', () => {
  let service: MessagingService;
  let repository: jest.Mocked<MessagingRepository>;
  let externalService: jest.Mocked<ExternalMessagingService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;
  let logger: jest.Mocked<ILogger>;

  const mockConversation = {
    id: 'conv-123',
    type: ConversationType.DIRECT,
    title: 'Coach-Athlete Chat',
    description: 'Direct conversation between coach and athlete',
    status: 'active' as any,
    participants: [
      {
        id: 'part-1',
        conversationId: 'conv-123',
        userId: 'coach-123',
        role: ParticipantRole.COACH,
        status: ParticipantStatus.ACTIVE,
        joinedAt: new Date(),
        notificationSettings: {
          muted: false,
          pushNotifications: true,
          emailNotifications: true,
          smsNotifications: false,
        },
        metadata: {},
      },
      {
        id: 'part-2',
        conversationId: 'conv-123',
        userId: 'athlete-456',
        role: ParticipantRole.ATHLETE,
        status: ParticipantStatus.ACTIVE,
        joinedAt: new Date(),
        notificationSettings: {
          muted: false,
          pushNotifications: true,
          emailNotifications: false,
          smsNotifications: false,
        },
        metadata: {},
      },
    ],
    lastMessageAt: new Date(),
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    tenantId: 'tenant-123',
  };

  const mockMessage = {
    id: 'msg-123',
    conversationId: 'conv-123',
    senderId: 'coach-123',
    type: MessageType.TEXT,
    content: 'How did your workout go today?',
    status: MessageStatus.SENT,
    attachments: [],
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    tenantId: 'tenant-123',
  };

  beforeEach(async () => {
    const mockRepository = {
      createConversation: jest.fn(),
      findConversationById: jest.fn(),
      findConversationsByUser: jest.fn(),
      updateConversation: jest.fn(),
      addParticipant: jest.fn(),
      removeParticipant: jest.fn(),
      getConversationParticipants: jest.fn(),
      updateParticipantLastRead: jest.fn(),
      createMessage: jest.fn(),
      findMessageById: jest.fn(),
      findMessagesByConversation: jest.fn(),
      searchMessages: jest.fn(),
      updateMessage: jest.fn(),
      deleteMessage: jest.fn(),
      getMessageAttachments: jest.fn(),
      createDeliveryReceipt: jest.fn(),
      updateDeliveryReceipt: jest.fn(),
      createExternalMessage: jest.fn(),
      updateExternalMessage: jest.fn(),
      createMessageTemplate: jest.fn(),
      findMessageTemplates: jest.fn(),
      getConversationStats: jest.fn(),
    };

    const mockExternalService = {
      sendExternalMessage: jest.fn(),
      handleWhatsAppWebhook: jest.fn(),
      handleLineWebhook: jest.fn(),
    };

    const mockEventEmitter = {
      emit: jest.fn(),
    };

    const mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagingService,
        {
          provide: MessagingRepository,
          useValue: mockRepository,
        },
        {
          provide: ExternalMessagingService,
          useValue: mockExternalService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
        {
          provide: 'ILogger',
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<MessagingService>(MessagingService);
    repository = module.get(MessagingRepository);
    externalService = module.get(ExternalMessagingService);
    eventEmitter = module.get(EventEmitter2);
    logger = module.get('ILogger');
  });

  describe('createConversation', () => {
    it('should create a direct conversation successfully', async () => {
      const request: CreateConversationRequest = {
        type: ConversationType.DIRECT,
        title: 'Coach-Athlete Chat',
        participantIds: ['coach-123', 'athlete-456'],
        initialMessage: 'Hello! How can I help you today?',
      };

      repository.createConversation.mockResolvedValue(mockConversation);

      const result = await service.createConversation(request, 'coach-123', 'tenant-123');

      expect(result).toEqual(mockConversation);
      expect(repository.createConversation).toHaveBeenCalledWith({
        type: ConversationType.DIRECT,
        title: 'Coach-Athlete Chat',
        description: undefined,
        tenantId: 'tenant-123',
        participantIds: ['coach-123', 'athlete-456'],
        initialMessage: 'Hello! How can I help you today?',
        senderId: 'coach-123',
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('conversation.created', expect.any(Object));
      expect(logger.info).toHaveBeenCalled();
    });

    it('should add creator to participant list if not included', async () => {
      const request: CreateConversationRequest = {
        type: ConversationType.DIRECT,
        participantIds: ['athlete-456'], // Creator not included
      };

      repository.createConversation.mockResolvedValue(mockConversation);

      await service.createConversation(request, 'coach-123', 'tenant-123');

      expect(repository.createConversation).toHaveBeenCalledWith(
        expect.objectContaining({
          participantIds: ['coach-123', 'athlete-456'], // Creator added
        })
      );
    });

    it('should enforce direct conversation participant limit', async () => {
      const request: CreateConversationRequest = {
        type: ConversationType.DIRECT,
        participantIds: ['coach-123', 'athlete-456', 'athlete-789'], // Too many participants
      };

      await expect(
        service.createConversation(request, 'coach-123', 'tenant-123')
      ).rejects.toThrow('Direct conversations can only have 2 participants');
    });

    it('should require at least 2 participants', async () => {
      const request: CreateConversationRequest = {
        type: ConversationType.GROUP,
        participantIds: [], // No participants
      };

      await expect(
        service.createConversation(request, 'coach-123', 'tenant-123')
      ).rejects.toThrow('Conversation must have at least 2 participants');
    });
  });

  describe('sendMessage', () => {
    beforeEach(() => {
      repository.getConversationParticipants.mockResolvedValue(mockConversation.participants);
      repository.createMessage.mockResolvedValue(mockMessage);
    });

    it('should send a text message successfully', async () => {
      const request: SendMessageRequest = {
        conversationId: 'conv-123',
        type: MessageType.TEXT,
        content: 'Great job on your workout today!',
      };

      const result = await service.sendMessage(request, 'coach-123');

      expect(result).toEqual(mockMessage);
      expect(repository.createMessage).toHaveBeenCalledWith({
        conversationId: 'conv-123',
        senderId: 'coach-123',
        type: MessageType.TEXT,
        content: 'Great job on your workout today!',
        replyToId: undefined,
        attachments: undefined,
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('message.sent', expect.any(Object));
    });

    it('should send message to external channels when specified', async () => {
      const request: SendMessageRequest = {
        conversationId: 'conv-123',
        type: MessageType.TEXT,
        content: 'Important update!',
        externalChannels: [ExternalMessageChannel.WHATSAPP, ExternalMessageChannel.SMS],
      };

      externalService.sendExternalMessage.mockResolvedValue(true);

      await service.sendMessage(request, 'coach-123');

      expect(externalService.sendExternalMessage).toHaveBeenCalledTimes(2); // One for each participant
      expect(externalService.sendExternalMessage).toHaveBeenCalledWith(
        mockMessage,
        'athlete-456', // The other participant
        ExternalMessageChannel.WHATSAPP
      );
    });

    it('should validate reply-to message', async () => {
      const request: SendMessageRequest = {
        conversationId: 'conv-123',
        type: MessageType.TEXT,
        content: 'Thanks for the feedback!',
        replyToId: 'invalid-msg-id',
      };

      repository.findMessageById.mockResolvedValue(null);

      await expect(
        service.sendMessage(request, 'coach-123')
      ).rejects.toThrow('Invalid reply-to message');
    });

    it('should prevent non-participants from sending messages', async () => {
      const request: SendMessageRequest = {
        conversationId: 'conv-123',
        type: MessageType.TEXT,
        content: 'Unauthorized message',
      };

      await expect(
        service.sendMessage(request, 'unauthorized-user')
      ).rejects.toThrow('You are not a participant in this conversation');
    });

    it('should handle message with attachments', async () => {
      const request: SendMessageRequest = {
        conversationId: 'conv-123',
        type: MessageType.IMAGE,
        content: 'Check out this form video',
        attachments: [
          {
            type: 'video' as any,
            filename: 'squat-form.mp4',
            mimeType: 'video/mp4',
            size: 1024000,
            content: 'base64-encoded-content',
          },
        ],
      };

      await service.sendMessage(request, 'coach-123');

      expect(repository.createMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments: expect.arrayContaining([
            expect.objectContaining({
              type: 'video',
              filename: 'squat-form.mp4',
              mimeType: 'video/mp4',
              size: 1024000,
            }),
          ]),
        })
      );
    });
  });

  describe('getMessageHistory', () => {
    const mockMessages = [
      {
        ...mockMessage,
        id: 'msg-1',
        content: 'First message',
        createdAt: new Date('2024-01-01T10:00:00Z'),
      },
      {
        ...mockMessage,
        id: 'msg-2',
        content: 'Second message',
        createdAt: new Date('2024-01-01T11:00:00Z'),
      },
    ];

    beforeEach(() => {
      repository.getConversationParticipants.mockResolvedValue(mockConversation.participants);
      repository.findMessagesByConversation.mockResolvedValue(mockMessages);
      repository.getMessageAttachments.mockResolvedValue([]);
    });

    it('should retrieve message history for participant', async () => {
      const query = {
        conversationId: 'conv-123',
        limit: 50,
      };

      const result = await service.getMessageHistory(query, 'coach-123');

      expect(result.messages).toEqual(mockMessages);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBe('msg-2');
      expect(result.prevCursor).toBe('msg-1');
      expect(repository.findMessagesByConversation).toHaveBeenCalledWith(
        'conv-123',
        50,
        undefined,
        undefined
      );
    });

    it('should prevent non-participants from accessing message history', async () => {
      const query = {
        conversationId: 'conv-123',
        limit: 50,
      };

      await expect(
        service.getMessageHistory(query, 'unauthorized-user')
      ).rejects.toThrow('You are not a participant in this conversation');
    });

    it('should handle pagination with before/after cursors', async () => {
      const query = {
        conversationId: 'conv-123',
        limit: 10,
        before: 'msg-100',
        after: 'msg-50',
      };

      await service.getMessageHistory(query, 'coach-123');

      expect(repository.findMessagesByConversation).toHaveBeenCalledWith(
        'conv-123',
        10,
        'msg-100',
        'msg-50'
      );
    });

    it('should load attachments for messages', async () => {
      const messagesWithAttachments = [
        { ...mockMessage, id: 'msg-with-attachment' },
      ];
      repository.findMessagesByConversation.mockResolvedValue(messagesWithAttachments);
      repository.getMessageAttachments.mockResolvedValue([
        {
          id: 'att-1',
          messageId: 'msg-with-attachment',
          type: 'image' as any,
          filename: 'workout.jpg',
          originalFilename: 'workout.jpg',
          mimeType: 'image/jpeg',
          size: 512000,
          url: 'https://example.com/workout.jpg',
          metadata: {},
          createdAt: new Date(),
        },
      ]);

      const result = await service.getMessageHistory(
        { conversationId: 'conv-123' },
        'coach-123'
      );

      expect(result.messages[0].attachments).toHaveLength(1);
      expect(repository.getMessageAttachments).toHaveBeenCalledWith('msg-with-attachment');
    });
  });

  describe('searchMessages', () => {
    const mockSearchResults = {
      messages: [mockMessage],
      totalCount: 1,
    };

    beforeEach(() => {
      repository.getConversationParticipants.mockResolvedValue(mockConversation.participants);
      repository.searchMessages.mockResolvedValue(mockSearchResults);
    });

    it('should search messages with text query', async () => {
      const query = {
        conversationId: 'conv-123',
        content: 'workout',
        limit: 20,
        offset: 0,
      };

      const result = await service.searchMessages(query, 'coach-123', 'tenant-123');

      expect(result.messages).toEqual([mockMessage]);
      expect(result.totalCount).toBe(1);
      expect(result.hasMore).toBe(false);
      expect(repository.searchMessages).toHaveBeenCalledWith(query);
    });

    it('should search across all conversations when no conversationId specified', async () => {
      const query = {
        content: 'workout',
        senderId: 'coach-123',
      };

      await service.searchMessages(query, 'coach-123', 'tenant-123');

      expect(repository.searchMessages).toHaveBeenCalledWith(query);
    });

    it('should prevent searching in unauthorized conversations', async () => {
      const query = {
        conversationId: 'conv-123',
        content: 'workout',
      };

      await expect(
        service.searchMessages(query, 'unauthorized-user', 'tenant-123')
      ).rejects.toThrow('You are not a participant in this conversation');
    });
  });

  describe('editMessage', () => {
    beforeEach(() => {
      repository.findMessageById.mockResolvedValue(mockMessage);
      repository.updateMessage.mockResolvedValue({
        ...mockMessage,
        content: 'Updated message content',
        editedAt: new Date(),
      });
    });

    it('should edit own message successfully', async () => {
      const result = await service.editMessage('msg-123', 'Updated message content', 'coach-123');

      expect(result.content).toBe('Updated message content');
      expect(result.editedAt).toBeDefined();
      expect(repository.updateMessage).toHaveBeenCalledWith('msg-123', {
        content: 'Updated message content',
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('message.edited', expect.any(Object));
    });

    it('should prevent editing other users messages', async () => {
      await expect(
        service.editMessage('msg-123', 'Unauthorized edit', 'athlete-456')
      ).rejects.toThrow('You can only edit your own messages');
    });

    it('should prevent editing non-text messages', async () => {
      repository.findMessageById.mockResolvedValue({
        ...mockMessage,
        type: MessageType.IMAGE,
      });

      await expect(
        service.editMessage('msg-123', 'Cannot edit image', 'coach-123')
      ).rejects.toThrow('Only text messages can be edited');
    });
  });

  describe('deleteMessage', () => {
    beforeEach(() => {
      repository.findMessageById.mockResolvedValue(mockMessage);
      repository.deleteMessage.mockResolvedValue(true);
    });

    it('should soft delete own message by default', async () => {
      const result = await service.deleteMessage('msg-123', 'coach-123');

      expect(result).toBe(true);
      expect(repository.deleteMessage).toHaveBeenCalledWith('msg-123', true); // soft delete
      expect(eventEmitter.emit).toHaveBeenCalledWith('message.deleted', expect.any(Object));
    });

    it('should hard delete when specified', async () => {
      const result = await service.deleteMessage('msg-123', 'coach-123', true);

      expect(result).toBe(true);
      expect(repository.deleteMessage).toHaveBeenCalledWith('msg-123', false); // hard delete
    });

    it('should prevent deleting other users messages', async () => {
      await expect(
        service.deleteMessage('msg-123', 'athlete-456')
      ).rejects.toThrow('You can only delete your own messages');
    });
  });

  describe('markMessageAsRead', () => {
    beforeEach(() => {
      repository.getConversationParticipants.mockResolvedValue(mockConversation.participants);
      repository.updateParticipantLastRead.mockResolvedValue(true);
    });

    it('should mark conversation as read for participant', async () => {
      const result = await service.markMessageAsRead('conv-123', 'coach-123');

      expect(result).toBe(true);
      expect(repository.updateParticipantLastRead).toHaveBeenCalledWith('conv-123', 'coach-123');
    });

    it('should prevent non-participants from marking as read', async () => {
      await expect(
        service.markMessageAsRead('conv-123', 'unauthorized-user')
      ).rejects.toThrow('You are not a participant in this conversation');
    });
  });

  describe('emitTypingEvent', () => {
    beforeEach(() => {
      repository.getConversationParticipants.mockResolvedValue(mockConversation.participants);
    });

    it('should emit typing event for participant', async () => {
      await service.emitTypingEvent('conv-123', 'coach-123', true);

      expect(eventEmitter.emit).toHaveBeenCalledWith('typing', {
        conversationId: 'conv-123',
        userId: 'coach-123',
        isTyping: true,
        timestamp: expect.any(Date),
      });
    });

    it('should prevent non-participants from emitting typing events', async () => {
      await expect(
        service.emitTypingEvent('conv-123', 'unauthorized-user', true)
      ).rejects.toThrow('You are not a participant in this conversation');
    });
  });

  describe('getMessagingStats', () => {
    it('should return messaging statistics', async () => {
      const mockStats = {
        totalConversations: 5,
        activeConversations: 3,
        unreadMessages: 2,
      };

      repository.getConversationStats.mockResolvedValue(mockStats);

      const result = await service.getMessagingStats('coach-123', 'tenant-123');

      expect(result).toEqual(mockStats);
      expect(repository.getConversationStats).toHaveBeenCalledWith('coach-123', 'tenant-123');
    });
  });

  describe('error handling', () => {
    it('should handle repository errors gracefully', async () => {
      repository.createConversation.mockRejectedValue(new Error('Database error'));

      const request: CreateConversationRequest = {
        type: ConversationType.DIRECT,
        participantIds: ['coach-123', 'athlete-456'],
      };

      await expect(
        service.createConversation(request, 'coach-123', 'tenant-123')
      ).rejects.toThrow('Database error');

      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle external messaging errors without failing main operation', async () => {
      const request: SendMessageRequest = {
        conversationId: 'conv-123',
        type: MessageType.TEXT,
        content: 'Test message',
        externalChannels: [ExternalMessageChannel.WHATSAPP],
      };

      repository.getConversationParticipants.mockResolvedValue(mockConversation.participants);
      repository.createMessage.mockResolvedValue(mockMessage);
      externalService.sendExternalMessage.mockRejectedValue(new Error('External service error'));

      // Should not throw error even if external messaging fails
      const result = await service.sendMessage(request, 'coach-123');

      expect(result).toEqual(mockMessage);
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to send external messages',
        })
      );
    });
  });
});