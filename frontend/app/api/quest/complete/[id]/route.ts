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
    const quest = await Quest.findOne({ _id: id, userId: user.id });

    if (!quest) {
      return NextResponse.json({ msg: 'Quest not found' }, { status: 404 });
    }

    const newProgress = quest.completed ? 0 : 100;
    const updatedQuest = await Quest.findOneAndUpdate(
      { _id: id, userId: user.id },
      { $set: { 'ratings.0': newProgress, completed: newProgress >= 100 } },
      { new: true, runValidators: true }
    );

    return NextResponse.json({ msg: 'Completion toggled', quest: updatedQuest });
  } catch (err) {
    console.error('Toggle completion error:', err);
    return NextResponse.json({ msg: 'Server error' }, { status: 500 });
  }
}
