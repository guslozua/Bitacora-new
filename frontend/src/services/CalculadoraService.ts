// src/services/CalculadoraService.ts - ACTUALIZADO CON TARIFAS CORRECTAS
import { Incidente, CodigoAplicado } from '../models/Event';
import CodigoService, { Codigo } from './CodigoService';
import { esFeriado, obtenerDiaSemana, minutosEntreFechas } from '../utils/DateUtils';
import api from './api';

// ✨ ACTUALIZADO: Interfaz para tarifas con campos correctos
export interface Tarifa {
  id: number;
  nombre: string;
  valor_guardia_pasiva: number;
  valor_hora_activa: number;
  valor_adicional_nocturno_habil: number; // ✨ CAMPO CORRECTO
  valor_adicional_nocturno_no_habil: number; // ✨ CAMPO CORRECTO
  vigencia_desde: string;
  vigencia_hasta?: string | null;
  estado: string;
  observaciones?: string | null;
}

// ✨ ACTUALIZADO: Interfaz para resultados de cálculo
export interface ResultadoCalculo {
  tarifa_utilizada: Tarifa;
  fecha_calculo: string;
  desglose: {
    guardia_pasiva: number;
    guardia_activa: number;
    adicional_nocturno: number;
    total: number;
  };
  detalle: Array<{
    tipo: string;
    codigo?: string;
    descripcion?: string;
    horas?: number;
    tarifa_hora?: number;
    valor_fijo?: number; // ✨ NUEVO: Para valores fijos nocturnos
    importe: number;
    observaciones: string;
  }>;
}

// ✨ NUEVA: Interfaz para cálculo con contexto detallado
export interface ResultadoCalculoContexto {
  tarifa_utilizada: Tarifa;
  fecha_calculo: string;
  contexto_temporal: {
    fecha: string;
    dia_semana: string;
    es_feriado: boolean;
    es_fin_semana: boolean;
    es_dia_no_laboral: boolean;
  };
  analisis_horario: {
    hora_inicio: string;
    hora_fin: string;
    duracion_total_minutos: number;
    duracion_horas_facturadas: number;
    minutos_nocturnos: number;
    horas_nocturnas_facturadas: number;
    rangos_nocturnos: Array<{
      inicio: string;
      fin: string;
      minutos: number;
    }>;
  };
  codigos_aplicados: Array<{
    codigo: string;
    descripcion: string;
    tipo: string;
    aplica: boolean;
    razon: string;
    horas_aplicables?: number;
    tarifa_base?: number;
    factor_multiplicador?: number;
    importe_parcial?: number;
  }>;
  desglose_detallado: {
    guardia_pasiva: {
      aplica: boolean;
      codigo: string;
      descripcion: string;
      base_calculo: string;
      importe: number;
    };
    guardia_activa: {
      aplica: boolean;
      codigo: string;
      descripcion: string;
      horas: number;
      tarifa_hora: number;
      importe: number;
    };
    adicional_nocturno: {
      aplica: boolean;
      codigo: string;
      descripcion: string;
      horas_nocturnas: number;
      tarifa_nocturno: number;
      tipo_dia: 'habil' | 'no_habil';
      importe: number;
    };
    total: number;
  };
  observaciones: string[];
}

/**
 * Servicio para cálculos relacionados con incidentes, guardias y códigos
 * ✨ ACTUALIZADO para usar tarifas versionadas con campos correctos
 */
const CalculadoraService = {
  /**
   * ✨ ACTUALIZADA: Obtener tarifa vigente para una fecha
   */
  obtenerTarifaVigente: async (fecha: Date | string): Promise<Tarifa | null> => {
    try {
      const fechaString = fecha instanceof Date ? 
        fecha.toISOString().split('T')[0] : 
        fecha;
      
      const response = await api.get('/tarifas/vigente', {
        params: { fecha: fechaString }
      });
      
      if (response.data.success) {
        return response.data.data;
      }
      
      return null;
    } catch (error) {
      console.error('Error al obtener tarifa vigente:', error);
      return null;
    }
  },

  /**
   * ✨ ACTUALIZADA: Calcular importes usando tarifas versionadas con campos correctos
   */
  calcularImportesConTarifa: async (incidente: Incidente): Promise<ResultadoCalculo | null> => {
    try {
      const fechaIncidente = new Date(incidente.inicio);
      
      // Obtener tarifa vigente
      const tarifa = await CalculadoraService.obtenerTarifaVigente(fechaIncidente);
      
      if (!tarifa) {
        console.error('No se encontró tarifa vigente para la fecha:', fechaIncidente);
        return null;
      }
      
      // Análisis del día
      const diaSemana = fechaIncidente.getDay(); // 0=domingo, 6=sábado
      const esFinDeSemana = diaSemana === 0 || diaSemana === 6;
      const esFeriadoFlag = await esFeriado(fechaIncidente);
      const esDiaNoLaboral = esFinDeSemana || esFeriadoFlag;
      
      // Cálculo de duración
      const inicio = new Date(incidente.inicio);
      const fin = new Date(incidente.fin);
      const duracionMinutos = minutosEntreFechas(inicio, fin);
      const duracionHoras = Math.ceil(duracionMinutos / 60); // Fraccionamiento: cualquier parte de hora = 1h
      
      const resultado: ResultadoCalculo = {
        tarifa_utilizada: tarifa,
        fecha_calculo: new Date().toISOString(),
        desglose: {
          guardia_pasiva: 0,
          guardia_activa: 0,
          adicional_nocturno: 0,
          total: 0
        },
        detalle: []
      };
      
      // Procesar códigos aplicados
      if (incidente.codigos_aplicados && incidente.codigos_aplicados.length > 0) {
        for (const codigo of incidente.codigos_aplicados) {
          await CalculadoraService.procesarCodigoConTarifa(
            codigo, 
            tarifa, 
            duracionHoras, 
            duracionMinutos,
            inicio,
            fin,
            esDiaNoLaboral,
            resultado
          );
        }
      }
      
      // Calcular total
      resultado.desglose.total = 
        resultado.desglose.guardia_pasiva + 
        resultado.desglose.guardia_activa + 
        resultado.desglose.adicional_nocturno;
      
      return resultado;
    } catch (error) {
      console.error('Error al calcular importes with tarifa:', error);
      return null;
    }
  },

  /**
   * ✨ ACTUALIZADA: Procesar un código específico con tarifa (campos correctos)
   */
  procesarCodigoConTarifa: async (
    codigo: CodigoAplicado,
    tarifa: Tarifa,
    duracionHoras: number,
    duracionMinutos: number,
    inicio: Date,
    fin: Date,
    esDiaNoLaboral: boolean,
    resultado: ResultadoCalculo
  ): Promise<void> => {
    try {
      const codigoCompleto = await CodigoService.fetchCodigoById(codigo.id_codigo);
      
      if (!codigoCompleto) {
        console.warn('Código no encontrado:', codigo.id_codigo);
        return;
      }
      
      switch (codigoCompleto.tipo) {
        case 'guardia_pasiva':
          // Guardia pasiva: valor fijo según el día
          let valorGuardiaP = tarifa.valor_guardia_pasiva;
          
          // Aplicar reglas específicas de guardia pasiva
          const diaSemana = inicio.getDay();
          if (diaSemana >= 1 && diaSemana <= 5) {
            // Lun-Vie: 8h (16:00–00:00)
            valorGuardiaP = tarifa.valor_guardia_pasiva;
          } else if (diaSemana === 6) {
            // Sábado: diferentes valores según horario
            const hora = inicio.getHours();
            if (hora >= 7 && hora < 13) {
              // Sáb (07:00–13:00): 6h
              valorGuardiaP = tarifa.valor_guardia_pasiva * 0.75; // Proporcional
            } else {
              // Sáb (13:00–00:00): 11h
              valorGuardiaP = tarifa.valor_guardia_pasiva * 1.375; // Proporcional
            }
          } else if (diaSemana === 0) {
            // Dom/Feriados: 17h (07:00–00:00)
            valorGuardiaP = tarifa.valor_guardia_pasiva * 2.125; // Proporcional
          }
          
          resultado.desglose.guardia_pasiva += valorGuardiaP;
          resultado.detalle.push({
            tipo: 'Guardia Pasiva',
            codigo: codigo.codigo,
            descripcion: codigo.descripcion,
            valor_fijo: valorGuardiaP,
            importe: valorGuardiaP,
            observaciones: `Guardia pasiva - ${codigoCompleto.descripcion}`
          });
          break;
          
        case 'guardia_activa':
          // Guardia activa: se cobra por horas solo si hay incidente
          let tarifaHoraActiva = tarifa.valor_hora_activa;
          
          // Determinar si es tarifa "no laboral"
          const horaInicio = inicio.getHours();
          const esSabadoTarde = inicio.getDay() === 6 && horaInicio >= 13;
          const esDomingoOFeriado = inicio.getDay() === 0 || esDiaNoLaboral;
          
          if (esSabadoTarde || esDomingoOFeriado) {
            // Tarifa "no laboral" - podríamos usar un factor adicional
            tarifaHoraActiva *= 1.5; // Ejemplo: +50% para días no laborales
          }
          
          const importeGuardiaA = tarifaHoraActiva * duracionHoras;
          resultado.desglose.guardia_activa += importeGuardiaA;
          resultado.detalle.push({
            tipo: 'Guardia Activa',
            codigo: codigo.codigo,
            descripcion: codigo.descripcion,
            horas: duracionHoras,
            tarifa_hora: tarifaHoraActiva,
            importe: importeGuardiaA,
            observaciones: `${duracionHoras}h × ${tarifaHoraActiva.toFixed(2)} ${(esSabadoTarde || esDomingoOFeriado) ? '(tarifa no laboral)' : ''}`
          });
          break;
          
        case 'hora_nocturna':
          // ✨ ACTUALIZADO: Adicional nocturno con valores fijos (no factores)
          const minutosNocturnos = CalculadoraService.calcularMinutosNocturnos(inicio, fin);
          const horasNocturnas = Math.ceil(minutosNocturnos / 60);
          
          if (horasNocturnas > 0) {
            // ✨ USAR VALORES FIJOS en lugar de factores
            const valorNocturno = esDiaNoLaboral ? 
              tarifa.valor_adicional_nocturno_no_habil : 
              tarifa.valor_adicional_nocturno_habil;
            
            const importeNocturno = valorNocturno * horasNocturnas;
            resultado.desglose.adicional_nocturno += importeNocturno;
            resultado.detalle.push({
              tipo: 'Adicional Nocturno',
              codigo: codigo.codigo,
              descripcion: codigo.descripcion,
              horas: horasNocturnas,
              valor_fijo: valorNocturno,
              importe: importeNocturno,
              observaciones: `${horasNocturnas}h nocturnas × ${valorNocturno.toFixed(2)} ${esDiaNoLaboral ? '(no hábil)' : '(hábil)'}`
            });
          }
          break;
          
        case 'feriado':
        case 'fin_semana':
        case 'adicional':
          // Otros tipos de códigos - usar valor base con factor multiplicador
          const importeAdicional = tarifa.valor_hora_activa * duracionHoras * codigoCompleto.factor_multiplicador;
          resultado.desglose.guardia_activa += importeAdicional; // Se suma a guardia activa
          resultado.detalle.push({
            tipo: 'Adicional',
            codigo: codigo.codigo,
            descripcion: codigo.descripcion,
            horas: duracionHoras,
            tarifa_hora: tarifa.valor_hora_activa * codigoCompleto.factor_multiplicador,
            importe: importeAdicional,
            observaciones: `${duracionHoras}h × ${tarifa.valor_hora_activa.toFixed(2)} × ${codigoCompleto.factor_multiplicador} (${codigoCompleto.tipo})`
          });
          break;
      }
    } catch (error) {
      console.error('Error al procesar código con tarifa:', error);
    }
  },

  /**
   * ✨ FUNCIÓN AUXILIAR: Calcular minutos nocturnos (21:00-06:00)
   */
  calcularMinutosNocturnos: (inicio: Date, fin: Date): number => {
    let minutosNocturnos = 0;
    
    // Iterar hora por hora para verificar si está en rango nocturno
    const current = new Date(inicio);
    
    while (current < fin) {
      const hora = current.getHours();
      
      // Horario nocturno: 21:00 a 23:59 OR 00:00 a 05:59
      const esHorarioNocturno = hora >= 21 || hora <= 5;
      
      if (esHorarioNocturno) {
        const siguiente = new Date(current);
        siguiente.setHours(siguiente.getHours() + 1, 0, 0, 0);
        
        const finSegmento = siguiente < fin ? siguiente : fin;
        const minutosSegmento = Math.floor((finSegmento.getTime() - current.getTime()) / (1000 * 60));
        
        minutosNocturnos += minutosSegmento;
      }
      
      current.setHours(current.getHours() + 1, 0, 0, 0);
    }
    
    return minutosNocturnos;
  },

  /**
   * ✨ NUEVO: Calcular con contexto detallado usando endpoint backend
   */
  calcularConContextoDetallado: async (parametros: {
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    tipo_guardia: 'pasiva' | 'activa';
    id_tarifa?: number;
  }): Promise<ResultadoCalculoContexto | null> => {
    try {
      const response = await api.post('/tarifas/calcular-contexto', parametros);
      
      if (response.data.success) {
        return response.data.data;
      }
      
      return null;
    } catch (error) {
      console.error('Error en cálculo con contexto:', error);
      return null;
    }
  },

  /**
   * ✨ NUEVO: Analizar códigos aplicables
   */
  analizarCodigosAplicables: async (fecha: string, horaInicio: string, horaFin: string) => {
    try {
      const response = await api.get('/tarifas/analizar-codigos', {
        params: {
          fecha,
          hora_inicio: horaInicio,
          hora_fin: horaFin
        }
      });
      
      if (response.data.success) {
        return response.data.data;
      }
      
      return null;
    } catch (error) {
      console.error('Error al analizar códigos aplicables:', error);
      return null;
    }
  },

  /**
   * ✨ NUEVO: Obtener ejemplos pre-calculados
   */
  obtenerEjemplos: async () => {
    try {
      const response = await api.get('/tarifas/ejemplos');
      
      if (response.data.success) {
        return response.data.data;
      }
      
      return [];
    } catch (error) {
      console.error('Error al obtener ejemplos:', error);
      return [];
    }
  },

  /**
   * ✨ SIMULADOR: Calcular importes para parámetros dados
   */
  simularCalculo: async (parametros: {
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    tipo_guardia: 'pasiva' | 'activa';
    id_tarifa?: number;
  }): Promise<ResultadoCalculo | null> => {
    try {
      const response = await api.post('/tarifas/simular', parametros);
      
      if (response.data.success) {
        return response.data.data;
      }
      
      return null;
    } catch (error) {
      console.error('Error en simulador:', error);
      return null;
    }
  },

  // ===== FUNCIONES EXISTENTES MANTENIDAS =====
  
  /**
   * Calcula los códigos aplicables a un incidente según su fecha y hora
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
   * ✨ ACTUALIZADO: Calcula el importe estimado usando tarifas
   */
  calcularImporte: async (codigoAplicado: CodigoAplicado, fechaIncidente?: Date): Promise<number> => {
    try {
      // Si hay fecha del incidente, usar tarifa vigente para esa fecha
      if (fechaIncidente) {
        const tarifa = await CalculadoraService.obtenerTarifaVigente(fechaIncidente);
        
        if (tarifa) {
          // Obtener información completa del código
          const codigo = await CodigoService.fetchCodigoById(codigoAplicado.id_codigo);
          
          if (!codigo) {
            throw new Error(`Código con ID ${codigoAplicado.id_codigo} no encontrado`);
          }
          
          // Calcular importe según el tipo de código y tarifa
          let importe = 0;
          const duracionHoras = Math.ceil(codigoAplicado.minutos / 60);
          
          switch (codigo.tipo) {
            case 'guardia_pasiva':
              importe = tarifa.valor_guardia_pasiva * codigo.factor_multiplicador;
              break;
              
            case 'guardia_activa':
              importe = tarifa.valor_hora_activa * duracionHoras * codigo.factor_multiplicador;
              break;
              
            case 'hora_nocturna':
              // ✨ ACTUALIZADO: Usar valores fijos en lugar de factores
              const valorNocturno = tarifa.valor_adicional_nocturno_habil; // Simplificado, idealmente debería determinar si es hábil o no
              importe = valorNocturno * duracionHoras;
              break;
              
            case 'feriado':
            case 'fin_semana':
            case 'adicional':
              importe = tarifa.valor_hora_activa * duracionHoras * codigo.factor_multiplicador;
              break;
              
            default:
              importe = 0;
          }
          
          return Math.round(importe * 100) / 100; // Redondear a 2 decimales
        }
      }
      
      // Fallback al cálculo original si no hay tarifa
      const codigo = await CodigoService.fetchCodigoById(codigoAplicado.id_codigo);
      
      if (!codigo) {
        throw new Error(`Código con ID ${codigoAplicado.id_codigo} no encontrado`);
      }
      
      // Valor base estimado (esto debería venir de configuración)
      const valorBase = 1000; // Valor por defecto
      
      let importe = 0;
      
      switch (codigo.tipo) {
        case 'guardia_pasiva':
          importe = valorBase * codigo.factor_multiplicador;
          break;
          
        case 'guardia_activa':
          importe = (valorBase / 60) * codigoAplicado.minutos * codigo.factor_multiplicador;
          break;
          
        case 'hora_nocturna':
          importe = (valorBase / 60) * codigoAplicado.minutos * codigo.factor_multiplicador;
          break;
          
        case 'feriado':
          importe = valorBase * codigo.factor_multiplicador;
          break;
          
        case 'fin_semana':
          importe = valorBase * codigo.factor_multiplicador;
          break;
          
        case 'adicional':
          importe = (valorBase / 60) * codigoAplicado.minutos * codigo.factor_multiplicador;
          break;
          
        default:
          importe = 0;
      }
      
      return Math.round(importe * 100) / 100;
    } catch (error) {
      console.error('Error al calcular importe:', error);
      throw error;
    }
  },
  
  /**
   * Calcula la distribución de minutos en diferentes códigos para un incidente
   * con posible solapamiento de horarios
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
   * ✨ ACTUALIZADO: Genera un resumen de los códigos aplicados con cálculos de tarifa
   */
  generarResumen: async (
    incidente: Incidente,
    codigosAplicados: CodigoAplicado[]
  ): Promise<{
    totalMinutos: number;
    totalImporte: number;
    distribucionCodigos: { tipo: string; minutos: number; porcentaje: number; importe: number }[];
    calculo_con_tarifa?: ResultadoCalculo | null;
  }> => {
    // Calcular totales básicos
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
    
    // ✨ NUEVO: Calcular con tarifas versionadas
    const calculoConTarifa = await CalculadoraService.calcularImportesConTarifa(incidente);
    
    return {
      totalMinutos,
      totalImporte,
      distribucionCodigos,
      calculo_con_tarifa: calculoConTarifa
    };
  }
};

export default CalculadoraService;