import type { Config } from 'tailwindcss';
import { heroui } from '@heroui/react';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/contexts/**/*.{js,ts,jsx,tsx,mdx}',
    './src/hooks/**/*.{js,ts,jsx,tsx,mdx}',
    "../../node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        primaryHover: 'var(--color-primaryHover)',
        primaryActive: 'var(--color-primaryActive)',
        secondary: 'var(--color-secondary)',
        secondaryHover: 'var(--color-secondaryHover)',
        secondaryActive: 'var(--color-secondaryActive)',
        accent: 'var(--color-accent)',
        accentHover: 'var(--color-accentHover)',
        accentActive: 'var(--color-accentActive)',
        background: 'var(--color-background)',
        backgroundSecondary: 'var(--color-backgroundSecondary)',
        surfaceHover: 'var(--color-surfaceHover)',
        surface: 'var(--color-surface)',
        textSecondary: 'var(--color-textSecondary)',
        text: 'var(--color-text)',
        textMuted: 'var(--color-textMuted)',
        border: 'var(--color-border)',
        borderHover: 'var(--color-borderHover)',
        success: 'var(--color-success)',
        successHover: 'var(--color-successHover)',
        warning: 'var(--color-warning)',
        warningHover: 'var(--color-warningHover)',
        error: 'var(--color-error)',
        errorHover: 'var(--color-errorHover)',
        info: 'var(--color-info)',
        infoHover: 'var(--color-infoHover)',
      },
      animation: {
        'fade-in': 'fadeIn var(--duration-normal) var(--easing-default)',
        'slide-up': 'slideUp var(--duration-normal) var(--easing-default)',
        'slide-down': 'slideDown var(--duration-normal) var(--easing-default)',
        'scale-in': 'scaleIn var(--duration-fast) var(--easing-bounce)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      boxShadow: {
        'enhanced-sm': 'var(--shadow-sm)',
        'enhanced-md': 'var(--shadow-md)',
        'enhanced-lg': 'var(--shadow-lg)',
        'enhanced-xl': 'var(--shadow-xl)',
        'enhanced-inner': 'var(--shadow-inner)',
      },
      borderRadius: {
        'enhanced-sm': 'var(--radius-sm)',
        'enhanced-md': 'var(--radius-md)',
        'enhanced-lg': 'var(--radius-lg)',
        'enhanced-xl': 'var(--radius-xl)',
        'enhanced-2xl': 'var(--radius-2xl)',
      },
      spacing: {
        'component-xs': 'var(--spacing-xs)',
        'component-sm': 'var(--spacing-sm)',
        'component-md': 'var(--spacing-md)',
        'component-lg': 'var(--spacing-lg)',
        'component-xl': 'var(--spacing-xl)',
        'component-2xl': 'var(--spacing-2xl)',
      },
    },
  },
  darkMode: 'class',
  plugins: [heroui() as any],
};

export default config;