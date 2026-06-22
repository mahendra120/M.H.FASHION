import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAuthToken, getTokenCookieName } from '@/lib/auth/jwt';
import { findUserById } from '@/lib/auth/user-store';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get(getTokenCookieName())?.value;
  if (!token) {
    redirect('/login?next=/admin');
  }

  try {
    const payload = verifyAuthToken(token);
    const user = await findUserById(payload.userId);
    if (!user || user.role !== 'admin') {
      redirect('/');
    }
  } catch {
    redirect('/login?next=/admin');
  }

  return <>{children}</>;
}
