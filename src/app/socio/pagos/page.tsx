"use client";

import Link from "next/link";
import Image from "next/image";
import {
    Box,
    Card,
    CardActionArea,
    CardContent,
    Grid,
    Typography,
    Container,
    Paper,
} from "@mui/material";

export default function PagosPage() {
    const opciones = [
        {
            titulo: "Mis Practicas",
            href: "",
            color: {
                bg: "linear-gradient(135deg, #EFF6FF, #DBEAFE)",
                hover: "linear-gradient(135deg, #DBEAFE, #BFDBFE)",
                text: "#1E3A8A",
                border: "#BFDBFE",
            },
            icono: "/deportes.png",
        },
        {
            titulo: "Registrar Pago",
            href: "/socio/pagos/registrar",
            color: {
                bg: "linear-gradient(135deg, #F8FAFC, #E2E8F0)",
                hover: "linear-gradient(135deg, #E2E8F0, #CBD5E1)",
                text: "#334155",
                border: "#CBD5E1",
            },
            icono: "/pago.png",
        },
        {
            titulo: "Inscribirme a Práctica",
            href: "/socio/pagos/inscripcion",
            color: {
                bg: "linear-gradient(135deg, #ECFDF5, #D1FAE5)",
                hover: "linear-gradient(135deg, #D1FAE5, #A7F3D0)",
                text: "#065F46",
                border: "#A7F3D0",
            },
            icono: "/inscripcion_deporte.png",
        },
    ];

    return (
        <Box
            sx={{
                minHeight: "100%",
                background: "linear-gradient(to bottom, #F9FAFB, #F3F4F6)",
                py: 8,

            }}
        >
            <Container maxWidth="md">
                <Paper
                    elevation={4}
                    sx={{
                        borderRadius: 4,
                        border: "1px solid #E5E7EB",
                        paddingBottom: "2rem",
                        backgroundColor: "white",
                    }}
                >
                    <Typography
                        variant="h5"
                        textAlign="center"
                        fontWeight={600}
                        color="white"
                        textTransform="uppercase"
                        mb={1}
                        sx={{
                            textAlign: "center",
                            pb: 1,
                            borderTopLeftRadius: "1rem",
                            borderTopRightRadius: "1rem",
                            backgroundColor: "#1a222e",
                            color: "white",
                            width: "100%",
                            py: 2,

                        }}
                    >
                        Gestión de pagos
                    </Typography>

                    <Typography
                        variant="body1"
                        textAlign="center"
                        color="text.secondary"
                        mt={2}
                        mb={2}
                    >
                        Elegí una opción para continuar
                    </Typography>

                    <Grid
                        container
                        spacing={4}
                        justifyContent="center"

                    >
                        {opciones.map((op) => (
                            <Grid key={op.titulo} >
                                <Card
                                    component={Link}
                                    href={op.href}
                                    sx={{
                                        textDecoration: "none",
                                        borderRadius: 3,
                                        border: `1px solid ${op.color.border}`,
                                        background: op.color.bg,
                                        color: op.color.text,
                                        height: "100%",
                                        minHeight: 220,
                                        aspectRatio: "1 / 1",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "center",
                                        transition: "all 0.3s ease",
                                        boxShadow: "0 3px 8px rgba(0,0,0,0.08)",
                                        "&:hover": {
                                            background: op.color.hover,
                                            transform: "translateY(-5px)",
                                            boxShadow: "0 8px 18px rgba(0,0,0,0.15)",
                                        },
                                    }}
                                >
                                    <CardActionArea
                                        sx={{
                                            height: "100%",
                                            p: 3,
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: "center",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 70,
                                                height: 70,
                                                mb: 2,
                                                position: "relative",
                                            }}
                                        >
                                            <Image
                                                src={op.icono}
                                                alt={op.titulo}
                                                fill
                                                style={{
                                                    objectFit: "contain",
                                                }}
                                            />
                                        </Box>
                                        <CardContent sx={{ p: 0 }}>
                                            <Typography
                                                variant="subtitle1"
                                                fontWeight={600}
                                                textAlign="center"
                                                color="inherit"
                                            >
                                                {op.titulo}
                                            </Typography>
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Paper>
            </Container>
        </Box>
    );
}
