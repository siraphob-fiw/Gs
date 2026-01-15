/**
 * Color utilities for simple color usage without full theme system
 * Use this when you only need colors, not the complete theme functionality
 */

import React from 'react';
import { colorSchemes, getColorScheme, type ThemeColors } from './color-schemes';

/**
 * Get colors from a specific color scheme
 * @param schemeId - The color scheme ID (e.g., 'ocean', 'forest', 'sunset')
 * @returns The color palette for the specified scheme
 */
export function getColors(schemeId: string): ThemeColors {
  const scheme = getColorScheme(schemeId);
  if (!scheme) {
    console.warn(`Color scheme '${schemeId}' not found, using default`);
    return getColorScheme('default')!.colors;
  }
  return scheme.colors;
}

/**
 * Get a specific color from a color scheme
 * @param schemeId - The color scheme ID
 * @param colorKey - The specific color key (e.g., 'primary', 'background', 'text')
 * @returns The color value
 */
export function getColor(schemeId: string, colorKey: keyof ThemeColors): string {
  const colors = getColors(schemeId);
  return colors[colorKey];
}

/**
 * Get all available color schemes
 * @returns Array of color scheme information
 */
export function getAvailableColorSchemes() {
  return Object.values(colorSchemes).map((scheme) => ({
    id: scheme.id,
    name: scheme.name,
    description: scheme.description,
    isDark: scheme.isDark,
    isHighContrast: scheme.isHighContrast,
    preview: scheme.preview,
  }));
}

/**
 * Get color schemes by category
 * @returns Color schemes grouped by type
 */
export function getColorSchemesByCategory() {
  return {
    light: Object.values(colorSchemes).filter((scheme) => !scheme.isDark && !scheme.isHighContrast),
    dark: Object.values(colorSchemes).filter((scheme) => scheme.isDark),
    accessibility: Object.values(colorSchemes).filter((scheme) => scheme.isHighContrast),
  };
}

/**
 * Apply colors to CSS variables
 * @param schemeId - The color scheme ID to apply
 * @param prefix - CSS variable prefix (default: '--color')
 */
export function applyColorsToCSS(schemeId: string, prefix: string = '--color') {
  if (typeof window === 'undefined') return;

  const colors = getColors(schemeId);
  if (!colors) return;

  const root = document.documentElement;

  Object.entries(colors).forEach(([key, value]) => {
    const cssVarName = `${prefix}-${key}`;
    root.style.setProperty(cssVarName, value);
  });
}

/**
 * Cookie manager for color scheme preference
 */
const colorSchemeCookieManager = {
  setCookie(name: string, value: string, days = 365): void {
    if (typeof window === 'undefined') return;
    const expires = new Date(Date.now() + days * 86400000).toUTCString();
    document.cookie = `${name}=${value};expires=${expires};path=/;SameSite=Lax;${window.location.protocol === 'https:' ? 'Secure;' : ''}`;
  },
  getCookie(name: string): string | null {
    if (typeof window === 'undefined') return null;
    const nameEQ = `${name}=`;
    return (
      document.cookie
        .split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith(nameEQ))
        ?.substring(nameEQ.length) || null
    );
  },
  deleteCookie(name: string): void {
    if (typeof window === 'undefined') return;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  },
};

/**
 * Get color scheme from cookie or return default
 * @returns The saved color scheme ID or 'default'
 */
export function getSavedColorScheme(): string {
  if (typeof window === 'undefined') return 'default';
  return colorSchemeCookieManager.getCookie('hs-color-scheme') || 'default';
}

/**
 * Save color scheme to cookie
 * @param schemeId - The color scheme ID to save
 */
export function saveColorScheme(schemeId: string) {
  if (typeof window === 'undefined') return;
  colorSchemeCookieManager.setCookie('hs-color-scheme', schemeId, 365);
}

/**
 * Simple color switcher hook for React components
 * @param initialScheme - Initial color scheme (default: saved or 'default')
 * @returns Object with current scheme, colors, and switch function
 */
export function useColorScheme(initialScheme?: string) {
  const [currentScheme, setCurrentScheme] = React.useState(initialScheme || getSavedColorScheme());

  const colors = getColors(currentScheme);

  const switchScheme = (schemeId: string) => {
    setCurrentScheme(schemeId);
    saveColorScheme(schemeId);
    applyColorsToCSS(schemeId);
  };

  return {
    currentScheme,
    colors,
    switchScheme,
    availableSchemes: getAvailableColorSchemes(),
  };
}
