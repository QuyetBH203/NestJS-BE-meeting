/*
  Warnings:

  - Added the required column `type` to the `diret-call-channels` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DirectCallChannelType" AS ENUM ('AUDIO', 'VIDEO');

-- AlterTable
ALTER TABLE "diret-call-channels" ADD COLUMN     "type" "DirectCallChannelType" NOT NULL;
