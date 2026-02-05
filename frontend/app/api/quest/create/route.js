import dbConnect from '@/lib/db';
import Quest from '@/lib/models/Quest';
import { verifyToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    await dbConnect();
    const user = verifyToken(req);
    if (!user) {
      return NextResponse.json({ msg: 'No token, authorization denied' }, { status: 401 });
    }

    const { goal, duration } = await req.json();
    if (!goal || !duration) {
      return NextResponse.json({ msg: 'Goal and duration are required' }, { status: 400 });
    }

    const newQuest = new Quest({
      userId: user.id,
      goal,
      duration: duration.toLowerCase(),
      ratings: [0],
      date: new Date()
    });
    await newQuest.save();

    return NextResponse.json({ msg: 'Quest created', quest: newQuest });
  } catch (err) {
    console.error('Create quest error:', err);
    return NextResponse.json({ msg: 'Server error' }, { status: 500 });
  }
}
