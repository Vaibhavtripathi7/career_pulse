-- DropIndex
DROP INDEX "Application_messageId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Application_userID_messageId_key" ON "Application"("userID", "messageId");

