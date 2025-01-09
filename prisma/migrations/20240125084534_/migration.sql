-- DropForeignKey
ALTER TABLE "direct-messages" DROP CONSTRAINT "direct-messages_directMessageChannelId_fkey";

-- DropForeignKey
ALTER TABLE "direct-messages" DROP CONSTRAINT "direct-messages_userId_fkey";

-- DropForeignKey
ALTER TABLE "diret-call-channels" DROP CONSTRAINT "diret-call-channels_createdById_fkey";

-- DropForeignKey
ALTER TABLE "friendship-requests" DROP CONSTRAINT "friendship-requests_fromUserId_fkey";

-- DropForeignKey
ALTER TABLE "friendship-requests" DROP CONSTRAINT "friendship-requests_toUserId_fkey";

-- DropForeignKey
ALTER TABLE "friendships" DROP CONSTRAINT "friendships_fromUserId_fkey";

-- DropForeignKey
ALTER TABLE "friendships" DROP CONSTRAINT "friendships_toUserId_fkey";

-- DropForeignKey
ALTER TABLE "group-message-channels" DROP CONSTRAINT "group-message-channels_groupId_fkey";

-- DropForeignKey
ALTER TABLE "groups" DROP CONSTRAINT "groups_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "groups-messages" DROP CONSTRAINT "groups-messages_groupMessageChannelId_fkey";

-- DropForeignKey
ALTER TABLE "groups-messages" DROP CONSTRAINT "groups-messages_userId_fkey";

-- DropForeignKey
ALTER TABLE "profiles" DROP CONSTRAINT "profiles_userId_fkey";

-- DropForeignKey
ALTER TABLE "users_direct-call-channels" DROP CONSTRAINT "users_direct-call-channels_userId_fkey";

-- DropForeignKey
ALTER TABLE "users_direct-message-channels" DROP CONSTRAINT "users_direct-message-channels_directMessageChannelId_fkey";

-- DropForeignKey
ALTER TABLE "users_direct-message-channels" DROP CONSTRAINT "users_direct-message-channels_userId_fkey";

-- DropForeignKey
ALTER TABLE "users_groups" DROP CONSTRAINT "users_groups_groupId_fkey";

-- DropForeignKey
ALTER TABLE "users_groups" DROP CONSTRAINT "users_groups_userId_fkey";

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_groups" ADD CONSTRAINT "users_groups_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_groups" ADD CONSTRAINT "users_groups_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendship-requests" ADD CONSTRAINT "friendship-requests_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendship-requests" ADD CONSTRAINT "friendship-requests_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct-messages" ADD CONSTRAINT "direct-messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct-messages" ADD CONSTRAINT "direct-messages_directMessageChannelId_fkey" FOREIGN KEY ("directMessageChannelId") REFERENCES "direct-message-channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_direct-message-channels" ADD CONSTRAINT "users_direct-message-channels_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_direct-message-channels" ADD CONSTRAINT "users_direct-message-channels_directMessageChannelId_fkey" FOREIGN KEY ("directMessageChannelId") REFERENCES "direct-message-channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group-message-channels" ADD CONSTRAINT "group-message-channels_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups-messages" ADD CONSTRAINT "groups-messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups-messages" ADD CONSTRAINT "groups-messages_groupMessageChannelId_fkey" FOREIGN KEY ("groupMessageChannelId") REFERENCES "group-message-channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diret-call-channels" ADD CONSTRAINT "diret-call-channels_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_direct-call-channels" ADD CONSTRAINT "users_direct-call-channels_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
