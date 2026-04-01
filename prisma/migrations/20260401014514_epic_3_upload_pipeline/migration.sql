-- CreateEnum
CREATE TYPE "MediaStatus" AS ENUM ('PENDING', 'READY', 'FAILED');

-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "status" "MediaStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "revisionId" DROP NOT NULL;
