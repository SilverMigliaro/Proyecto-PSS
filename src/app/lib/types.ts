import { TipoDeporte, DiaSemana } from "@prisma/client"

export interface UsuarioBase {
    id: number;
    nombre: string;
    apellido: string;
    dni: string;
    email: string;
    telefono?: string;
    password: string;
    rol: "ADMIN" | "ENTRENADOR" | "SOCIO";
    fechaAlta: Date;
}

export interface Administrativo extends UsuarioBase {
    rol: "ADMIN";
}

export interface Entrenador extends UsuarioBase {
    rol: "ENTRENADOR";
    actividadDeportiva: "FUTBOL" | "BASQUET" | "NATACION" | "HANDBALL";
    practica?: PracticaDeportiva[];
    asistencias?: Asistencia[];
    usuario: {
        id: number;
        nombre: string;
        apellido: string;
        dni: string;
        email: string;
        telefono?: string;
        rol: "ENTRENADOR";
        fechaAlta: Date | string;
    };
}

export interface Socio extends UsuarioBase {
    rol: "SOCIO";
    tipoPlan: "INDIVIDUAL" | "FAMILIAR";
    estado: "ACTIVO" | "INACTIVO" | "BLOQUEADO";
    familiaId?: number;
    familia?: Familia;
    inscripciones?: InscripcionDeportiva[];
    alquileres?: AlquilerCancha[];
    asistencias?: Asistencia[];
    pagos?: Pago[];
    cuotas?: CuotaSocio[];
}

export interface Familia {
    id: number;
    apellido: string;
    descuento: number; // 0 a 1
    socios?: Socio[];
}

export interface PracticaDeportiva {
    id: number;
    deporte: TipoDeporte;
    canchaId: number;
    fechaInicio: string;
    fechaFin: string;
    precio: number;
    horarios: HorarioPractica[];
    inscripciones: InscripcionDeportiva[];
    entrenadores: Entrenador[];
    cancha: Cancha;
}

export interface HorarioPractica {
    id: number;
    dia: DiaSemana;
    horaInicio: string;
    horaFin: string;
}

export interface Cancha {
    id: number;
    nombre: string;
    tipoDeporte: "FUTBOL" | "BASQUET" | "NATACION" | "HANDBALL";
    interior: boolean;
    capacidadMax: number;
    precioHora: number;
    activa: boolean;
    horarios?: HorarioCancha[];
    turnos?: TurnoCancha[];
}

export interface TurnoCancha {
    id: number;
    canchaId: number;
    fecha: Date;
    horaInicio: Date;
    horaFin: Date;
    disponible: boolean;
    alquileres?: AlquilerCancha[];
    horariosPractica?: HorarioPractica[];
}


export interface HorarioCancha {
    id: number;
    canchaId: number;
    diaSemana: "LUNES" | "MARTES" | "MIERCOLES" | "JUEVES" | "VIERNES" | "SABADO" | "DOMINGO";
    horaInicio: Date;
    horaFin: Date;
    disponible: boolean;
}

export interface InscripcionDeportiva {
    id: number;
    socioId: number;
    practicaId: number;
    fechaInscripcion: Date;
    precioPagado: number;
    socio?: Socio;
    practica?: PracticaDeportiva;
}

export interface AlquilerCancha {
    id: number;
    socioId: number;
    turnoId: number;
    fechaReserva: Date;
    estadoAlquiler: "RESERVADO" | "CANCELADO" | "COMPLETADO";
    motivoCancelacion?: "MANTENIMIENTO" | "LLUVIA" | "CORTE_DE_LUZ" | "CORTE_DE_AGUA" | "PROBLEMAS_CALEFACCION";
    fechaCancelacion?: Date;
    notificado: boolean;
    socio?: Socio;
    turno?: TurnoCancha;
    pago?: Pago;
}

export interface Asistencia {
    id: number;
    socioId: number;
    entrenadorId: number;
    practicaId: number;
    fecha: Date;
    presente: boolean;
    socio?: Socio;
    entrenador?: Entrenador;
    practica?: PracticaDeportiva;
}

export interface Pago {
    id: number;
    socioId: number;
    monto: number;
    tipo: "CUOTA_SOCIO" | "PRACTICA_DEPORTIVA" | "ALQUILER";
    fechaPago: Date;
    aprobado: boolean;
    socio?: Socio;
    alquileres?: AlquilerCancha[];
    cuotas?: CuotaSocio[];
    comprobante?: ComprobantePago;
}

export interface ComprobantePago {
    id: number;
    pagoId: number;
    archivoUrl: string;
    fechaSubida: Date;
    pago?: Pago;
}

export interface CuotaSocio {
    id: number;
    socioId: number;
    mes: "ENERO" | "FEBRERO" | "MARZO" | "ABRIL" | "MAYO" | "JUNIO" | "JULIO" | "AGOSTO" | "SEPTIEMBRE" | "OCTUBRE" | "NOVIEMBRE" | "DICIEMBRE";
    anio: number;
    monto: number;
    pagada: boolean;
    fechaPago?: Date;
    socio?: Socio;
    pago?: Pago;
}

