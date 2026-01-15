'use client';

import React from 'react';
import { useLocale } from '@/hooks/api/useLocale';
import { useTranslation } from '@/hooks/api/useTranslation';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'dropdown' | 'buttons';
  showFlags?: boolean;
}

/**
 * Language switcher component using shared locale utilities
 * Supports both dropdown and button variants
 */
export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className = '',
  variant = 'dropdown',
  showFlags = true,
}) => {
  const { locale, changeLocale, getSupportedLocalesWithNames, isLoading } = useLocale();
  const { t } = useTranslation('common');

  const supportedLocales = getSupportedLocalesWithNames();

  const handleLocaleChange = (newLocale: string) => {
    const success = changeLocale(newLocale);
    if (!success) {
      console.error('Failed to change locale to:', newLocale);
    }
  };

  const getFlag = (localeCode: string): string => {
    const flagMap: Record<string, string> = {
      'en-US': '🇺🇸',
      'th-TH': '🇹🇭',
    };
    return flagMap[localeCode] || '🌐';
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-8 w-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (variant === 'buttons') {
    return (
      <div className={`flex gap-2 ${className}`}>
        {supportedLocales.map((localeOption) => (
          <button
            key={localeOption.code}
            onClick={() => handleLocaleChange(localeOption.code)}
            className={`
              px-3 py-2 rounded-md text-sm font-medium transition-colors
              ${
                locale === localeOption.code
                  ? 'bg-info text-text'
                  : 'bg-gray-100 text-textSecondary hover:bg-gray-200'
              }
            `}
            title={localeOption.name}
          >
            {showFlags && <span className="mr-1">{getFlag(localeOption.code)}</span>}
            {localeOption.name}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <select
        value={locale}
        onChange={(e) => handleLocaleChange(e.target.value)}
        className="
          appearance-none bg-white border border-gray-300 rounded-md
          px-3 py-2 pr-8 text-sm font-medium text-textSecondary
          hover:border-gray-400 focus:outline-none focus:ring-2 
          focus:ring-info/80 focus:border-info/80
          cursor-pointer
        "
        title={t('select')}
      >
        {supportedLocales.map((localeOption) => (
          <option key={localeOption.code} value={localeOption.code}>
            {showFlags && `${getFlag(localeOption.code)} `}
            {localeOption.name}
          </option>
        ))}
      </select>

      {/* Custom dropdown arrow */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
};

/**
 * Compact language switcher for mobile or space-constrained areas
 */
export const CompactLanguageSwitcher: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { locale, changeLocale, getSupportedLocalesWithNames } = useLocale();
  const supportedLocales = getSupportedLocalesWithNames();

  const currentLocale = supportedLocales.find((l) => l.code === locale);
  const otherLocales = supportedLocales.filter((l) => l.code !== locale);

  const getFlag = (localeCode: string): string => {
    const flagMap: Record<string, string> = {
      'en-US': '🇺🇸',
      'th-TH': '🇹🇭',
    };
    return flagMap[localeCode] || '🌐';
  };

  return (
    <div className={`relative group ${className}`}>
      <button className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-gray-100">
        <span>{getFlag(locale)}</span>
        <span className="text-sm font-medium">{currentLocale?.name}</span>
        <svg
          className="w-3 h-3 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        className="
        absolute top-full left-0 mt-1 py-1 bg-white border border-gray-200 
        rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 
        group-hover:visible transition-all duration-200 z-50 min-w-full
      "
      >
        {otherLocales.map((localeOption) => (
          <button
            key={localeOption.code}
            onClick={() => changeLocale(localeOption.code)}
            className="
              w-full text-left px-3 py-2 text-sm hover:bg-background 
              flex items-center space-x-2
            "
          >
            <span>{getFlag(localeOption.code)}</span>
            <span>{localeOption.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
