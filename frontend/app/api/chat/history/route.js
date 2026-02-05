import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Chat from '@/lib/models/Chat';
import { verifyToken } from '@/lib/auth';

export async function GET(req) {
  try {
    await dbConnect();
    const user = verifyToken(req);
    if (!user) {
      return NextResponse.json({ msg: 'No token, authorization denied' }, { status: 401 });
    }

    const history = await Chat.find({ userId: user.id })
      .sort({ updatedAt: -1, _id: -1 })
      .limit(20);

    const sortedHistory = history.reverse();
    const messages = sortedHistory.flatMap(chat => chat.messages);

    return NextResponse.json({ messages: messages.slice(-20) });
  } catch (err) {
    console.error('Error fetching history:', err);
    return NextResponse.json({ msg: 'Server error' }, { status: 500 });
  }
}
