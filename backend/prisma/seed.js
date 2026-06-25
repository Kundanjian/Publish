"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
const getEnv = (name, fallback) => {
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
    const passwordHash = await bcrypt_1.default.hash(password, rounds);
    await prisma.user.upsert({
        where: { email },
        update: {
            name,
            passwordHash,
            role: client_1.UserRole.ADMIN,
            emailVerifiedAt: new Date()
        },
        create: {
            name,
            email,
            passwordHash,
            role: client_1.UserRole.ADMIN,
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
