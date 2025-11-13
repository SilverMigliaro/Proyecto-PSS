/*
  Warnings:

  - A unique constraint covering the columns `[titularDni]` on the table `Familia` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `titularDni` to the `Familia` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AlquilerCancha" ALTER COLUMN "fechaReserva" DROP DEFAULT,
ALTER COLUMN "estadoAlquiler" SET DEFAULT 'RESERVADO';

-- AlterTable
ALTER TABLE "Familia" ADD COLUMN     "titularDni" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Familia_titularDni_key" ON "Familia"("titularDni");
