"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    FormHelperText,
} from "@mui/material";

type TipoDeporte = "FUTBOL" | "BASQUET" | "NATACION" | "HANDBALL";
const days = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];
const hours = [
    "08:00", "09:00", "10:00", "11:00", "12:00", "13:00",
    "14:00", "15:00", "16:00", "17:00", "18:00", "19:00",
    "20:00", "21:00", "22:00"
];

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

interface ModalEditableProps {
    open: boolean;
    onClose: () => void;
    onGuardar: (data: {
        diasSeleccionados: string[];
        horaInicio: string;
        horaFin: string;
    }) => void;
    cancha: CanchaListado;
}

type Errores = {
    diasSeleccionados?: string;
    inicio?: string;
    fin?: string;
};

export default function ModalEditable({ open, onClose, onGuardar, cancha }: ModalEditableProps) {
    const [diasSeleccionados, setDiasSeleccionados] = useState<string[]>([]);
    const [inicio, setInicio] = useState<string>("");
    const [fin, setFin] = useState<string>("");
    const [errores, setErrores] = useState<Errores>({});

    useEffect(() => {
        if (open && cancha) {
            if (cancha.horarios.length > 0) {
                const dias = cancha.horarios.map(h => h.diaSemana);
                setDiasSeleccionados(dias);

                setInicio(cancha.horarios[0].horaInicio);
                setFin(cancha.horarios[0].horaFin);
            } else {
                setDiasSeleccionados([]);
                setInicio("");
                setFin("");
            }
            setErrores({});
        }
    }, [open, cancha]);

    const horaFinOptions = inicio ? hours.slice(hours.indexOf(inicio) + 1) : hours.slice(1);

    const validarCampo = (campo: keyof Errores) => {
        switch (campo) {
            case "diasSeleccionados":
                return diasSeleccionados.length === 0 ? "Debe seleccionar al menos un día" : "";
            case "inicio":
                return !inicio ? "Debe seleccionar hora de inicio" : "";
            case "fin":
                return !fin ? "Debe seleccionar hora de fin" : "";
            default:
                return "";
        }
    };

    const validarTodo = () => {
        const nuevos: Errores = {
            diasSeleccionados: validarCampo("diasSeleccionados"),
            inicio: validarCampo("inicio"),
            fin: validarCampo("fin"),
        };
        setErrores(nuevos);
        return Object.values(nuevos).every(v => !v);
    };

    const resetModal = () => {
        setDiasSeleccionados([]);
        setInicio("");
        setFin("");
        setErrores({});
    };

    const handleGuardar = () => {
        if (!validarTodo()) return;
        onGuardar({
            diasSeleccionados: diasSeleccionados.map(d => quitarAcento(d)),
            horaInicio: inicio,
            horaFin: fin
        });
        resetModal();
        onClose();
    };

    const handleToggleDia = (day: string) => {
        const nuevosDias = diasSeleccionados.includes(day)
            ? diasSeleccionados.filter(d => d !== day)
            : [...diasSeleccionados, day];
        setDiasSeleccionados(nuevosDias);
        setErrores({ ...errores, diasSeleccionados: nuevosDias.length === 0 ? "Debe seleccionar al menos un día" : "" });
    };

    function quitarAcento(texto: string) {
        return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    const handleClose = () => {
        resetModal();
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: "1rem" } }}>
            <DialogTitle sx={{
                textAlign: "center",
                pb: 1,
                borderTopLeftRadius: "1rem",
                borderTopRightRadius: "1rem",
                backgroundColor: "#1a222e",
                color: "white",
                width: "100%",
                py: 2
            }}>
                <Typography component="div" variant="h6" fontWeight="bold" textTransform="uppercase" color="white" bgcolor={"#1a222e"}>
                    Editar Horarios
                </Typography>
            </DialogTitle>

            <DialogContent>
                <Typography variant="h6" gutterBottom sx={{ p: 2 }}>Días</Typography>
                <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
                    {days.map(day => (
                        <Button
                            key={day}
                            variant={diasSeleccionados.includes(day) ? "contained" : "outlined"}
                            onClick={() => handleToggleDia(day)}
                            sx={{
                                flex: 1,
                                minWidth: "80px",
                                backgroundColor: diasSeleccionados.includes(day) ? "#1976d2" : "transparent",
                                color: diasSeleccionados.includes(day) ? "#fff" : "#1976d2",
                                borderColor: "#1976d2",
                                "&:hover": {
                                    backgroundColor: diasSeleccionados.includes(day) ? "#115293" : "#E3F2FD",
                                    borderColor: diasSeleccionados.includes(day) ? "#115293" : "#1976d2",
                                },
                                textTransform: "none",
                                fontWeight: "bold",
                                padding: "8px 16px",
                                borderRadius: "8px",
                            }}
                        >
                            {day}
                        </Button>
                    ))}
                </Box>
                {errores.diasSeleccionados && <Typography color="error" variant="body2" sx={{ mb: 2 }}>{errores.diasSeleccionados}</Typography>}

                <Typography variant="h6" gutterBottom sx={{ p: 2 }}>Horarios</Typography>
                <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                    <FormControl fullWidth error={!!errores.inicio}>
                        <InputLabel>Inicio</InputLabel>
                        <Select
                            value={inicio}
                            onChange={e => setInicio(e.target.value)}
                            onBlur={() => setErrores({ ...errores, inicio: validarCampo("inicio") })}
                            label="Inicio"
                        >
                            <MenuItem value=""><em>Horario</em></MenuItem>
                            {hours.slice(0, -1).map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                        </Select>
                        {errores.inicio && <FormHelperText>{errores.inicio}</FormHelperText>}
                    </FormControl>

                    <FormControl fullWidth error={!!errores.fin}>
                        <InputLabel>Fin</InputLabel>
                        <Select
                            value={fin}
                            onChange={e => setFin(e.target.value)}
                            onBlur={() => setErrores({ ...errores, fin: validarCampo("fin") })}
                            label="Fin"
                        >
                            <MenuItem value=""><em>Horario</em></MenuItem>
                            {horaFinOptions.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                        </Select>
                        {errores.fin && <FormHelperText>{errores.fin}</FormHelperText>}
                    </FormControl>
                </Box>
            </DialogContent>

            <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
                <Button onClick={handleGuardar} variant="contained" sx={{ backgroundColor: "#222", "&:hover": { backgroundColor: "#000" }, px: 4, borderRadius: 2, fontWeight: "bold" }}>
                    Guardar
                </Button>
                <Button onClick={handleClose} variant="outlined" sx={{ borderRadius: 2, px: 4 }}>
                    Cancelar
                </Button>
            </DialogActions>
        </Dialog>
    );
}
