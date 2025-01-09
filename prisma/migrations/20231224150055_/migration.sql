-- CreateTable
CREATE TABLE "group-invite-codes" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "code" TEXT NOT NULL,
    "maxNumberOfUses" INTEGER,
    "numberOfUses" INTEGER NOT NULL DEFAULT 0,
    "groupId" TEXT NOT NULL,

    CONSTRAINT "group-invite-codes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "group-invite-codes" ADD CONSTRAINT "group-invite-codes_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
