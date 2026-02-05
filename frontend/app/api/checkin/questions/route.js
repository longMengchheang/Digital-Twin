import dbConnect from '@/lib/db';
import Activity from '@/lib/models/CheckIn';
import { verifyToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    await dbConnect();
    const user = verifyToken(req);
    if (!user) {
      return NextResponse.json({ msg: 'No token, authorization denied' }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingActivity = await Activity.findOne({
      userId: user.id,
      type: 'checkin',
      date: { $gte: today }
    });

    if (existingActivity) {
      return NextResponse.json({ msg: 'Daily check-in already completed' }, { status: 400 });
    }

    const questions = [
      'How are you feeling today?',
      'How productive did you feel today?',
      'How energized are you right now?',
      'How confident are you about your goals today?',
      'How connected do you feel to others today?'
    ];
    return NextResponse.json({ questions });
  } catch (err) {
    console.error('Questions error:', err);
    return NextResponse.json({ msg: 'Server error' }, { status: 500 });
  }
}
