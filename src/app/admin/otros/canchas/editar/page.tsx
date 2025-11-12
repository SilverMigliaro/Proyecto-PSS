"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useToast } from "@/app/ui/components/Toast";
import ModalEditable from "@/app/ui/components/modal/ModificarHorarioModal";

import EditCalendarIcon from '@mui/icons-material/EditCalendar';
import EditDocumentIcon from '@mui/icons-material/EditDocument';
import { useRouter } from "next/navigation";
type TipoDeporte = "FUTBOL" | "BASQUET" | "NATACION" | "HANDBALL";
type Ubicacion = "INTERIOR" | "EXTERIOR";

export type Horario = {
    diaSemana: string;
    horaInicio: string;
    horaFin: string;
};

export type CanchaListado = {
    id: number;
    nombre: string;
    tipoDeporte: TipoDeporte[];
    interior?: boolean;
    ubicacion?: Ubicacion;
    capacidadMax?: number;
    capacidadMaxima?: number;
    precioHora?: number;
    precioPorHora?: number;
    horarios: Horario[];
};

type FormUI = {
    nombre: string;
    tipoDeporte: TipoDeporte[];
    ubicacion: Ubicacion;
    capacidadMaxima: number;
    precioPorHora: number | "";
    diasSeleccionados: string[];
    horaApertura: string;
    horaCierre: string;
};

const deporteApiToUi: Record<string, TipoDeporte> = {
    FUTBOL: "FUTBOL",
    BASQUET: "BASQUET",
    NATACION: "NATACION",
    HANDBALL: "HANDBALL",
};

const diaApiToUi: Record<string, string> = {
    LUNES: "Lunes",
    MARTES: "Martes",
    MIERCOLES: "Miércoles",
    JUEVES: "Jueves",
    VIERNES: "Viernes",
    SABADO: "Sábado",
    DOMINGO: "Domingo",
};

function apiToUi(c: CanchaListado): FormUI {
    const primerHorario = c.horarios[0] ?? { diaSemana: "LUNES", horaInicio: "08:00", horaFin: "22:00" };
    const tipos: TipoDeporte[] = Array.isArray(c.tipoDeporte)
        ? c.tipoDeporte
        : (c.tipoDeporte ? [c.tipoDeporte as TipoDeporte] : ["FUTBOL"]);
    return {
        nombre: c.nombre ?? "",
        tipoDeporte: c.tipoDeporte.length > 0 ? c.tipoDeporte : ["FUTBOL"],
        ubicacion: c.interior ? "INTERIOR" : "EXTERIOR",
        capacidadMaxima: typeof c.capacidadMax === "number" ? c.capacidadMax : 10,
        precioPorHora: typeof c.precioHora === "number" ? c.precioHora : 0,
        diasSeleccionados: [primerHorario.diaSemana],
        horaApertura: primerHorario.horaInicio,
        horaCierre: primerHorario.horaFin,
    };
}

const NOMBRE_REGEX = /^[A-Za-z ]+$/;

export default function EditarCanchaPage() {
    const router = useRouter()
    const [canchas, setCanchas] = useState<CanchaListado[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const { show, ToastPortal } = useToast();

    const [form, setForm] = useState<FormUI>({
        nombre: "",
        tipoDeporte: [],
        ubicacion: "EXTERIOR",
        capacidadMaxima: 10,
        precioPorHora: 0,
        diasSeleccionados: ["LUNES"],
        horaApertura: "08:00",
        horaCierre: "22:00",
    });

    const [modalOpen, setModalOpen] = useState(false);

    async function loadCanchas() {
        const res = await fetch("/api/cancha", { cache: "no-store" });
        if (!res.ok) throw new Error("No se pudo cargar canchas");
        const dataRaw = await res.json();

        // Convertimos cada tipoDeporte en array si viene como string
        const data: CanchaListado[] = dataRaw.map((c: any) => ({
            ...c,
            tipoDeporte: Array.isArray(c.tipoDeporte)
                ? c.tipoDeporte
                : (c.tipoDeporte ? [c.tipoDeporte] : ["FUTBOL"]),
        }));

        const unique = Array.from(new Map(data.map(c => [c.id, c])).values());
        setCanchas(unique);
    }

    useEffect(() => { loadCanchas().catch(console.error); }, []);

    const canchaSel = useMemo(() => canchas.find(c => c.id === selectedId) ?? null, [canchas, selectedId]);

    useEffect(() => {
        if (canchaSel) setForm(apiToUi(canchaSel));
    }, [canchaSel]);

    function onChange<K extends keyof FormUI>(k: K, v: FormUI[K]) {
        setForm(prev => ({ ...prev, [k]: v }));
    }

    function reset() {
        setSelectedId(null);
        setForm({
            nombre: "",
            tipoDeporte: [],
            ubicacion: "EXTERIOR",
            capacidadMaxima: 10,
            precioPorHora: 0,
            diasSeleccionados: ["LUNES"],
            horaApertura: "08:00",
            horaCierre: "22:00",
        });
    }

    function validate(): string | null {
        const nombreTrim = form.nombre.trim();
        if (!nombreTrim || !NOMBRE_REGEX.test(nombreTrim)) return "Ingresá un nombre válido: solo letras (A–Z) y espacios.";
        if (form.tipoDeporte.length === 0) return "Seleccioná el tipo de deporte.";
        if (!form.ubicacion) return "Seleccioná la ubicación.";
        if (!form.capacidadMaxima || form.capacidadMaxima < 1) return "La capacidad máxima debe ser mayor o igual a 1.";
        if (form.precioPorHora === "") return "Ingresá el precio por hora.";
        if (Number.isNaN(Number(form.precioPorHora)) || Number(form.precioPorHora) < 0) return "El precio por hora debe ser 0 o mayor.";
        if (form.diasSeleccionados.length === 0) return "Seleccioná al menos un día.";
        if (!form.horaApertura || !form.horaCierre) return "Completá la hora de apertura y cierre.";
        const toMin = (s: string) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
        if (toMin(form.horaApertura) >= toMin(form.horaCierre)) return "La hora de apertura debe ser menor que la de cierre.";
        return null;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (selectedId == null || submitting) return;

        const err = validate();
        if (err) {
            show(err, "error");
            return;
        }

        setSubmitting(true);
        try {
            const DIAS_ORDEN = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];
            const horariosOrdenados = [...form.diasSeleccionados].sort(
                (a, b) => DIAS_ORDEN.indexOf(a) - DIAS_ORDEN.indexOf(b)
            ).map(d => ({
                diaSemana: d,
                horaInicio: form.horaApertura,
                horaFin: form.horaCierre
            }));
            const payload = {
                nombre: form.nombre.trim(),
                tipoDeporte: form.tipoDeporte,
                interior: form.ubicacion === "INTERIOR",
                capacidadMax: form.capacidadMaxima,
                precioHora: Number(form.precioPorHora),
                horarios: horariosOrdenados,
            };

            const res = await fetch(`/api/cancha/${selectedId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                cache: "no-store",
            });

            if (!res.ok) {
                const er = await res.json().catch(() => ({}));
                throw new Error(er?.error || "No se pudo actualizar la cancha");
            }

            await loadCanchas();
            show("Cambios guardados exitosamente", "success");
            router.push("/admin/otros");
        } catch (err) {
            console.error(err);
            show((err as Error).message || "Error al actualizar la cancha", "error");
        } finally {
            setSubmitting(false);
        }
    }

    const renderUbicacion = (c: CanchaListado) => (c.interior ? "INTERIOR" : "EXTERIOR");

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-6 md:px-10">
            <div className="max-w-4xl mx-auto bg-white shadow-md rounded-xl border border-gray-200 p-6">
                <h1 className="text-2xl font-semibold w-full text-white bg-[#1a222e] mb-6 p-4 text-center uppercase rounded-t-xl">Editar cancha</h1>

                {/* Selector */}
                <div className="mb-5">
                    <label className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-gray-700">
                            Seleccioná una cancha <span className="text-red-600">*</span>
                        </span>
                        <select
                            required
                            value={selectedId ?? ""}
                            onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : null)}
                            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
                        >
                            <option value="">— Elegir —</option>
                            {canchas.map((c) => (
                                <option key={c.id} value={c.id}>
                                    #{c.id} · {c.nombre} · {c.tipoDeporte.map(d => deporteApiToUi[d]).join(", ")} · {c.interior ? "INTERIOR" : "EXTERIOR"}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Nombre */}
                    <label className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-gray-700">
                            Nombre <span className="text-red-600">*</span>
                        </span>
                        <input
                            required
                            value={form.nombre}
                            onChange={(e) => onChange("nombre", e.target.value)}
                            placeholder="Ej: Cancha Norte"
                            pattern="[A-Za-z ]+"
                            title="Solo letras (A–Z) y espacios, sin tildes ni símbolos."
                            className="border rounded-lg px-3 py-2 text-sm"
                        />
                    </label>

                    {/* Tipo de deporte */}
                    <div className="flex flex-col gap-1 mb-5">
                        <span className="text-sm font-medium text-gray-700">
                            Tipo de deporte <span className="text-red-600">*</span>
                        </span>
                        <div className="flex gap-4 flex-wrap">
                            {["FUTBOL", "BASQUET", "NATACION", "HANDBALL"].map((d) => (
                                <label key={d} className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        value={d}
                                        checked={form.tipoDeporte.includes(d as TipoDeporte)}
                                        onChange={(e) => {
                                            const value = e.target.value as TipoDeporte;
                                            setForm(prev => ({
                                                ...prev,
                                                tipoDeporte: prev.tipoDeporte.includes(value)
                                                    ? prev.tipoDeporte.filter(td => td !== value)
                                                    : [...prev.tipoDeporte, value]
                                            }));
                                        }}
                                        className="w-4 h-4"
                                    />
                                    {d}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Capacidad máxima */}
                    <label className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-gray-700">
                            Capacidad máxima <span className="text-red-600">*</span>
                        </span>
                        <input
                            type="number"
                            min={1}
                            value={form.capacidadMaxima}
                            onChange={(e) => onChange("capacidadMaxima", Number(e.target.value))}
                            placeholder="Ej: 20"
                            className="border rounded-lg px-3 py-2 text-sm"
                        />
                    </label>

                    {/* Precio por hora */}
                    <label className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-gray-700">
                            Precio por hora <span className="text-red-600">*</span>
                        </span>
                        <input
                            type="number"
                            min={0}
                            value={form.precioPorHora}
                            onChange={(e) => onChange("precioPorHora", e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="Ej: 1500"
                            className="border rounded-lg px-3 py-2 text-sm"
                        />
                    </label>

                    {/* Ubicación */}
                    <label className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-gray-700">
                            Ubicación <span className="text-red-600">*</span>
                        </span>
                        <select
                            required
                            value={form.ubicacion}
                            onChange={(e) => onChange("ubicacion", e.target.value as Ubicacion)}
                            className="border rounded-lg px-3 py-2 text-sm"
                        >
                            <option value="INTERIOR">INTERIOR</option>
                            <option value="EXTERIOR">EXTERIOR</option>
                        </select>
                    </label>

                    {/* Botón Modificar Horarios */}
                    <div className="md:col-span-2 flex gap-3 pt-2">
                        <button
                            type="button"
                            disabled={selectedId == null}
                            onClick={() => setModalOpen(true)}
                            className="bg-[#222222] hover:bg-black text-white text-sm font-bold px-4 py-2 rounded-lg disabled:opacity-50"
                        >
                            <EditCalendarIcon /> Modificar horarios
                        </button>
                    </div>

                    {/* Guardar / Limpiar */}
                    <div className="md:col-span-2 flex gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={submitting || selectedId == null}
                            className="bg-[#FFA500] hover:bg-[#FF8C00] text-[#222222] text-sm font-bold px-4 py-2 rounded-lg disabled:opacity-50"
                        >
                            {submitting ? "Guardando..." : (
                                <>
                                    <EditDocumentIcon /> Guardar cambios

                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={reset}
                            className="border px-4 py-2 rounded-lg text-sm font-bold bg-gray-50 hover:bg-gray-400"
                        >
                            Limpiar
                        </button>
                    </div>
                </form>

                {/* Modal editable */}
                {canchaSel && (
                    <ModalEditable
                        open={modalOpen}
                        onClose={() => setModalOpen(false)}
                        onGuardar={(data) => {
                            onChange("diasSeleccionados", data.diasSeleccionados.length ? data.diasSeleccionados : ["LUNES"]);
                            onChange("horaApertura", data.horaInicio);
                            onChange("horaCierre", data.horaFin);
                            setModalOpen(false);
                        }}
                        cancha={canchaSel}
                    />
                )}
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


            <ToastPortal />
        </div>
    );
}
