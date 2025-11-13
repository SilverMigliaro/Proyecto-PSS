"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
} from "@mui/material";

interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono?: string;
  rol: string;
}

interface Props {
  tipo: "Administrativo" | "Socio" | "Entrenador" | "Planes Familiares";
  reload?: boolean;
}

export default function ListaUsuarios({ tipo, reload }: Props) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        setLoading(true);
        setError(null);

        const rol =
          tipo === "Administrativo"
            ? "ADMIN"
            : tipo === "Entrenador"
            ? "ENTRENADOR"
            : "SOCIO";

        const res = await fetch(`/api/usuario?rol=${rol}`);
        if (!res.ok) {
          throw new Error(`Error HTTP ${res.status}`);
        }

        const data = await res.json();
        const usuariosArray = Array.isArray(data) ? data : [];

        setUsuarios(usuariosArray);
      } catch (err) {
        console.error("Error al obtener usuarios:", err);
        setError("Error al obtener los usuarios");
      } finally {
        setLoading(false);
      }
    };

    fetchUsuarios();
  }, [tipo, reload]);

  if (loading)
    return (
      <div className="flex justify-center py-6">
        <CircularProgress />
      </div>
    );

  if (error)
    return (
      <Typography color="error" textAlign="center">
        {error}
      </Typography>
    );

  if (usuarios.length === 0)
    return (
      <Typography textAlign="center" color="text.secondary" sx={{ mt: 3 }}>
        No hay usuarios registrados en esta categoría.
      </Typography>
    );

  return (
    <TableContainer
      component={Paper}
      elevation={4}
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        boxShadow: "0px 4px 15px rgba(0,0,0,0.1)",
      }}
    >
      <Table>
        <TableHead>
          <TableRow
            sx={{
              backgroundColor: "#1A222E",
            }}
          >
            {["Nombre", "Apellido", "DNI", "Email", "Teléfono", "Rol"].map(
              (header) => (
                <TableCell
                  key={header}
                  sx={{
                    color: "#fff",
                    fontWeight: "bold",
                    textAlign: "center",
                    fontSize: "0.95rem",
                  }}
                >
                  {header}
                </TableCell>
              )
            )}
          </TableRow>
        </TableHead>

        <TableBody>
          {usuarios.map((u, index) => (
            <TableRow
              key={u.id}
              sx={{
                backgroundColor: index % 2 === 0 ? "#CDD9EA" : "#ffffff",
                "&:hover": {
                  backgroundColor: "#e3f2fd",
                  cursor: "pointer",
                },
                transition: "background-color 0.2s ease",
              }}
            >
              <TableCell align="center">{u.nombre}</TableCell>
              <TableCell align="center">{u.apellido}</TableCell>
              <TableCell align="center">{u.dni}</TableCell>
              <TableCell align="center">{u.email}</TableCell>
              <TableCell align="center">{u.telefono || "-"}</TableCell>
              <TableCell align="center">
                <strong
                  style={{
                    color: "#0288d1",
                  }}
                >
                  {u.rol}
                </strong>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
