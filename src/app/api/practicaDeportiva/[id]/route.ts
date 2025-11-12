import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { TipoDeporte } from "@prisma/client";

function haySolapamiento(h1Inicio: string, h1Fin: string, h2Inicio: string, h2Fin: string) {
    return h1Inicio < h2Fin && h1Fin > h2Inicio;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Falta el ID de la práctica deportiva" }, { status: 400 });

    try {
        const practica = await prisma.practicaDeportiva.findUnique({
            where: { id: Number(id) },
            include: {
                cancha: true,
                entrenadores: { include: { usuario: true } },
                horarios: true,
            },
        });

        if (!practica) return NextResponse.json({ error: "Práctica deportiva no encontrada" }, { status: 404 });

        return NextResponse.json(practica, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Error al obtener la práctica deportiva" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Falta el ID de la práctica deportiva" }, { status: 400 });

    try {
        const data = await req.json();
        const { deporte, canchaId, fechaInicio, fechaFin, precio, entrenadorIds, horarios } = data;

        const practicaExistente = await prisma.practicaDeportiva.findUnique({ where: { id: Number(id) }, include: { horarios: true } });
        if (!practicaExistente) return NextResponse.json({ error: "Práctica no encontrada" }, { status: 404 });

        if (deporte && !Object.values(TipoDeporte).includes(deporte)) {
            return NextResponse.json({ error: "Tipo de deporte inválido" }, { status: 400 });
        }

        if (canchaId) {
            const cancha = await prisma.cancha.findUnique({ where: { id: canchaId } });
            if (!cancha) return NextResponse.json({ error: "La cancha no existe" }, { status: 400 });
        }

        if (Array.isArray(entrenadorIds)) {
            for (const entrenadorId of entrenadorIds) {
                const practicasExistentes = await prisma.practicaDeportiva.findMany({
                    where: {
                        entrenadores: { some: { id: entrenadorId } },
                        id: { not: Number(id) } // evitar compararse con sí mismo
                    },
                    include: { horarios: true }
                });

                for (const practica of practicasExistentes) {
                    for (const hExist of practica.horarios) {
                        for (const hNuevo of horarios || practicaExistente.horarios) {
                            if (hExist.dia === hNuevo.dia) {
                                if (haySolapamiento(hNuevo.horaInicio, hNuevo.horaFin, hExist.horaInicio, hExist.horaFin)) {
                                    return NextResponse.json({
                                        error: `El entrenador ya está ocupado el ${hExist.dia} entre ${hExist.horaInicio} y ${hExist.horaFin}.`
                                    }, { status: 400 });
                                }
                            }
                        }
                    }
                }
            }
        }

        const practicaActualizada = await prisma.practicaDeportiva.update({
            where: { id: Number(id) },
            data: {
                deporte: deporte ?? practicaExistente.deporte,
                canchaId: canchaId ?? practicaExistente.canchaId,
                fechaInicio: fechaInicio ? new Date(fechaInicio) : practicaExistente.fechaInicio,
                fechaFin: fechaFin ? new Date(fechaFin) : practicaExistente.fechaFin,
                precio: precio ?? practicaExistente.precio,
                entrenadores: Array.isArray(entrenadorIds)
                    ? { set: entrenadorIds.map((id: number) => ({ id })) }
                    : undefined
            },
            include: { entrenadores: { include: { usuario: true } }, horarios: true, cancha: true }
        });

        return NextResponse.json(practicaActualizada, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Error al actualizar la práctica deportiva" }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    if (!id)
        return NextResponse.json({ error: "Falta el ID de la práctica deportiva" }, { status: 400 });

    const practicaId = Number(id);

    try {
        const practica = await prisma.practicaDeportiva.findUnique({
            where: { id: practicaId },
            select: {
                id: true,
                canchaId: true,
                fechaInicio: true,
                fechaFin: true,
                horarios: {
                    select: {
                        dia: true,
                        horaInicio: true,
                        horaFin: true,
                    },
                },
            },
        });

        if (!practica)
            return NextResponse.json({ error: "Práctica no encontrada" }, { status: 404 });

        await prisma.$transaction(async (tx) => {
            // A. Liberar todos los turnos que eran de esta práctica
            if (practica.horarios.length > 0) {
                const diasSemanaMap: Record<string, number> = {
                    DOMINGO: 0,
                    LUNES: 1,
                    MARTES: 2,
                    MIERCOLES: 3,
                    JUEVES: 4,
                    VIERNES: 5,
                    SABADO: 6,
                };

                // Generar todas las fechas entre inicio y fin
                const fechasPractica: Date[] = [];
                let currentDate = new Date(practica.fechaInicio);
                const endDate = new Date(practica.fechaFin);

                while (currentDate <= endDate) {
                    fechasPractica.push(new Date(currentDate));
                    currentDate.setDate(currentDate.getDate() + 1);
                }

                // Filtrar días que coincidan con los días de la práctica
                const diasPractica = practica.horarios.map(h => diasSemanaMap[h.dia]);
                const fechasValidas = fechasPractica.filter(f => diasPractica.includes(f.getDay()));

                // Actualizar turnos que coincidan con cancha + fecha + hora + estado
                for (const horario of practica.horarios) {
                    for (const fecha of fechasValidas) {
                        const diaSemana = fecha.getDay();
                        if (diasSemanaMap[horario.dia] !== diaSemana) continue;

                        const desde = new Date(fecha);
                        desde.setHours(0, 0, 0, 0);
                        const hasta = new Date(desde);
                        hasta.setDate(hasta.getDate() + 1);

                        await tx.turnoCancha.updateMany({
                            where: {
                                canchaId: practica.canchaId,
                                fecha: {
                                    gte: desde,
                                    lt: hasta,
                                },
                                horaInicio: horario.horaInicio,
                                horaFin: horario.horaFin,
                                estado: "PRACTICA_DEPORTIVA",
                            },
                            data: {
                                estado: "LIBRE",
                                titularId: null,
                                titularTipo: null,
                            },
                        });
                    }
                }
            }

            // B. Desvincular entrenadores
            await tx.practicaDeportiva.update({
                where: { id: practicaId },
                data: { entrenadores: { set: [] } },
            });

            // C. Eliminar horarios asociados
            await tx.horarioPractica.deleteMany({
                where: { practicaId },
            });

            // D. Finalmente eliminar la práctica
            await tx.practicaDeportiva.delete({
                where: { id: practicaId },
            });
        });

        return NextResponse.json(
            { message: "Práctica deportiva eliminada correctamente" },
            { status: 200 }
        );
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Error al eliminar la práctica deportiva" },
            { status: 500 }
        );
    }
}