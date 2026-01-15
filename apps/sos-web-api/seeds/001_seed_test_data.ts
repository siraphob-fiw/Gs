import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing data in reverse order of dependencies

  await knex('users').del();
  await knex('tenants').del();

  // Create test tenants - PostgreSQL will generate UUIDs automatically
  await knex('tenants').insert([
    // Free Plan tenant for self-training users
    // Uses a well-known ID so registration can assign new users to this tenant
    {
      name: 'Free Plan',
      status: 'ACTIVE',
      settings: JSON.stringify({
        allowSelfCoached: true,
        requireCoachApproval: false,
        enableVideoAnalysis: false, // Limited features for free plan
        defaultLanguage: 'en',
        availableLanguages: ['en'],
        maxCoaches: 0,
        maxAthletes: -1, // Unlimited for free tier
        is_free: true,
      }),
    },
    // Eastside Barbell Thailand (paid tenant)
    {
      name: 'Eastside Barbell Thailand',
      status: 'ACTIVE',
      settings: JSON.stringify({
        allowSelfCoached: true,
        requireCoachApproval: false,
        enableVideoAnalysis: true,
        defaultLanguage: 'en',
        availableLanguages: ['en', 'th'],
        maxCoaches: 10,
        maxAthletes: 100,
      }),
    },
  ]).returning('id');

  // Create test users
  await knex('users').insert([
    // Super Admin (system-wide access)
    {
      email: 'admin@strengthos.com',
      password_hash: '$2b$10$Frhz5Tllf3W0CVtLrgk5QeqC4bkVJONey9lyH/IDTPEvA0NB2IHVu', // Admin123!
      salt: 'example-salt',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      first_name: 'System',
      last_name: 'Administrator',
      preferences: JSON.stringify({
        language: 'en',
        weightUnit: 'KG',
        dateFormat: 'YYYY-MM-DD',
        timeFormat: '24h',
        timezone: 'UTC'
      }),
      email_verified_at: new Date()
    },
  ]).returning('*');
}
