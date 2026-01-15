// Internationalization and Localization Types

export interface LocaleConfig {
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  region: string;
  currency: string;
  dateFormat: string;
  timeFormat: string;
  numberFormat: NumberFormatConfig;
  weightUnit: 'KG' | 'LBS';
  isActive: boolean;
}

export interface NumberFormatConfig {
  decimal: string;
  thousands: string;
  precision: number;
  currencySymbol: string;
  currencyPosition: 'before' | 'after';
}

export interface TranslationKey {
  key: string;
  defaultValue: string;
  description?: string;
  context?: string;
  pluralRules?: PluralRule[];
}

export interface PluralRule {
  condition: string;
  value: string;
}

export interface Translation {
  locale: string;
  key: string;
  value: string;
  pluralValues?: Record<string, string>;
  lastUpdated: Date;
  version: number;
}

export interface TranslationNamespace {
  namespace: string;
  keys: TranslationKey[];
  translations: Record<string, Translation[]>;
}

export interface LocalizedString {
  [locale: string]: string;
}

export interface LocalizedContent {
  title: LocalizedString;
  description?: LocalizedString;
  content?: LocalizedString;
  metadata?: Record<string, LocalizedString>;
}

export interface CulturalAdaptation {
  locale: string;
  timeZone: string;
  workingDays: number[];
  workingHours: {
    start: string;
    end: string;
  };
  holidays: string[];
  culturalNotes?: string[];
}

export interface PaymentMethodLocalization {
  locale: string;
  region: string;
  supportedMethods: string[];
  preferredMethods: string[];
  localBanks: BankInfo[];
  localPaymentProviders: PaymentProviderInfo[];
}

export interface BankInfo {
  code: string;
  name: LocalizedString;
  swiftCode?: string;
  routingFormat?: string;
  accountFormat?: string;
}

export interface PaymentProviderInfo {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
  supportedCurrencies: string[];
  fees: LocalizedString;
  processingTime: LocalizedString;
}

export interface FormattingOptions {
  locale: string;
  timeZone?: string;
  currency?: string;
  weightUnit?: 'KG' | 'LBS';
  dateStyle?: 'short' | 'medium' | 'long' | 'full';
  timeStyle?: 'short' | 'medium' | 'long' | 'full';
  numberStyle?: 'decimal' | 'currency' | 'percent';
}

export interface I18nContext {
  locale: string;
  fallbackLocale: string;
  timeZone: string;
  currency: string;
  weightUnit: 'KG' | 'LBS';
  direction: 'ltr' | 'rtl';
  region: string;
}

export interface TranslationInterpolation {
  [key: string]: string | number | Date | boolean;
}

export interface PluralizationContext {
  count: number;
  locale: string;
}

export enum SupportedLocale {
  EN_US = 'en-US',
  EN_GB = 'en-GB',
  TH_TH = 'th-TH',
  ZH_CN = 'zh-CN',
  ZH_TW = 'zh-TW',
  JA_JP = 'ja-JP',
  KO_KR = 'ko-KR',
  ES_ES = 'es-ES',
  FR_FR = 'fr-FR',
  DE_DE = 'de-DE',
  PT_BR = 'pt-BR',
  RU_RU = 'ru-RU',
  AR_SA = 'ar-SA',
}

export enum WeightUnit {
  KG = 'KG',
  LBS = 'LBS',
}

export enum DateFormat {
  ISO = 'YYYY-MM-DD',
  US = 'MM/DD/YYYY',
  EU = 'DD/MM/YYYY',
  THAI = 'DD/MM/YYYY',
  CHINESE = 'YYYY年MM月DD日',
}

export enum TimeFormat {
  TWELVE_HOUR = '12h',
  TWENTY_FOUR_HOUR = '24h',
}

export enum NumberFormat {
  DECIMAL_DOT = 'decimal_dot',
  DECIMAL_COMMA = 'decimal_comma',
}

export enum CurrencyFormat {
  SYMBOL_BEFORE = 'symbol_before',
  SYMBOL_AFTER = 'symbol_after',
  CODE_BEFORE = 'code_before',
  CODE_AFTER = 'code_after',
}

export interface LocaleDetectionOptions {
  acceptLanguageHeader?: string;
  userAgent?: string;
  ipAddress?: string;
  userPreference?: string;
  defaultLocale: string;
  supportedLocales: string[];
}

export interface TranslationLoadOptions {
  namespace?: string;
  fallback?: boolean;
  cache?: boolean;
  lazy?: boolean;
}

export interface I18nServiceConfig {
  defaultLocale: string;
  fallbackLocale: string;
  supportedLocales: string[];
  translationPath: string;
  cacheEnabled: boolean;
  cacheTTL: number;
  lazyLoading: boolean;
  interpolationPrefix: string;
  interpolationSuffix: string;
}
