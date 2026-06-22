import { NextRequest, NextResponse } from 'next/server';
import { mongoRoleToAppRole } from '@/lib/auth/client';
import { listUsers, updateUserRole } from '@/lib/auth/user-store';
import { requireAdmin } from '../_guard';

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response!;

  try {
    const users = await listUsers();
    return NextResponse.json({
      users: users.map((pub) => ({
        id: pub.id,
        email: pub.email,
        name: pub.name,
        role: mongoRoleToAppRole(pub.role),
        created_at: pub.createdAt,
      })),
    });
  } catch (error) {
    console.error('[admin/users GET]', error);
    return NextResponse.json({ error: 'Unable to load users' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response!;

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { role } = await req.json();
  if (role !== 'customer' && role !== 'admin') {
    return NextResponse.json({ error: 'invalid role' }, { status: 400 });
  }

  try {
    const updated = await updateUserRole(id, role === 'admin' ? 'admin' : 'user');
    if (!updated) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: mongoRoleToAppRole(updated.role),
        created_at: updated.createdAt,
      },
    });
  } catch (error) {
    console.error('[admin/users PUT]', error);
    return NextResponse.json({ error: 'Unable to update user' }, { status: 500 });
  }
}
