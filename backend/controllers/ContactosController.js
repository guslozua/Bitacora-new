// =============================================
// CONTROLADOR COMPLETO: contactosController.js
// =============================================

const ContactosModel = require('../models/ContactosModel');

class ContactosController {
  
  // ===============================
  // ENDPOINTS PARA EQUIPOS
  // ===============================
  
  static async getAllEquipos(req, res) {
    try {
      const equipos = await ContactosModel.getAllEquipos();
      res.json({
        success: true,
        data: equipos,
        total: equipos.length
      });
    } catch (error) {
      console.error('Error en getAllEquipos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener equipos técnicos',
        error: error.message
      });
    }
  }

  static async getEquipoById(req, res) {
    try {
      const { id } = req.params;
      const equipo = await ContactosModel.getEquipoById(id);
      
      if (!equipo) {
        return res.status(404).json({
          success: false,
          message: 'Equipo no encontrado'
        });
      }
      
      res.json({
        success: true,
        data: equipo
      });
    } catch (error) {
      console.error('Error en getEquipoById:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener equipo',
        error: error.message
      });
    }
  }

  static async createEquipo(req, res) {
    try {
      const equipoData = req.body;
      
      // Validaciones básicas
      if (!equipoData.nombre) {
        return res.status(400).json({
          success: false,
          message: 'El nombre del equipo es obligatorio'
        });
      }
      
      const equipoId = await ContactosModel.createEquipo(equipoData);
      
      res.status(201).json({
        success: true,
        message: 'Equipo creado correctamente',
        data: { id: equipoId }
      });
    } catch (error) {
      console.error('Error en createEquipo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear equipo',
        error: error.message
      });
    }
  }

  static async updateEquipo(req, res) {
    try {
      const { id } = req.params;
      const equipoData = req.body;
      
      const success = await ContactosModel.updateEquipo(id, equipoData);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Equipo no encontrado'
        });
      }
      
      res.json({
        success: true,
        message: 'Equipo actualizado correctamente'
      });
    } catch (error) {
      console.error('Error en updateEquipo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar equipo',
        error: error.message
      });
    }
  }

  static async deleteEquipo(req, res) {
    try {
      const { id } = req.params;
      const success = await ContactosModel.deleteEquipo(id);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Equipo no encontrado'
        });
      }
      
      res.json({
        success: true,
        message: 'Equipo eliminado correctamente'
      });
    } catch (error) {
      console.error('Error en deleteEquipo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar equipo',
        error: error.message
      });
    }
  }
  
  // ===============================
  // ENDPOINTS PARA INTEGRANTES
  // ===============================
  
  static async getAllIntegrantes(req, res) {
    try {
      const integrantes = await ContactosModel.getAllIntegrantes();
      res.json({
        success: true,
        data: integrantes,
        total: integrantes.length
      });
    } catch (error) {
      console.error('Error en getAllIntegrantes:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener integrantes',
        error: error.message
      });
    }
  }

  static async createIntegrante(req, res) {
    try {
      const integranteData = req.body;
      
      // Validaciones básicas
      if (!integranteData.nombre || !integranteData.apellido) {
        return res.status(400).json({
          success: false,
          message: 'Nombre y apellido son obligatorios'
        });
      }
      
      const integranteId = await ContactosModel.createIntegrante(integranteData);
      
      res.status(201).json({
        success: true,
        message: 'Integrante creado correctamente',
        data: { id: integranteId }
      });
    } catch (error) {
      console.error('Error en createIntegrante:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear integrante',
        error: error.message
      });
    }
  }

  static async updateIntegrante(req, res) {
    try {
      const { id } = req.params;
      const integranteData = req.body;
      
      const success = await ContactosModel.updateIntegrante(id, integranteData);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Integrante no encontrado'
        });
      }
      
      res.json({
        success: true,
        message: 'Integrante actualizado correctamente'
      });
    } catch (error) {
      console.error('Error en updateIntegrante:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar integrante',
        error: error.message
      });
    }
  }

  // ✅ NUEVO: Eliminar integrante
  static async deleteIntegrante(req, res) {
    try {
      const { id } = req.params;
      const success = await ContactosModel.deleteIntegrante(id);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Integrante no encontrado'
        });
      }
      
      res.json({
        success: true,
        message: 'Integrante eliminado correctamente'
      });
    } catch (error) {
      console.error('Error en deleteIntegrante:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar integrante',
        error: error.message
      });
    }
  }
  
  // ===============================
  // ENDPOINTS PARA SISTEMAS
  // ===============================
  
  static async getAllSistemas(req, res) {
    try {
      const sistemas = await ContactosModel.getAllSistemas();
      res.json({
        success: true,
        data: sistemas,
        total: sistemas.length
      });
    } catch (error) {
      console.error('Error en getAllSistemas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener sistemas',
        error: error.message
      });
    }
  }

  static async createSistema(req, res) {
    try {
      const sistemaData = req.body;
      
      if (!sistemaData.nombre) {
        return res.status(400).json({
          success: false,
          message: 'El nombre del sistema es obligatorio'
        });
      }
      
      const sistemaId = await ContactosModel.createSistema(sistemaData);
      
      res.status(201).json({
        success: true,
        message: 'Sistema creado correctamente',
        data: { id: sistemaId }
      });
    } catch (error) {
      console.error('Error en createSistema:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear sistema',
        error: error.message
      });
    }
  }

  // ✅ NUEVO: Actualizar sistema
  static async updateSistema(req, res) {
    try {
      const { id } = req.params;
      const sistemaData = req.body;
      
      const success = await ContactosModel.updateSistema(id, sistemaData);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Sistema no encontrado'
        });
      }
      
      res.json({
        success: true,
        message: 'Sistema actualizado correctamente'
      });
    } catch (error) {
      console.error('Error en updateSistema:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar sistema',
        error: error.message
      });
    }
  }

  // ✅ NUEVO: Eliminar sistema
  static async deleteSistema(req, res) {
    try {
      const { id } = req.params;
      const success = await ContactosModel.deleteSistema(id);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Sistema no encontrado'
        });
      }
      
      res.json({
        success: true,
        message: 'Sistema eliminado correctamente'
      });
    } catch (error) {
      console.error('Error en deleteSistema:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar sistema',
        error: error.message
      });
    }
  }
  
  // ===============================
  // SIMULADOR DE RESPUESTA
  // ===============================
  
  static async simularRespuesta(req, res) {
    try {
      const { sistemaId } = req.params;
      
      if (!sistemaId) {
        return res.status(400).json({
          success: false,
          message: 'ID del sistema es requerido'
        });
      }
      
      const flujo = await ContactosModel.getFlujoPorSistema(sistemaId);
      
      if (!flujo) {
        return res.status(404).json({
          success: false,
          message: 'No se encontró flujo de escalamiento para este sistema'
        });
      }
      
      // Estructurar respuesta del simulador
      const simulacion = {
        paso1: {
          titulo: 'Detección del Incidente',
          descripcion: `Usuario reporta problema con ${flujo.sistema_nombre}`,
          sistema: {
            nombre: flujo.sistema_nombre,
            criticidad: flujo.criticidad
          }
        },
        paso2: {
          titulo: 'ATPC Recibe el Incidente',
          descripcion: 'Primer nivel de atención evalúa y categoriza'
        },
        paso3: {
          titulo: 'Escalación al Equipo Técnico',
          descripcion: `Se deriva a: ${flujo.equipo_primario_nombre}`,
          equipo: {
            nombre: flujo.equipo_primario_nombre,
            telefono: flujo.equipo_primario_telefono,
            color: flujo.equipo_primario_color,
            integrantes: flujo.integrantes_primarios
          }
        },
        paso4: {
          titulo: 'Resolución y Feedback',
          descripcion: 'El equipo resuelve y notifica a ATPC para cerrar el caso'
        }
      };
      
      // Si hay escalamiento adicional, agregar paso 5
      if (flujo.equipo_escalamiento_id) {
        simulacion.paso5 = {
          titulo: 'Escalamiento Adicional (si es necesario)',
          descripcion: `Si no se resuelve en ${flujo.tiempo_escalamiento_minutos} minutos, escalar a: ${flujo.equipo_escalamiento_nombre}`,
          condicion: flujo.condicion_escalamiento,
          equipo_escalamiento: {
            nombre: flujo.equipo_escalamiento_nombre,
            telefono: flujo.equipo_escalamiento_telefono,
            color: flujo.equipo_escalamiento_color,
            integrantes: flujo.integrantes_escalamiento || []
          }
        };
      }
      
      res.json({
        success: true,
        data: {
          sistema_id: sistemaId,
          flujo_escalamiento: flujo,
          simulacion: simulacion
        }
      });
    } catch (error) {
      console.error('Error en simularRespuesta:', error);
      res.status(500).json({
        success: false,
        message: 'Error al simular respuesta',
        error: error.message
      });
    }
  }
  
  // ===============================
  // BÚSQUEDA GENERAL
  // ===============================
  
  static async buscarContactos(req, res) {
    try {
      const { q: termino } = req.query;
      
      if (!termino || termino.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'El término de búsqueda debe tener al menos 2 caracteres'
        });
      }
      
      const resultados = await ContactosModel.buscarContactos(termino);
      
      res.json({
        success: true,
        data: resultados,
        total: resultados.length,
        termino: termino
      });
    } catch (error) {
      console.error('Error en buscarContactos:', error);
      res.status(500).json({
        success: false,
        message: 'Error en la búsqueda',
        error: error.message
      });
    }
  }
  
  // ===============================
  // HISTORIAL DE CONTACTOS
  // ===============================
  
  static async registrarContacto(req, res) {
    try {
      const contactoData = {
        ...req.body,
        created_by: req.user?.id || null, // Del middleware de autenticación
        fecha_incidente: req.body.fecha_incidente || new Date()
      };
      
      const contactoId = await ContactosModel.registrarContacto(contactoData);
      
      res.status(201).json({
        success: true,
        message: 'Contacto registrado correctamente',
        data: { id: contactoId }
      });
    } catch (error) {
      console.error('Error en registrarContacto:', error);
      res.status(500).json({
        success: false,
        message: 'Error al registrar contacto',
        error: error.message
      });
    }
  }

  static async getHistorialContactos(req, res) {
    try {
      const { sistema_id, equipo_id, limit = 50 } = req.query;
      
      const historial = await ContactosModel.getHistorialContactos(
        sistema_id ? parseInt(sistema_id) : null,
        equipo_id ? parseInt(equipo_id) : null,
        parseInt(limit)
      );
      
      res.json({
        success: true,
        data: historial,
        total: historial.length
      });
    } catch (error) {
      console.error('Error en getHistorialContactos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener historial',
        error: error.message
      });
    }
  }

  // ===============================
  // ASIGNACIONES
  // ===============================

  // ✅ NUEVO: Asignar integrantes a equipo
  static async asignarIntegrantes(req, res) {
    try {
      const { id: equipoId } = req.params;
      const { integrante_ids } = req.body;
      
      if (!integrante_ids || !Array.isArray(integrante_ids)) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere un array de IDs de integrantes'
        });
      }
      
      const success = await ContactosModel.asignarIntegrantes(equipoId, integrante_ids);
      
      res.json({
        success: true,
        message: 'Integrantes asignados correctamente al equipo',
        data: { equipoId, integrante_ids }
      });
    } catch (error) {
      console.error('Error en asignarIntegrantes:', error);
      res.status(500).json({
        success: false,
        message: 'Error al asignar integrantes',
        error: error.message
      });
    }
  }

  // ✅ NUEVO: Asignar sistemas a equipo
  static async asignarSistemas(req, res) {
    try {
      const { id: equipoId } = req.params;
      const { sistema_ids } = req.body;
      
      if (!sistema_ids || !Array.isArray(sistema_ids)) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere un array de IDs de sistemas'
        });
      }
      
      const success = await ContactosModel.asignarSistemas(equipoId, sistema_ids);
      
      res.json({
        success: true,
        message: 'Sistemas asignados correctamente al equipo',
        data: { equipoId, sistema_ids }
      });
    } catch (error) {
      console.error('Error en asignarSistemas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al asignar sistemas',
        error: error.message
      });
    }
  }

  // ✅ NUEVO: Asignar equipos a sistema
  static async asignarEquipos(req, res) {
    try {
      const { id: sistemaId } = req.params;
      const { equipo_ids } = req.body;
      
      if (!equipo_ids || !Array.isArray(equipo_ids)) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere un array de IDs de equipos'
        });
      }
      
      const success = await ContactosModel.asignarEquiposASistema(sistemaId, equipo_ids);
      
      res.json({
        success: true,
        message: 'Equipos asignados correctamente al sistema',
        data: { sistemaId, equipo_ids }
      });
    } catch (error) {
      console.error('Error en asignarEquipos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al asignar equipos',
        error: error.message
      });
    }
  }
}

module.exports = ContactosController;