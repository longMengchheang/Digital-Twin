import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || '4a8f5b3e2c1d9e7f6a5b4c3d2e1f0a9';

export async function POST(req) {
  try {
    await dbConnect();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ msg: 'Email and password required' }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (user) {
      return NextResponse.json({ msg: 'User already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    const payload = { user: { id: newUser.id } };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    return NextResponse.json({ token });
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ msg: 'Server error', error: err.message }, { status: 500 });
  }
}
