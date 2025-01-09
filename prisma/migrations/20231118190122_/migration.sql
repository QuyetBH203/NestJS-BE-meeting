/*
  Warnings:

  - You are about to drop the `users_group-message-channels` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "users_group-message-channels" DROP CONSTRAINT "users_group-message-channels_groupMessageChannelId_fkey";

-- DropForeignKey
ALTER TABLE "users_group-message-channels" DROP CONSTRAINT "users_group-message-channels_userId_fkey";

-- DropTable
DROP TABLE "users_group-message-channels";
