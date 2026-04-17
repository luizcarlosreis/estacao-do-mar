/*
  Warnings:

  - You are about to drop the column `unitId` on the `ParkingSpace` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ParkingSpace" DROP CONSTRAINT "ParkingSpace_unitId_fkey";

-- AlterTable
ALTER TABLE "ParkingSpace" DROP COLUMN "unitId",
ADD COLUMN     "ownerId" TEXT;

-- AddForeignKey
ALTER TABLE "ParkingSpace" ADD CONSTRAINT "ParkingSpace_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
