"use client";
import { Socio, Usuario } from "@prisma/client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface ModalEliminarPlanFamiliarProps {
  open: boolean;
  onClose: () => void;
}

export default function ModalEliminarPlanFamiliar({
  open,
  onClose,
}: ModalEliminarPlanFamiliarProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dniTitular, setDniTitular] = useState("");
  const [familia, setFamilia] = useState<any>(null);
  const [miembros, setMiembros] = useState<any[]>([]);
  const router = useRouter();

  if (!open) return null;
  const handleBuscar = async () => {
    setError("");
    setLoading(true);
    const res = await fetch(`/api/socio/${dniTitular}`);
    if (res.ok) {
      const familia = await res.json();
      if (familia.familia != null) {
        const miembrosRes = await fetch(`/api/familia/${familia.familia.id}`);
        if (miembrosRes.ok) {
          const miembros = await miembrosRes.json();
          console.log("miembros:", miembros);
          setMiembros(miembros.miembros);
        }

        setFamilia(familia);
      } else {
        setError("No se encontró una familia para ese titular.");
      }
    } else {
      setError("No se encontró una familia para ese titular.");
    }
    setLoading(false);
  };

  const onCancel = () => {
    setFamilia(null);
    setDniTitular("");
    setError(null);
    setSuccess(null);
    onClose();
  };

  const handleEliminar = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    const res = await fetch(`/api/familia/${familia.familia.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setSuccess("Plan familiar eliminado con éxito.");
    } else {
      setError("Error al eliminar el plan familiar.");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-center">
          Eliminar Plan Familiar
        </h2>

        {familia != null ? (
          <div>
            <h1 className="font-bold flex gap-2">
              Apellido del titular:
              <p className="font-light">{familia.familia.apellido}</p>
            </h1>
            <h2 className="font-bold flex gap-2">
              Dni titular:
              <p className="font-light">{familia.familia.titularDni}</p>
            </h2>
            <div className="flex flex-col gap-2">
              <h3 className="font-bold">Miembros:</h3>
              {miembros.map((miembro) => (
                <div
                  key={miembro.usuarioDni}
                  className="border border-gray-400 rounded-sm p-2"
                >
                  <p>Dni: {miembro.usuarioDni}</p>
                  <p>Nombre: {miembro.usuario.nombre}</p>
                  <p>Apellido: {miembro.usuario.apellido} </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <label htmlFor="dniTitular">Dni del titular:</label>
            <input
              className="border border-gray-400 rounded-sm"
              onChange={(e) => setDniTitular(e.target.value)}
              id="dniTitular"
              type="text"
            />
          </div>
        )}

        {error && <p className="text-red-500 text-center mb-2">{error}</p>}
        {success && (
          <p className="text-green-600 text-center mb-2">{success}</p>
        )}

        <div className="flex justify-center gap-3 mt-4">
          {!success && (
            <button
              onClick={() => {
                onCancel();
              }}
              className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400 text-black"
              disabled={false}
            >
              Cancelar
            </button>
          )}
          {familia && !success ? (
            <button
              onClick={handleEliminar}
              className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white"
              disabled={loading}
            >
              {loading ? "Eliminando..." : "Eliminar"}
            </button>
          ) : !success ? (
            <button
              onClick={handleBuscar}
              className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-700 text-white"
              disabled={loading && dniTitular.trim() === ""}
            >
              {loading ? "Buscando..." : "Buscar"}
            </button>
          ) : (
            <button
              className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400 text-black"
              onClick={() => {
                router.push("/admin/cuentas");
                onClose();
                setFamilia(null);
                setDniTitular("");
                setError(null);
                setSuccess(null);
              }}
            >
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
