-- CreateTable
CREATE TABLE "direct_image" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "imageUrl" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "directMessageChannelId" TEXT NOT NULL,

    CONSTRAINT "direct_image_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "direct_image" ADD CONSTRAINT "direct_image_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_image" ADD CONSTRAINT "direct_image_directMessageChannelId_fkey" FOREIGN KEY ("directMessageChannelId") REFERENCES "direct-message-channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
