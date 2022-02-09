/*
  Warnings:

  - You are about to drop the column `telegramUserName` on the `individualProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "individualProfile" DROP COLUMN "telegramUserName",
ADD COLUMN     "telegramUsername" TEXT;
