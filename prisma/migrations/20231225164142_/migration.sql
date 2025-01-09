/*
  Warnings:

  - You are about to drop the `group-invite-codes` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `inviteCode` to the `groups` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "group-invite-codes" DROP CONSTRAINT "group-invite-codes_groupId_fkey";

-- AlterTable
ALTER TABLE "groups" ADD COLUMN     "inviteCode" TEXT NOT NULL,
ADD COLUMN     "inviteCodeMaxNumberOfUses" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "inviteCodeNumberOfUses" INTEGER;

-- DropTable
DROP TABLE "group-invite-codes";
