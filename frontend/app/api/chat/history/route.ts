import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import Chat from '@/lib/models/Chat';

export const dynamic = 'force-dynamic';

type ChatMessageRole = 'user' | 'ai' | 'system';

interface ChatMessageLike {
  _id?: string;
  role?: ChatMessageRole;
  content?: string;
  timestamp?: Date | string;
}

interface ChatLike {
  _id: string;
  messages?: ChatMessageLike[];
  updatedAt?: Date | string;
}

function shorten(text: string, maxLength: number): string {
  const normalized = String(text || '').trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trim()}...`;
}

function userFacingMessages(chat: ChatLike): ChatMessageLike[] {
  return (Array.isArray(chat.messages) ? chat.messages : []).filter((message) => {
    return message.role === 'user' || message.role === 'ai';
  });
}

function toChatSummary(chat: ChatLike) {
  const messages = userFacingMessages(chat);
  const firstUserMessage = messages.find((message) => message.role === 'user');
  const lastMessage = messages[messages.length - 1];
  const title = shorten(String(firstUserMessage?.content || 'New Conversation'), 44) || 'New Conversation';
  const preview = shorten(String(lastMessage?.content || 'No messages yet.'), 88) || 'No messages yet.';

  return {
    id: String(chat._id),
    title,
    preview,
    updatedAt: new Date(chat.updatedAt || Date.now()).toISOString(),
    messageCount: messages.length,
  };
}

function toClientMessage(message: ChatMessageLike, index: number) {
  return {
    id: String(message._id || `m-${index}`),
    role: message.role,
    content: String(message.content || ''),
    timestamp: new Date(message.timestamp || Date.now()).toISOString(),
  };
}

export async function GET(req: Request) {
  try {
    await dbConnect();

    const user = verifyToken(req);
    if (!user) {
      return NextResponse.json({ msg: 'No token, authorization denied.' }, { status: 401 });
    }

    const url = new URL(req.url);
    const chatId = String(url.searchParams.get('chatId') || '').trim();

    if (chatId) {
      if (!mongoose.Types.ObjectId.isValid(chatId)) {
        return NextResponse.json({ msg: 'Invalid chat id.' }, { status: 400 });
      }

      const chat = await Chat.findOne({ _id: chatId, userId: user.id }).lean();
      if (!chat) {
        return NextResponse.json({ msg: 'Chat not found.' }, { status: 404 });
      }

      const messages = userFacingMessages(chat as unknown as ChatLike)
        .map((message, index) => toClientMessage(message, index));

      return NextResponse.json({
        chat: toChatSummary(chat as unknown as ChatLike),
        messages,
      });
    }

    const chats = await Chat.find({ userId: user.id })
      .sort({ updatedAt: -1, _id: -1 })
      .limit(60)
      .lean();

    const summaries = chats.map((chat) => toChatSummary(chat as unknown as ChatLike));
    return NextResponse.json({ chats: summaries });
  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json({ msg: 'Server error.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await dbConnect();

    const user = verifyToken(req);
    if (!user) {
      return NextResponse.json({ msg: 'No token, authorization denied.' }, { status: 401 });
    }

    await Chat.deleteMany({ userId: user.id });
    return NextResponse.json({ msg: 'Chat history cleared.' });
  } catch (error) {
    console.error('Error clearing history:', error);
    return NextResponse.json({ msg: 'Server error.' }, { status: 500 });
  }
}
