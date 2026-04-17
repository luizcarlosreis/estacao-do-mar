-- DropForeignKey
ALTER TABLE "Unit" DROP CONSTRAINT "Unit_ownerId_fkey";

-- AlterTable
ALTER TABLE "Unit" ALTER COLUMN "ownerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
