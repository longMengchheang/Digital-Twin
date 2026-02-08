import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import Quest from '@/lib/models/Quest';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await dbConnect();

    const user = verifyToken(req);
    if (!user) {
      return NextResponse.json({ msg: 'No token, authorization denied.' }, { status: 401 });
    }

    const quests = await Quest.find({ userId: user.id })
      .sort({ date: -1 })
      .lean();

    return NextResponse.json(
      quests.map((quest) => ({
        ...quest,
        _id: String(quest._id),
        progress: quest.progress ?? quest.ratings?.[0] ?? 0,
      })),
    );
  } catch (error) {
    console.error('Fetch quests error:', error);
    return NextResponse.json({ msg: 'Failed to fetch quests.' }, { status: 500 });
  }
}
