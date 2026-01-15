/**
 * Local color schemes
 * Self-contained color schemes without shared-ui dependency
 */
// Theme color interface
export interface ThemeColors {
  primary: string;
  primaryHover: string;
  primaryActive: string;
  secondary: string;
  secondaryHover: string;
  secondaryActive: string;
  accent: string;
  accentHover: string;
  accentActive: string;
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceHover: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderHover: string;
  success: string;
  successHover: string;
  warning: string;
  warningHover: string;
  error: string;
  errorHover: string;
  info: string;
  infoHover: string;
}

// Color scheme interface
export interface ColorScheme {
  id: string;
  name: string;
  description?: string;
  colors: ThemeColors;
  isDark?: boolean;
  isHighContrast?: boolean;
  preview?: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
}

// Color schemes interface
export interface ThemeColorSchemes {
  default: ColorScheme;
  light: ColorScheme;
  dark: ColorScheme;
  highContrast: ColorScheme;
  ocean: ColorScheme;
  forest: ColorScheme;
  sunset: ColorScheme;
  midnight: ColorScheme;
  [key: string]: ColorScheme;
}

/**
 * Ocean color scheme - Cool blues and teals (adjusted)
 */
export const oceanColorScheme: ColorScheme = {
  id: 'ocean',
  name: 'Ocean',
  description: 'Cool blues and teals inspired by the deep sea',
  isDark: false,
  colors: {
    primary: '#0099CC', // adjusted: deeper blue
    primaryHover: '#0077AA',
    primaryActive: '#005577',
    secondary: '#3AAFB9', // adjusted: teal
    secondaryHover: '#2B8C99',
    secondaryActive: '#206B77',
    accent: '#00C2D1', // adjusted: bright cyan
    accentHover: '#009EA6',
    accentActive: '#00787A',
    background: '#E6F7FA', // adjusted: pale blue
    backgroundSecondary: '#CDEDF6',
    surface: '#FFFFFF',
    surfaceHover: '#E6F7FA',
    text: '#0A2239', // adjusted: deep navy
    textSecondary: '#3AAFB9',
    textMuted: '#6CAFB7',
    border: '#B3E0EA',
    borderHover: '#8FD3E6',
    success: '#13CE66',
    successHover: '#0FA34A',
    warning: '#F7B801',
    warningHover: '#F18701',
    error: '#E94F37',
    errorHover: '#B8321A',
    info: '#0099CC',
    infoHover: '#0077AA',
  },
  preview: {
    primary: '#0099CC',
    secondary: '#3AAFB9',
    accent: '#00C2D1',
    background: '#E6F7FA',
  },
};

/**
 * Forest color scheme - Natural greens and earth tones (adjusted)
 */
export const forestColorScheme: ColorScheme = {
  id: 'forest',
  name: 'Forest',
  description: 'Natural greens and earth tones for a calming experience',
  isDark: false,
  colors: {
    primary: '#228B22', // adjusted: forest green
    primaryHover: '#176117',
    primaryActive: '#0E3B0E',
    secondary: '#A3A847', // adjusted: olive green
    secondaryHover: '#7C8036',
    secondaryActive: '#5A5C27',
    accent: '#B7C96C', // adjusted: moss green
    accentHover: '#9AAE4B',
    accentActive: '#7C8E3A',
    background: '#F4F8F0', // adjusted: pale green
    backgroundSecondary: '#E2F0D9',
    surface: '#FFFFFF',
    surfaceHover: '#F4F8F0',
    text: '#2E3D27', // adjusted: dark olive
    textSecondary: '#5A5C27',
    textMuted: '#7C8036',
    border: '#C7D7B2',
    borderHover: '#A3A847',
    success: '#4CAF50',
    successHover: '#388E3C',
    warning: '#FFB300',
    warningHover: '#FFA000',
    error: '#D84315',
    errorHover: '#B71C1C',
    info: '#228B22',
    infoHover: '#176117',
  },
  preview: {
    primary: '#228B22',
    secondary: '#A3A847',
    accent: '#B7C96C',
    background: '#F4F8F0',
  },
};

/**
 * Sunset color scheme - Warm oranges and purples (adjusted)
 */
export const sunsetColorScheme: ColorScheme = {
  id: 'sunset',
  name: 'Sunset',
  description: 'Warm oranges and purples inspired by a beautiful sunset',
  isDark: false,
  colors: {
    primary: '#FF7043', // adjusted: sunset orange
    primaryHover: '#F4511E',
    primaryActive: '#BF360C',
    secondary: '#FFB74D', // adjusted: warm gold
    secondaryHover: '#FFA726',
    secondaryActive: '#FF9800',
    accent: '#AB47BC', // adjusted: purple
    accentHover: '#8E24AA',
    accentActive: '#6A1B9A',
    background: '#FFF3E0', // adjusted: pale orange
    backgroundSecondary: '#FFE0B2',
    surface: '#FFFFFF',
    surfaceHover: '#FFF3E0',
    text: '#4E260E', // adjusted: deep brown
    textSecondary: '#BF360C',
    textMuted: '#8D6E63',
    border: '#FFD180',
    borderHover: '#FFB74D',
    success: '#43A047',
    successHover: '#2E7D32',
    warning: '#FFB300',
    warningHover: '#FFA000',
    error: '#E53935',
    errorHover: '#B71C1C',
    info: '#AB47BC',
    infoHover: '#8E24AA',
  },
  preview: {
    primary: '#FF7043',
    secondary: '#FFB74D',
    accent: '#AB47BC',
    background: '#FFF3E0',
  },
};

/**
 * Midnight color scheme - Dark theme with deep purples (adjusted)
 */
export const midnightColorScheme: ColorScheme = {
  id: 'midnight',
  name: 'Midnight',
  description: 'Dark theme with deep purples and blues for night use',
  isDark: true,
  colors: {
    primary: '#5F3B8A', // adjusted: deep purple
    primaryHover: '#432C5C',
    primaryActive: '#2C1B3A',
    secondary: '#2D3142', // adjusted: dark blue-gray
    secondaryHover: '#4F5D75',
    secondaryActive: '#BFC0C0',
    accent: '#3A506B', // adjusted: blue
    accentHover: '#1C2541',
    accentActive: '#0B132B',
    background: '#18122B', // adjusted: deep midnight
    backgroundSecondary: '#251749',
    surface: '#2D3142',
    surfaceHover: '#3A506B',
    text: '#E0E1DD',
    textSecondary: '#BFC0C0',
    textMuted: '#4F5D75',
    border: '#3A506B',
    borderHover: '#5F3B8A',
    success: '#43A047',
    successHover: '#2E7D32',
    warning: '#FFB300',
    warningHover: '#FFA000',
    error: '#E53935',
    errorHover: '#B71C1C',
    info: '#5F3B8A',
    infoHover: '#432C5C',
  },
  preview: {
    primary: '#5F3B8A',
    secondary: '#2D3142',
    accent: '#3A506B',
    background: '#18122B',
  },
};

/**
 * High contrast color scheme - Optimized for accessibility (unchanged)
 */
export const highContrastColorScheme: ColorScheme = {
  id: 'highContrast',
  name: 'High Contrast',
  description: 'High contrast colors optimized for accessibility',
  isDark: false,
  isHighContrast: true,
  colors: {
    primary: '#000000', // Black
    primaryHover: '#1F2937', // Gray-800
    primaryActive: '#374151', // textSecondary
    secondary: '#4B5563', // Gray-600
    secondaryHover: '#374151', // textSecondary
    secondaryActive: '#1F2937', // Gray-800
    accent: '#DC2626', // error
    accentHover: '#B91C1C', // Red-700
    accentActive: '#991B1B', // Red-800
    background: '#FFFFFF', // White
    backgroundSecondary: '#F9FAFB', // Gray-50
    surface: '#FFFFFF', // White
    surfaceHover: '#F3F4F6', // Gray-100
    text: '#000000', // Black
    textSecondary: '#1F2937', // Gray-800
    textMuted: '#4B5563', // Gray-600
    border: '#000000', // Black
    borderHover: '#1F2937', // Gray-800
    success: '#059669', // Emerald-600
    successHover: '#047857', // Emerald-700
    warning: '#D97706', // Amber-600
    warningHover: '#B45309', // Amber-700
    error: '#DC2626', // error
    errorHover: '#B91C1C', // Red-700
    info: '#2563EB', // info
    infoHover: '#1D4ED8', // infoHover
  },
  preview: {
    primary: '#000000',
    secondary: '#4B5563',
    accent: '#DC2626',
    background: '#FFFFFF',
  },
};

/**
 * Light color scheme - Clean and minimal (adjusted)
 */
export const lightColorScheme: ColorScheme = {
  id: 'light',
  name: 'Light',
  description: 'Clean and minimal light theme',
  isDark: false,
  colors: {
    primary: '#1976D2', // adjusted: blue-700
    primaryHover: '#1565C0',
    primaryActive: '#0D47A1',
    secondary: '#CFD8DC', // lighter: blue-gray-100
    secondaryHover: '#B0BEC5', // lighter: blue-gray-200
    secondaryActive: '#90A4AE', // lighter: blue-gray-300
    accent: '#FFB300', // adjusted: amber-600
    accentHover: '#FFA000',
    accentActive: '#FF8F00',
    background: '#FAFAFA', // adjusted: gray-50
    backgroundSecondary: '#F5F5F5',
    surface: '#FFFFFF',
    surfaceHover: '#F5F5F5',
    text: '#212121', // adjusted: gray-900
    textSecondary: '#333333',
    textMuted: '#9E9E9E',
    border: '#E0E0E0',
    borderHover: '#BDBDBD',
    success: '#388E3C',
    successHover: '#2E7D32',
    warning: '#FFA000',
    warningHover: '#FF8F00',
    error: '#D32F2F',
    errorHover: '#B71C1C',
    info: '#1976D2',
    infoHover: '#1565C0',
  },
  preview: {
    primary: '#1976D2',
    secondary: '#90A4AE',
    accent: '#FFB300',
    background: '#FAFAFA',
  },
};

/**
 * Dark color scheme - Modern dark theme (adjusted)
 */
export const darkColorScheme: ColorScheme = {
  id: 'dark',
  name: 'Dark',
  description: 'Optimized modern dark theme for comfortable viewing',
  isDark: true,
  colors: {
    primary: '#90CAF9', // adjusted: blue-200
    primaryHover: '#64B5F6', // blue-300
    primaryActive: '#1976D2', // blue-700
    secondary: '#B0BEC5', // blue-gray-200
    secondaryHover: '#78909C', // blue-gray-400
    secondaryActive: '#455A64', // blue-gray-700
    accent: '#FFD54F', // amber-300
    accentHover: '#FFB300', // amber-600
    accentActive: '#FFA000', // amber-700
    background: '#121212', // true dark
    backgroundSecondary: '#1A1A1A', // light dark
    surface: '#232323',
    surfaceHover: '#333333',
    text: '#FAFAFA', // white
    textSecondary: '#B0BEC5', // blue-gray-200
    textMuted: '#78909C', // blue-gray-400
    border: '#333333',
    borderHover: '#444444',
    success: '#66BB6A', // green-400
    successHover: '#388E3C',
    warning: '#FFD54F', // amber-300
    warningHover: '#FFB300',
    error: '#E57373', // red-300
    errorHover: '#D32F2F',
    info: '#90CAF9', // blue-200
    infoHover: '#64B5F6',
  },
  preview: {
    primary: '#90CAF9',
    secondary: '#B0BEC5',
    accent: '#FFD54F',
    background: '#121212',
  },
};

/**
 * Default color scheme (same as light)
 */
export const defaultColorScheme: ColorScheme = {
  ...lightColorScheme,
  id: 'default',
  name: 'Default',
  description: 'Default color scheme',
  preview: {
    primary: '#1976D2',
    secondary: '#90A4AE',
    accent: '#FFB300',
    background: '#FAFAFA',
  },
};

/**
 * All available color schemes
 */
export const colorSchemes: ThemeColorSchemes = {
  default: defaultColorScheme,
  light: lightColorScheme,
  dark: darkColorScheme,
  highContrast: highContrastColorScheme,
  ocean: oceanColorScheme,
  forest: forestColorScheme,
  sunset: sunsetColorScheme,
  midnight: midnightColorScheme,
};

/**
 * Get a color scheme by ID
 */
export function getColorScheme(id: string): ColorScheme | undefined {
  return colorSchemes[id];
}

/**
 * Get all available color schemes
 */
export function getAllColorSchemes(): ColorScheme[] {
  return Object.values(colorSchemes);
}

/**
 * Get color schemes by category
 */
export function getColorSchemesByCategory() {
  return {
    light: [lightColorScheme, oceanColorScheme, forestColorScheme, sunsetColorScheme],
    dark: [darkColorScheme, midnightColorScheme],
    accessibility: [highContrastColorScheme],
    all: getAllColorSchemes(),
  };
}
