/*
  Warnings:

  - You are about to drop the column `fromUserId` on the `direct-messages` table. All the data in the column will be lost.
  - You are about to drop the column `toUserId` on the `direct-messages` table. All the data in the column will be lost.
  - You are about to drop the `users-groups` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `directMessageChannelId` to the `direct-messages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `direct-messages` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "direct-messages" DROP CONSTRAINT "direct-messages_fromUserId_fkey";

-- DropForeignKey
ALTER TABLE "direct-messages" DROP CONSTRAINT "direct-messages_toUserId_fkey";

-- DropForeignKey
ALTER TABLE "users-groups" DROP CONSTRAINT "users-groups_groupId_fkey";

-- DropForeignKey
ALTER TABLE "users-groups" DROP CONSTRAINT "users-groups_userId_fkey";

-- AlterTable
ALTER TABLE "direct-messages" DROP COLUMN "fromUserId",
DROP COLUMN "toUserId",
ADD COLUMN     "directMessageChannelId" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- DropTable
DROP TABLE "users-groups";

-- CreateTable
CREATE TABLE "users_groups" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "isOwner" BOOLEAN NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,

    CONSTRAINT "users_groups_pkey" PRIMARY KEY ("userId","groupId")
);

-- CreateTable
CREATE TABLE "direct-message-channels" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "direct-message-channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users_direct-message-channels" (
    "userId" TEXT NOT NULL,
    "directMessageChannelId" TEXT NOT NULL,

    CONSTRAINT "users_direct-message-channels_pkey" PRIMARY KEY ("userId","directMessageChannelId")
);

-- AddForeignKey
ALTER TABLE "users_groups" ADD CONSTRAINT "users_groups_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_groups" ADD CONSTRAINT "users_groups_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct-messages" ADD CONSTRAINT "direct-messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct-messages" ADD CONSTRAINT "direct-messages_directMessageChannelId_fkey" FOREIGN KEY ("directMessageChannelId") REFERENCES "direct-message-channels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_direct-message-channels" ADD CONSTRAINT "users_direct-message-channels_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_direct-message-channels" ADD CONSTRAINT "users_direct-message-channels_directMessageChannelId_fkey" FOREIGN KEY ("directMessageChannelId") REFERENCES "direct-message-channels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
