import { and, desc, eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { CHAT_SIGNAL_TYPES, parseSignalResponseText } from '@/lib/chatSignals';
import { getNeonDb } from '@/lib/neon/db';
import { chatConversations, chatMessages, chatSignals } from '@/lib/neon/schema';

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
    finishReason?: string;
  }>;
}

interface ConversationEntry {
  role: 'user' | 'ai';
  content: string;
}

interface GeminiGenerationResult {
  text: string;
  model: string;
  finishReason?: string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function shorten(value: string, maxLength: number): string {
  const normalized = String(value || '').trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trim()}...`;
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

function wordCount(text: string): number {
  return String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function hasSentenceEnding(text: string): boolean {
  return /[.!?]["')\]]*$/.test(String(text || '').trim());
}

function isLikelyIncompleteReply(text: string, finishReason?: string): boolean {
  const normalized = String(text || '').trim();
  if (!normalized) {
    return true;
  }

  if (finishReason === 'MAX_TOKENS') {
    return true;
  }

  const words = wordCount(normalized);
  if (words < 8) {
    return true;
  }

  if (!hasSentenceEnding(normalized) && words < 45) {
    return true;
  }

  return false;
}

async function requestGeminiContent(model: string, payload: unknown): Promise<{ text: string; finishReason?: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set.');
  }

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
  const primaryCandidate = data.candidates?.[0];
  const parts = data.candidates?.[0]?.content?.parts || [];
  const text = parts
    .map((part) => (typeof part.text === 'string' ? part.text : ''))
    .join('\n')
    .trim();

  if (!text) {
    throw new Error('Gemini API returned an empty response.');
  }

  return {
    text,
    finishReason: primaryCandidate?.finishReason,
  };
}

function buildCompanionPayload(userMessage: string, history: ConversationEntry[]) {
  const historyContents: GeminiContent[] = history
    .filter((message) => message.content.trim())
    .slice(-14)
    .map((message) => ({
      role: message.role === 'ai' ? 'model' : 'user',
      parts: [{ text: message.content }],
    }));

  return {
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
      maxOutputTokens: 560,
    },
  };
}

function buildRepairPayload(userMessage: string, draftReply: string) {
  return {
    systemInstruction: {
      parts: [
        {
          text: [
            'You rewrite an assistant draft so it is complete and readable.',
            'Output a polished response in 2-5 complete sentences.',
            'Do not output sentence fragments.',
            'Keep the meaning practical, calm, and supportive.',
          ].join(' '),
        },
      ],
    },
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: [
              'User message:',
              userMessage,
              '',
              'Draft reply that may be cut off:',
              draftReply,
              '',
              'Rewrite the reply as a complete response.',
            ].join('\n'),
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.35,
      topP: 0.9,
      maxOutputTokens: 360,
    },
  };
}

function buildSignalPayload(userMessage: string) {
  return {
    systemInstruction: {
      parts: [
        {
          text: [
            'Extract behavioral and emotional signals from the user message.',
            'Return only JSON with this exact shape:',
            '[{"signal_type":"stress","intensity":4,"confidence":0.92}]',
            `Allowed signal_type values: ${CHAT_SIGNAL_TYPES.join(', ')}.`,
            'Rules:',
            '1) intensity must be an integer from 1 to 5.',
            '2) confidence must be a number from 0 to 1.',
            '3) include at most 4 signals.',
            '4) return [] if no clear signal exists.',
            'Do not add markdown, explanation, or extra keys.',
          ].join(' '),
        },
      ],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: userMessage }],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      topP: 0.9,
      maxOutputTokens: 220,
    },
  };
}

async function tryGeminiWithFallback(payload: unknown, preferredModel?: string): Promise<GeminiGenerationResult> {
  const candidates = uniqueValues([preferredModel || '', ...resolveModelCandidates()]);
  const modelErrors: string[] = [];

  for (const model of candidates) {
    try {
      const result = await requestGeminiContent(model, payload);
      return { text: result.text, model, finishReason: result.finishReason };
    } catch (error) {
      const errorText = error instanceof Error ? error.message : String(error);
      modelErrors.push(`[${model}] ${errorText}`);
    }
  }

  throw new Error(`All Gemini model attempts failed. ${modelErrors.join(' | ')}`);
}

async function ensureReplyQuality(userMessage: string, replyResult: GeminiGenerationResult): Promise<GeminiGenerationResult> {
  if (!isLikelyIncompleteReply(replyResult.text, replyResult.finishReason)) {
    return replyResult;
  }

  try {
    const repaired = await tryGeminiWithFallback(buildRepairPayload(userMessage, replyResult.text), replyResult.model);
    if (!isLikelyIncompleteReply(repaired.text, repaired.finishReason)) {
      return repaired;
    }
    if (wordCount(repaired.text) > wordCount(replyResult.text)) {
      return repaired;
    }
    return replyResult;
  } catch {
    return replyResult;
  }
}

async function persistStructuredSignals(
  userId: string,
  messageId: string,
  userMessage: string,
  preferredModel?: string,
) {
  try {
    const db = await getNeonDb();
    const extractionPayload = buildSignalPayload(userMessage);
    const extraction = await tryGeminiWithFallback(extractionPayload, preferredModel);
    const signals = parseSignalResponseText(extraction.text);

    if (!signals.length) {
      return [];
    }

    await db.insert(chatSignals)
      .values(
        signals.map((signal) => ({
          userId,
          messageId,
          signalType: signal.signalType,
          intensity: signal.intensity,
          confidence: signal.confidence,
        })),
      )
      .onConflictDoNothing();

    return signals;
  } catch (error) {
    console.error('Failed to persist structured chat signals:', error);
    return [];
  }
}

export async function POST(req: Request) {
  try {
    const db = await getNeonDb();

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

    let chatId = requestedChatId;

    if (chatId) {
      if (!isUuid(chatId)) {
        return NextResponse.json({ msg: 'Invalid chat id.' }, { status: 400 });
      }

      const existingChat = await db.select({ id: chatConversations.id })
        .from(chatConversations)
        .where(and(eq(chatConversations.id, chatId), eq(chatConversations.userId, user.id)))
        .limit(1);

      if (!existingChat.length) {
        return NextResponse.json({ msg: 'Chat not found.' }, { status: 404 });
      }
    } else {
      const created = await db.insert(chatConversations)
        .values({
          userId: user.id,
          title: shorten(message, 44) || 'New Conversation',
          lastMessagePreview: shorten(message, 88),
          messageCount: 0,
        })
        .returning({ id: chatConversations.id });

      chatId = created[0]?.id || '';
      if (!chatId) {
        return NextResponse.json({ msg: 'Unable to create conversation.' }, { status: 500 });
      }
    }

    const historyRows = await db.select({
      role: chatMessages.role,
      content: chatMessages.content,
    })
      .from(chatMessages)
      .where(eq(chatMessages.chatId, chatId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(24);

    const history: ConversationEntry[] = [...historyRows]
      .reverse()
      .filter((entry) => entry.role === 'user' || entry.role === 'ai')
      .map((entry) => ({
        role: entry.role as 'user' | 'ai',
        content: String(entry.content || ''),
      }));

    let companionResult: GeminiGenerationResult;
    try {
      companionResult = await tryGeminiWithFallback(buildCompanionPayload(message, history));
      companionResult = await ensureReplyQuality(message, companionResult);
    } catch (llmError) {
      console.error('Gemini generation failed:', llmError);
      return NextResponse.json(
        { msg: 'AI service is temporarily unavailable. Please try again.' },
        { status: 502 },
      );
    }

    const userMessageTimestamp = new Date();
    const aiMessageTimestamp = new Date();

    const insertedUser = await db.insert(chatMessages)
      .values({
        userId: user.id,
        chatId,
        role: 'user',
        content: message,
        createdAt: userMessageTimestamp,
        updatedAt: userMessageTimestamp,
      })
      .returning({
        id: chatMessages.id,
        createdAt: chatMessages.createdAt,
      });

    await db.insert(chatMessages)
      .values({
        userId: user.id,
        chatId,
        role: 'ai',
        content: companionResult.text,
        createdAt: aiMessageTimestamp,
        updatedAt: aiMessageTimestamp,
      });

    await db.update(chatConversations)
      .set({
        updatedAt: aiMessageTimestamp,
        lastMessagePreview: shorten(companionResult.text || message, 88),
        messageCount: sql`${chatConversations.messageCount} + 2`,
      })
      .where(and(eq(chatConversations.id, chatId), eq(chatConversations.userId, user.id)));

    const userMessageId = String(insertedUser[0]?.id || '');
    const extractedSignals = userMessageId
      ? await persistStructuredSignals(user.id, userMessageId, message, companionResult.model)
      : [];

    const userMessage = {
      role: 'user' as const,
      content: message,
      timestamp: userMessageTimestamp,
    };

    const aiMessage = {
      role: 'ai' as const,
      content: companionResult.text,
      timestamp: aiMessageTimestamp,
    };

    return NextResponse.json({
      reply: aiMessage.content,
      messages: [userMessage, aiMessage],
      chatId,
      model: companionResult.model,
      extractedSignals,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ msg: 'Server error.' }, { status: 500 });
  }
}
