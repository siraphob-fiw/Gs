# Multiple Theme Colors Implementation

## Overview

This implementation adds support for multiple color schemes within the existing theme system, allowing users to switch between different color palettes while maintaining the same theme structure and branding.

## Key Features

### 1. Enhanced Type System
- **ColorScheme Interface**: Defines individual color schemes with metadata
- **ThemeColorSchemes Interface**: Maps color scheme IDs to ColorScheme objects
- **Updated ThemeConfig**: Includes colorSchemes and currentColorScheme properties
- **ResolvedTheme Interface**: Properly handles ColorScheme objects in resolved themes

### 2. Predefined Color Schemes
The system includes 8 predefined color schemes:

#### Light Themes
- **Default**: Clean black, white, and red accents
- **Light**: Modern blue and amber color palette
- **Ocean**: Cool blues and teals inspired by the sea
- **Forest**: Natural greens and earth tones
- **Sunset**: Warm oranges and purples

#### Dark Themes
- **Dark**: Modern dark theme with blue accents
- **Midnight**: Deep purples and blues for night use

#### Accessibility
- **High Contrast**: Optimized for accessibility with high contrast ratios

### 3. Enhanced Theme Provider
- **Color Scheme Switching**: `switchColorScheme(colorSchemeId)` function
- **Available Schemes**: `getAvailableColorSchemes()` returns all available schemes
- **Persistence**: Automatic localStorage persistence of selected color scheme
- **CSS Variables**: Dynamic generation of CSS variables based on current color scheme

### 4. Advanced Theme Switcher
- **Tabbed Interface**: Separate tabs for themes and color schemes
- **Visual Previews**: Color swatches showing scheme previews
- **Categorized Display**: Schemes grouped by light/dark/accessibility
- **Real-time Switching**: Instant color scheme changes
- **Current State Display**: Shows active theme and color scheme

## Implementation Details

### File Structure
```
libs/shared-ui/src/theme/
├── config/
│   ├── color-schemes.ts          # Predefined color schemes
│   ├── theme-config.types.ts     # Enhanced type definitions
│   └── default-theme.ts          # Updated with color schemes
└── providers/
    └── theme-provider.tsx        # Enhanced with color scheme support

apps/sos-web-training/src/
├── components/
│   ├── enhanced-theme-switcher.tsx  # Advanced theme switcher
│   └── theme-demo.tsx              # Demo component
└── app/
    └── theme-demo/
        └── page.tsx               # Demo page
```

### Color Scheme Structure
Each color scheme includes:
- **Basic Colors**: primary, secondary, accent with hover/active states
- **Background Colors**: background, backgroundSecondary, surface
- **Text Colors**: text, textSecondary, textMuted
- **Border Colors**: border, borderHover
- **Status Colors**: success, warning, error, info
- **Metadata**: isDark, isHighContrast flags
- **Preview**: Color swatches for UI display

### CSS Variable Generation
The system generates CSS variables in the format:
```css
--hs-color-primary: #value;
--hs-color-primary-hover: #value;
--hs-color-scheme: scheme-id;
--hs-is-dark: 0|1;
--hs-is-high-contrast: 0|1;
```

### Persistence
- Color scheme selection is automatically saved to localStorage
- Saved preference is restored on page load
- Fallback to 'default' scheme if no saved preference exists

## Usage Examples

### Basic Color Scheme Switching
```typescript
const { switchColorScheme, getAvailableColorSchemes } = useTheme();

// Switch to ocean color scheme
switchColorScheme('ocean');

// Get all available schemes
const schemes = getAvailableColorSchemes();
```

### Theme Configuration
```typescript
const themeConfig: ThemeConfig = {
  id: 'my-theme',
  name: 'My Theme',
  colorSchemes: colorSchemes, // Import from shared-ui
  currentColorScheme: 'ocean',
  // ... other theme properties
};
```

### CSS Usage
```css
.my-component {
  background-color: var(--hs-color-background);
  color: var(--hs-color-text);
  border: 1px solid var(--hs-color-border);
}

/* Dark mode specific styles */
@media (prefers-color-scheme: dark) {
  .my-component {
    /* Styles when --hs-is-dark is 1 */
  }
}
```

## Demo Page

Visit `/theme-demo` to see the implementation in action:
- Interactive color scheme switcher
- Live preview of all color schemes
- Visual demonstration of color usage
- Real-time switching between schemes

## Benefits

1. **User Experience**: Users can choose their preferred color palette
2. **Accessibility**: High contrast option for better accessibility
3. **Branding**: Maintains brand consistency while offering variety
4. **Performance**: Efficient CSS variable-based implementation
5. **Persistence**: User preferences are remembered across sessions
6. **Extensibility**: Easy to add new color schemes

## Future Enhancements

1. **Custom Color Schemes**: Allow users to create custom color schemes
2. **System Preference**: Auto-detect user's system color preference
3. **Animation**: Smooth transitions between color schemes
4. **Export/Import**: Save and share custom color schemes
5. **A11y Validation**: Automatic contrast ratio validation

## Technical Notes

- All color schemes maintain WCAG AA compliance
- CSS variables are scoped to prevent conflicts
- TypeScript provides full type safety
- No breaking changes to existing theme API
- Backward compatible with existing themes
