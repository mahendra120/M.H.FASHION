import { NextRequest, NextResponse } from 'next/server';
import { profileUpdateSchema } from '@/lib/auth/validators';
import { getPublicUserFromRequest } from '@/lib/auth/session';
import { updateUserName } from '@/lib/auth/user-store';

export async function PATCH(req: NextRequest) {
  try {
    const authUser = await getPublicUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message ?? 'Invalid input';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const updated = await updateUserName(authUser.id, parsed.data.name);
    if (!updated) {
      return NextResponse.json({ error: 'Unable to update profile' }, { status: 500 });
    }

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error('[auth/profile]', error);
    return NextResponse.json({ error: 'Unable to update profile' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const authUser = await getPublicUserFromRequest(req);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ user: authUser });
}
