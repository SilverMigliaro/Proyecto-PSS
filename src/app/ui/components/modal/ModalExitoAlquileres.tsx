"use client";

import React from "react";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
    Box,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useRouter } from "next/navigation";

interface ModalExitoAlquileresProps {
    open: boolean;
    onClose: () => void;
    opcion: string;
}

export default function ModalExitoAlquileres({
    open,
    onClose,
    opcion,
}: ModalExitoAlquileresProps) {

    const router = useRouter()

    const handleClose = () => {
        onClose();
        router.push("/socio");
    }

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
                <CheckCircleOutlineIcon
                    sx={{ fontSize: 60, color: "success.main", mb: 1 }}
                />
            </DialogTitle>

            <DialogContent sx={{ textAlign: "center" }}>
                <Typography variant="h6" fontWeight="bold">
                    ¡Alquiler {opcion} con éxito!
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                    El Alquiler fue {opcion} correctamente por el sistema.
                </Typography>
            </DialogContent>

            <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
                <Button
                    onClick={handleClose}
                    variant="contained"
                    color="success"
                    sx={{ px: 4, borderRadius: 2 }}
                >
                    Aceptar
                </Button>
            </DialogActions>
        </Dialog>
    );
}
