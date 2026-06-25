import bcrypt from 'bcrypt';
import { env } from '../config/env';

export const PASSWORD_POLICY_MESSAGE =
  'Password must be 8-64 characters and include uppercase, lowercase, number, and special character.';

const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/;

export const hashPassword = (plainText: string): Promise<string> => {
  return bcrypt.hash(plainText, env.BCRYPT_ROUNDS);
};

export const verifyPassword = (plainText: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(plainText, hash);
};

export const isPasswordStrong = (plainText: string): boolean => {
  return PASSWORD_POLICY_REGEX.test(plainText);
};
