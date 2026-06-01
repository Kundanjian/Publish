import 'dotenv/config';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const getEnv = (name: string, fallback?: string): string => {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
};

async function main() {
  const email = getEnv('ADMIN_SEED_EMAIL', 'admin@unio.com');
  const password = getEnv('ADMIN_SEED_PASSWORD', 'ChangeMe123');
  const name = getEnv('ADMIN_SEED_NAME', 'Super Admin');
  const rounds = Number(process.env.BCRYPT_ROUNDS ?? 12);

  const passwordHash = await bcrypt.hash(password, rounds);

  await prisma.user.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      unioCoins: 1000,
      role: UserRole.ADMIN,
      emailVerifiedAt: new Date()
    },
    create: {
      name,
      email,
      passwordHash,
      unioCoins: 1000,
      role: UserRole.ADMIN,
      emailVerifiedAt: new Date()
    }
  });

  console.log(`Admin user ready: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
