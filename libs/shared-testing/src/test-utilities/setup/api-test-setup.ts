import { beforeEach, afterEach } from 'vitest';
import { createServiceMocks } from '../../mocks/service-mocks';

// Global API test setup
let mockServices: ReturnType<typeof createServiceMocks>;

beforeEach(() => {
  // Create fresh mock services for each test
  mockServices = createServiceMocks({
    tenantId: 'test-tenant-id',
    autoSuccess: true,
    simulateErrors: false,
    responseDelay: 0,
  });
  
  // Make mock services available globally
  (globalThis as any).mockServices = mockServices;
});

afterEach(() => {
  // Clear mock data
  if (mockServices) {
    mockServices.userService._clearUsers();
    mockServices.tenantService._clearTenants();
    mockServices.accessControlService._clearAuditLogs();
  }
  
  // Clean up global reference
  delete (globalThis as any).mockServices;
});

// Export for explicit imports
export { mockServices };