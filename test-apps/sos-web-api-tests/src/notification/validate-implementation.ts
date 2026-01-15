#!/usr/bin/env node

/**
 * Implementation Validation Script
 * Validates that all notification and communication system components are properly implemented
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

interface ValidationResult {
  category: string;
  item: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

class ImplementationValidator {
  private results: ValidationResult[] = [];
  private basePath: string;

  constructor() {
    this.basePath = process.cwd();
  }

  async validateAll(): Promise<void> {
    console.log('🔍 Validating Notification and Communication System Implementation\n');

    await this.validateFileStructure();
    await this.validateDatabaseMigrations();
    await this.validateServices();
    await this.validateControllers();
    await this.validateTypes();
    await this.validateTests();
    await this.validateModuleIntegration();
    await this.validateDependencies();

    this.printResults();
  }

  private async validateFileStructure(): Promise<void> {
    console.log('📁 Validating file structure...');

    const requiredFiles = [
      // Services
      'src/notification/services/notification-preferences.service.ts',
      'src/notification/services/intelligent-notification.service.ts',
      'src/notification/services/wellness-notification.service.ts',
      
      // Controllers
      'src/notification/controllers/notification-preferences.controller.ts',
      'src/notification/controllers/intelligent-notification.controller.ts',
      'src/notification/controllers/wellness-notification.controller.ts',
      
      // DTOs
      'src/notification/dto/notification-preferences.dto.ts',
      
      // Migrations
      'migrations/046_create_notification_preferences_table.ts',
      
      // Messaging
      'src/messaging/services/messaging.service.ts',
      'src/messaging/services/external-messaging.service.ts',
      'src/messaging/controllers/messaging.controller.ts',
      'src/messaging/repositories/messaging.repository.ts',
      'migrations/045_create_messaging_tables.ts',
      
      // Tests
      'src/notification/__tests__/notification-preferences.service.spec.ts',
      'src/notification/__tests__/intelligent-notification.service.spec.ts',
      'src/notification/__tests__/wellness-notification.service.spec.ts',
      'src/messaging/__tests__/messaging.service.integration.spec.ts',
    ];

    for (const file of requiredFiles) {
      const fullPath = join(this.basePath, file);
      if (existsSync(fullPath)) {
        this.addResult('File Structure', file, 'pass', 'File exists');
      } else {
        this.addResult('File Structure', file, 'fail', 'File missing');
      }
    }
  }

  private async validateDatabaseMigrations(): Promise<void> {
    console.log('🗄️  Validating database migrations...');

    const migrationFiles = [
      'migrations/045_create_messaging_tables.ts',
      'migrations/046_create_notification_preferences_table.ts',
    ];

    for (const file of migrationFiles) {
      const fullPath = join(this.basePath, file);
      if (existsSync(fullPath)) {
        const content = readFileSync(fullPath, 'utf-8');
        
        // Check for required migration components
        const requiredComponents = [
          'export async function up',
          'export async function down',
          'CREATE TABLE',
          'ROW LEVEL SECURITY',
          'CREATE POLICY',
        ];

        let allComponentsFound = true;
        for (const component of requiredComponents) {
          if (!content.includes(component)) {
            this.addResult('Database Migration', `${file} - ${component}`, 'fail', 'Missing required component');
            allComponentsFound = false;
          }
        }

        if (allComponentsFound) {
          this.addResult('Database Migration', file, 'pass', 'All required components present');
        }
      } else {
        this.addResult('Database Migration', file, 'fail', 'Migration file missing');
      }
    }
  }

  private async validateServices(): Promise<void> {
    console.log('⚙️  Validating services...');

    const serviceValidations = [
      {
        file: 'src/notification/services/notification-preferences.service.ts',
        requiredMethods: [
          'createUserPreferences',
          'getUserPreferences',
          'updateUserPreferences',
          'enableChannel',
          'disableChannel',
          'isInQuietHours',
          'shouldSendNotification',
        ],
      },
      {
        file: 'src/notification/services/intelligent-notification.service.ts',
        requiredMethods: [
          'groupNotifications',
          'shouldThrottleNotification',
          'getUserEngagementScore',
          'getNotificationAnalytics',
          'optimizeNotificationTiming',
          'generatePreferenceSuggestions',
        ],
      },
      {
        file: 'src/notification/services/wellness-notification.service.ts',
        requiredMethods: [
          'scheduleWellnessCheckIn',
          'sendPostWorkoutMoodPrompt',
          'processWellnessCheckIn',
          'detectWellnessPatterns',
          'generateWellnessReport',
          'notifyCoachOfWellnessAlert',
        ],
      },
      {
        file: 'src/messaging/services/messaging.service.ts',
        requiredMethods: [
          'createConversation',
          'sendMessage',
          'getMessageHistory',
          'searchMessages',
          'editMessage',
          'deleteMessage',
          'markMessageAsRead',
        ],
      },
    ];

    for (const validation of serviceValidations) {
      const fullPath = join(this.basePath, validation.file);
      if (existsSync(fullPath)) {
        const content = readFileSync(fullPath, 'utf-8');
        
        let allMethodsFound = true;
        for (const method of validation.requiredMethods) {
          if (!content.includes(`async ${method}`) && !content.includes(`${method}(`)) {
            this.addResult('Service Methods', `${validation.file} - ${method}`, 'fail', 'Method not found');
            allMethodsFound = false;
          }
        }

        if (allMethodsFound) {
          this.addResult('Service Methods', validation.file, 'pass', 'All required methods present');
        }

        // Check for proper error handling
        if (content.includes('try {') && content.includes('catch (error)')) {
          this.addResult('Error Handling', validation.file, 'pass', 'Error handling implemented');
        } else {
          this.addResult('Error Handling', validation.file, 'warning', 'Limited error handling detected');
        }

        // Check for logging
        if (content.includes('logger.info') || content.includes('logger.error')) {
          this.addResult('Logging', validation.file, 'pass', 'Logging implemented');
        } else {
          this.addResult('Logging', validation.file, 'warning', 'No logging detected');
        }
      }
    }
  }

  private async validateControllers(): Promise<void> {
    console.log('🎮 Validating controllers...');

    const controllerValidations = [
      {
        file: 'src/notification/controllers/notification-preferences.controller.ts',
        requiredDecorators: ['@Controller', '@UseGuards', '@ApiTags'],
        requiredEndpoints: ['@Post()', '@Get()', '@Put()', '@Delete()'],
      },
      {
        file: 'src/notification/controllers/intelligent-notification.controller.ts',
        requiredDecorators: ['@Controller', '@UseGuards', '@ApiTags'],
        requiredEndpoints: ['@Post()', '@Get()', '@Put()'],
      },
      {
        file: 'src/notification/controllers/wellness-notification.controller.ts',
        requiredDecorators: ['@Controller', '@UseGuards', '@ApiTags'],
        requiredEndpoints: ['@Post()', '@Get()'],
      },
      {
        file: 'src/messaging/controllers/messaging.controller.ts',
        requiredDecorators: ['@Controller', '@UseGuards', '@ApiTags'],
        requiredEndpoints: ['@Post()', '@Get()', '@Put()', '@Delete()'],
      },
    ];

    for (const validation of controllerValidations) {
      const fullPath = join(this.basePath, validation.file);
      if (existsSync(fullPath)) {
        const content = readFileSync(fullPath, 'utf-8');
        
        // Check decorators
        let allDecoratorsFound = true;
        for (const decorator of validation.requiredDecorators) {
          if (!content.includes(decorator)) {
            this.addResult('Controller Decorators', `${validation.file} - ${decorator}`, 'fail', 'Decorator missing');
            allDecoratorsFound = false;
          }
        }

        if (allDecoratorsFound) {
          this.addResult('Controller Decorators', validation.file, 'pass', 'All required decorators present');
        }

        // Check endpoints
        let allEndpointsFound = true;
        for (const endpoint of validation.requiredEndpoints) {
          if (!content.includes(endpoint)) {
            this.addResult('Controller Endpoints', `${validation.file} - ${endpoint}`, 'fail', 'Endpoint missing');
            allEndpointsFound = false;
          }
        }

        if (allEndpointsFound) {
          this.addResult('Controller Endpoints', validation.file, 'pass', 'All required endpoints present');
        }

        // Check for API documentation
        if (content.includes('@ApiOperation') && content.includes('@ApiResponse')) {
          this.addResult('API Documentation', validation.file, 'pass', 'API documentation present');
        } else {
          this.addResult('API Documentation', validation.file, 'warning', 'Limited API documentation');
        }
      }
    }
  }

  private async validateTypes(): Promise<void> {
    console.log('📝 Validating types and DTOs...');

    const typeFiles = [
      'src/notification/dto/notification-preferences.dto.ts',
    ];

    for (const file of typeFiles) {
      const fullPath = join(this.basePath, file);
      if (existsSync(fullPath)) {
        const content = readFileSync(fullPath, 'utf-8');
        
        // Check for validation decorators
        if (content.includes('@IsBoolean') || content.includes('@IsString') || content.includes('@IsArray')) {
          this.addResult('DTO Validation', file, 'pass', 'Validation decorators present');
        } else {
          this.addResult('DTO Validation', file, 'warning', 'No validation decorators found');
        }

        // Check for API documentation
        if (content.includes('@ApiProperty')) {
          this.addResult('DTO Documentation', file, 'pass', 'API documentation present');
        } else {
          this.addResult('DTO Documentation', file, 'warning', 'No API documentation found');
        }
      }
    }

    // Check shared types integration
    const sharedTypesPath = join(this.basePath, '../../libs/shared-types/src/messaging-types.ts');
    if (existsSync(sharedTypesPath)) {
      this.addResult('Shared Types', 'messaging-types.ts', 'pass', 'Messaging types available');
    } else {
      this.addResult('Shared Types', 'messaging-types.ts', 'fail', 'Messaging types missing');
    }
  }

  private async validateTests(): Promise<void> {
    console.log('🧪 Validating tests...');

    const testFiles = [
      'src/notification/__tests__/notification-preferences.service.spec.ts',
      'src/notification/__tests__/intelligent-notification.service.spec.ts',
      'src/notification/__tests__/wellness-notification.service.spec.ts',
      'src/messaging/__tests__/messaging.service.integration.spec.ts',
    ];

    for (const file of testFiles) {
      const fullPath = join(this.basePath, file);
      if (existsSync(fullPath)) {
        const content = readFileSync(fullPath, 'utf-8');
        
        // Check for test structure
        if (content.includes('describe(') && content.includes('it(') && content.includes('expect(')) {
          this.addResult('Test Structure', file, 'pass', 'Proper test structure');
        } else {
          this.addResult('Test Structure', file, 'fail', 'Invalid test structure');
        }

        // Check for mocking
        if (content.includes('jest.fn()') || content.includes('mockResolvedValue')) {
          this.addResult('Test Mocking', file, 'pass', 'Mocking implemented');
        } else {
          this.addResult('Test Mocking', file, 'warning', 'Limited mocking detected');
        }

        // Check for error case testing
        if (content.includes('rejects.toThrow') || content.includes('catch')) {
          this.addResult('Error Testing', file, 'pass', 'Error cases tested');
        } else {
          this.addResult('Error Testing', file, 'warning', 'Limited error case testing');
        }
      }
    }
  }

  private async validateModuleIntegration(): Promise<void> {
    console.log('🔗 Validating module integration...');

    const moduleFile = 'src/notification/notification.module.ts';
    const fullPath = join(this.basePath, moduleFile);
    
    if (existsSync(fullPath)) {
      const content = readFileSync(fullPath, 'utf-8');
      
      const requiredServices = [
        'NotificationPreferencesService',
        'IntelligentNotificationService',
        'WellnessNotificationService',
      ];

      const requiredControllers = [
        'NotificationPreferencesController',
        'IntelligentNotificationController',
        'WellnessNotificationController',
      ];

      let allServicesRegistered = true;
      for (const service of requiredServices) {
        if (!content.includes(service)) {
          this.addResult('Module Services', service, 'fail', 'Service not registered in module');
          allServicesRegistered = false;
        }
      }

      if (allServicesRegistered) {
        this.addResult('Module Services', moduleFile, 'pass', 'All services registered');
      }

      let allControllersRegistered = true;
      for (const controller of requiredControllers) {
        if (!content.includes(controller)) {
          this.addResult('Module Controllers', controller, 'fail', 'Controller not registered in module');
          allControllersRegistered = false;
        }
      }

      if (allControllersRegistered) {
        this.addResult('Module Controllers', moduleFile, 'pass', 'All controllers registered');
      }

      // Check for shared library imports
      if (content.includes('@strengthos/shared-notifications')) {
        this.addResult('Shared Libraries', moduleFile, 'pass', 'Shared libraries imported');
      } else {
        this.addResult('Shared Libraries', moduleFile, 'warning', 'Limited shared library usage');
      }
    }
  }

  private async validateDependencies(): Promise<void> {
    console.log('📦 Validating dependencies...');

    const packageJsonPath = join(this.basePath, 'package.json');
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      
      const requiredDependencies = [
        '@nestjs/event-emitter',
        '@strengthos/shared-notifications',
        '@strengthos/shared-types',
        '@strengthos/shared-logging',
      ];

      for (const dep of requiredDependencies) {
        if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
          this.addResult('Dependencies', dep, 'pass', 'Dependency installed');
        } else {
          this.addResult('Dependencies', dep, 'fail', 'Dependency missing');
        }
      }
    }

    // Check TypeScript compilation
    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe', cwd: this.basePath });
      this.addResult('TypeScript', 'Compilation', 'pass', 'TypeScript compiles without errors');
    } catch (error) {
      this.addResult('TypeScript', 'Compilation', 'fail', 'TypeScript compilation errors');
    }
  }

  private addResult(category: string, item: string, status: 'pass' | 'fail' | 'warning', message: string): void {
    this.results.push({ category, item, status, message });
  }

  private printResults(): void {
    console.log('\n📊 Validation Results');
    console.log('=====================');

    const categories = [...new Set(this.results.map(r => r.category))];
    
    for (const category of categories) {
      console.log(`\n${category}:`);
      const categoryResults = this.results.filter(r => r.category === category);
      
      for (const result of categoryResults) {
        const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
        console.log(`  ${icon} ${result.item}: ${result.message}`);
      }
    }

    // Summary
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;

    console.log('\n📈 Summary:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`📊 Total: ${this.results.length}`);

    if (failed === 0) {
      console.log('\n🎉 Implementation validation completed successfully!');
      if (warnings > 0) {
        console.log('⚠️  Please review the warnings above for potential improvements.');
      }
    } else {
      console.log('\n❌ Implementation validation failed. Please address the issues above.');
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const validator = new ImplementationValidator();
  await validator.validateAll();
}

if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });
}

export { ImplementationValidator };