/**
 * App-specific TestModuleBuilder for sos-web-api services
 * Simplified version that doesn't depend on problematic shared-testing imports
 */
import { Test, TestingModule } from '@nestjs/testing';
import { Type, Provider } from '@nestjs/common';

export interface MockDefinition {
  provide: string | symbol | Type<any>;
  useValue?: any;
  useFactory?: (...args: any[]) => any;
  inject?: any[];
  useClass?: Type<any>;
}

export interface ServiceTestBuilder<T> {
  withMocks(mocks: MockDefinition[]): ServiceTestBuilder<T>;
  withMock(provide: string | symbol | Type<any>, mock: any): ServiceTestBuilder<T>;
  build(): Promise<{ service: T; module: TestingModule; mocks: Map<any, any> }>;
}

class ServiceTestBuilderImpl<T> implements ServiceTestBuilder<T> {
  private mocks: MockDefinition[] = [];

  constructor(private serviceClass: Type<T>) {}

  withMocks(mocks: MockDefinition[]): ServiceTestBuilder<T> {
    this.mocks = [...this.mocks, ...mocks];
    return this;
  }

  withMock(provide: string | symbol | Type<any>, mock: any): ServiceTestBuilder<T> {
    this.mocks.push({ provide, useValue: mock });
    return this;
  }

  async build(): Promise<{ service: T; module: TestingModule; mocks: Map<any, any> }> {
    const mockProviders: Provider[] = this.mocks.map(mock => {
      if (mock.useFactory) {
        return {
          provide: mock.provide,
          useFactory: mock.useFactory,
          inject: mock.inject || []
        };
      } else if (mock.useClass) {
        return {
          provide: mock.provide,
          useClass: mock.useClass
        };
      } else {
        return {
          provide: mock.provide,
          useValue: mock.useValue
        };
      }
    });

    const moduleBuilder = Test.createTestingModule({
      providers: [
        this.serviceClass,
        ...mockProviders
      ]
    });

    const module = await moduleBuilder.compile();
    const service = module.get<T>(this.serviceClass);
    
    const mockMap = new Map();
    this.mocks.forEach(mock => {
      mockMap.set(mock.provide, module.get(mock.provide));
    });

    return { service, module, mocks: mockMap };
  }
}

export class TestModuleBuilder {
  static forService<T>(serviceClass: Type<T>): ServiceTestBuilder<T> {
    return new ServiceTestBuilderImpl(serviceClass);
  }

  /**
   * Create a mock repository with common CRUD operations
   */
  static createMockRepository<T>(): any {
    return {
      findById: jest.fn().mockResolvedValue(null),
      findOne: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      findAll: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation((data) => Promise.resolve({ id: '1', ...data })),
      update: jest.fn().mockImplementation((id, data) => Promise.resolve({ id, ...data })),
      delete: jest.fn().mockResolvedValue(true),
      count: jest.fn().mockResolvedValue(0),
      exists: jest.fn().mockResolvedValue(false),
      save: jest.fn().mockImplementation((data) => Promise.resolve({ id: '1', ...data })),
    };
  }

  /**
   * Create a mock logger
   */
  static createMockLogger(): any {
    return {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      info: jest.fn(),
      warning: jest.fn(),
    };
  }
}