import { describe, expect, test, beforeAll, afterAll } from 'bun:test';
import mongoose from 'mongoose';
import dbConnect from './db';
import ChatMessage from './models/ChatMessage';
import ChatConversation from './models/ChatConversation';

describe('Chat History Pagination', () => {
  let userId: string;
  let chatId: string;

  beforeAll(async () => {
    await dbConnect();
    userId = new mongoose.Types.ObjectId().toString();
    chatId = new mongoose.Types.ObjectId().toString();

    // Seed 100 messages
    const messages = [];
    const baseTime = Date.now();
    for (let i = 0; i < 100; i++) {
      messages.push({
        chatId,
        userId,
        role: i % 2 === 0 ? 'user' : 'ai',
        content: `Message number ${i}`,
        createdAt: new Date(baseTime + i * 1000),
      });
    }
    await ChatMessage.insertMany(messages);
  });

  afterAll(async () => {
    if (chatId) {
      await ChatMessage.deleteMany({ chatId });
    }
  });

  test('should fetch latest 10 messages correctly', async () => {
    const limit = 10;
    const query: any = { chatId, userId };

    // Logic from API
    const messagesRaw = await ChatMessage.find(query)
        .select('_id role content createdAt')
        .sort({ createdAt: -1 })
        .limit(limit + 1)
        .lean();

    const hasMore = messagesRaw.length > limit;
    const messagesSlice = hasMore ? messagesRaw.slice(0, limit) : messagesRaw;
    // @ts-ignore
    const nextCursor = messagesSlice.length > 0 ? messagesSlice[messagesSlice.length - 1].createdAt : null;
    const messages = messagesSlice.reverse();

    expect(messages.length).toBe(10);
    expect(hasMore).toBe(true);
    // Should be messages 90-99
    // @ts-ignore
    expect(messages[0].content).toBe('Message number 90');
    // @ts-ignore
    expect(messages[9].content).toBe('Message number 99');
    expect(nextCursor).toBeDefined();
  });

  test('should fetch previous 10 messages using cursor', async () => {
    // First fetch to get cursor
    const limit = 10;
    const firstQuery: any = { chatId, userId };
    const firstBatch = await ChatMessage.find(firstQuery)
        .sort({ createdAt: -1 })
        .limit(limit + 1)
        .lean();

    const firstSlice = firstBatch.slice(0, limit);
    // @ts-ignore
    const cursor = firstSlice[firstSlice.length - 1].createdAt;

    // Second fetch with cursor
    const query: any = { chatId, userId, createdAt: { $lt: cursor } };

    const messagesRaw = await ChatMessage.find(query)
        .select('_id role content createdAt')
        .sort({ createdAt: -1 })
        .limit(limit + 1)
        .lean();

    const hasMore = messagesRaw.length > limit;
    const messagesSlice = hasMore ? messagesRaw.slice(0, limit) : messagesRaw;
    const messages = messagesSlice.reverse();

    expect(messages.length).toBe(10);
    expect(hasMore).toBe(true);
    // Should be messages 80-89
    // @ts-ignore
    expect(messages[0].content).toBe('Message number 80');
    // @ts-ignore
    expect(messages[9].content).toBe('Message number 89');
  });
});
