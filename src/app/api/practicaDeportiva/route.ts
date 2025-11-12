import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { DiaSemana, TipoDeporte } from "@prisma/client";

function haySolapamiento(h1Inicio: string, h1Fin: string, h2Inicio: string, h2Fin: string) {
    return h1Inicio < h2Fin && h1Fin > h2Inicio;
}

export async function GET(_req: NextRequest) {
    try {
        const practicas = await prisma.practicaDeportiva.findMany({
            include: {
                cancha: true,
                entrenadores: { include: { usuario: true } },
                inscripciones: true,
                horarios: true,
            },
        });
        return NextResponse.json(practicas, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Error al obtener las prácticas deportivas" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        const { deporte, canchaId, fechaInicio, fechaFin, precio, entrenadorIds, horarios } = data;

        if (!Object.values(TipoDeporte).includes(deporte)) {
            return NextResponse.json({ error: "Tipo de deporte inválido" }, { status: 400 });
        }

        const cancha = await prisma.cancha.findUnique({ where: { id: canchaId } });
        if (!cancha) {
            return NextResponse.json({ error: "La cancha especificada no existe" }, { status: 400 });
        }

        if (!fechaInicio || !fechaFin) {
            return NextResponse.json({ error: "Debe ingresar las fechas de inicio y fin." }, { status: 400 });
        }

        const entrenadores = await prisma.entrenador.findMany({
            where: { id: { in: entrenadorIds || [] } },
        });
        if (entrenadorIds && entrenadores.length !== entrenadorIds.length) {
            return NextResponse.json({ error: "Alguno de los entrenadores no existe" }, { status: 400 });
        }

        if (horarios) {
            for (const h of horarios) {
                if (!Object.values(DiaSemana).includes(h.dia)) {
                    return NextResponse.json({ error: `Dia inválido: ${h.dia}` }, { status: 400 });
                }
                if (!h.horaInicio || !h.horaFin) {
                    return NextResponse.json({ error: "Cada horario debe tener horaInicio y horaFin" }, { status: 400 });
                }
            }
        }

        if (Array.isArray(entrenadorIds) && entrenadorIds.length > 0) {
            for (const entrenadorId of entrenadorIds) {
                const practicasExistentes = await prisma.practicaDeportiva.findMany({
                    where: {
                        entrenadores: { some: { id: entrenadorId } }
                    },
                    include: { horarios: true }
                });

                for (const practica of practicasExistentes) {
                    for (const hExist of practica.horarios) {
                        for (const hNuevo of horarios) {
                            if (hExist.dia === hNuevo.dia) {
                                if (haySolapamiento(hNuevo.horaInicio, hNuevo.horaFin, hExist.horaInicio, hExist.horaFin)) {
                                    return NextResponse.json({
                                        error: `El entrenador ${entrenadorId} ya tiene una práctica el día ${hExist.dia} entre ${hExist.horaInicio} y ${hExist.horaFin}.`
                                    }, { status: 400 });
                                }
                            }
                        }
                    }
                }
            }
        }

        const nuevaPractica = await prisma.practicaDeportiva.create({
            data: {
                deporte,
                canchaId,
                fechaInicio: new Date(fechaInicio),
                fechaFin: new Date(fechaFin),
                precio,
                entrenadores: {
                    connect: entrenadores.map(e => ({ id: e.id })),
                },
                horarios: {
                    create: (horarios || []).map((h: any) => ({
                        dia: h.dia,
                        horaInicio: h.horaInicio,
                        horaFin: h.horaFin,
                    })),
                },
            },
            include: {
                entrenadores: { include: { usuario: true } },
                cancha: true,
                horarios: true,
            },
        });

        return NextResponse.json(nuevaPractica, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Error al crear la práctica" }, { status: 500 });
    }
}