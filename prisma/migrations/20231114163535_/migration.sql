-- CreateTable
CREATE TABLE "group-message-channels" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,

    CONSTRAINT "group-message-channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups-messages" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "type" "MessageType" NOT NULL,
    "value" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupMessageChannelId" TEXT NOT NULL,

    CONSTRAINT "groups-messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users_group-message-channels" (
    "userId" TEXT NOT NULL,
    "groupMessageChannelId" TEXT NOT NULL,

    CONSTRAINT "users_group-message-channels_pkey" PRIMARY KEY ("userId","groupMessageChannelId")
);

-- AddForeignKey
ALTER TABLE "group-message-channels" ADD CONSTRAINT "group-message-channels_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups-messages" ADD CONSTRAINT "groups-messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups-messages" ADD CONSTRAINT "groups-messages_groupMessageChannelId_fkey" FOREIGN KEY ("groupMessageChannelId") REFERENCES "group-message-channels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_group-message-channels" ADD CONSTRAINT "users_group-message-channels_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_group-message-channels" ADD CONSTRAINT "users_group-message-channels_groupMessageChannelId_fkey" FOREIGN KEY ("groupMessageChannelId") REFERENCES "group-message-channels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
