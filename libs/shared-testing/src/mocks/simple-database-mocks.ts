/**
 * Simplified database mocks that work with both Jest and Vitest
 * These mocks provide realistic Knex.js query builder interfaces for testing
 */

// Dynamic mock framework detection
let mockFn: any;
try {
  mockFn = require('vitest').vi.fn;
} catch {
  try {
    mockFn = require('@jest/globals').jest.fn;
  } catch {
    // Fallback mock implementation that actually works
    mockFn = () => {
      let implementation: any = null;
      let returnValue: any = undefined;
      let resolvedValue: any = undefined;
      let rejectedValue: any = undefined;
      const calls: any[][] = [];
      
      const fn = (...args: any[]) => {
        calls.push(args);
        if (implementation) {
          return implementation(...args);
        }
        if (resolvedValue !== undefined) {
          return Promise.resolve(resolvedValue);
        }
        if (rejectedValue !== undefined) {
          return Promise.reject(rejectedValue);
        }
        return returnValue;
      };
      
      fn.mockImplementation = (impl: any) => { implementation = impl; return fn; };
      fn.mockReturnValue = (value: any) => { returnValue = value; return fn; };
      fn.mockResolvedValue = (value: any) => { resolvedValue = value; return fn; };
      fn.mockRejectedValue = (value: any) => { rejectedValue = value; return fn; };
      fn.mockReturnThis = () => { returnValue = fn; return fn; };
      fn.mockClear = () => { calls.length = 0; return fn; };
      
      // Add mock property for compatibility
      fn.mock = {
        get calls() { return calls; }
      };
      
      return fn;
    };
  }
}

/**
 * Create a mock Knex query builder that chains properly
 */
export function createMockKnexQueryBuilder(defaultResult: any = []): any {
  const mockBuilder: any = {};

  // Query building methods that return this for chaining
  const chainableMethods = [
    'select', 'from', 'where', 'whereIn', 'whereNotIn', 'whereNull', 'whereNotNull',
    'whereBetween', 'whereRaw', 'join', 'leftJoin', 'rightJoin', 'innerJoin',
    'orderBy', 'groupBy', 'having', 'limit', 'offset', 'distinct', 'clone',
    'debug', 'timeout', 'transacting', 'forUpdate', 'forShare', 'skipLocked', 'noWait'
  ];

  // Terminal methods that return promises or values
  const terminalMethods = [
    'insert', 'update', 'delete', 'del', 'returning', 'first', 'count',
    'sum', 'avg', 'min', 'max'
  ];

  // Set up chainable methods
  chainableMethods.forEach(method => {
    mockBuilder[method] = mockFn().mockReturnValue(mockBuilder);
  });

  // Set up terminal methods
  terminalMethods.forEach(method => {
    mockBuilder[method] = mockFn().mockResolvedValue(defaultResult);
  });

  // Special handling for then/catch/finally to make it thenable
  mockBuilder.then = mockFn().mockImplementation((onResolve: any) => {
    return Promise.resolve(defaultResult).then(onResolve);
  });

  mockBuilder.catch = mockFn().mockImplementation((onReject: any) => {
    return Promise.resolve(defaultResult).catch(onReject);
  });

  mockBuilder.finally = mockFn().mockImplementation((onFinally: any) => {
    return Promise.resolve(defaultResult).finally(onFinally);
  });

  return mockBuilder;
}

/**
 * Create a mock Knex instance with common database operations
 */
export function createMockKnex(): any {
  const mockKnex: any = (tableName?: string) => {
    const builder = createMockKnexQueryBuilder();
    if (tableName) {
      builder.from(tableName);
    }
    return builder;
  };

  // Add Knex static methods
  mockKnex.select = mockFn().mockReturnValue(createMockKnexQueryBuilder());
  mockKnex.from = mockFn().mockReturnValue(createMockKnexQueryBuilder());
  mockKnex.table = mockFn().mockReturnValue(createMockKnexQueryBuilder());
  mockKnex.raw = mockFn().mockResolvedValue({ rows: [] });

  // Transaction support
  mockKnex.transaction = mockFn().mockImplementation((callback: any) => {
    const trx = createMockKnexQueryBuilder();
    return callback(trx);
  });

  // Schema operations
  mockKnex.schema = {
    createTable: mockFn().mockResolvedValue(undefined),
    dropTable: mockFn().mockResolvedValue(undefined),
    alterTable: mockFn().mockResolvedValue(undefined),
    hasTable: mockFn().mockResolvedValue(true),
    hasColumn: mockFn().mockResolvedValue(true)
  };

  // Migration operations
  mockKnex.migrate = {
    latest: mockFn().mockResolvedValue([]),
    rollback: mockFn().mockResolvedValue([]),
    status: mockFn().mockResolvedValue(0)
  };

  // Seed operations
  mockKnex.seed = {
    run: mockFn().mockResolvedValue([])
  };

  mockKnex.destroy = mockFn().mockResolvedValue(undefined);

  return mockKnex;
}

/**
 * Create a mock repository with common CRUD operations
 */
export function createMockRepository<T = any>(mockData: T[] = []): any {
  const data = [...mockData];

  const mockRepo = {
    findById: mockFn(),
    findOne: mockFn(),
    findMany: mockFn(),
    findAll: mockFn(),
    create: mockFn(),
    update: mockFn(),
    delete: mockFn(),
    count: mockFn(),
    exists: mockFn(),
    save: mockFn(),
    bulkCreate: mockFn(),
    bulkUpdate: mockFn(),
    bulkDelete: mockFn()
  };

  // Set up default implementations
  mockRepo.findAll.mockResolvedValue(data);
  mockRepo.findMany.mockImplementation((criteria: any) => {
    // Simple filtering logic for testing
    if (!criteria || Object.keys(criteria).length === 0) {
      return Promise.resolve(data);
    }
    const filtered = data.filter(item => {
      return Object.entries(criteria).every(([key, value]) => 
        (item as any)[key] === value
      );
    });
    return Promise.resolve(filtered);
  });

  mockRepo.findById.mockImplementation((id: any) => {
    const item = data.find(item => (item as any).id === id);
    return Promise.resolve(item || null);
  });

  mockRepo.exists.mockImplementation((id: any) => {
    const exists = data.some(item => (item as any).id === id);
    return Promise.resolve(exists);
  });

  mockRepo.count.mockResolvedValue(data.length);
  mockRepo.create.mockImplementation((itemData: any) => Promise.resolve({ id: '1', ...itemData }));
  mockRepo.update.mockImplementation((id: any, updateData: any) => Promise.resolve({ id, ...updateData }));
  mockRepo.delete.mockResolvedValue(true);
  mockRepo.save.mockImplementation((itemData: any) => Promise.resolve({ id: '1', ...itemData }));
  mockRepo.bulkCreate.mockImplementation((items: any[]) =>
    Promise.resolve(items.map((item, index) => ({ id: String(index + 1), ...item })))
  );

  return mockRepo;
}

/**
 * Create a mock database service with transaction support
 */
export function createMockDatabaseService(): any {
  const mockKnex = createMockKnex();

  return {
    knex: mockKnex,
    getConnection: mockFn().mockReturnValue(mockKnex),
    transaction: mockFn().mockImplementation((callback: any) => {
      const trx = createMockKnexQueryBuilder();
      return callback(trx);
    }),
    raw: mockFn().mockResolvedValue({ rows: [] }),
    destroy: mockFn().mockResolvedValue(undefined),
    
    // Health check methods
    isHealthy: mockFn().mockResolvedValue(true),
    ping: mockFn().mockResolvedValue('pong'),
    
    // Test utilities
    _clearMockData: () => {
      // Reset all mock call counts
      Object.values(mockKnex).forEach((method: any) => {
        if (typeof method === 'function' && method.mockClear) {
          method.mockClear();
        }
      });
    }
  };
}

/**
 * Create repository mocks with realistic data for testing
 */
export function createRepositoryMocks(testData: Record<string, any[]> = {}): Record<string, any> {
  const repositories: Record<string, any> = {};

  // Common repository types
  const repoTypes = ['user', 'tenant', 'program', 'session', 'exercise'];

  repoTypes.forEach(type => {
    const data = testData[type] || [];
    repositories[`${type}Repository`] = createMockRepository(data);
  });

  return repositories;
}

/**
 * Utility to set up realistic mock data for repositories
 */
export function setupMockRepositoryData(repositories: Record<string, any>, testData: Record<string, any[]>): void {
  Object.entries(testData).forEach(([type, data]) => {
    const repoName = `${type}Repository`;
    if (repositories[repoName]) {
      // Update the mock implementations with new data
      repositories[repoName].findAll.mockResolvedValue(data);
      repositories[repoName].count.mockResolvedValue(data.length);
      
      repositories[repoName].findMany.mockImplementation((criteria: any) => {
        if (!criteria || Object.keys(criteria).length === 0) {
          return Promise.resolve(data);
        }
        const filtered = data.filter(item => {
          return Object.entries(criteria).every(([key, value]) => 
            item[key] === value
          );
        });
        return Promise.resolve(filtered);
      });

      repositories[repoName].findById.mockImplementation((id: any) => {
        const item = data.find(item => item.id === id);
        return Promise.resolve(item || null);
      });

      repositories[repoName].exists.mockImplementation((id: any) => {
        const exists = data.some(item => item.id === id);
        return Promise.resolve(exists);
      });
    }
  });
}

/**
 * Create mock configuration for different test scenarios
 */
export interface MockScenarioConfig {
  simulateErrors?: boolean;
  errorRate?: number;
  responseDelay?: number;
  customResponses?: Record<string, any>;
}

export function createMockScenario(config: MockScenarioConfig = {}): {
  knex: any;
  repositories: Record<string, any>;
  applyScenario: () => void;
} {
  const {
    simulateErrors = false,
    errorRate = 0.1,
    responseDelay = 0,
    customResponses = {}
  } = config;

  const knex = createMockKnex();
  const repositories = createRepositoryMocks();

  const applyScenario = () => {
    if (simulateErrors) {
      // Add error simulation to repository methods
      Object.values(repositories).forEach((repo: any) => {
        Object.keys(repo).forEach(method => {
          if (typeof repo[method] === 'function' && method !== '_clearMockData') {
            const originalImpl = repo[method].getMockImplementation?.() || (() => Promise.resolve());
            
            repo[method].mockImplementation((...args: any[]) => {
              if (Math.random() < errorRate) {
                return Promise.reject(new Error(`Mock error in ${method}`));
              }
              
              const result = originalImpl(...args);
              
              if (responseDelay > 0) {
                return new Promise(resolve => {
                  setTimeout(() => resolve(result), responseDelay);
                });
              }
              
              return result;
            });
          }
        });
      });
    }

    // Apply custom responses
    Object.entries(customResponses).forEach(([path, response]) => {
      const [repoName, methodName] = path.split('.');
      if (repositories[repoName] && repositories[repoName][methodName]) {
        repositories[repoName][methodName].mockResolvedValue(response);
      }
    });
  };

  return { knex, repositories, applyScenario };
}

/**
 * Utility to verify mock interactions
 */
export class MockVerifier {
  static verifyMethodCalled(mockObject: any, methodName: string, times?: number): boolean {
    const method = mockObject[methodName];
    if (!method || typeof method !== 'function') {
      return false;
    }

    const callCount = method.mock?.calls?.length || 0;
    return times !== undefined ? callCount === times : callCount > 0;
  }

  static verifyMethodCalledWith(mockObject: any, methodName: string, ...expectedArgs: any[]): boolean {
    const method = mockObject[methodName];
    if (!method || typeof method !== 'function') {
      return false;
    }

    const calls = method.mock?.calls || [];
    return calls.some((call: any[]) => 
      call.length === expectedArgs.length && 
      call.every((arg, index) => JSON.stringify(arg) === JSON.stringify(expectedArgs[index]))
    );
  }

  static getMethodCallCount(mockObject: any, methodName: string): number {
    const method = mockObject[methodName];
    return method?.mock?.calls?.length || 0;
  }

  static getMethodCalls(mockObject: any, methodName: string): any[][] {
    const method = mockObject[methodName];
    return method?.mock?.calls || [];
  }

  static resetMock(mockObject: any, methodName?: string): void {
    if (methodName) {
      const method = mockObject[methodName];
      if (method && typeof method.mockClear === 'function') {
        method.mockClear();
      }
    } else {
      // Reset all methods
      Object.keys(mockObject).forEach(key => {
        const method = mockObject[key];
        if (method && typeof method.mockClear === 'function') {
          method.mockClear();
        }
      });
    }
  }
}