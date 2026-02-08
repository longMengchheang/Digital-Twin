import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { normalizeDuration } from '@/lib/progression';
import { recordFeatureSignals } from '@/lib/neon/feature-signals';
import Quest from '@/lib/models/Quest';

export const dynamic = 'force-dynamic';

interface CreateQuestPayload {
  goal?: string;
  duration?: string;
}

export async function POST(req: Request) {
  try {
    await dbConnect();

    const user = verifyToken(req);
    if (!user) {
      return NextResponse.json({ msg: 'No token, authorization denied.' }, { status: 401 });
    }

    const body = (await req.json()) as CreateQuestPayload;
    const goal = String(body.goal || '').trim();
    const duration = normalizeDuration(String(body.duration || 'daily'));

    if (!goal) {
      return NextResponse.json({ msg: 'Goal is required.' }, { status: 400 });
    }

    if (goal.length > 100) {
      return NextResponse.json({ msg: 'Goal must be 100 characters or less.' }, { status: 400 });
    }

    const quest = new Quest({
      userId: user.id,
      goal,
      duration,
      ratings: [0],
      completed: false,
      completedDate: null,
      date: new Date(),
    });

    await quest.save();

    try {
      await recordFeatureSignals({
        userId: user.id,
        source: 'quest_create',
        sourceRef: String(quest._id),
        createdAt: new Date(quest.date),
        signals: [
          { signalType: 'motivation', intensity: 3, confidence: 0.7 },
          { signalType: 'confidence', intensity: 2, confidence: 0.62 },
        ],
      });
    } catch (signalError) {
      console.error('Failed to persist quest create feature signals:', signalError);
    }

    return NextResponse.json({
      msg: 'Quest created.',
      quest,
    });
  } catch (error) {
    console.error('Create quest error:', error);
    return NextResponse.json({ msg: 'Server error.' }, { status: 500 });
  }
}

