import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/** bcrypt hashes always start with $2a$, $2b$, or $2y$ */
export function isBcryptHash(value: string): boolean {
  return /^\$2[aby]\$\d{2}\$/.test(value);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export type PasswordVerifyResult = {
  valid: boolean;
  /** True when the stored value was plain text and should be replaced with a bcrypt hash. */
  needsRehash: boolean;
};

/**
 * Verify a password against a stored value.
 * Supports bcrypt hashes (normal) and legacy plain-text passwords (auto-rehashed on next save).
 */
export async function verifyPassword(
  password: string,
  stored: string,
): Promise<PasswordVerifyResult> {
  if (!stored) return { valid: false, needsRehash: false };

  if (isBcryptHash(stored)) {
    const valid = await bcrypt.compare(password, stored);
    return { valid, needsRehash: false };
  }

  // Legacy: password was inserted directly into the database as plain text.
  const valid = stored === password;
  return { valid, needsRehash: valid };
}
