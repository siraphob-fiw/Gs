// Main exports for @strengthos/shared-cache

// Core cache services
export * from './redis-cache-service';
export * from './session-cache-service';
export * from './priority-cache';
export * from './lru-cache-manager';

// Configuration and management
export * from './cache-configuration-service';
export * from './cache-invalidation-service';

// For backward compatibility
export type { IRedisCacheService } from './redis-cache-service';
import type { IRedisCacheService } from './redis-cache-service';
export type ICacheService = IRedisCacheService;