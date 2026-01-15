import { BaseFactory, FactoryOptions } from './base-factory';
import { 
  WeightUnit,
  Tenant,
  TenantSettings,
  BillingInfo,
  TenantStatus,
  tenantWithSubscription,
} from '@strengthos/shared-types';
export interface TenantFactoryOptions extends FactoryOptions {
  id?: string;
  name?: string;
  domain?: string;
  status?: TenantStatus;
  allowSelfCoached?: boolean;
  requireCoachApproval?: boolean;
  enableVideoAnalysis?: boolean;
  defaultLanguage?: string;
  availableLanguages?: string[];
  maxCoaches?: number;
  maxAthletes?: number;
  customBranding?: any;
  complianceSettings?: any;
}

export class TenantFactory extends BaseFactory<Tenant> {
  protected static defaultOptions: Partial<TenantFactoryOptions> = {
    status: TenantStatus.ACTIVE,
    allowSelfCoached: true,
    requireCoachApproval: false,
    enableVideoAnalysis: true,
    defaultLanguage: 'en',
    availableLanguages: ['en', 'th'],
    maxCoaches: 10,
    maxAthletes: 100,
  };

  create(options: TenantFactoryOptions = {}): tenantWithSubscription {
    const opts = this.mergeOptions(options, TenantFactory.defaultOptions) as TenantFactoryOptions;
    const tenantId = opts.id || this.generateId();
    const timestamp = this.generateTimestamp();
    const companyName = opts.name || this.generateRealistic.company();

    const settings: TenantSettings = {
      allowSelfCoached: opts.allowSelfCoached!,
      requireCoachApproval: opts.requireCoachApproval!,
      enableVideoAnalysis: opts.enableVideoAnalysis!,
      defaultLanguage: opts.defaultLanguage!,
      availableLanguages: opts.availableLanguages!,
      maxCoaches: opts.maxCoaches!,
      maxAthletes: opts.maxAthletes!,
      logo: opts.logo || null,
      complianceSettings: opts.complianceSettings || {
        gdprEnabled: true,
        pdpaEnabled: true,
        hipaaEnabled: false,
        consentRequired: true,
      },
    };

    const billingInfo: BillingInfo = {
      amount: 0,
      billingCycle: 'MONTHLY',
      currency: 'USD',
    };

    return {
      id: tenantId,
      name: companyName,
      status: opts.status!,
      settings: settings,
      subscription_info: 'starter',
      subscription_info_details: null,
      description: 'This is a test tenant',
      billing_info: billingInfo,
      contact: {
        email: 'test@tenant.com',
        phone: '1234567890',
      },
      created_at: timestamp,
      updated_at: timestamp,
      suspended_at: opts.status === TenantStatus.SUSPENDED ? timestamp : null,
    };
  }

  // Convenience methods for specific tenant types
  createWithDomain(domain: string, options: TenantFactoryOptions = {}): Tenant {
    return this.create({
      ...options,
      domain,
      name: options.name || domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1),
    });
  }

  createSuspended(options: TenantFactoryOptions = {}): Tenant {
    return this.create({
      ...options,
      status: TenantStatus.SUSPENDED,
    });
  }

  createTrial(options: TenantFactoryOptions = {}): Tenant {
    return this.create({
      ...options,
      status: TenantStatus.TRIAL,
    });
  }

  createCancelled(options: TenantFactoryOptions = {}): Tenant {
    return this.create({
      ...options,
      status: TenantStatus.CANCELLED,
    });
  }

  createEnterprise(options: TenantFactoryOptions = {}): Tenant {
    return this.create({
      ...options,
      maxCoaches: 100,
      maxAthletes: 1000,
      enableVideoAnalysis: true,
      customBranding: {
        logo: 'https://example.com/logo.png',
        primaryColor: '#1a365d',
        secondaryColor: '#2d3748',
        customDomain: options.domain,
      },
      complianceSettings: {
        gdprEnabled: true,
        pdpaEnabled: true,
        hipaaEnabled: true,
      },
    });
  }

  createStartup(options: TenantFactoryOptions = {}): Tenant {
    return this.create({
      ...options,
      maxCoaches: 3,
      maxAthletes: 25,
      enableVideoAnalysis: false,
      availableLanguages: ['en'],
    });
  }

  createInternational(locale: string = 'th', options: TenantFactoryOptions = {}): Tenant {
    const regions: Record<string, Partial<TenantFactoryOptions>> = {
      th: {
        defaultLanguage: 'th',
        availableLanguages: ['th', 'en'],
        name: 'Thai Fitness Center',
      },
      zh: {
        defaultLanguage: 'zh',
        availableLanguages: ['zh', 'en'],
        name: 'Chinese Strength Academy',
      },
      es: {
        defaultLanguage: 'es',
        availableLanguages: ['es', 'en'],
        name: 'Centro de Fuerza Español',
      },
      en: {
        defaultLanguage: 'en',
        availableLanguages: ['en'],
        name: 'American Powerlifting Gym',
      },
    };

    const region = regions[locale] || regions.en;

    return this.create({
      ...options,
      ...region,
      complianceSettings: {
        gdprEnabled: locale === 'en' && Math.random() > 0.5,
        pdpaEnabled: locale === 'th',
        hipaaEnabled: locale === 'en',
      },
    });
  }

  createWithSubscription(planType: 'starter' | 'professional' | 'enterprise' = 'professional', options: TenantFactoryOptions = {}): Tenant {
    const planConfigs = {
      starter: {
        maxCoaches: 2,
        maxAthletes: 20,
        enableVideoAnalysis: false,
      },
      professional: {
        maxCoaches: 10,
        maxAthletes: 100,
        enableVideoAnalysis: true,
      },
      enterprise: {
        maxCoaches: 50,
        maxAthletes: 500,
        enableVideoAnalysis: true,
      },
    };

    return this.create({
      ...options,
      ...planConfigs[planType],
    });
  }

  // Create test environments
  createTestEnvironment(): {
    activeTenant: Tenant;
    trialTenant: Tenant;
    suspendedTenant: Tenant;
    enterpriseTenant: Tenant;
  } {
    return {
      activeTenant: this.create({
        name: 'Active Test Tenant',
        status: TenantStatus.ACTIVE,
      }),
      trialTenant: this.createTrial({
        name: 'Trial Test Tenant',
      }),
      suspendedTenant: this.createSuspended({
        name: 'Suspended Test Tenant',
      }),
      enterpriseTenant: this.createEnterprise({
        name: 'Enterprise Test Tenant',
        domain: 'enterprise.strengthos.com',
      }),
    };
  }

  createMultiRegionSetup(): Tenant[] {
    return [
      this.createInternational('en', { name: 'US Gym' }),
      this.createInternational('th', { name: 'Thai Gym' }),
      this.createInternational('zh', { name: 'Chinese Gym' }),
      this.createInternational('es', { name: 'Spanish Gym' }),
    ];
  }
}

// Export singleton instance
export const tenantFactory = new TenantFactory();