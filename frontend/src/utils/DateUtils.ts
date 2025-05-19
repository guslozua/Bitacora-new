// src/utils/DateUtils.ts
import axios from 'axios';

/**
 * Obtiene la letra del día de la semana para una fecha
 * @param fecha Fecha
 * @returns L, M, X, J, V, S o D
 */
export const obtenerDiaSemana = (fecha: Date): string => {
  const diasSemana = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  return diasSemana[fecha.getDay()];
};

/**
 * Verifica si una fecha es feriado
 * @param fecha Fecha a verificar
 * @returns true si es feriado, false si no
 */
export const esFeriado = async (fecha: Date): Promise<boolean> => {
  try {
    // Formatear fecha como YYYY-MM-DD
    const fechaStr = fecha.toISOString().split('T')[0];
    
    // Consultar a la API de eventos si hay feriados en esa fecha
    const response = await axios.get(`/api/eventos`, {
      params: {
        type: 'holiday',
        date: fechaStr,
        allDay: true
      }
    });
    
    // Si hay al menos un evento de tipo 'holiday' en esa fecha, es feriado
    return response.data.data.length > 0;
  } catch (error) {
    console.error('Error al verificar si la fecha es feriado:', error);
    // En caso de error, asumir que no es feriado
    return false;
  }
};

/**
 * Calcula la diferencia en minutos entre dos fechas
 * @param inicio Fecha de inicio
 * @param fin Fecha de fin
 * @returns Cantidad de minutos
 */
export const minutosEntreFechas = (inicio: Date, fin: Date): number => {
  // Diferencia en milisegundos
  const diffMs = fin.getTime() - inicio.getTime();
  // Convertir a minutos
  return Math.floor(diffMs / (1000 * 60));
};

/**
 * Formatea una hora en formato HH:MM a partir de una fecha
 * @param fecha Fecha a formatear
 * @returns Hora en formato HH:MM
 */
export const formatearHora = (fecha: Date): string => {
  return fecha.toTimeString().substring(0, 5); // HH:MM
};

/**
 * Formatea una fecha como YYYY-MM-DD
 * @param fecha Fecha a formatear
 * @returns Fecha en formato YYYY-MM-DD
 */
export const formatearFecha = (fecha: Date): string => {
  return fecha.toISOString().split('T')[0]; // YYYY-MM-DD
};

/**
 * Obtiene el número de horas entre dos fechas
 * @param inicio Fecha de inicio
 * @param fin Fecha de fin
 * @returns Número de horas (con decimales)
 */
export const horasEntreFechas = (inicio: Date, fin: Date): number => {
  return minutosEntreFechas(inicio, fin) / 60;
};

/**
 * Formatea minutos como "HH:MM" (ejemplo: 90 minutos se convierte en "1:30")
 * @param minutos Cantidad de minutos
 * @returns String en formato "HH:MM"
 */
export const formatearMinutosComoHoras = (minutos: number): string => {
  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;
  return `${horas}:${minutosRestantes.toString().padStart(2, '0')}`;
};

/**
 * Combina una fecha y una hora en un objeto Date
 * @param fecha Fecha (puede ser string YYYY-MM-DD o Date)
 * @param hora Hora en formato HH:MM
 * @returns Objeto Date con la fecha y hora combinadas
 */
export const combinarFechaHora = (fecha: Date | string, hora: string): Date => {
  const fechaBase = fecha instanceof Date ? fecha : new Date(fecha);
  const [horas, minutos] = hora.split(':').map(Number);
  
  const resultado = new Date(fechaBase);
  resultado.setHours(horas, minutos, 0, 0);
  
  return resultado;
};

/**
 * Verifica si dos rangos de tiempo se solapan
 * @param inicio1 Inicio del primer rango
 * @param fin1 Fin del primer rango
 * @param inicio2 Inicio del segundo rango
 * @param fin2 Fin del segundo rango
 * @returns true si hay solapamiento, false si no
 */
export const haySolapamiento = (
  inicio1: Date, 
  fin1: Date, 
  inicio2: Date, 
  fin2: Date
): boolean => {
  return (
    (inicio1 < fin2 && fin1 > inicio2) || // Solapamiento parcial
    (inicio1 >= inicio2 && fin1 <= fin2) || // Rango 1 dentro de rango 2
    (inicio2 >= inicio1 && fin2 <= fin1) // Rango 2 dentro de rango 1
  );
};

/**
 * Formatea una fecha con formato personalizado
 * @param fecha Fecha a formatear
 * @param formato Formato deseado (ej: "dd/MM/yyyy")
 * @returns Fecha formateada según el formato especificado
 */
export const formatearFechaPersonalizado = (fecha: Date | string, formato: string): string => {
  const date = fecha instanceof Date ? fecha : new Date(fecha);
  
  // Lista de tokens de formato soportados
  const tokens: { [key: string]: () => string } = {
    'yyyy': () => date.getFullYear().toString(),
    'MM': () => (date.getMonth() + 1).toString().padStart(2, '0'),
    'dd': () => date.getDate().toString().padStart(2, '0'),
    'HH': () => date.getHours().toString().padStart(2, '0'),
    'mm': () => date.getMinutes().toString().padStart(2, '0'),
    'ss': () => date.getSeconds().toString().padStart(2, '0')
  };
  
  // Reemplazar tokens en el formato
  let resultado = formato;
  
  for (const [token, fn] of Object.entries(tokens)) {
    resultado = resultado.replace(token, fn());
  }
  
  return resultado;
};

/**
 * Verifica si una fecha está dentro de un rango
 * @param fecha Fecha a verificar
 * @param inicio Fecha de inicio del rango
 * @param fin Fecha de fin del rango
 * @returns true si la fecha está dentro del rango, false si no
 */
export const estaEnRango = (fecha: Date, inicio: Date, fin: Date): boolean => {
  return fecha >= inicio && fecha <= fin;
};

/**
 * Ajusta una fecha al inicio del día (00:00:00)
 * @param fecha Fecha a ajustar
 * @returns Nueva fecha ajustada al inicio del día
 */
export const inicioDelDia = (fecha: Date): Date => {
  const resultado = new Date(fecha);
  resultado.setHours(0, 0, 0, 0);
  return resultado;
};

/**
 * Ajusta una fecha al fin del día (23:59:59.999)
 * @param fecha Fecha a ajustar
 * @returns Nueva fecha ajustada al fin del día
 */
export const finDelDia = (fecha: Date): Date => {
  const resultado = new Date(fecha);
  resultado.setHours(23, 59, 59, 999);
  return resultado;
};

/**
 * Obtiene el nombre del mes en español
 * @param mes Número de mes (0-11)
 * @returns Nombre del mes en español
 */
export const obtenerNombreMes = (mes: number): string => {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  return meses[mes];
};

/**
 * Obtiene el nombre del día de la semana en español
 * @param dia Número de día de la semana (0-6, donde 0 es domingo)
 * @returns Nombre del día en español
 */
export const obtenerNombreDia = (dia: number): string => {
  const dias = [
    'Domingo', 'Lunes', 'Martes', 'Miércoles',
    'Jueves', 'Viernes', 'Sábado'
  ];
  
  return dias[dia];
};

/**
 * Agrega días a una fecha
 * @param fecha Fecha base
 * @param dias Cantidad de días a agregar (puede ser negativo)
 * @returns Nueva fecha con los días agregados
 */
export const agregarDias = (fecha: Date, dias: number): Date => {
  const resultado = new Date(fecha);
  resultado.setDate(resultado.getDate() + dias);
  return resultado;
};

/**
 * Obtiene el primer día del mes
 * @param fecha Fecha base
 * @returns Nueva fecha correspondiente al primer día del mes
 */
export const primerDiaMes = (fecha: Date): Date => {
  const resultado = new Date(fecha);
  resultado.setDate(1);
  return resultado;
};

/**
 * Obtiene el último día del mes
 * @param fecha Fecha base
 * @returns Nueva fecha correspondiente al último día del mes
 */
export const ultimoDiaMes = (fecha: Date): Date => {
  const resultado = new Date(fecha);
  resultado.setMonth(resultado.getMonth() + 1);
  resultado.setDate(0);
  return resultado;
};

/**
 * Verifica si dos fechas son el mismo día
 * @param fecha1 Primera fecha
 * @param fecha2 Segunda fecha
 * @returns true si son el mismo día, false si no
 */
export const esMismoDia = (fecha1: Date, fecha2: Date): boolean => {
  return (
    fecha1.getFullYear() === fecha2.getFullYear() &&
    fecha1.getMonth() === fecha2.getMonth() &&
    fecha1.getDate() === fecha2.getDate()
  );
};

/**
 * Obtiene la diferencia en días entre dos fechas
 * @param inicio Fecha de inicio
 * @param fin Fecha de fin
 * @returns Número de días de diferencia
 */
export const diasEntreFechas = (inicio: Date, fin: Date): number => {
  // Convertir a días completos (ignorando las horas)
  const inicioSinHora = inicioDelDia(inicio);
  const finSinHora = inicioDelDia(fin);
  
  // Diferencia en milisegundos
  const diffMs = finSinHora.getTime() - inicioSinHora.getTime();
  // Convertir a días
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
};