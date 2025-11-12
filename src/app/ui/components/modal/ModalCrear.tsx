"use client";
import React, { useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField, Button, MenuItem } from "@mui/material";
import { UsuarioBase, Entrenador, Socio } from "@/app/lib/types";

interface ModalCrearProps<T extends UsuarioBase> {
    open: boolean;
    onClose: () => void;
    tipo: string;
    onCrear: (usuario: T) => void;
}

export default function ModalCrear<T extends UsuarioBase>({ open, onClose, tipo, onCrear }: ModalCrearProps<T>) {
    const [form, setForm] = useState<Partial<T>>({} as Partial<T>);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (key: keyof T, value: any) => {
        setForm(prev => ({ ...prev, [key]: value }));
        setErrors(prev => ({ ...prev, [key]: "" }));
    };

    const handleClose = () => {
        setForm({} as Partial<T>);
        setErrors({});
        onClose();
    };

    const validar = (campo?: keyof T): boolean => {
        const newErrors: Record<string, string> = {};
        const campos = campo ? [campo] : ["nombre", "apellido", "dni", "email", "password", "tipoPlan"] as (keyof T)[];

        campos.forEach(key => {
            const value = (form as any)[key];

            if (key === "nombre") {
                if (!value?.trim()) newErrors.nombre = "Nombre obligatorio";
                else if ((value?.trim().length ?? 0) < 3) newErrors.nombre = "El nombre debe contener al menos 3 letras";
                else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(value)) newErrors.nombre = "Nombre solo debe contener caracteres alfabéticos";
            }

            if (key === "apellido") {
                if (!value?.trim()) newErrors.apellido = "Apellido obligatorio";
                else if ((value?.trim().length ?? 0) < 3) newErrors.apellido = "El apellido debe contener al menos 3 letras";
                else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(value)) newErrors.apellido = "Apellido solo debe contener caracteres alfabéticos";
            }

            if (key === "dni") {
                if (!value?.trim()) newErrors.dni = "DNI obligatorio";
                else if (!/^\d+$/.test(value)) newErrors.dni = "DNI solo debe contener números";
                else if (value.length < 7 || value.length > 8) newErrors.dni = "DNI debe tener 7 u 8 dígitos";
            }

            if (key === "email") {
                if (!value?.trim()) newErrors.email = "Email obligatorio";
                else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) newErrors.email = "Email inválido";
            }

            if (key === "password") {
                if (!value) newErrors.password = "Contraseña obligatoria";
            }

            if (tipo === "Socio" && key === "tipoPlan" && !(form as Partial<Socio>).tipoPlan) {
                newErrors.tipoPlan = "Seleccione un tipo de plan";
            }
        });

        setErrors(prev => ({ ...prev, ...newErrors }));
        return Object.keys(newErrors).length === 0;
    };

    const crearUsuario = async () => {
        if (!validar()) return;

        setLoading(true);
        try {
            let url = "";
            let body: any = { ...form };

            if (tipo === "Administrativo") {
                url = "/api/usuario";
                body.rol = "ADMIN";
            } else if (tipo === "Socio") {
                url = "/api/socio";
            } else if (tipo === "Entrenador") {
                url = "/api/entrenador";
            } else {
                throw new Error("Tipo de usuario no válido");
            }

            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Error al crear usuario");

            onCrear(data);
            setForm({} as Partial<T>);
            setErrors({});
            onClose();
        } catch (err: any) {
            setErrors({ general: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle textAlign={"center"} bgcolor={"#222222"} color="white" fontWeight={"bold"} >Crear {tipo}</DialogTitle>
            <DialogContent dividers>
                <Grid container direction="column" spacing={2}>
                    <Grid>
                        <TextField
                            fullWidth
                            label="Nombre"
                            value={form.nombre || ""}
                            onChange={e => handleChange("nombre", e.target.value)}
                            onBlur={() => validar("nombre")}
                            error={!!errors.nombre}
                            helperText={errors.nombre}
                        />
                    </Grid>
                    <Grid>
                        <TextField
                            fullWidth
                            label="Apellido"
                            value={form.apellido || ""}
                            onChange={e => handleChange("apellido", e.target.value)}
                            onBlur={() => validar("apellido")}
                            error={!!errors.apellido}
                            helperText={errors.apellido}
                        />
                    </Grid>
                    <Grid>
                        <TextField
                            fullWidth
                            label="DNI"
                            value={form.dni || ""}
                            onChange={e => handleChange("dni", e.target.value)}
                            onBlur={() => validar("dni")}
                            error={!!errors.dni}
                            helperText={errors.dni}
                        />
                    </Grid>
                    <Grid>
                        <TextField
                            fullWidth
                            label="Email"
                            value={form.email || ""}
                            onChange={e => handleChange("email", e.target.value)}
                            onBlur={() => validar("email")}
                            error={!!errors.email}
                            helperText={errors.email}
                        />
                    </Grid>
                    <Grid>
                        <TextField
                            fullWidth
                            label="Teléfono"
                            value={form.telefono || ""}
                            onChange={e => handleChange("telefono", e.target.value)}
                        />
                    </Grid>
                    <Grid>
                        <TextField
                            fullWidth
                            label="Contraseña"
                            type="password"
                            onChange={e => handleChange("password" as any, e.target.value)}
                            onBlur={() => validar("password")}
                            error={!!errors.password}
                            helperText={errors.password}
                        />
                    </Grid>

                    {tipo === "Socio" && (
                        <Grid>
                            <TextField
                                select
                                fullWidth
                                label="Tipo de Plan"
                                value={(form as Partial<Socio>).tipoPlan || ""}
                                onChange={e => handleChange("tipoPlan" as any, e.target.value)}
                                error={!!errors.tipoPlan}
                                helperText={errors.tipoPlan}
                            >
                                <MenuItem value="INDIVIDUAL">INDIVIDUAL</MenuItem>
                                <MenuItem value="FAMILIAR">FAMILIAR</MenuItem>
                            </TextField>
                        </Grid>
                    )}

                    {errors.general && <Grid><p style={{ color: "red" }}>{errors.general}</p></Grid>}
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={handleClose}
                    sx={{ color: "#222222" }}
                >
                    Cancelar
                </Button>
                <Button
                    variant="contained"
                    onClick={crearUsuario}
                    disabled={loading}
                    sx={{
                        color: "white",
                        backgroundColor: "#2E8B57",
                        "&: hover": {
                            backgroundColor: "#1D5837"
                        }
                    }}
                >
                    {loading ? "Creando..." : "Crear"}
                </Button>
            </DialogActions>
        </Dialog >
    );
}
