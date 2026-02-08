import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import Quest from '@/lib/models/Quest';
import { unauthorized, serverError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await dbConnect();

    const user = verifyToken(req);
    if (!user) {
      return unauthorized('No token, authorization denied.');
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
    return serverError(error, 'Fetch quests error', 'Failed to fetch quests.');
  }
}
