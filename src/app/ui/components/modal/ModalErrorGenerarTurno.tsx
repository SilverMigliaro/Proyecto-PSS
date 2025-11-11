"use client";

import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
} from "@mui/material";
import ReportIcon from "@mui/icons-material/WarningAmber";
import InfoIcon from "@mui/icons-material/ErrorOutline";

interface ModalErrorProps {
    open: boolean;
    onClose: () => void;
    mensaje?: string;
    tipo?: "error" | "advertencia";
}

export default function ModalErrorGenerarTurno({
    open,
    onClose,
    mensaje = "Ocurrió un error inesperado al generar los turnos.",
    tipo = "error",
}: ModalErrorProps) {

    const isAdvertencia = tipo === "advertencia";

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 3, p: 2 },
            }}
        >
            <DialogTitle sx={{ textAlign: "center", pb: 0 }}>
                {isAdvertencia ? (
                    <InfoIcon sx={{ fontSize: 60, color: "warning.main", mb: 1 }} />
                ) : (
                    <ReportIcon sx={{ fontSize: 60, color: "error.main", mb: 1 }} />
                )}            </DialogTitle>

            <DialogContent sx={{ textAlign: "center" }}>
                <Typography variant="h6" fontWeight="bold" color={isAdvertencia ? "warning.main" : "error.main"}>
                    {isAdvertencia
                        ? "Turnos ya generados"
                        : "¡Error al generar los turnos!"}
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                    {mensaje}
                </Typography>
            </DialogContent>

            <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
                <Button
                    onClick={onClose}
                    variant="contained"
                    sx={{
                        px: 4,
                        borderRadius: 2,
                        backgroundColor: isAdvertencia ? "#ffb300" : "#d32f2f",
                        "&:hover": {
                            backgroundColor: isAdvertencia ? "#ff8f00" : "#9a0007",
                        },
                        color: "white",
                        fontWeight: "bold",
                    }}
                >
                    Cerrar
                </Button>
            </DialogActions>
        </Dialog>
    );
}
