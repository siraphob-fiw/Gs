import { ValidationService } from '@strengthos/sos-web-api/src/validation/services/validation.service';
import { TestModuleBuilder } from '../utils/test-module-builder';
import { Results } from '@strengthos/shared-utils';
import { IValidationService } from '@strengthos/shared-validation';
import Joi from 'joi';
import { z } from 'zod';

describe('ValidationService', () => {
  let service: ValidationService;
  let mockSharedValidationService: jest.Mocked<IValidationService>;

  beforeEach(async () => {
    // Create mock for shared validation service
    mockSharedValidationService = {
      validateWithJoi: jest.fn(),
      validateUserCreation: jest.fn(),
      validateUserUpdate: jest.fn(),
      validateLogin: jest.fn(),
      validateTenantCreation: jest.fn(),
      validatePagination: jest.fn(),
      validateWithZod: jest.fn(),
      validateEmail: jest.fn(),
      validateUsername: jest.fn(),
      validatePassword: jest.fn(),
      validatePhone: jest.fn(),
      validateUUID: jest.fn(),
      sanitizeString: jest.fn(),
      sanitizeEmail: jest.fn(),
      sanitizeHtml: jest.fn(),
      isValidDateRange: jest.fn(),
      isValidAge: jest.fn(),
      isStrongPassword: jest.fn(),
      validateBatch: jest.fn(),
    };

    const { service: testService } = await TestModuleBuilder
      .forService(ValidationService)
      .build();

    service = testService;

    // Mock the private sharedValidationService property
    (service as any).sharedValidationService = mockSharedValidationService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Joi validation methods', () => {
    it('should validate with Joi schema successfully', async () => {
      const schema = Joi.object({ name: Joi.string().required() });
      const data = { name: 'test' };
      const expectedResult = Results.ok(data);

      mockSharedValidationService.validateWithJoi.mockResolvedValue(expectedResult);

      const result = await service.validateWithJoi(schema, data);

      expect(mockSharedValidationService.validateWithJoi).toHaveBeenCalledWith(schema, data);
      expect(result).toBe(expectedResult);
    });

    it('should handle Joi validation errors', async () => {
      const schema = Joi.object({ name: Joi.string().required() });
      const data = { name: '' };
      const expectedResult = Results.validationError(null, 'Name is required');

      mockSharedValidationService.validateWithJoi.mockResolvedValue(expectedResult);

      const result = await service.validateWithJoi(schema, data);

      expect(mockSharedValidationService.validateWithJoi).toHaveBeenCalledWith(schema, data);
      expect(result).toBe(expectedResult);
    });

    it('should validate user creation data', async () => {
      const userData = { email: 'test@example.com', password: 'password123' };
      const expectedResult = Results.ok(userData);

      mockSharedValidationService.validateUserCreation.mockResolvedValue(expectedResult);

      const result = await service.validateUserCreation(userData);

      expect(mockSharedValidationService.validateUserCreation).toHaveBeenCalledWith(userData);
      expect(result).toBe(expectedResult);
    });

    it('should validate user update data', async () => {
      const updateData = { firstName: 'John', lastName: 'Doe' };
      const expectedResult = Results.ok(updateData);

      mockSharedValidationService.validateUserUpdate.mockResolvedValue(expectedResult);

      const result = await service.validateUserUpdate(updateData);

      expect(mockSharedValidationService.validateUserUpdate).toHaveBeenCalledWith(updateData);
      expect(result).toBe(expectedResult);
    });

    it('should validate login data', async () => {
      const loginData = { email: 'test@example.com', password: 'password123' };
      const expectedResult = Results.ok(loginData);

      mockSharedValidationService.validateLogin.mockResolvedValue(expectedResult);

      const result = await service.validateLogin(loginData);

      expect(mockSharedValidationService.validateLogin).toHaveBeenCalledWith(loginData);
      expect(result).toBe(expectedResult);
    });

    it('should validate tenant creation data', async () => {
      const tenantData = { name: 'Test Tenant', domain: 'test.example.com' };
      const expectedResult = Results.ok(tenantData);

      mockSharedValidationService.validateTenantCreation.mockResolvedValue(expectedResult);

      const result = await service.validateTenantCreation(tenantData);

      expect(mockSharedValidationService.validateTenantCreation).toHaveBeenCalledWith(tenantData);
      expect(result).toBe(expectedResult);
    });

    it('should validate pagination data', async () => {
      const paginationData = { page: 1, limit: 10 };
      const expectedResult = Results.ok(paginationData);

      mockSharedValidationService.validatePagination.mockResolvedValue(expectedResult);

      const result = await service.validatePagination(paginationData);

      expect(mockSharedValidationService.validatePagination).toHaveBeenCalledWith(paginationData);
      expect(result).toBe(expectedResult);
    });
  });

  describe('Zod validation methods', () => {
    it('should validate with Zod schema successfully', async () => {
      const schema = z.object({ name: z.string() });
      const data = { name: 'test' };
      const expectedResult = Results.ok(data);

      mockSharedValidationService.validateWithZod.mockResolvedValue(expectedResult);

      const result = await service.validateWithZod(schema, data);

      expect(mockSharedValidationService.validateWithZod).toHaveBeenCalledWith(schema, data);
      expect(result).toBe(expectedResult);
    });

    it('should handle Zod validation errors', async () => {
      const schema = z.object({ name: z.string() });
      const data = { name: 123 };
      const expectedResult = Results.validationError(null, 'Name must be a string');

      mockSharedValidationService.validateWithZod.mockResolvedValue(expectedResult);

      const result = await service.validateWithZod(schema, data);

      expect(mockSharedValidationService.validateWithZod).toHaveBeenCalledWith(schema, data);
      expect(result).toBe(expectedResult);
    });
  });

  describe('Individual field validation', () => {
    it('should validate email addresses', () => {
      const email = 'test@example.com';
      const expectedResult = { isValid: true, value: email, errors: [] };

      mockSharedValidationService.validateEmail.mockReturnValue(expectedResult);

      const result = service.validateEmail(email);

      expect(mockSharedValidationService.validateEmail).toHaveBeenCalledWith(email);
      expect(result).toBe(expectedResult);
    });

    it('should validate usernames', () => {
      const username = 'testuser';
      const expectedResult = { isValid: true, value: username, errors: [] };

      mockSharedValidationService.validateUsername.mockReturnValue(expectedResult);

      const result = service.validateUsername(username);

      expect(mockSharedValidationService.validateUsername).toHaveBeenCalledWith(username);
      expect(result).toBe(expectedResult);
    });

    it('should validate passwords', () => {
      const password = 'SecurePassword123!';
      const expectedResult = { isValid: true, value: password, errors: [] };

      mockSharedValidationService.validatePassword.mockReturnValue(expectedResult);

      const result = service.validatePassword(password);

      expect(mockSharedValidationService.validatePassword).toHaveBeenCalledWith(password);
      expect(result).toBe(expectedResult);
    });

    it('should validate phone numbers', () => {
      const phone = '+1234567890';
      const expectedResult = { isValid: true, value: phone, errors: [] };

      mockSharedValidationService.validatePhone.mockReturnValue(expectedResult);

      const result = service.validatePhone(phone);

      expect(mockSharedValidationService.validatePhone).toHaveBeenCalledWith(phone);
      expect(result).toBe(expectedResult);
    });

    it('should validate UUIDs', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const expectedResult = { isValid: true, value: uuid, errors: [] };

      mockSharedValidationService.validateUUID.mockReturnValue(expectedResult);

      const result = service.validateUUID(uuid);

      expect(mockSharedValidationService.validateUUID).toHaveBeenCalledWith(uuid);
      expect(result).toBe(expectedResult);
    });
  });

  describe('Sanitization methods', () => {
    it('should sanitize strings', () => {
      const input = '<script>alert("xss")</script>Hello';
      const options = { removeHtml: true };
      const expectedResult = 'Hello';

      mockSharedValidationService.sanitizeString.mockReturnValue(expectedResult);

      const result = service.sanitizeString(input, options);

      expect(mockSharedValidationService.sanitizeString).toHaveBeenCalledWith(input, options);
      expect(result).toBe(expectedResult);
    });

    it('should sanitize email addresses', () => {
      const email = '  TEST@EXAMPLE.COM  ';
      const expectedResult = 'test@example.com';

      mockSharedValidationService.sanitizeEmail.mockReturnValue(expectedResult);

      const result = service.sanitizeEmail(email);

      expect(mockSharedValidationService.sanitizeEmail).toHaveBeenCalledWith(email);
      expect(result).toBe(expectedResult);
    });

    it('should sanitize HTML content', () => {
      const html = '<script>alert("xss")</script><p>Safe content</p>';
      const expectedResult = '<p>Safe content</p>';

      mockSharedValidationService.sanitizeHtml.mockReturnValue(expectedResult);

      const result = service.sanitizeHtml(html);

      expect(mockSharedValidationService.sanitizeHtml).toHaveBeenCalledWith(html);
      expect(result).toBe(expectedResult);
    });
  });

  describe('Custom validation helpers', () => {
    it('should validate date ranges', () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');

      mockSharedValidationService.isValidDateRange.mockReturnValue(true);

      const result = service.isValidDateRange(startDate, endDate);

      expect(mockSharedValidationService.isValidDateRange).toHaveBeenCalledWith(startDate, endDate);
      expect(result).toBe(true);
    });

    it('should validate age ranges', () => {
      const dateOfBirth = new Date('1990-01-01');
      const minAge = 18;
      const maxAge = 65;

      mockSharedValidationService.isValidAge.mockReturnValue(true);

      const result = service.isValidAge(dateOfBirth, minAge, maxAge);

      expect(mockSharedValidationService.isValidAge).toHaveBeenCalledWith(dateOfBirth, minAge, maxAge);
      expect(result).toBe(true);
    });

    it('should validate password strength', () => {
      const password = 'StrongPassword123!';

      mockSharedValidationService.isStrongPassword.mockReturnValue(true);

      const result = service.isStrongPassword(password);

      expect(mockSharedValidationService.isStrongPassword).toHaveBeenCalledWith(password);
      expect(result).toBe(true);
    });
  });

  describe('Batch validation', () => {
    it('should validate multiple items in batch', async () => {
      const validations = [
        { data: { name: 'test1' }, validator: jest.fn() },
        { data: { name: 'test2' }, validator: jest.fn() }
      ];
      const expectedResult = Results.ok([{ name: 'test1' }, { name: 'test2' }]);

      mockSharedValidationService.validateBatch.mockResolvedValue(expectedResult);

      const result = await service.validateBatch(validations);

      expect(mockSharedValidationService.validateBatch).toHaveBeenCalledWith(validations);
      expect(result).toBe(expectedResult);
    });

    it('should handle batch validation errors', async () => {
      const validations = [
        { data: { name: '' }, validator: jest.fn() },
        { data: { name: 'test2' }, validator: jest.fn() }
      ];
      const expectedResult = Results.validationError(null, 'Batch validation failed');

      mockSharedValidationService.validateBatch.mockResolvedValue(expectedResult);

      const result = await service.validateBatch(validations);

      expect(mockSharedValidationService.validateBatch).toHaveBeenCalledWith(validations);
      expect(result).toBe(expectedResult);
    });
  });

  describe('NestJS-specific validation methods', () => {
    class TestDto {
      name: string;
      email: string;
    }

    it('should validate DTO successfully', async () => {
      const data = { name: 'test', email: 'test@example.com' };

      const result = await service.validateDto(TestDto, data);

      expect(result.isOk).toBe(true);
      expect(result.returnValue).toBeInstanceOf(TestDto);
      expect(result.returnValue?.name).toBe(data.name);
      expect(result.returnValue?.email).toBe(data.email);
    });

    it('should handle DTO validation errors', async () => {
      const data = null;

      const result = await service.validateDto(TestDto, data);

      expect(result.isOk).toBe(false);
      expect(result.message).toContain('DTO validation failed');
    });
  });

  describe('Business rules validation', () => {
    it('should validate business rules successfully', async () => {
      const data = { name: 'test', value: 100 };
      const rules = [
        jest.fn().mockResolvedValue({ isValid: true, value: data, errors: [] }),
        jest.fn().mockResolvedValue({ isValid: true, value: data, errors: [] })
      ];

      const result = await service.validateBusinessRules(data, rules);

      expect(result.isOk).toBe(true);
      expect(result.returnValue).toBe(data);
      expect(rules[0]).toHaveBeenCalledWith(data);
      expect(rules[1]).toHaveBeenCalledWith(data);
    });

    it('should handle business rule validation failures', async () => {
      const data = { name: 'test', value: -1 };
      const rules = [
        jest.fn().mockResolvedValue({ isValid: true, value: data, errors: [] }),
        jest.fn().mockResolvedValue({ 
          isValid: false, 
          value: data, 
          errors: [{ message: 'Value must be positive' }] 
        })
      ];

      const result = await service.validateBusinessRules(data, rules);

      expect(result.isOk).toBe(false);
      expect(result.message).toContain('Value must be positive');
      expect(rules[0]).toHaveBeenCalledWith(data);
      expect(rules[1]).toHaveBeenCalledWith(data);
    });

    it('should handle business rule validation exceptions', async () => {
      const data = { name: 'test', value: 100 };
      const rules = [
        jest.fn().mockRejectedValue(new Error('Rule execution failed'))
      ];

      const result = await service.validateBusinessRules(data, rules);

      expect(result.isOk).toBe(false);
      expect(result.message).toContain('Business rule validation error: Rule execution failed');
    });

    it('should handle business rules with no error messages', async () => {
      const data = { name: 'test', value: -1 };
      const rules = [
        jest.fn().mockResolvedValue({ 
          isValid: false, 
          value: data, 
          errors: [] 
        })
      ];

      const result = await service.validateBusinessRules(data, rules);

      expect(result.isOk).toBe(false);
      expect(result.message).toBe('Business rule validation failed');
    });
  });

  describe('Performance benchmarks', () => {
    it('should complete validation operations within acceptable time limits', async () => {
      const startTime = Date.now();
      
      // Test multiple validation operations
      const schema = Joi.object({ name: Joi.string().required() });
      const data = { name: 'test' };
      
      mockSharedValidationService.validateWithJoi.mockResolvedValue(Results.ok(data));
      mockSharedValidationService.validateEmail.mockReturnValue({ isValid: true, value: 'test@example.com', errors: [] });
      mockSharedValidationService.sanitizeString.mockReturnValue('clean string');

      await Promise.all([
        service.validateWithJoi(schema, data),
        service.validateWithJoi(schema, data),
        service.validateWithJoi(schema, data)
      ]);

      service.validateEmail('test@example.com');
      service.sanitizeString('<script>test</script>');

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Validation operations should complete quickly (under 100ms for this test)
      expect(executionTime).toBeLessThan(100);
    });
  });

  describe('Error handling patterns', () => {
    it('should provide consistent error handling across all validation methods', async () => {
      const errorMessage = 'Validation service error';
      mockSharedValidationService.validateWithJoi.mockRejectedValue(new Error(errorMessage));

      const schema = Joi.object({ name: Joi.string().required() });
      const data = { name: 'test' };

      await expect(service.validateWithJoi(schema, data)).rejects.toThrow(errorMessage);
    });

    it('should handle null and undefined inputs gracefully', async () => {
      mockSharedValidationService.validateWithJoi.mockResolvedValue(Results.validationError(null, 'Invalid input'));

      const schema = Joi.object({ name: Joi.string().required() });

      const result1 = await service.validateWithJoi(schema, null);
      const result2 = await service.validateWithJoi(schema, undefined);

      expect(result1.isOk).toBe(false);
      expect(result2.isOk).toBe(false);
    });
  });
});