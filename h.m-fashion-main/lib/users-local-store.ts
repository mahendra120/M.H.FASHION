import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import type { MongoUserRole } from '@/models/User';

const DATA_DIR = path.join(process.cwd(), '.data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: MongoUserRole;
  createdAt: string;
  updatedAt: string;
}

async function readUsers(): Promise<StoredUser[]> {
  try {
    const raw = await fs.readFile(USERS_FILE, 'utf-8');
    return JSON.parse(raw) as StoredUser[];
  } catch {
    return [];
  }
}

async function writeUsers(users: StoredUser[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

export async function localFindUserByEmail(email: string): Promise<StoredUser | null> {
  const users = await readUsers();
  return users.find((u) => u.email === email.toLowerCase()) ?? null;
}

export async function localFindUserById(id: string): Promise<StoredUser | null> {
  const users = await readUsers();
  return users.find((u) => u.id === id) ?? null;
}

export async function localCreateUser(input: {
  name: string;
  email: string;
  password: string;
  role: MongoUserRole;
}): Promise<StoredUser> {
  const users = await readUsers();
  const now = new Date().toISOString();
  const user: StoredUser = {
    id: randomUUID(),
    name: input.name,
    email: input.email.toLowerCase(),
    password: input.password,
    role: input.role,
    createdAt: now,
    updatedAt: now,
  };
  users.push(user);
  await writeUsers(users);
  return user;
}

export async function localUpdateUserName(id: string, name: string): Promise<StoredUser | null> {
  const users = await readUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return null;
  users[index] = { ...users[index], name, updatedAt: new Date().toISOString() };
  await writeUsers(users);
  return users[index];
}

export async function localListUsers(): Promise<StoredUser[]> {
  const users = await readUsers();
  return users.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function localUpdateUserRole(
  id: string,
  role: MongoUserRole,
): Promise<StoredUser | null> {
  const users = await readUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return null;
  users[index] = { ...users[index], role, updatedAt: new Date().toISOString() };
  await writeUsers(users);
  return users[index];
}

export async function localUpdateUserPassword(id: string, passwordHash: string): Promise<StoredUser | null> {
  const users = await readUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return null;
  users[index] = { ...users[index], password: passwordHash, updatedAt: new Date().toISOString() };
  await writeUsers(users);
  return users[index];
}
