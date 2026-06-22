import { upsertAdminUser } from '@/lib/auth/user-store';

export async function seedAdminAccount(input: {
  name: string;
  email: string;
  password: string;
}): Promise<void> {
  await upsertAdminUser(input);
}
