import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '@/lib/neon/schema';
import { ensureNeonSchema } from '@/lib/neon/migrate';

type DrizzleDb = NeonHttpDatabase<typeof schema>;

declare global {
  // eslint-disable-next-line no-var
  var __neonDb: DrizzleDb | undefined;
  // eslint-disable-next-line no-var
  var __neonSchemaReady: Promise<void> | undefined;
}

function resolveConnectionString(): string {
  const value = String(process.env.NEON_DATABASE_URL || process.env.DATABASE_URL || '').trim();
  if (!value) {
    throw new Error('NEON_DATABASE_URL is not set.');
  }
  return value;
}

export async function getNeonDb() {
  if (!global.__neonDb) {
    const sql = neon(resolveConnectionString());
    global.__neonDb = drizzle(sql, { schema });
  }

  if (!global.__neonSchemaReady) {
    global.__neonSchemaReady = ensureNeonSchema(global.__neonDb);
  }

  await global.__neonSchemaReady;
  return global.__neonDb;
}
