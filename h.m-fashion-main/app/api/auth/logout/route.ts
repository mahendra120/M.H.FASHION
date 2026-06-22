import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getTokenCookieName } from '@/lib/auth/jwt';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Signed out successfully' });
  response.cookies.delete(getTokenCookieName());
  return response;
}
