-- Keep the legacy `views` column as the download counter so an automatic
-- rollback to an older image remains fully compatible.
ALTER TABLE "File" ADD COLUMN "previewViews" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "File" ADD COLUMN "stars" INTEGER NOT NULL DEFAULT 0;
