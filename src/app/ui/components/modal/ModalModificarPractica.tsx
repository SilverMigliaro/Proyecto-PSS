"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    MenuItem,
    CircularProgress,
} from "@mui/material";
import ModalExitoPractica from "@/app/ui/components/modal/ModalExitoPractica";

interface ModalModificarPracticaProps {
    open: boolean;
    onClose: () => void;
    id: string;
}

interface PracticaForm {
    deporte: string;
    canchaId: number | "";
    fechaInicio: string;
    fechaFin: string;
    precio: number | "";
}

interface FormErrors {
    deporte?: string;
    canchaId?: string;
    fechaInicio?: string;
    fechaFin?: string;
    precio?: string;
}

export default function ModalModificarPractica({ open, onClose, id }: ModalModificarPracticaProps) {
    const [formData, setFormData] = useState<PracticaForm>({
        deporte: "",
        canchaId: "",
        fechaInicio: "",
        fechaFin: "",
        precio: "",
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState(false);
    const [openExito, setOpenExito] = useState(false);
    const [canchas, setCanchas] = useState<{
        id: number;
        nombre: string;
        tipoDeporte: string[];
        interior?: boolean;
        horarios?: { diaSemana: string; horaInicio: string; horaFin: string }[];
    }[]>([]); const [entrenadores, setEntrenadores] = useState<{
        id: number;
        usuario: { dni: string; nombre: string; apellido: string };
    }[]>([]);
    const [entrenadorId, setEntrenadorId] = useState<number | "">("");

    useEffect(() => {
        if (!open || !id) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const resPractica = await fetch(`/api/practicaDeportiva/${id}`);
                const practica = await resPractica.json();

                const resCanchas = await fetch("/api/cancha");
                const listaCanchas = await resCanchas.json();

                const resEntrenadores = await fetch("/api/entrenador");
                const listaEntrenadores = await resEntrenadores.json();
                setEntrenadores(listaEntrenadores);
                const entrenadorAsignado =
                    practica.entrenadores && practica.entrenadores.length > 0
                        ? practica.entrenadores[0].id
                        : "";

                setEntrenadorId(entrenadorAsignado);

                setFormData({
                    deporte: practica.deporte || "",
                    canchaId: practica.canchaId || "",
                    fechaInicio: practica.fechaInicio
                        ? new Date(practica.fechaInicio).toISOString().split("T")[0]
                        : "",
                    fechaFin: practica.fechaFin
                        ? new Date(practica.fechaFin).toISOString().split("T")[0]
                        : "",
                    precio: practica.precio || "",
                });



                setCanchas(listaCanchas);
            } catch (error) {
                console.error("Error al cargar datos:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [open, id]);

    const validateField = (name: string, value: any): string | undefined => {
        switch (name) {
            case "deporte":
                if (!value.trim()) return "El deporte es obligatorio.";
                break;

            case "canchaId":
                if (!value) return "Debe seleccionar una cancha.";
                break;

            case "fechaInicio":
                if (!value) return "Debe ingresar la fecha de inicio.";
                if (formData.fechaFin && new Date(value) > new Date(formData.fechaFin))
                    return "La fecha de inicio no puede ser superior a la fecha de finalización.";
                break;

            case "fechaFin":
                if (!value) return "Debe ingresar la fecha de finalización.";
                if (formData.fechaInicio && new Date(value) < new Date(formData.fechaInicio))
                    return "La fecha de finalización no puede ser anterior a la fecha de inicio.";
                break;

            case "precio":
                if (value === "" || value === null) return "Debe ingresar un precio.";
                if (Number(value) <= 0) return "El precio debe ser mayor que cero.";
                break;
        }
        return undefined;
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        Object.keys(formData).forEach((key) => {
            const field = key as keyof PracticaForm;
            const error = validateField(field, formData[field]);
            if (error) newErrors[field] = error;
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const parsedValue = name === "precio" ? Number(value) : value;

        setFormData((prev) => ({
            ...prev,
            [name]: parsedValue,
        }));
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const error = validateField(name, value);
        setErrors((prev) => ({
            ...prev,
            [name]: error,
        }));
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        const payload = {
            ...formData,
            entrenadorIds: entrenadorId ? [entrenadorId] : [],
        };

        try {
            const res = await fetch(`/api/practicaDeportiva/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Error al actualizar la práctica");

            setOpenExito(true);
            onClose();
        } catch (error) {
            console.error(error);
            alert("Error al actualizar la práctica deportiva");
        }
    };

    if (loading) {
        return (
            <Dialog open={open} onClose={onClose}>
                <DialogContent sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 6 }}>
                    <CircularProgress />
                </DialogContent>
            </Dialog>
        );
    }

    const canchaSeleccionada = canchas.find(c => c.id === formData.canchaId) ?? null;
    return (
        <>
            <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
                <DialogTitle textAlign={"center"} bgcolor={"#222222"} color={"white"}>Modificar práctica deportiva</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Deporte"
                        name="deporte"
                        value={formData.deporte}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={Boolean(errors.deporte)}
                        helperText={errors.deporte}
                        fullWidth
                        margin="normal"
                        variant="outlined"
                    />
                    <TextField
                        select
                        label="Entrenador (opcional)"
                        name="entrenadorId"
                        value={entrenadorId}
                        onChange={(e) => setEntrenadorId(e.target.value ? Number(e.target.value) : "")}
                        fullWidth
                        margin="normal"
                        variant="outlined"
                    >
                        <MenuItem value="">Sin entrenador</MenuItem>
                        {entrenadores.map((e) => (
                            <MenuItem key={e.id} value={e.id}>
                                DNI {e.usuario.dni} - {e.usuario.nombre} {e.usuario.apellido}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        label="Cancha"
                        name="canchaId"
                        value={formData.canchaId}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={Boolean(errors.canchaId)}
                        helperText={errors.canchaId}
                        fullWidth
                        margin="normal"
                        variant="outlined"
                    >
                        <MenuItem value="">Seleccione una cancha</MenuItem>
                        {canchas.map((c) => (
                            <MenuItem key={c.id} value={c.id}>
                                {c.nombre}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        label="Fecha de inicio"
                        name="fechaInicio"
                        type="date"
                        value={formData.fechaInicio}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={Boolean(errors.fechaInicio)}
                        helperText={errors.fechaInicio}
                        fullWidth
                        margin="normal"
                        InputLabelProps={{ shrink: true }}
                    />

                    <TextField
                        label="Fecha de finalización"
                        name="fechaFin"
                        type="date"
                        value={formData.fechaFin}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={Boolean(errors.fechaFin)}
                        helperText={errors.fechaFin}
                        fullWidth
                        margin="normal"
                        InputLabelProps={{ shrink: true }}
                    />

                    <TextField
                        label="Precio"
                        name="precio"
                        type="number"
                        value={formData.precio}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={Boolean(errors.precio)}
                        helperText={errors.precio}
                        fullWidth
                        margin="normal"
                    />
                </DialogContent>

                <DialogActions>
                    <Button onClick={onClose} color="inherit">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        sx={{
                            backgroundColor: "#222",
                            "&:hover": { backgroundColor: "#333" },
                        }}
                    >
                        Guardar cambios
                    </Button>
                </DialogActions>
            </Dialog>
            <ModalExitoPractica open={openExito} onClose={() => setOpenExito(false)} opcion="modificada" />
        </>
    );
}
