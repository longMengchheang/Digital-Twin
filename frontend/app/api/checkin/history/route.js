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

    const history = await Activity.find({ userId: user.id, type: 'checkin' }).sort({ date: -1 }).limit(30);
    return NextResponse.json(history);
  } catch (err) {
    console.error('History error:', err);
    return NextResponse.json({ msg: 'Server error' }, { status: 500 });
  }
}
