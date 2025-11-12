/*
  Warnings:

  - Made the column `canchaId` on table `PracticaDeportiva` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."PracticaDeportiva" DROP CONSTRAINT "PracticaDeportiva_canchaId_fkey";

-- AlterTable
ALTER TABLE "PracticaDeportiva" ALTER COLUMN "canchaId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "PracticaDeportiva" ADD CONSTRAINT "PracticaDeportiva_canchaId_fkey" FOREIGN KEY ("canchaId") REFERENCES "Cancha"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
