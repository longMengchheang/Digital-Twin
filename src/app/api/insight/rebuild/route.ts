import { NextResponse } from 'next/server';
import { GET as rebuildBehaviorMap } from '@/app/api/insight/map/route';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    return await rebuildBehaviorMap(req);
  } catch (error) {
    console.error('Insight rebuild error:', error);
    return NextResponse.json({ msg: 'Server error.' }, { status: 500 });
  }
}
