import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/neon/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL || '',
  },
  strict: true,
  verbose: true,
} satisfies Config;
