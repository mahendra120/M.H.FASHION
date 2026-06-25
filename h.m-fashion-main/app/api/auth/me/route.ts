import { NextRequest, NextResponse } from 'next/server';
import { getPublicUserFromRequest } from '@/lib/auth/session';

/** Uses cookies/headers — must not be statically pre-rendered at build time. */
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getPublicUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('[auth/me]', error);
    return NextResponse.json({ error: 'Unable to verify session' }, { status: 401 });
  }
}
