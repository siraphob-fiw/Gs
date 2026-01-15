import {
  Translation,
  TranslationKey,
  TranslationNamespace,
  LocalizedString,
  LocalizedContent,
} from './types';

export interface TranslationManagerConfig {
  defaultLocale: string;
  supportedLocales: string[];
  autoCreateMissingKeys: boolean;
  validateTranslations: boolean;
}

export class TranslationManager {
  private namespaces: Map<string, TranslationNamespace> = new Map();
  private config: TranslationManagerConfig;

  constructor(config: TranslationManagerConfig) {
    this.config = config;
  }

  /**
   * Create or update a translation namespace
   */
  createNamespace(namespace: string, keys: TranslationKey[] = []): TranslationNamespace {
    const ns: TranslationNamespace = {
      namespace,
      keys,
      translations: {},
    };

    // Initialize translations for all supported locales
    for (const locale of this.config.supportedLocales) {
      ns.translations[locale] = [];
    }

    this.namespaces.set(namespace, ns);
    return ns;
  }

  /**
   * Add translation keys to a namespace
   */
  addTranslationKeys(namespace: string, keys: TranslationKey[]): void {
    const ns = this.namespaces.get(namespace);
    if (!ns) {
      throw new Error(`Namespace '${namespace}' not found`);
    }

    // Add new keys
    for (const key of keys) {
      const existingKeyIndex = ns.keys.findIndex(k => k.key === key.key);
      if (existingKeyIndex >= 0) {
        ns.keys[existingKeyIndex] = key; // Update existing key
      } else {
        ns.keys.push(key); // Add new key
      }
    }

    // Auto-create missing translations if enabled
    if (this.config.autoCreateMissingKeys) {
      this.autoCreateMissingTranslations(namespace, keys);
    }
  }

  /**
   * Add translations for specific keys and locales
   */
  addTranslations(namespace: string, locale: string, translations: Translation[]): void {
    const ns = this.namespaces.get(namespace);
    if (!ns) {
      throw new Error(`Namespace '${namespace}' not found`);
    }

    if (!ns.translations[locale]) {
      ns.translations[locale] = [];
    }

    // Add or update translations
    for (const translation of translations) {
      const existingIndex = ns.translations[locale].findIndex(t => t.key === translation.key);
      if (existingIndex >= 0) {
        ns.translations[locale][existingIndex] = translation;
      } else {
        ns.translations[locale].push(translation);
      }
    }

    // Validate translations if enabled
    if (this.config.validateTranslations) {
      this.validateNamespaceTranslations(namespace);
    }
  }

  /**
   * Get all translations for a namespace and locale
   */
  getTranslations(namespace: string, locale: string): Translation[] {
    const ns = this.namespaces.get(namespace);
    if (!ns) {
      return [];
    }

    return ns.translations[locale] || [];
  }

  /**
   * Get a specific translation
   */
  getTranslation(namespace: string, key: string, locale: string): Translation | undefined {
    const translations = this.getTranslations(namespace, locale);
    return translations.find(t => t.key === key);
  }

  /**
   * Get all namespaces
   */
  getNamespaces(): string[] {
    return Array.from(this.namespaces.keys());
  }

  /**
   * Get namespace details
   */
  getNamespace(namespace: string): TranslationNamespace | undefined {
    return this.namespaces.get(namespace);
  }

  /**
   * Export translations for a locale
   */
  exportTranslations(locale: string, format: 'json' | 'csv' = 'json'): string {
    const allTranslations: Record<string, any> = {};

    for (const [namespace, ns] of this.namespaces) {
      const translations = ns.translations[locale] || [];
      const namespaceTranslations: Record<string, any> = {};

      for (const translation of translations) {
        this.setNestedProperty(namespaceTranslations, translation.key, translation.value);
      }

      allTranslations[namespace] = namespaceTranslations;
    }

    if (format === 'json') {
      return JSON.stringify(allTranslations, null, 2);
    } else {
      return this.exportToCSV(locale);
    }
  }

  /**
   * Import translations from JSON
   */
  importTranslations(locale: string, data: string, format: 'json' | 'csv' = 'json'): void {
    if (format === 'json') {
      const parsed = JSON.parse(data);
      this.importFromJSON(locale, parsed);
    } else {
      this.importFromCSV(locale, data);
    }
  }

  /**
   * Get translation completion status
   */
  getTranslationStatus(namespace?: string): Record<string, { total: number; completed: number; percentage: number }> {
    const status: Record<string, { total: number; completed: number; percentage: number }> = {};

    const namespacesToCheck = namespace ? [namespace] : this.getNamespaces();

    for (const ns of namespacesToCheck) {
      const namespaceObj = this.namespaces.get(ns);
      if (!namespaceObj) continue;

      const totalKeys = namespaceObj.keys.length;

      for (const locale of this.config.supportedLocales) {
        const translations = namespaceObj.translations[locale] || [];
        const completed = translations.length;
        const percentage = totalKeys > 0 ? Math.round((completed / totalKeys) * 100) : 0;

        const key = namespace ? locale : `${ns}.${locale}`;
        status[key] = { total: totalKeys, completed, percentage };
      }
    }

    return status;
  }

  /**
   * Find missing translations
   */
  findMissingTranslations(namespace?: string): Record<string, string[]> {
    const missing: Record<string, string[]> = {};

    const namespacesToCheck = namespace ? [namespace] : this.getNamespaces();

    for (const ns of namespacesToCheck) {
      const namespaceObj = this.namespaces.get(ns);
      if (!namespaceObj) continue;

      for (const locale of this.config.supportedLocales) {
        const translations = namespaceObj.translations[locale] || [];
        const translatedKeys = new Set(translations.map(t => t.key));
        
        const missingKeys = namespaceObj.keys
          .map(k => k.key)
          .filter(key => !translatedKeys.has(key));

        if (missingKeys.length > 0) {
          const key = namespace ? locale : `${ns}.${locale}`;
          missing[key] = missingKeys;
        }
      }
    }

    return missing;
  }

  /**
   * Create localized string from translations
   */
  createLocalizedString(namespace: string, key: string): LocalizedString {
    const localized: LocalizedString = {};

    for (const locale of this.config.supportedLocales) {
      const translation = this.getTranslation(namespace, key, locale);
      if (translation) {
        localized[locale] = translation.value;
      }
    }

    return localized;
  }

  /**
   * Create localized content from multiple keys
   */
  createLocalizedContent(
    namespace: string,
    titleKey: string,
    descriptionKey?: string,
    contentKey?: string
  ): LocalizedContent {
    const content: LocalizedContent = {
      title: this.createLocalizedString(namespace, titleKey),
    };

    if (descriptionKey) {
      content.description = this.createLocalizedString(namespace, descriptionKey);
    }

    if (contentKey) {
      content.content = this.createLocalizedString(namespace, contentKey);
    }

    return content;
  }

  /**
   * Auto-create missing translations using default values
   */
  private autoCreateMissingTranslations(namespace: string, keys: TranslationKey[]): void {
    const ns = this.namespaces.get(namespace)!;

    for (const key of keys) {
      for (const locale of this.config.supportedLocales) {
        const existingTranslation = ns.translations[locale].find(t => t.key === key.key);
        
        if (!existingTranslation) {
          const translation: Translation = {
            locale,
            key: key.key,
            value: key.defaultValue,
            lastUpdated: new Date(),
            version: 1,
          };

          ns.translations[locale].push(translation);
        }
      }
    }
  }

  /**
   * Validate translations in a namespace
   */
  private validateNamespaceTranslations(namespace: string): void {
    const ns = this.namespaces.get(namespace);
    if (!ns) return;

    const keySet = new Set(ns.keys.map(k => k.key));

    for (const [locale, translations] of Object.entries(ns.translations)) {
      for (const translation of translations) {
        if (!keySet.has(translation.key)) {
          // Log warning - in a real implementation, use a proper logger
          // Skip console warning in environments where it's not available
        }
      }
    }
  }

  /**
   * Set nested property in object using dot notation
   */
  private setNestedProperty(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }

  /**
   * Import translations from JSON format
   */
  private importFromJSON(locale: string, data: Record<string, any>): void {
    for (const [namespace, namespaceData] of Object.entries(data)) {
      if (!this.namespaces.has(namespace)) {
        this.createNamespace(namespace);
      }

      const translations = this.flattenObject(namespaceData, '');
      const translationObjects: Translation[] = Object.entries(translations).map(([key, value]) => ({
        locale,
        key,
        value: String(value),
        lastUpdated: new Date(),
        version: 1,
      }));

      this.addTranslations(namespace, locale, translationObjects);
    }
  }

  /**
   * Flatten nested object to dot notation
   */
  private flattenObject(obj: any, prefix: string): Record<string, any> {
    const flattened: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(flattened, this.flattenObject(value, newKey));
      } else {
        flattened[newKey] = value;
      }
    }

    return flattened;
  }

  /**
   * Export translations to CSV format
   */
  private exportToCSV(locale: string): string {
    const rows: string[] = ['Namespace,Key,Value'];

    for (const [namespace, ns] of this.namespaces) {
      const translations = ns.translations[locale] || [];
      for (const translation of translations) {
        const escapedValue = `"${translation.value.replace(/"/g, '""')}"`;
        rows.push(`${namespace},${translation.key},${escapedValue}`);
      }
    }

    return rows.join('\n');
  }

  /**
   * Import translations from CSV format
   */
  private importFromCSV(locale: string, data: string): void {
    const lines = data.split('\n');
    const header = lines[0];
    
    if (header !== 'Namespace,Key,Value') {
      throw new Error('Invalid CSV format. Expected header: Namespace,Key,Value');
    }

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const [namespace, key, ...valueParts] = line.split(',');
      const value = valueParts.join(',').replace(/^"(.*)"$/, '$1').replace(/""/g, '"');

      if (!this.namespaces.has(namespace)) {
        this.createNamespace(namespace);
      }

      const translation: Translation = {
        locale,
        key,
        value,
        lastUpdated: new Date(),
        version: 1,
      };

      this.addTranslations(namespace, locale, [translation]);
    }
  }
}
