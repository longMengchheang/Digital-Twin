import dbConnect from '@/lib/db';
import Quest from '@/lib/models/Quest';
import { verifyToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const user = verifyToken(req);
    if (!user) {
      return NextResponse.json({ msg: 'No token, authorization denied' }, { status: 401 });
    }

    const { id } = params;
    const { progress } = await req.json();

    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      return NextResponse.json({ msg: 'Progress must be a number between 0 and 100' }, { status: 400 });
    }

    const quest = await Quest.findOneAndUpdate(
      { _id: id, userId: user.id },
      { $set: { 'ratings.0': progress, completed: progress >= 100 } },
      { new: true, runValidators: true }
    );

    if (!quest) {
      return NextResponse.json({ msg: 'Quest not found' }, { status: 404 });
    }

    return NextResponse.json({ msg: 'Progress updated', quest });
  } catch (err) {
    console.error('Update progress error:', err);
    return NextResponse.json({ msg: 'Server error' }, { status: 500 });
  }
}
