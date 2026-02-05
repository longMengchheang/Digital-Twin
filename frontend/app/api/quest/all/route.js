import dbConnect from '@/lib/db';
import Quest from '@/lib/models/Quest';
import { verifyToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    await dbConnect();
    const user = verifyToken(req);
    if (!user) {
      return NextResponse.json({ msg: 'No token, authorization denied' }, { status: 401 });
    }

    const userQuests = await Quest.find({ userId: user.id }).sort({ date: -1 });
    return NextResponse.json(userQuests);
  } catch (err) {
    console.error('Fetch quests error:', err);
    return NextResponse.json({ msg: 'Failed to fetch quests' }, { status: 500 });
  }
}
