/*
  Warnings:

  - You are about to drop the column `phoneNumber` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[phoneNumber]` on the table `profiles` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "UserGender" ADD VALUE 'OTHER';

-- DropIndex
DROP INDEX "users_phoneNumber_key";

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "phoneNumber" TEXT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "phoneNumber";

-- CreateIndex
CREATE UNIQUE INDEX "profiles_phoneNumber_key" ON "profiles"("phoneNumber");
