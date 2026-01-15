'use client';

import { I18nService } from '@strengthos/shared-i18n';

/**
 * Create I18n service instance for the application
 */
export function createI18nService(): I18nService {
  // Create I18n service with basic configuration
  const service = new I18nService({
    defaultLocale: 'en-US',
    fallbackLocale: 'en-US',
    supportedLocales: ['en-US', 'th-TH', 'zh-CN', 'ja-JP', 'ko-KR'],
    translationPath: './translations',
    cacheEnabled: true,
    cacheTTL: 3600000, // 1 hour
    lazyLoading: false,
  });

  return service;
}
