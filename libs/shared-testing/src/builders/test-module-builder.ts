import { Test, TestingModule } from '@nestjs/testing';
import { Type, Provider } from '@nestjs/common';

// Extend TestingModule interface to include get method for compatibility
interface ExtendedTestingModule extends TestingModule {
  get<T = any>(token: string | symbol | Type<T>): T;
}

export interface MockDefinition {
  provide: string | symbol | Type<any>;
  useValue?: any;
  useFactory?: (...args: any[]) => any;
  inject?: any[];
  useClass?: Type<any>;
}

export interface ServiceTestBuilder<T> {
  withMocks(mocks: MockDefinition[]): ServiceTestBuilder<T>;
  withRealDependencies(deps: Type<any>[]): ServiceTestBuilder<T>;
  withMock(provide: string | symbol | Type<any>, mock: any): ServiceTestBuilder<T>;
  withFactory(provide: string | symbol | Type<any>, factory: (...args: any[]) => any, inject?: any[]): ServiceTestBuilder<T>;
  build(): Promise<{ service: T; module: TestingModule; mocks: Map<any, any> }>;
}

export interface ControllerTestBuilder<T> {
  withMocks(mocks: MockDefinition[]): ControllerTestBuilder<T>;
  withRealDependencies(deps: Type<any>[]): ControllerTestBuilder<T>;
  withMock(provide: string | symbol | Type<any>, mock: any): ControllerTestBuilder<T>;
  withFactory(provide: string | symbol | Type<any>, factory: (...args: any[]) => any, inject?: any[]): ControllerTestBuilder<T>;
  build(): Promise<{ controller: T; module: TestingModule; mocks: Map<any, any> }>;
}

export interface ModuleTestBuilder {
  withMocks(mocks: MockDefinition[]): ModuleTestBuilder;
  withMock(provide: string | symbol | Type<any>, mock: any): ModuleTestBuilder;
  withFactory(provide: string | symbol | Type<any>, factory: (...args: any[]) => any, inject?: any[]): ModuleTestBuilder;
  excludeGlobalProviders(providers: string[]): ModuleTestBuilder;
  build(): Promise<TestingModule>;
}

class ServiceTestBuilderImpl<T> implements ServiceTestBuilder<T> {
  private mocks: MockDefinition[] = [];
  private realDeps: Type<any>[] = [];

  constructor(private serviceClass: Type<T>) {}

  withMocks(mocks: MockDefinition[]): ServiceTestBuilder<T> {
    this.mocks = [...this.mocks, ...mocks];
    return this;
  }

  withRealDependencies(deps: Type<any>[]): ServiceTestBuilder<T> {
    this.realDeps = [...this.realDeps, ...deps];
    return this;
  }

  withMock(provide: string | symbol | Type<any>, mock: any): ServiceTestBuilder<T> {
    this.mocks.push({ provide, useValue: mock });
    return this;
  }

  withFactory(provide: string | symbol | Type<any>, factory: (...args: any[]) => any, inject?: any[]): ServiceTestBuilder<T> {
    this.mocks.push({ provide, useFactory: factory, inject });
    return this;
  }

  async build(): Promise<{ service: T; module: ExtendedTestingModule; mocks: Map<any, any> }> {
    // Convert mock definitions to proper providers
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
        ...this.realDeps,
        ...mockProviders
      ]
    });

    const module = await moduleBuilder.compile() as ExtendedTestingModule;
    const service = module.get<T>(this.serviceClass);
    
    // Create a map of mocks for easy access in tests
    const mockMap = new Map();
    this.mocks.forEach(mock => {
      mockMap.set(mock.provide, module.get(mock.provide));
    });

    return { service, module, mocks: mockMap };
  }
}

class ControllerTestBuilderImpl<T> implements ControllerTestBuilder<T> {
  private mocks: MockDefinition[] = [];
  private realDeps: Type<any>[] = [];

  constructor(private controllerClass: Type<T>) {}

  withMocks(mocks: MockDefinition[]): ControllerTestBuilder<T> {
    this.mocks = [...this.mocks, ...mocks];
    return this;
  }

  withRealDependencies(deps: Type<any>[]): ControllerTestBuilder<T> {
    this.realDeps = [...this.realDeps, ...deps];
    return this;
  }

  withMock(provide: string | symbol | Type<any>, mock: any): ControllerTestBuilder<T> {
    this.mocks.push({ provide, useValue: mock });
    return this;
  }

  withFactory(provide: string | symbol | Type<any>, factory: (...args: any[]) => any, inject?: any[]): ControllerTestBuilder<T> {
    this.mocks.push({ provide, useFactory: factory, inject });
    return this;
  }

  async build(): Promise<{ controller: T; module: ExtendedTestingModule; mocks: Map<any, any> }> {
    // Convert mock definitions to proper providers
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
      controllers: [this.controllerClass],
      providers: [
        ...this.realDeps,
        ...mockProviders
      ]
    });

    const module = await moduleBuilder.compile() as ExtendedTestingModule;
    const controller = module.get<T>(this.controllerClass);
    
    // Create a map of mocks for easy access in tests
    const mockMap = new Map();
    this.mocks.forEach(mock => {
      mockMap.set(mock.provide, module.get(mock.provide));
    });

    return { controller, module, mocks: mockMap };
  }
}

class ModuleTestBuilderImpl implements ModuleTestBuilder {
  private mocks: MockDefinition[] = [];
  private excludedProviders: string[] = [];

  constructor(private moduleClass: Type<any>) {}

  withMocks(mocks: MockDefinition[]): ModuleTestBuilder {
    this.mocks = [...this.mocks, ...mocks];
    return this;
  }

  excludeGlobalProviders(providers: string[]): ModuleTestBuilder {
    this.excludedProviders = [...this.excludedProviders, ...providers];
    return this;
  }

  withMock(provide: string | symbol | Type<any>, mock: any): ModuleTestBuilder {
    this.mocks.push({ provide, useValue: mock });
    return this;
  }

  withFactory(provide: string | symbol | Type<any>, factory: (...args: any[]) => any, inject?: any[]): ModuleTestBuilder {
    this.mocks.push({ provide, useFactory: factory, inject });
    return this;
  }

  async build(): Promise<TestingModule> {
    const moduleBuilder = Test.createTestingModule({
      imports: [this.moduleClass]
    });

    // Override providers with mocks
    this.mocks.forEach(mock => {
      if (mock.useFactory) {
        moduleBuilder.overrideProvider(mock.provide).useFactory({
          factory: mock.useFactory,
          inject: mock.inject || []
        });
      } else if (mock.useClass) {
        moduleBuilder.overrideProvider(mock.provide).useClass(mock.useClass);
      } else {
        moduleBuilder.overrideProvider(mock.provide).useValue(mock.useValue);
      }
    });

    // Note: NestJS doesn't provide a direct way to exclude global providers
    // This would need to be handled at the module level during import
    // For now, we document this limitation and suggest module-level configuration

    const module = await moduleBuilder.compile();
    
    // Disable global providers if possible (this is a workaround)
    if (this.excludedProviders.length > 0) {
      console.warn(`Global provider exclusion requested for: ${this.excludedProviders.join(', ')}. This should be handled at module configuration level.`);
    }

    return module;
  }
}

/**
 * Utility functions for common mock scenarios
 */
export class TestModuleUtils {
  /**
   * Create a mock logger that can be used in tests
   */
  static createMockLogger(): any {
    // Dynamic mock framework detection
    let mockFn: any;
    try {
      mockFn = require('vitest').vi.fn;
    } catch {
      try {
        mockFn = require('@jest/globals').jest.fn;
      } catch {
        // Fallback mock implementation
        mockFn = () => () => {};
      }
    }

    return {
      log: mockFn(),
      error: mockFn(),
      warn: mockFn(),
      debug: mockFn(),
      verbose: mockFn(),
    };
  }

  /**
   * Create a mock repository with common CRUD methods
   */
  static createMockRepository<T>(): any {
    // Dynamic mock framework detection
    let mockFn: any;
    try {
      mockFn = require('vitest').vi.fn;
    } catch {
      try {
        mockFn = require('@jest/globals').jest.fn;
      } catch {
        // Fallback mock implementation
        mockFn = () => () => {};
      }
    }

    return {
      find: mockFn(),
      findOne: mockFn(),
      findById: mockFn(),
      create: mockFn(),
      update: mockFn(),
      delete: mockFn(),
      save: mockFn(),
      remove: mockFn(),
      count: mockFn(),
      exists: mockFn(),
    };
  }

  /**
   * Create a mock service with common methods
   */
  static createMockService(methods: string[]): any {
    // Dynamic mock framework detection
    let mockFn: any;
    try {
      mockFn = require('vitest').vi.fn;
    } catch {
      try {
        mockFn = require('@jest/globals').jest.fn;
      } catch {
        // Fallback mock implementation
        mockFn = () => () => {};
      }
    }

    const mock: any = {};
    methods.forEach(method => {
      mock[method] = mockFn();
    });
    return mock;
  }

  /**
   * Validate that all required dependencies are mocked
   */
  static validateMocks(mocks: MockDefinition[], requiredProviders: (string | symbol | Type<any>)[]): void {
    const providedTokens = new Set(mocks.map(mock => mock.provide));
    const missing = requiredProviders.filter(provider => !providedTokens.has(provider));
    
    if (missing.length > 0) {
      throw new Error(`Missing mock providers: ${missing.map(p => p.toString()).join(', ')}`);
    }
  }
}

export class TestModuleBuilder {
  static forService<T>(serviceClass: Type<T>): ServiceTestBuilder<T> {
    return new ServiceTestBuilderImpl(serviceClass);
  }

  static forController<T>(controllerClass: Type<T>): ControllerTestBuilder<T> {
    return new ControllerTestBuilderImpl(controllerClass);
  }

  static forModule(moduleClass: Type<any>): ModuleTestBuilder {
    return new ModuleTestBuilderImpl(moduleClass);
  }

  /**
   * Create a minimal service test with common mocks
   */
  static createMinimalServiceTest<T>(
    serviceClass: Type<T>,
    dependencies: { provide: string | symbol | Type<any>; mock: any }[]
  ): Promise<{ service: T; module: TestingModule; mocks: Map<any, any> }> {
    const builder = this.forService(serviceClass);
    
    dependencies.forEach(dep => {
      builder.withMock(dep.provide, dep.mock);
    });

    return builder.build();
  }

  /**
   * Create a minimal controller test with common mocks
   */
  static createMinimalControllerTest<T>(
    controllerClass: Type<T>,
    dependencies: { provide: string | symbol | Type<any>; mock: any }[]
  ): Promise<{ controller: T; module: TestingModule; mocks: Map<any, any> }> {
    const builder = this.forController(controllerClass);
    
    dependencies.forEach(dep => {
      builder.withMock(dep.provide, dep.mock);
    });

    return builder.build();
  }
}