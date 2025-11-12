import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { EstadoTurno, TipoDeporte } from "@prisma/client";
import { addDays, format } from "date-fns";

function haySolapamiento(h1Inicio: string, h1Fin: string, h2Inicio: string, h2Fin: string) {
    return h1Inicio < h2Fin && h1Fin > h2Inicio;
}

function generarFechas(fechaInicio: Date, fechaFin: Date): Date[] {
    const fechas: Date[] = [];
    let actual = new Date(fechaInicio);
    while (actual <= fechaFin) {
        fechas.push(new Date(actual));
        actual = addDays(actual, 1);
    }
    return fechas;
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
                        id: { not: Number(id) }
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
    if (!id) {
        return NextResponse.json({ error: "Falta el ID" }, { status: 400 });
    }

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
                    select: { dia: true, horaInicio: true, horaFin: true },
                },
            },
        });

        if (!practica) {
            return NextResponse.json({ error: "Práctica no encontrada" }, { status: 404 });
        }

        const fechaInicio = new Date(practica.fechaInicio);
        const fechaFin = new Date(practica.fechaFin);

        const diasMap: Record<string, number> = {
            DOMINGO: 0, LUNES: 1, MARTES: 2, MIERCOLES: 3,
            JUEVES: 4, VIERNES: 5, SABADO: 6,
        };

        const diasPractica = practica.horarios.map(h => h.dia);
        const diasNumeros = practica.horarios.map(h => diasMap[h.dia]);

        console.log(`\nELIMINAR PRÁCTICA ${practicaId}`);
        console.log(`Cancha: ${practica.canchaId}`);
        console.log(`Rango: ${format(fechaInicio, 'yyyy-MM-dd')} → ${format(fechaFin, 'yyyy-MM-dd')}`);
        console.log(`Días: ${diasPractica.join(', ')} → números: [${diasNumeros.join(', ')}]`);

        // Generar todas las fechas
        const todasLasFechas = generarFechas(fechaInicio, fechaFin);
        const fechasCandidatas = todasLasFechas.filter(f => diasNumeros.includes(f.getDay()));

        console.log(`\nFechas candidatas (según horarios): ${fechasCandidatas.length}`);
        fechasCandidatas.forEach(f => {
            const diaStr = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'][f.getDay()];
            console.log(`  ${format(f, 'yyyy-MM-dd')} (${diaStr})`);
        });

        let totalLiberados = 0;

        for (const fecha of fechasCandidatas) {
            const fechaStr = format(fecha, 'yyyy-MM-dd');
            const inicioDia = new Date(fecha);
            inicioDia.setHours(0, 0, 0, 0);
            inicioDia.setHours(inicioDia.getHours());  //el menos -3 es por buenos aires 

            const finDia = new Date(fecha);
            finDia.setHours(23, 59, 59, 999);
            finDia.setHours(finDia.getHours()); //-3

            // Verificar si HAY turnos ese día
            const turnosDelDia = await prisma.turnoCancha.findMany({
                where: {
                    canchaId: practica.canchaId,
                    fecha: { gte: inicioDia, lte: finDia },
                    estado: EstadoTurno.PRACTICA_DEPORTIVA,
                },
                select: { id: true, horaInicio: true, horaFin: true, fecha: true },
            });

            if (turnosDelDia.length === 0) {
                console.log(`  ${fechaStr} → NO hay turnos PRACTICA_DEPORTIVA`);
                continue;
            }

            console.log(`  ${fechaStr} → ${turnosDelDia.length} turno(s) encontrado(s):`);
            turnosDelDia.forEach(t => {
                const horaBD = new Date(t.fecha);
                console.log(`     ID ${t.id} | ${t.horaInicio}-${t.horaFin} | BD: ${horaBD.toISOString()}`);
            });

            // Liberar
            const { count } = await prisma.turnoCancha.updateMany({
                where: {
                    canchaId: practica.canchaId,
                    fecha: { gte: inicioDia, lte: finDia },
                    estado: EstadoTurno.PRACTICA_DEPORTIVA,
                },
                data: {
                    estado: EstadoTurno.LIBRE,
                    titularId: null,
                    titularTipo: null,
                },
            });

            totalLiberados += count;
            console.log(`  LIBERADOS: ${count} turno(s)\n`);
        }

        console.log(`TOTAL TURNOS LIBERADOS: ${totalLiberados}\n`);

        // Resto: entrenadores, horarios, práctica
        await prisma.practicaDeportiva.update({
            where: { id: practicaId },
            data: { entrenadores: { set: [] } },
        });

        const { count: hCount } = await prisma.horarioPractica.deleteMany({
            where: { practicaId },
        });

        await prisma.practicaDeportiva.delete({ where: { id: practicaId } });

        console.log(`PRÁCTICA ${practicaId} ELIMINADA CORRECTAMENTE`);
        console.log(`→ Turnos liberados: ${totalLiberados}`);
        console.log(`→ Horarios eliminados: ${hCount}\n`);

        return NextResponse.json({
            message: "Práctica eliminada",
            liberados: totalLiberados,
            fechasProcesadas: fechasCandidatas.map(f => format(f, 'yyyy-MM-dd')),
        });

    } catch (error: any) {
        console.error(`ERROR ELIMINANDO PRÁCTICA ${id}:`, error);
        return NextResponse.json(
            { error: "Error interno", details: error.message },
            { status: 500 }
        );
    }
}