"use client";

import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import {
    Box,
    Button,
    CircularProgress,
    Container,
    Fade,
    List,
    Typography
} from "@mui/material";
import ListCard from "@/app/ui/components/cardAlquileres";
import { useRouter } from "next/navigation";
import { Socio } from "@prisma/client";
import ModalAlquiler from "@/app/ui/components/modal/ModalExitoAlquileres";


type AlquilerConTurno = {
    id: number;
    socioId: number;
    turnoId: number;
    fechaReserva: string;
    estadoAlquiler: string;
    motivoCancelacion: string | null;
    fechaCancelacion: string | null;
    notificado: boolean;
    pagoId: number | null;
    turno: {
        id: number;
        cancha: {
            id: number;
            nombre: string;
            precioHora: number;
            capacidadMax: number;
            interior: boolean;
            tipoDeporte: string[];
        };
        horario?: string[];
        estado: string;
        fecha: string;
        horaInicio: string;
        horaFin: string;
    };
    pago: any | null;
};

export default function CancelarTurnos() {
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

    const [alquileres, setAlquileres] = useState<AlquilerConTurno[]>([]);
    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);

    const fetchAlquileres = async () => {
        if (!socio?.id) return;
        try {
            setLoading(true);
            const res = await fetch(`/api/alquileres`);
            if (!res.ok) throw new Error("Error al obtener los alquileres");

            const data = await res.json();

            // Filtramos por el socio actual
            const alquileresPorSocio = data.filter(
                (alquiler: AlquilerConTurno) => alquiler.socioId === Number(socio.id)
            );

            setAlquileres(alquileresPorSocio);
        } catch (error) {
            console.error("Error al cargar alquileres:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlquileres();
    }, [socio?.id]);

    console.log("Alquileres recibidos:", alquileres);

    const formatFechaYHorario = (fecha: string, horaInicio: string, horaFin: string) => {
        const date = new Date(fecha);

        // Formatear fecha en español
        const opciones: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            day: 'numeric',
            month: 'numeric',
        };
        const fechaFormateada = date
            .toLocaleDateString('es-ES', opciones)
            .replace(/^\w/, (c) => c.toUpperCase()); // Primera letra mayúscula

        return `${fechaFormateada} • ${horaInicio} - ${horaFin} hs`;
    };

    const handleCancelar = async (alquiler: AlquilerConTurno) => {
        if (!alquiler || !alquiler.id) return;

        try {
            const res = await fetch(`/api/alquileres/${alquiler.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    estado: "CANCELADO",
                    motivo: "",
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Error al cancelar el alquiler");
            }
            const data = await res.json();
            fetchAlquileres();
            setOpenModal(true);

        } catch (error) {
            console.error("❌ Error al cancelar el alquiler:", error);
        }
    };


    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {loading ? (
                    <Fade in={loading} timeout={500}>
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                height: "60vh",
                                gap: 2,
                            }}
                        >
                            <CircularProgress size={60} thickness={4} />
                            <Typography variant="h6" sx={{ color: "#555" }}>
                                Cargando alquileres de canchas...
                            </Typography>
                        </Box>
                    </Fade>
                ) : (
                    <Fade in={!loading} timeout={700}>
                        <List
                            sx={{
                                maxHeight: "70vh",
                                overflowY: "auto",
                                border: "1px solid #ccc",
                                borderRadius: 2,
                                padding: 2,
                                boxSizing: "border-box",
                                display: "flex",
                                flexDirection: "column",
                                gap: 2,
                            }}
                        >

                            {alquileres.length > 0 ? (
                                alquileres.map((alquiler) => (
                                    <li key={alquiler.id}>
                                        <ListCard
                                            id={alquiler.id}
                                            canchaAsignada={alquiler.turno.cancha.nombre}
                                            horarioAsignado={formatFechaYHorario(
                                                alquiler.turno.fecha,
                                                alquiler.turno.horaInicio,
                                                alquiler.turno.horaFin
                                            )} precioAsignado={alquiler.turno.cancha.precioHora}
                                            estado={alquiler.estadoAlquiler}
                                            onCancel={() => {
                                                handleCancelar(alquiler);
                                            }}
                                        />
                                    </li>
                                ))
                            ) : (
                                <Typography textAlign="center" sx={{ color: "#777", py: 4 }}>
                                    No hay alquileres registrados.
                                </Typography>
                            )}
                        </List>
                    </Fade>
                )}

                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => router.push("/socio")}
                        sx={{
                            backgroundColor: "#222222",
                            "&:hover": {
                                backgroundColor: "#000000"
                            },
                            width: "30%",
                            height: "auto",
                        }}
                    >
                        Volver al menú
                    </Button>

                    <ModalAlquiler
                        open={openModal}
                        onClose={() => setOpenModal(false)}
                        opcion={"cancelado"}
                    />
                </Box>
            </Box>
        </Container >
    );
}

