import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { signToken } from '@/lib/auth';
import User from '@/lib/models/User';

export const dynamic = 'force-dynamic';

interface LoginPayload {
  email?: string;
  password?: string;
}

export async function POST(req: Request) {
  try {
    await dbConnect();

    const body = (await req.json()) as LoginPayload;
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '').trim();

    if (!email || !password) {
      return NextResponse.json({ msg: 'Email and password are required.' }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ msg: 'Invalid credentials.' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ msg: 'Invalid credentials.' }, { status: 401 });
    }

    const token = signToken({ id: user.id, email: user.email });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ msg: 'Server error.' }, { status: 500 });
  }
}
