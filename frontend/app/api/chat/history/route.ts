import { and, asc, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getNeonDb } from '@/lib/neon/db';
import { chatConversations, chatMessages } from '@/lib/neon/schema';

export const dynamic = 'force-dynamic';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function shorten(text: string, maxLength: number): string {
  const normalized = String(text || '').trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trim()}...`;
}

export async function GET(req: Request) {
  try {
    const db = await getNeonDb();

    const user = verifyToken(req);
    if (!user) {
      return NextResponse.json({ msg: 'No token, authorization denied.' }, { status: 401 });
    }

    const url = new URL(req.url);
    const chatId = String(url.searchParams.get('chatId') || '').trim();

    if (chatId) {
      if (!isUuid(chatId)) {
        return NextResponse.json({ msg: 'Invalid chat id.' }, { status: 400 });
      }

      const conversationRows = await db.select({
        id: chatConversations.id,
        title: chatConversations.title,
        preview: chatConversations.lastMessagePreview,
        updatedAt: chatConversations.updatedAt,
        messageCount: chatConversations.messageCount,
      })
        .from(chatConversations)
        .where(and(eq(chatConversations.id, chatId), eq(chatConversations.userId, user.id)))
        .limit(1);

      if (!conversationRows.length) {
        return NextResponse.json({ msg: 'Chat not found.' }, { status: 404 });
      }

      const messages = await db.select({
        id: chatMessages.id,
        role: chatMessages.role,
        content: chatMessages.content,
        createdAt: chatMessages.createdAt,
      })
        .from(chatMessages)
        .where(and(eq(chatMessages.chatId, chatId), eq(chatMessages.userId, user.id)))
        .orderBy(asc(chatMessages.createdAt));

      return NextResponse.json({
        chat: {
          id: conversationRows[0].id,
          title: conversationRows[0].title,
          preview: conversationRows[0].preview,
          updatedAt: new Date(conversationRows[0].updatedAt || Date.now()).toISOString(),
          messageCount: Number(conversationRows[0].messageCount || 0),
        },
        messages: messages
          .filter((message) => message.role === 'user' || message.role === 'ai')
          .map((message) => ({
            id: message.id,
            role: message.role,
            content: message.content,
            timestamp: new Date(message.createdAt || Date.now()).toISOString(),
          })),
      });
    }

    const conversations = await db.select({
      id: chatConversations.id,
      title: chatConversations.title,
      preview: chatConversations.lastMessagePreview,
      updatedAt: chatConversations.updatedAt,
      messageCount: chatConversations.messageCount,
    })
      .from(chatConversations)
      .where(eq(chatConversations.userId, user.id))
      .orderBy(desc(chatConversations.updatedAt))
      .limit(60);

    return NextResponse.json({
      chats: conversations.map((row) => ({
        id: row.id,
        title: shorten(String(row.title || 'New Conversation'), 44) || 'New Conversation',
        preview: shorten(String(row.preview || 'No messages yet.'), 88) || 'No messages yet.',
        updatedAt: new Date(row.updatedAt || Date.now()).toISOString(),
        messageCount: Number(row.messageCount || 0),
      })),
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json({ msg: 'Server error.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const db = await getNeonDb();

    const user = verifyToken(req);
    if (!user) {
      return NextResponse.json({ msg: 'No token, authorization denied.' }, { status: 401 });
    }

    await db.delete(chatConversations).where(eq(chatConversations.userId, user.id));
    return NextResponse.json({ msg: 'Chat history cleared.' });
  } catch (error) {
    console.error('Error clearing history:', error);
    return NextResponse.json({ msg: 'Server error.' }, { status: 500 });
  }
}
