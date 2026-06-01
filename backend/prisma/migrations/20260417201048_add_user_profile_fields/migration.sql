-- AlterTable
ALTER TABLE "RegistrationOtp" ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phone" TEXT,
ADD COLUMN     "unioCoins" INTEGER NOT NULL DEFAULT 250;
