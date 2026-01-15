# Timezone Configuration Guide

This document explains how to configure timezone handling in the HumanStrengthOS project to prevent automatic timezone conversion.

## Overview

The project is configured to handle timestamps without automatic timezone conversion to ensure data consistency across different environments and timezones. All timestamps are stored and retrieved as strings to prevent any automatic conversion.

## Configuration

### Environment Variables

Add the following environment variable to your `.env` files:

```bash
# Disable automatic timezone conversion (recommended)
DATABASE_TIMEZONE=false

# Or specify a specific timezone (use with caution)
DATABASE_TIMEZONE=UTC
```

### Database Configuration

The database connections are configured with the following settings:

1. **Knex Configuration** (`apps/sos-web-api/knexfile.ts`):
   - `timezone: false` - Disables automatic timezone conversion
   - `typeCast` function - Converts all timestamp fields to strings
   - `postProcessResponse` function - Ensures all Date objects are converted to ISO strings

2. **Database Connection** (`libs/shared-database/src/connection.ts`):
   - `timezone: false` - Disables timezone conversion at the connection level
   - PostgreSQL options: `-c timezone=UTC -c log_timezone=UTC`

### Migration Configuration

All database migrations use `{ useTz: false }` for timestamp columns:

```typescript
table.timestamp('created_at', { useTz: false }).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable();
```

This ensures that:
- Timestamps are stored without timezone information
- No automatic conversion occurs during database operations
- Data remains consistent across different server timezones

## Usage

### Creating Timestamps

Use the provided utility functions for consistent timestamp handling:

```typescript
import { TimestampUtils, createDatabaseTimestamp } from '@strengthos/shared-utils';

// Create a timestamp for database insertion
const timestamp = createDatabaseTimestamp();

// Or use the utility class directly
const timestamp = TimestampUtils.now();
```

### Parsing Timestamps

When retrieving timestamps from the database:

```typescript
import { parseDatabaseTimestamp } from '@strengthos/shared-utils';

// Parse timestamp from database result
const parsedTimestamp = parseDatabaseTimestamp(databaseResult.created_at);
```

### Display Timestamps

For UI display, convert timestamps to the user's timezone:

```typescript
import { TimestampUtils } from '@strengthos/shared-utils';

// Convert to user's timezone for display
const displayTime = TimestampUtils.formatForDisplay(timestamp, 'America/New_York');
```

## Best Practices

1. **Always use UTC for storage**: Store all timestamps in UTC format
2. **Convert for display only**: Only convert timezones when displaying to users
3. **Use utility functions**: Always use the provided utility functions for timestamp operations
4. **Avoid Date objects**: Prefer string timestamps to prevent automatic conversion
5. **Test across timezones**: Test your application in different timezone environments

## Troubleshooting

### Common Issues

1. **Automatic timezone conversion still occurring**:
   - Check that `DATABASE_TIMEZONE=false` is set in your environment
   - Verify that the database connection is using the correct configuration
   - Ensure all timestamp fields use `{ useTz: false }` in migrations

2. **Inconsistent timestamp formats**:
   - Use the `TimestampUtils` class for all timestamp operations
   - Avoid mixing different timestamp handling approaches
   - Check that `typeCast` and `postProcessResponse` functions are working correctly

3. **Date objects being created**:
   - Ensure `postProcessResponse` function is converting Date objects to strings
   - Use `TimestampUtils.parseFromDatabase()` for all database timestamp parsing

### Verification

To verify that timezone conversion is disabled:

1. Check database connection logs for timezone settings
2. Inspect raw database queries to ensure timestamps are strings
3. Test timestamp operations across different server timezones
4. Verify that `typeCast` function is returning strings for timestamp fields

## Migration from Previous Configuration

If you're migrating from a configuration that had automatic timezone conversion:

1. Update environment variables to set `DATABASE_TIMEZONE=false`
2. Review all timestamp handling code to use the new utility functions
3. Test thoroughly to ensure no data inconsistencies
4. Consider data migration if existing timestamps need to be normalized

## Related Files

- `apps/sos-web-api/knexfile.ts` - Knex configuration
- `libs/shared-database/src/connection.ts` - Database connection configuration
- `libs/shared-utils/src/timestamp.utils.ts` - Timestamp utility functions
- `libs/shared-validation/src/connection-config-schemas.ts` - Configuration schemas
- `apps/sos-web-api/migrations/` - Database migrations with timezone settings
