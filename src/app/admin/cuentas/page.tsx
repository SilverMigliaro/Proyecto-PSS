"use client";

import React, { useEffect, useState } from "react";
import { Box, Typography, Tabs, Tab, Divider } from "@mui/material";
import GestionEntidad from "@/app/ui/components/GestionEntidad";
import ListaUsuarios from "@/app/ui/components/ListaUsuarios";

export default function Page() {
  const [tab, setTab] = useState(0);
  const [reloadLista, setReloadLista] = useState(false);
  const [planesFamiliares, setPlanesFamiliares] = useState<any[]>([]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  const triggerReload = () => setReloadLista((prev) => !prev);

  const loadPlanesFamiliares = async () => {
    const res = await fetch("/api/familia");
    if (!res.ok) {
      throw new Error("Error al cargar los planes familiares");
    }
    const data = await res.json();
    setPlanesFamiliares(data);
    return data;
  };

  const tipo =
    tab === 0
      ? "Administrativo"
      : tab === 1
      ? "Socio"
      : tab === 2
      ? "Entrenador"
      : "Planes Familiares";

  return (
    <div className="flex h-screen bg-[#F3F4F6]">
      <div className="flex-1 flex flex-col overflow-auto rounded-2xl border-2 border-[#2A384B]">
        <Box className="p-8">
          <Typography
            variant="h5"
            gutterBottom
            sx={{
              fontWeight: "bold",
              mb: 3,
              color: "#1F2937",
              textAlign: "center",
              textTransform: "uppercase",
            }}
          >
            Gestión de Cuentas
          </Typography>

          <Tabs
            value={tab}
            onChange={handleTabChange}
            sx={{
              "& .MuiTabs-indicator": {
                backgroundColor: "#2A384B",
              },
              "& .MuiTab-root": {
                color: "#555",
                "&.Mui-selected": {
                  color: "#2A384B",
                },
              },
            }}
          >
            <Tab label="Administrativos" />
            <Tab label="Socios" />
            <Tab label="Entrenadores" />
            <Tab onClick={loadPlanesFamiliares} label="Planes Familiares" />
          </Tabs>

          <GestionEntidad tipo={tipo} onSuccess={triggerReload} />

          <Divider sx={{ my: 4 }} />

          <Typography
            variant="h6"
            sx={{
              mb: 3,
              color: "#1F2937",
              textAlign: "center",
              textTransform: "uppercase",
              fontWeight: "bold",
            }}
          >
            Lista de {tipo === "Entrenador" ? `${tipo}es` : `${tipo}s`}
          </Typography>

          {tipo === "Planes Familiares" ? (
            planesFamiliares.map((plan) => (
              <div
                key={plan.id}
                className="border border-gray-300 rounded-md p-3 mb-3"
              >
                <h3 className="font-semibold">
                  Apellido titular: {plan.apellido}
                </h3>
                <p>Titular DNI: {plan.titularDni}</p>
                Miembros:
                {plan.miembros.map((miembro: any) => (
                  <div
                    key={miembro.usuarioDni}
                    className="border border-gray-400 rounded-sm p-2 mb-2"
                  >
                    <p>DNI: {miembro.usuarioDni}</p>
                  </div>
                ))}
              </div>
            ))
          ) : (
            <ListaUsuarios tipo={tipo} reload={reloadLista} />
          )}
        </Box>
      </div>
    </div>
  );
}
