import { describe, it, expect } from 'vitest';
import { Results } from '../results';

describe('Results', () => {
  describe('success cases', () => {
    it('should create ok result with value', () => {
      const result = Results.ok('test-value', 'success message');

      expect(result.isOk).toBe(true);
      expect(result.returnValue).toBe('test-value');
      expect(result.message).toBe('success message');
      expect(result.resultCode).toBe(Results.CODE_OK);
    });

    it('should create ok result without value', () => {
      const result = Results.ok();

      expect(result.isOk).toBe(true);
      expect(result.returnValue).toBe(null);
      expect(result.resultCode).toBe(Results.CODE_OK);
    });

    it('should create ok result with null value', () => {
      const result = Results.ok(null);

      expect(result.isOk).toBe(true);
      expect(result.returnValue).toBe(null);
    });
  });

  describe('error cases', () => {
    it('should create error result', () => {
      const result = Results.error('error-data', 'error message');

      expect(result.isOk).toBe(false);
      expect(result.returnValue).toBe('error-data');
      expect(result.message).toBe('error message');
      expect(result.resultCode).toBe(Results.CODE_ERROR);
    });

    it('should create fail result', () => {
      const result = Results.fail('fail-data', 'fail message');

      expect(result.isOk).toBe(false);
      expect(result.returnValue).toBe('fail-data');
      expect(result.message).toBe('fail message');
      expect(result.resultCode).toBe(Results.CODE_FAIL);
    });

    it('should create warning result', () => {
      const result = Results.warning('warning-data', 'warning message');

      expect(result.isOk).toBe(false);
      expect(result.returnValue).toBe('warning-data');
      expect(result.message).toBe('warning message');
      expect(result.resultCode).toBe(Results.CODE_WARNING);
    });

    it('should create invalid args result', () => {
      const result = Results.invalidArgs('invalid-data', 'invalid args message');

      expect(result.isOk).toBe(false);
      expect(result.returnValue).toBe('invalid-data');
      expect(result.message).toBe('invalid args message');
      expect(result.resultCode).toBe(Results.CODE_INVALID_ARGUMENT);
    });

    it('should create validation error result', () => {
      const result = Results.validationError('validation-data', 'validation error message');

      expect(result.isOk).toBe(false);
      expect(result.returnValue).toBe('validation-data');
      expect(result.message).toBe('validation error message');
      expect(result.resultCode).toBe(Results.CODE_VALIDATION_FAILED);
    });
  });

  describe('fluent interface', () => {
    it('should allow chaining with setReturnValue', () => {
      const result = Results.ok().setReturnValue('chained-value');

      expect(result.returnValue).toBe('chained-value');
    });

    it('should allow chaining with withResultCode', () => {
      const result = Results.ok().withResultCode(9999);

      expect(result.resultCode).toBe(9999);
    });
  });

  describe('constants', () => {
    it('should have correct result codes', () => {
      expect(Results.CODE_OK).toBe(0);
      expect(Results.CODE_ERROR).toBe(1001);
      expect(Results.CODE_FAIL).toBe(1002);
      expect(Results.CODE_WARNING).toBe(1003);
      expect(Results.CODE_INVALID_ARGUMENT).toBe(1004);
      expect(Results.CODE_VALIDATION_FAILED).toBe(1005);
      expect(Results.CODE_DATA_NOT_FOUND).toBe(1006);
    });
  });

  describe('type safety', () => {
    it('should maintain type safety with generics', () => {
      interface TestData {
        id: number;
        name: string;
      }

      const testData: TestData = { id: 1, name: 'test' };
      const result = Results.ok<TestData>(testData);

      expect(result.returnValue).toEqual(testData);
      expect(result.returnValue?.id).toBe(1);
      expect(result.returnValue?.name).toBe('test');
    });
  });
});
