// Notification template service migrated from human-lift-training-api/src/Services/Notifications/NotificationTemplateService.ts
import { Results } from '@strengthos/shared-utils';
import { ILogger } from '@strengthos/shared-logging';
import {
  NotificationTemplate,
  NotificationContent,
  NotificationType,
  SupportedLanguage,
} from '@strengthos/shared-types';

export interface TemplateServiceInterface {
  getTemplate(templateId: string, language: SupportedLanguage): Promise<Results<NotificationTemplate>>;
  renderTemplate(
    templateId: string,
    variables: Record<string, any>,
    language: SupportedLanguage,
  ): Promise<Results<NotificationContent>>;
  createTemplate(template: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<Results<NotificationTemplate>>;
  updateTemplate(templateId: string, updates: Partial<NotificationTemplate>): Promise<Results<NotificationTemplate>>;
  deleteTemplate(templateId: string): Promise<Results<void>>;
  getTemplatesByType(type: NotificationType): Promise<Results<NotificationTemplate[]>>;
  validateTemplateVariables(templateId: string, variables: Record<string, any>): Promise<Results<string[]>>;
}

/**
 * Notification Template Service
 * Manages notification templates with internationalization support
 */
export class NotificationTemplateService implements TemplateServiceInterface {
  private templates: Map<string, NotificationTemplate> = new Map();

  constructor(private readonly logger: ILogger) {
    this.initializeDefaultTemplates();
  }

  async getTemplate(templateId: string, language: SupportedLanguage): Promise<Results<NotificationTemplate>> {
    try {
      const templateKey = `${templateId}_${language}`;
      let template = this.templates.get(templateKey);
      
      if (!template) {
        // Fallback to English if specific language not found
        const fallbackKey = `${templateId}_${SupportedLanguage.EN}`;
        template = this.templates.get(fallbackKey);
        
        if (!template) {
          return Results.fail<NotificationTemplate>(null, `Template ${templateId} not found for language ${language}`);
        }
      }

      return Results.ok(template);
    } catch (error) {
      this.logger.error({ 
        message: 'Failed to get template', 
        fullMessage: (error as Error).message 
      });
      
      return Results.fail<NotificationTemplate>(null, 'Failed to get template');
    }
  }

  async renderTemplate(
    templateId: string,
    variables: Record<string, any>,
    language: SupportedLanguage,
  ): Promise<Results<NotificationContent>> {
    try {
      const templateResult = await this.getTemplate(templateId, language);
      if (!templateResult.isOk || !templateResult.returnValue) {
        return Results.fail<NotificationContent>(null, templateResult.message || 'Template not found');
      }

      const template = templateResult.returnValue;
      
      // Validate required variables
      const validationResult = await this.validateTemplateVariables(templateId, variables);
      if (!validationResult.isOk || !validationResult.returnValue) {
        return Results.fail<NotificationContent>(null, validationResult.message || 'Template validation failed');
      }

      const missingVariables = validationResult.returnValue;
      if (missingVariables.length > 0) {
        return Results.fail<NotificationContent>(null, `Missing required template variables: ${missingVariables.join(', ')}`);
      }
      
      let subject = template.subject;
      let body = template.body;

      // Replace template variables
      for (const [key, value] of Object.entries(variables)) {
        const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        const stringValue = String(value);
        
        subject = subject.replace(placeholder, stringValue);
        body = body.replace(placeholder, stringValue);
      }

      const content: NotificationContent = {
        subject,
        body,
        language,
        templateId,
        templateVariables: variables,
      };

      return Results.ok(content);
    } catch (error) {
      this.logger.error({ 
        message: 'Failed to render template', 
        fullMessage: (error as Error).message 
      });
      
      return Results.fail<NotificationContent>(null, 'Failed to render template');
    }
  }

  async createTemplate(
    templateData: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Results<NotificationTemplate>> {
    try {
      const template: NotificationTemplate = {
        ...templateData,
        id: this.generateTemplateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const templateKey = `${template.id}_${SupportedLanguage.EN}`;
      this.templates.set(templateKey, template);

      this.logger.info({ 
        message: 'Template created', 
        fullMessage: `Template ID: ${template.id}, Language: ${SupportedLanguage.EN}` 
      });

      return Results.ok(template);
    } catch (error) {
      this.logger.error({ 
        message: 'Failed to create template', 
        fullMessage: (error as Error).message 
      });
      
      return Results.fail<NotificationTemplate>(null, 'Failed to create template');
    }
  }

  async updateTemplate(
    templateId: string,
    updates: Partial<NotificationTemplate>
  ): Promise<Results<NotificationTemplate>> {
    try {
      // Find template by ID (check all languages)
      let existingTemplate: NotificationTemplate | undefined;
      let templateKey: string | undefined;

      for (const [key, template] of this.templates) {
        if (template.id === templateId) {
          existingTemplate = template;
          templateKey = key;
          break;
        }
      }

      if (!existingTemplate || !templateKey) {
        return Results.fail<NotificationTemplate>(null, `Template ${templateId} not found`);
      }

      const updatedTemplate: NotificationTemplate = {
        ...existingTemplate,
        ...updates,
        id: templateId, // Ensure ID doesn't change
        updatedAt: new Date(),
      };

      this.templates.set(templateKey, updatedTemplate);

      this.logger.info({ 
        message: 'Template updated', 
        fullMessage: `Template ID: ${templateId}` 
      });

      return Results.ok(updatedTemplate);
    } catch (error) {
      this.logger.error({ 
        message: 'Failed to update template', 
        fullMessage: (error as Error).message 
      });
      
      return Results.fail<NotificationTemplate>(null, 'Failed to update template');
    }
  }

  async deleteTemplate(templateId: string): Promise<Results<void>> {
    try {
      const keysToDelete: string[] = [];

      for (const [key, template] of this.templates) {
        if (template.id === templateId) {
          keysToDelete.push(key);
        }
      }

      for (const key of keysToDelete) {
        this.templates.delete(key);
      }

      if (keysToDelete.length === 0) {
        return Results.fail<void>(null, `Template ${templateId} not found`);
      }

      this.logger.info({ 
        message: 'Template deleted', 
        fullMessage: `Template ID: ${templateId}, Deleted ${keysToDelete.length} language variants` 
      });

      return Results.ok(undefined);
    } catch (error) {
      this.logger.error({ 
        message: 'Failed to delete template', 
        fullMessage: (error as Error).message 
      });
      
      return Results.fail<void>(null, 'Failed to delete template');
    }
  }

  async getTemplatesByType(type: NotificationType): Promise<Results<NotificationTemplate[]>> {
    try {
      const templates: NotificationTemplate[] = [];

      for (const template of this.templates.values()) {
        if (template.type === type) {
          templates.push(template);
        }
      }

      return Results.ok(templates);
    } catch (error) {
      this.logger.error({ 
        message: 'Failed to get templates by type', 
        fullMessage: (error as Error).message 
      });
      
      return Results.fail<NotificationTemplate[]>(null, 'Failed to get templates by type');
    }
  }

  async validateTemplateVariables(
    templateId: string,
    variables: Record<string, any>
  ): Promise<Results<string[]>> {
    try {
      const templateResult = await this.getTemplate(templateId, SupportedLanguage.EN);
      if (!templateResult.isOk || !templateResult.returnValue) {
        return Results.fail<string[]>(null, 'Template not found for validation');
      }

      const template = templateResult.returnValue;
      const missingVariables: string[] = [];

      for (const variable of template.variables) {
        if (variable && !(variable in variables)) {
          missingVariables.push(variable);
        }
      }

      return Results.ok(missingVariables);
    } catch (error) {
      this.logger.error({ 
        message: 'Failed to validate template variables', 
        fullMessage: (error as Error).message 
      });
      
      return Results.fail<string[]>(null, 'Failed to validate template variables');
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private generateTemplateId(): string {
    return `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private formatVariableValue(
    value: any,
    variableName: string,
    template: NotificationTemplate
  ): string {
    const variable = template.variables.find(v => v === variableName);
    
    return String(value);
  }

  private initializeDefaultTemplates(): void {
    const templates: NotificationTemplate[] = [
      // ========================================================================
      // TRANSITION TEMPLATES
      // ========================================================================
      {
        id: 'transition_request',
        name: 'Coach Transition Request',
        type: NotificationType.TRANSITION_REQUEST,
        subject: 'Coach Transition Request for {{athleteName}}',
        body: `A coach transition has been requested for athlete {{athleteName}}.

From Coach: {{fromCoachName}}
To Coach: {{toCoachName}}
Reason: {{reason}}

Please review and approve this transition request.

{{#if approvalUrl}}
Approve: {{approvalUrl}}
{{/if}}
<p>A coach transition has been requested for athlete <strong>{{athleteName}}</strong>.</p>
<ul>
<li><strong>From Coach:</strong> {{fromCoachName}}</li>
<li><strong>To Coach:</strong> {{toCoachName}}</li>
<li><strong>Reason:</strong> {{reason}}</li>
</ul>
<p>Please review and approve this transition request.</p>
{{#if approvalUrl}}
<p><a href="{{approvalUrl}}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Approve Transition</a></p>
{{/if}}`,
        variables: [
          'athleteName',
          'fromCoachName',
          'toCoachName',
          'reason',
          'approvalUrl',
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        tenantId: '',
        description: '',
        metadata: {},
      },

      // ========================================================================
      // HEALTH DATA TEMPLATES
      // ========================================================================
      {
        id: 'health_data_access',
        tenantId: '',
        name: 'Health Data Access Notification',
        type: NotificationType.SYSTEM_ALERT,
        subject: 'Your Health Data Was Accessed',
        body: `Your {{dataType}} data was accessed by {{accessorName}} for {{purpose}} on {{accessTime}}.

This access was logged for your security and privacy.

If you did not authorize this access, please contact support immediately.
<p>Your <strong>{{dataType}}</strong> data was accessed by <strong>{{accessorName}}</strong> for <strong>{{purpose}}</strong> on {{accessTime}}.</p>
<p>This access was logged for your security and privacy.</p>
<p><em>If you did not authorize this access, please contact support immediately.</em></p>`,
        variables: [
          'dataType',
          'accessorName',
          'purpose',
          'accessTime',
        ],
        isActive: true,
        description: '',
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // ========================================================================
      // WORKOUT REMINDERS
      // ========================================================================
      {
        id: 'workout_reminder',
        name: 'Workout Reminder',
        type: NotificationType.WORKOUT_REMINDER,
        subject: 'Time for Your Workout! 💪',
        body: `Hi {{athleteName}},

It's time for your scheduled workout: {{workoutName}}

Scheduled for: {{scheduledTime}}
Duration: {{estimatedDuration}} minutes
Location: {{gymLocation}}

{{#if coachMessage}}
Message from your coach: {{coachMessage}}
{{/if}}

Let's crush this workout!
<p>Hi <strong>{{athleteName}}</strong>,</p>
<p>It's time for your scheduled workout: <strong>{{workoutName}}</strong></p>
<ul>
<li><strong>Scheduled for:</strong> {{scheduledTime}}</li>
<li><strong>Duration:</strong> {{estimatedDuration}} minutes</li>
<li><strong>Location:</strong> {{gymLocation}}</li>
</ul>
{{#if coachMessage}}
<p><strong>Message from your coach:</strong> {{coachMessage}}</p>
{{/if}}
<p>Let's crush this workout! 💪</p>`,
        variables: [
          'athleteName',
          'workoutName',
          'scheduledTime',
          'estimatedDuration',
          'gymLocation',
          'coachMessage',
          'coachMessage',
        ],
        isActive: true,
        tenantId: '',
        description: '',
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // ========================================================================
      // WELCOME TEMPLATES
      // ========================================================================
      {
        id: 'welcome_athlete',
        name: 'Welcome New Athlete',
        type: NotificationType.WELCOME,
        subject: 'Welcome to StrengthOS! 🎉',
        body: `Welcome to StrengthOS, {{athleteName}}!

We're excited to have you join our community of athletes and coaches.

{{#if coachName}}
Your coach {{coachName}} has been notified and will be in touch soon.
{{else}}
You're starting as a self-coached athlete. You can always find a coach later in your settings.
{{/if}}

Here's what you can do next:
- Complete your athlete profile
- Set up your equipment preferences
- Configure your training schedule
- Explore available programs

{{#if actionUrl}}
Get Started: {{actionUrl}}
{{/if}}

Welcome aboard!
The StrengthOS Team`,
        variables: [
          'athleteName',
          'coachName',
          'actionUrl',
        ],
        isActive: true,
        tenantId: '',
        description: '',
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Store templates with language-specific keys
    templates.forEach(template => {
      const templateKey = `${template.id}_${SupportedLanguage.EN}`;
      this.templates.set(templateKey, template);
    });

    this.logger.info({ 
      message: 'Default notification templates initialized', 
      fullMessage: `Loaded ${templates.length} templates` 
    });
  }
}

/**
 * Factory function to create notification template service
 */
export function createNotificationTemplateService(logger: ILogger): NotificationTemplateService {
  return new NotificationTemplateService(logger);
}