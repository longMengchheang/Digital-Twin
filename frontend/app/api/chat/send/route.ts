import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import Chat from '@/lib/models/Chat';
import ChatSignal from '@/lib/models/ChatSignal';
import { extractChatSignals } from '@/lib/chatSignals';

export const dynamic = 'force-dynamic';

interface SendPayload {
  message?: string;
  chatId?: string;
}

interface GeminiPart {
  text?: string;
}

interface GeminiContent {
  role?: 'user' | 'model';
  parts?: GeminiPart[];
}

interface GeminiResponse {
  candidates?: Array<{
    content?: GeminiContent;
  }>;
}

interface ConversationEntry {
  role: 'user' | 'ai';
  content: string;
}

interface GeminiGenerationResult {
  reply: string;
  model: string;
}

function toDayKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function uniqueValues(values: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values) {
    const normalized = value.trim();
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    output.push(normalized);
  }
  return output;
}

function resolveModelCandidates(): string[] {
  const primary = String(process.env.GEMINI_MODEL || '').trim();
  const fromEnv = String(process.env.GEMINI_FALLBACK_MODELS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return uniqueValues([
    primary,
    ...fromEnv,
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-flash-latest',
  ]);
}

async function requestGeminiContent(model: string, userMessage: string, history: ConversationEntry[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set.');
  }

  const historyContents: GeminiContent[] = history
    .filter((message) => message.content.trim())
    .slice(-14)
    .map((message) => ({
      role: message.role === 'ai' ? 'model' : 'user',
      parts: [{ text: message.content }],
    }));

  const payload = {
    systemInstruction: {
      parts: [
        {
          text: [
            'You are the Digital Twin Companion, a calm and practical assistant.',
            'Be warm, clear, and action-oriented.',
            'Help with focus, routines, stress regulation, and daily planning.',
            'Use concrete steps, short checklists, and reflective follow-up questions when useful.',
            'Do not fabricate personal history or claim capabilities you do not have.',
            'Avoid medical diagnosis and legal or financial advice.',
            'If the user sounds in crisis or unsafe, encourage contacting trusted support and local emergency services.',
            'Keep responses concise: 2-5 short sentences unless the user explicitly asks for detail.',
          ].join(' '),
        },
      ],
    },
    contents: [
      ...historyContents,
      {
        role: 'user',
        parts: [{ text: userMessage }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 320,
    },
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as GeminiResponse;
  const parts = data.candidates?.[0]?.content?.parts || [];
  const reply = parts
    .map((part) => (typeof part.text === 'string' ? part.text : ''))
    .join('\n')
    .trim();

  if (!reply) {
    throw new Error('Gemini API returned an empty response.');
  }

  return reply;
}

async function generateGeminiReply(userMessage: string, history: ConversationEntry[]): Promise<GeminiGenerationResult> {
  const candidates = resolveModelCandidates();
  const modelErrors: string[] = [];

  for (const model of candidates) {
    try {
      const reply = await requestGeminiContent(model, userMessage, history);
      return { reply, model };
    } catch (error) {
      const errorText = error instanceof Error ? error.message : String(error);
      modelErrors.push(`[${model}] ${errorText}`);
    }
  }

  throw new Error(`All Gemini model attempts failed. ${modelErrors.join(' | ')}`);
}

async function persistKeywordSignals(userId: string, content: string, timestamp: Date): Promise<void> {
  const extractedSignals = extractChatSignals(content);
  if (!extractedSignals.length) {
    return;
  }

  const dayKey = toDayKey(timestamp);

  await Promise.all(
    extractedSignals.map((signal) =>
      ChatSignal.findOneAndUpdate(
        {
          userId,
          dayKey,
          keyword: signal.keyword,
          source: 'chat',
        },
        {
          $inc: { count: signal.count },
          $set: { date: timestamp, lastMessageAt: timestamp },
        },
        { upsert: true, setDefaultsOnInsert: true },
      ),
    ),
  );
}

export async function POST(req: Request) {
  try {
    await dbConnect();

    const user = verifyToken(req);
    if (!user) {
      return NextResponse.json({ msg: 'No token, authorization denied.' }, { status: 401 });
    }

    const body = (await req.json()) as SendPayload;
    const message = String(body.message || '').trim();
    const requestedChatId = String(body.chatId || '').trim();

    if (!message) {
      return NextResponse.json({ msg: 'Message is required.' }, { status: 400 });
    }
    if (message.length > 4000) {
      return NextResponse.json({ msg: 'Message is too long.' }, { status: 400 });
    }

    let targetChat: any = null;

    if (requestedChatId) {
      if (!mongoose.Types.ObjectId.isValid(requestedChatId)) {
        return NextResponse.json({ msg: 'Invalid chat id.' }, { status: 400 });
      }
      targetChat = await Chat.findOne({ _id: requestedChatId, userId: user.id });
      if (!targetChat) {
        return NextResponse.json({ msg: 'Chat not found.' }, { status: 404 });
      }
    }

    const history: ConversationEntry[] = (targetChat?.messages || [])
      .filter((entry) => entry.role === 'user' || entry.role === 'ai')
      .slice(-24)
      .map((entry) => ({
        role: entry.role as 'user' | 'ai',
        content: String(entry.content || ''),
      }));

    const userTimestamp = new Date();
    const userMessage = {
      role: 'user' as const,
      content: message,
      timestamp: userTimestamp,
    };

    try {
      await persistKeywordSignals(user.id, message, userTimestamp);
    } catch (signalError) {
      console.error('Failed to persist chat keyword signals:', signalError);
    }

    let generation: GeminiGenerationResult;
    try {
      generation = await generateGeminiReply(message, history);
    } catch (llmError) {
      console.error('Gemini generation failed:', llmError);
      return NextResponse.json(
        { msg: 'AI service is temporarily unavailable. Please try again.' },
        { status: 502 },
      );
    }

    const aiMessage = {
      role: 'ai' as const,
      content: generation.reply,
      timestamp: new Date(),
    };

    let chatId = '';

    if (targetChat) {
      targetChat.messages.push(userMessage, aiMessage);
      await targetChat.save();
      chatId = String(targetChat._id);
    } else {
      const createdChat = await Chat.create({
        userId: user.id,
        messages: [userMessage, aiMessage],
      });
      chatId = String(createdChat._id);
    }

    return NextResponse.json({
      reply: aiMessage.content,
      messages: [userMessage, aiMessage],
      chatId,
      model: generation.model,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ msg: 'Server error.' }, { status: 500 });
  }
}
