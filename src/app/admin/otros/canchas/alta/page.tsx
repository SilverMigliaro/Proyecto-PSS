"use client";

import React, { useEffect, useState } from "react";
import { useToast } from "@/app/ui/components/Toast";
import { useRouter } from "next/navigation";
import GenerarHorariosModal from "@/app/ui/components/modal/GenerarHorariosModal";
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AddCircle from "@mui/icons-material/AddCircle";

type TipoDeporte = "FUTBOL" | "BASQUET" | "NATACION" | "HANDBALL";
type Ubicacion = "INTERIOR" | "EXTERIOR";

type Horario = {
    diaSemana: string;
    horaInicio: string;
    horaFin: string;
};

type CanchaListado = {
    id: number | string;
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
const deporteApiToUi: Record<string, string> = {
    FUTBOL: "FÚTBOL",
    BASQUET: "BÁSQUET",
    NATACION: "NATACIÓN",
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

type FormInput = {
    nombre: string;
    tipoDeporte: TipoDeporte[];
    ubicacion: Ubicacion;
    capacidadMaxima: number;
    precioPorHora: string;
};

export default function AltaCanchaPage() {
    const router = useRouter();
    const { show, ToastPortal } = useToast();
    const [canchas, setCanchas] = useState<CanchaListado[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [horariosSeleccionados, setHorariosSeleccionados] = useState<
        { diasSeleccionados: string[]; horaInicio: string; horaFin: string }[]
    >([]);
    const [selectedId, setSelectedId] = useState<number | string | null>(null);


    const NOMBRE_REGEX = /^[A-Za-z ]+$/;

    const [form, setForm] = useState<FormInput>({
        nombre: "",
        tipoDeporte: [],
        ubicacion: "EXTERIOR",
        capacidadMaxima: 10,
        precioPorHora: "",
    });

    const toggleDeporte = (deporte: TipoDeporte) => {
        setForm(prev => {
            const existe = prev.tipoDeporte.includes(deporte);
            const nuevos = existe
                ? prev.tipoDeporte.filter(d => d !== deporte)
                : [...prev.tipoDeporte, deporte];
            return { ...prev, tipoDeporte: nuevos };
        });
    };

    // Función para cargar canchas
    async function loadCanchas() {
        try {
            const res = await fetch("/api/cancha", { cache: "no-store" });
            if (!res.ok) throw new Error("No se pudo cargar canchas");
            const data = (await res.json()) as CanchaListado[];
            setCanchas(data);
        } catch (error) {
            console.error(error);
            show("Error al cargar canchas", "error");
        }
    }

    useEffect(() => {
        loadCanchas();
    }, []);

    const onChange = <K extends keyof FormInput>(key: K, value: FormInput[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const resetForm = () => {
        setForm({
            nombre: "",
            tipoDeporte: [],
            ubicacion: "EXTERIOR",
            capacidadMaxima: 10,
            precioPorHora: "",
        });
        setHorariosSeleccionados([]);
    };

    const validate = (): string | null => {
        const nombreTrim = form.nombre.trim();
        if (!nombreTrim || !NOMBRE_REGEX.test(nombreTrim)) {
            return "Ingresá un nombre válido: solo letras (A–Z) y espacios, sin tildes.";
        }
        if (!form.tipoDeporte) return "Seleccioná el tipo de deporte.";
        if (!form.ubicacion) return "Seleccioná la ubicación.";
        if (!form.capacidadMaxima || form.capacidadMaxima < 1) {
            return "La capacidad máxima debe ser un número mayor o igual a 1.";
        }
        if (form.precioPorHora === "") return "Ingresá el precio por hora.";
        if (Number.isNaN(Number(form.precioPorHora)) || Number(form.precioPorHora) < 0) {
            return "El precio por hora debe ser un número válido (0 o mayor).";
        }
        if (horariosSeleccionados.length === 0) return "Agregá al menos un horario";
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;

        const validationError = validate();
        if (validationError) {
            show(validationError, "error");
            return;
        }

        setSubmitting(true);
        try {
            const nombreTrim = form.nombre.trim();
            const precioNumber = Number(form.precioPorHora);

            // Filtrar horarios válidos para evitar errores en backend
            const horariosValidos = horariosSeleccionados
                .filter(
                    (h) =>
                        Array.isArray(h.diasSeleccionados) &&
                        h.diasSeleccionados.length > 0 &&
                        h.horaInicio &&
                        h.horaFin
                );
            if (form.tipoDeporte.length === 0) {
                show("Seleccioná al menos un tipo de deporte", "error");
                return;
            }

            const payload = {
                nombre: nombreTrim,
                tipoDeporte: form.tipoDeporte as TipoDeporte[],
                interior: form.ubicacion === "INTERIOR",
                capacidadMax: form.capacidadMaxima,
                precioHora: precioNumber,
                horarios: horariosValidos,
            };

            const res = await fetch("/api/cancha", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                cache: "no-store",
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.error || "Error al crear la cancha");
            }

            await loadCanchas();
            show("Cancha creada exitosamente", "success");
            resetForm();
            router.push("/admin/otros");
        } catch (error) {
            console.error(error);
            show((error as Error).message || "Error al crear la cancha", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const renderUbicacion = (c: CanchaListado) =>
        typeof c.interior === "boolean" ? (c.interior ? "INTERIOR" : "EXTERIOR") : c.ubicacion ?? "EXTERIOR";

    const renderCapacidad = (c: CanchaListado) => (c.capacidadMax ?? c.capacidadMaxima) ?? "-";

    const renderPrecio = (c: CanchaListado) => {
        const p = c.precioHora ?? c.precioPorHora;
        return typeof p === "number" ? p : 0;
    };

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-6 md:px-10">
            <div className="max-w-4xl mx-auto bg-white shadow-md rounded-xl border border-gray-200 p-6">
                <h1 className="text-2xl uppercase w-full bg-[#1a222e] text-center p-4 font-bold text-white mb-6 rounded-t-xl">Alta de cancha</h1>

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
                            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
                        />
                    </label>

                    {/* Tipo de deporte */}
                    <div className="flex flex-col gap-2 md:col-span-2">
                        <span className="text-sm font-medium text-gray-700">
                            Tipo de deporte <span className="text-red-600">*</span>
                        </span>
                        <div className="mt-2 flex flex-wrap gap-4">
                            {(["FUTBOL", "BASQUET", "NATACION", "HANDBALL"] as TipoDeporte[]).map((d) => (
                                <label key={d} className="inline-flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={form.tipoDeporte.includes(d)}
                                        onChange={() => toggleDeporte(d)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    {deporteApiToUi[d]}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Ubicación */}
                    <div className="md:col-span-2">
                        <span className="text-sm font-medium text-gray-700">
                            Ubicación <span className="text-red-600">*</span>
                        </span>
                        <div className="mt-2 flex items-center gap-6">
                            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                                <input
                                    type="radio"
                                    name="ubicacion"
                                    required
                                    checked={form.ubicacion === "INTERIOR"}
                                    onChange={() => onChange("ubicacion", "INTERIOR")}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                />
                                Interior
                            </label>
                            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                                <input
                                    type="radio"
                                    name="ubicacion"
                                    required
                                    checked={form.ubicacion === "EXTERIOR"}
                                    onChange={() => onChange("ubicacion", "EXTERIOR")}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                />
                                Exterior
                            </label>
                        </div>
                    </div>

                    {/* Horarios */}
                    <div className="md:col-span-2 flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setModalOpen(true)}
                            className="bg-[#222222] hover:bg-black text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
                        >
                            <CalendarMonthIcon /> Agregar dias y horarios <span className="text-red-600">*</span>
                        </button>
                    </div>

                    {/* Capacidad */}
                    <label className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-gray-700">
                            Capacidad máxima <span className="text-red-600">*</span>
                        </span>
                        <input
                            required
                            type="number"
                            min={1}
                            value={form.capacidadMaxima}
                            onChange={(e) => onChange("capacidadMaxima", Number(e.target.value))}
                            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
                        />
                    </label>

                    {horariosSeleccionados.length > 0 && (
                        <div className="md:col-span-2 mt-2">
                            <h3 className="text-sm font-medium mb-1">Horarios agregados:</h3>
                            <ul className="text-sm text-gray-700 list-disc pl-5">
                                {horariosSeleccionados.map((h, idx) => (
                                    <li key={idx}>
                                        {h.diasSeleccionados.join(", ")} — {h.horaInicio} a {h.horaFin}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Precio */}
                    <label className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-gray-700">
                            Precio por hora <span className="text-red-600">*</span>
                        </span>
                        <input
                            required
                            type="number"
                            min={0}
                            value={form.precioPorHora}
                            onChange={(e) => onChange("precioPorHora", e.target.value)}
                            placeholder="Ej: 50"
                            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
                        />
                    </label>

                    <div className="md:col-span-2 flex gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-lg disabled:opacity-50"
                        >
                            {submitting ? "Creando..." : (
                                <> <AddCircle /> Crear cancha </>)}
                        </button>
                        <button
                            type="button"
                            onClick={resetForm}
                            className="border px-4 py-2 rounded-lg text-sm bg-gray-50 hover:bg-gray-100"
                        >
                            Limpiar
                        </button>
                    </div>
                </form>
            </div >

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

            <GenerarHorariosModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onGuardar={(data) => {
                    setHorariosSeleccionados((prev) => [...prev, data]);
                    show("Horario agregado correctamente", "success");
                }}
            />

            <ToastPortal />
        </div >
    );
}
