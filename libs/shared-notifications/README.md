# @strengthos/shared-notifications

Comprehensive notification services for StrengthOS applications, providing email, SMS, push notifications, and real-time messaging capabilities.

## Features

### Core Notification Services
- **Email Service**: Multi-provider email delivery (SendGrid, AWS SES, SMTP, Mock)
- **SMS Service**: Multi-provider SMS delivery (Twilio, AWS SNS, Mock)
- **Push Notification Service**: Cross-platform push notifications (Firebase, APNS, Mock)
- **Real-Time Service**: WebSocket-based real-time notifications

### Advanced Features
- **Template Service**: Multi-language notification templates with variable substitution
- **Multi-Provider Support**: Fallback capabilities and provider switching
- **Internationalization**: Support for multiple languages (EN, TH, ZH, ES, FR)
- **Template Variables**: Dynamic content with type-safe variable substitution
- **Real-Time Delivery**: WebSocket connections for instant notifications

## Installation

```bash
npm install @strengthos/shared-notifications
```

## Quick Start

### Email Service

```typescript
import { createEmailService, DEFAULT_EMAIL_CONFIG } from '@strengthos/shared-notifications';
import { createLogger } from '@strengthos/shared-logging';

const logger = createLogger(logService);
const emailConfig = {
  ...DEFAULT_EMAIL_CONFIG,
  provider: 'sendgrid',
  apiKey: 'your-sendgrid-api-key',
  fromEmail: 'noreply@yourapp.com',
  fromName: 'Your App'
};

const emailService = createEmailService(emailConfig, logger);

// Send email
const content = {
  subject: 'Welcome to StrengthOS!',
  body: 'Thank you for joining our platform.',
  language: SupportedLanguage.EN
};

const result = await emailService.sendEmail('user@example.com', content);
if (result.isOk && result.returnValue?.success) {
  console.log('Email sent successfully:', result.returnValue.messageId);
}
```

### SMS Service

```typescript
import { createSMSService, DEFAULT_SMS_CONFIG } from '@strengthos/shared-notifications';

const smsConfig = {
  ...DEFAULT_SMS_CONFIG,
  provider: 'twilio',
  accountSid: 'your-twilio-sid',
  authToken: 'your-twilio-token',
  fromNumber: '+1234567890'
};

const smsService = createSMSService(smsConfig, logger);

// Send SMS
const result = await smsService.sendSMS(
  '+1987654321',
  'Your workout reminder: Leg Day at 3 PM today!'
);

if (result.isOk && result.returnValue?.success) {
  console.log('SMS sent successfully:', result.returnValue.messageId);
}
```

### Push Notifications

```typescript
import { 
  createPushNotificationService, 
  DEFAULT_PUSH_CONFIG,
  PushPlatform 
} from '@strengthos/shared-notifications';

const pushConfig = {
  firebase: {
    projectId: 'your-project-id',
    privateKey: 'your-private-key',
    clientEmail: 'your-client-email'
  }
};

const pushService = createPushNotificationService(pushConfig, logger);

// Send push notification
const deviceTokens = [
  { token: 'device-token-123', platform: PushPlatform.IOS },
  { token: 'device-token-456', platform: PushPlatform.ANDROID }
];

const payload = {
  title: 'Workout Reminder',
  body: 'Time for your scheduled workout!',
  data: { workoutId: '123', type: 'reminder' },
  priority: 'high'
};

const result = await pushService.sendPushNotification(deviceTokens, payload);
if (result.isOk) {
  console.log('Push notifications sent:', result.returnValue);
}
```

## Template Service

### Creating and Using Templates

```typescript
import { 
  createNotificationTemplateService,
  NotificationType,
  SupportedLanguage,
  TemplateVariableType 
} from '@strengthos/shared-notifications';

const templateService = createNotificationTemplateService(logger);

// Create a template
const templateResult = await templateService.createTemplate({
  name: 'Workout Reminder',
  type: NotificationType.WORKOUT_REMINDER,
  language: SupportedLanguage.EN,
  subject: 'Time for {{workoutName}}!',
  bodyText: `Hi {{athleteName}},

Your workout "{{workoutName}}" is scheduled for {{scheduledTime}}.

Duration: {{duration}} minutes
Location: {{location}}

Let's get started!`,
  variables: [
    { name: 'athleteName', type: TemplateVariableType.STRING, required: true },
    { name: 'workoutName', type: TemplateVariableType.STRING, required: true },
    { name: 'scheduledTime', type: TemplateVariableType.DATE, required: true },
    { name: 'duration', type: TemplateVariableType.NUMBER, required: false },
    { name: 'location', type: TemplateVariableType.STRING, required: false }
  ],
  isActive: true,
  version: 1
});

// Render template with variables
const contentResult = await templateService.renderTemplate(
  'workout_reminder',
  {
    athleteName: 'John Doe',
    workoutName: 'Upper Body Strength',
    scheduledTime: new Date(),
    duration: 45,
    location: 'Main Gym'
  },
  SupportedLanguage.EN
);

if (contentResult.isOk) {
  const content = contentResult.returnValue;
  await emailService.sendEmail('john@example.com', content);
}
```

### Multi-Language Templates

```typescript
// Create templates for different languages
await templateService.createTemplate({
  name: 'Welcome Message',
  type: NotificationType.WELCOME,
  language: SupportedLanguage.EN,
  subject: 'Welcome to StrengthOS, {{name}}!',
  bodyText: 'Welcome to our platform, {{name}}! We\'re excited to have you.',
  variables: [
    { name: 'name', type: TemplateVariableType.STRING, required: true }
  ],
  isActive: true,
  version: 1
});

await templateService.createTemplate({
  name: 'Welcome Message',
  type: NotificationType.WELCOME,
  language: SupportedLanguage.TH,
  subject: 'ยินดีต้อนรับสู่ StrengthOS, {{name}}!',
  bodyText: 'ยินดีต้อนรับสู่แพลตฟอร์มของเรา {{name}}! เรายินดีที่ได้มีคุณร่วมด้วย',
  variables: [
    { name: 'name', type: TemplateVariableType.STRING, required: true }
  ],
  isActive: true,
  version: 1
});

// Render in user's preferred language
const userLanguage = SupportedLanguage.TH;
const content = await templateService.renderTemplate(
  'welcome_message',
  { name: 'สมชาย' },
  userLanguage
);
```

## Real-Time Notifications

### WebSocket Connection Management

```typescript
import { createRealTimeNotificationService } from '@strengthos/shared-notifications';

const realTimeService = createRealTimeNotificationService(logger);

// Add connection when user connects via WebSocket
const connection = {
  id: 'conn_123',
  userId: 'user_456',
  tenantId: 'tenant_789',
  connectedAt: new Date(),
  lastActivity: new Date(),
  metadata: { userAgent: 'Mozilla/5.0...' }
};

realTimeService.addConnection(connection);

// Send real-time message to user
const message = {
  type: 'notification',
  data: {
    title: 'New Message',
    body: 'You have a new message from your coach',
    actionUrl: '/messages/123'
  },
  timestamp: new Date()
};

const result = await realTimeService.sendToUser('user_456', message);
if (result.isOk) {
  console.log('Real-time message sent to user');
}

// Listen for events
realTimeService.on('message:send', ({ connectionId, message }) => {
  // Forward to actual WebSocket connection
  webSocketServer.send(connectionId, message);
});
```

### Notification Delivery

```typescript
// Deliver notification through real-time channel
const notification = {
  id: 'notif_123',
  recipientId: 'user_456',
  type: NotificationType.COACH_MESSAGE,
  content: {
    subject: 'New Message from Coach',
    body: 'Your coach has sent you a new training plan.',
    language: SupportedLanguage.EN
  },
  channels: [
    { type: NotificationChannelType.IN_APP, address: 'user_456' }
  ],
  // ... other notification properties
};

const deliveryResult = await realTimeService.deliverNotification(notification);
if (deliveryResult.isOk) {
  console.log('Notification delivered in real-time');
}
```

## Configuration

### Email Provider Configuration

```typescript
// SendGrid Configuration
const sendGridConfig = {
  provider: 'sendgrid',
  apiKey: process.env.SENDGRID_API_KEY,
  fromEmail: 'noreply@yourapp.com',
  fromName: 'Your App'
};

// AWS SES Configuration
const sesConfig = {
  provider: 'ses',
  region: 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  fromEmail: 'noreply@yourapp.com',
  fromName: 'Your App'
};

// SMTP Configuration
const smtpConfig = {
  provider: 'smtp',
  smtpHost: 'smtp.gmail.com',
  smtpPort: 587,
  smtpUser: process.env.SMTP_USER,
  smtpPassword: process.env.SMTP_PASSWORD,
  fromEmail: 'noreply@yourapp.com',
  fromName: 'Your App'
};
```

### SMS Provider Configuration

```typescript
// Twilio Configuration
const twilioConfig = {
  provider: 'twilio',
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  fromNumber: process.env.TWILIO_FROM_NUMBER
};

// AWS SNS Configuration
const snsConfig = {
  provider: 'aws-sns',
  region: 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  fromNumber: process.env.SMS_FROM_NUMBER
};
```

### Push Notification Configuration

```typescript
// Firebase Configuration
const firebaseConfig = {
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL
  }
};

// Apple Push Notification Service Configuration
const apnsConfig = {
  apns: {
    keyId: process.env.APNS_KEY_ID,
    teamId: process.env.APNS_TEAM_ID,
    privateKey: process.env.APNS_PRIVATE_KEY,
    bundleId: process.env.APNS_BUNDLE_ID,
    production: process.env.NODE_ENV === 'production'
  }
};
```

## Error Handling

All notification services return `Results<T>` objects for consistent error handling:

```typescript
const result = await emailService.sendEmail(to, content);

if (result.isOk && result.returnValue) {
  if (result.returnValue.success) {
    console.log('Email sent:', result.returnValue.messageId);
  } else {
    console.error('Email failed:', result.returnValue.error?.message);
    
    // Check if retryable
    if (result.returnValue.error?.retryable) {
      // Implement retry logic
      setTimeout(() => {
        emailService.sendEmail(to, content);
      }, 5000);
    }
  }
} else {
  console.error('Service error:', result.message);
}
```

## Bulk Operations

### Bulk Email Sending

```typescript
const recipients = ['user1@example.com', 'user2@example.com', 'user3@example.com'];
const content = {
  subject: 'Important Update',
  body: 'We have an important update to share with you.',
  language: SupportedLanguage.EN
};

const result = await emailService.sendBulkEmail(recipients, content, {
  tags: ['bulk', 'update'],
  trackOpens: true
});

if (result.isOk) {
  const results = result.returnValue;
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`Bulk email: ${successful} sent, ${failed} failed`);
}
```

### Bulk SMS Sending

```typescript
const phoneNumbers = ['+1234567890', '+1987654321', '+1555123456'];
const message = 'Important: Your workout schedule has been updated. Check the app for details.';

const result = await smsService.sendBulkSMS(phoneNumbers, message);

if (result.isOk) {
  const results = result.returnValue;
  results.forEach(r => {
    if (r.success) {
      console.log(`SMS sent to ${r.phoneNumber}: ${r.messageId}`);
    } else {
      console.error(`SMS failed for ${r.phoneNumber}: ${r.error?.message}`);
    }
  });
}
```

## Validation

### Email Validation

```typescript
const isValid = emailService.validateEmailAddress('user@example.com');
console.log('Email valid:', isValid); // true

const isInvalid = emailService.validateEmailAddress('invalid.email');
console.log('Email valid:', isInvalid); // false
```

### Phone Number Validation and Formatting

```typescript
// Validate phone number
const isValid = smsService.validatePhoneNumber('+1234567890');
console.log('Phone valid:', isValid); // true

// Format phone number
const formatted = smsService.formatPhoneNumber('(123) 456-7890', '+1');
console.log('Formatted:', formatted); // +11234567890

const international = smsService.formatPhoneNumber('1234567890', '+1');
console.log('International:', international); // +11234567890
```

### Device Token Validation

```typescript
const iosToken = 'a1b2c3d4e5f6...'; // 64 hex characters
const androidToken = 'fcm-token-123...'; // 152+ characters

const iosValid = pushService.validateDeviceToken(iosToken, PushPlatform.IOS);
const androidValid = pushService.validateDeviceToken(androidToken, PushPlatform.ANDROID);

console.log('iOS token valid:', iosValid);
console.log('Android token valid:', androidValid);
```

## Topic-Based Push Notifications

```typescript
// Subscribe users to topics
const deviceTokens = ['token1', 'token2', 'token3'];
const subscribeResult = await pushService.subscribeToTopic(deviceTokens, 'workout-reminders');

if (subscribeResult.isOk && subscribeResult.returnValue) {
  console.log('Users subscribed to workout reminders');
}

// Send to topic
const topicPayload = {
  title: 'Daily Workout Reminder',
  body: 'Don\'t forget your workout today!',
  data: { type: 'daily-reminder' }
};

const topicResult = await pushService.sendToTopic('workout-reminders', topicPayload);
if (topicResult.isOk && topicResult.returnValue?.success) {
  console.log('Topic notification sent:', topicResult.returnValue.messageId);
}
```

## Real-Time Connection Management

```typescript
// Get connection statistics
const statsResult = realTimeService.getConnectionStats();
if (statsResult.isOk) {
  const stats = statsResult.returnValue;
  console.log('Total connections:', stats.totalConnections);
  console.log('Connections by tenant:', stats.connectionsByTenant);
  console.log('Connections by user:', stats.connectionsByUser);
}

// Get active connections
const connectionsResult = realTimeService.getActiveConnections();
if (connectionsResult.isOk) {
  const connections = connectionsResult.returnValue;
  console.log('Active connections:', connections.length);
}

// Remove connection when user disconnects
const removeResult = realTimeService.removeConnection('conn_123');
if (removeResult.isOk) {
  console.log('Connection removed');
}
```

## Template Management

### Template CRUD Operations

```typescript
// Get template by type
const templatesResult = await templateService.getTemplatesByType(NotificationType.WORKOUT_REMINDER);
if (templatesResult.isOk) {
  const templates = templatesResult.returnValue;
  console.log('Workout reminder templates:', templates.length);
}

// Update template
const updateResult = await templateService.updateTemplate('template_123', {
  subject: 'Updated: Time for {{workoutName}}!',
  bodyText: 'Updated reminder text...'
});

if (updateResult.isOk) {
  console.log('Template updated:', updateResult.returnValue.id);
}

// Delete template
const deleteResult = await templateService.deleteTemplate('template_123');
if (deleteResult.isOk) {
  console.log('Template deleted');
}
```

### Template Variable Validation

```typescript
const variables = {
  athleteName: 'John Doe',
  workoutName: 'Leg Day'
  // Missing required 'scheduledTime' variable
};

const validationResult = await templateService.validateTemplateVariables(
  'workout_reminder',
  variables
);

if (validationResult.isOk) {
  const missingVariables = validationResult.returnValue;
  if (missingVariables.length > 0) {
    console.error('Missing variables:', missingVariables);
  } else {
    console.log('All variables provided');
  }
}
```

## Best Practices

### 1. Provider Fallbacks
```typescript
// Implement fallback logic for email providers
const primaryConfig = { provider: 'sendgrid', apiKey: 'primary-key' };
const fallbackConfig = { provider: 'ses', region: 'us-east-1' };

const primaryService = createEmailService(primaryConfig, logger);
const fallbackService = createEmailService(fallbackConfig, logger);

async function sendEmailWithFallback(to: string, content: NotificationContent) {
  let result = await primaryService.sendEmail(to, content);
  
  if (!result.isOk || !result.returnValue?.success) {
    logger.warning({ message: 'Primary email service failed, trying fallback' });
    result = await fallbackService.sendEmail(to, content);
  }
  
  return result;
}
```

### 2. Rate Limiting
```typescript
// Implement rate limiting for bulk operations
async function sendBulkWithRateLimit(
  recipients: string[],
  content: NotificationContent,
  rateLimit: number = 10 // emails per second
) {
  const delay = 1000 / rateLimit;
  const results = [];
  
  for (const recipient of recipients) {
    const result = await emailService.sendEmail(recipient, content);
    results.push(result);
    
    // Wait before sending next email
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  return results;
}
```

### 3. Template Caching
```typescript
// Cache frequently used templates
const templateCache = new Map<string, NotificationTemplate>();

async function getCachedTemplate(templateId: string, language: SupportedLanguage) {
  const cacheKey = `${templateId}_${language}`;
  
  if (templateCache.has(cacheKey)) {
    return Results.ok(templateCache.get(cacheKey)!);
  }
  
  const result = await templateService.getTemplate(templateId, language);
  if (result.isOk && result.returnValue) {
    templateCache.set(cacheKey, result.returnValue);
  }
  
  return result;
}
```

### 4. Error Monitoring
```typescript
// Monitor notification failures
const notificationMetrics = {
  emailsSent: 0,
  emailsFailed: 0,
  smsSent: 0,
  smsFailed: 0,
  pushSent: 0,
  pushFailed: 0
};

async function sendEmailWithMetrics(to: string, content: NotificationContent) {
  const result = await emailService.sendEmail(to, content);
  
  if (result.isOk && result.returnValue?.success) {
    notificationMetrics.emailsSent++;
  } else {
    notificationMetrics.emailsFailed++;
    
    // Log failure for monitoring
    logger.error({ 
      message: 'Email notification failed',
      fullMessage: `To: ${to}, Error: ${result.message || result.returnValue?.error?.message}`
    });
  }
  
  return result;
}
```

## Testing

### Mock Services for Testing

```typescript
// Use mock providers for testing
const mockEmailConfig = {
  provider: 'mock',
  fromEmail: 'test@example.com',
  fromName: 'Test App'
};

const mockSMSConfig = {
  provider: 'mock',
  fromNumber: '+1234567890'
};

const mockPushConfig = {
  mock: true
};

// Create mock services
const emailService = createEmailService(mockEmailConfig, logger);
const smsService = createSMSService(mockSMSConfig, logger);
const pushService = createPushNotificationService(mockPushConfig, logger);

// Mock services will log operations instead of actually sending
```

## API Reference

### Email Service
- `sendEmail(to, content, options?)`: Send single email
- `sendBulkEmail(recipients, content, options?)`: Send bulk emails
- `validateEmailAddress(email)`: Validate email format

### SMS Service
- `sendSMS(phoneNumber, message, options?)`: Send single SMS
- `sendBulkSMS(phoneNumbers, message, options?)`: Send bulk SMS
- `validatePhoneNumber(phoneNumber)`: Validate phone number
- `formatPhoneNumber(phoneNumber, countryCode?)`: Format phone number

### Push Notification Service
- `sendPushNotification(deviceTokens, payload)`: Send push notifications
- `sendToTopic(topic, payload)`: Send to topic subscribers
- `subscribeToTopic(deviceTokens, topic)`: Subscribe devices to topic
- `unsubscribeFromTopic(deviceTokens, topic)`: Unsubscribe devices from topic
- `validateDeviceToken(token, platform)`: Validate device token

### Template Service
- `getTemplate(templateId, language)`: Get template by ID and language
- `renderTemplate(templateId, variables, language)`: Render template with variables
- `createTemplate(template)`: Create new template
- `updateTemplate(templateId, updates)`: Update existing template
- `deleteTemplate(templateId)`: Delete template
- `getTemplatesByType(type)`: Get templates by notification type
- `validateTemplateVariables(templateId, variables)`: Validate template variables

### Real-Time Service
- `addConnection(connection)`: Add WebSocket connection
- `removeConnection(connectionId)`: Remove WebSocket connection
- `sendToUser(userId, message)`: Send message to user's connections
- `sendToConnection(connectionId, message)`: Send message to specific connection
- `sendToTenant(tenantId, message)`: Send message to tenant's connections
- `deliverNotification(notification)`: Deliver notification in real-time
- `getActiveConnections()`: Get all active connections
- `getConnectionStats()`: Get connection statistics

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## Support

For issues and questions:
- Create an issue in the repository
- Check the documentation
- Review existing issues and discussions