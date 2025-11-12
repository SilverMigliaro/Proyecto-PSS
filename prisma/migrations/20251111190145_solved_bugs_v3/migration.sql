/*
  Warnings:

  - You are about to drop the column `actividadDeportiva` on the `Entrenador` table. All the data in the column will be lost.
  - Changed the column `tipoDeporte` on the `Cancha` table from a scalar field to a list field. If there are non-null values in that column, this step will fail.

*/
-- AlterTable
ALTER TABLE "Cancha" ALTER COLUMN "tipoDeporte" TYPE "TipoDeporte"[] USING ARRAY["tipoDeporte"]::"TipoDeporte"[];

-- AlterTable
ALTER TABLE "Entrenador" DROP COLUMN "actividadDeportiva";
