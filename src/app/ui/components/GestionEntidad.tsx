"use client";

import React, { useState } from "react";
import { Box, Typography, Grid, Button } from "@mui/material";
import ModalCrear from "./modal/ModalCrear";
import ModalBuscarDNI from "./modal/ModalBuscarDNI";
import ModalModificar from "./modal/ModalModificar";
import ModalEliminarConfirm from "./modal/ModalEliminarConfirm";
import ModalExito from "./modal/ModalExito";
import ModalError from "./modal/ModalError";
import AddIcon from "@mui/icons-material/AddCircleRounded";
import EditIcon from "@mui/icons-material/EditRounded";
import DeleteIcon from "@mui/icons-material/DeleteForeverRounded";
import ModalEliminarPlanFamiliar from "./modal/ModalEliminarPlanFamiliar";

interface GestionEntidadProps {
  tipo: string;
  onSuccess?: () => void;
}

export default function GestionEntidad({
  tipo,
  onSuccess,
}: GestionEntidadProps) {
  const [modal, setModal] = useState<
    "crear" | "modificar" | "eliminar" | "eliminarPlanFamiliar" | null
  >(null);
  const [dniInput, setDniInput] = useState("");
  const [usuarioEncontrado, setUsuarioEncontrado] = useState<any>(null);
  const [modalExito, setModalExito] = useState<null | string>(null);
  const [modalError, setModalError] = useState(false);

  const handleOpen = (
    accion: "crear" | "modificar" | "eliminar" | "eliminarPlanFamiliar"
  ) => {
    setModal(accion);
    setDniInput("");
    setUsuarioEncontrado(null);
    setModalError(false);
  };

  const handleClose = () => setModal(null);

  const buscarUsuario = async () => {
    const rol =
      tipo === "Administrativo"
        ? "ADMIN"
        : tipo === "Socio"
        ? "SOCIO"
        : "ENTRENADOR";

    const res = await fetch(`/api/usuario?rol=${rol}&dni=${dniInput}`);
    const data = await res.json();

    if (res.ok) {
      const usuario = Array.isArray(data) ? data[0] : data;
      if (usuario) {
        setUsuarioEncontrado(usuario);
      } else {
        setModalError(true);
      }
    } else {
      setModalError(true);
    }
  };

  const guardarCambios = () => {
    setModal(null);
    setModalExito("modificado");
    if (onSuccess) onSuccess();
  };

  const confirmarEliminacion = () => {
    setModal(null);
    setModalExito("eliminado");
    if (onSuccess) onSuccess();
  };

  return (
    <Box className="p-8">
      <Typography
        variant="h6"
        sx={{
          mb: 3,
          textTransform: "uppercase",
          fontWeight: "bold",
          color: "#1F2937",
        }}
      >
        Operaciones sobre {tipo}
      </Typography>

      <Grid container spacing={2}>
        <Grid>
          <Button
            variant="contained"
            onClick={() => handleOpen("crear")}
            sx={{
              color: "lightgreen",
              backgroundColor: "#1A222E",
              "&: hover": {
                backgroundColor: "black",
              },
            }}
          >
            <AddIcon /> Crear {tipo}
          </Button>
        </Grid>
        <Grid>
          <Button
            variant="contained"
            onClick={() => handleOpen("modificar")}
            sx={{
              color: "#F1FF5C",
              backgroundColor: "#1A222E",
              "&: hover": {
                backgroundColor: "black",
              },
            }}
          >
            <EditIcon fontSize="small" /> Modificar {tipo}
          </Button>
        </Grid>
        <Grid>
          <Button
            variant="contained"
            onClick={() => {
              if (tipo === "Planes Familiares") {
                handleOpen("eliminarPlanFamiliar");
              } else {
                handleOpen("eliminar");
              }
            }}
            sx={{
              color: "crimson",
              backgroundColor: "#1A222E",
              "&: hover": {
                backgroundColor: "black",
              },
            }}
          >
            <DeleteIcon fontSize="small" />
            Eliminar {tipo}
          </Button>
        </Grid>
      </Grid>

      {/* ------------------- MODALES ------------------- */}
      <ModalCrear
        open={modal === "crear"}
        onClose={handleClose}
        tipo={tipo}
        onCrear={(usuario) => {
          console.log("Usuario creado:", usuario);
          setModal(null);
          setModalExito("creado");
          if (onSuccess) onSuccess();
        }}
      />

      <ModalBuscarDNI
        open={modal === "modificar" && !usuarioEncontrado}
        onClose={handleClose}
        tipo={tipo}
        dniInput={dniInput}
        setDniInput={setDniInput}
        onBuscar={buscarUsuario}
      />

      <ModalModificar
        open={modal === "modificar" && usuarioEncontrado !== null}
        onClose={handleClose}
        usuario={usuarioEncontrado}
        setUsuario={setUsuarioEncontrado}
        onGuardar={guardarCambios}
        tipo={tipo}
      />

      <ModalBuscarDNI
        open={modal === "eliminar" && !usuarioEncontrado}
        onClose={handleClose}
        tipo={tipo}
        dniInput={dniInput}
        setDniInput={setDniInput}
        onBuscar={buscarUsuario}
        eliminar
      />

      <ModalEliminarConfirm
        open={modal === "eliminar" && usuarioEncontrado !== null}
        onClose={handleClose}
        usuario={usuarioEncontrado}
        onConfirm={confirmarEliminacion}
        tipo={tipo}
      />

      <ModalEliminarPlanFamiliar
        onClose={handleClose}
        open={modal === "eliminarPlanFamiliar"}
      />

      <ModalExito
        open={modalExito !== null}
        onClose={() => {
          setModalExito(null);
        }}
        exito={modalExito}
        tipo={tipo}
      />

      <ModalError
        open={modalError}
        onClose={() => setModalError(false)}
        tipo={tipo}
      />
    </Box>
  );
}
