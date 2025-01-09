/*
  Warnings:

  - The required column `id` was added to the `group-invite-codes` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropIndex
DROP INDEX "group-invite-codes_groupId_key";

-- AlterTable
ALTER TABLE "group-invite-codes" ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "group-invite-codes_pkey" PRIMARY KEY ("id");
