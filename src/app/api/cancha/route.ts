import { NextResponse, NextRequest } from "next/server";
import prisma from "@/app/lib/prisma";
import { DiaSemana, TipoDeporte } from "@prisma/client";

type HorarioInput = {
    diasSeleccionados: string[];
    horaInicio: string;
    horaFin: string;
};

export async function GET() {
    try {
        const canchas = await prisma.cancha.findMany({
            include: {
                horarios: true,
                TurnoCancha: true,
            },
        });
        return NextResponse.json(canchas, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Error al obtener las canchas" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        const { nombre, tipoDeporte, interior, capacidadMax, precioHora, horarios = [] } = data;

        // Validaciones básicas
        if (!nombre || !tipoDeporte || !capacidadMax || !precioHora) {
            return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
        }

        if (!Array.isArray(tipoDeporte) || tipoDeporte.length === 0 || tipoDeporte.some(d => !Object.values(TipoDeporte).includes(d))) {
            return NextResponse.json({ error: "Tipo de deporte inválido" }, { status: 400 });
        }

        // Validar horarios
        const horariosValidos: HorarioInput[] = Array.isArray(horarios)
            ? horarios.filter(
                (h) =>
                    h &&
                    Array.isArray(h.diasSeleccionados) &&
                    h.diasSeleccionados.length > 0 &&
                    typeof h.horaInicio === "string" &&
                    h.horaInicio &&
                    typeof h.horaFin === "string" &&
                    h.horaFin
            )
            : [];

        if (horariosValidos.length === 0) {
            return NextResponse.json({ error: "Debe agregar al menos un horario válido" }, { status: 400 });
        }

        const nuevaCancha = await prisma.cancha.create({
            data: {
                nombre,
                tipoDeporte: tipoDeporte as TipoDeporte[],
                interior: Boolean(interior),
                capacidadMax: Number(capacidadMax),
                precioHora: Number(precioHora),
                horarios: {
                    create: horariosValidos.flatMap((h) =>
                        h.diasSeleccionados.map((dia) => ({
                            diaSemana: DiaSemana[dia as keyof typeof DiaSemana], // map string a enum
                            horaInicio: h.horaInicio,
                            horaFin: h.horaFin,
                            disponible: true,
                        }))
                    ),
                },

            },
            include: { horarios: true, TurnoCancha: true },
        });

        return NextResponse.json(nuevaCancha, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Error al crear la cancha" }, { status: 500 });
    }
}
