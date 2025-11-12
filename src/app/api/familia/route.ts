import prisma from "@/app/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

export async function GET() {
  try {
    const familias = await prisma.familia.findMany({
      include: { miembros: { include: { usuario: true } } },
    });
    return NextResponse.json(familias);
  } catch (error) {
    console.error("Error al obtener familias:", error);
    return NextResponse.json(
      { error: "Error al obtener las familias" },
      { status: 500 }
    );
  }
}

// export async function POST(req: NextRequest) {
//     try {
//         const data = await req.json();
//         const { apellido, descuento } = data;

//         if (!apellido || apellido.trim() === "") {
//             return NextResponse.json(
//                 { error: "El apellido es obligatorio" },
//                 { status: 400 }
//             );
//         }

//         const nuevaFamilia = await prisma.familia.create({
//             data: {
//                 apellido,
//                 descuento: descuento ?? 0.0,
//             },
//         });

//         return NextResponse.json(nuevaFamilia, { status: 201 });
//     } catch (error) {
//         console.error("Error al crear familia:", error);
//         return NextResponse.json(
//             { error: "Error al crear familia" },
//             { status: 500 }
//         );
//     }
// }

export async function POST(req: Request) {
  try {
    const { apellido, titularDni, miembrosDni } = await req.json();

    if (!apellido || !titularDni) {
      return NextResponse.json(
        { error: "Debe indicar apellido y DNI del titular." },
        { status: 400 }
      );
    }

    // Verificar que el titular exista
    const titular = await prisma.socio.findUnique({
      where: { usuarioDni: titularDni },
    });

    if (!titular) {
      return NextResponse.json(
        { error: "El titular no existe en el sistema." },
        { status: 404 }
      );
    }

    // Verificar los miembros (si se enviaron)
    let miembrosValidos: any[] = [];
    if (miembrosDni && miembrosDni.length > 0) {
      miembrosValidos = await prisma.socio.findMany({
        where: { usuarioDni: { in: miembrosDni } },
      });

      if (miembrosValidos.length !== miembrosDni.length) {
        return NextResponse.json(
          { error: "Uno o más DNI de miembros no existen." },
          { status: 400 }
        );
      }
    }

    // Crear la familia
    const familia = await prisma.familia.create({
      data: {
        apellido,
        titularDni,
        miembros: {
          connect: miembrosValidos.map((m) => ({ id: m.id })),
        },
      },
      include: {
        miembros: true,
      },
    });

    // ✅ Actualizar tipoPlan de todos los miembros + titular
    const dnisActualizar = [titularDni, ...(miembrosDni ?? [])];

    await prisma.socio.updateMany({
      where: {
        usuarioDni: { in: dnisActualizar },
      },
      data: {
        tipoPlan: "FAMILIAR",
      },
    });

    return NextResponse.json(
      { message: "Familia creada correctamente", familia },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al crear la familia:", error);
    return NextResponse.json(
      { error: "Error interno al crear la familia" },
      { status: 500 }
    );
  }
}
