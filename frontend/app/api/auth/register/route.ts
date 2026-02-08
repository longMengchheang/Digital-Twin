import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { signToken } from '@/lib/auth';
import { validatePassword } from '@/lib/validation';
import { getRequiredXP } from '@/lib/progression';
import User from '@/lib/models/User';
import { badRequest, conflict, serverError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

interface RegisterPayload {
  email?: string;
  password?: string;
}

function buildNameFromEmail(email: string): string {
  const prefix = email.split('@')[0] || 'Adventurer';
  const normalized = prefix.replace(/[._-]+/g, ' ').trim();
  if (!normalized) return 'Adventurer';

  return normalized
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
    .slice(0, 40);
}

export async function POST(req: Request) {
  try {
    await dbConnect();

    const body = (await req.json()) as RegisterPayload;
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '').trim();

    if (!email || !password) {
      return badRequest('Email and password are required.');
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return badRequest(passwordValidation.message);
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return conflict('User already exists.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const name = buildNameFromEmail(email);

    const newUser = new User({
      email,
      password: hashedPassword,
      name,
      level: 1,
      currentXP: 0,
      requiredXP: getRequiredXP(1),
      badges: [],
      joinDate: new Date(),
    });

    await newUser.save();

    const token = signToken({ id: newUser.id, email: newUser.email });

    return NextResponse.json(
      {
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return serverError(error, 'Register error');
  }
}
