import { beforeEach, afterEach } from 'vitest';
import { TestDatabase } from '../test-helpers';

// Mock database instance for tests
let testDb: TestDatabase | null = null;

// Initialize test database connection
beforeEach(async () => {
  // This would typically connect to your actual test database
  // For now, we'll create a mock instance
  const mockKnex = {
    raw: async (sql: string) => ({ rows: [] }),
    transaction: async (callback: any) => callback(mockKnex),
    select: () => mockKnex,
    from: () => mockKnex,
    where: () => mockKnex,
    insert: () => mockKnex,
    update: () => mockKnex,
    delete: () => mockKnex,
    first: async () => null,
    then: async () => [],
  };
  
  testDb = TestDatabase.getInstance(mockKnex);
});

afterEach(async () => {
  if (testDb) {
    try {
      // Clean database between tests
      await testDb.cleanDatabase();
    } catch (error) {
      console.warn('Failed to clean test database:', error);
    }
  }
});

// Export for use in tests
export { testDb };