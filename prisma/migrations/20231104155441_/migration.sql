/*
  Warnings:

  - The primary key for the `friendship-requests` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `fromId` on the `friendship-requests` table. All the data in the column will be lost.
  - You are about to drop the column `toId` on the `friendship-requests` table. All the data in the column will be lost.
  - The primary key for the `friendships` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `fromId` on the `friendships` table. All the data in the column will be lost.
  - You are about to drop the column `toId` on the `friendships` table. All the data in the column will be lost.
  - Added the required column `fromUserId` to the `friendship-requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `toUserId` to the `friendship-requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fromUserId` to the `friendships` table without a default value. This is not possible if the table is not empty.
  - Added the required column `toUserId` to the `friendships` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "friendship-requests" DROP CONSTRAINT "friendship-requests_fromId_fkey";

-- DropForeignKey
ALTER TABLE "friendship-requests" DROP CONSTRAINT "friendship-requests_toId_fkey";

-- DropForeignKey
ALTER TABLE "friendships" DROP CONSTRAINT "friendships_fromId_fkey";

-- DropForeignKey
ALTER TABLE "friendships" DROP CONSTRAINT "friendships_toId_fkey";

-- AlterTable
ALTER TABLE "friendship-requests" DROP CONSTRAINT "friendship-requests_pkey",
DROP COLUMN "fromId",
DROP COLUMN "toId",
ADD COLUMN     "fromUserId" TEXT NOT NULL,
ADD COLUMN     "toUserId" TEXT NOT NULL,
ADD CONSTRAINT "friendship-requests_pkey" PRIMARY KEY ("fromUserId", "toUserId");

-- AlterTable
ALTER TABLE "friendships" DROP CONSTRAINT "friendships_pkey",
DROP COLUMN "fromId",
DROP COLUMN "toId",
ADD COLUMN     "fromUserId" TEXT NOT NULL,
ADD COLUMN     "toUserId" TEXT NOT NULL,
ADD CONSTRAINT "friendships_pkey" PRIMARY KEY ("fromUserId", "toUserId");

-- CreateTable
CREATE TABLE "direct-messages" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,

    CONSTRAINT "direct-messages_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendship-requests" ADD CONSTRAINT "friendship-requests_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendship-requests" ADD CONSTRAINT "friendship-requests_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct-messages" ADD CONSTRAINT "direct-messages_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct-messages" ADD CONSTRAINT "direct-messages_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
