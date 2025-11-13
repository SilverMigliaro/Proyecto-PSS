'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  CircularProgress,
  Box,
  Divider,
  Button,
} from '@mui/material';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation'

interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  rol: string;
}

export default function UsuarioDetallePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user;

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsuario = useCallback(async (dni: string) => {
    try {
      const res = await fetch(`/api/usuario/${dni}`);
      if (!res.ok) {
        setError(`Error al obtener usuario: ${res.status}`);
        return;
      }
      const data = await res.json();
      setUsuario(data);
    } catch (err) {
      setError("Error al obtener usuario");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated" && user?.dni) {
      fetchUsuario(user.dni);
    } else if (status === "unauthenticated") {
      setError("Usuario no autenticado");
      setLoading(false);
    }
  }, [status, user?.dni, fetchUsuario]);

  if (loading) {
    return (
      <Container sx={{ py: 6, textAlign: 'center' }}>
        <CircularProgress />
        <Typography>Cargando perfil...</Typography>
      </Container>
    );
  }

  if (error || !usuario) {
    return (
      <Container sx={{ py: 6, textAlign: 'center' }}>
        <Typography color="error">{error || 'Usuario no encontrado'}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Paper
        elevation={4}
        sx={{
          pb: 4,
          textAlign: 'center',
        }}
      >
        <Typography
          variant="h5"
          fontWeight="bold"
          bgcolor={"#1a222e"}
          gutterBottom
          sx={{
            borderTopLeftRadius: '1rem',
            borderTopRightRadius: '1rem',
            textTransform: 'uppercase',
            width: '100%',
            p: 4,
            fontWeight: 'bold',
            color: 'white',
            mb: 6,
          }}

        >
          Detalle del Usuario
        </Typography>

        <Divider sx={{ mb: 3 }} />

        <Box sx={{ textAlign: 'left', pl: 6, pb: 4 }}>
          <Typography variant="body1" sx={{ mb: 1 }}>
            <strong>Nombre:</strong> {usuario.nombre}
          </Typography>

          <Typography variant="body1" sx={{ mb: 1 }}>
            <strong>Apellido:</strong> {usuario.apellido}
          </Typography>

          <Typography variant="body1" sx={{ mb: 1 }}>
            <strong>DNI:</strong> {usuario.dni}
          </Typography>

          <Typography variant="body1" sx={{ mb: 1 }}>
            <strong>Email:</strong> {usuario.email}
          </Typography>

          <Typography variant="body1" sx={{ mb: 1 }}>
            <strong>Teléfono:</strong> {usuario.telefono || '<Sin teléfono>'}
          </Typography>

          <Typography variant="body1">
            <strong>Rol:</strong> {usuario.rol}
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => router.push('/entrenador')}
          sx={{
            mt: 2,
            fontWeight: 'bold',
            textTransform: 'none',
            borderRadius: 2,
            px: 4,
            py: 1,
            backgroundColor: "#1a222e"
          }}
        >
          Volver al Menú
        </Button>
      </Paper>
    </Container >
  );
}
