import { NextResponse, NextRequest } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const alquilerId = Number(id);

    if (!alquilerId || isNaN(alquilerId)) {
        return NextResponse.json({ error: 'Falta o es inválido el id del alquiler de la cancha' }, { status: 400 })
    }

    try {
        const alquiler = await prisma.alquilerCancha.findUnique({
            where: { id: alquilerId },
            include: {
                socio: { include: { usuario: true } },
                turno: { include: { cancha: true } },
            },
        });

        if (!alquiler) {
            return NextResponse.json(
                { error: "Alquiler no encontrado" },
                { status: 404 }
            );
        }

        return NextResponse.json(alquiler);
    } catch (error) {
        console.error(`[GET /api/alquileres/${id}] Error:`, error);
        return NextResponse.json(
            { error: "Error al obtener el alquiler" },
            { status: 500 }
        );
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const alquilerId = Number(id);

    if (!alquilerId || isNaN(alquilerId)) {
        return NextResponse.json({ error: 'Falta o es inválido el id del alquiler de la cancha' }, { status: 400 })
    }

    try {
        const body = await req.json();
        const { estado, motivo } = body;

        if (!estado) {
            return NextResponse.json(
                { error: "Debe indicar el nuevo estado del alquiler" },
                { status: 400 }
            );
        }

        const alquiler = await prisma.alquilerCancha.findUnique({
            where: { id: alquilerId },
            include: { turno: true },
        });

        if (!alquiler) {
            return NextResponse.json(
                { error: "Alquiler no encontrado" },
                { status: 404 }
            );
        }

        if (estado === "CANCELADO") {
            await prisma.turnoCancha.update({
                where: { id: alquiler.turnoId },
                data: { estado: "LIBRE" },
            });
        }

        const actualizado = await prisma.alquilerCancha.update({
            where: { id: alquilerId },
            data: {
                estadoAlquiler: estado,
                motivoCancelacion: motivo || null,
                fechaCancelacion: estado === "CANCELADO" ? new Date() : null,
            },
        });

        return NextResponse.json(actualizado);
    } catch (error) {
        console.error(`[PUT /api/alquileres/${id}] Error:`, error);
        return NextResponse.json(
            { error: "Error al actualizar el estado del alquiler" },
            { status: 500 }
        );
    }
}
