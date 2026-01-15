import { Injectable, Controller, Get, Module, Inject } from '@nestjs/common';
import { vi } from 'vitest';
import { TestModuleBuilder, TestModuleUtils } from '../builders/test-module-builder';

// Test fixtures
interface IRepository {
  findOne(query: any): Promise<any>;
  save(entity: any): Promise<any>;
}

@Injectable()
class TestService {
  constructor(@Inject('IRepository') private repository: IRepository) {}

  async findUser(id: string) {
    return this.repository.findOne({ id });
  }

  async saveUser(user: any) {
    return this.repository.save(user);
  }
}

@Controller('test')
class TestController {
  constructor(private service: TestService) {}

  @Get()
  getTest() {
    return this.service.findUser('1');
  }
}

@Module({
  providers: [TestService],
  controllers: [TestController],
})
class TestModule {}

describe('TestModuleBuilder', () => {
  describe('basic functionality', () => {
    it('should create service builder', () => {
      const builder = TestModuleBuilder.forService(TestService);
      expect(builder).toBeDefined();
      expect(typeof builder.withMocks).toBe('function');
      expect(typeof builder.withMock).toBe('function');
      expect(typeof builder.build).toBe('function');
    });

    it('should create controller builder', () => {
      const builder = TestModuleBuilder.forController(TestController);
      expect(builder).toBeDefined();
      expect(typeof builder.withMocks).toBe('function');
      expect(typeof builder.withMock).toBe('function');
      expect(typeof builder.build).toBe('function');
    });

    it('should create module builder', () => {
      const builder = TestModuleBuilder.forModule(TestModule);
      expect(builder).toBeDefined();
      expect(typeof builder.withMocks).toBe('function');
      expect(typeof builder.withMock).toBe('function');
      expect(typeof builder.build).toBe('function');
    });
  });

  describe('service testing', () => {
    it('should create a service test with mocked dependencies', async () => {
      const mockRepository = {
        findOne: vi.fn().mockResolvedValue({ id: '1', name: 'Test User' }),
        save: vi.fn().mockResolvedValue({ id: '1', name: 'Test User' }),
      };

      const { service, module, mocks } = await TestModuleBuilder
        .forService(TestService)
        .withMock('IRepository', mockRepository)
        .build();

      expect(service).toBeInstanceOf(TestService);
      expect(mocks.get('IRepository')).toBe(mockRepository);

      // Test that the service uses the mock
      const result = await service.findUser('1');
      expect(mockRepository.findOne).toHaveBeenCalledWith({ id: '1' });
      expect(result).toEqual({ id: '1', name: 'Test User' });

      await module.close();
    });
  });

  describe('utility methods', () => {
    it('should validate mocks correctly', () => {
      const mocks = [
        { provide: 'PROVIDER_A', useValue: {} },
        { provide: 'PROVIDER_B', useValue: {} },
      ];
      const required = ['PROVIDER_A', 'PROVIDER_B'];

      expect(() => {
        TestModuleUtils.validateMocks(mocks, required);
      }).not.toThrow();
    });

    it('should throw when required providers are missing', () => {
      const mocks = [
        { provide: 'PROVIDER_A', useValue: {} },
      ];
      const required = ['PROVIDER_A', 'PROVIDER_B', 'PROVIDER_C'];

      expect(() => {
        TestModuleUtils.validateMocks(mocks, required);
      }).toThrow('Missing mock providers: PROVIDER_B, PROVIDER_C');
    });
  });
});

describe('TestModuleUtils', () => {
  describe('createMockLogger', () => {
    it('should create a mock logger with all methods', () => {
      const logger = TestModuleUtils.createMockLogger();

      expect(logger.log).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.debug).toBeDefined();
      expect(logger.verbose).toBeDefined();

      // Test that methods can be called
      logger.log('test message');
      expect(typeof logger.log).toBe('function');
    });
  });

  describe('createMockRepository', () => {
    it('should create a mock repository with CRUD methods', () => {
      const repository = TestModuleUtils.createMockRepository();

      expect(repository.find).toBeDefined();
      expect(repository.findOne).toBeDefined();
      expect(repository.findById).toBeDefined();
      expect(repository.create).toBeDefined();
      expect(repository.update).toBeDefined();
      expect(repository.delete).toBeDefined();
      expect(repository.save).toBeDefined();
      expect(repository.remove).toBeDefined();
      expect(repository.count).toBeDefined();
      expect(repository.exists).toBeDefined();

      // Test that methods can be called
      repository.findOne({ id: '1' });
      expect(typeof repository.findOne).toBe('function');
    });
  });

  describe('createMockService', () => {
    it('should create a mock service with specified methods', () => {
      const service = TestModuleUtils.createMockService(['method1', 'method2', 'method3']);

      expect(service.method1).toBeDefined();
      expect(service.method2).toBeDefined();
      expect(service.method3).toBeDefined();

      // Test that methods can be called
      service.method1('arg1', 'arg2');
      expect(typeof service.method1).toBe('function');
    });
  });
});