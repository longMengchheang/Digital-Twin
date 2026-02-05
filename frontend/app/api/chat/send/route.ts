import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Chat from '@/lib/models/Chat';
import { verifyToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const user = verifyToken(req);
    if (!user) {
      return NextResponse.json({ msg: 'No token, authorization denied' }, { status: 401 });
    }

    const { message } = await req.json();
    if (!message) {
      return NextResponse.json({ msg: 'Message is required' }, { status: 400 });
    }

    // Simulate AI response
    const reply = `AI response to: ${message}`;

    const userMsg = { role: 'user' as const, content: message, timestamp: new Date() };
    const aiMsg = { role: 'ai' as const, content: reply, timestamp: new Date() };

    const latestChat = await Chat.findOne({ userId: user.id })
      .sort({ updatedAt: -1, _id: -1 });

    if (latestChat && latestChat.messages.length < 50) {
      latestChat.messages.push(userMsg, aiMsg);
      await latestChat.save();
    } else {
      const chatMessage = new Chat({
        userId: user.id,
        messages: [userMsg, aiMsg]
      });
      await chatMessage.save();
    }

    return NextResponse.json({ reply });
  } catch (err) {
    console.error('Error sending message:', err);
    return NextResponse.json({ msg: 'Server error' }, { status: 500 });
  }
}
