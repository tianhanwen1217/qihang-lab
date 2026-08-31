-- Add account status for deputy administrators.
ALTER TABLE "User" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Visibility applies to every file in a completed share. Existing Pingvin
-- shares remain unlisted so upgrading never publishes old data by accident.
ALTER TABLE "Share" ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'UNLISTED';

-- Each file receives an independent, revocable public link. Existing files
-- are assigned a token during the migration.
ALTER TABLE "File" ADD COLUMN "accessToken" TEXT;
ALTER TABLE "File" ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'UNLISTED';
ALTER TABLE "File" ADD COLUMN "linkPassword" TEXT;
ALTER TABLE "File" ADD COLUMN "linkExpiresAt" DATETIME;
ALTER TABLE "File" ADD COLUMN "linkEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "File" ADD COLUMN "views" INTEGER NOT NULL DEFAULT 0;

UPDATE "File"
SET "accessToken" = lower(hex(randomblob(16)))
WHERE "accessToken" IS NULL;

CREATE UNIQUE INDEX "File_accessToken_key" ON "File"("accessToken");
