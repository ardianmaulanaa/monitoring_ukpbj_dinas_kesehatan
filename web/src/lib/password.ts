import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function shouldRehashPassword(passwordHash: string) {
  try {
    return bcrypt.getRounds(passwordHash) > SALT_ROUNDS;
  } catch {
    return false;
  }
}
