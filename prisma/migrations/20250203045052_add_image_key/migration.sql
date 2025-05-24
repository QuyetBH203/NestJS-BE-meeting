/*
  Warnings:

  - Added the required column `imageKey` to the `direct_image` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "direct_image" ADD COLUMN     "imageKey" TEXT NOT NULL;
