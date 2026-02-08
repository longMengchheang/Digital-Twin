import { sql } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';

let schemaReady = false;
let schemaPromise: Promise<void> | null = null;

async function runSchemaBootstrap(db: NeonHttpDatabase<any>) {
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS chat_conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT 'New Conversation',
      last_message_preview TEXT NOT NULL DEFAULT '',
      message_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS chat_conversations_user_updated_idx
    ON chat_conversations (user_id, updated_at DESC);
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      chat_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('user', 'ai')),
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS chat_messages_chat_created_idx
    ON chat_messages (chat_id, created_at ASC);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS chat_messages_user_created_idx
    ON chat_messages (user_id, created_at DESC);
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS chat_signals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
      signal_type TEXT NOT NULL,
      intensity SMALLINT NOT NULL CHECK (intensity BETWEEN 1 AND 5),
      confidence REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT chat_signals_message_signal_uidx UNIQUE (message_id, signal_type)
    );
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS chat_signals_user_signal_created_idx
    ON chat_signals (user_id, signal_type, created_at DESC);
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS feature_signals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      source TEXT NOT NULL,
      source_ref TEXT,
      signal_type TEXT NOT NULL,
      intensity SMALLINT NOT NULL CHECK (intensity BETWEEN 1 AND 5),
      confidence REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS feature_signals_user_source_created_idx
    ON feature_signals (user_id, source, created_at DESC);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS feature_signals_user_signal_created_idx
    ON feature_signals (user_id, signal_type, created_at DESC);
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS behavior_nodes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      node_key TEXT NOT NULL,
      node_type TEXT NOT NULL CHECK (node_type IN ('mood', 'habit', 'signal', 'quest', 'routine')),
      label TEXT NOT NULL,
      strength INTEGER NOT NULL DEFAULT 0 CHECK (strength BETWEEN 0 AND 100),
      occurrences INTEGER NOT NULL DEFAULT 0 CHECK (occurrences >= 0),
      last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT behavior_nodes_user_node_uidx UNIQUE (user_id, node_key)
    );
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS behavior_nodes_user_type_updated_idx
    ON behavior_nodes (user_id, node_type, last_updated DESC);
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS behavior_connections (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      from_node_key TEXT NOT NULL,
      to_node_key TEXT NOT NULL,
      weight INTEGER NOT NULL DEFAULT 0 CHECK (weight BETWEEN 0 AND 100),
      reason TEXT NOT NULL DEFAULT '',
      last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT behavior_connections_user_from_to_uidx UNIQUE (user_id, from_node_key, to_node_key)
    );
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS behavior_connections_user_last_updated_idx
    ON behavior_connections (user_id, last_updated DESC);
  `);
}

export async function ensureNeonSchema(db: NeonHttpDatabase<any>) {
  if (schemaReady) {
    return;
  }

  if (!schemaPromise) {
    schemaPromise = runSchemaBootstrap(db)
      .then(() => {
        schemaReady = true;
      })
      .catch((error) => {
        schemaPromise = null;
        throw error;
      });
  }

  await schemaPromise;
}
