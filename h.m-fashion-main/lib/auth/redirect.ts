/** Server-side post-auth redirect — never trust client `next` for admin access. */
export function getPostAuthRedirect(role: 'user' | 'admin', next?: string | null): string {
  if (role === 'admin') {
    if (next && next.startsWith('/admin')) return next;
    return '/admin';
  }

  if (next && next.startsWith('/admin')) return '/';
  if (next && next !== '/account' && next.startsWith('/')) return next;
  return '/';
}
