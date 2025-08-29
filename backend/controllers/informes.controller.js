// controllers/informes.controller.js
const Incidente = require('../models/incidente.model');
const Guardia = require('../models/guardia.model');
const Codigo = require('../models/codigo.model');
const LiquidacionGuardia = require('../models/liquidacion.model');
const LiquidacionDetalle = require('../models/liquidacion-detalle.model');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit-table');
const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');
const { Op } = require('../models/db.operators');
const pool = require('../config/db');

// Generar informe de incidentes con filtros
exports.getInformeIncidentes = async (req, res) => {
    try {
        const {
            desde, hasta, usuario, estado, codigo,
            orderBy = 'inicio', orderDir = 'desc'
        } = req.query;

        // Construir filtros
        let filtros = {};

        // Aplicar filtros de fecha
        if (desde || hasta) {
            if (desde) {
                filtros.inicio = { ...filtros.inicio, [Op.gte]: new Date(desde) };
            }
            if (hasta) {
                filtros.fin = { ...filtros.fin, [Op.lte]: new Date(hasta) };
            }
        }

        // Aplicar filtro de estado
        if (estado) {
            filtros.estado = estado;
        }

        // Aplicar filtro de usuario
        let usuarioFiltro = null;
        if (usuario) {
            usuarioFiltro = { [Op.like]: `%${usuario}%` };
        }

        // Aplicar filtro de código
        let codigoFiltro = null;
        if (codigo) {
            codigoFiltro = { [Op.like]: `%${codigo}%` };
        }

        // Obtener incidentes
        const incidentes = await Incidente.findAll({
            where: filtros,
            usuario_guardia: usuarioFiltro,
            codigo_facturacion: codigoFiltro,
            order: [[orderBy, orderDir]]
        });

        // Procesar datos para el informe
        const datosInforme = await procesarDatosInformeIncidentes(incidentes);

        // Devolver respuesta
        res.status(200).json({
            success: true,
            data: {
                incidentes: datosInforme.incidentes,
                estadisticas: datosInforme.estadisticas
            }
        });
    } catch (error) {
        console.error('Error al generar informe de incidentes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar informe de incidentes',
            error: error.message
        });
    }
};

// Generar informe de guardias con filtros
exports.getInformeGuardias = async (req, res) => {
    try {
        const {
            desde, hasta, usuario, conIncidentes,
            orderBy = 'fecha', orderDir = 'desc'
        } = req.query;

        // Construir opciones de filtro
        const options = { where: {} };

        // Aplicar filtros
        if (desde || hasta) {
            options.where.fecha = {};

            if (desde) {
                options.where.fecha[Op.gte] = new Date(desde);
            }

            if (hasta) {
                options.where.fecha[Op.lte] = new Date(hasta);
            }
        }

        if (usuario) {
            options.where.usuario = { [Op.like]: `%${usuario}%` };
        }

        // Aplicar ordenamiento
        options.order = [[orderBy, orderDir]];

        // Obtener guardias
        const guardias = await Guardia.findAll(options);

        // Si se solicita filtrar guardias con incidentes
        if (conIncidentes === 'true' && guardias.length > 0) {
            // Obtener IDs de guardias
            const guardiaIds = guardias.map(guardia => guardia.id);

            // Buscar incidentes para estas guardias
            const incidentesPorGuardia = await Incidente.findAll({
                where: {
                    id_guardia: { [Op.in]: guardiaIds }
                }
            });

            // Agrupar por id_guardia
            const incidentesAgrupados = incidentesPorGuardia.reduce((acum, incidente) => {
                if (!acum[incidente.id_guardia]) {
                    acum[incidente.id_guardia] = [];
                }
                acum[incidente.id_guardia].push(incidente);
                return acum;
            }, {});

            // Filtrar guardias que tienen incidentes
            const guardiasConIncidentes = guardias.filter(guardia =>
                incidentesAgrupados[guardia.id] && incidentesAgrupados[guardia.id].length > 0
            );

            // Procesar datos para el informe
            const datosInforme = await procesarDatosInformeGuardias(guardiasConIncidentes);

            // Devolver respuesta
            res.status(200).json({
                success: true,
                data: {
                    guardias: datosInforme.guardias,
                    estadisticas: datosInforme.estadisticas
                }
            });
        } else {
            // Procesar datos para el informe sin filtrar por incidentes
            const datosInforme = await procesarDatosInformeGuardias(guardias);

            // Devolver respuesta
            res.status(200).json({
                success: true,
                data: {
                    guardias: datosInforme.guardias,
                    estadisticas: datosInforme.estadisticas
                }
            });
        }
    } catch (error) {
        console.error('Error al generar informe de guardias:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar informe de guardias',
            error: error.message
        });
    }
};

// Generar informe de liquidaciones con filtros - VERSIÓN CORREGIDA
exports.getInformeLiquidaciones = async (req, res) => {
    try {
        console.log('🔍 LIQUIDACIONES: Iniciando getInformeLiquidaciones');
        const {
            periodo, usuario, estado,
            orderBy = 'fecha_generacion', orderDir = 'desc'
        } = req.query;
        console.log('🔍 LIQUIDACIONES: Parámetros recibidos:', { periodo, usuario, estado, orderBy, orderDir });

        // Construir consulta SQL directa para liquidaciones
        let query = `
            SELECT l.*
            FROM taskmanagementsystem.liquidaciones_guardia l
        `;
        
        const params = [];
        const conditions = [];

        // Aplicar filtros
        if (periodo) {
            conditions.push('l.periodo = ?');
            params.push(periodo);
        }

        if (estado) {
            conditions.push('l.estado = ?');
            params.push(estado);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        // Aplicar ordenamiento
        query += ` ORDER BY l.${orderBy} ${orderDir}`;
        
        console.log('🔍 LIQUIDACIONES: Ejecutando consulta SQL:', query);
        console.log('🔍 LIQUIDACIONES: Parámetros:', params);

        const [liquidaciones] = await pool.query(query, params);
        console.log('✅ LIQUIDACIONES: Liquidaciones encontradas:', liquidaciones.length);

        // Para cada liquidación, obtener sus detalles
        console.log('🔍 LIQUIDACIONES: Obteniendo detalles de liquidaciones...');
        const liquidacionesConDetalles = [];
        
        for (const liquidacion of liquidaciones) {
            // Consulta SQL directa para obtener detalles
            const [detalles] = await pool.query(`
                SELECT 
                    ld.id,
                    ld.id_incidente,
                    ld.id_guardia,
                    ld.usuario,
                    ld.fecha,
                    ld.total_minutos,
                    ld.total_importe
                FROM taskmanagementsystem.liquidaciones_detalle ld
                WHERE ld.id_liquidacion = ?
                ORDER BY ld.fecha ASC
            `, [liquidacion.id]);
            
            liquidacionesConDetalles.push({
                ...liquidacion,
                detalles: detalles
            });
        }
        
        console.log('✅ LIQUIDACIONES: Detalles obtenidos para', liquidacionesConDetalles.length, 'liquidaciones');

        // Filtrar por usuario si se especifica (hacerlo después de obtener detalles)
        let liquidacionesFiltradas = liquidacionesConDetalles;

        if (usuario && liquidacionesFiltradas.length > 0) {
            console.log('🔍 LIQUIDACIONES: Filtrando por usuario:', usuario);
            liquidacionesFiltradas = liquidacionesFiltradas.filter(liq => {
                return liq.detalles && liq.detalles.some(detalle =>
                    detalle.usuario.toLowerCase().includes(usuario.toLowerCase())
                );
            });
            console.log('✅ LIQUIDACIONES: Después del filtro por usuario:', liquidacionesFiltradas.length);
        }

        // Procesar datos para el informe usando función directa
        console.log('🔍 LIQUIDACIONES: Procesando datos para informe...');
        const datosInforme = procesarDatosInformeLiquidacionesDirecto(liquidacionesFiltradas);
        console.log('✅ LIQUIDACIONES: Datos procesados exitosamente');

        // Devolver respuesta
        res.status(200).json({
            success: true,
            data: {
                liquidaciones: datosInforme.liquidaciones,
                estadisticas: datosInforme.estadisticas
            }
        });
    } catch (error) {
        console.error('❌ LIQUIDACIONES: Error al generar informe de liquidaciones:', error);
        console.error('❌ LIQUIDACIONES: Stack trace:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Error al generar informe de liquidaciones',
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Generar informe resumen de actividad - VERSIÓN CORREGIDA
exports.getInformeResumen = async (req, res) => {
    try {
        console.log('🔍 INFORMES: Iniciando getInformeResumen');
        const { periodo } = req.query;
        console.log('🔍 INFORMES: Periodo recibido:', periodo);

        // Obtener fecha de inicio y fin basada en el periodo
        const { fechaInicio, fechaFin } = calcularRangoPeriodo(periodo);
        console.log('🔍 INFORMES: Rango calculado:', {
            fechaInicio: fechaInicio.toISOString(),
            fechaFin: fechaFin.toISOString()
        });

        // Obtener guardias en el periodo usando consulta SQL directa
        console.log('🔍 INFORMES: Consultando guardias...');
        const [guardias] = await pool.query(
            'SELECT * FROM taskmanagementsystem.guardias WHERE fecha BETWEEN ? AND ? ORDER BY fecha ASC',
            [
                fechaInicio.toISOString().split('T')[0], 
                fechaFin.toISOString().split('T')[0]
            ]
        );
        console.log('✅ INFORMES: Guardias encontradas:', guardias.length);

        // Obtener incidentes en el periodo usando consulta SQL directa
        console.log('🔍 INFORMES: Consultando incidentes...');
        const [incidentes] = await pool.query(
            'SELECT * FROM taskmanagementsystem.incidentes_guardia WHERE inicio BETWEEN ? AND ? ORDER BY inicio ASC',
            [
                fechaInicio.toISOString(),
                fechaFin.toISOString()
            ]
        );
        console.log('✅ INFORMES: Incidentes encontrados:', incidentes.length);

        // Conteo de guardias por usuario
        console.log('🔍 INFORMES: Procesando guardias por usuario...');
        const guardiasPorUsuario = guardias.reduce((result, guardia) => {
            if (!result[guardia.usuario]) {
                result[guardia.usuario] = 0;
            }
            result[guardia.usuario]++;
            return result;
        }, {});
        console.log('✅ INFORMES: Guardias por usuario:', guardiasPorUsuario);

        // Conteos de incidentes por estado
        console.log('🔍 INFORMES: Procesando incidentes por estado...');
        const incidentesPorEstado = incidentes.reduce((result, incidente) => {
            if (!result[incidente.estado]) {
                result[incidente.estado] = 0;
            }
            result[incidente.estado]++;
            return result;
        }, {});
        console.log('✅ INFORMES: Incidentes por estado:', incidentesPorEstado);

        // Estadísticas generales
        const datosResumen = {
            periodo: {
                nombre: periodo || 'Periodo actual',
                fechaInicio: fechaInicio.toISOString(),
                fechaFin: fechaFin.toISOString()
            },
            totalGuardias: guardias.length,
            totalIncidentes: incidentes.length,
            guardiasPorUsuario: Object.entries(guardiasPorUsuario).map(([usuario, cantidad]) => ({
                usuario,
                cantidad
            })).sort((a, b) => b.cantidad - a.cantidad),
            incidentesPorEstado: Object.entries(incidentesPorEstado).map(([estado, cantidad]) => ({
                estado,
                cantidad
            }))
        };

        // Estadísticas de tiempo (si hay incidentes)
        if (incidentes.length > 0) {
            console.log('🔍 INFORMES: Calculando estadísticas de tiempo...');
            try {
                // Calcular tiempo total de incidentes en minutos
                const tiempoTotalMinutos = incidentes.reduce((total, incidente) => {
                    const inicio = new Date(incidente.inicio);
                    const fin = new Date(incidente.fin);
                    
                    // Validar fechas
                    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
                        console.warn('⚠️ INFORMES: Fecha inválida en incidente:', incidente.id);
                        return total;
                    }
                    
                    const duracionMinutos = Math.floor((fin - inicio) / (1000 * 60));
                    return total + Math.max(0, duracionMinutos); // Evitar duraciones negativas
                }, 0);

                // Calcular promedio de duración de incidentes
                const promedioDuracionMinutos = Math.round(tiempoTotalMinutos / incidentes.length);

                // Añadir estadísticas de tiempo
                datosResumen.estadisticasTiempo = {
                    tiempoTotalMinutos,
                    tiempoTotalHoras: (tiempoTotalMinutos / 60).toFixed(2),
                    promedioDuracionMinutos,
                    promedioDuracionHoras: (promedioDuracionMinutos / 60).toFixed(2)
                };
                
                console.log('✅ INFORMES: Estadísticas de tiempo calculadas:', datosResumen.estadisticasTiempo);
            } catch (timeError) {
                console.error('❌ INFORMES: Error calculando estadísticas de tiempo:', timeError);
                // Continuar sin estadísticas de tiempo
            }
        }

        console.log('✅ INFORMES: Datos finales del resumen:', {
            totalGuardias: datosResumen.totalGuardias,
            totalIncidentes: datosResumen.totalIncidentes,
            usuariosUnicos: datosResumen.guardiasPorUsuario.length,
            estadosUnicos: datosResumen.incidentesPorEstado.length
        });

        // Devolver respuesta
        res.status(200).json({
            success: true,
            data: datosResumen
        });

    } catch (error) {
        console.error('❌ INFORMES: Error al generar informe resumen:', error);
        console.error('❌ INFORMES: Stack trace:', error.stack);
        
        res.status(500).json({
            success: false,
            message: 'Error al generar informe resumen',
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Exportar informe de incidentes en diferentes formatos
exports.exportarInformeIncidentes = async (req, res) => {
    try {
        const { formato } = req.params;
        const {
            desde, hasta, usuario, estado, codigo
        } = req.query;

        // Validar formato
        const formatosValidos = ['excel', 'pdf', 'csv'];
        if (!formatosValidos.includes(formato)) {
            return res.status(400).json({
                success: false,
                message: `Formato no válido. Formatos permitidos: ${formatosValidos.join(', ')}`
            });
        }

        // Construir filtros
        let filtros = {};

        // Aplicar filtros de fecha
        if (desde || hasta) {
            if (desde) {
                filtros.inicio = { ...filtros.inicio, [Op.gte]: new Date(desde) };
            }
            if (hasta) {
                filtros.fin = { ...filtros.fin, [Op.lte]: new Date(hasta) };
            }
        }

        // Aplicar filtro de estado
        if (estado) {
            filtros.estado = estado;
        }

        // Aplicar filtro de usuario
        let usuarioFiltro = null;
        if (usuario) {
            usuarioFiltro = { [Op.like]: `%${usuario}%` };
        }

        // Aplicar filtro de código
        let codigoFiltro = null;
        if (codigo) {
            codigoFiltro = { [Op.like]: `%${codigo}%` };
        }

        // Obtener incidentes
        const incidentes = await Incidente.findAll({
            where: filtros,
            usuario_guardia: usuarioFiltro,
            codigo_facturacion: codigoFiltro
        });

        // Procesar datos para el informe
        const datosInforme = await procesarDatosInformeIncidentes(incidentes);

        // Generar nombre de archivo
        const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
        const filename = `informe_incidentes_${timestamp}`;

        // Directorio temporal para archivos generados
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Exportar según formato solicitado
        let filePath;
        let contentType;

        switch (formato) {
            case 'excel':
                filePath = await exportarExcelIncidentes(datosInforme, tempDir, filename);
                contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                break;

            case 'pdf':
                filePath = await exportarPdfIncidentes(datosInforme, tempDir, filename);
                contentType = 'application/pdf';
                break;

            case 'csv':
                filePath = await exportarCsvIncidentes(datosInforme, tempDir, filename);
                contentType = 'text/csv';
                break;
        }

        // Enviar archivo al cliente
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename=${filename}.${formato}`);

        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

        // Eliminar archivo temporal después de enviarlo
        fileStream.on('end', () => {
            fs.unlinkSync(filePath);
        });
    } catch (error) {
        console.error(`Error al exportar informe de incidentes como ${req.params.formato}:`, error);
        res.status(500).json({
            success: false,
            message: 'Error al exportar informe de incidentes',
            error: error.message
        });
    }
};

// Exportar informe de guardias en diferentes formatos
exports.exportarInformeGuardias = async (req, res) => {
    try {
        const { formato } = req.params;
        const {
            desde, hasta, usuario, conIncidentes
        } = req.query;

        // Validar formato
        const formatosValidos = ['excel', 'pdf', 'csv'];
        if (!formatosValidos.includes(formato)) {
            return res.status(400).json({
                success: false,
                message: `Formato no válido. Formatos permitidos: ${formatosValidos.join(', ')}`
            });
        }

        // Construir opciones de filtro (igual que en getInformeGuardias)
        const options = { where: {} };

        // Aplicar filtros
        if (desde || hasta) {
            options.where.fecha = {};

            if (desde) {
                options.where.fecha[Op.gte] = new Date(desde);
            }

            if (hasta) {
                options.where.fecha[Op.lte] = new Date(hasta);
            }
        }

        if (usuario) {
            options.where.usuario = { [Op.like]: `%${usuario}%` };
        }

        // Obtener guardias
        const guardias = await Guardia.findAll(options);

        // Si se solicita filtrar guardias con incidentes
        let guardiasParaInforme = guardias;

        if (conIncidentes === 'true' && guardias.length > 0) {
            // Obtener IDs de guardias
            const guardiaIds = guardias.map(guardia => guardia.id);

            // Buscar incidentes para estas guardias
            const incidentesPorGuardia = await Incidente.findAll({
                where: {
                    id_guardia: { [Op.in]: guardiaIds }
                }
            });

            // Agrupar por id_guardia
            const incidentesAgrupados = incidentesPorGuardia.reduce((acum, incidente) => {
                if (!acum[incidente.id_guardia]) {
                    acum[incidente.id_guardia] = [];
                }
                acum[incidente.id_guardia].push(incidente);
                return acum;
            }, {});

            // Filtrar guardias que tienen incidentes
            guardiasParaInforme = guardias.filter(guardia =>
                incidentesAgrupados[guardia.id] && incidentesAgrupados[guardia.id].length > 0
            );
        }

        // Procesar datos para el informe
        const datosInforme = await procesarDatosInformeGuardias(guardiasParaInforme);

        // Generar nombre de archivo
        const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
        const filename = `informe_guardias_${timestamp}`;

        // Directorio temporal para archivos generados
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Exportar según formato solicitado
        let filePath;
        let contentType;

        switch (formato) {
            case 'excel':
                filePath = await exportarExcelGuardias(datosInforme, tempDir, filename);
                contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                break;

            case 'pdf':
                filePath = await exportarPdfGuardias(datosInforme, tempDir, filename);
                contentType = 'application/pdf';
                break;

            case 'csv':
                filePath = await exportarCsvGuardias(datosInforme, tempDir, filename);
                contentType = 'text/csv';
                break;
        }

        // Enviar archivo al cliente
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename=${filename}.${formato}`);

        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

        // Eliminar archivo temporal después de enviarlo
        fileStream.on('end', () => {
            fs.unlinkSync(filePath);
        });
    } catch (error) {
        console.error(`Error al exportar informe de guardias como ${req.params.formato}:`, error);
        res.status(500).json({
            success: false,
            message: 'Error al exportar informe de guardias',
            error: error.message
        });
    }
};

// Exportar informe de liquidaciones en diferentes formatos
exports.exportarInformeLiquidaciones = async (req, res) => {
    try {
        const { formato } = req.params;
        const {
            periodo, usuario, estado
        } = req.query;

        // Validar formato
        const formatosValidos = ['excel', 'pdf', 'csv'];
        if (!formatosValidos.includes(formato)) {
            return res.status(400).json({
                success: false,
                message: `Formato no válido. Formatos permitidos: ${formatosValidos.join(', ')}`
            });
        }

        // Construir opciones de filtro (igual que en getInformeLiquidaciones)
        const options = { where: {} };

        // Aplicar filtros
        if (periodo) {
            options.where.periodo = periodo;
        }

        if (estado) {
            options.where.estado = estado;
        }

        // Obtener liquidaciones
        const liquidaciones = await LiquidacionGuardia.findAll(options);

        // Obtener detalles de liquidaciones si hay resultados
        let liquidacionesFiltradas = [];

        if (liquidaciones.length > 0) {
            const liquidacionIds = liquidaciones.map(liq => liq.id);

            let detallesOptions = {
                where: {
                    id_liquidacion: { [Op.in]: liquidacionIds }
                }
            };

            // Filtrar por usuario si se especifica
            if (usuario) {
                detallesOptions.where.usuario = { [Op.like]: `%${usuario}%` };
            }

            const detalles = await LiquidacionDetalle.findAll(detallesOptions);

            // Agrupar detalles por liquidación
            const detallesPorLiquidacion = detalles.reduce((result, detalle) => {
                if (!result[detalle.id_liquidacion]) {
                    result[detalle.id_liquidacion] = [];
                }
                result[detalle.id_liquidacion].push(detalle);
                return result;
            }, {});

            // Enriquecer liquidaciones con sus detalles
            const liquidacionesConDetalles = liquidaciones.map(liquidacion => {
                return {
                    ...liquidacion,
                    detalles: detallesPorLiquidacion[liquidacion.id] || []
                };
            });

            // Filtrar liquidaciones si se especificó un usuario
            liquidacionesFiltradas = usuario
                ? liquidacionesConDetalles.filter(liq => liq.detalles.length > 0)
                : liquidacionesConDetalles;
        }

        // Procesar datos para el informe
        const datosInforme = procesarDatosInformeLiquidaciones(liquidacionesFiltradas);

        // Generar nombre de archivo
        const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
        const filename = `informe_liquidaciones_${timestamp}`;

        // Directorio temporal para archivos generados
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Exportar según formato solicitado
        let filePath;
        let contentType;

        switch (formato) {
            case 'excel':
                filePath = await exportarExcelLiquidaciones(datosInforme, tempDir, filename);
                contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                break;

            case 'pdf':
                filePath = await exportarPdfLiquidaciones(datosInforme, tempDir, filename);
                contentType = 'application/pdf';
                break;

            case 'csv':
                filePath = await exportarCsvLiquidaciones(datosInforme, tempDir, filename);
                contentType = 'text/csv';
                break;
        }

        // Enviar archivo al cliente
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename=${filename}.${formato}`);

        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

        // Eliminar archivo temporal después de enviarlo
        fileStream.on('end', () => {
            fs.unlinkSync(filePath);
        });
    } catch (error) {
        console.error(`Error al exportar informe de liquidaciones como ${req.params.formato}:`, error);
        res.status(500).json({
            success: false,
            message: 'Error al exportar informe de liquidaciones',
            error: error.message
        });
    }
};

// FUNCIONES AUXILIARES

// Función para normalizar fechas (Date object -> string YYYY-MM-DD)
function normalizarFecha(fecha) {
    if (fecha instanceof Date) {
        return fecha.toISOString().split('T')[0];
    }
    
    if (typeof fecha === 'string') {
        return fecha.split('T')[0].split(' ')[0];
    }
    
    if (!fecha) {
        return new Date().toISOString().split('T')[0];
    }
    
    return fecha.toString().split('T')[0];
}

// Función para obtener feriados de la tabla eventos
async function obtenerFeriados(fechaInicio = null, fechaFin = null) {
    try {
        let query = `
      SELECT DATE(start) as fecha_feriado, title as nombre_feriado
      FROM eventos 
      WHERE type = 'holiday'
    `;

        const params = [];

        // Si se proporcionan fechas, filtrar por rango
        if (fechaInicio && fechaFin) {
            // CORRECCIÓN: Usar DATE() para comparar solo fechas
            query += ' AND DATE(start) BETWEEN DATE(?) AND DATE(?)';
            params.push(fechaInicio, fechaFin);
        }

        query += ' ORDER BY start ASC';

        const [feriados] = await pool.query(query, params);

        // Convertir a formato de fecha string para facilitar comparaciones
        const feriadosMap = {};
        feriados.forEach(feriado => {
            // CORRECCIÓN: Asegurar formato correcto de fecha
            const fechaStr = new Date(feriado.fecha_feriado).toISOString().split('T')[0];
            feriadosMap[fechaStr] = feriado.nombre_feriado;
        });

        console.log('🏖️ Feriados obtenidos:', Object.keys(feriadosMap).length);
        return feriadosMap;
    } catch (error) {
        console.error('Error al obtener feriados:', error);
        return {};
    }
}

// Función helper para determinar tipo de día
function determinarTipoDia(fecha, feriadosMap) {
    // CORRECCIÓN: Normalizar la fecha antes de procesarla
    const fechaStr = normalizarFecha(fecha);
    
    // Crear date object de forma consistente
    const [year, month, day] = fechaStr.split('-').map(Number);
    const fechaObj = new Date(year, month - 1, day);

    // Primero verificar si es feriado
    if (feriadosMap[fechaStr]) {
        return { tipo: 'feriado', nombre: feriadosMap[fechaStr] };
    }

    // Luego verificar si es fin de semana (0 = domingo, 6 = sábado)
    const diaSemana = fechaObj.getDay();
    if (diaSemana === 0 || diaSemana === 6) {
        return { tipo: 'fin_semana', nombre: null };
    }

    // Es día hábil
    return { tipo: 'habil', nombre: null };
}

// Función helper para obtener nombre del día en español
function obtenerDiaSemana(fecha) {
    // CORRECCIÓN: Normalizar la fecha antes de procesarla
    const fechaStr = normalizarFecha(fecha);
    
    const [year, month, day] = fechaStr.split('-').map(Number);
    const fechaObj = new Date(year, month - 1, day);
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return dias[fechaObj.getDay()];
}

// Procesar datos para informe de incidentes
async function procesarDatosInformeIncidentes(incidentes) {
    // Transformar datos para el informe
    const incidentesProcesados = incidentes.map(incidente => {
        // Calcular duración en minutos usando duracion_minutos generado o calculándolo
        const duracionMinutos = incidente.duracion_minutos || (() => {
            const inicio = new Date(incidente.inicio);
            const fin = new Date(incidente.fin);
            return Math.floor((fin - inicio) / (1000 * 60));
        })();

        // Extraer códigos aplicados si existen
        const codigosAplicados = incidente.codigos_aplicados || [];

        // Total de minutos por códigos
        const totalMinutos = codigosAplicados.reduce((sum, c) => sum + c.minutos, 0);

        // Total de importe si está disponible
        const totalImporte = codigosAplicados.reduce((sum, c) => sum + (c.importe || 0), 0);

        return {
            id: incidente.id,
            fechaGuardia: incidente.fecha_guardia || '',
            usuarioGuardia: incidente.usuario_guardia || '',
            inicio: format(new Date(incidente.inicio), 'yyyy-MM-dd HH:mm:ss'),
            fin: format(new Date(incidente.fin), 'yyyy-MM-dd HH:mm:ss'),
            duracionMinutos,
            descripcion: incidente.descripcion,
            estado: incidente.estado,
            observaciones: incidente.observaciones || '',
            codigos: codigosAplicados,
            totalMinutos,
            totalImporte
        };
    });

    // Calcular estadísticas
    const estadisticas = calcularEstadisticasIncidentes(incidentesProcesados);

    return {
        incidentes: incidentesProcesados,
        estadisticas
    };
}

// Procesar datos para informe de guardias
async function procesarDatosInformeGuardias(guardias) {
    // Obtener rango de fechas de las guardias para optimizar consulta de feriados
    let fechaMinima = null;
    let fechaMaxima = null;

    if (guardias.length > 0) {
        // CORRECCIÓN: Normalizar fechas antes de ordenar
        const fechas = guardias.map(g => normalizarFecha(g.fecha));
        fechas.sort(); // Ordenar fechas
        fechaMinima = fechas[0]; // Primera fecha
        fechaMaxima = fechas[fechas.length - 1]; // Última fecha
    }

    // Obtener feriados del período
    const feriadosMap = await obtenerFeriados(fechaMinima, fechaMaxima);
    console.log('🗓️ Procesando', guardias.length, 'guardias con', Object.keys(feriadosMap).length, 'feriados');

    // Transformar datos para el informe
    const guardiasProcesadas = guardias.map(guardia => {
        // CORRECCIÓN: Normalizar fecha antes de procesar
        const fechaNormalizada = normalizarFecha(guardia.fecha);
        const tipoDia = determinarTipoDia(fechaNormalizada, feriadosMap);
        const diaSemana = obtenerDiaSemana(fechaNormalizada);

        return {
            id: guardia.id,
            fecha: fechaNormalizada, // Usar fecha normalizada
            usuario: guardia.usuario,
            diaSemana: diaSemana,
            esFeriado: tipoDia.tipo === 'feriado',
            esFinSemana: tipoDia.tipo === 'fin_semana',
            nombreFeriado: tipoDia.nombre,
            notas: guardia.notas || '',
            fechaCreacion: guardia.createdAt
        };
    });

    // Calcular estadísticas corregidas
    const estadisticas = await calcularEstadisticasGuardias(guardiasProcesadas);

    return {
        guardias: guardiasProcesadas,
        estadisticas
    };
}

// Procesar datos para informe de liquidaciones
function procesarDatosInformeLiquidaciones(liquidaciones) {
    // Transformar datos para el informe
    const liquidacionesProcesadas = liquidaciones.map(liquidacion => {
        // Calcular totales por liquidación
        const totalImporte = liquidacion.detalles.reduce((sum, detalle) => sum + (parseFloat(detalle.total_importe) || 0), 0);
        const totalMinutos = liquidacion.detalles.reduce((sum, detalle) => sum + (detalle.total_minutos || 0), 0);

        return {
            id: liquidacion.id,
            periodo: liquidacion.periodo,
            fechaGeneracion: format(new Date(liquidacion.fecha_generacion), 'yyyy-MM-dd HH:mm:ss'),
            fechaPago: liquidacion.fecha_pago ? format(new Date(liquidacion.fecha_pago), 'yyyy-MM-dd') : '',
            estado: liquidacion.estado,
            observaciones: liquidacion.observaciones || '',
            detalles: liquidacion.detalles.map(detalle => ({
                id: detalle.id,
                id_incidente: detalle.id_incidente,
                id_guardia: detalle.id_guardia,
                usuario: detalle.usuario,
                fecha: format(new Date(detalle.fecha), 'yyyy-MM-dd'),
                total_minutos: detalle.total_minutos,
                total_importe: detalle.total_importe
            })),
            totalImporte,
            totalMinutos
        };
    });

    // Calcular estadísticas
    const estadisticas = calcularEstadisticasLiquidaciones(liquidacionesProcesadas);

    return {
        liquidaciones: liquidacionesProcesadas,
        estadisticas
    };
}

// Calcular estadísticas para incidentes
function calcularEstadisticasIncidentes(incidentes) {
    // Total de incidentes
    const totalIncidentes = incidentes.length;

    // Total de minutos e importe
    const totalMinutos = incidentes.reduce((sum, inc) => sum + inc.duracionMinutos, 0);
    const totalImporte = incidentes.reduce((sum, inc) => sum + inc.totalImporte, 0);

    // Distribución por estado
    const porEstado = incidentes.reduce((result, inc) => {
        if (!result[inc.estado]) {
            result[inc.estado] = 0;
        }
        result[inc.estado]++;
        return result;
    }, {});

    // Distribución por usuario
    const porUsuario = incidentes.reduce((result, inc) => {
        if (!result[inc.usuarioGuardia]) {
            result[inc.usuarioGuardia] = 0;
        }
        result[inc.usuarioGuardia]++;
        return result;
    }, {});

    // Duración promedio
    const duracionPromedio = totalIncidentes > 0 ? Math.round(totalMinutos / totalIncidentes) : 0;

    return {
        totalIncidentes,
        totalMinutos,
        totalImporte,
        duracionPromedio,
        porEstado,    // ← Mantener como objeto, no array
        porUsuario    // ← Mantener como objeto, no array
    };
}

// REEMPLAZA ESTA FUNCIÓN COMPLETA (desde "function calcularEstadisticasGuardias" hasta el "}")

async function calcularEstadisticasGuardias(guardias) {
    // Total de guardias
    const totalGuardias = guardias.length;

    // Distribución por usuario
    const porUsuario = guardias.reduce((result, guardia) => {
        if (!result[guardia.usuario]) {
            result[guardia.usuario] = 0;
        }
        result[guardia.usuario]++;
        return result;
    }, {});

    // CORRECCIÓN: Contar correctamente feriados y fin de semana
    let guardiasEnFeriados = 0;
    let guardiasEnFinDeSemana = 0;
    const porDiaSemana = {};

    guardias.forEach(guardia => {
        // CORRECCIÓN: Usar fecha ya normalizada
        const fechaNormalizada = normalizarFecha(guardia.fecha);
        const [year, month, day] = fechaNormalizada.split('-').map(Number);
        const fechaObj = new Date(year, month - 1, day);
        const diaSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][fechaObj.getDay()];

        // Contar por día de semana
        if (!porDiaSemana[diaSemana]) {
            porDiaSemana[diaSemana] = 0;
        }
        porDiaSemana[diaSemana]++;

        // CORRECCIÓN: Contar feriados y fin de semana correctamente
        if (guardia.esFeriado) {
            guardiasEnFeriados++;
        } else if (guardia.esFinSemana) { // else if para evitar doble conteo
            guardiasEnFinDeSemana++;
        }
    });

    // 🎯 NUEVA FUNCIONALIDAD: Calcular guardias con y sin incidentes
    let guardiasConIncidentes = 0;
    let guardiasSinIncidentes = 0;

    if (guardias.length > 0) {
        try {
            // Obtener IDs de todas las guardias
            const guardiaIds = guardias.map(g => g.id).filter(id => id);
            
            if (guardiaIds.length > 0) {
                // Consulta para obtener guardias que tienen incidentes
                const query = `
                    SELECT DISTINCT g.id
                    FROM guardias g
                    INNER JOIN incidentes_guardia i ON g.id = i.id_guardia
                    WHERE g.id IN (${guardiaIds.map(() => '?').join(',')})
                `;
                
                const [guardiasConIncidentesResult] = await pool.execute(query, guardiaIds);
                
                guardiasConIncidentes = guardiasConIncidentesResult.length;
                guardiasSinIncidentes = totalGuardias - guardiasConIncidentes;
                
                console.log('📊 Estadísticas de incidentes calculadas:', {
                    total: totalGuardias,
                    conIncidentes: guardiasConIncidentes,
                    sinIncidentes: guardiasSinIncidentes
                });
            }
        } catch (error) {
            console.error('Error al calcular estadísticas de incidentes:', error);
            // Valores por defecto en caso de error
            guardiasConIncidentes = 0;
            guardiasSinIncidentes = totalGuardias;
        }
    }

    console.log('📊 Estadísticas calculadas:', {
        total: totalGuardias,
        feriados: guardiasEnFeriados,
        finSemana: guardiasEnFinDeSemana,
        conIncidentes: guardiasConIncidentes,
        sinIncidentes: guardiasSinIncidentes
    });

    return {
        totalGuardias,
        porUsuario,          // ← Mantener como objeto  
        porDiaSemana,        // ← Para el día de semana (aunque no lo uses en frontend)
        guardiasEnFeriados,  // ← CORREGIDO
        guardiasEnFinDeSemana, // ← CORREGIDO
        conIncidentes: guardiasConIncidentes,     // ← NUEVO
        sinIncidentes: guardiasSinIncidentes      // ← NUEVO
    };
}


// Calcular estadísticas para liquidaciones
function calcularEstadisticasLiquidaciones(liquidaciones) {
    // Total de liquidaciones
    const totalLiquidaciones = liquidaciones.length;

    // Total de importe
    const totalImporte = liquidaciones.reduce((sum, liq) => sum + liq.totalImporte, 0);

    // Distribución por estado
    const porEstado = liquidaciones.reduce((result, liq) => {
        if (!result[liq.estado]) {
            result[liq.estado] = 0;
        }
        result[liq.estado]++;
        return result;
    }, {});

    // Distribución por usuarios
    const usuariosSet = new Set();
    liquidaciones.forEach(liq => {
        liq.detalles.forEach(detalle => {
            usuariosSet.add(detalle.usuario);
        });
    });

    return {
        totalLiquidaciones,
        totalImporte,
        totalUsuarios: usuariosSet.size,
        porEstado: Object.entries(porEstado).map(([estado, cantidad]) => ({ estado, cantidad }))
    };
}

// Calcular rango de fechas para un período
function calcularRangoPeriodo(periodo) {
    let fechaInicio, fechaFin;

    // Formato esperado: YYYY-MM (año-mes)
    if (periodo && /^\d{4}-\d{2}$/.test(periodo)) {
        const [anio, mes] = periodo.split('-').map(Number);

        // Primer día del mes
        fechaInicio = new Date(anio, mes - 1, 1);

        // Último día del mes
        fechaFin = new Date(anio, mes, 0);
        fechaFin.setHours(23, 59, 59, 999);
    } else {
        // Si no se especifica un período válido, usar el mes actual
        const ahora = new Date();
        fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        fechaFin = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0);
        fechaFin.setHours(23, 59, 59, 999);
    }

    return { fechaInicio, fechaFin };
}

// Exportar a Excel - Incidentes
async function exportarExcelIncidentes(datos, tempDir, filename) {
    const filePath = path.join(tempDir, `${filename}.xlsx`);
    const workbook = new ExcelJS.Workbook();

    // Crear hoja para incidentes
    const incidentesSheet = workbook.addWorksheet('Incidentes');

    // Definir columnas
    incidentesSheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Fecha Guardia', key: 'fechaGuardia', width: 15 },
        { header: 'Usuario', key: 'usuarioGuardia', width: 20 },
        { header: 'Inicio', key: 'inicio', width: 20 },
        { header: 'Fin', key: 'fin', width: 20 },
        { header: 'Duración (min)', key: 'duracionMinutos', width: 15 },
        { header: 'Descripción', key: 'descripcion', width: 40 },
        { header: 'Estado', key: 'estado', width: 15 },
        { header: 'Total Minutos', key: 'totalMinutos', width: 15 },
        { header: 'Total Importe', key: 'totalImporte', width: 15 }
    ];

    // Agregar datos
    incidentesSheet.addRows(datos.incidentes);

    // Crear hoja para estadísticas
    const estadisticasSheet = workbook.addWorksheet('Estadísticas');

    // Agregar estadísticas generales
    estadisticasSheet.addRow(['Estadísticas de Incidentes']);
    estadisticasSheet.addRow(['']);
    estadisticasSheet.addRow(['Total de Incidentes', datos.estadisticas.totalIncidentes]);
    estadisticasSheet.addRow(['Total de Minutos', datos.estadisticas.totalMinutos]);
    estadisticasSheet.addRow(['Total de Importe', datos.estadisticas.totalImporte]);
    estadisticasSheet.addRow(['Duración Promedio (min)', datos.estadisticas.duracionPromedio]);

    // Agregar distribución por estado
    estadisticasSheet.addRow(['']);
    estadisticasSheet.addRow(['Distribución por Estado']);
    estadisticasSheet.addRow(['Estado', 'Cantidad']);
    datos.estadisticas.porEstado.forEach(item => {
        estadisticasSheet.addRow([item.estado, item.cantidad]);
    });

    // Agregar distribución por usuario
    estadisticasSheet.addRow(['']);
    estadisticasSheet.addRow(['Distribución por Usuario']);
    estadisticasSheet.addRow(['Usuario', 'Cantidad']);
    datos.estadisticas.porUsuario.forEach(item => {
        estadisticasSheet.addRow([item.usuario, item.cantidad]);
    });

    // Guardar archivo
    await workbook.xlsx.writeFile(filePath);

    return filePath;
}

// Exportar a Excel - Guardias
async function exportarExcelGuardias(datos, tempDir, filename) {
    const filePath = path.join(tempDir, `${filename}.xlsx`);
    const workbook = new ExcelJS.Workbook();

    // Crear hoja para guardias
    const guardiasSheet = workbook.addWorksheet('Guardias');

    // Definir columnas
    guardiasSheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Fecha', key: 'fecha', width: 15 },
        { header: 'Usuario', key: 'usuario', width: 20 },
        { header: 'Día Semana', key: 'diaSemana', width: 15 }, // AGREGADO
        { header: 'Tipo Día', key: 'tipoDia', width: 15 }, // AGREGADO
        { header: 'Observaciones', key: 'notas', width: 40 } // CORREGIDO
    ];

    // CORRECCIÓN: Agregar datos procesados correctamente
    const filas = datos.guardias.map(guardia => ({
        id: guardia.id,
        fecha: guardia.fecha,
        usuario: guardia.usuario,
        diaSemana: guardia.diaSemana,
        tipoDia: guardia.esFeriado ? 'Feriado' : 
                guardia.esFinSemana ? 'Fin de Semana' : 'Día Hábil',
        notas: guardia.notas || ''
    }));

    guardiasSheet.addRows(filas);

    // Crear hoja para estadísticas
    const estadisticasSheet = workbook.addWorksheet('Estadísticas');

    // Agregar estadísticas generales
    estadisticasSheet.addRow(['Estadísticas de Guardias']);
    estadisticasSheet.addRow(['']);
    estadisticasSheet.addRow(['Total de Guardias', datos.estadisticas.totalGuardias]);
    estadisticasSheet.addRow(['Guardias en Feriados', datos.estadisticas.guardiasEnFeriados]);
    estadisticasSheet.addRow(['Guardias en Fin de Semana', datos.estadisticas.guardiasEnFinDeSemana]);

    // Agregar distribución por usuario
    estadisticasSheet.addRow(['']);
    estadisticasSheet.addRow(['Distribución por Usuario']);
    estadisticasSheet.addRow(['Usuario', 'Cantidad']);
    Object.entries(datos.estadisticas.porUsuario).forEach(([usuario, cantidad]) => {
        estadisticasSheet.addRow([usuario, cantidad]);
    });

    // Agregar distribución por día de semana
    estadisticasSheet.addRow(['']);
    estadisticasSheet.addRow(['Distribución por Día de Semana']);
    estadisticasSheet.addRow(['Día', 'Cantidad']);
    Object.entries(datos.estadisticas.porDiaSemana).forEach(([dia, cantidad]) => {
        estadisticasSheet.addRow([dia, cantidad]);
    });

    // Guardar archivo
    await workbook.xlsx.writeFile(filePath);
    return filePath;
}

// Exportar a Excel - Liquidaciones
async function exportarExcelLiquidaciones(datos, tempDir, filename) {
    const filePath = path.join(tempDir, `${filename}.xlsx`);
    const workbook = new ExcelJS.Workbook();

    // Crear hoja para liquidaciones
    const liquidacionesSheet = workbook.addWorksheet('Liquidaciones');

    // Definir columnas
    liquidacionesSheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Periodo', key: 'periodo', width: 15 },
        { header: 'Fecha Generación', key: 'fechaGeneracion', width: 20 },
        { header: 'Fecha Pago', key: 'fechaPago', width: 15 },
        { header: 'Estado', key: 'estado', width: 15 },
        { header: 'Total Minutos', key: 'totalMinutos', width: 15 },
        { header: 'Total Importe', key: 'totalImporte', width: 15 },
        { header: 'Observaciones', key: 'observaciones', width: 40 }
    ];

    // Agregar datos
    liquidacionesSheet.addRows(datos.liquidaciones);

    // Crear hoja para detalles
    const detallesSheet = workbook.addWorksheet('Detalles');

    // Definir columnas para detalles
    detallesSheet.columns = [
        { header: 'ID Liquidación', key: 'idLiquidacion', width: 15 },
        { header: 'ID Detalle', key: 'id', width: 10 },
        { header: 'Usuario', key: 'usuario', width: 20 },
        { header: 'Fecha', key: 'fecha', width: 15 },
        { header: 'Total Minutos', key: 'total_minutos', width: 15 },
        { header: 'Total Importe', key: 'total_importe', width: 15 }
    ];

    // Agregar datos de detalles
    datos.liquidaciones.forEach(liquidacion => {
        liquidacion.detalles.forEach(detalle => {
            detallesSheet.addRow({
                idLiquidacion: liquidacion.id,
                id: detalle.id,
                usuario: detalle.usuario,
                fecha: detalle.fecha,
                total_minutos: detalle.total_minutos,
                total_importe: detalle.total_importe
            });
        });
    });

    // Crear hoja para estadísticas
    const estadisticasSheet = workbook.addWorksheet('Estadísticas');

    // Agregar estadísticas generales
    estadisticasSheet.addRow(['Estadísticas de Liquidaciones']);
    estadisticasSheet.addRow(['']);
    estadisticasSheet.addRow(['Total de Liquidaciones', datos.estadisticas.totalLiquidaciones]);
    estadisticasSheet.addRow(['Total de Importe', datos.estadisticas.totalImporte]);
    estadisticasSheet.addRow(['Total de Usuarios', datos.estadisticas.totalUsuarios]);

    // Agregar distribución por estado
    estadisticasSheet.addRow(['']);
    estadisticasSheet.addRow(['Distribución por Estado']);
    estadisticasSheet.addRow(['Estado', 'Cantidad']);
    datos.estadisticas.porEstado.forEach(item => {
        estadisticasSheet.addRow([item.estado, item.cantidad]);
    });

    // Guardar archivo
    await workbook.xlsx.writeFile(filePath);

    return filePath;
}

// Exportar a PDF - Incidentes
async function exportarPdfIncidentes(datos, tempDir, filename) {
    const filePath = path.join(tempDir, `${filename}.pdf`);
    const pdfDoc = new PDFDocument({
        margin: 30,
        size: 'A4',
        bufferPages: true
    });

    // Stream para escribir el PDF
    const stream = fs.createWriteStream(filePath);
    pdfDoc.pipe(stream);

    // Título
    pdfDoc.fontSize(18).text('Informe de Incidentes', { align: 'center' });
    pdfDoc.moveDown();

    // Fecha de generación
    pdfDoc.fontSize(10).text(`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`, { align: 'right' });
    pdfDoc.moveDown();

    // Estadísticas generales
    pdfDoc.fontSize(14).text('Estadísticas Generales');
    pdfDoc.moveDown(0.5);

    pdfDoc.fontSize(10).text(`Total de Incidentes: ${datos.estadisticas.totalIncidentes}`);
    pdfDoc.text(`Total de Minutos: ${datos.estadisticas.totalMinutos}`);
    pdfDoc.text(`Total de Importe: ${datos.estadisticas.totalImporte.toFixed(2)}`);
    pdfDoc.text(`Duración Promedio: ${datos.estadisticas.duracionPromedio} minutos`);
    pdfDoc.moveDown();

    // Tabla de distribución por estado
    if (datos.estadisticas.porEstado.length > 0) {
        pdfDoc.fontSize(12).text('Distribución por Estado');
        pdfDoc.moveDown(0.5);

        const tablaPorEstado = {
            headers: ['Estado', 'Cantidad'],
            rows: datos.estadisticas.porEstado.map(item => [item.estado, item.cantidad.toString()])
        };

        await pdfDoc.table(tablaPorEstado, {
            prepareHeader: () => pdfDoc.font('Helvetica-Bold').fontSize(10),
            prepareRow: () => pdfDoc.font('Helvetica').fontSize(10),
            width: 300
        });

        pdfDoc.moveDown();
    }

    // Tabla de incidentes
    pdfDoc.addPage();
    pdfDoc.fontSize(14).text('Listado de Incidentes');
    pdfDoc.moveDown();

    const tablaIncidentes = {
        headers: ['ID', 'Usuario', 'Inicio', 'Fin', 'Duración', 'Estado'],
        rows: datos.incidentes.map(inc => [
            inc.id.toString(),
            inc.usuarioGuardia,
            format(new Date(inc.inicio), 'dd/MM/yyyy HH:mm'),
            format(new Date(inc.fin), 'dd/MM/yyyy HH:mm'),
            `${inc.duracionMinutos} min`,
            inc.estado
        ])
    };

    await pdfDoc.table(tablaIncidentes, {
        prepareHeader: () => pdfDoc.font('Helvetica-Bold').fontSize(8),
        prepareRow: () => pdfDoc.font('Helvetica').fontSize(8),
        width: 500
    });

    // Finalizar documento
    pdfDoc.end();

    // Esperar a que termine de escribir
    return new Promise((resolve, reject) => {
        stream.on('finish', () => resolve(filePath));
        stream.on('error', reject);
    });
}

// Exportar a PDF - Guardias
async function exportarPdfGuardias(datos, tempDir, filename) {
    const filePath = path.join(tempDir, `${filename}.pdf`);
    const pdfDoc = new PDFDocument({
        margin: 30,
        size: 'A4',
        bufferPages: true
    });

    // Stream para escribir el PDF
    const stream = fs.createWriteStream(filePath);
    pdfDoc.pipe(stream);

    // Título
    pdfDoc.fontSize(18).text('Informe de Guardias', { align: 'center' });
    pdfDoc.moveDown();

    // Fecha de generación
    pdfDoc.fontSize(10).text(`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`, { align: 'right' });
    pdfDoc.moveDown();

    // Estadísticas generales
    pdfDoc.fontSize(14).text('Estadísticas Generales');
    pdfDoc.moveDown(0.5);

    pdfDoc.fontSize(10).text(`Total de Guardias: ${datos.estadisticas.totalGuardias}`);
    pdfDoc.moveDown();

    // Tabla de distribución por estado
    if (datos.estadisticas.porEstado.length > 0) {
        pdfDoc.fontSize(12).text('Distribución por Estado');
        pdfDoc.moveDown(0.5);

        const tablaPorEstado = {
            headers: ['Estado', 'Cantidad'],
            rows: datos.estadisticas.porEstado.map(item => [item.estado, item.cantidad.toString()])
        };

        await pdfDoc.table(tablaPorEstado, {
            prepareHeader: () => pdfDoc.font('Helvetica-Bold').fontSize(10),
            prepareRow: () => pdfDoc.font('Helvetica').fontSize(10),
            width: 300
        });

        pdfDoc.moveDown();
    }

    // Tabla de distribución por usuario
    if (datos.estadisticas.porUsuario.length > 0) {
        pdfDoc.fontSize(12).text('Distribución por Usuario');
        pdfDoc.moveDown(0.5);

        const tablaPorUsuario = {
            headers: ['Usuario', 'Cantidad'],
            rows: datos.estadisticas.porUsuario.map(item => [item.usuario, item.cantidad.toString()])
        };

        await pdfDoc.table(tablaPorUsuario, {
            prepareHeader: () => pdfDoc.font('Helvetica-Bold').fontSize(10),
            prepareRow: () => pdfDoc.font('Helvetica').fontSize(10),
            width: 300
        });

        pdfDoc.moveDown();
    }

    // Tabla de guardias
    pdfDoc.addPage();
    pdfDoc.fontSize(14).text('Listado de Guardias');
    pdfDoc.moveDown();

    const tablaGuardias = {
        headers: ['ID', 'Fecha', 'Usuario', 'Estado'],
        rows: datos.guardias.map(guardia => [
            guardia.id.toString(),
            format(new Date(guardia.fecha), 'dd/MM/yyyy'),
            guardia.usuario,
            guardia.estado
        ])
    };

    await pdfDoc.table(tablaGuardias, {
        prepareHeader: () => pdfDoc.font('Helvetica-Bold').fontSize(9),
        prepareRow: () => pdfDoc.font('Helvetica').fontSize(9),
        width: 500
    });

    // Finalizar documento
    pdfDoc.end();

    // Esperar a que termine de escribir
    return new Promise((resolve, reject) => {
        stream.on('finish', () => resolve(filePath));
        stream.on('error', reject);
    });
}

// Exportar a PDF - Liquidaciones
async function exportarPdfLiquidaciones(datos, tempDir, filename) {
    const filePath = path.join(tempDir, `${filename}.pdf`);
    const pdfDoc = new PDFDocument({
        margin: 30,
        size: 'A4',
        bufferPages: true
    });

    // Stream para escribir el PDF
    const stream = fs.createWriteStream(filePath);
    pdfDoc.pipe(stream);

    // Título
    pdfDoc.fontSize(18).text('Informe de Liquidaciones', { align: 'center' });
    pdfDoc.moveDown();

    // Fecha de generación
    pdfDoc.fontSize(10).text(`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`, { align: 'right' });
    pdfDoc.moveDown();

    // Estadísticas generales
    pdfDoc.fontSize(14).text('Estadísticas Generales');
    pdfDoc.moveDown(0.5);

    pdfDoc.fontSize(10).text(`Total de Liquidaciones: ${datos.estadisticas.totalLiquidaciones}`);
    pdfDoc.text(`Total de Importe: ${datos.estadisticas.totalImporte.toFixed(2)}`);
    pdfDoc.text(`Total de Usuarios: ${datos.estadisticas.totalUsuarios}`);
    pdfDoc.moveDown();

    // Tabla de distribución por estado
    if (datos.estadisticas.porEstado.length > 0) {
        pdfDoc.fontSize(12).text('Distribución por Estado');
        pdfDoc.moveDown(0.5);

        const tablaPorEstado = {
            headers: ['Estado', 'Cantidad'],
            rows: datos.estadisticas.porEstado.map(item => [item.estado, item.cantidad.toString()])
        };

        await pdfDoc.table(tablaPorEstado, {
            prepareHeader: () => pdfDoc.font('Helvetica-Bold').fontSize(10),
            prepareRow: () => pdfDoc.font('Helvetica').fontSize(10),
            width: 300
        });

        pdfDoc.moveDown();
    }

    // Tabla de liquidaciones
    pdfDoc.addPage();
    pdfDoc.fontSize(14).text('Listado de Liquidaciones');
    pdfDoc.moveDown();

    const tablaLiquidaciones = {
        headers: ['ID', 'Periodo', 'Generación', 'Estado', 'Importe'],
        rows: datos.liquidaciones.map(liq => [
            liq.id.toString(),
            liq.periodo,
            format(new Date(liq.fechaGeneracion), 'dd/MM/yyyy'),
            liq.estado,
            liq.totalImporte.toFixed(2)
        ])
    };

    await pdfDoc.table(tablaLiquidaciones, {
        prepareHeader: () => pdfDoc.font('Helvetica-Bold').fontSize(9),
        prepareRow: () => pdfDoc.font('Helvetica').fontSize(9),
        width: 500
    });

    // Para cada liquidación, mostrar sus detalles
    if (datos.liquidaciones.length > 0) {
        // Tabla detallada para cada liquidación
        for (const liquidacion of datos.liquidaciones) {
            if (liquidacion.detalles.length > 0) {
                pdfDoc.addPage();
                pdfDoc.fontSize(12).text(`Detalles de Liquidación #${liquidacion.id} - ${liquidacion.periodo}`);
                pdfDoc.moveDown();

                const tablaDetalles = {
                    headers: ['Usuario', 'Fecha', 'Minutos', 'Importe'],
                    rows: liquidacion.detalles.map(detalle => [
                        detalle.usuario,
                        detalle.fecha,
                        detalle.total_minutos.toString(),
                        detalle.total_importe.toFixed(2)
                    ])
                };

                await pdfDoc.table(tablaDetalles, {
                    prepareHeader: () => pdfDoc.font('Helvetica-Bold').fontSize(9),
                    prepareRow: () => pdfDoc.font('Helvetica').fontSize(9),
                    width: 400
                });
            }
        }
    }

    // Finalizar documento
    pdfDoc.end();

    // Esperar a que termine de escribir
    return new Promise((resolve, reject) => {
        stream.on('finish', () => resolve(filePath));
        stream.on('error', reject);
    });
}

// Exportar a CSV - Incidentes
async function exportarCsvIncidentes(datos, tempDir, filename) {
    const filePath = path.join(tempDir, `${filename}.csv`);

    // Preparar encabezados
    const headers = [
        'ID', 'Fecha Guardia', 'Usuario', 'Inicio', 'Fin',
        'Duración (min)', 'Descripción', 'Estado', 'Total Minutos', 'Total Importe'
    ].join(',');

    // Preparar filas
    const rows = datos.incidentes.map(inc => [
        inc.id,
        inc.fechaGuardia,
        `"${inc.usuarioGuardia.replace(/"/g, '""')}"`,
        inc.inicio,
        inc.fin,
        inc.duracionMinutos,
        `"${inc.descripcion.replace(/"/g, '""')}"`,
        `"${inc.estado.replace(/"/g, '""')}"`,
        inc.totalMinutos,
        inc.totalImporte
    ].join(','));

    // Combinar todo
    const csvContent = [headers, ...rows].join('\n');

    // Escribir a archivo
    fs.writeFileSync(filePath, csvContent);

    return filePath;
}

// Exportar a CSV - Guardias
async function exportarCsvGuardias(datos, tempDir, filename) {
    const filePath = path.join(tempDir, `${filename}.csv`);

    // Preparar encabezados
    const headers = [
        'ID', 'Fecha', 'Usuario', 'Estado', 'Hora Inicio', 'Hora Fin', 'Observaciones'
    ].join(',');

    // Preparar filas
    const rows = datos.guardias.map(guardia => [
        guardia.id,
        guardia.fecha,
        `"${guardia.usuario.replace(/"/g, '""')}"`,
        `"${guardia.estado.replace(/"/g, '""')}"`,
        guardia.horaInicio,
        guardia.horaFin,
        `"${(guardia.observaciones || '').replace(/"/g, '""')}"`
    ].join(','));

    // Combinar todo
    const csvContent = [headers, ...rows].join('\n');

    // Escribir a archivo
    fs.writeFileSync(filePath, csvContent);

    return filePath;
}

// Exportar a CSV - Liquidaciones
async function exportarCsvLiquidaciones(datos, tempDir, filename) {
    const filePath = path.join(tempDir, `${filename}.csv`);

    // Preparar encabezados
    const headers = [
        'ID', 'Periodo', 'Fecha Generación', 'Fecha Pago', 'Estado',
        'Total Minutos', 'Total Importe', 'Observaciones'
    ].join(',');

    // Preparar filas
    const rows = datos.liquidaciones.map(liq => [
        liq.id,
        liq.periodo,
        liq.fechaGeneracion,
        liq.fechaPago,
        `"${liq.estado.replace(/"/g, '""')}"`,
        liq.totalMinutos,
        liq.totalImporte,
        `"${(liq.observaciones || '').replace(/"/g, '""')}"`
    ].join(','));

    // Combinar todo
    const csvContent = [headers, ...rows].join('\n');

    // Escribir a archivo
    fs.writeFileSync(filePath, csvContent);

    // Si hay detalles, crear un segundo archivo CSV
    if (datos.liquidaciones.some(liq => liq.detalles.length > 0)) {
        const detallesFilePath = path.join(tempDir, `${filename}_detalles.csv`);

        // Preparar encabezados
        const detallesHeaders = [
            'ID Liquidación', 'ID Detalle', 'Usuario', 'Fecha', 'Minutos', 'Importe'
        ].join(',');

        // Preparar filas
        const detallesRows = [];
        datos.liquidaciones.forEach(liq => {
            liq.detalles.forEach(detalle => {
                detallesRows.push([
                    liq.id,
                    detalle.id,
                    `"${detalle.usuario.replace(/"/g, '""')}"`,
                    detalle.fecha,
                    detalle.total_minutos,
                    detalle.total_importe
                ].join(','));
            });
        });

        // Combinar todo
        const detalleCsvContent = [detallesHeaders, ...detallesRows].join('\n');

        // Escribir a archivo
        fs.writeFileSync(detallesFilePath, detalleCsvContent);
    }

    return filePath;
}


// Procesar datos para informe de liquidaciones - VERSIÓN DIRECTA
function procesarDatosInformeLiquidacionesDirecto(liquidaciones) {
    console.log('🔍 PROCESANDO: Iniciando procesamiento directo de liquidaciones');
    
    // Transformar datos para el informe
    const liquidacionesProcesadas = liquidaciones.map(liquidacion => {
        // Calcular totales por liquidación
        const totalImporte = liquidacion.detalles.reduce((sum, detalle) => {
            const importe = parseFloat(detalle.total_importe) || 0;
            return sum + importe;
        }, 0);
        
        const totalMinutos = liquidacion.detalles.reduce((sum, detalle) => {
            const minutos = parseInt(detalle.total_minutos) || 0;
            return sum + minutos;
        }, 0);

        return {
            id: liquidacion.id,
            periodo: liquidacion.periodo,
            fechaGeneracion: liquidacion.fecha_generacion,
            fechaPago: liquidacion.fecha_pago || null,
            estado: liquidacion.estado,
            observaciones: liquidacion.observaciones || '',
            detalles: liquidacion.detalles.map(detalle => ({
                id: detalle.id,
                id_incidente: detalle.id_incidente,
                id_guardia: detalle.id_guardia,
                usuario: detalle.usuario,
                fecha: detalle.fecha,
                total_minutos: detalle.total_minutos,
                total_importe: parseFloat(detalle.total_importe) || 0
            })),
            totalImporte,
            totalMinutos
        };
    });

    // Calcular estadísticas
    const estadisticas = calcularEstadisticasLiquidacionesDirecto(liquidacionesProcesadas);

    console.log('✅ PROCESANDO: Liquidaciones procesadas:', liquidacionesProcesadas.length);
    
    return {
        liquidaciones: liquidacionesProcesadas,
        estadisticas
    };
}

// Calcular estadísticas para liquidaciones - VERSIÓN DIRECTA
function calcularEstadisticasLiquidacionesDirecto(liquidaciones) {
    console.log('🔍 ESTADÍSTICAS: Calculando estadísticas directas');
    
    // Total de liquidaciones
    const totalLiquidaciones = liquidaciones.length;

    // Total de importe
    const totalImporte = liquidaciones.reduce((sum, liq) => sum + (liq.totalImporte || 0), 0);

    // Distribución por estado
    const estadosMap = liquidaciones.reduce((result, liq) => {
        const estado = liq.estado || 'desconocido';
        if (!result[estado]) {
            result[estado] = 0;
        }
        result[estado]++;
        return result;
    }, {});
    
    const porEstado = Object.entries(estadosMap).map(([estado, cantidad]) => ({ estado, cantidad }));

    // Distribución por usuarios (de los detalles)
    const usuariosSet = new Set();
    liquidaciones.forEach(liq => {
        if (liq.detalles) {
            liq.detalles.forEach(detalle => {
                if (detalle.usuario) {
                    usuariosSet.add(detalle.usuario);
                }
            });
        }
    });
    
    const estadisticas = {
        totalLiquidaciones,
        totalImporte: parseFloat(totalImporte.toFixed(2)),
        totalUsuarios: usuariosSet.size,
        porEstado
    };
    
    console.log('✅ ESTADÍSTICAS: Calculadas exitosamente:', estadisticas);
    
    return estadisticas;
}

module.exports = exports;