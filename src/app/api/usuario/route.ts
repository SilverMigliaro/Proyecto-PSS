import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { Rol } from "@prisma/client";
//import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const rolParam = searchParams.get("rol");
        const dniParam = searchParams.get("dni");

        const whereClause: any = {};

        if (rolParam) {
            if (!Object.values(Rol).includes(rolParam as Rol)) {
                return NextResponse.json(
                    { error: "Rol inválido" },
                    { status: 400 }
                );
            }
            whereClause.rol = rolParam as Rol;
        }

        if (dniParam) {
            whereClause.dni = dniParam;
        }
        const usuarios = await prisma.usuario.findMany({
            where: whereClause,
            select: {
                id: true,
                nombre: true,
                apellido: true,
                dni: true,
                email: true,
                telefono: true,
                rol: true,
                fechaAlta: true,
            },
        });

        return NextResponse.json(usuarios, { status: 200 });
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        return NextResponse.json({ error: "Error al obtener los usuarios" }, { status: 500 });
    }
}
export async function POST(req: NextRequest) {
    try {
        const { nombre, apellido, dni, email, telefono, password, rol } = await req.json();

        if (!nombre || !apellido || !dni || !email || !password || !rol) {
            return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
        }

        //const hashedPassword = await bcrypt.hash(password, 10);

        const usuario = await prisma.usuario.create({
            data: {
                nombre,
                apellido,
                dni,
                email,
                telefono,
                password,//: hashedPassword,
                rol,
            },
        });

        return NextResponse.json(usuario, { status: 201 });
    } catch (error: any) {

        if (error.code === "P2002") {
            return NextResponse.json(
                { error: "El DNI o el email ya están registrados" },
                { status: 400 }
            );
        }

        return NextResponse.json({ error: "Error al crear un usuario" }, { status: 500 });
    }
}

