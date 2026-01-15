# Development Workflow - Environment-Separated Turbo Configuration

This document describes the enhanced development workflow for the StrengthOS monorepo, featuring separate turbo configurations for development and production environments.

## Overview

The development workflow uses separate turbo configuration files to maintain clean separation between development and production environments:

- **`turbo.json`** - Production builds and CI/CD
- **`turbo.dev.json`** - Development with watch mode and hot reloading

## Quick Start

1. **Setup development scripts** (first time only):
   ```bash
   npm run setup:dev
   ```

2. **Start development mode**:
   ```bash
   # Libraries only (watch mode)
   npm run dev:libs:watch
   
   # API with library watching
   npm run dev:api
   
   # Training app with library watching  
   npm run dev:training
   
   # Full development (API + Training + Libraries)
   npm run dev:full
   
   # Interactive workflow
   node scripts/dev-workflow.js
   ```

## Configuration Files

### Production Configuration (`turbo.json`)
- Optimized for production builds
- Caching enabled for performance
- Clean dependency chains
- Used by CI/CD pipelines

### Development Configuration (`turbo.dev.json`)
- Watch mode enabled for all libraries
- Persistent tasks for continuous development
- Development-specific dependency chains
- Hot reloading support

## Available Commands

### Library Development
- `npm run dev:libs:watch` - Watch mode for all libraries using dev config
- `npm run dev:libs:build` - One-time build of all libraries using dev config
- `npm run build:libs:watch` - Turbo watch mode for library builds

### Application Development
- `npm run dev:api` - API development with library watching
- `npm run dev:training` - Training app development with library watching
- `npm run dev:full` - Full development (API + Training + Libraries)

### Workflow Management
- `npm run setup:dev` - Setup development scripts for all libraries
- `npm run dev:workflow` - Interactive development workflow
- `npm run clean:libs` - Clean all library dist folders

## Environment Separation Benefits

### 1. Clean Separation
- Development config doesn't interfere with production builds
- Different caching strategies per environment
- Environment-specific optimizations

### 2. Development Optimizations
- Watch mode enabled by default
- Faster rebuilds during development
- Better error reporting and debugging

### 3. Production Optimizations
- Aggressive caching for CI/CD
- Optimized build outputs
- Clean dependency resolution

## Development Modes

### 1. Libraries Only
```bash
npm run dev:libs:watch
```
- Uses `turbo.dev.json` configuration
- Watches all libraries for changes
- Automatically rebuilds when files change

### 2. API Development
```bash
npm run dev:api
```
- Watches libraries + runs API in development mode
- Libraries rebuild automatically when changed
- API restarts when libraries are rebuilt

### 3. Training App Development
```bash
npm run dev:training
```
- Watches libraries + runs Training app in development mode
- Libraries rebuild automatically when changed
- Training app restarts when libraries are rebuilt

### 4. Full Development
```bash
npm run dev:full
```
- Watches libraries + runs both API and Training app
- All components restart when libraries change
- Complete development environment

## Configuration Details

### Development Turbo Config (`turbo.dev.json`)
```json
{
  "tasks": {
    "dev:libs:watch": {
      "cache": false,
      "persistent": true,
      "dependsOn": ["^dev:libs:watch"]
    }
  }
}
```

### Production Turbo Config (`turbo.json`)
```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"],
      "cache": true
    }
  }
}
```

## Usage Examples

### Development Workflow
```bash
# Start development
npm run dev:libs:watch

# In another terminal
npm run dev:api
```

### Production Build
```bash
# Uses turbo.json (production config)
npm run build
```

### Custom Turbo Config
```bash
# Use specific config file
turbo run build --config=turbo.dev.json
turbo run build --config=turbo.json
```

## Troubleshooting

### Libraries Not Rebuilding
1. Check if dev scripts are set up:
   ```bash
   npm run setup:dev
   ```

2. Validate library setup:
   ```bash
   node scripts/dev-workflow.js --validate-only
   ```

### Configuration Issues
1. Verify turbo config files exist:
   ```bash
   ls turbo*.json
   ```

2. Check which config is being used:
   ```bash
   # Development commands use turbo.dev.json
   npm run dev:libs:watch
   
   # Production commands use turbo.json
   npm run build
   ```

### Performance Issues
1. Use appropriate config for your needs:
   ```bash
   # For development (faster rebuilds)
   npm run dev:libs:watch
   
   # For production (optimized builds)
   npm run build:libs
   ```

## Migration Guide

### From Single Config
If you were using a single `turbo.json`:

**Before:**
```bash
turbo run dev --filter="libs/*"
```

**After:**
```bash
# Development (uses turbo.dev.json)
npm run dev:libs:watch

# Production (uses turbo.json)
npm run build:libs
```

### Environment-Specific Commands
```bash
# Development
turbo run dev:libs:watch --config=turbo.dev.json

# Production
turbo run build --config=turbo.json
```

## Best Practices

1. **Use npm scripts** instead of direct turbo commands for consistency
2. **Keep dev config separate** from production config
3. **Validate setup** before starting development
4. **Use appropriate config** for your environment
5. **Monitor performance** and adjust configurations as needed

This environment-separated approach provides better organization, clearer separation of concerns, and optimized configurations for different use cases.
