import { v4 as uuidv4 } from 'uuid';
import { faker } from '@faker-js/faker';

export interface FactoryOptions {
  [key: string]: any;
}

export interface BatchOptions extends FactoryOptions {
  count?: number;
  uniqueFields?: string[];
}

export abstract class BaseFactory<T> {
  protected static defaultOptions: FactoryOptions = {};

  /**
   * Create a single instance with the given options
   */
  abstract create(options?: FactoryOptions): T;

  /**
   * Create multiple instances
   */
  createBatch(count: number, options: FactoryOptions = {}): T[] {
    return Array.from({ length: count }, (_, index) => {
      const batchOptions = this.generateBatchOptions(options, index);
      return this.create(batchOptions);
    });
  }

  /**
   * Generate unique options for batch creation
   */
  protected generateBatchOptions(baseOptions: FactoryOptions, index: number): FactoryOptions {
    const options = { ...baseOptions };
    
    // Add index suffix to common unique fields
    const uniqueFields = ['email', 'username', 'name', 'domain'];
    
    uniqueFields.forEach(field => {
      if (options[field] && typeof options[field] === 'string') {
        const value = options[field] as string;
        if (field === 'email') {
          const [localPart, domain] = value.split('@');
          options[field] = `${localPart}${index}@${domain}`;
        } else {
          options[field] = `${value}${index}`;
        }
      }
    });

    return options;
  }

  /**
   * Generate a UUID
   */
  protected generateId(): string {
    return uuidv4();
  }

  /**
   * Generate a timestamp
   */
  protected generateTimestamp(): Date {
    return new Date();
  }

  /**
   * Generate a past timestamp
   */
  protected generatePastTimestamp(days: number = 30): Date {
    const now = new Date();
    const pastDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    return pastDate;
  }

  /**
   * Generate a future timestamp
   */
  protected generateFutureTimestamp(days: number = 30): Date {
    const now = new Date();
    const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
    return futureDate;
  }

  /**
   * Merge options with defaults
   */
  protected mergeOptions(options: FactoryOptions = {}, defaults: FactoryOptions = {}): FactoryOptions {
    return { ...defaults, ...options };
  }

  /**
   * Generate random data using faker
   */
  protected faker = faker;

  /**
   * Generate a random choice from an array
   */
  protected randomChoice<T>(choices: T[]): T {
    return choices[Math.floor(Math.random() * choices.length)];
  }

  /**
   * Generate a random boolean
   */
  protected randomBoolean(probability: number = 0.5): boolean {
    return Math.random() < probability;
  }

  /**
   * Generate a random integer between min and max (inclusive)
   */
  protected randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Generate a random float between min and max
   */
  protected randomFloat(min: number, max: number, decimals: number = 2): number {
    const value = Math.random() * (max - min) + min;
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  /**
   * Generate a random subset of an array
   */
  protected randomSubset<T>(array: T[], minCount: number = 1, maxCount?: number): T[] {
    const max = maxCount || array.length;
    const count = this.randomInt(minCount, Math.min(max, array.length));
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  /**
   * Generate sequential data for testing
   */
  protected generateSequential(prefix: string, index: number, padding: number = 3): string {
    return `${prefix}${index.toString().padStart(padding, '0')}`;
  }

  /**
   * Create a deep copy of an object
   */
  protected deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Validate required fields are present
   */
  protected validateRequired(options: FactoryOptions, requiredFields: string[]): void {
    const missing = requiredFields.filter(field => options[field] === undefined);
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
  }

  /**
   * Generate realistic test data based on patterns
   */
  protected generateRealistic = {
    email: (domain: string = 'example.com'): string => {
      const username = faker.internet.userName().toLowerCase();
      return `${username}@${domain}`;
    },

    username: (): string => {
      return faker.internet.userName().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    },

    password: (): string => {
      // Generate a password that meets common requirements
      const lower = faker.string.alpha({ length: 3, casing: 'lower' });
      const upper = faker.string.alpha({ length: 2, casing: 'upper' });
      const numbers = faker.string.numeric(2);
      const symbols = faker.helpers.arrayElement(['!', '@', '#', '$', '%', '&', '*']);
      return faker.helpers.shuffle([lower, upper, numbers, symbols].join('').split('')).join('');
    },

    phone: (): string => {
      return faker.phone.number();
    },

    name: (): { firstName: string; lastName: string } => {
      return {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName()
      };
    },

    address: () => ({
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      postalCode: faker.location.zipCode(),
      country: faker.location.countryCode()
    }),

    company: (): string => {
      return faker.company.name();
    },

    url: (): string => {
      return faker.internet.url();
    },

    domain: (): string => {
      return faker.internet.domainName();
    }
  };
}

/**
 * Factory trait system for composable behaviors
 */
export interface FactoryTrait<T> {
  name: string;
  apply: (instance: T, options?: FactoryOptions) => T;
}

export abstract class TraitableFactory<T> extends BaseFactory<T> {
  protected traits: Map<string, FactoryTrait<T>> = new Map();

  /**
   * Register a trait
   */
  protected registerTrait(trait: FactoryTrait<T>): void {
    this.traits.set(trait.name, trait);
  }

  /**
   * Apply traits to an instance
   */
  protected applyTraits(instance: T, traitNames: string[], options: FactoryOptions = {}): T {
    let result = instance;
    
    for (const traitName of traitNames) {
      const trait = this.traits.get(traitName);
      if (trait) {
        result = trait.apply(result, options);
      } else {
        throw new Error(`Unknown trait: ${traitName}`);
      }
    }

    return result;
  }

  /**
   * Create instance with traits
   */
  createWithTraits(traitNames: string[], options: FactoryOptions = {}): T {
    const instance = this.create(options);
    return this.applyTraits(instance, traitNames, options);
  }

  /**
   * Create batch with traits
   */
  createBatchWithTraits(count: number, traitNames: string[], options: FactoryOptions = {}): T[] {
    return Array.from({ length: count }, (_, index) => {
      const batchOptions = this.generateBatchOptions(options, index);
      return this.createWithTraits(traitNames, batchOptions);
    });
  }

  // Abstract method that must be implemented by subclasses
  abstract create(options?: FactoryOptions): T;
}

/**
 * Utility functions for factory testing
 */
export class FactoryUtils {
  /**
   * Generate test data sets for different scenarios
   */
  static generateTestScenarios<T>(
    factory: BaseFactory<T>,
    scenarios: { name: string; options: FactoryOptions }[]
  ): { name: string; data: T }[] {
    return scenarios.map(scenario => ({
      name: scenario.name,
      data: factory.create(scenario.options)
    }));
  }

  /**
   * Create a factory builder pattern
   */
  static builder<T>(factory: BaseFactory<T>) {
    return new FactoryBuilder(factory);
  }

  /**
   * Validate factory output
   */
  static validate<T>(
    instance: T,
    validators: { field: keyof T; validator: (value: any) => boolean; message?: string }[]
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const { field, validator, message } of validators) {
      const value = instance[field];
      if (!validator(value)) {
        errors.push(message || `Validation failed for field: ${String(field)}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Builder pattern for factories
 */
export class FactoryBuilder<T> {
  private options: FactoryOptions = {};

  constructor(private factory: BaseFactory<T>) {}

  with(field: string, value: any): FactoryBuilder<T> {
    this.options[field] = value;
    return this;
  }

  withOptions(options: FactoryOptions): FactoryBuilder<T> {
    this.options = { ...this.options, ...options };
    return this;
  }

  build(): T {
    return this.factory.create(this.options);
  }

  buildBatch(count: number): T[] {
    return this.factory.createBatch(count, this.options);
  }
}