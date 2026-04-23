/*
  Warnings:

  - A unique constraint covering the columns `[messageId]` on the table `Application` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `messageId` to the `Application` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "messageId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Application_messageId_key" ON "Application"("messageId");
