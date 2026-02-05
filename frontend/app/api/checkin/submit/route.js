import dbConnect from '@/lib/db';
import Activity from '@/lib/models/CheckIn';
import { verifyToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    await dbConnect();
    const user = verifyToken(req);
    if (!user) {
      return NextResponse.json({ msg: 'No token, authorization denied' }, { status: 401 });
    }

    const { ratings } = await req.json();
    if (!Array.isArray(ratings) || ratings.length !== 5) {
      return NextResponse.json({ msg: 'Must provide exactly 5 ratings' }, { status: 400 });
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

    const overallScore = ratings.reduce((a, b) => a + b, 0);
    const activity = new Activity({
      userId: user.id,
      type: 'checkin',
      ratings,
      overallScore
    });
    await activity.save();

    return NextResponse.json({ msg: 'Check-in submitted', overallScore });
  } catch (err) {
    console.error('Submit checkin error:', err);
    return NextResponse.json({ msg: 'Server error' }, { status: 500 });
  }
}
