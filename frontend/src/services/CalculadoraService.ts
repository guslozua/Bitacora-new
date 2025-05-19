// src/services/CalculadoraService.ts (Versión corregida)
import { Incidente, CodigoAplicado } from '../models/Event';
import CodigoService, { Codigo } from './CodigoService';
import { esFeriado, obtenerDiaSemana, minutosEntreFechas } from '../utils/DateUtils';

/**
 * Servicio para cálculos relacionados con incidentes, guardias y códigos
 */
const CalculadoraService = {
  /**
   * Calcula los códigos aplicables a un incidente según su fecha y hora
   * @param fecha Fecha del incidente (puede ser string o Date)
   * @param horaInicio Hora de inicio del incidente (formato HH:MM)
   * @param horaFin Hora de fin del incidente (formato HH:MM)
   * @returns Promise con array de códigos aplicables
   */
  calcularCodigosAplicables: async (fecha: Date | string, horaInicio: string, horaFin: string): Promise<Codigo[]> => {
    try {
      const fechaObj = fecha instanceof Date ? fecha : new Date(fecha);
      
      // Obtener todos los códigos activos
      const codigosActivos = await CodigoService.fetchCodigos({ estado: 'activo' });
      
      // Verificar si la fecha es feriado
      const esFeriadoFlag = await esFeriado(fechaObj);
      
      // Obtener día de la semana (L, M, X, J, V, S, D)
      const diaSemana = obtenerDiaSemana(fechaObj);
      
      // Filtrar códigos aplicables según día y horario
      const codigosAplicables = codigosActivos.filter((codigo: Codigo) => {
        // Verificar vigencia
        const vigenciaDesde = new Date(codigo.fecha_vigencia_desde);
        const vigenciaHasta = codigo.fecha_vigencia_hasta ? new Date(codigo.fecha_vigencia_hasta) : null;
        
        const esVigente = 
          fechaObj >= vigenciaDesde && 
          (vigenciaHasta === null || fechaObj <= vigenciaHasta);
        
        if (!esVigente) return false;
        
        // Verificar día aplicable
        const diasAplicables = codigo.dias_aplicables.split(',');
        const aplicaPorDia = 
          (esFeriadoFlag && diasAplicables.includes('F')) || 
          diasAplicables.includes(diaSemana);
        
        if (!aplicaPorDia) return false;
        
        // Verificar horario si tiene restricción
        if (codigo.hora_inicio && codigo.hora_fin) {
          // Comparar horarios como strings (formato HH:MM)
          const horaInicioEvento = horaInicio;
          const horaFinEvento = horaFin;
          
          // Hay sobreposición si:
          // 1. El inicio del evento está dentro del rango del código
          // 2. El fin del evento está dentro del rango del código
          // 3. El evento contiene completamente al rango del código
          const inicioEventoDentroRango = 
            horaInicioEvento >= codigo.hora_inicio && 
            horaInicioEvento <= codigo.hora_fin;
            
          const finEventoDentroRango = 
            horaFinEvento >= codigo.hora_inicio && 
            horaFinEvento <= codigo.hora_fin;
            
          const eventoContieneRango = 
            horaInicioEvento <= codigo.hora_inicio && 
            horaFinEvento >= codigo.hora_fin;
          
          return inicioEventoDentroRango || finEventoDentroRango || eventoContieneRango;
        }
        
        // Si el código no tiene restricción horaria, aplica
        return true;
      });
      
      return codigosAplicables;
    } catch (error) {
      console.error('Error al calcular códigos aplicables:', error);
      throw error;
    }
  },
  
  /**
   * Calcula los códigos aplicados a un incidente, con sus minutos correspondientes
   * @param incidente Incidente para el cual calcular los códigos
   * @returns Promise con array de códigos aplicados
   */
  calcularCodigosAplicados: async (incidente: Incidente): Promise<CodigoAplicado[]> => {
    try {
      const fechaIncidente = new Date(incidente.inicio);
      const horaInicio = new Date(incidente.inicio).toTimeString().substring(0, 5); // HH:MM
      const horaFin = new Date(incidente.fin).toTimeString().substring(0, 5); // HH:MM
      
      // Obtener códigos aplicables
      const codigosAplicables = await CalculadoraService.calcularCodigosAplicables(
        fechaIncidente,
        horaInicio,
        horaFin
      );
      
      // Calcular duración total del incidente en minutos
      const duracionTotal = minutosEntreFechas(new Date(incidente.inicio), new Date(incidente.fin));
      
      // Convertir a formato CodigoAplicado
      const codigosAplicados: CodigoAplicado[] = codigosAplicables.map(codigo => ({
        id_codigo: codigo.id!,
        codigo: codigo.codigo,
        descripcion: codigo.descripcion,
        minutos: duracionTotal,
        importe: null // Se calculará después si es necesario
      }));
      
      return codigosAplicados;
    } catch (error) {
      console.error('Error al calcular códigos aplicados:', error);
      throw error;
    }
  },
  
  /**
   * Calcula el importe estimado para un código aplicado
   * @param codigoAplicado Código aplicado con minutos
   * @param valorBase Valor base por minuto o por guardia
   * @returns Importe calculado
   */
  calcularImporte: async (codigoAplicado: CodigoAplicado, valorBase: number): Promise<number> => {
    try {
      // Obtener información completa del código
      const codigo = await CodigoService.fetchCodigoById(codigoAplicado.id_codigo);
      
      if (!codigo) {
        throw new Error(`Código con ID ${codigoAplicado.id_codigo} no encontrado`);
      }
      
      // Calcular importe según el tipo de código y su factor multiplicador
      let importe = 0;
      
      switch (codigo.tipo) {
        case 'guardia_pasiva':
          // Valor fijo por día de guardia pasiva
          importe = valorBase * codigo.factor_multiplicador;
          break;
          
        case 'guardia_activa':
          // Valor por minuto de guardia activa
          importe = (valorBase / 60) * codigoAplicado.minutos * codigo.factor_multiplicador;
          break;
          
        case 'hora_nocturna':
          // Adicional por minuto nocturno
          importe = (valorBase / 60) * codigoAplicado.minutos * codigo.factor_multiplicador;
          break;
          
        case 'feriado':
          // Adicional por trabajar en feriado
          importe = valorBase * codigo.factor_multiplicador;
          break;
          
        case 'fin_semana':
          // Adicional por trabajar en fin de semana
          importe = valorBase * codigo.factor_multiplicador;
          break;
          
        case 'adicional':
          // Adicional genérico
          importe = (valorBase / 60) * codigoAplicado.minutos * codigo.factor_multiplicador;
          break;
          
        default:
          importe = 0;
      }
      
      return Math.round(importe * 100) / 100; // Redondear a 2 decimales
    } catch (error) {
      console.error('Error al calcular importe:', error);
      throw error;
    }
  },
  
  /**
   * Calcula la distribución de minutos en diferentes códigos para un incidente
   * con posible solapamiento de horarios
   * @param incidente Incidente para el cual distribuir los minutos
   * @param codigosAplicados Códigos aplicados al incidente
   * @returns Códigos aplicados con minutos distribuidos
   */
  distribuirMinutos: (
    incidente: Incidente,
    codigosAplicados: CodigoAplicado[]
  ): CodigoAplicado[] => {
    // Implementación simplificada: mantener los minutos como están
    // En una implementación real, se podría hacer más complejo para distribuir
    // minutos cuando hay solapamiento de horarios entre códigos
    return codigosAplicados;
  },
  
  /**
   * Genera un resumen de los códigos aplicados a un incidente
   * @param incidente Incidente a resumir
   * @param codigosAplicados Códigos aplicados al incidente
   * @returns Objeto con resumen de códigos y totales
   */
  generarResumen: (
    incidente: Incidente,
    codigosAplicados: CodigoAplicado[]
  ): {
    totalMinutos: number;
    totalImporte: number;
    distribucionCodigos: { tipo: string; minutos: number; porcentaje: number; importe: number }[];
  } => {
    // Calcular totales
    const totalMinutos = codigosAplicados.reduce((sum, codigo) => sum + codigo.minutos, 0);
    const totalImporte = codigosAplicados.reduce(
      (sum, codigo) => sum + (codigo.importe || 0), 
      0
    );
    
    // Agrupar por tipo de código
    const distribucionPorTipo = codigosAplicados.reduce((result, codigo) => {
      const tipo = codigo.codigo?.split('-')[0] || 'OTRO';
      
      if (!result[tipo]) {
        result[tipo] = {
          tipo,
          minutos: 0,
          importe: 0
        };
      }
      
      result[tipo].minutos += codigo.minutos;
      result[tipo].importe += codigo.importe || 0;
      
      return result;
    }, {} as Record<string, { tipo: string; minutos: number; importe: number }>);
    
    // Convertir a array y calcular porcentajes
    const distribucionCodigos = Object.values(distribucionPorTipo).map(item => ({
      ...item,
      porcentaje: totalMinutos > 0 ? (item.minutos / totalMinutos) * 100 : 0
    }));
    
    return {
      totalMinutos,
      totalImporte,
      distribucionCodigos
    };
  }
};

export default CalculadoraService;