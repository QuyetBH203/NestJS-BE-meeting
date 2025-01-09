-- DropForeignKey
ALTER TABLE "group-invite-codes" DROP CONSTRAINT "group-invite-codes_groupId_fkey";

-- AddForeignKey
ALTER TABLE "group-invite-codes" ADD CONSTRAINT "group-invite-codes_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
