-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PageType" ADD VALUE 'HOME';
ALTER TYPE "PageType" ADD VALUE 'CUSTOM';
ALTER TYPE "PageType" ADD VALUE 'CODE';

-- AlterTable
ALTER TABLE "pages" ADD COLUMN     "is_system" BOOLEAN NOT NULL DEFAULT false;
