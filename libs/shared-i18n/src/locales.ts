import { LocaleConfig, CulturalAdaptation, PaymentMethodLocalization, BankInfo, PaymentProviderInfo } from './types';

export const SUPPORTED_LOCALES: Record<string, LocaleConfig> = {
  'en-US': {
    code: 'en-US',
    name: 'English (United States)',
    nativeName: 'English (US)',
    direction: 'ltr',
    region: 'US',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    numberFormat: {
      decimal: '.',
      thousands: ',',
      precision: 2,
      currencySymbol: '$',
      currencyPosition: 'before',
    },
    weightUnit: 'LBS',
    isActive: true,
  },
  'en-GB': {
    code: 'en-GB',
    name: 'English (United Kingdom)',
    nativeName: 'English (UK)',
    direction: 'ltr',
    region: 'GB',
    currency: 'GBP',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    numberFormat: {
      decimal: '.',
      thousands: ',',
      precision: 2,
      currencySymbol: '£',
      currencyPosition: 'before',
    },
    weightUnit: 'KG',
    isActive: true,
  },
  'th-TH': {
    code: 'th-TH',
    name: 'Thai (Thailand)',
    nativeName: 'ไทย',
    direction: 'ltr',
    region: 'TH',
    currency: 'THB',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    numberFormat: {
      decimal: '.',
      thousands: ',',
      precision: 2,
      currencySymbol: '฿',
      currencyPosition: 'before',
    },
    weightUnit: 'KG',
    isActive: true,
  },
  'zh-CN': {
    code: 'zh-CN',
    name: 'Chinese (Simplified)',
    nativeName: '简体中文',
    direction: 'ltr',
    region: 'CN',
    currency: 'CNY',
    dateFormat: 'YYYY年MM月DD日',
    timeFormat: '24h',
    numberFormat: {
      decimal: '.',
      thousands: ',',
      precision: 2,
      currencySymbol: '¥',
      currencyPosition: 'before',
    },
    weightUnit: 'KG',
    isActive: true,
  },
  'zh-TW': {
    code: 'zh-TW',
    name: 'Chinese (Traditional)',
    nativeName: '繁體中文',
    direction: 'ltr',
    region: 'TW',
    currency: 'TWD',
    dateFormat: 'YYYY年MM月DD日',
    timeFormat: '24h',
    numberFormat: {
      decimal: '.',
      thousands: ',',
      precision: 2,
      currencySymbol: 'NT$',
      currencyPosition: 'before',
    },
    weightUnit: 'KG',
    isActive: true,
  },
  'ja-JP': {
    code: 'ja-JP',
    name: 'Japanese',
    nativeName: '日本語',
    direction: 'ltr',
    region: 'JP',
    currency: 'JPY',
    dateFormat: 'YYYY年MM月DD日',
    timeFormat: '24h',
    numberFormat: {
      decimal: '.',
      thousands: ',',
      precision: 0,
      currencySymbol: '¥',
      currencyPosition: 'before',
    },
    weightUnit: 'KG',
    isActive: true,
  },
  'ko-KR': {
    code: 'ko-KR',
    name: 'Korean',
    nativeName: '한국어',
    direction: 'ltr',
    region: 'KR',
    currency: 'KRW',
    dateFormat: 'YYYY년 MM월 DD일',
    timeFormat: '24h',
    numberFormat: {
      decimal: '.',
      thousands: ',',
      precision: 0,
      currencySymbol: '₩',
      currencyPosition: 'before',
    },
    weightUnit: 'KG',
    isActive: true,
  },
  'es-ES': {
    code: 'es-ES',
    name: 'Spanish (Spain)',
    nativeName: 'Español',
    direction: 'ltr',
    region: 'ES',
    currency: 'EUR',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    numberFormat: {
      decimal: ',',
      thousands: '.',
      precision: 2,
      currencySymbol: '€',
      currencyPosition: 'after',
    },
    weightUnit: 'KG',
    isActive: true,
  },
  'fr-FR': {
    code: 'fr-FR',
    name: 'French (France)',
    nativeName: 'Français',
    direction: 'ltr',
    region: 'FR',
    currency: 'EUR',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    numberFormat: {
      decimal: ',',
      thousands: ' ',
      precision: 2,
      currencySymbol: '€',
      currencyPosition: 'after',
    },
    weightUnit: 'KG',
    isActive: true,
  },
  'de-DE': {
    code: 'de-DE',
    name: 'German (Germany)',
    nativeName: 'Deutsch',
    direction: 'ltr',
    region: 'DE',
    currency: 'EUR',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '24h',
    numberFormat: {
      decimal: ',',
      thousands: '.',
      precision: 2,
      currencySymbol: '€',
      currencyPosition: 'after',
    },
    weightUnit: 'KG',
    isActive: true,
  },
  'pt-BR': {
    code: 'pt-BR',
    name: 'Portuguese (Brazil)',
    nativeName: 'Português (Brasil)',
    direction: 'ltr',
    region: 'BR',
    currency: 'BRL',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    numberFormat: {
      decimal: ',',
      thousands: '.',
      precision: 2,
      currencySymbol: 'R$',
      currencyPosition: 'before',
    },
    weightUnit: 'KG',
    isActive: true,
  },
  'ru-RU': {
    code: 'ru-RU',
    name: 'Russian',
    nativeName: 'Русский',
    direction: 'ltr',
    region: 'RU',
    currency: 'RUB',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '24h',
    numberFormat: {
      decimal: ',',
      thousands: ' ',
      precision: 2,
      currencySymbol: '₽',
      currencyPosition: 'after',
    },
    weightUnit: 'KG',
    isActive: true,
  },
  'ar-SA': {
    code: 'ar-SA',
    name: 'Arabic (Saudi Arabia)',
    nativeName: 'العربية',
    direction: 'rtl',
    region: 'SA',
    currency: 'SAR',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    numberFormat: {
      decimal: '.',
      thousands: ',',
      precision: 2,
      currencySymbol: 'ر.س',
      currencyPosition: 'after',
    },
    weightUnit: 'KG',
    isActive: true,
  },
};

export const CULTURAL_ADAPTATIONS: Record<string, CulturalAdaptation> = {
  'en-US': {
    locale: 'en-US',
    timeZone: 'America/New_York',
    workingDays: [1, 2, 3, 4, 5], // Monday to Friday
    workingHours: { start: '09:00', end: '17:00' },
    holidays: ['2024-01-01', '2024-07-04', '2024-12-25'],
    culturalNotes: ['Prefer imperial units', 'Sunday is typically rest day'],
  },
  'th-TH': {
    locale: 'th-TH',
    timeZone: 'Asia/Bangkok',
    workingDays: [1, 2, 3, 4, 5],
    workingHours: { start: '08:00', end: '17:00' },
    holidays: ['2024-01-01', '2024-04-13', '2024-04-14', '2024-04-15', '2024-12-05'],
    culturalNotes: ['Buddhist holidays important', 'Respect for monarchy', 'Metric system standard'],
  },
  'zh-CN': {
    locale: 'zh-CN',
    timeZone: 'Asia/Shanghai',
    workingDays: [1, 2, 3, 4, 5, 6], // Monday to Saturday
    workingHours: { start: '09:00', end: '18:00' },
    holidays: ['2024-01-01', '2024-02-10', '2024-02-11', '2024-02-12', '2024-10-01'],
    culturalNotes: ['Chinese New Year is major holiday', 'Six-day work week common', 'Metric system'],
  },
  'ja-JP': {
    locale: 'ja-JP',
    timeZone: 'Asia/Tokyo',
    workingDays: [1, 2, 3, 4, 5],
    workingHours: { start: '09:00', end: '18:00' },
    holidays: ['2024-01-01', '2024-01-08', '2024-02-11', '2024-04-29', '2024-05-03'],
    culturalNotes: ['Golden Week important', 'Respect for hierarchy', 'Metric system'],
  },
  'ar-SA': {
    locale: 'ar-SA',
    timeZone: 'Asia/Riyadh',
    workingDays: [0, 1, 2, 3, 4], // Sunday to Thursday
    workingHours: { start: '08:00', end: '16:00' },
    holidays: ['2024-09-23', '2024-05-01'],
    culturalNotes: ['Friday is holy day', 'Ramadan affects schedules', 'Right-to-left text'],
  },
};

export const PAYMENT_LOCALIZATIONS: Record<string, PaymentMethodLocalization> = {
  'th-TH': {
    locale: 'th-TH',
    region: 'TH',
    supportedMethods: ['promptpay', 'bank_transfer', 'credit_card', 'debit_card'],
    preferredMethods: ['promptpay', 'bank_transfer'],
    localBanks: [
      {
        code: 'BBL',
        name: { 'th-TH': 'ธนาคารกรุงเทพ', 'en-US': 'Bangkok Bank' },
        swiftCode: 'BKKBTHBK',
      },
      {
        code: 'SCB',
        name: { 'th-TH': 'ธนาคารไทยพาณิชย์', 'en-US': 'Siam Commercial Bank' },
        swiftCode: 'SICOTHBK',
      },
      {
        code: 'KTB',
        name: { 'th-TH': 'ธนาคารกรุงไทย', 'en-US': 'Krung Thai Bank' },
        swiftCode: 'KRTHTHBK',
      },
      {
        code: 'KBANK',
        name: { 'th-TH': 'ธนาคารกสิกรไทย', 'en-US': 'Kasikorn Bank' },
        swiftCode: 'KASITHBK',
      },
    ],
    localPaymentProviders: [
      {
        id: 'promptpay',
        name: { 'th-TH': 'พร้อมเพย์', 'en-US': 'PromptPay' },
        description: { 'th-TH': 'ระบบชำระเงินแบบทันที', 'en-US': 'Instant payment system' },
        supportedCurrencies: ['THB'],
        fees: { 'th-TH': 'ฟรี', 'en-US': 'Free' },
        processingTime: { 'th-TH': 'ทันที', 'en-US': 'Instant' },
      },
    ],
  },
  'zh-CN': {
    locale: 'zh-CN',
    region: 'CN',
    supportedMethods: ['alipay', 'wechat_pay', 'bank_transfer', 'unionpay'],
    preferredMethods: ['alipay', 'wechat_pay'],
    localBanks: [
      {
        code: 'ICBC',
        name: { 'zh-CN': '中国工商银行', 'en-US': 'Industrial and Commercial Bank of China' },
        swiftCode: 'ICBKCNBJ',
      },
      {
        code: 'CCB',
        name: { 'zh-CN': '中国建设银行', 'en-US': 'China Construction Bank' },
        swiftCode: 'PCBCCNBJ',
      },
    ],
    localPaymentProviders: [
      {
        id: 'alipay',
        name: { 'zh-CN': '支付宝', 'en-US': 'Alipay' },
        description: { 'zh-CN': '蚂蚁金服支付平台', 'en-US': 'Ant Financial payment platform' },
        supportedCurrencies: ['CNY'],
        fees: { 'zh-CN': '0.6%', 'en-US': '0.6%' },
        processingTime: { 'zh-CN': '即时', 'en-US': 'Instant' },
      },
      {
        id: 'wechat_pay',
        name: { 'zh-CN': '微信支付', 'en-US': 'WeChat Pay' },
        description: { 'zh-CN': '腾讯支付平台', 'en-US': 'Tencent payment platform' },
        supportedCurrencies: ['CNY'],
        fees: { 'zh-CN': '0.6%', 'en-US': '0.6%' },
        processingTime: { 'zh-CN': '即时', 'en-US': 'Instant' },
      },
    ],
  },
  'en-US': {
    locale: 'en-US',
    region: 'US',
    supportedMethods: ['credit_card', 'debit_card', 'ach', 'paypal', 'apple_pay', 'google_pay'],
    preferredMethods: ['credit_card', 'paypal'],
    localBanks: [
      {
        code: 'JPM',
        name: { 'en-US': 'JPMorgan Chase Bank' },
        routingFormat: '9 digits',
        accountFormat: '10-12 digits',
      },
      {
        code: 'BAC',
        name: { 'en-US': 'Bank of America' },
        routingFormat: '9 digits',
        accountFormat: '10-12 digits',
      },
    ],
    localPaymentProviders: [
      {
        id: 'stripe',
        name: { 'en-US': 'Stripe' },
        description: { 'en-US': 'Online payment processing' },
        supportedCurrencies: ['USD'],
        fees: { 'en-US': '2.9% + $0.30' },
        processingTime: { 'en-US': '2-7 business days' },
      },
    ],
  },
};

export const DEFAULT_LOCALE = 'en-US';
export const FALLBACK_LOCALE = 'en-US';

export function getLocaleConfig(locale: string): LocaleConfig {
  return SUPPORTED_LOCALES[locale] || SUPPORTED_LOCALES[DEFAULT_LOCALE];
}

export function getCulturalAdaptation(locale: string): CulturalAdaptation | undefined {
  return CULTURAL_ADAPTATIONS[locale];
}

export function getPaymentLocalization(locale: string): PaymentMethodLocalization | undefined {
  return PAYMENT_LOCALIZATIONS[locale];
}

export function getSupportedLocales(): string[] {
  return Object.keys(SUPPORTED_LOCALES).filter(locale => SUPPORTED_LOCALES[locale].isActive);
}

export function isRTLLocale(locale: string): boolean {
  const config = getLocaleConfig(locale);
  return config.direction === 'rtl';
}

export function getDefaultCurrency(locale: string): string {
  const config = getLocaleConfig(locale);
  return config.currency;
}
