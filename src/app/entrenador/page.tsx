"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";
import LogoutIcon from "@mui/icons-material/Logout";
import { signOut } from "next-auth/react";

export default function EntrenadorPage() {
  const { data: session } = useSession();

  return (
    <div className="h-screen">

      <div className="flex h-7/8 p-8">
        <section className="flex flex-col gap-4 p-8 w-1/2">
          <div className=" h-1/2 flex items-center flex-col gap-4">
            <div className="bg-gray-300 w-2/4 h-3/4 rounded-sm"> .</div>
            <Link
              href="/entrenador/perfil"
              className="bg-gray-900 text-white p-2 rounded-xl hover:scale-105 transition duration-300"
            >
              Perfil de {session?.user?.name}
            </Link>
          </div>
          <div className=" h-1/2 flex items-center flex-col gap-4">
            <div className="bg-gray-300 w-2/4 h-3/4 rounded-sm"> .</div>
            <Link
              href="/entrenador/asistencia"
              className="bg-gray-900 text-white p-2 rounded-xl hover:scale-105 transition duration-300"
            >
              Registro de Asistencia
            </Link>
          </div>
        </section>
        <section className="flex flex-col h-full gap-4 p-8 w-1/2 border-1 rounded-md">
          <h1 className="text-3xl font-bold">Horarios de trabajo</h1>
          <h2 className="text-xl">Dia de Actividad:</h2>
          <table className="w-full bg-blue-400 border-1">
            <thead className="bg-gray-200 w-1/2 border-1">
              <tr className="bg-[#AEC3B0] text-black">
                <th className="w-1/2 border-1">Horario inicio</th>
                <th className="w-1/2 border-1">Horario finalizacion</th>
              </tr>
            </thead>
            <tbody className="bg-gray-100 w-1/2">
              <tr>
                <td className="px-4 border-1">8:00hs</td>
                <td className="px-4 border-1">10:00hs</td>
              </tr>
              <tr>
                <td className="px-4 border-1">14:00hs</td>
                <td className="px-4 border-1">16:00hs</td>
              </tr>
            </tbody>
          </table>
          <h3 className="text-xl">Cancha asignada:</h3>
          <p className="ml-4">- Cancha de ejemplo</p>
        </section>
      </div>
    </div>
  );
}
