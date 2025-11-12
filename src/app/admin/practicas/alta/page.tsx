"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
    Box,
    Button,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
    FormHelperText,
} from "@mui/material";
import { Entrenador, Cancha } from "@prisma/client";
import ModalExitoEliminarPractica from "@/app/ui/components/modal/ModalExitoPractica";
import ModalInfo from "@/app/ui/components/modal/ModalInfoPractica";

type EntrenadorConUsuario = Entrenador & {
    usuario: {
        dni: string;
        nombre: string;
        apellido: string;
        email: string;
    };
};

const days = ["LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO"];
const hours = [
    "08:00", "09:00", "10:00", "11:00", "12:00", "13:00",
    "14:00", "15:00", "16:00", "17:00", "18:00", "19:00",
    "20:00", "21:00", "22:00"
];

export default function AltaPracticaDeportiva() {
    const router = useRouter();

    const [deporte, setDeporte] = useState("");
    const [entrenadorId, setEntrenadorId] = useState<number | null>(null);
    const [canchaId, setCanchaId] = useState<number | null>(null);
    const [diasSeleccionados, setDiasSeleccionados] = useState<string[]>([]);
    const [inicio, setInicio] = useState("");
    const [fin, setFin] = useState("");
    const [fechaInicio, setFechaInicio] = useState("");
    const [fechaFin, setFechaFin] = useState("");
    const [precio, setPrecio] = useState("");
    const [entrenadores, setEntrenadores] = useState<EntrenadorConUsuario[]>([]);
    const [canchas, setCanchas] = useState<Cancha[]>([]);
    const [errores, setErrores] = useState<any>({});
    const [openModalExito, setOpenModalExito] = useState(false);
    const [openModalInfo, setOpenModalInfo] = useState(false);
    const [mensajeError, setMensajeError] = useState("");


    const fetchEntrenadores = async () => {
        try {
            const res = await fetch("/api/entrenador");
            if (!res.ok) throw new Error("Error al obtener entrenadores");
            const data = await res.json();
            setEntrenadores(data);
        } catch (error) {
            console.error("Error al cargar entrenadores:", error);
        }
    };

    const fetchCanchas = async () => {
        try {
            const res = await fetch("/api/cancha");
            if (!res.ok) throw new Error("Error al obtener canchas");
            const data = await res.json();
            setCanchas(data);
        } catch (error) {
            console.error("Error al cargar canchas:", error);
        }
    };

    useEffect(() => {
        fetchEntrenadores();
        fetchCanchas();
    }, []);

    const horaFinOptions = inicio
        ? hours.slice(hours.indexOf(inicio) + 1)
        : hours.slice(1);

    function quitarAcento(texto: string): string {
        return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    const validarCampo = (campo: string) => {
        switch (campo) {
            case "deporte": return !deporte ? "Debe seleccionar un deporte" : "";
            case "entrenadorId": return "";
            case "canchaId": return !canchaId ? "Debe seleccionar una cancha" : "";
            case "diasSeleccionados": return !diasSeleccionados.length ? "Debe seleccionar al menos un día" : "";
            case "inicio": return !inicio ? "Debe seleccionar hora de inicio" : "";
            case "fin": return !fin ? "Debe seleccionar hora de fin" : "";
            case "fechaInicio": return !fechaInicio ? "Debe seleccionar fecha de inicio" : "";
            case "fechaFin": return !fechaFin ? "Debe seleccionar fecha de fin" : "";
            case "precio":
                if (!precio) return "Debe ingresar un precio";
                if (isNaN(Number(precio)) || Number(precio) <= 0) return "El precio debe ser un número mayor que 0";
                return "";
            default: return "";
        }
    };

    const handleGuardar = async () => {
        const campos = ["deporte", "entrenadorId", "canchaId", "diasSeleccionados", "inicio", "fin", "fechaInicio", "fechaFin", "precio"];
        const nuevosErrores: any = {};
        campos.forEach(c => {
            const error = validarCampo(c);
            if (error) nuevosErrores[c] = error;
        });

        setErrores(nuevosErrores);
        if (Object.keys(nuevosErrores).length > 0) return;

        try {
            const payload = {
                deporte,
                canchaId,
                fechaInicio,
                fechaFin,
                precio: Number(precio),
                entrenadorIds: entrenadorId ? [entrenadorId] : [],
                horarios: diasSeleccionados.map((d) => ({
                    dia: quitarAcento(d),
                    horaInicio: inicio,
                    horaFin: fin,
                })),
            };

            const res = await fetch("/api/practicaDeportiva", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Error al crear la práctica");
            }

            setDeporte(""); setEntrenadorId(null); setCanchaId(null);
            setDiasSeleccionados([]); setInicio(""); setFin("");
            setFechaInicio(""); setFechaFin(""); setPrecio(""); setErrores({});
            setOpenModalExito(true);

        } catch (err: any) {
            setMensajeError(err.message);
            setOpenModalInfo(true);
        }
    };

    return (
        <Box sx={{ padding: 2, maxWidth: 700, margin: "auto", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <Typography variant="h6" gutterBottom>Deporte</Typography>
            <FormControl fullWidth sx={{ mb: 2 }} error={!!errores.deporte}>
                <InputLabel>Selecciona deporte</InputLabel>
                <Select
                    value={deporte}
                    onChange={(e) => { setDeporte(e.target.value); setEntrenadorId(null); }}
                    onBlur={() => setErrores({ ...errores, deporte: validarCampo("deporte") })}
                    label="Selecciona deporte"
                >
                    <MenuItem value=""><em>Ninguno</em></MenuItem>
                    <MenuItem value="FUTBOL">Fútbol</MenuItem>
                    <MenuItem value="BASQUET">Básquet</MenuItem>
                    <MenuItem value="NATACION">Natación</MenuItem>
                    <MenuItem value="HANDBALL">Handball</MenuItem>
                </Select>
                {errores.deporte && <FormHelperText>{errores.deporte}</FormHelperText>}
            </FormControl>

            <Typography variant="h6" gutterBottom>Entrenador</Typography>
            <FormControl fullWidth sx={{ mb: 2 }} error={!!errores.entrenadorId}>
                <InputLabel>Entrenador</InputLabel>
                <Select
                    value={entrenadorId ?? ""}
                    onChange={(e) => setEntrenadorId(Number(e.target.value))}
                    onBlur={() => setErrores({ ...errores, entrenadorId: validarCampo("entrenadorId") })}
                    label="Entrenador"
                >
                    <MenuItem value=""><em>Ninguno</em></MenuItem>
                    {entrenadores.map((e) => (
                        <MenuItem key={e.id} value={e.id}>
                            DNI {e.usuario.dni} - {e.usuario.nombre} {e.usuario.apellido}
                        </MenuItem>
                    ))}
                </Select>
                {errores.entrenadorId && <FormHelperText>{errores.entrenadorId}</FormHelperText>}
            </FormControl>

            <Typography variant="h6" gutterBottom>Cancha</Typography>
            <FormControl fullWidth sx={{ mb: 2 }} error={!!errores.canchaId}>
                <InputLabel>Cancha</InputLabel>
                <Select
                    value={canchaId ?? ""}
                    onChange={(e) => setCanchaId(Number(e.target.value))}
                    onBlur={() => setErrores({ ...errores, canchaId: validarCampo("canchaId") })}
                    label="Cancha"
                >
                    <MenuItem value=""><em>Ninguna</em></MenuItem>
                    {canchas.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                            ID {c.id} - {c.nombre}
                        </MenuItem>
                    ))}
                </Select>
                {errores.canchaId && <FormHelperText>{errores.canchaId}</FormHelperText>}
            </FormControl>

            <Typography variant="h6" gutterBottom>Días</Typography>
            <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
                {days.map((day) => (
                    <Button
                        key={day}
                        variant={diasSeleccionados.includes(day) ? "contained" : "outlined"}
                        onClick={() => {
                            let nuevosDias = diasSeleccionados.includes(day)
                                ? diasSeleccionados.filter(d => d !== day)
                                : [...diasSeleccionados, day];
                            setDiasSeleccionados(nuevosDias);
                            setErrores({
                                ...errores,
                                diasSeleccionados: nuevosDias.length === 0 ? "Debe seleccionar al menos un día" : ""
                            });
                        }}
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

            <Typography variant="h6" gutterBottom>Horarios</Typography>
            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                <FormControl fullWidth error={!!errores.inicio}>
                    <InputLabel>Inicio</InputLabel>
                    <Select
                        value={inicio}
                        onChange={(e) => setInicio(e.target.value)}
                        onBlur={() => setErrores({ ...errores, inicio: validarCampo("inicio") })}
                        label="Inicio"
                    >
                        <MenuItem value=""><em>Horario</em></MenuItem>
                        {hours.slice(0, -1).map((h) => (<MenuItem key={h} value={h}>{h}</MenuItem>))}
                    </Select>
                    {errores.inicio && <FormHelperText>{errores.inicio}</FormHelperText>}
                </FormControl>

                <FormControl fullWidth error={!!errores.fin}>
                    <InputLabel>Fin</InputLabel>
                    <Select
                        value={fin}
                        onChange={(e) => setFin(e.target.value)}
                        onBlur={() => setErrores({ ...errores, fin: validarCampo("fin") })}
                        label="Fin"
                    >
                        <MenuItem value=""><em>Horario</em></MenuItem>
                        {horaFinOptions.map((h) => (<MenuItem key={h} value={h}>{h}</MenuItem>))}
                    </Select>
                    {errores.fin && <FormHelperText>{errores.fin}</FormHelperText>}
                </FormControl>
            </Box>

            <Typography variant="h6" gutterBottom>Fecha</Typography>
            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                <TextField
                    fullWidth
                    label="Inicio"
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    onBlur={() => setErrores({ ...errores, fechaInicio: validarCampo("fechaInicio") })}
                    InputLabelProps={{ shrink: true }}
                    error={!!errores.fechaInicio}
                    helperText={errores.fechaInicio || ""}
                />
                <TextField
                    fullWidth
                    label="Finalización"
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    onBlur={() => setErrores({ ...errores, fechaFin: validarCampo("fechaFin") })}
                    InputLabelProps={{ shrink: true }}
                    error={!!errores.fechaFin}
                    helperText={errores.fechaFin || ""}
                />
            </Box>

            <Typography variant="h6" gutterBottom>Precio</Typography>
            <TextField
                fullWidth
                label="Precio"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                onBlur={() => setErrores({ ...errores, precio: validarCampo("precio") })}
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                error={!!errores.precio}
                helperText={errores.precio || ""}
                sx={{ mb: 2 }}
            />

            <Button
                variant="contained"
                onClick={handleGuardar}
                sx={{
                    backgroundColor: "#222222",
                    "&:hover": { backgroundColor: "#000000" },
                    width: "50%",
                    display: "block",
                    margin: "0 auto",
                    padding: "0.75rem",
                    my: 2,
                }}
            >
                Guardar
            </Button>
            <ModalExitoEliminarPractica
                open={openModalExito}
                onClose={() => setOpenModalExito(false)}
                opcion="creada"
            />
            <ModalInfo
                open={openModalInfo}
                onClose={() => setOpenModalInfo(false)}
                mensaje={mensajeError}
                tipo="error"
            />
        </Box>
    );
}
