-- CreateEnum
CREATE TYPE "FriendshipRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'CANCELED');

-- CreateTable
CREATE TABLE "friendships" (
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,

    CONSTRAINT "friendships_pkey" PRIMARY KEY ("fromId","toId")
);

-- CreateTable
CREATE TABLE "friendship-requests" (
    "status" "FriendshipRequestStatus" NOT NULL DEFAULT 'PENDING',
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,

    CONSTRAINT "friendship-requests_pkey" PRIMARY KEY ("fromId","toId")
);

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_toId_fkey" FOREIGN KEY ("toId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendship-requests" ADD CONSTRAINT "friendship-requests_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendship-requests" ADD CONSTRAINT "friendship-requests_toId_fkey" FOREIGN KEY ("toId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
