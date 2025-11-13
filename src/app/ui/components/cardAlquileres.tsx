"use client";

import { Box, Button, Card, CardContent, Typography } from "@mui/material";

interface ListCardProps {
    id: number;
    canchaAsignada: string;
    horarioAsignado: string;
    precioAsignado: number;
    estado: string;
    onCancel: () => void;
}

export default function ListCard({
    id,
    canchaAsignada,
    horarioAsignado,
    precioAsignado,
    estado,
    onCancel,
}: ListCardProps) {
    return (
        <Card
            sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 1,
                border: 1,
                borderColor: "silver",
                backgroundColor: "#DDE4F0",
                borderRadius: 2,
                boxShadow: 1,
                mb: 2,
            }}
        >
            <CardContent >
                <Typography variant="subtitle1" gutterBottom>
                    <strong>Alquiler de Cancha AC - {id}</strong>
                </Typography>
                <Typography variant="body2" color="text.primary">
                    <strong>Cancha asignada</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary" pl={2}>
                    <em>{canchaAsignada}</em>
                </Typography>
                <Typography variant="body2" color="text.primary">
                    <strong>Días y Horario</strong>
                </Typography>

                <Box sx={{ pl: 2 }} component="div" color="text.secondary">
                    {horarioAsignado
                        ? horarioAsignado.split(/[,;]+/).map((h, i) => (
                            <Typography key={i} variant="body2">
                                {h.trim()}
                            </Typography>
                        ))
                        : <Typography variant="body2">&lt;Sin horarios&gt;</Typography>}
                </Box>
                <Typography variant="body2" color="text.primary">
                    <strong>Precio</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary" pl={2}>
                    <em>${precioAsignado}</em>
                </Typography>
                <Typography variant="body2" color="text.primary">
                    <strong>Estado Alquiler</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary" pl={2}>
                    <em>{estado}</em>
                </Typography>
            </CardContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mr: 4 }}>
                <Button
                    variant="contained"
                    onClick={onCancel}
                    disabled={estado === "CANCELADO"}
                    sx={{
                        minWidth: "100px",
                        height: "40px",
                        backgroundColor: "#D32F2F",
                        '&:hover': {
                            backgroundColor: '#B71C1C',
                        },
                        fontWeight: "bold",

                    }}
                >
                    Cancelar Turno
                </Button>

            </Box>
        </Card>
    );
}