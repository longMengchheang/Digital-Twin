import {
  index,
  integer,
  pgTable,
  real,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const chatConversations = pgTable(
  'chat_conversations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull(),
    title: text('title').notNull().default('New Conversation'),
    lastMessagePreview: text('last_message_preview').notNull().default(''),
    messageCount: integer('message_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userUpdatedIndex: index('chat_conversations_user_updated_idx').on(table.userId, table.updatedAt),
  }),
);

export const chatMessages = pgTable(
  'chat_messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    chatId: uuid('chat_id')
      .notNull()
      .references(() => chatConversations.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    role: varchar('role', { length: 16 }).notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    chatCreatedIndex: index('chat_messages_chat_created_idx').on(table.chatId, table.createdAt),
    userCreatedIndex: index('chat_messages_user_created_idx').on(table.userId, table.createdAt),
  }),
);

export const chatSignals = pgTable(
  'chat_signals',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull(),
    messageId: uuid('message_id')
      .notNull()
      .references(() => chatMessages.id, { onDelete: 'cascade' }),
    signalType: text('signal_type').notNull(),
    intensity: smallint('intensity').notNull(),
    confidence: real('confidence').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userSignalCreatedIndex: index('chat_signals_user_signal_created_idx').on(table.userId, table.signalType, table.createdAt),
    messageSignalUnique: uniqueIndex('chat_signals_message_signal_uidx').on(table.messageId, table.signalType),
  }),
);

export const featureSignals = pgTable(
  'feature_signals',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull(),
    source: text('source').notNull(),
    sourceRef: text('source_ref'),
    signalType: text('signal_type').notNull(),
    intensity: smallint('intensity').notNull(),
    confidence: real('confidence').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userSourceCreatedIndex: index('feature_signals_user_source_created_idx').on(table.userId, table.source, table.createdAt),
    userSignalCreatedIndex: index('feature_signals_user_signal_created_idx').on(table.userId, table.signalType, table.createdAt),
  }),
);

export const behaviorNodes = pgTable(
  'behavior_nodes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull(),
    nodeKey: text('node_key').notNull(),
    nodeType: text('node_type').notNull(),
    label: text('label').notNull(),
    strength: integer('strength').notNull().default(0),
    occurrences: integer('occurrences').notNull().default(0),
    lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userNodeUnique: uniqueIndex('behavior_nodes_user_node_uidx').on(table.userId, table.nodeKey),
    userTypeUpdatedIndex: index('behavior_nodes_user_type_updated_idx').on(table.userId, table.nodeType, table.lastUpdated),
  }),
);

export const behaviorConnections = pgTable(
  'behavior_connections',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull(),
    fromNodeKey: text('from_node_key').notNull(),
    toNodeKey: text('to_node_key').notNull(),
    weight: integer('weight').notNull().default(0),
    reason: text('reason').notNull().default(''),
    lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userFromToUnique: uniqueIndex('behavior_connections_user_from_to_uidx').on(table.userId, table.fromNodeKey, table.toNodeKey),
    userLastUpdatedIndex: index('behavior_connections_user_last_updated_idx').on(table.userId, table.lastUpdated),
  }),
);
