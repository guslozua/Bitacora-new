// src/services/TarifaService.ts - SERVICIO FRONTEND PARA TARIFAS - VERSIÓN CORREGIDA
import axios from 'axios';

// URL base de la API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ✅ INTERFACES CORREGIDAS - ID SIEMPRE PRESENTE EN TARIFAS EXISTENTES
export interface Tarifa {
    id: number; // ✅ ID requerido para tarifas existentes
    nombre: string;
    valor_guardia_pasiva: number;
    valor_hora_activa: number;
    valor_adicional_nocturno_habil: number;
    valor_adicional_nocturno_no_habil: number;
    vigencia_desde: string;
    vigencia_hasta?: string | null;
    estado: 'activo' | 'inactivo';
    observaciones?: string | null;
    created_at?: string;
    updated_at?: string;
}

// ✅ NUEVA INTERFAZ PARA CREAR TARIFAS (SIN ID)
export interface TarifaCreacion {
    nombre: string;
    valor_guardia_pasiva: number;
    valor_hora_activa: number;
    valor_adicional_nocturno_habil: number;
    valor_adicional_nocturno_no_habil: number;
    vigencia_desde: string;
    vigencia_hasta?: string | null;
    estado: 'activo' | 'inactivo';
    observaciones?: string | null;
}

export interface ResultadoSimulacion {
    tarifa_utilizada: {
        id: number;
        nombre: string;
        vigor_desde: string;
        valores: {
            guardia_pasiva: number;
            hora_activa: number;
            nocturno_habil: number;
            nocturno_no_habil: number;
        };
    };
    parametros_calculo: {
        fecha: string;
        hora_inicio: string;
        hora_fin: string;
        tipo_guardia: string;
        duracion_minutos: number;
        duracion_horas: number;
        minutos_nocturnos: number;
        horas_nocturnas: number;
        es_dia_no_laboral: boolean;
        dia_semana: string;
    };
    calculos: {
        guardia_pasiva: number;
        guardia_activa: number;
        adicional_nocturno: number;
        total: number;
    };
    detalle: Array<{
        concepto: string;
        descripcion: string;
        calculo: string;
        importe: number;
    }>;
}

export interface ParametrosSimulacion {
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    tipo_guardia: 'pasiva' | 'activa' | 'ambas';
    id_tarifa?: number;
}

// Clase para manejar errores de la API
class ApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

/**
 * Servicio para operaciones con tarifas
 * ✅ COMPLETAMENTE INTEGRADO CON EL BACKEND - TIPOS CORREGIDOS
 */
const TarifaService = {
    // ===== OPERACIONES CRUD BÁSICAS =====

    /**
     * Obtener todas las tarifas con filtros opcionales
     */
    fetchTarifas: async (params: {
        estado?: 'activo' | 'inactivo';
        nombre?: string;
        incluir_inactivas?: boolean;
    } = {}): Promise<Tarifa[]> => {
        try {
            const queryParams = {
                estado: params.estado,
                nombre: params.nombre,
                incluir_inactivas: params.incluir_inactivas ? 'true' : undefined
            };

            // Remover parámetros undefined
            Object.keys(queryParams).forEach((key) => {
                const typedKey = key as keyof typeof queryParams;
                if (queryParams[typedKey] === undefined) {
                    delete queryParams[typedKey];
                }
            });

            const response = await axios.get(`${API_URL}/tarifas`, { params: queryParams });

            if (!response.data.success) {
                throw new ApiError(response.data.message || 'Error al obtener tarifas', response.status);
            }

            // ✅ El backend siempre devuelve tarifas con ID
            return response.data.data as Tarifa[];
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new ApiError(
                    error.response.data.message || 'Error al obtener tarifas',
                    error.response.status
                );
            }
            throw new Error('Error de conexión al obtener tarifas');
        }
    },

    /**
     * Obtener una tarifa por ID
     */
    fetchTarifaById: async (id: number | string): Promise<Tarifa> => {
        try {
            const response = await axios.get(`${API_URL}/tarifas/${id}`);

            if (!response.data.success) {
                throw new ApiError(response.data.message || 'Error al obtener tarifa', response.status);
            }

            return response.data.data as Tarifa;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new ApiError(
                    error.response.data.message || 'Error al obtener tarifa',
                    error.response.status
                );
            }
            throw new Error('Error de conexión al obtener tarifa');
        }
    },

    /**
     * ✨ FUNCIÓN CLAVE: Obtener tarifa vigente para una fecha
     */
    fetchTarifaVigente: async (fecha: string): Promise<Tarifa> => {
        try {
            const response = await axios.get(`${API_URL}/tarifas/vigente`, {
                params: { fecha }
            });

            if (!response.data.success) {
                throw new ApiError(response.data.message || 'Error al obtener tarifa vigente', response.status);
            }

            return response.data.data as Tarifa;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new ApiError(
                    error.response.data.message || 'Error al obtener tarifa vigente',
                    error.response.status
                );
            }
            throw new Error('Error de conexión al obtener tarifa vigente');
        }
    },

    /**
     * ✅ Crear una nueva tarifa - USA TarifaCreacion (sin ID)
     */
    createTarifa: async (tarifa: TarifaCreacion): Promise<Tarifa> => {
        try {
            const response = await axios.post(`${API_URL}/tarifas`, tarifa);

            if (!response.data.success) {
                throw new ApiError(response.data.message || 'Error al crear tarifa', response.status);
            }

            return response.data.data as Tarifa;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new ApiError(
                    error.response.data.message || 'Error al crear tarifa',
                    error.response.status
                );
            }
            throw new Error('Error de conexión al crear tarifa');
        }
    },

    /**
     * ✅ Actualizar una tarifa existente - USA Tarifa (con ID)
     */
    updateTarifa: async (tarifa: Tarifa): Promise<Tarifa> => {
        try {
            const response = await axios.put(`${API_URL}/tarifas/${tarifa.id}`, tarifa);

            if (!response.data.success) {
                throw new ApiError(response.data.message || 'Error al actualizar tarifa', response.status);
            }

            return response.data.data as Tarifa;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new ApiError(
                    error.response.data.message || 'Error al actualizar tarifa',
                    error.response.status
                );
            }
            throw new Error('Error de conexión al actualizar tarifa');
        }
    },

    /**
     * Desactivar una tarifa
     */
    deactivateTarifa: async (id: number | string): Promise<boolean> => {
        try {
            const response = await axios.patch(`${API_URL}/tarifas/${id}/deactivate`);

            if (!response.data.success) {
                throw new ApiError(response.data.message || 'Error al desactivar tarifa', response.status);
            }

            return true;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new ApiError(
                    error.response.data.message || 'Error al desactivar tarifa',
                    error.response.status
                );
            }
            throw new Error('Error de conexión al desactivar tarifa');
        }
    },

    /**
     * Eliminar una tarifa
     */
    deleteTarifa: async (id: number | string): Promise<boolean> => {
        try {
            const response = await axios.delete(`${API_URL}/tarifas/${id}`);

            if (!response.data.success) {
                throw new ApiError(response.data.message || 'Error al eliminar tarifa', response.status);
            }

            return true;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new ApiError(
                    error.response.data.message || 'Error al eliminar tarifa',
                    error.response.status
                );
            }
            throw new Error('Error de conexión al eliminar tarifa');
        }
    },

    // ===== FUNCIONES ESPECIALIZADAS =====

    /**
     * ✨ SIMULADOR DE CÁLCULOS - FUNCIÓN PRINCIPAL
     */
    simularCalculo: async (parametros: ParametrosSimulacion): Promise<ResultadoSimulacion> => {
        try {
            const response = await axios.post(`${API_URL}/tarifas/simular`, parametros);

            if (!response.data.success) {
                throw new ApiError(response.data.message || 'Error en simulación', response.status);
            }

            return response.data.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new ApiError(
                    error.response.data.message || 'Error en simulación de cálculo',
                    error.response.status
                );
            }
            throw new Error('Error de conexión en simulación');
        }
    },

    /**
     * Analizar códigos aplicables para una fecha y horario
     */
    analizarCodigosAplicables: async (
        fecha: string,
        horaInicio: string,
        horaFin: string
    ): Promise<{
        fecha: string;
        hora_inicio: string;
        hora_fin: string;
        tarifa_vigente: Tarifa | null;
        codigos_aplicables: Array<{
            id: number;
            codigo: string;
            descripcion: string;
            tipo: string;
            factor_multiplicador: number;
            dias_aplicables: string;
            horario: {
                inicio: string | null;
                fin: string | null;
            };
        }>;
        total_codigos: number;
    }> => {
        try {
            const response = await axios.get(`${API_URL}/tarifas/analizar-codigos`, {
                params: {
                    fecha,
                    hora_inicio: horaInicio,
                    hora_fin: horaFin
                }
            });

            if (!response.data.success) {
                throw new ApiError(response.data.message || 'Error al analizar códigos', response.status);
            }

            return response.data.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new ApiError(
                    error.response.data.message || 'Error al analizar códigos aplicables',
                    error.response.status
                );
            }
            throw new Error('Error de conexión al analizar códigos');
        }
    },

    /**
     * Obtener ejemplos pre-calculados
     */
    obtenerEjemplos: async (): Promise<{
        tarifa_base: {
            id: number;
            nombre: string;
            vigencia_desde: string;
        };
        ejemplos: Array<{
            nombre: string;
            descripcion: string;
            parametros: ParametrosSimulacion;
            resultado_estimado: {
                guardia_pasiva?: number;
                guardia_activa?: number;
                adicional_nocturno?: number;
                total: number;
            };
        }>;
    }> => {
        try {
            const response = await axios.get(`${API_URL}/tarifas/ejemplos`);

            if (!response.data.success) {
                throw new ApiError(response.data.message || 'Error al obtener ejemplos', response.status);
            }

            return response.data.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new ApiError(
                    error.response.data.message || 'Error al obtener ejemplos',
                    error.response.status
                );
            }
            throw new Error('Error de conexión al obtener ejemplos');
        }
    },

    /**
     * Obtener estadísticas de tarifas
     */
    obtenerEstadisticas: async (): Promise<{
        total_tarifas: number;
        activas: number;
        inactivas: number;
        vigencia_indefinida: number;
        promedio_guardia_pasiva: number;
        promedio_hora_activa: number;
        primera_vigencia: string;
        ultima_vigencia: string;
    }> => {
        try {
            const response = await axios.get(`${API_URL}/tarifas/estadisticas`);

            if (!response.data.success) {
                throw new ApiError(response.data.message || 'Error al obtener estadísticas', response.status);
            }

            return response.data.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new ApiError(
                    error.response.data.message || 'Error al obtener estadísticas',
                    error.response.status
                );
            }
            throw new Error('Error de conexión al obtener estadísticas');
        }
    },

    // ===== FUNCIONES DE UTILIDAD =====

    /**
     * ✅ Validar formato de tarifa antes de enviar - CORREGIDA
     */
    validarTarifa: (tarifa: Partial<TarifaCreacion>): { valida: boolean; errores: string[] } => {
        const errores: string[] = [];

        if (!tarifa.nombre || tarifa.nombre.trim().length === 0) {
            errores.push('El nombre es obligatorio');
        }

        if (!tarifa.valor_guardia_pasiva || tarifa.valor_guardia_pasiva <= 0) {
            errores.push('El valor de guardia pasiva debe ser mayor a 0');
        }

        if (!tarifa.valor_hora_activa || tarifa.valor_hora_activa <= 0) {
            errores.push('El valor por hora activa debe ser mayor a 0');
        }

        if (!tarifa.valor_adicional_nocturno_habil || tarifa.valor_adicional_nocturno_habil <= 0) {
            errores.push('El valor adicional nocturno hábil debe ser mayor a 0');
        }

        if (!tarifa.valor_adicional_nocturno_no_habil || tarifa.valor_adicional_nocturno_no_habil <= 0) {
            errores.push('El valor adicional nocturno no hábil debe ser mayor a 0');
        }

        if (!tarifa.vigencia_desde) {
            errores.push('La fecha de vigencia desde es obligatoria');
        }

        // Validar que vigencia_hasta sea posterior a vigencia_desde
        if (tarifa.vigencia_desde && tarifa.vigencia_hasta) {
            const desde = new Date(tarifa.vigencia_desde);
            const hasta = new Date(tarifa.vigencia_hasta);

            if (hasta <= desde) {
                errores.push('La fecha de vigencia hasta debe ser posterior a la fecha desde');
            }
        }

        return {
            valida: errores.length === 0,
            errores
        };
    },

    /**
     * Formatear tarifa para mostrar en UI
     */
    formatearTarifa: (tarifa: Tarifa): Tarifa & {
        valor_guardia_pasiva_formatted: string;
        valor_hora_activa_formatted: string;
        valor_adicional_nocturno_habil_formatted: string;
        valor_adicional_nocturno_no_habil_formatted: string;
        vigencia_formatted: string;
        estado_badge: 'success' | 'danger';
    } => {
        const formatCurrency = (value: number) =>
            new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: 'ARS',
                minimumFractionDigits: 2
            }).format(value);

        const formatDate = (dateString: string) =>
            new Date(dateString).toLocaleDateString('es-AR');

        const vigenciaText = tarifa.vigencia_hasta
            ? `${formatDate(tarifa.vigencia_desde)} - ${formatDate(tarifa.vigencia_hasta)}`
            : `Desde ${formatDate(tarifa.vigencia_desde)}`;

        return {
            ...tarifa,
            valor_guardia_pasiva_formatted: formatCurrency(tarifa.valor_guardia_pasiva),
            valor_hora_activa_formatted: formatCurrency(tarifa.valor_hora_activa),
            valor_adicional_nocturno_habil_formatted: formatCurrency(tarifa.valor_adicional_nocturno_habil),
            valor_adicional_nocturno_no_habil_formatted: formatCurrency(tarifa.valor_adicional_nocturno_no_habil),
            vigencia_formatted: vigenciaText,
            estado_badge: tarifa.estado === 'activo' ? 'success' : 'danger'
        };
    },

    /**
     * ✅ Obtener tarifa por defecto para formularios - CORREGIDA
     */
    getTarifaDefecto: (): TarifaCreacion => ({
        nombre: '',
        valor_guardia_pasiva: 0,
        valor_hora_activa: 0,
        valor_adicional_nocturno_habil: 0,
        valor_adicional_nocturno_no_habil: 0,
        vigencia_desde: new Date().toISOString().split('T')[0],
        vigencia_hasta: null,
        estado: 'activo',
        observaciones: ''
    }),

    /**
     * Verificar si una tarifa está vigente en una fecha específica
     */
    esTarifaVigente: (tarifa: Tarifa, fecha: string): boolean => {
        const fechaConsulta = new Date(fecha);
        const vigenciaDesde = new Date(tarifa.vigencia_desde);
        const vigenciaHasta = tarifa.vigencia_hasta ? new Date(tarifa.vigencia_hasta) : null;

        return fechaConsulta >= vigenciaDesde &&
            (vigenciaHasta === null || fechaConsulta <= vigenciaHasta) &&
            tarifa.estado === 'activo';
    },

    /**
     * Calcular totales estimados para una simulación rápida
     */
    calcularTotalEstimado: (
        tarifa: Tarifa,
        tipoGuardia: 'pasiva' | 'activa' | 'ambas',
        horas: number,
        esFinSemana: boolean = false
    ): number => {
        let total = 0;

        if (tipoGuardia === 'pasiva' || tipoGuardia === 'ambas') {
            total += tarifa.valor_guardia_pasiva;
        }

        if (tipoGuardia === 'activa' || tipoGuardia === 'ambas') {
            let valorHora = tarifa.valor_hora_activa;
            if (esFinSemana) {
                valorHora *= 1.5; // Factor fin de semana
            }
            total += valorHora * horas;
        }

        return Math.round(total * 100) / 100;
    },

    /**
     * ✨ NUEVA: Preparar datos para el simulador del frontend
     */
    prepararParametrosSimulacion: (
        fecha: string,
        horaInicio: string,
        horaFin: string,
        tipoGuardia: 'pasiva' | 'activa' | 'ambas',
        idTarifa?: number
    ): ParametrosSimulacion => {
        return {
            fecha,
            hora_inicio: horaInicio,
            hora_fin: horaFin,
            tipo_guardia: tipoGuardia,
            ...(idTarifa && { id_tarifa: idTarifa })
        };
    },

    /**
     * ✨ NUEVA: Obtener resumen de resultados de simulación
     */
    extraerResumenSimulacion: (resultado: ResultadoSimulacion) => {
        return {
            total: resultado.calculos.total,
            guardia_pasiva: resultado.calculos.guardia_pasiva,
            guardia_activa: resultado.calculos.guardia_activa,
            adicional_nocturno: resultado.calculos.adicional_nocturno,
            duracion_horas: resultado.parametros_calculo.duracion_horas,
            horas_nocturnas: resultado.parametros_calculo.horas_nocturnas,
            es_dia_no_laboral: resultado.parametros_calculo.es_dia_no_laboral,
            tarifa_utilizada: resultado.tarifa_utilizada.nombre
        };
    },

    /**
     * ✨ NUEVA: Comparar dos tarifas
     */
    compararTarifas: (tarifa1: Tarifa, tarifa2: Tarifa) => {
        return {
            diferencia_guardia_pasiva: tarifa2.valor_guardia_pasiva - tarifa1.valor_guardia_pasiva,
            diferencia_hora_activa: tarifa2.valor_hora_activa - tarifa1.valor_hora_activa,
            diferencia_nocturno_habil: tarifa2.valor_adicional_nocturno_habil - tarifa1.valor_adicional_nocturno_habil,
            diferencia_nocturno_no_habil: tarifa2.valor_adicional_nocturno_no_habil - tarifa1.valor_adicional_nocturno_no_habil,
            porcentaje_cambio_guardia_pasiva: ((tarifa2.valor_guardia_pasiva - tarifa1.valor_guardia_pasiva) / tarifa1.valor_guardia_pasiva) * 100,
            porcentaje_cambio_hora_activa: ((tarifa2.valor_hora_activa - tarifa1.valor_hora_activa) / tarifa1.valor_hora_activa) * 100
        };
    },

    /**
     * ✅ NUEVA: Convertir Tarifa a TarifaCreacion (para edición)
     */
    tarifaACreacion: (tarifa: Tarifa): TarifaCreacion => {
        return {
            nombre: tarifa.nombre,
            valor_guardia_pasiva: tarifa.valor_guardia_pasiva,
            valor_hora_activa: tarifa.valor_hora_activa,
            valor_adicional_nocturno_habil: tarifa.valor_adicional_nocturno_habil,
            valor_adicional_nocturno_no_habil: tarifa.valor_adicional_nocturno_no_habil,
            vigencia_desde: tarifa.vigencia_desde,
            vigencia_hasta: tarifa.vigencia_hasta,
            estado: tarifa.estado,
            observaciones: tarifa.observaciones
        };
    }
};

// Export de interfaces y servicio
export { ApiError };
export default TarifaService;