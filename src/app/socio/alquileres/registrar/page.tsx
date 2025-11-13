'use client';

import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
    Box,
    Container,
    Paper,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Checkbox,
    Button,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Stack,
    Chip,
    ListItemButton,
} from '@mui/material';
import { Socio, TipoDeporte } from '@prisma/client';
import ModalAlquiler from "@/app/ui/components/modal/ModalExitoAlquileres";
interface TurnoCancha {
    id: number;
    fecha: string; // Date en Prisma, pero se recibe como string JSON
    horaInicio: string;
    horaFin: string;
    estado: 'LIBRE' | 'ALQUILADO' | 'PRACTICA_DEPORTIVA' | 'MANTENIMIENTO';
}

interface Cancha {
    id: number;
    nombre: string;
    tipoDeporte: TipoDeporte[];
    precioHora: number;
    TurnoCancha?: TurnoCancha[]; // ahora TypeScript sabe que puede venir esta relación
}
const deportes: TipoDeporte[] = ['FUTBOL', 'BASQUET', 'NATACION', 'HANDBALL'] as const;

export default function ReservarCanchaPage() {

    const router = useRouter();
    const { data: session } = useSession();
    const user = session?.user;
    const [socio, setSocio] = useState<Socio | null>(null);

    useEffect(() => {
        const fetchSocio = async () => {
            if (!user?.dni) return;

            try {
                const res = await fetch(`/api/socio/${user.dni}`);
                if (!res.ok) {
                    console.error(`Error al obtener socio: ${res.status}`);
                    return;
                }
                const data = await res.json();
                setSocio(data);
            } catch (error) {
                console.error("Error al obtener socio:", error);
            }
        };

        if (user?.dni) {
            fetchSocio();
        }
    }, [user?.dni]);

    const [openModal, setOpenModal] = useState(false);
    const [deporte, setDeporte] = useState<TipoDeporte | ''>('');
    const [fecha, setFecha] = useState('');
    const [canchaId, setCanchaId] = useState('');
    const [todasLasCanchas, setTodasLasCanchas] = useState<Cancha[]>([]);
    const [canchasFiltradas, setCanchasFiltradas] = useState<Cancha[]>([]);
    const [turnos, setTurnos] = useState<{ id: number; horaInicio: string; horaFin: string; disponible: boolean }[]>([]);
    const [precio, setPrecio] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [turnosSeleccionados, setTurnosSeleccionados] = useState<
        { id: number; horaInicio: string; horaFin: string; disponible: boolean }[]
    >([]);


    useEffect(() => {
        const fetchCanchas = async () => {
            try {
                const res = await fetch('/api/cancha');
                const data = await res.json();
                setTodasLasCanchas(data);
            } catch (error) {
                console.error('Error al obtener canchas:', error);
            }
        };
        fetchCanchas();
    }, []);

    useEffect(() => {
        if (deporte) {
            const filtradas = todasLasCanchas.filter(c => c.tipoDeporte.includes(deporte));
            setCanchasFiltradas(filtradas);
            setCanchaId('');
            setPrecio(0);
        } else {
            setCanchasFiltradas([]);
            setCanchaId('');
            setPrecio(0);
        }
    }, [deporte, todasLasCanchas]);

    useEffect(() => {
        if (canchaId) {
            const cancha = canchasFiltradas.find(c => c.id === Number(canchaId));
            setPrecio(cancha?.precioHora || 0);
        } else {
            setPrecio(0);
        }
    }, [canchaId, canchasFiltradas]);

    useEffect(() => {
        if (canchaId && fecha) {
            const cancha = canchasFiltradas.find(c => c.id === Number(canchaId));
            if (cancha && cancha.TurnoCancha) {
                const turnosFiltrados = cancha.TurnoCancha
                    .filter(t => t.fecha.toString().slice(0, 10) === fecha) // filtra por fecha
                    .map(t => ({
                        id: t.id,
                        horaInicio: t.horaInicio,
                        horaFin: t.horaFin,
                        disponible: t.estado === 'LIBRE',
                    }));
                setTurnos(turnosFiltrados);
            } else {
                setTurnos([]);
            }
        } else {
            setTurnos([]);
        }
    }, [canchaId, fecha, canchasFiltradas]);

    const handleToggleTurno = (turno: { id: number; horaInicio: string; horaFin: string; disponible: boolean }) => {
        setTurnosSeleccionados(prev =>
            prev.some(t => t.id === turno.id)
                ? prev.filter(t => t.id !== turno.id)
                : [...prev, turno]
        );
    };

    const handleConfirmar = async () => {
        setError(null);
        if (!deporte || !fecha || !canchaId || turnosSeleccionados.length === 0) {
            setError('Complete todos los campos y seleccione al menos un turno.');
            return;
        }

        const ordenados = [...turnosSeleccionados].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
        for (let i = 1; i < ordenados.length; i++) {
            if (ordenados[i - 1].horaFin !== ordenados[i].horaInicio) {
                setError('Los turnos seleccionados deben ser consecutivos.');
                return;
            }
        }

        if (turnosSeleccionados.length > 6) {
            setError('No puede seleccionar más de 6 turnos.');
            return;
        }

        try {
            const res = await fetch('/api/alquileres', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    socioId: Number(socio?.id),
                    canchaId: Number(canchaId),
                    fecha,
                    turnosSeleccionados: ordenados,
                }),
            });
            if (!res.ok) throw new Error('Error al registrar el alquiler');
            setOpenModal(true);
        } catch (err) {
            console.error(err);
            setError('Error al registrar el alquiler.');
        }
    };

    // Formatear fecha para mostrar
    const fechaMostrar = fecha
        ? new Date(fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : 'dd/mm/aaaa';

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <Box sx={{ bgcolor: '#1a222e', textAlign: "center", color: 'white', p: 3 }}>
                    <Typography variant="h5" fontWeight="bold" textTransform={"uppercase"}>
                        Reserva de Cancha
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: '600px' }}>
                    {/* Panel izquierdo */}
                    <Box sx={{ flex: 1, p: 4, bgcolor: '#f9f9f9', borderRight: { md: '1px solid #eee' } }}>
                        <Stack spacing={3}>
                            <FormControl fullWidth>
                                <InputLabel>Deporte</InputLabel>
                                <Select value={deporte} label="Deporte" onChange={(e) => setDeporte(e.target.value)}>
                                    <MenuItem value="">
                                        <em>&lt;Nombre del deporte&gt;</em>
                                    </MenuItem>
                                    {deportes.map(d => (
                                        <MenuItem key={d} value={d}>{d}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Input nativo de fecha */}
                            <TextField
                                label="Fecha"
                                type="date"
                                value={fecha}
                                onChange={(e) => setFecha(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                inputProps={{ placeholder: 'dd/mm/aaaa' }}
                                fullWidth
                                helperText={fecha ? fechaMostrar : 'Seleccione una fecha'}
                            />

                            <FormControl fullWidth>
                                <InputLabel>Cancha</InputLabel>
                                <Select value={canchaId} label="Cancha" onChange={(e) => setCanchaId(e.target.value)} disabled={!deporte}>
                                    <MenuItem value="">
                                        <em>&lt;Nombre de la cancha&gt;</em>
                                    </MenuItem>
                                    {canchasFiltradas.map(c => (
                                        <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                label="Precio"
                                value={precio > 0 ? `$${precio.toLocaleString()} por hora` : '<precio>'}
                                fullWidth
                                disabled
                            />

                            <Button
                                variant="contained"
                                size="large"
                                fullWidth
                                sx={{
                                    mt: 4,
                                    py: 2,
                                    borderRadius: 2,
                                    bgcolor: '#000',
                                    '&:hover': { bgcolor: '#333' },
                                }}
                                onClick={handleConfirmar}
                                disabled={turnosSeleccionados.length === 0}
                            >
                                Confirmar
                            </Button>

                            {turnosSeleccionados.length > 0 && (
                                <Chip
                                    label={`$${(precio * turnosSeleccionados.length).toLocaleString()} total`}
                                    color="primary"
                                    size="medium"
                                    sx={{ fontSize: '1.2rem', py: 3 }}
                                />
                            )}
                            {error && (
                                <Typography color="error" sx={{ mt: 2, mb: 1 }}>
                                    {error}
                                </Typography>
                            )}
                        </Stack>
                    </Box>

                    {/* Panel derecho - Turnos */}
                    <Box sx={{ flex: 1, p: 4 }}>
                        <Typography variant="h6" gutterBottom>
                            Marque los turnos que desea reservar:
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <List sx={{ maxHeight: 520, overflow: 'auto' }}>
                            {turnos.map((turno) => {
                                const isSelected = turnosSeleccionados.includes(turno);
                                const isDisabled = !turno.disponible;
                                return (
                                    <ListItem key={turno.id} disablePadding>
                                        <ListItemButton
                                            selected={turnosSeleccionados.some(t => t.id === turno.id)}

                                            onClick={() => !isDisabled && handleToggleTurno(turno)}
                                            sx={{
                                                border: '1px solid',
                                                borderColor: turnosSeleccionados.some(t => t.id === turno.id) ? 'primary.main' : '#ddd',
                                                borderRadius: 2,
                                                mb: 1,
                                                bgcolor: turnosSeleccionados.some(t => t.id === turno.id) ? 'primary.50' : 'white',
                                                opacity: isDisabled ? 0.5 : 1,
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    bgcolor: turnosSeleccionados.some(t => t.id === turno.id) ? 'primary.100' : 'grey.50',
                                                },
                                            }}
                                        >
                                            <ListItemText
                                                primary={`${turno.horaInicio} a ${turno.horaFin}`}
                                                primaryTypographyProps={{
                                                    fontWeight: turnosSeleccionados.some(t => t.id === turno.id) ? 'bold' : 'normal',
                                                    color: isDisabled ? 'text.error' : 'inherit',
                                                }}
                                            />
                                            <ListItemSecondaryAction>
                                                <Checkbox
                                                    edge="end"
                                                    checked={turnosSeleccionados.some(t => t.id === turno.id)}
                                                    disabled={isDisabled}
                                                    onChange={() => handleToggleTurno(turno)}
                                                    color="primary"
                                                />
                                            </ListItemSecondaryAction>
                                        </ListItemButton>
                                    </ListItem>
                                );
                            })}
                        </List>

                        <ModalAlquiler
                            open={openModal}
                            onClose={() => setOpenModal(false)}
                            opcion={"creado"}
                        />

                    </Box>
                </Box>
            </Paper>
        </Container>
    );
}