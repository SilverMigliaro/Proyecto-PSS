import { NextResponse, NextRequest } from "next/server";
import prisma from "@/app/lib/prisma";
import { EstadoAlquiler, EstadoTurno } from "@prisma/client";

export async function GET() {
    try {
        const alquileres = await prisma.alquilerCancha.findMany({
            include: {
                socio: {
                    include: {
                        usuario: true,
                    },
                },
                turno: {
                    include: {
                        cancha: true,
                    },
                },
                pago: true,
            },
            orderBy: {
                id: 'desc',
            },
        });

        return NextResponse.json(alquileres);
    } catch (error) {
        console.error("[GET /api/alquileres] Error:", error);
        return NextResponse.json(
            { error: "Error al obtener los alquileres" },
            { status: 500 }
        );
    }
}


export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { socioId, canchaId, fecha, turnosSeleccionados } = body;

        if (!socioId || !canchaId || !fecha || !turnosSeleccionados || turnosSeleccionados.length === 0) {
            return NextResponse.json(
                { error: "Datos incompletos para registrar el alquiler" },
                { status: 400 }
            );
        }


        const socioExiste = await prisma.socio.findUnique({
            where: { id: socioId },
        });

        if (!socioExiste) {
            console.error("Socio no existe");
            return NextResponse.json(
                { error: `El socio con id ${socioId} no existe` },
                { status: 400 },

            );

        }

        if (turnosSeleccionados.length > 6) {
            return NextResponse.json(
                { error: "No se pueden reservar más de 6 turnos por alquiler" },
                { status: 400 }
            );
        }

        // Validar que los turnos sean consecutivos
        const ordenados = [...turnosSeleccionados].sort(
            (a: { horaInicio: string }, b: { horaInicio: string }) => (a.horaInicio > b.horaInicio ? 1 : -1)
        );

        const consecutivos = ordenados.every(
            (_: { horaInicio: string; horaFin: string }, i: number, arr: { horaInicio: string; horaFin: string }[]) =>
                i === 0 || arr[i - 1].horaFin === _.horaInicio
        );

        if (!consecutivos) {
            return NextResponse.json(
                { error: "Los turnos deben ser consecutivos" },
                { status: 400 }
            );
        }

        const turnos = await prisma.turnoCancha.findMany({
            where: {
                canchaId,
                fecha: new Date(fecha),
                horaInicio: { in: ordenados.map((t) => t.horaInicio) },
            },
        });

        const ocupados = turnos.filter((t) => t.estado !== EstadoTurno.LIBRE);
        if (ocupados.length > 0) {
            return NextResponse.json({ error: "Uno o más turnos no están disponibles" }, { status: 400 });
        }

        const alquileres = [];
        for (const turno of turnos) {
            const alquiler = await prisma.alquilerCancha.create({
                data: {
                    socioId,
                    turnoId: turno.id,
                    estadoAlquiler: EstadoAlquiler.RESERVADO,
                },
            });
            alquileres.push(alquiler);

            await prisma.turnoCancha.update({
                where: { id: turno.id },
                data: { estado: EstadoTurno.ALQUILADO },
            });
        }

        return NextResponse.json(alquileres);
    } catch (error) {
        console.error("[POST /api/alquileres] Error:", error);
        return NextResponse.json(
            { error: "Error al registrar el alquiler" },
            { status: 500 }
        );
    }
}
