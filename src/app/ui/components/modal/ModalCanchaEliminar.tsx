"use client";

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InfoIcon from "@mui/icons-material/Info";
import ErrorIcon from "@mui/icons-material/Error";

type ModalMensajeProps = {
    open: boolean;
    onClose: () => void;
    titulo?: string;
    mensaje: string;
    tipo?: "error" | "exito" | "info";
};

export default function ModalMensaje({ open, onClose, titulo, mensaje, tipo = "info" }: ModalMensajeProps) {
    let colorTitulo = "#1976d2";
    let Icon = InfoIcon;
    if (tipo === "error") {
        colorTitulo = "#d32f2f";
        Icon = ErrorIcon;
    } else if (tipo === "exito") {
        colorTitulo = "#388e3c";
        Icon = CheckCircleIcon;
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle textAlign={"center"} bgcolor={"#222222"} color="white">
                <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1 }}>
                    <Icon sx={{ color: colorTitulo }} />
                    <span >{titulo ?? (tipo === "error" ? "Error" : tipo === "exito" ? "Éxito" : "Información")}</span>
                </Box>
            </DialogTitle>
            <DialogContent >
                <Typography sx={{ paddingTop: "2rem" }}>{mensaje}</Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">
                    Aceptar
                </Button>
            </DialogActions>
        </Dialog >
    );
}
