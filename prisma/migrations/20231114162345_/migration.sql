/*
  Warnings:

  - You are about to drop the column `message` on the `direct-messages` table. All the data in the column will be lost.
  - Added the required column `type` to the `direct-messages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `direct-messages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `profiles` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE');

-- AlterTable
ALTER TABLE "direct-messages" DROP COLUMN "message",
ADD COLUMN     "type" "MessageType" NOT NULL,
ADD COLUMN     "value" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
