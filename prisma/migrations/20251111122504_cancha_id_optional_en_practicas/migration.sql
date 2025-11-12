-- DropForeignKey
ALTER TABLE "public"."PracticaDeportiva" DROP CONSTRAINT "PracticaDeportiva_canchaId_fkey";

-- AlterTable
ALTER TABLE "PracticaDeportiva" ALTER COLUMN "canchaId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "PracticaDeportiva" ADD CONSTRAINT "PracticaDeportiva_canchaId_fkey" FOREIGN KEY ("canchaId") REFERENCES "Cancha"("id") ON DELETE SET NULL ON UPDATE CASCADE;
