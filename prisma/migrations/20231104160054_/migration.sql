/*
  Warnings:

  - Added the required column `message` to the `direct-messages` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "direct-messages" ADD COLUMN     "message" TEXT NOT NULL;
