import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  FRONTEND_URL: z.string().default('http://localhost:4200'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_ROUNDS: z.coerce.number().default(12),
  OTP_TTL_MINUTES: z.coerce.number().default(10),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  SMTP_FROM: z.string().email(),
  FROM_EMAIL: z.string().email(),
  ADMIN_SEED_EMAIL: z.string().email().default('admin@unio.com'),
  ADMIN_SEED_PASSWORD: z.string().min(6).default('ChangeMe123'),
  ADMIN_SEED_NAME: z.string().default('Super Admin')
});

export const env = envSchema.parse(process.env);
