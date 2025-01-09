/*
  Warnings:

  - You are about to drop the column `inCall` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "inCall";

-- CreateTable
CREATE TABLE "diret-call-channels" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "diret-call-channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users_direct-call-channels" (
    "userId" TEXT NOT NULL,
    "directCallChannelId" TEXT NOT NULL,

    CONSTRAINT "users_direct-call-channels_pkey" PRIMARY KEY ("userId","directCallChannelId")
);

-- AddForeignKey
ALTER TABLE "users_direct-call-channels" ADD CONSTRAINT "users_direct-call-channels_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_direct-call-channels" ADD CONSTRAINT "users_direct-call-channels_directCallChannelId_fkey" FOREIGN KEY ("directCallChannelId") REFERENCES "diret-call-channels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
