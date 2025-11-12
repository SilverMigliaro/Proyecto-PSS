"use client";
import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    TextField,
    Button,
    MenuItem,
} from "@mui/material";

interface ModalModificarProps {
    open: boolean;
    onClose: () => void;
    usuario: any;
    setUsuario: (usuario: any) => void;
    onGuardar: () => void;
    tipo: string;
    practicasDisponibles?: { id: number; deporte: string }[];
}

export default function ModalModificar({
    open,
    onClose,
    usuario,
    setUsuario,
    onGuardar,
    tipo,

}: ModalModificarProps) {
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [practicas, setPracticas] = useState<{ id: number; deporte: string }[]>([]);

    useEffect(() => {
        const cargarPracticas = async () => {
            if (tipo === "Entrenador" && usuario?.dni) {
                try {
                    const res = await fetch(`/api/entrenador/${usuario.dni}`);
                    const data = await res.json();

                    // Verificamos que data.practicas sea un array
                    const misPracticas = Array.isArray(data.practicas) ? data.practicas : [];
                    setPracticas(misPracticas);

                    // Inicializamos practicaId si no tiene valor
                    if (!usuario.practicaId && misPracticas.length > 0) {
                        setUsuario({ ...usuario, practicaId: misPracticas[0].id });
                    }

                } catch (err) {
                    console.error("Error al cargar prácticas:", err);
                    setPracticas([]);
                }
            }
        };

        if (open) cargarPracticas();
    }, [open, usuario?.dni]);

    const validarCampo = (campo: string, valor: string) => {
        let mensaje = "";

        switch (campo) {
            case "nombre":
            case "apellido":
                if (!valor.trim()) mensaje = `${campo} obligatorio`;
                else if (valor.trim().length < 3) mensaje = `${campo} debe tener al menos 3 letras`;
                else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(valor))
                    mensaje = `${campo} solo debe contener letras`;
                break;

            case "email":
                if (!valor.trim()) mensaje = "Email obligatorio";
                else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor))
                    mensaje = "Formato de email inválido";
                break;

        }

        setErrors(prev => ({ ...prev, [campo]: mensaje }));
        return mensaje === "";
    };

    const validarTodo = () => {
        const campos = ["nombre", "apellido", "email", "telefono"];
        let esValido = true;

        campos.forEach(c => {
            const valor = usuario[c] || "";
            const valido = validarCampo(c, valor);
            if (!valido) esValido = false;
        });

        return esValido;
    };

    const Guardar = async () => {
        if (!validarTodo()) return;

        setLoading(true);
        try {
            let endpoint = "";
            const dni = usuario.dni;
            if (tipo === "Administrativo") endpoint = `/api/usuario/${dni}`;
            else if (tipo === "Entrenador") endpoint = `/api/entrenador/${dni}`;
            else if (tipo === "Socio") endpoint = `/api/socio/${dni}`;
            else return console.error("Tipo de usuario no soportado");

            const body: any = {
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                email: usuario.email,
                telefono: usuario.telefono,
            };

            if (tipo === "Entrenador") {
                body.practicaId = usuario.practicaId || null;
            } else if (tipo === "Socio") {
                body.tipoPlan = usuario.tipoPlan;
                body.estado = usuario.estado;
            }

            const res = await fetch(endpoint, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Error al actualizar usuario");
            onGuardar();
        } catch (error) {
            console.error("Error al guardar cambios:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle textAlign={"center"} bgcolor={"#222222"} color="white">Modificar {tipo}</DialogTitle>
            <DialogContent dividers>
                <Grid container direction="column" spacing={2}>
                    <Grid>
                        <TextField
                            fullWidth
                            label="Nombre"
                            value={usuario?.nombre || ""}
                            onChange={(e) => setUsuario({ ...usuario, nombre: e.target.value })}
                            onBlur={(e) => validarCampo("nombre", e.target.value)}
                            error={!!errors.nombre}
                            helperText={errors.nombre}
                        />
                    </Grid>
                    <Grid>
                        <TextField
                            fullWidth
                            label="Apellido"
                            value={usuario?.apellido || ""}
                            onChange={(e) => setUsuario({ ...usuario, apellido: e.target.value })}
                            onBlur={(e) => validarCampo("apellido", e.target.value)}
                            error={!!errors.apellido}
                            helperText={errors.apellido}
                        />
                    </Grid>
                    <Grid>
                        <TextField
                            fullWidth
                            label="Email"
                            value={usuario?.email || ""}
                            onChange={(e) => setUsuario({ ...usuario, email: e.target.value })}
                            onBlur={(e) => validarCampo("email", e.target.value)}
                            error={!!errors.email}
                            helperText={errors.email}
                        />
                    </Grid>
                    <Grid>
                        <TextField
                            fullWidth
                            label="Teléfono"
                            value={usuario?.telefono || ""}
                            onChange={(e) => setUsuario({ ...usuario, telefono: e.target.value })}
                            error={!!errors.telefono}
                            helperText={errors.telefono}
                        />
                    </Grid>

                    {tipo === "Socio" && (
                        <>
                            <Grid>
                                <TextField
                                    select
                                    fullWidth
                                    label="Tipo de Plan"
                                    value={usuario?.tipoPlan || "INDIVIDUAL"}
                                    onChange={(e) => setUsuario({ ...usuario, tipoPlan: e.target.value })}
                                >
                                    <MenuItem value="INDIVIDUAL">Individual</MenuItem>
                                    <MenuItem value="FAMILIAR">Familiar</MenuItem>
                                </TextField>
                            </Grid>
                        </>
                    )}
                    {tipo === "Entrenador" && practicas.length > 0 && (
                        <Grid>
                            <TextField
                                select
                                fullWidth
                                label="Práctica Deportiva"
                                value={usuario?.practicaId || ""}
                                onChange={(e) => setUsuario({ ...usuario, practicaId: Number(e.target.value) })}
                            >
                                {practicas.map((p) => (
                                    <MenuItem key={p.id} value={p.id}>
                                        PD{p.id} - {p.deporte}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                    )}

                </Grid>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={onClose}
                    sx={{ color: "#222222" }}
                >
                    Cancelar
                </Button>
                <Button
                    variant="contained"
                    onClick={Guardar}
                    sx={{
                        backgroundColor: "#FBC02D",
                        color: "black",
                        borderRadius: 2,
                        px: 3,
                        "&:hover": {
                            backgroundColor: "#F9A825",
                        },
                    }}
                    disabled={loading}>
                    {loading ? "Guardando..." : "Guardar Cambios"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
