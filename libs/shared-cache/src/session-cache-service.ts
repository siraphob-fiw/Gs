// Session cache service migrated from human-lift-training-api/src/Services/Caches/SessionCacheService.ts
import { ILogger } from '@strengthos/shared-logging';
import { UserSession } from '@strengthos/shared-types';
import { Results } from '@strengthos/shared-utils';
import NodeCache from 'node-cache';

export interface ISessionCacheService {
  setSession(sessionId: string, session: UserSession, ttlSeconds?: number): Promise<Results<boolean>>;
  getSession(sessionId: string): Promise<Results<UserSession | null>>;
  deleteSession(sessionId: string): Promise<Results<boolean>>;
  deleteUserSessions(userId: string): Promise<Results<boolean>>;
  setUserPermissions(userId: string, permissions: string[], ttlSeconds?: number): Promise<Results<boolean>>;
  getUserPermissions(userId: string): Promise<Results<string[] | null>>;
  deleteUserPermissions(userId: string): Promise<Results<boolean>>;
  setTenantContext(userId: string, tenantId: string, ttlSeconds?: number): Promise<Results<boolean>>;
  getTenantContext(userId: string): Promise<Results<string | null>>;
  deleteTenantContext(userId: string): Promise<Results<boolean>>;
  getCacheStats(): Results<{
    sessions: { keys: number; hits: number; misses: number };
    permissions: { keys: number; hits: number; misses: number };
    tenants: { keys: number; hits: number; misses: number };
  }>;
  flushAllCaches(): Promise<Results<void>>;
}

export class SessionCacheService implements ISessionCacheService {
  private cache: NodeCache;
  private sessionCache: NodeCache;
  private permissionCache: NodeCache;
  private tenantCache: NodeCache;

  constructor(private readonly logger: ILogger) {
    // Initialize separate caches for different data types
    this.sessionCache = new NodeCache({ 
      stdTTL: 1800, // 30 minutes default TTL
      checkperiod: 120, // Check for expired keys every 2 minutes
      useClones: false
    });

    this.permissionCache = new NodeCache({ 
      stdTTL: 900, // 15 minutes default TTL
      checkperiod: 120,
      useClones: false
    });

    this.tenantCache = new NodeCache({ 
      stdTTL: 3600, // 1 hour default TTL
      checkperiod: 300, // Check every 5 minutes
      useClones: false
    });

    // Main cache for other data
    this.cache = new NodeCache({ 
      stdTTL: 600, // 10 minutes default TTL
      checkperiod: 120,
      useClones: false
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Session cache events
    this.sessionCache.on('expired', (key: string, value: any) => {
      this.logger.debug({ message: `Session cache expired: ${key}` });
    });

    this.sessionCache.on('del', (key: string, value: any) => {
      this.logger.debug({ message: `Session cache deleted: ${key}` });
    });

    // Permission cache events
    this.permissionCache.on('expired', (key: string, value: any) => {
      this.logger.debug({ message: `Permission cache expired: ${key}` });
    });

    // Tenant cache events
    this.tenantCache.on('expired', (key: string, value: any) => {
      this.logger.debug({ message: `Tenant cache expired: ${key}` });
    });
  }

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  async setSession(sessionId: string, session: UserSession, ttlSeconds: number = 1800): Promise<Results<boolean>> {
    try {
      const key = this.getSessionKey(sessionId);
      const success = this.sessionCache.set(key, session, ttlSeconds);
      
      if (success) {
        // Also maintain a user-to-sessions mapping for quick cleanup
        const userSessionsKey = this.getUserSessionsKey(session.userId);
        const existingSessions = this.sessionCache.get<string[]>(userSessionsKey) || [];
        
        if (!existingSessions.includes(sessionId)) {
          existingSessions.push(sessionId);
          this.sessionCache.set(userSessionsKey, existingSessions, ttlSeconds);
        }
      }

      return Results.ok(success);
    } catch (error) {
      this.logger.error({ message: 'Failed to set session in cache', fullMessage: (error as Error).message });
      return Results.fail<boolean>(null, 'Failed to set session in cache');
    }
  }

  async getSession(sessionId: string): Promise<Results<UserSession | null>> {
    try {
      const key = this.getSessionKey(sessionId);
      const session = this.sessionCache.get<UserSession>(key);
      return Results.ok(session || null);
    } catch (error) {
      this.logger.error({ message: 'Failed to get session from cache', fullMessage: (error as Error).message });
      return Results.fail<UserSession | null>(null, 'Failed to get session from cache');
    }
  }

  async deleteSession(sessionId: string): Promise<Results<boolean>> {
    try {
      const key = this.getSessionKey(sessionId);
      
      // Get session to find user ID for cleanup
      const session = this.sessionCache.get<UserSession>(key);
      if (session) {
        const userSessionsKey = this.getUserSessionsKey(session.userId);
        const existingSessions = this.sessionCache.get<string[]>(userSessionsKey) || [];
        const updatedSessions = existingSessions.filter(id => id !== sessionId);
        
        if (updatedSessions.length > 0) {
          this.sessionCache.set(userSessionsKey, updatedSessions);
        } else {
          this.sessionCache.del(userSessionsKey);
        }
      }

      const deleted = this.sessionCache.del(key) > 0;
      return Results.ok(deleted);
    } catch (error) {
      this.logger.error({ message: 'Failed to delete session from cache', fullMessage: (error as Error).message });
      return Results.fail<boolean>(null, 'Failed to delete session from cache');
    }
  }

  async deleteUserSessions(userId: string): Promise<Results<boolean>> {
    try {
      const userSessionsKey = this.getUserSessionsKey(userId);
      const sessionIds = this.sessionCache.get<string[]>(userSessionsKey) || [];
      
      // Delete all sessions for the user
      const sessionKeys = sessionIds.map(id => this.getSessionKey(id));
      sessionKeys.forEach(key => this.sessionCache.del(key));
      
      // Delete the user sessions mapping
      this.sessionCache.del(userSessionsKey);
      
      return Results.ok(true);
    } catch (error) {
      this.logger.error({ message: 'Failed to delete user sessions from cache', fullMessage: (error as Error).message });
      return Results.fail<boolean>(null, 'Failed to delete user sessions from cache');
    }
  }

  // ============================================================================
  // PERMISSION MANAGEMENT
  // ============================================================================

  async setUserPermissions(userId: string, permissions: string[], ttlSeconds: number = 900): Promise<Results<boolean>> {
    try {
      const key = this.getPermissionKey(userId);
      const success = this.permissionCache.set(key, permissions, ttlSeconds);
      return Results.ok(success);
    } catch (error) {
      this.logger.error({ message: 'Failed to set user permissions in cache', fullMessage: (error as Error).message });
      return Results.fail<boolean>(null, 'Failed to set user permissions in cache');
    }
  }

  async getUserPermissions(userId: string): Promise<Results<string[] | null>> {
    try {
      const key = this.getPermissionKey(userId);
      const permissions = this.permissionCache.get<string[]>(key);
      return Results.ok(permissions || null);
    } catch (error) {
      this.logger.error({ message: 'Failed to get user permissions from cache', fullMessage: (error as Error).message });
      return Results.fail<string[] | null>(null, 'Failed to get user permissions from cache');
    }
  }

  async deleteUserPermissions(userId: string): Promise<Results<boolean>> {
    try {
      const key = this.getPermissionKey(userId);
      const deleted = this.permissionCache.del(key) > 0;
      return Results.ok(deleted);
    } catch (error) {
      this.logger.error({ message: 'Failed to delete user permissions from cache', fullMessage: (error as Error).message });
      return Results.fail<boolean>(null, 'Failed to delete user permissions from cache');
    }
  }

  // ============================================================================
  // TENANT CONTEXT MANAGEMENT
  // ============================================================================

  async setTenantContext(userId: string, tenantId: string, ttlSeconds: number = 3600): Promise<Results<boolean>> {
    try {
      const key = this.getTenantContextKey(userId);
      const success = this.tenantCache.set(key, tenantId, ttlSeconds);
      return Results.ok(success);
    } catch (error) {
      this.logger.error({ message: 'Failed to set tenant context in cache', fullMessage: (error as Error).message });
      return Results.fail<boolean>(null, 'Failed to set tenant context in cache');
    }
  }

  async getTenantContext(userId: string): Promise<Results<string | null>> {
    try {
      const key = this.getTenantContextKey(userId);
      const tenantId = this.tenantCache.get<string>(key);
      return Results.ok(tenantId || null);
    } catch (error) {
      this.logger.error({ message: 'Failed to get tenant context from cache', fullMessage: (error as Error).message });
      return Results.fail<string | null>(null, 'Failed to get tenant context from cache');
    }
  }

  async deleteTenantContext(userId: string): Promise<Results<boolean>> {
    try {
      const key = this.getTenantContextKey(userId);
      const deleted = this.tenantCache.del(key) > 0;
      return Results.ok(deleted);
    } catch (error) {
      this.logger.error({ message: 'Failed to delete tenant context from cache', fullMessage: (error as Error).message });
      return Results.fail<boolean>(null, 'Failed to delete tenant context from cache');
    }
  }

  // ============================================================================
  // CACHE STATISTICS AND MANAGEMENT
  // ============================================================================

  getCacheStats(): Results<{
    sessions: { keys: number; hits: number; misses: number };
    permissions: { keys: number; hits: number; misses: number };
    tenants: { keys: number; hits: number; misses: number };
  }> {
    try {
      return Results.ok({
        sessions: {
          keys: this.sessionCache.keys().length,
          hits: this.sessionCache.getStats().hits,
          misses: this.sessionCache.getStats().misses
        },
        permissions: {
          keys: this.permissionCache.keys().length,
          hits: this.permissionCache.getStats().hits,
          misses: this.permissionCache.getStats().misses
        },
        tenants: {
          keys: this.tenantCache.keys().length,
          hits: this.tenantCache.getStats().hits,
          misses: this.tenantCache.getStats().misses
        }
      });
    } catch (error) {
      return Results.fail<any>(null, `Failed to get cache stats: ${(error as Error).message}`);
    }
  }

  async flushAllCaches(): Promise<Results<void>> {
    try {
      this.sessionCache.flushAll();
      this.permissionCache.flushAll();
      this.tenantCache.flushAll();
      this.cache.flushAll();
      
      this.logger.info({ message: 'All caches flushed successfully' });
      return Results.ok(undefined);
    } catch (error) {
      this.logger.error({ message: 'Failed to flush caches', fullMessage: (error as Error).message });
      return Results.fail<void>(null, 'Failed to flush caches');
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private getSessionKey(sessionId: string): string {
    return `session:${sessionId}`;
  }

  private getUserSessionsKey(userId: string): string {
    return `user_sessions:${userId}`;
  }

  private getPermissionKey(userId: string): string {
    return `permissions:${userId}`;
  }

  private getTenantContextKey(userId: string): string {
    return `tenant_context:${userId}`;
  }
}

// Factory function
export function createSessionCacheService(logger: ILogger): SessionCacheService {
  return new SessionCacheService(logger);
}