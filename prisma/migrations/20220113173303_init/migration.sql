-- CreateTable
CREATE TABLE "user" (
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("username")
);

-- CreateTable
CREATE TABLE "organizationProfile" (
    "organizationName" TEXT NOT NULL,
    "logo" TEXT,
    "telegramUsername" TEXT,
    "phoneNumber" TEXT,
    "bankName" TEXT,
    "bankAccNumber" TEXT,
    "bankAccHolder" TEXT,
    "telegram" TEXT,
    "instagram" TEXT,
    "facebook" TEXT,
    "otherAccounts" TEXT,
    "username" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "individualProfile" (
    "name" TEXT NOT NULL,
    "telegramUserName" TEXT,
    "phoneNumber" TEXT,
    "username" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "trip" (
    "id" SERIAL NOT NULL,
    "posterPictures" TEXT,
    "description" TEXT,
    "anything" TEXT,
    "username" TEXT NOT NULL,

    CONSTRAINT "trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin" (
    "telegramId" INTEGER NOT NULL,
    "username" TEXT,
    "name" TEXT NOT NULL,
    "current" BOOLEAN NOT NULL,
    "super" BOOLEAN NOT NULL,
    "password" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "organizationProfile_organizationName_key" ON "organizationProfile"("organizationName");

-- CreateIndex
CREATE UNIQUE INDEX "organizationProfile_username_key" ON "organizationProfile"("username");

-- CreateIndex
CREATE UNIQUE INDEX "individualProfile_username_key" ON "individualProfile"("username");

-- CreateIndex
CREATE UNIQUE INDEX "admin_telegramId_key" ON "admin"("telegramId");

-- AddForeignKey
ALTER TABLE "organizationProfile" ADD CONSTRAINT "organizationProfile_username_fkey" FOREIGN KEY ("username") REFERENCES "user"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "individualProfile" ADD CONSTRAINT "individualProfile_username_fkey" FOREIGN KEY ("username") REFERENCES "user"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip" ADD CONSTRAINT "trip_username_fkey" FOREIGN KEY ("username") REFERENCES "user"("username") ON DELETE RESTRICT ON UPDATE CASCADE;
