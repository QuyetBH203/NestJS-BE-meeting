/*
  Warnings:

  - You are about to drop the column `dateOfBirth` on the `profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "profiles" DROP COLUMN "dateOfBirth";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "wsId" TEXT;
