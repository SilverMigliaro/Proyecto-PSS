"use client";

import React from "react";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
} from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useRouter } from "next/navigation";

interface ModalInfoProps {
    open: boolean;
    onClose: () => void;
    mensaje: string;
    tipo?: "error" | "info";
    redirect?: string;
}

export default function ModalInfo({
    open,
    onClose,
    mensaje,
    tipo = "error",
    redirect,
}: ModalInfoProps) {

    const router = useRouter();

    const handleClose = () => {
        onClose();
        if (redirect) router.push(redirect);
    };

    const Icono = tipo === "error" ? ErrorOutlineIcon : InfoOutlinedIcon;
    const color = tipo === "error" ? "error.main" : "info.main";

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    p: 2,
                },
            }}
        >
            <DialogTitle sx={{ textAlign: "center", pb: 0 }}>
                <Icono
                    sx={{ fontSize: 60, color: color, mb: 1 }}
                />
            </DialogTitle>

            <DialogContent sx={{ textAlign: "center" }}>
                <Typography variant="h6" fontWeight="bold">
                    {tipo === "error" ? "¡Ha ocurrido un error!" : "Información"}
                </Typography>

                <Typography variant="body2" color="text.secondary" mt={1}>
                    {mensaje}
                </Typography>
            </DialogContent>

            <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
                <Button
                    onClick={handleClose}
                    variant="contained"
                    sx={{
                        px: 4,
                        borderRadius: 2,
                        backgroundColor: tipo === "error" ? "error.main" : "info.main",
                        "&:hover": {
                            backgroundColor: tipo === "error" ? "error.dark" : "info.dark",
                        },
                    }}
                >
                    Aceptar
                </Button>
            </DialogActions>
        </Dialog>
    );
}
