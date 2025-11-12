import { NextResponse, NextRequest } from "next/server";
import prisma from "@/app/lib/prisma";
import { Rol, TipoDeporte } from "@prisma/client";

export async function GET() {
    try {
        const entrenadores = await prisma.entrenador.findMany({
            include: {
                usuario: true,
                practicas: true,
            },
        });
        return NextResponse.json(entrenadores);
    } catch (error) {
        return NextResponse.json({ error: "Error al obtener entrenadores" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        const { nombre, apellido, dni, email, telefono, password } = data;

        if (!nombre || !apellido || !dni || !email || !password) {
            return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
        }
        const existente = await prisma.usuario.findFirst({
            where: { OR: [{ dni }, { email }] },
        });

        if (existente) {
            return NextResponse.json(
                { error: "El DNI o el email ya están registrados" },
                { status: 400 }
            );
        }

        //const hashedPassword = await bcrypt.hash(password, 10);

        const nuevoEntrenador = await prisma.entrenador.create({
            data: {
                usuario: {
                    create: {
                        nombre,
                        apellido,
                        dni,
                        email,
                        telefono,
                        password,
                        rol: Rol.ENTRENADOR,
                    },
                },
            },
            include: {
                usuario: true,
                practicas: true,
            },
        });

        return NextResponse.json(nuevoEntrenador);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Error al crear el entrenador" }, { status: 500 });
    }
}