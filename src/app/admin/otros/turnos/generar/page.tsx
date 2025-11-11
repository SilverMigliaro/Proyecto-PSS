"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Box,
    Button,
    TextField,
    Typography,
} from "@mui/material";
import ModalExito from "@/app/ui/components/modal/ModalExitoGenerarTurno";
import ModalError from "@/app/ui/components/modal/ModalErrorGenerarTurno";

export default function GenerarTurnoPage() {
    const router = useRouter();
    const [fechaInicio, setFechaInicio] = useState("");
    const [fechaFin, setFechaFin] = useState("");
    const [errores, setErrores] = useState<Record<string, string>>({});
    const [openExito, setOpenExito] = useState(false);
    const [openError, setOpenError] = useState(false);
    const [mensajeError, setMensajeError] = useState("");
    const [modalTipo, setModalTipo] = useState<"error" | "advertencia">("error");


    const validar = () => {
        const nuevos: Record<string, string> = {};

        if (!fechaInicio) nuevos.fechaInicio = "Debe seleccionar fecha de inicio";
        if (!fechaFin) nuevos.fechaFin = "Debe seleccionar fecha de fin";
        if (fechaInicio && fechaFin && new Date(fechaFin) < new Date(fechaInicio)) {
            nuevos.fechaFin = "La fecha fin debe ser igual o posterior a la de inicio";
        }

        setErrores(nuevos);
        return Object.keys(nuevos).length === 0;
    };

    const handleGuardar = async () => {
        if (!validar()) return;

        try {
            const res = await fetch("/api/turnos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fechaInicio, fechaFin }),
            });

            const data = await res.json();

            if (res.ok) {
                if (data.repetido) {
                    setMensajeError(data.message);
                    setModalTipo("advertencia");
                    setOpenError(true);
                } else {
                    setOpenExito(true);
                }
            } else {
                setMensajeError(data.error || "Ocurrió un error al generar los turnos");
                setOpenError(true);
            }
        } catch (err) {
            console.error(err);
            setMensajeError("Error de conexión con el servidor");
            setOpenError(true);
        }
    };

    return (
        <Box
            sx={{
                padding: 3,
                maxWidth: 600,
                margin: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 3,
            }}
        >
            <Typography variant="h6" textAlign="center" textTransform="uppercase">
                Generar Turnos
            </Typography>

            <TextField
                label="Fecha Inicio"
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                InputLabelProps={{ shrink: true }}
                error={!!errores.fechaInicio}
                helperText={errores.fechaInicio}
                fullWidth
            />

            <TextField
                label="Fecha Fin"
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                InputLabelProps={{ shrink: true }}
                error={!!errores.fechaFin}
                helperText={errores.fechaFin}
                fullWidth
            />

            <Button
                variant="contained"
                onClick={handleGuardar}
                sx={{
                    backgroundColor: "#222",
                    "&:hover": { backgroundColor: "#000" },
                    py: 1.5,
                    width: "60%",
                    mx: "auto",
                    display: "block",
                }}
            >
                Generar Turnos
            </Button>

            <ModalExito open={openExito} onClose={() => {
                setOpenExito(false);
                router.push("/admin/otros");
            }} />

            <ModalError
                open={openError}
                onClose={() => setOpenError(false)}
                mensaje={mensajeError}
                tipo={modalTipo}
            />

        </Box>
    );
}