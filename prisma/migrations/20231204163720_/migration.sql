/*
  Warnings:

  - Added the required column `createdById` to the `diret-call-channels` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "users_direct-call-channels" DROP CONSTRAINT "users_direct-call-channels_directCallChannelId_fkey";

-- AlterTable
ALTER TABLE "diret-call-channels" ADD COLUMN     "createdById" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "diret-call-channels" ADD CONSTRAINT "diret-call-channels_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_direct-call-channels" ADD CONSTRAINT "users_direct-call-channels_directCallChannelId_fkey" FOREIGN KEY ("directCallChannelId") REFERENCES "diret-call-channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
