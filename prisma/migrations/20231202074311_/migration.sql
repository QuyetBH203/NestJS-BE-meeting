/*
  Warnings:

  - The values [CALL] on the enum `MessageType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `duration` on the `direct-messages` table. All the data in the column will be lost.
  - You are about to drop the `direct-call-channel` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users_direct-call-channels` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `value` on table `direct-messages` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MessageType_new" AS ENUM ('TEXT', 'IMAGE');
ALTER TABLE "direct-messages" ALTER COLUMN "type" TYPE "MessageType_new" USING ("type"::text::"MessageType_new");
ALTER TABLE "groups-messages" ALTER COLUMN "type" TYPE "MessageType_new" USING ("type"::text::"MessageType_new");
ALTER TYPE "MessageType" RENAME TO "MessageType_old";
ALTER TYPE "MessageType_new" RENAME TO "MessageType";
DROP TYPE "MessageType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "users_direct-call-channels" DROP CONSTRAINT "users_direct-call-channels_directCallChannelId_fkey";

-- DropForeignKey
ALTER TABLE "users_direct-call-channels" DROP CONSTRAINT "users_direct-call-channels_userId_fkey";

-- AlterTable
ALTER TABLE "direct-messages" DROP COLUMN "duration",
ALTER COLUMN "value" SET NOT NULL;

-- DropTable
DROP TABLE "direct-call-channel";

-- DropTable
DROP TABLE "users_direct-call-channels";
