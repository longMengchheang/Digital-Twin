import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { getDayKey } from '@/lib/progression';
import { adjustUserXP } from '@/lib/user-progress';
import { recordFeatureSignals } from '@/lib/neon/feature-signals';
import CheckIn from '@/lib/models/CheckIn';

export const dynamic = 'force-dynamic';

interface SubmitPayload {
  ratings?: number[];
}

function isValidRatings(ratings: number[]): boolean {
  return Array.isArray(ratings) && ratings.length === 5 && ratings.every((value) => value >= 1 && value <= 5);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export async function POST(req: Request) {
  try {
    await dbConnect();

    const user = verifyToken(req);
    if (!user) {
      return NextResponse.json({ msg: 'No token, authorization denied.' }, { status: 401 });
    }

    const body = (await req.json()) as SubmitPayload;
    const ratings = Array.isArray(body.ratings) ? body.ratings.map((value) => Number(value)) : [];

    if (!isValidRatings(ratings)) {
      return NextResponse.json({ msg: 'Must provide exactly 5 ratings from 1 to 5.' }, { status: 400 });
    }

    const dayKey = getDayKey(new Date());
    const existingCheckIn = await CheckIn.findOne({ userId: user.id, dayKey });

    if (existingCheckIn) {
      return NextResponse.json({ msg: 'Daily check-in already completed.' }, { status: 400 });
    }

    const overallScore = ratings.reduce((sum, value) => sum + value, 0);
    const maxScore = ratings.length * 5;
    const percentage = Math.round((overallScore / maxScore) * 100);

    const checkIn = new CheckIn({
      userId: user.id,
      ratings,
      overallScore,
      percentage,
      dayKey,
      date: new Date(),
    });

    await checkIn.save();

    try {
      const focusIntensity = clamp(Math.round(ratings[1]), 1, 5);
      const stressIntensity = clamp(Math.round(6 - ratings[2]), 1, 5);
      const fatigueIntensity = clamp(Math.round(6 - ratings[0]), 1, 5);
      const motivationIntensity = clamp(Math.round((percentage / 100) * 5), 1, 5);

      const signals = [
        { signalType: 'focus', intensity: focusIntensity, confidence: 0.84 },
        { signalType: 'stress', intensity: stressIntensity, confidence: 0.82 },
        { signalType: 'fatigue', intensity: fatigueIntensity, confidence: 0.78 },
        { signalType: 'motivation', intensity: motivationIntensity, confidence: 0.76 },
      ];

      if (percentage >= 70) {
        signals.push({
          signalType: 'confidence',
          intensity: clamp(Math.round((percentage / 100) * 5), 1, 5),
          confidence: 0.72,
        });
      }

      await recordFeatureSignals({
        userId: user.id,
        source: 'daily_pulse',
        sourceRef: String(checkIn._id),
        createdAt: new Date(checkIn.date),
        signals,
      });
    } catch (signalError) {
      console.error('Failed to persist daily pulse feature signals:', signalError);
    }

    const progression = await adjustUserXP(user.id, percentage);

    return NextResponse.json({
      msg: 'Check-in submitted.',
      result: {
        totalScore: overallScore,
        maxScore,
        percentage,
      },
      progression,
    });
  } catch (error) {
    console.error('Submit check-in error:', error);
    return NextResponse.json({ msg: 'Server error.' }, { status: 500 });
  }
}
