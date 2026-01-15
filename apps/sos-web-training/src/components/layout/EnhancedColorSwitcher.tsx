'use client';

import React, { useState, useEffect } from 'react';
import { useColorScheme } from '@/lib/color-utils';
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react';

// Simple icon components
const Palette = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2M7 3h10a2 2 0 012 2v12a4 4 0 01-4 4H7M7 3v12a4 4 0 004 4h10"
    />
  </svg>
);

const Sun = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

const Moon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
    />
  </svg>
);

const Eye = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

interface ColorSchemeOption {
  id: string;
  name: string;
  description?: string;
  isDark?: boolean;
  isHighContrast?: boolean;
  preview?: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
}

export function EnhancedColorSwitcher() {
  const { currentScheme, switchScheme } = useColorScheme();

  useEffect(() => {
    if (currentScheme) {
      switchScheme(currentScheme);
    }
  }, [currentScheme, switchScheme]);

  const getAvailableColorSchemes = () => {
    return [
      {
        id: 'default',
        name: 'Default',
        description: 'Default color scheme',
        isDark: false,
        isHighContrast: false,
        preview: {
          primary: '#6366f1',
          secondary: '#10b981',
          accent: '#fb7185',
          background: '#f8fafc',
        },
      },
      {
        id: 'dark',
        name: 'Dark',
        description: 'Dark theme',
        isDark: true,
        isHighContrast: false,
        preview: {
          primary: '#6366f1',
          secondary: '#10b981',
          accent: '#fb7185',
          background: '#18181b',
        },
      },
      {
        id: 'ocean',
        name: 'Ocean',
        description: 'Ocean theme',
        isDark: false,
        isHighContrast: false,
        preview: {
          primary: '#0ea5e9',
          secondary: '#06b6d4',
          accent: '#818cf8',
          background: '#e0f2fe',
        },
      },
      {
        id: 'forest',
        name: 'Forest',
        description: 'Forest theme',
        isDark: false,
        isHighContrast: false,
        preview: {
          primary: '#22c55e',
          secondary: '#16a34a',
          accent: '#facc15',
          background: '#f0fdf4',
        },
      },
      {
        id: 'sunset',
        name: 'Sunset',
        description: 'Sunset theme',
        isDark: false,
        isHighContrast: false,
        preview: {
          primary: '#f59e42',
          secondary: '#f43f5e',
          accent: '#fbbf24',
          background: '#fff7ed',
        },
      },
      {
        id: 'midnight',
        name: 'Midnight',
        description: 'Midnight theme',
        isDark: true,
        isHighContrast: false,
        preview: {
          primary: '#818cf8',
          secondary: '#0ea5e9',
          accent: '#f472b6',
          background: '#18181b',
        },
      },
      {
        id: 'highContrast',
        name: 'High Contrast',
        description: 'High contrast theme',
        isDark: false,
        isHighContrast: true,
        preview: { primary: '#000', secondary: '#fff', accent: '#ff0', background: '#fff' },
      },
    ];
  };

  const availableColorSchemes = getAvailableColorSchemes();

  const switchColorScheme = (colorSchemeId: string) => {
    switchScheme(colorSchemeId);
  };

  const getColorSchemeIcon = (scheme: ColorSchemeOption) => {
    if (scheme.isHighContrast)
      return (
        <Eye className={`w-4 h-4 ${currentScheme === scheme.id ? 'text-surface' : 'text-text'}`} />
      );
    if (scheme.isDark)
      return (
        <Moon className={`w-4 h-4 ${currentScheme === scheme.id ? 'text-surface' : 'text-text'}`} />
      );
    return (
      <Sun className={`w-4 h-4 ${currentScheme === scheme.id ? 'text-surface' : 'text-text'}`} />
    );
  };

  const getColorSchemeCategory = (scheme: ColorSchemeOption) => {
    if (scheme.isHighContrast) return 'accessibility';
    if (scheme.isDark) return 'dark';
    return 'light';
  };

  const groupedColorSchemes = availableColorSchemes.reduce(
    (acc: Record<string, ColorSchemeOption[]>, scheme: ColorSchemeOption) => {
      const category = getColorSchemeCategory(scheme);
      if (!acc[category]) acc[category] = [];
      acc[category].push(scheme);
      return acc;
    },
    {} as Record<string, ColorSchemeOption[]>,
  );

  const ColorSchemePreview = ({ scheme }: { scheme: ColorSchemeOption }) => {
    if (!scheme.preview) return null;

    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          <div
            className="w-3 h-3 rounded-full border border-border"
            style={{ backgroundColor: scheme.preview.primary }}
          />
          <div
            className="w-3 h-3 rounded-full border border-border"
            style={{ backgroundColor: scheme.preview.accent }}
          />
          <div
            className="w-3 h-3 rounded-full border border-border"
            style={{ backgroundColor: scheme.preview.background }}
          />
        </div>
        <span
          className={`text-xs ${currentScheme === scheme.id ? 'text-surface' : 'text-textMuted'}`}
        >
          {scheme.name}
        </span>
      </div>
    );
  };

  const ColorSwitcherButton = () => {
    return (
      <Dropdown
        classNames={{
          content: `text-text bg-background border border-border`,
        }}
      >
        <DropdownTrigger>
          <Button
            isIconOnly
            size="sm"
            variant="bordered"
            className="flex rounded-lg shadow-lg border border-border text-sm font-medium text-text hover:border-info transition items-center gap-2"
          >
            <Palette className="w-4 h-4" />
          </Button>
        </DropdownTrigger>
        <DropdownMenu>
          {availableColorSchemes.map((scheme) => (
            <DropdownItem
              key={scheme.id}
              onPress={() => switchColorScheme(scheme.id)}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                currentScheme === scheme.id
                  ? 'border-info bg-info'
                  : 'border-border hover:border-borderHover'
              }`}
            >
              <div className="flex items-center gap-3">
                {getColorSchemeIcon(scheme)}
                <div>
                  <div
                    className={`text-start font-medium text-sm ${currentScheme === scheme.id ? 'text-surface' : 'text-text'}`}
                  >
                    {scheme.name}
                    <ColorSchemePreview scheme={scheme} />
                  </div>
                </div>
              </div>
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>
    );
  };

  return <ColorSwitcherButton />;
}
