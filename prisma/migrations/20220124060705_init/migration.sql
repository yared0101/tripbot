-- DropForeignKey
ALTER TABLE "trip" DROP CONSTRAINT "trip_username_fkey";

-- AlterTable
ALTER TABLE "trip" ADD COLUMN     "telegramId" INTEGER,
ALTER COLUMN "username" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "trip" ADD CONSTRAINT "trip_username_fkey" FOREIGN KEY ("username") REFERENCES "user"("username") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip" ADD CONSTRAINT "trip_telegramId_fkey" FOREIGN KEY ("telegramId") REFERENCES "admin"("telegramId") ON DELETE SET NULL ON UPDATE CASCADE;
