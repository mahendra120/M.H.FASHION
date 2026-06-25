import { connectDB, isMongoConfigured } from '@/lib/mongodb';
import { User, type IUserDocument } from '@/models/User';
import { isAdminEmail } from '@/lib/admin-auth';
import { authLog } from '@/lib/auth/debug';
import { tryBootstrapAdminLogin, ENV_BOOTSTRAP_ADMIN_ID, getEnvBootstrapAdminUser } from '@/lib/auth/ensure-admin';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { type PublicUser } from '@/lib/auth/client';
import {
  localCreateUser,
  localFindUserByEmail,
  localFindUserById,
  localListUsers,
  localUpdateUserName,
  localUpdateUserPassword,
  localUpdateUserRole,
  type StoredUser,
} from '@/lib/users-local-store';

function storedToPublic(user: StoredUser): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function mongoToPublic(user: IUserDocument): PublicUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export function useLocalUserStore(): boolean {
  return !isMongoConfigured() && process.env.NODE_ENV === 'development';
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<PublicUser> {
  const email = input.email.toLowerCase();
  const role = 'user' as const;
  const hashed = await hashPassword(input.password);

  if (useLocalUserStore()) {
    const existing = await localFindUserByEmail(email);
    if (existing) throw new Error('An account with this email already exists');
    const user = await localCreateUser({ name: input.name, email, password: hashed, role });
    return storedToPublic(user);
  }

  if (!isMongoConfigured()) {
    throw new Error('Database is not configured. Set MONGODB_URI in your environment.');
  }

  await connectDB();
  const existing = await User.findOne({ email });
  if (existing) throw new Error('An account with this email already exists');

  const user = await User.create({ name: input.name, email, password: hashed, role });
  return mongoToPublic(user);
}

export async function authenticateUser(email: string, password: string): Promise<PublicUser | null> {
  const normalized = email.toLowerCase();
  const store = useLocalUserStore() ? 'local' : isMongoConfigured() ? 'mongodb' : 'none';

  authLog('authenticateUser: start', { email: normalized, store });
  // #region agent log
  fetch('http://127.0.0.1:7900/ingest/090f6d38-5b88-4583-9648-35b5d5060acb',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e47377'},body:JSON.stringify({sessionId:'e47377',location:'user-store.ts:authenticateUser',message:'auth start',data:{store,adminEmailAllowed:isAdminEmail(normalized),hasMongo:isMongoConfigured()},timestamp:Date.now(),hypothesisId:'H1-H3'})}).catch(()=>{});
  // #endregion

  if (store === 'none') {
    authLog('authenticateUser: no auth store configured — set MONGODB_URI or run in development');
    return tryBootstrapAdminLogin(normalized, password);
  }

  if (useLocalUserStore()) {
    let user = await localFindUserByEmail(normalized);

    if (!user) {
      authLog('authenticateUser: user not found (local)', { email: normalized });
      return tryBootstrapAdminLogin(normalized, password);
    }

    const { valid, needsRehash } = await verifyPassword(password, user.password);
    authLog('authenticateUser: password check (local)', {
      email: normalized,
      valid,
      needsRehash,
      role: user.role,
    });

    if (!valid) {
      const recovered = await tryBootstrapAdminLogin(normalized, password);
      if (recovered) return recovered;
      return null;
    }

    if (needsRehash) {
      authLog('authenticateUser: rehashing legacy plain-text password (local)', { email: normalized });
      const hashed = await hashPassword(password);
      const updated = await localUpdateUserPassword(user.id, hashed);
      if (updated) user = updated;
    }

    return storedToPublic(user);
  }

  await connectDB();
  let user = await User.findOne({ email: normalized }).select('+password');

  if (!user) {
    authLog('authenticateUser: user not found (mongodb)', { email: normalized });
    return tryBootstrapAdminLogin(normalized, password);
  }

  const { valid, needsRehash } = await verifyPassword(password, user.password);
  authLog('authenticateUser: password check (mongodb)', {
    email: normalized,
    valid,
    needsRehash,
    role: user.role,
  });

  if (!valid) {
    const recovered = await tryBootstrapAdminLogin(normalized, password);
    if (recovered) return recovered;
    return null;
  }

  if (needsRehash) {
    authLog('authenticateUser: rehashing legacy plain-text password (mongodb)', { email: normalized });
    user.password = await hashPassword(password);
  }

  if (needsRehash) {
    await user.save();
  }

  return mongoToPublic(user);
}

export async function findUserById(id: string): Promise<PublicUser | null> {
  if (id === ENV_BOOTSTRAP_ADMIN_ID) {
    return getEnvBootstrapAdminUser();
  }

  if (useLocalUserStore()) {
    const user = await localFindUserById(id);
    return user ? storedToPublic(user) : null;
  }

  if (!isMongoConfigured()) return null;

  await connectDB();
  const user = await User.findById(id);
  return user ? mongoToPublic(user) : null;
}

export async function findAuthUserById(id: string): Promise<{
  id: string;
  email: string;
  role: 'user' | 'admin';
} | null> {
  const pub = await findUserById(id);
  if (!pub) return null;
  return { id: pub.id, email: pub.email, role: pub.role };
}

export async function updateUserName(id: string, name: string): Promise<PublicUser | null> {
  if (useLocalUserStore()) {
    const user = await localUpdateUserName(id, name);
    return user ? storedToPublic(user) : null;
  }

  if (!isMongoConfigured()) return null;
  await connectDB();
  const user = await User.findByIdAndUpdate(id, { name }, { new: true });
  return user ? mongoToPublic(user) : null;
}

export async function listUsers(): Promise<PublicUser[]> {
  if (useLocalUserStore()) {
    const users = await localListUsers();
    return users.map(storedToPublic);
  }

  if (!isMongoConfigured()) return [];
  await connectDB();
  const users = await User.find().sort({ createdAt: -1 });
  return users.map(mongoToPublic);
}

export async function updateUserRole(id: string, role: 'user' | 'admin'): Promise<PublicUser | null> {
  const existing = await findUserById(id);
  if (!existing) return null;

  if (role === 'admin' && !isAdminEmail(existing.email)) {
    throw new Error('Cannot assign admin role: email is not in ADMIN_EMAILS allowlist');
  }

  if (useLocalUserStore()) {
    const user = await localUpdateUserRole(id, role);
    return user ? storedToPublic(user) : null;
  }

  if (!isMongoConfigured()) return null;
  await connectDB();
  const user = await User.findByIdAndUpdate(id, { role }, { new: true });
  return user ? mongoToPublic(user) : null;
}

/** Create or update the admin account (used by seed script — password from env only). */
export async function upsertAdminUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<PublicUser> {
  const email = input.email.toLowerCase();
  if (!isAdminEmail(email)) {
    throw new Error('Email is not in ADMIN_EMAILS allowlist');
  }

  const hashed = await hashPassword(input.password);

  if (useLocalUserStore()) {
    const existing = await localFindUserByEmail(email);
    if (existing) {
      await localUpdateUserPassword(existing.id, hashed);
      const updated = await localUpdateUserRole(existing.id, 'admin');
      if (!updated) throw new Error('Unable to update admin user');
      if (input.name !== existing.name) {
        const renamed = await localUpdateUserName(existing.id, input.name);
        return storedToPublic(renamed ?? updated);
      }
      return storedToPublic(updated);
    }
    const user = await localCreateUser({
      name: input.name,
      email,
      password: hashed,
      role: 'admin',
    });
    return storedToPublic(user);
  }

  if (!isMongoConfigured()) {
    throw new Error('Database is not configured. Set MONGODB_URI in your environment.');
  }

  await connectDB();
  const existing = await User.findOne({ email }).select('+password');
  if (existing) {
    existing.name = input.name;
    existing.password = hashed;
    existing.role = 'admin';
    await existing.save();
    return mongoToPublic(existing);
  }

  const user = await User.create({
    name: input.name,
    email,
    password: hashed,
    role: 'admin',
  });
  return mongoToPublic(user);
}

/** Find a user by email (for password reset flow). */
export async function findUserByEmail(email: string): Promise<PublicUser | null> {
  const normalized = email.toLowerCase();

  if (useLocalUserStore()) {
    const user = await localFindUserByEmail(normalized);
    return user ? storedToPublic(user) : null;
  }

  if (!isMongoConfigured()) return null;
  await connectDB();
  const user = await User.findOne({ email: normalized });
  return user ? mongoToPublic(user) : null;
}

/** Update a user's password by ID (for password reset flow). */
export async function updateUserPasswordById(id: string, newPassword: string): Promise<boolean> {
  const hashed = await hashPassword(newPassword);

  if (useLocalUserStore()) {
    const updated = await localUpdateUserPassword(id, hashed);
    return updated !== null;
  }

  if (!isMongoConfigured()) return false;
  await connectDB();
  const user = await User.findById(id).select('+password');
  if (!user) return false;
  user.password = hashed;
  await user.save();
  return true;
}

