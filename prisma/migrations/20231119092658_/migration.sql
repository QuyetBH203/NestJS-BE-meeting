-- AlterEnum
ALTER TYPE "MessageType" ADD VALUE 'CALL';

-- AlterTable
ALTER TABLE "direct-messages" ADD COLUMN     "duration" INTEGER,
ALTER COLUMN "value" DROP NOT NULL;

-- CreateTable
CREATE TABLE "direct-call-channel" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "direct-call-channel_pkey" PRIMARY KEY ("id")
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
ALTER TABLE "users_direct-call-channels" ADD CONSTRAINT "users_direct-call-channels_directCallChannelId_fkey" FOREIGN KEY ("directCallChannelId") REFERENCES "direct-call-channel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
