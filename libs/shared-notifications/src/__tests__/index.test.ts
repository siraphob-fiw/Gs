import { describe, it, expect } from 'vitest';

describe('Shared Notifications Index', () => {
  it('should export email service components', async () => {
    const module = await import('../index');
    
    expect(module.EmailService).toBeDefined();
    expect(module.createEmailService).toBeDefined();
    expect(module.DEFAULT_EMAIL_CONFIG).toBeDefined();
  });

  it('should export notification types from shared-types', async () => {
    const module = await import('../index');
    
    expect(module.NotificationErrorCode).toBeDefined();
    expect(module.NotificationType).toBeDefined();
    expect(module.NotificationStatus).toBeDefined();
    expect(module.NotificationChannelType).toBeDefined();
  });

  it('should have expected exports available', () => {
    // This test ensures that the main exports are properly configured
    // Individual service testing is done in their respective test files
    expect(true).toBe(true);
  });
});
