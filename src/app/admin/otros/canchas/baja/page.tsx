"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useToast } from "@/app/ui/components/Toast";
import ModalMensaje from "@/app/ui/components/modal/ModalCanchaEliminar"
import { useRouter } from "next/navigation";

type TipoDeporte = "FUTBOL" | "BASQUET" | "NATACION" | "HANDBALL";

type Horario = {
    id: number;
    diaSemana: string;
    horaInicio: string;
    horaFin: string;
};

type CanchaAPI = {
    id: number;
    nombre: string;
    tipoDeporte: TipoDeporte[];
    interior: boolean;
    capacidadMax: number;
    precioHora: number;
    activa: boolean;
    horarios?: Horario[];
};

// Diccionarios legibles
const deporteApiToUi: Record<string, string> = {
    FUTBOL: "FÚTBOL",
    BASQUET: "BÁSQUET",
    NATACION: "NATACIÓN",
    HANDBALL: "HANDBALL",
};

// Mapeo de días sin acento en la base a texto con acento en UI
const diaApiToUi: Record<string, string> = {
    LUNES: "Lunes",
    MARTES: "Martes",
    MIERCOLES: "Miércoles",
    JUEVES: "Jueves",
    VIERNES: "Viernes",
    SABADO: "Sábado",
    DOMINGO: "Domingo",
};

export default function BajaCanchaPage() {
    const router = useRouter()
    const [canchas, setCanchas] = useState<CanchaAPI[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMensaje, setModalMensaje] = useState("");
    const [modalTipo, setModalTipo] = useState<"error" | "exito" | "info">("info");

    const { show, ToastPortal } = useToast();

    // Carga las canchas con sus horarios asociados
    async function loadCanchas() {
        try {
            const res = await fetch("/api/cancha", { cache: "no-store" });
            if (!res.ok) throw new Error("No se pudo cargar canchas");
            const data = (await res.json()) as CanchaAPI[];

            const unique = Array.from(new Map(data.map((c) => [c.id, c])).values()).filter(
                (c) => c.activa !== false
            );

            setCanchas(unique);
        } catch (err) {
            console.error(err);
            show("Error al cargar las canchas", "error");
        }
    }

    useEffect(() => {
        loadCanchas().catch(console.error);
    }, []);

    const canchaSel = useMemo(
        () => canchas.find((c) => c.id === selectedId) ?? null,
        [canchas, selectedId]
    );

    async function handleDelete() {
        if (selectedId == null) {
            setModalMensaje("Seleccioná una cancha para eliminar");
            setModalTipo("info");
            setModalOpen(true);
            return;
        }
        const nombre = canchaSel?.nombre ?? "la cancha";

        setDeleting(true);

        try {
            const res = await fetch(`/api/cancha/${selectedId}`, { method: "DELETE", cache: "no-store" });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                if (err.code === "PRACTICAS_ASIGNADAS") {
                    setModalMensaje("No se puede eliminar una cancha con prácticas deportivas asignadas. Reasigne las prácticas antes de eliminarla.");
                    setModalTipo("info");
                    setModalOpen(true);
                    return;
                }

                throw new Error(err?.error || "No se pudo eliminar la cancha");
            }

            await loadCanchas();
            setSelectedId(null);
            setModalMensaje("Cancha eliminada exitosamente");
            setModalTipo("exito");
            setModalOpen(true);
            router.push("/admin/otros")
        } catch (e) {
            console.error(e);
            show((e as Error).message || "Error al eliminar la cancha", "error");
        } finally {
            setDeleting(false);
        }
    }

    const renderUbicacion = (c: CanchaAPI) => (c.interior ? "INTERIOR" : "EXTERIOR");

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-6 md:px-10">
            <div className="max-w-4xl mx-auto bg-white shadow-md rounded-xl border border-gray-200 p-6">
                <h1 className="text-2xl font-bold text-white w-full bg-[#1a222e] rounded-t-xl uppercase p-4 text-center mb-6">Baja de cancha</h1>

                {/* Selector de cancha */}
                <div className="mb-5">
                    <label className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-gray-700">
                            Seleccioná una cancha activa <span className="text-red-600">*</span>
                        </span>
                        <select
                            value={selectedId ?? ""}
                            onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : null)}
                            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
                        >
                            <option value="">— Elegir —</option>
                            {canchas.map((c) => (
                                <option key={c.id} value={c.id}>
                                    #{c.id} · {c.nombre} ·  {c.tipoDeporte.map(d => deporteApiToUi[d]).join(", ")} ·{" "}
                                    {c.interior ? "INTERIOR" : "EXTERIOR"}
                                </option>
                            ))}
                        </select>
                    </label>

                    {/* Detalles de la cancha seleccionada */}
                    {canchaSel && (
                        <div className="mt-4 text-sm text-gray-700 border rounded-lg p-3 bg-gray-50">
                            <div><span className="font-semibold">ID:</span> {canchaSel.id}</div>
                            <div><span className="font-semibold">Nombre:</span> {canchaSel.nombre}</div>
                            <div>
                                <span className="font-semibold">Deporte:</span>{" "}
                                {canchaSel.tipoDeporte.map(d => deporteApiToUi[d] || d).join(", ")}
                            </div>                            <div><span className="font-semibold">Ubicación:</span> {renderUbicacion(canchaSel)}</div>
                            <div><span className="font-semibold">Capacidad:</span> {canchaSel.capacidadMax}</div>
                            <div><span className="font-semibold">Precio:</span> ${canchaSel.precioHora}</div>
                            {canchaSel.horarios && canchaSel.horarios.length > 0 && (
                                <div className="mt-3">
                                    <span className="font-semibold">Horarios:</span>
                                    <ul className="list-disc pl-5 mt-1 text-gray-700">
                                        {canchaSel.horarios.map((h) => (
                                            <li key={h.id}>
                                                {diaApiToUi[h.diaSemana] ?? h.diaSemana} — {h.horaInicio} a {h.horaFin}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Botones */}
                <div className="flex gap-3 mb-6">
                    <button
                        onClick={handleDelete}
                        disabled={selectedId == null || deleting}
                        className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50"
                    >
                        {deleting ? "Eliminando..." : "Eliminar"}
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedId(null)}
                        className="border px-4 py-2 rounded-lg text-sm bg-gray-50 hover:bg-gray-100"
                    >
                        Cancelar
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto mt-6 border border-gray-200 rounded-xl shadow-sm p-5">
                <h2 className="w-full bg-[#1a222e] p-2 font-semibold mb-3 text-center text-white uppercase rounded-t-xl">
                    Listado de canchas
                </h2>

                {canchas.length === 0 ? (
                    <p className="text-sm text-gray-600 textt-center p-6">No hay canchas registradas.</p>
                ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                        {canchas.map((c, i) => (
                            <div
                                key={c.id}
                                role="button"
                                onClick={() => setSelectedId(c.id)}
                                className={`rounded-lg px-4 py-3 flex flex-col gap-2 
                                    transition-colors cursor-pointer
                                     ${selectedId === c.id ? " bg-[#F4A460]" : i % 2 === 0 ? "bg-[#CDD9EA]" : "bg-white"
                                    }`}
                            >
                                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-800">
                                    <span className="font-semibold text-gray-900">ID: {c.id}</span>
                                    <span className="font-semibold">{c.nombre}</span>
                                    <span className=" font-bold px-2 py-0.5 text-md ">
                                        {c.tipoDeporte.map(d => deporteApiToUi[d]).join(", ")}
                                    </span>
                                    <span className="font-bold px-2 py-0.5 text-md">
                                        {renderUbicacion(c)}
                                    </span>
                                    <span className="font-bold px-2 py-0.5 text-md">Capacidad: {c.capacidadMax ?? "-"}</span>
                                    <span className="font-bold px-2 py-0.5 text-md">Precio: ${c.precioHora ?? "-"}</span>
                                </div>

                                {c.horarios && c.horarios.length > 0 && (
                                    <div className="mt-2 text-sm text-gray-700 flex flex-wrap gap-2">
                                        {c.horarios.map((h, i) => (
                                            <span
                                                key={i}
                                                className={`inline-block border px-2 py-0.5 rounded-full font-bold text-xs text-[#152132] border-[#222222]`}
                                            >
                                                {diaApiToUi[h.diaSemana] ?? h.diaSemana}: {h.horaInicio} - {h.horaFin}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <ModalMensaje
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                mensaje={modalMensaje}
                tipo={modalTipo}
            />
            <ToastPortal />
        </div>
    );
}
