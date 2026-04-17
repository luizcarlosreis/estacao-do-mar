/*
  Warnings:

  - You are about to drop the column `ownerId` on the `ParkingSpace` table. All the data in the column will be lost.
  - You are about to drop the column `ownerId` on the `Unit` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ParkingSpace" DROP CONSTRAINT "ParkingSpace_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "Unit" DROP CONSTRAINT "Unit_ownerId_fkey";

-- AlterTable
ALTER TABLE "ParkingSpace" DROP COLUMN "ownerId",
ADD COLUMN     "unitId" TEXT;

-- AlterTable
ALTER TABLE "Unit" DROP COLUMN "ownerId";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "unitId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParkingSpace" ADD CONSTRAINT "ParkingSpace_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
