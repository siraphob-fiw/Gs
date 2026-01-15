// Real-time notification service migrated from human-lift-training-api/src/Services/Notifications/RealTimeNotificationService.ts
import { EventEmitter } from 'events';
import { Results } from '@strengthos/shared-utils';
import { ILogger } from '@strengthos/shared-logging';
import {
  Notification,
  NotificationStatus,
  NotificationChannelType,
  NotificationError,
  NotificationErrorCode,
} from '@strengthos/shared-types';

export interface RealTimeConnection {
  id: string;
  userId: string;
  tenantId: string;
  connectedAt: Date;
  lastActivity: Date;
  metadata?: Record<string, any>;
}

export interface RealTimeMessage {
  type: 'notification' | 'status_update' | 'system_message';
  data: any;
  timestamp: Date;
}

export interface RealTimeDeliveryResult {
  success: boolean;
  connectionId?: string;
  error?: NotificationError;
}

export interface RealTimeServiceInterface {
  // Connection management
  addConnection(connection: RealTimeConnection): Results<void>;
  removeConnection(connectionId: string): Results<void>;
  getConnection(connectionId: string): Results<RealTimeConnection | null>;
  getUserConnections(userId: string): Results<RealTimeConnection[]>;
  
  // Message delivery
  sendToUser(userId: string, message: RealTimeMessage): Promise<Results<RealTimeDeliveryResult[]>>;
  sendToConnection(connectionId: string, message: RealTimeMessage): Promise<Results<RealTimeDeliveryResult>>;
  sendToTenant(tenantId: string, message: RealTimeMessage): Promise<Results<RealTimeDeliveryResult[]>>;
  
  // Notification-specific methods
  deliverNotification(notification: Notification): Promise<Results<RealTimeDeliveryResult[]>>;
  updateNotificationStatus(
    notificationId: string,
    status: NotificationStatus,
    userId: string,
  ): Promise<Results<void>>;
  
  // Health and monitoring
  getActiveConnections(): Results<RealTimeConnection[]>;
  getConnectionStats(): Results<{
    totalConnections: number;
    connectionsByTenant: Record<string, number>;
    connectionsByUser: Record<string, number>;
  }>;
}

/**
 * Real-Time Notification Service
 * Manages WebSocket connections and real-time message delivery
 */
export class RealTimeNotificationService extends EventEmitter implements RealTimeServiceInterface {
  private connections: Map<string, RealTimeConnection> = new Map();
  private userConnections: Map<string, Set<string>> = new Map();
  private tenantConnections: Map<string, Set<string>> = new Map();
  
  // Cleanup interval for stale connections
  private cleanupInterval: NodeJS.Timeout;
  private readonly CONNECTION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  constructor(private readonly logger: ILogger) {
    super();
    
    // Start cleanup process
    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleConnections();
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  // ============================================================================
  // CONNECTION MANAGEMENT
  // ============================================================================

  addConnection(connection: RealTimeConnection): Results<void> {
    try {
      this.connections.set(connection.id, connection);
      
      // Index by user
      if (!this.userConnections.has(connection.userId)) {
        this.userConnections.set(connection.userId, new Set());
      }
      this.userConnections.get(connection.userId)!.add(connection.id);
      
      // Index by tenant
      if (!this.tenantConnections.has(connection.tenantId)) {
        this.tenantConnections.set(connection.tenantId, new Set());
      }
      this.tenantConnections.get(connection.tenantId)!.add(connection.id);
      
      this.logger.info({ 
        message: 'Real-time connection added', 
        fullMessage: `Connection ID: ${connection.id}, User: ${connection.userId}` 
      });
      
      this.emit('connection:added', connection);
      return Results.ok(undefined);
    } catch (error) {
      this.logger.error({ 
        message: 'Failed to add connection', 
        fullMessage: (error as Error).message 
      });
      
      return Results.fail<void>(null, 'Failed to add connection');
    }
  }

  removeConnection(connectionId: string): Results<void> {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection) {
        return Results.fail<void>(null, 'Connection not found');
      }
      
      // Remove from main map
      this.connections.delete(connectionId);
      
      // Remove from user index
      const userConnections = this.userConnections.get(connection.userId);
      if (userConnections) {
        userConnections.delete(connectionId);
        if (userConnections.size === 0) {
          this.userConnections.delete(connection.userId);
        }
      }
      
      // Remove from tenant index
      const tenantConnections = this.tenantConnections.get(connection.tenantId);
      if (tenantConnections) {
        tenantConnections.delete(connectionId);
        if (tenantConnections.size === 0) {
          this.tenantConnections.delete(connection.tenantId);
        }
      }
      
      this.logger.info({ 
        message: 'Real-time connection removed', 
        fullMessage: `Connection ID: ${connectionId}` 
      });
      
      this.emit('connection:removed', connection);
      return Results.ok(undefined);
    } catch (error) {
      this.logger.error({ 
        message: 'Failed to remove connection', 
        fullMessage: (error as Error).message 
      });
      
      return Results.fail<void>(null, 'Failed to remove connection');
    }
  }

  getConnection(connectionId: string): Results<RealTimeConnection | null> {
    try {
      const connection = this.connections.get(connectionId);
      return Results.ok(connection || null);
    } catch (error) {
      this.logger.error({ 
        message: 'Failed to get connection', 
        fullMessage: (error as Error).message 
      });
      
      return Results.fail<RealTimeConnection | null>(null, 'Failed to get connection');
    }
  }

  getUserConnections(userId: string): Results<RealTimeConnection[]> {
    try {
      const connectionIds = this.userConnections.get(userId);
      if (!connectionIds) {
        return Results.ok([]);
      }
      
      const connections = Array.from(connectionIds)
        .map(id => this.connections.get(id))
        .filter((conn): conn is RealTimeConnection => conn !== undefined);

      return Results.ok(connections);
    } catch (error) {
      this.logger.error({ 
        message: 'Failed to get user connections', 
        fullMessage: (error as Error).message 
      });
      
      return Results.fail<RealTimeConnection[]>(null, 'Failed to get user connections');
    }
  }

  // ============================================================================
  // MESSAGE DELIVERY
  // ============================================================================

  async sendToUser(userId: string, message: RealTimeMessage): Promise<Results<RealTimeDeliveryResult[]>> {
    try {
      const connectionsResult = this.getUserConnections(userId);
      if (!connectionsResult.isOk || !connectionsResult.returnValue) {
        return Results.fail<RealTimeDeliveryResult[]>(null, 'Failed to get user connections');
      }

      const connections = connectionsResult.returnValue;
      const results: RealTimeDeliveryResult[] = [];
      
      for (const connection of connections) {
        const result = await this.sendToConnection(connection.id, message);
        if (result.isOk && result.returnValue) {
          results.push(result.returnValue);
        } else {
          results.push({
            success: false,
            connectionId: connection.id,
            error: {
              code: NotificationErrorCode.DELIVERY_FAILED,
              message: result.message || 'Failed to send message',
              retryable: true,
            },
          });
        }
      }
      
      return Results.ok(results);
    } catch (error) {
      this.logger.error({ 
        message: 'Failed to send message to user', 
        fullMessage: (error as Error).message 
      });
      
      return Results.fail<RealTimeDeliveryResult[]>(null, 'Failed to send message to user');
    }
  }

  async sendToConnection(connectionId: string, message: RealTimeMessage): Promise<Results<RealTimeDeliveryResult>> {
    try {
      const connectionResult = this.getConnection(connectionId);
      if (!connectionResult.isOk || !connectionResult.returnValue) {
        return Results.ok({
          success: false,
          connectionId,
          error: {
            code: NotificationErrorCode.INVALID_RECIPIENT,
            message: 'Connection not found',
            retryable: false,
          },
        });
      }

      const connection = connectionResult.returnValue;
      
      // Update last activity
      connection.lastActivity = new Date();
      
      // In a real implementation, this would send via WebSocket
      this.logger.info({ 
        message: 'Sending real-time message to connection',
        fullMessage: `Connection ID: ${connectionId}, User: ${connection.userId}, Message Type: ${message.type}`
      });
      
      // Simulate message delivery
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Emit event for external handlers (like WebSocket servers)
      this.emit('message:send', {
        connectionId,
        connection,
        message,
      });
      
      return Results.ok({
        success: true,
        connectionId,
      });
    } catch (error) {
      this.logger.error({ 
        message: 'Failed to send message to connection', 
        fullMessage: (error as Error).message 
      });
      
      return Results.ok({
        success: false,
        connectionId,
        error: {
          code: NotificationErrorCode.DELIVERY_FAILED,
          message: (error as Error).message,
          retryable: true,
        },
      });
    }
  }

  async sendToTenant(tenantId: string, message: RealTimeMessage): Promise<Results<RealTimeDeliveryResult[]>> {
    try {
      const connectionIds = this.tenantConnections.get(tenantId);
      if (!connectionIds) {
        return Results.ok([]);
      }
      
      const results: RealTimeDeliveryResult[] = [];
      
      for (const connectionId of connectionIds) {
        const result = await this.sendToConnection(connectionId, message);
        if (result.isOk && result.returnValue) {
          results.push(result.returnValue);
        } else {
          results.push({
            success: false,
            connectionId,
            error: {
              code: NotificationErrorCode.DELIVERY_FAILED,
              message: result.message || 'Failed to send message',
              retryable: true,
            },
          });
        }
      }
      
      return Results.ok(results);
    } catch (error) {
      this.logger.error({ 
        message: 'Failed to send message to tenant', 
        fullMessage: (error as Error).message 
      });
      
      return Results.fail<RealTimeDeliveryResult[]>(null, 'Failed to send message to tenant');
    }
  }

  // ============================================================================
  // NOTIFICATION-SPECIFIC METHODS
  // ============================================================================

  async deliverNotification(notification: Notification): Promise<Results<RealTimeDeliveryResult[]>> {
    try {
      // Only deliver in-app notifications via real-time
      const inAppChannel = notification.channel === NotificationChannelType.IN_APP;
      
      if (!inAppChannel) {
        return Results.ok([]);
      }
      
      const message: RealTimeMessage = {
        type: 'notification',
        data: {
          id: notification.id,
          type: notification.type,
          channel: notification.channel,
          status: notification.status,
          priority: notification.priority,
          title: notification.title,
          content: notification.message,
          templateId: notification.templateId,
          templateVariables: notification.templateVariables,
          metadata: notification.metadata,
          createdAt: notification.createdAt,
        },
        timestamp: new Date(),
      };
      
      const result = await this.sendToUser(notification.recipientId, message);
      if (!result.isOk || !result.returnValue) {
        return Results.fail<RealTimeDeliveryResult[]>(null, result.message || 'Failed to deliver notification');
      }

      const results = result.returnValue;
      
      return Results.ok(results);
    } catch (error) {
      this.logger.error({ 
        message: 'Failed to deliver notification', 
        fullMessage: (error as Error).message 
      });
      
      return Results.fail<RealTimeDeliveryResult[]>(null, 'Failed to deliver notification');
    }
  }

  async updateNotificationStatus(
    notificationId: string,
    status: NotificationStatus,
    userId: string,
  ): Promise<Results<void>> {
    try {
      const message: RealTimeMessage = {
        type: 'status_update',
        data: {
          notificationId,
          status,
          updatedAt: new Date(),
        },
        timestamp: new Date(),
      };
      
      // Send status update to all user connections
      const result = await this.sendToUser(userId, message);
      if (!result.isOk) {
        return Results.fail<void>(null, result.message || 'Failed to send status update');
      }
      
      // Emit event for external handlers
      this.emit('notification:status_updated', {
        notificationId,
        status,
        userId,
      });

      return Results.ok(undefined);
    } catch (error) {
      this.logger.error({ 
        message: 'Failed to update notification status', 
        fullMessage: (error as Error).message 
      });
      
      return Results.fail<void>(null, 'Failed to update notification status');
    }
  }

  // ============================================================================
  // HEALTH AND MONITORING
  // ============================================================================

  getActiveConnections(): Results<RealTimeConnection[]> {
    try {
      const connections = Array.from(this.connections.values());
      return Results.ok(connections);
    } catch (error) {
      this.logger.error({ 
        message: 'Failed to get active connections', 
        fullMessage: (error as Error).message 
      });
      
      return Results.fail<RealTimeConnection[]>(null, 'Failed to get active connections');
    }
  }

  getConnectionStats(): Results<{
    totalConnections: number;
    connectionsByTenant: Record<string, number>;
    connectionsByUser: Record<string, number>;
  }> {
    try {
      const connectionsByTenant: Record<string, number> = {};
      const connectionsByUser: Record<string, number> = {};
      
      for (const [tenantId, connections] of this.tenantConnections) {
        connectionsByTenant[tenantId] = connections.size;
      }
      
      for (const [userId, connections] of this.userConnections) {
        connectionsByUser[userId] = connections.size;
      }
      
      return Results.ok({
        totalConnections: this.connections.size,
        connectionsByTenant,
        connectionsByUser,
      });
    } catch (error) {
      this.logger.error({ 
        message: 'Failed to get connection stats', 
        fullMessage: (error as Error).message 
      });
      
      return Results.fail<any>(null, 'Failed to get connection stats');
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private cleanupStaleConnections(): void {
    try {
      const now = new Date();
      const staleConnections: string[] = [];
      
      for (const [connectionId, connection] of this.connections) {
        const timeSinceActivity = now.getTime() - connection.lastActivity.getTime();
        
        if (timeSinceActivity > this.CONNECTION_TIMEOUT) {
          staleConnections.push(connectionId);
        }
      }
      
      for (const connectionId of staleConnections) {
        this.logger.debug({ message: `Removing stale connection: ${connectionId}` });
        this.removeConnection(connectionId);
      }
      
      if (staleConnections.length > 0) {
        this.logger.info({ 
          message: 'Cleaned up stale connections', 
          fullMessage: `Removed ${staleConnections.length} stale connections` 
        });
      }
    } catch (error) {
      this.logger.error({ 
        message: 'Failed to cleanup stale connections', 
        fullMessage: (error as Error).message 
      });
    }
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.connections.clear();
    this.userConnections.clear();
    this.tenantConnections.clear();
    this.removeAllListeners();

    this.logger.info({ message: 'Real-time notification service destroyed' });
  }
}

/**
 * Factory function to create real-time notification service
 */
export function createRealTimeNotificationService(logger: ILogger): RealTimeNotificationService {
  return new RealTimeNotificationService(logger);
}