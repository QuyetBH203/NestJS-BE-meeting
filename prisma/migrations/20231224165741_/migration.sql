/*
  Warnings:

  - You are about to drop the column `type` on the `diret-call-channels` table. All the data in the column will be lost.
  - The primary key for the `group-invite-codes` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `group-invite-codes` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[groupId]` on the table `group-invite-codes` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MessageType" ADD VALUE 'MISSED_CALL';
ALTER TYPE "MessageType" ADD VALUE 'CALL';

-- AlterTable
ALTER TABLE "direct-messages" ADD COLUMN     "duration" INTEGER;

-- AlterTable
ALTER TABLE "diret-call-channels" DROP COLUMN "type";

-- AlterTable
ALTER TABLE "group-invite-codes" DROP CONSTRAINT "group-invite-codes_pkey",
DROP COLUMN "id";

-- DropEnum
DROP TYPE "DirectCallChannelType";

-- CreateIndex
CREATE UNIQUE INDEX "group-invite-codes_groupId_key" ON "group-invite-codes"("groupId");
