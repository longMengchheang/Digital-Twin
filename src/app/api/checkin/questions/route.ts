import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { getDayKey } from '@/lib/progression';
import CheckIn from '@/lib/models/CheckIn';

export const dynamic = 'force-dynamic';

const DAILY_QUESTIONS = [
  'How has your emotional energy been today?',
  'How focused did you feel on key priorities?',
  'How steady was your stress level today?',
  'How connected did you feel to people around you?',
  'How positive do you feel about tomorrow?',
];

export async function GET(req: Request) {
  try {
    await dbConnect();

    const user = verifyToken(req);
    if (!user) {
      return NextResponse.json({ msg: 'No token, authorization denied.' }, { status: 401 });
    }

    const dayKey = getDayKey(new Date());
    const existingCheckIn = await CheckIn.findOne({ userId: user.id, dayKey });

    if (existingCheckIn) {
      return NextResponse.json({ msg: 'Daily check-in already completed.' }, { status: 400 });
    }

    return NextResponse.json({
      questions: DAILY_QUESTIONS,
      expectedRatings: DAILY_QUESTIONS.length,
    });
  } catch (error) {
    console.error('Questions error:', error);
    return NextResponse.json({ msg: 'Server error.' }, { status: 500 });
  }
}
