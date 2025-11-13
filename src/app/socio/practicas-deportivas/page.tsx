"use client";
import { useEffect, useState } from "react";
import { PracticaDeportiva, InscripcionDeportiva } from "@/app/lib/types";
import { signOut } from "next-auth/react";
import LogoutIcon from "@mui/icons-material/Logout";
import { useSession } from "next-auth/react";
import { set } from "zod/v4";
import Link from "next/link";

export default function Page() {
  const [modo, setModo] = useState<"MIS_PRACTICAS" | "INSCRIBIRME" | "">("");
  const { data: session } = useSession();
  const [practicasDeportivas, setPracticasDeportivas] = useState<
    PracticaDeportiva[]
  >([]);
  const [misPracticas, setmisPracticas] = useState<InscripcionDeportiva[]>([]);
  const [socioId, setSocioId] = useState<number | null>(null);
  const [practicaSeleccionada, setPracticaSeleccionada] =
    useState<PracticaDeportiva>();
  const [successMessage, setSuccessMessage] = useState("");

  const handleBajaClick = (practica: PracticaDeportiva) => {
    setPracticaSeleccionada(practica);
  };

  const handleConfirmarBaja = () => {
    if (practicaSeleccionada) {
      desincribirse(practicaSeleccionada.id);
      // setPracticaSeleccionada(undefined);
    }
  };

  const inscribirse = async (practicaId: number) => {
    const res = await fetch("/api/inscripcionDeportiva", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        socioId: socioId,
        practicaId: practicaId,
        precioPagado: 100, //Por defecto
      }),
    });
    if (!res.ok) {
      throw new Error(`Error HTTP ${res.status}`);
    }
    const data = await res.json();
    setPracticasDeportivas((prevPracticas) =>
      prevPracticas.filter((practica) => practica.id !== data.practica.id)
    );
    setModo("");
  };

  const desincribirse = async (practicaId: number) => {
    const res = await fetch(
      `/api/inscripcionDeportiva/socio/${socioId}/${practicaId}`,
      {
        method: "DELETE",
      }
    );
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Error al desinscribirse");
    }
    const data = await res.json();
    setmisPracticas((prev) =>
      prev.filter((p) => p.practica?.id !== practicaId)
    );
    setSuccessMessage("Baja realizada con éxito ✅");
    setModo("");
  };

  useEffect(() => {
    // Definimos una función asíncrona principal
    const inicializarDatos = async () => {
      if (!session?.user?.dni) return; // Salir si no hay DNI

      // 1. OBTENER AMBOS DATOS CONCURRENTEMENTE
      try {
        // Obtener inscripciones del usuario
        const [resMisPracticas, resTodasPracticas] = await Promise.all([
          fetch(`/api/socio/${session.user.dni}`),
          fetch("/api/practicaDeportiva"),
        ]);

        // Manejo de errores
        if (!resMisPracticas.ok)
          throw new Error(
            `Error al obtener inscripciones: ${resMisPracticas.status}`
          );
        if (!resTodasPracticas.ok)
          throw new Error(
            `Error al obtener todas las prácticas: ${resTodasPracticas.status}`
          );

        const dataMisPracticas = await resMisPracticas.json();
        setSocioId(dataMisPracticas.id);
        const dataTodasPracticas = await resTodasPracticas.json();
        const inscripciones: InscripcionDeportiva[] =
          dataMisPracticas.inscripciones || [];
        const todasLasPracticas: PracticaDeportiva[] = dataTodasPracticas || [];

        // 2. EXTRAER IDs de las prácticas ya inscritas
        // Usamos un Set para una búsqueda O(1) mucho más rápida.
        const idsInscritos = new Set(
          inscripciones.map((inscripcion) => inscripcion.practicaId)
        );

        // 3. FILTRAR las prácticas disponibles
        const practicasDisponibles = todasLasPracticas.filter(
          (practica) =>
            // Excluir la práctica si su ID se encuentra en el Set de inscritos
            !idsInscritos.has(practica.id)
        );

        // 4. ESTABLECER LOS ESTADOS
        setmisPracticas(inscripciones);
        setPracticasDeportivas(practicasDisponibles);
        // También puedes establecer el modo si es necesario:
        // setModo("INSCRIBIRME");
      } catch (error) {
        console.error("Error al inicializar datos:", error);
        // Manejar error (ej: setear estado de error, mostrar notificación)
      }
    };
    if (session?.user) {
      inicializarDatos();
    }
    // Dependencias: Ejecutar cuando cambie la sesión (al iniciar)
  }, [modo, session?.user]);

  return (
    <div className="h-screen flex flex-col items-center">

      <Link
        className="self-end p-6 mt-3 mr-3 border shadow-sm bg-[#01161E] text-white border-black font-bold shadow-black rounded-2xl"
        href={"/socio"}
      >
        {" "}
        Volver a inicio{" "}
      </Link>
      <div className="flex flex-col gap-4 p-2 items-center justify-center">
        {modo !== "" && (
          <button
            className={`border shadow-sm bg-[#01161E] text-white border-black font-bold shadow-black w-fit p-2 rounded-2xl hover:scale-105 transition duration-300`}
            onClick={() => {
              setModo("");
            }}
          >
            Inicio
          </button>
        )}
        {modo === "" && (
          <div className="flex gap-5">
            <button
              className={`border shadow-sm bg-[#01161E] text-white border-black font-bold shadow-black p-2 rounded-2xl hover:scale-105 transition duration-300`}
              onClick={() => setModo("MIS_PRACTICAS")}
            >
              Mis practicas
            </button>
            <button
              className={`border shadow-sm bg-[#01161E] text-white border-black font-bold shadow-black p-6 rounded-2xl hover:scale-105 transition duration-300`}
              onClick={() => setModo("INSCRIBIRME")}
            >
              Inscribirme a practicas deportivas
            </button>
          </div>
        )}
      </div>

      {modo === "MIS_PRACTICAS" && (
        <div className="w-3/4 ">
          {misPracticas.map((practica) => (
            <div
              key={practica.id}
              className="border p-8 m-2 bg-white flex justify-between items-center rounded-2xl"
            >
              <div className="flex flex-col">
                <h1 className="font-bold text-2xl">
                  {practica.practica?.deporte}
                </h1>
                <div className="flex gap-2">
                  <p className="font-bold">Cancha:</p>
                  {practica.practica?.canchaId}
                </div>
                <div className="flex gap-2">
                  <p className="font-bold">Fecha Inicio:</p>
                  {practica.practica?.fechaInicio
                    ? new Date(practica.practica.fechaFin).toLocaleString(
                      "es-AR",
                      {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )
                    : "Sin fecha"}
                </div>
                <div className="flex gap-2">
                  <p className="font-bold">Fecha Fin:</p>
                  {practica.practica?.fechaFin
                    ? new Date(practica.practica.fechaFin).toLocaleString(
                      "es-AR",
                      {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )
                    : "Sin fecha"}
                </div>
                <div>
                  <p className="font-bold"> Profesores:</p>
                  {practica.practica?.entrenadores.map((entrenador) => (
                    <div key={entrenador.id} className="flex gap-2">
                      -<p>{entrenador.usuario.nombre}</p>
                      <p>{entrenador.usuario.apellido}</p>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => {
                  handleBajaClick(practica.practica!);
                }}
                className="border shadow-sm shadow-black border-black p-1 rounded-2xl hover:scale-105 transition duration-300 bg-red-500 font-bold text-white mr-4 h-[50px]"
              >
                Darme de baja
              </button>
            </div>
          ))}
        </div>
      )}

      {practicaSeleccionada && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-[400px]">
            <h2 className="text-xl font-semibold mb-4 text-center">
              Confirmar baja
            </h2>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Deporte:</strong> {practicaSeleccionada.deporte}
              </div>
              <div>
                <strong>Cancha:</strong> {practicaSeleccionada.canchaId}
              </div>
              <div>
                <strong>Fecha Inicio:</strong>{" "}
                {practicaSeleccionada.fechaInicio}
              </div>
              <div>
                <strong>Fecha Fin:</strong> {practicaSeleccionada.fechaFin}
              </div>
              <div>
                <strong>Profesores:</strong>
                {practicaSeleccionada.entrenadores.map((entrenador) => (
                  <div key={entrenador.id}>
                    - {entrenador.usuario.nombre} {entrenador.usuario.apellido}
                  </div>
                ))}
              </div>
            </div>

            {/* 🔹 Mostrar mensaje de éxito */}
            {successMessage && (
              <>
                <div className="bg-green-200 text-green-800 p-3 m-4 rounded-xl text-center">
                  {successMessage}
                </div>
                <button
                  className="border text-black p-2 rounded-2xl hover:scale-105 transition duration-300 mt-4"
                  onClick={() => {
                    setSuccessMessage("");
                    setPracticaSeleccionada(undefined);
                  }}
                >
                  Cerrar
                </button>
              </>
            )}
            {!successMessage && (
              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setPracticaSeleccionada(undefined)}
                  className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmarBaja}
                  className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
                >
                  Confirmar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {modo === "INSCRIBIRME" && (
        <div className="w-3/4">
          {practicasDeportivas.map((practica) => (
            <div
              key={practica.id}
              className="flex justify-between items-center border p-8 m-2 rounded-2xl bg-white"
            >
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 text-2xl font-bold">
                  {practica.deporte}
                </div>
                <div className="flex gap-2">
                  <p className="font-bold">Cancha: </p>
                  {practica.canchaId}
                </div>
                <div className="flex gap-2">
                  <p className="font-bold">Fecha Inicio:</p>
                  {practica.fechaInicio
                    ? new Date(practica.fechaFin).toLocaleString("es-AR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                    : "Sin fecha"}
                </div>
                <div className="flex gap-2">
                  <p className="font-bold">Fecha Fin:</p>
                  {practica.fechaFin
                    ? new Date(practica.fechaFin).toLocaleString("es-AR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                    : "Sin fecha"}
                </div>
                <div>
                  <p className="font-bold">Profesores:</p>

                  {practica.entrenadores.map((entrenador) => (
                    <div key={entrenador.id} className="flex gap-2">
                      -<p>{entrenador.usuario.nombre}</p>
                      <p>{entrenador.usuario.apellido}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <p className="font-bold">Capacidad:</p>
                  {practica.inscripciones.length} /{" "}
                  {practica.cancha.capacidadMax}
                </div>
              </div>
              {practica.cancha.capacidadMax > practica.inscripciones.length && (
                <button
                  onClick={() => inscribirse(practica.id)}
                  className="border shadow-sm shadow-black border-black p-1 rounded-2xl hover:scale-105 transition duration-300 bg-green-500 font-bold text-black mr-4 h-[50px]"
                >
                  Inscribirme
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
