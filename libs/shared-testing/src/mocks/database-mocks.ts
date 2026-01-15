// Conditional Jest import for compatibility
declare const jest: any;

// Type alias for mock functions to avoid jest.MockedFunction issues
type MockFunction<T = any> = any;

/**
 * Mock Knex.js QueryBuilder interface
 * Provides realistic mocks that match the actual Knex.js interface
 */
export interface MockQueryBuilder {
  select: MockFunction;
  where: MockFunction;
  whereIn: MockFunction;
  whereNotIn: MockFunction;
  whereNull: MockFunction;
  whereNotNull: MockFunction;
  whereBetween: MockFunction;
  whereRaw: MockFunction;
  join: MockFunction;
  leftJoin: MockFunction;
  rightJoin: MockFunction;
  innerJoin: MockFunction;
  orderBy: MockFunction;
  groupBy: MockFunction;
  having: MockFunction;
  limit: MockFunction;
  offset: MockFunction;
  insert: MockFunction;
  update: MockFunction;
  delete: MockFunction;
  del: MockFunction;
  returning: MockFunction;
  first: MockFunction;
  count: MockFunction;
  sum: MockFunction;
  avg: MockFunction;
  min: MockFunction;
  max: MockFunction;
  distinct: MockFunction;
  clone: MockFunction;
  debug: MockFunction;
  timeout: MockFunction;
  transacting: MockFunction;
  forUpdate: MockFunction;
  forShare: MockFunction;
  skipLocked: MockFunction;
  noWait: MockFunction;
  then: MockFunction;
  catch: MockFunction;
  finally: MockFunction;
}

/**
 * Create a realistic Knex.js QueryBuilder mock
 */
export function createMockKnexQueryBuilder(): MockQueryBuilder {
  const mockBuilder: any = {};

  // Create chainable methods that return the mock builder
  const chainableMethods = [
    'select', 'where', 'whereIn', 'whereNotIn', 'whereNull', 'whereNotNull',
    'whereBetween', 'whereRaw', 'join', 'leftJoin', 'rightJoin', 'innerJoin',
    'orderBy', 'groupBy', 'having', 'limit', 'offset', 'returning',
    'distinct', 'clone', 'debug', 'timeout', 'transacting', 'forUpdate',
    'forShare', 'skipLocked', 'noWait'
  ];

  chainableMethods.forEach(method => {
    mockBuilder[method] = jest.fn().mockReturnValue(mockBuilder);
  });

  // Create methods that return promises or values
  mockBuilder.insert = jest.fn().mockResolvedValue([1]);
  mockBuilder.update = jest.fn().mockResolvedValue(1);
  mockBuilder.delete = jest.fn().mockResolvedValue(1);
  mockBuilder.del = jest.fn().mockResolvedValue(1);
  mockBuilder.first = jest.fn().mockResolvedValue(null);
  mockBuilder.count = jest.fn().mockResolvedValue([{ count: '0' }]);
  mockBuilder.sum = jest.fn().mockResolvedValue([{ sum: '0' }]);
  mockBuilder.avg = jest.fn().mockResolvedValue([{ avg: '0' }]);
  mockBuilder.min = jest.fn().mockResolvedValue([{ min: null }]);
  mockBuilder.max = jest.fn().mockResolvedValue([{ max: null }]);

  // Promise methods
  mockBuilder.then = jest.fn().mockImplementation((onResolve: (value: any) => any) => {
    return Promise.resolve([]).then(onResolve);
  });
  mockBuilder.catch = jest.fn().mockImplementation((onReject: (reason: any) => any) => {
    return Promise.resolve([]).catch(onReject);
  });
  mockBuilder.finally = jest.fn().mockImplementation((onFinally: () => any) => {
    return Promise.resolve([]).finally(onFinally);
  });

  return mockBuilder as MockQueryBuilder;
}

/**
 * Mock Knex instance
 */
export interface MockKnex {
  select: MockFunction;
  from: MockFunction;
  table: MockFunction;
  raw: MockFunction;
  transaction: MockFunction;
  schema: {
    createTable: MockFunction;
    dropTable: MockFunction;
    alterTable: MockFunction;
    hasTable: MockFunction;
    hasColumn: MockFunction;
  };
  migrate: {
    latest: MockFunction;
    rollback: MockFunction;
    status: MockFunction;
  };
  seed: {
    run: MockFunction;
  };
  destroy: MockFunction;
}

/**
 * Create a mock Knex instance
 */
export function createMockKnex(): MockKnex {
  const queryBuilder = createMockKnexQueryBuilder();

  return {
    select: jest.fn().mockReturnValue(queryBuilder),
    from: jest.fn().mockReturnValue(queryBuilder),
    table: jest.fn().mockReturnValue(queryBuilder),
    raw: jest.fn().mockResolvedValue({ rows: [] }),
    transaction: jest.fn().mockImplementation((callback: (trx: any) => any) => {
      const trx = createMockKnexQueryBuilder();
      return callback(trx);
    }),
    schema: {
      createTable: jest.fn().mockResolvedValue(undefined),
      dropTable: jest.fn().mockResolvedValue(undefined),
      alterTable: jest.fn().mockResolvedValue(undefined),
      hasTable: jest.fn().mockResolvedValue(false),
      hasColumn: jest.fn().mockResolvedValue(false)
    },
    migrate: {
      latest: jest.fn().mockResolvedValue([]),
      rollback: jest.fn().mockResolvedValue([]),
      status: jest.fn().mockResolvedValue([])
    },
    seed: {
      run: jest.fn().mockResolvedValue([])
    },
    destroy: jest.fn().mockResolvedValue(undefined)
  };
}

/**
 * Base repository mock
 */
export interface MockRepository<T> {
  findById: MockFunction;
  findOne: MockFunction;
  findMany: MockFunction;
  findAll: MockFunction;
  create: MockFunction;
  update: MockFunction;
  delete: MockFunction;
  count: MockFunction;
  exists: MockFunction;
  save: MockFunction;
  bulkCreate: MockFunction;
  bulkUpdate: MockFunction;
  bulkDelete: MockFunction;
}

/**
 * Create a mock repository with common CRUD operations
 */
export function createMockRepository<T>(): MockRepository<T> {
  return {
    findById: jest.fn().mockResolvedValue(null),
    findOne: jest.fn().mockResolvedValue(null),
    findMany: jest.fn().mockResolvedValue([]),
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockImplementation((data: any) => Promise.resolve({ id: '1', ...data })),
    update: jest.fn().mockImplementation((id: any, data: any) => Promise.resolve({ id, ...data })),
    delete: jest.fn().mockResolvedValue(true),
    count: jest.fn().mockResolvedValue(0),
    exists: jest.fn().mockResolvedValue(false),
    save: jest.fn().mockImplementation((data: any) => Promise.resolve({ id: '1', ...data })),
    bulkCreate: jest.fn().mockImplementation((items: any[]) => 
      Promise.resolve(items.map((item: any, index: number) => ({ id: String(index + 1), ...item })))
    ),
    bulkUpdate: jest.fn().mockResolvedValue(0),
    bulkDelete: jest.fn().mockResolvedValue(0)
  };
}

/**
 * Database mock configuration utilities
 */
export class DatabaseMockConfig {
  private static queryResults = new Map<string, any>();
  private static repositoryData = new Map<string, any[]>();

  /**
   * Set mock query result for specific query patterns
   */
  static setQueryResult(pattern: string, result: any): void {
    this.queryResults.set(pattern, result);
  }

  /**
   * Set mock data for a repository
   */
  static setRepositoryData<T>(repositoryName: string, data: T[]): void {
    this.repositoryData.set(repositoryName, data);
  }

  /**
   * Get mock data for a repository
   */
  static getRepositoryData<T>(repositoryName: string): T[] {
    return this.repositoryData.get(repositoryName) || [];
  }

  /**
   * Clear all mock configurations
   */
  static clear(): void {
    this.queryResults.clear();
    this.repositoryData.clear();
  }

  /**
   * Create a configured mock repository with predefined data
   */
  static createConfiguredRepository<T>(repositoryName: string): MockRepository<T> {
    const mockRepo = createMockRepository<T>();
    const data = this.getRepositoryData<T>(repositoryName);

    // Configure mock methods to use predefined data
    mockRepo.findAll.mockResolvedValue(data);
    mockRepo.findMany.mockImplementation((criteria: any) => {
      // Simple filtering logic for testing
      return Promise.resolve(data.filter(item => 
        Object.keys(criteria || {}).every(key => 
          (item as any)[key] === (criteria as any)[key]
        )
      ));
    });
    mockRepo.findById.mockImplementation((id: any) => {
      const item = data.find(item => (item as any).id === id);
      return Promise.resolve(item || null);
    });
    mockRepo.count.mockResolvedValue(data.length);
    mockRepo.exists.mockImplementation((id: any) => {
      return Promise.resolve(data.some(item => (item as any).id === id));
    });

    return mockRepo;
  }
}

/**
 * Transaction mock utilities
 */
export class TransactionMockUtils {
  /**
   * Create a mock transaction that can be used in tests
   */
  static createMockTransaction(): any {
    const queryBuilder = createMockKnexQueryBuilder();
    
    return {
      ...queryBuilder,
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      isCompleted: jest.fn().mockReturnValue(false),
      savepoint: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined)
    };
  }

  /**
   * Create a mock transaction manager
   */
  static createMockTransactionManager(): any {
    return {
      transaction: jest.fn().mockImplementation((callback: (trx: any) => any) => {
        const trx = this.createMockTransaction();
        return callback(trx);
      }),
      isTransaction: jest.fn().mockReturnValue(false)
    };
  }
}
