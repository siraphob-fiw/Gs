# Test Troubleshooting Guide

This guide provides comprehensive troubleshooting information for common testing issues and debugging techniques.

## Quick Reference

### Common Error Categories

| Category | Description | Severity | Common Causes |
|----------|-------------|----------|---------------|
| **Setup** | Test environment setup failures | Critical | Missing dependencies, configuration issues |
| **Timeout** | Tests exceeding time limits | High | Slow operations, infinite loops, blocking code |
| **Memory** | Memory-related issues | High | Memory leaks, large data sets, resource cleanup |
| **Assertion** | Test assertion failures | Medium | Logic errors, incorrect expectations |
| **Mock** | Mock-related failures | Medium | Incorrect mock setup, expectation mismatches |
| **Async** | Asynchronous operation issues | Medium | Promise handling, race conditions |
| **Dependency** | Module/import issues | Low | Missing packages, path errors |
| **Configuration** | Test configuration problems | Critical | Invalid config, environment issues |

### Quick Debugging Commands

```bash
# Enable verbose debugging
DEBUG_VERBOSE=true npm test

# Run specific test with debug output
npm test -- --testNamePattern="specific test" --verbose

# Run tests with memory debugging
node --inspect-brk node_modules/.bin/jest --runInBand

# Run tests with performance monitoring
PERFORMANCE_MONITORING=true npm test

# Generate debug reports
npm test -- --outputFile=debug-report.json
```

## Detailed Troubleshooting

### 1. Setup Errors

**Symptoms:**
- Tests fail to start
- "Module not found" errors
- Configuration errors

**Common Solutions:**

1. **Check Dependencies**
   ```bash
   npm install
   npm audit fix
   ```

2. **Verify Configuration**
   ```bash
   # Check Jest configuration
   npx jest --showConfig
   
   # Validate TypeScript configuration
   npx tsc --noEmit
   ```

3. **Environment Variables**
   ```bash
   # Check required environment variables
   echo $NODE_ENV
   echo $TEST_TIMEOUT
   ```

4. **Path Resolution**
   ```javascript
   // Verify import paths in tests
   import { TestModule } from '@strengthos/shared-testing';
   ```

### 2. Timeout Errors

**Symptoms:**
- Tests hang indefinitely
- "Timeout exceeded" errors
- Slow test execution

**Common Solutions:**

1. **Increase Timeout**
   ```javascript
   // In test file
   jest.setTimeout(60000); // 60 seconds
   
   // Or in specific test
   test('slow test', async () => {
     // test code
   }, 60000);
   ```

2. **Check for Infinite Loops**
   ```javascript
   // Bad: Infinite loop
   while (true) {
     // code
   }
   
   // Good: Proper condition
   while (condition && attempts < maxAttempts) {
     // code
     attempts++;
   }
   ```

3. **Async/Await Issues**
   ```javascript
   // Bad: Missing await
   test('async test', () => {
     asyncFunction(); // Not awaited
   });
   
   // Good: Proper async handling
   test('async test', async () => {
     await asyncFunction();
   });
   ```

4. **Mock Slow Dependencies**
   ```javascript
   // Mock slow external services
   jest.mock('./slowService', () => ({
     slowOperation: jest.fn().mockResolvedValue('fast result'),
   }));
   ```

### 3. Memory Issues

**Symptoms:**
- "Out of memory" errors
- Gradually increasing memory usage
- Tests becoming slower over time

**Common Solutions:**

1. **Check for Memory Leaks**
   ```javascript
   // Proper cleanup in afterEach
   afterEach(() => {
     // Clear timers
     jest.clearAllTimers();
     
     // Clear mocks
     jest.clearAllMocks();
     
     // Cleanup resources
     cleanup();
   });
   ```

2. **Use Smaller Test Data**
   ```javascript
   // Bad: Large test data
   const largeArray = new Array(1000000).fill('data');
   
   // Good: Minimal test data
   const testData = ['item1', 'item2', 'item3'];
   ```

3. **Detect Open Handles**
   ```bash
   # Run with open handle detection
   npx jest --detectOpenHandles
   ```

4. **Monitor Memory Usage**
   ```javascript
   // Use memory monitoring wrapper
   const monitoredTest = TestDebuggingUtils.withPerformanceMonitoring(
     testFunction,
     { maxMemoryIncrease: 50 * 1024 * 1024 } // 50MB
   );
   ```

### 4. Assertion Errors

**Symptoms:**
- "Expected X but received Y" errors
- Unexpected test failures
- Inconsistent test results

**Common Solutions:**

1. **Use Appropriate Matchers**
   ```javascript
   // Bad: Using toBe for objects
   expect(object).toBe(expectedObject);
   
   // Good: Using toEqual for objects
   expect(object).toEqual(expectedObject);
   
   // Good: Using toBe for primitives
   expect(string).toBe('expected');
   ```

2. **Debug Actual Values**
   ```javascript
   // Add debugging output
   console.log('Actual value:', actualValue);
   console.log('Expected value:', expectedValue);
   
   // Or use enhanced expectations
   TestDebuggingUtils.expectWithContext(actualValue, {
     testName: 'current test',
   }).toEqual(expectedValue);
   ```

3. **Check Data Types**
   ```javascript
   // Ensure types match
   expect(typeof actualValue).toBe(typeof expectedValue);
   
   // Convert if necessary
   expect(Number(stringValue)).toBe(expectedNumber);
   ```

### 5. Mock Issues

**Symptoms:**
- "Mock function not called" errors
- Incorrect mock return values
- Mock state persisting between tests

**Common Solutions:**

1. **Proper Mock Setup**
   ```javascript
   // Clear mocks between tests
   beforeEach(() => {
     jest.clearAllMocks();
   });
   
   // Or use automatic clearing
   jest.clearAllMocks();
   ```

2. **Verify Mock Calls**
   ```javascript
   // Check if mock was called
   expect(mockFunction).toHaveBeenCalled();
   
   // Check call count
   expect(mockFunction).toHaveBeenCalledTimes(1);
   
   // Check call arguments
   expect(mockFunction).toHaveBeenCalledWith(expectedArg);
   ```

3. **Debug Mock State**
   ```javascript
   // Use debug wrapper for mocks
   const debugMock = TestDebuggingUtils.debugMock(mockFunction, 'myMock');
   
   // Check mock calls
   console.log('Mock calls:', mockFunction.mock.calls);
   ```

4. **Handle Mock Failures**
   ```javascript
   // Use enhanced mock failure handling
   globalTestErrorHandler.handleMockFailure({
     mockName: 'userService',
     method: 'getUser',
     expectedCalls: 1,
     actualCalls: 0,
     expectedArgs: [123],
     actualArgs: [],
     suggestions: ['Check if the method is called in the test'],
   });
   ```

### 6. Async Issues

**Symptoms:**
- Race conditions
- Unhandled promise rejections
- Inconsistent async test results

**Common Solutions:**

1. **Proper Promise Handling**
   ```javascript
   // Bad: Not returning promise
   test('async test', () => {
     asyncFunction().then(result => {
       expect(result).toBe('expected');
     });
   });
   
   // Good: Return promise
   test('async test', () => {
     return asyncFunction().then(result => {
       expect(result).toBe('expected');
     });
   });
   
   // Better: Use async/await
   test('async test', async () => {
     const result = await asyncFunction();
     expect(result).toBe('expected');
   });
   ```

2. **Handle Promise Rejections**
   ```javascript
   // Test for expected rejections
   test('should reject', async () => {
     await expect(failingFunction()).rejects.toThrow('Expected error');
   });
   
   // Handle unexpected rejections
   process.on('unhandledRejection', (reason, promise) => {
     console.error('Unhandled Rejection at:', promise, 'reason:', reason);
   });
   ```

3. **Use waitFor for Async Assertions**
   ```javascript
   import { waitFor } from '@testing-library/react';
   
   test('async assertion', async () => {
     triggerAsyncOperation();
     
     await waitFor(() => {
       expect(screen.getByText('Updated')).toBeInTheDocument();
     });
   });
   ```

## Debugging Techniques

### 1. Enable Debug Mode

```javascript
// Wrap test with debugging
const debugTest = TestDebuggingUtils.withDebug('test name', 'unit', async (debug) => {
  debug.log('info', 'Starting test');
  debug.setVariable('testData', data);
  
  // Test logic here
  
  debug.log('info', 'Test completed');
});
```

### 2. Performance Monitoring

```javascript
// Monitor test performance
const performanceTest = TestDebuggingUtils.withPerformanceMonitoring(
  testFunction,
  {
    maxDuration: 5000, // 5 seconds
    maxMemoryIncrease: 10 * 1024 * 1024, // 10MB
  }
);
```

### 3. Enhanced Error Context

```javascript
// Use enhanced expectations with context
TestDebuggingUtils.expectWithContext(actualValue, {
  testName: 'user creation test',
  testFile: 'user.test.ts',
  category: 'integration',
}).toEqual(expectedValue);
```

### 4. Debug Output Analysis

```bash
# Generate debug reports
npm test -- --outputFile=debug-report.json

# View error statistics
node -e "
const report = require('./debug-report.json');
console.log('Error Summary:', report.summary);
console.log('Most Common Errors:', report.mostCommonErrors);
"
```

## Environment-Specific Issues

### Local Development

**Common Issues:**
- Different Node.js versions
- Missing environment variables
- Local configuration conflicts

**Solutions:**
```bash
# Use consistent Node.js version
nvm use 18

# Set required environment variables
export NODE_ENV=test
export TEST_TIMEOUT=30000

# Clear local caches
npm run clean
rm -rf node_modules package-lock.json
npm install
```

### CI/CD Environment

**Common Issues:**
- Resource limitations
- Different environment setup
- Timing-sensitive tests

**Solutions:**
```bash
# Increase timeouts for CI
export TEST_TIMEOUT=60000

# Use fewer workers
npm test -- --maxWorkers=2

# Enable CI-specific configuration
export CI=true
```

### Docker Environment

**Common Issues:**
- Limited resources
- Network connectivity
- File system differences

**Solutions:**
```dockerfile
# Increase memory limit
docker run --memory=2g --memory-swap=2g

# Set appropriate timeouts
ENV TEST_TIMEOUT=120000

# Use single worker
ENV JEST_MAX_WORKERS=1
```

## Performance Optimization

### 1. Test Execution Speed

```javascript
// Use test.concurrent for independent tests
test.concurrent('parallel test 1', async () => {
  // Test logic
});

test.concurrent('parallel test 2', async () => {
  // Test logic
});
```

### 2. Mock Optimization

```javascript
// Use lightweight mocks
jest.mock('./heavyModule', () => ({
  heavyFunction: jest.fn().mockReturnValue('light result'),
}));

// Avoid deep mocking
jest.mock('./module', () => ({
  __esModule: true,
  default: jest.fn(),
  namedExport: jest.fn(),
}));
```

### 3. Test Data Management

```javascript
// Use factories for consistent test data
const userFactory = {
  create: (overrides = {}) => ({
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    ...overrides,
  }),
};

// Reuse test data
const testUser = userFactory.create();
```

## Getting Help

### 1. Error Reports

Check the generated error reports in `./test-debug-output/` for detailed debugging information.

### 2. Debug Sessions

Review debug session files for step-by-step execution traces.

### 3. Performance Metrics

Analyze performance metrics to identify slow tests and memory issues.

### 4. Community Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library Guides](https://testing-library.com/docs/)
- [Node.js Debugging Guide](https://nodejs.org/en/docs/guides/debugging-getting-started/)

### 5. Internal Resources

- Check the shared-testing library documentation
- Review existing test examples in the codebase
- Consult with the development team for project-specific issues

## Preventive Measures

### 1. Test Best Practices

- Write focused, single-purpose tests
- Use descriptive test names
- Keep tests independent and isolated
- Clean up resources properly

### 2. Code Quality

- Use TypeScript for better error detection
- Implement proper error handling
- Follow consistent coding patterns
- Use linting and formatting tools

### 3. Monitoring

- Set up performance monitoring
- Track test execution metrics
- Monitor memory usage trends
- Review error patterns regularly

### 4. Documentation

- Document complex test scenarios
- Maintain troubleshooting knowledge base
- Share debugging techniques with team
- Update guides based on new issues