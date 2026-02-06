import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { normalizeDuration } from '@/lib/progression';
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

    return NextResponse.json({
      msg: 'Quest created.',
      quest,
    });
  } catch (error) {
    console.error('Create quest error:', error);
    return NextResponse.json({ msg: 'Server error.' }, { status: 500 });
  }
}
