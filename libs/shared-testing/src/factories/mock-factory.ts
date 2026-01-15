/**
 * Enhanced MockFactory interface for test data creation
 * Provides a consistent interface for creating mock objects with proper state management
 */
export interface MockFactory<T> {
  /**
   * Create a single mock instance with optional overrides
   */
  create(overrides?: Partial<T>): T;

  /**
   * Create multiple mock instances
   */
  createMany(count: number, overrides?: Partial<T>): T[];

  /**
   * Reset the factory state (sequence counters, cached data, etc.)
   */
  reset(): void;
}

/**
 * Base implementation of MockFactory with common functionality
 */
export abstract class BaseMockFactory<T> implements MockFactory<T> {
  protected sequence = 0;
  protected cache = new Map<string, any>();

  abstract create(overrides?: Partial<T>): T;

  createMany(count: number, overrides?: Partial<T>): T[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  reset(): void {
    this.sequence = 0;
    this.cache.clear();
  }

  /**
   * Get next sequence number
   */
  protected nextSequence(): number {
    return ++this.sequence;
  }

  /**
   * Cache a value for reuse
   */
  protected setCached(key: string, value: any): void {
    this.cache.set(key, value);
  }

  /**
   * Get cached value
   */
  protected getCached<V>(key: string): V | undefined {
    return this.cache.get(key);
  }

  /**
   * Merge overrides with defaults
   */
  protected mergeOverrides(defaults: T, overrides?: Partial<T>): T {
    return { ...defaults, ...overrides };
  }
}

/**
 * Factory for creating related test data with proper relationships
 */
export class TestDataBuilder {
  private factories = new Map<string, MockFactory<any>>();

  /**
   * Register a factory for a specific entity type
   */
  registerFactory<T>(name: string, factory: MockFactory<T>): void {
    this.factories.set(name, factory);
  }

  /**
   * Get a registered factory
   */
  getFactory<T>(name: string): MockFactory<T> {
    const factory = this.factories.get(name);
    if (!factory) {
      throw new Error(`Factory not found: ${name}`);
    }
    return factory;
  }

  /**
   * Check if a factory is registered
   */
  hasFactory(name: string): boolean {
    return this.factories.has(name);
  }

  /**
   * List all registered factory names
   */
  getFactoryNames(): string[] {
    return Array.from(this.factories.keys());
  }

  /**
   * Create related entities with proper relationships
   */
  createRelated<T, R>(
    primaryFactory: MockFactory<T>,
    relatedFactory: MockFactory<R>,
    relationshipField: keyof T,
    count: number = 1
  ): { primary: T; related: R[] } {
    const related = relatedFactory.createMany(count);
    const primary = primaryFactory.create({
      [relationshipField]: related.length === 1 ? related[0] : related
    } as Partial<T>);

    return { primary, related };
  }

  /**
   * Create a hierarchy of related entities
   */
  createHierarchy<T>(
    factory: MockFactory<T>,
    parentField: keyof T,
    childrenField: keyof T,
    depth: number = 2,
    childrenPerLevel: number = 2
  ): T {
    if (depth <= 0) {
      return factory.create();
    }

    const children = Array.from({ length: childrenPerLevel }, () =>
      this.createHierarchy(factory, parentField, childrenField, depth - 1, childrenPerLevel)
    );

    const parent = factory.create({
      [childrenField]: children
    } as Partial<T>);

    // Set parent reference in children
    children.forEach(child => {
      (child as any)[parentField] = parent;
    });

    return parent;
  }

  /**
   * Create entities with circular relationships
   */
  createCircularRelationship<T, R>(
    primaryFactory: MockFactory<T>,
    relatedFactory: MockFactory<R>,
    primaryToRelatedField: keyof T,
    relatedToPrimaryField: keyof R
  ): { primary: T; related: R } {
    const primary = primaryFactory.create();
    const related = relatedFactory.create();

    // Set up circular references
    (primary as any)[primaryToRelatedField] = related;
    (related as any)[relatedToPrimaryField] = primary;

    return { primary, related };
  }

  /**
   * Create a batch of related entities with consistent relationships
   */
  createBatchWithRelationships<T, R>(
    primaryFactory: MockFactory<T>,
    relatedFactory: MockFactory<R>,
    count: number,
    relationshipSetup: (primary: T, related: R[], index: number) => void
  ): { primaries: T[]; related: R[] } {
    const primaries: T[] = [];
    const allRelated: R[] = [];

    for (let i = 0; i < count; i++) {
      const primary = primaryFactory.create();
      const related = relatedFactory.createMany(Math.floor(Math.random() * 3) + 1); // 1-3 related entities
      
      relationshipSetup(primary, related, i);
      
      primaries.push(primary);
      allRelated.push(...related);
    }

    return { primaries, related: allRelated };
  }

  /**
   * Reset all registered factories
   */
  resetAll(): void {
    this.factories.forEach(factory => factory.reset());
  }

  /**
   * Clear all registered factories
   */
  clearFactories(): void {
    this.factories.clear();
  }

  /**
   * Create a snapshot of current factory states
   */
  createSnapshot(): Map<string, any> {
    const snapshot = new Map();
    this.factories.forEach((factory, name) => {
      if (factory instanceof BaseMockFactory) {
        snapshot.set(name, {
          sequence: (factory as any).sequence,
          cache: new Map((factory as any).cache)
        });
      }
    });
    return snapshot;
  }

  /**
   * Restore factory states from a snapshot
   */
  restoreSnapshot(snapshot: Map<string, any>): void {
    snapshot.forEach((state, name) => {
      const factory = this.factories.get(name);
      if (factory instanceof BaseMockFactory) {
        (factory as any).sequence = state.sequence;
        (factory as any).cache = new Map(state.cache);
      }
    });
  }
}

/**
 * Utility functions for mock factories
 */
export class MockFactoryUtils {
  /**
   * Create a mock factory from a template object
   */
  static fromTemplate<T>(template: T): MockFactory<T> {
    return new (class extends BaseMockFactory<T> {
      create(overrides?: Partial<T>): T {
        return this.mergeOverrides(
          JSON.parse(JSON.stringify(template)), // Deep clone template
          overrides
        );
      }
    })();
  }

  /**
   * Create a mock factory with custom generation logic
   */
  static withGenerator<T>(generator: (sequence: number) => T): MockFactory<T> {
    return new (class extends BaseMockFactory<T> {
      create(overrides?: Partial<T>): T {
        const generated = generator(this.nextSequence());
        return this.mergeOverrides(generated, overrides);
      }
    })();
  }

  /**
   * Create a factory that cycles through a set of predefined values
   */
  static withCycle<T>(values: T[]): MockFactory<T> {
    if (values.length === 0) {
      throw new Error('Values array cannot be empty');
    }

    return new (class extends BaseMockFactory<T> {
      create(overrides?: Partial<T>): T {
        const index = (this.nextSequence() - 1) % values.length;
        const baseValue = JSON.parse(JSON.stringify(values[index])); // Deep clone
        return this.mergeOverrides(baseValue, overrides);
      }
    })();
  }

  /**
   * Create a factory that generates random values from a set
   */
  static withRandomChoice<T>(values: T[]): MockFactory<T> {
    if (values.length === 0) {
      throw new Error('Values array cannot be empty');
    }

    return new (class extends BaseMockFactory<T> {
      create(overrides?: Partial<T>): T {
        const randomIndex = Math.floor(Math.random() * values.length);
        const baseValue = JSON.parse(JSON.stringify(values[randomIndex])); // Deep clone
        return this.mergeOverrides(baseValue, overrides);
      }
    })();
  }

  /**
   * Create a factory with conditional logic
   */
  static withCondition<T>(
    condition: (sequence: number) => boolean,
    trueFactory: MockFactory<T>,
    falseFactory: MockFactory<T>
  ): MockFactory<T> {
    return new (class extends BaseMockFactory<T> {
      create(overrides?: Partial<T>): T {
        const sequence = this.nextSequence();
        const factory = condition(sequence) ? trueFactory : falseFactory;
        return factory.create(overrides);
      }

      reset(): void {
        super.reset();
        trueFactory.reset();
        falseFactory.reset();
      }
    })();
  }

  /**
   * Create a factory that applies transformations to generated data
   */
  static withTransform<T, R>(
    baseFactory: MockFactory<T>,
    transform: (value: T) => R
  ): MockFactory<R> {
    return new (class extends BaseMockFactory<R> {
      create(overrides?: Partial<R>): R {
        const baseValue = baseFactory.create();
        const transformed = transform(baseValue);
        return this.mergeOverrides(transformed, overrides);
      }

      reset(): void {
        super.reset();
        baseFactory.reset();
      }
    })();
  }

  /**
   * Combine multiple factories into a composite factory
   */
  static composite<T>(factories: MockFactory<Partial<T>>[]): MockFactory<T> {
    return new (class extends BaseMockFactory<T> {
      create(overrides?: Partial<T>): T {
        let result = {} as T;
        
        // Merge results from all factories
        factories.forEach(factory => {
          const partial = factory.create();
          result = { ...result, ...partial };
        });

        return this.mergeOverrides(result, overrides);
      }

      reset(): void {
        super.reset();
        factories.forEach(factory => factory.reset());
      }
    })();
  }

  /**
   * Create a factory that maintains referential integrity
   */
  static withReferentialIntegrity<T>(
    factory: MockFactory<T>,
    referenceFields: (keyof T)[],
    referenceStore: Map<string, any> = new Map()
  ): MockFactory<T> {
    return new (class extends BaseMockFactory<T> {
      create(overrides?: Partial<T>): T {
        const entity = factory.create(overrides);
        
        // Store references for future use
        referenceFields.forEach(field => {
          const value = entity[field];
          if (value !== undefined) {
            referenceStore.set(`${String(field)}_${value}`, entity);
          }
        });

        return entity;
      }

      reset(): void {
        super.reset();
        factory.reset();
        referenceStore.clear();
      }
    })();
  }

  /**
   * Create a factory that validates generated data
   */
  static withValidation<T>(
    factory: MockFactory<T>,
    validator: (value: T) => boolean,
    maxRetries: number = 10
  ): MockFactory<T> {
    return new (class extends BaseMockFactory<T> {
      create(overrides?: Partial<T>): T {
        let attempts = 0;
        let result: T;

        do {
          result = factory.create(overrides);
          attempts++;
          
          if (attempts > maxRetries) {
            throw new Error(`Failed to generate valid data after ${maxRetries} attempts`);
          }
        } while (!validator(result));

        return result;
      }

      reset(): void {
        super.reset();
        factory.reset();
      }
    })();
  }

  /**
   * Create a factory that tracks generated entities
   */
  static withTracking<T>(
    factory: MockFactory<T>,
    tracker: T[] = []
  ): MockFactory<T> & { getGenerated(): T[]; clearTracking(): void } {
    const trackingFactory = new (class extends BaseMockFactory<T> {
      create(overrides?: Partial<T>): T {
        const entity = factory.create(overrides);
        tracker.push(entity);
        return entity;
      }

      reset(): void {
        super.reset();
        factory.reset();
      }

      getGenerated(): T[] {
        return [...tracker];
      }

      clearTracking(): void {
        tracker.length = 0;
      }
    })();

    return trackingFactory;
  }
}