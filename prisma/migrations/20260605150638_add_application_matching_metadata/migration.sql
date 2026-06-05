-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "gmailThreadId" TEXT,
ADD COLUMN     "normalizedCompany" TEXT,
ADD COLUMN     "senderDomain" TEXT;

-- CreateIndex
CREATE INDEX "Application_userID_normalizedCompany_idx" ON "Application"("userID", "normalizedCompany");

-- CreateIndex
CREATE INDEX "Application_userID_senderDomain_idx" ON "Application"("userID", "senderDomain");
