// src/components/Incidentes/IncidenteModal.tsx
import React, { useState, useEffect } from 'react';
import { 
  Modal, Button, Form, Row, Col, Spinner, Alert, Badge, ListGroup
} from 'react-bootstrap';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Swal from 'sweetalert2';
import api from '../../services/api'; // Importamos nuestra instancia api en lugar de axios

interface Codigo {
  id: number;
  codigo: string;
  descripcion: string;
  tipo: string;
  factor_multiplicador: number;
}

interface CodigoAplicado {
  id_codigo: number;
  codigo?: string;
  descripcion?: string;
  minutos: number;
  importe: number | null;
}

interface Incidente {
  id?: number;
  id_guardia: number;
  inicio: Date | string;
  fin: Date | string;
  descripcion: string;
  estado?: string;
  observaciones?: string;
  codigos?: CodigoAplicado[];
}

interface IncidenteModalProps {
  show: boolean;
  onHide: () => void;
  guardia: { id: number; fecha: string; usuario: string } | null;
  incidente?: Incidente | null;
  onIncidenteGuardado: () => void;
}

const IncidenteModal: React.FC<IncidenteModalProps> = ({
  show,
  onHide,
  guardia,
  incidente,
  onIncidenteGuardado
}) => {
  const [formData, setFormData] = useState<Incidente>({
    id_guardia: 0,
    inicio: new Date(),
    fin: new Date(),
    descripcion: '',
    observaciones: '',
    codigos: []
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codigosDisponibles, setCodigosDisponibles] = useState<Codigo[]>([]);
  const [loadingCodigos, setLoadingCodigos] = useState(false);
  const [codigosSeleccionados, setCodigosSeleccionados] = useState<CodigoAplicado[]>([]);
  
  // Inicializar el formulario cuando se abre el modal
  useEffect(() => {
    if (show) {
      if (incidente) {
        // Modo edición
        setFormData({
          ...incidente,
          inicio: typeof incidente.inicio === 'string' ? new Date(incidente.inicio) : incidente.inicio,
          fin: typeof incidente.fin === 'string' ? new Date(incidente.fin) : incidente.fin
        });
        
        if (incidente.codigos) {
          setCodigosSeleccionados(incidente.codigos);
        }
      } else if (guardia) {
        // Modo creación
        const guardiaDate = new Date(guardia.fecha);
        const now = new Date();
        
        // Establecer fecha de inicio = fecha de guardia + hora actual
        const inicio = new Date(guardiaDate);
        inicio.setHours(now.getHours(), now.getMinutes(), 0, 0);
        
        // Establecer fecha de fin = inicio + 1 hora
        const fin = new Date(inicio);
        fin.setHours(fin.getHours() + 1);
        
        setFormData({
          id_guardia: guardia.id,
          inicio,
          fin,
          descripcion: '',
          observaciones: ''
        });
        
        setCodigosSeleccionados([]);
        
        // Cargar códigos aplicables automáticamente
        cargarCodigosAplicables(guardiaDate, inicio.toTimeString().substring(0, 8), fin.toTimeString().substring(0, 8));
      }
    }
  }, [show, incidente, guardia]);
  
  // Cargar códigos disponibles cuando se abre el modal
  useEffect(() => {
    if (show) {
      cargarCodigosDisponibles();
    }
  }, [show]);
  
  // Cargar todos los códigos disponibles
  const cargarCodigosDisponibles = async () => {
    try {
      setLoadingCodigos(true);
      
      // Modificado: usando api en lugar de axios y quitando el prefijo '/api'
      const response = await api.get('/codigos', {
        params: { estado: 'activo' }
      });
      
      if (response.data.success) {
        setCodigosDisponibles(response.data.data);
      }
    } catch (error: any) {
      console.error('Error al cargar códigos:', error);
      setError(error.response?.data?.message || 'Error al cargar códigos');
    } finally {
      setLoadingCodigos(false);
    }
  };
  
  // Cargar códigos aplicables según fecha y horario
  const cargarCodigosAplicables = async (fecha: Date, horaInicio: string, horaFin: string) => {
    try {
      setLoadingCodigos(true);
      
      // Modificado: usando api en lugar de axios y quitando el prefijo '/api'
      const response = await api.get('/codigos/aplicables', {
        params: {
          fecha: format(fecha, 'yyyy-MM-dd'),
          hora_inicio: horaInicio,
          hora_fin: horaFin
        }
      });
      
      if (response.data.success) {
        const codigosAplicables = response.data.data;
        
        // Calcular duración total en minutos
        const duracionMinutos = 
          Math.floor((new Date(formData.fin).getTime() - new Date(formData.inicio).getTime()) / (1000 * 60));
        
        // Convertir a formato de códigos aplicados
        const nuevosCodigosSeleccionados = codigosAplicables.map((codigo: Codigo) => ({
          id_codigo: codigo.id,
          codigo: codigo.codigo,
          descripcion: codigo.descripcion,
          minutos: duracionMinutos,
          importe: null
        }));
        
        setCodigosSeleccionados(nuevosCodigosSeleccionados);
      }
    } catch (error: any) {
      console.error('Error al cargar códigos aplicables:', error);
      setError(error.response?.data?.message || 'Error al cargar códigos aplicables');
    } finally {
      setLoadingCodigos(false);
    }
  };
  
  // Manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Manejar cambios en las fechas/horas
  const handleDateTimeChange = (field: 'inicio' | 'fin', value: string) => {
    try {
      const newValue = new Date(value);
      
      // Validar que fin sea posterior a inicio
      if (field === 'fin' && newValue <= new Date(formData.inicio)) {
        Swal.fire({
          title: 'Error',
          text: 'La hora de fin debe ser posterior a la hora de inicio',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
        return;
      }
      
      setFormData({
        ...formData,
        [field]: newValue
      });
      
      // Si cambia el rango horario, sugerir recalcular códigos
      if (codigosSeleccionados.length > 0) {
        Swal.fire({
          title: '¿Recalcular códigos?',
          text: 'Has cambiado el horario del incidente. ¿Deseas recalcular los códigos aplicables?',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Sí, recalcular',
          cancelButtonText: 'No, mantener actuales'
        }).then((result) => {
          if (result.isConfirmed && guardia) {
            const guardiaDate = new Date(guardia.fecha);
            cargarCodigosAplicables(
              guardiaDate, 
              new Date(formData.inicio).toTimeString().substring(0, 8), 
              new Date(formData.fin).toTimeString().substring(0, 8)
            );
          }
        });
      }
    } catch (error) {
      console.error('Error al cambiar fecha/hora:', error);
    }
  };
  
  // Agregar código a la lista de seleccionados
  const handleAddCodigo = (codigoId: number) => {
    const codigo = codigosDisponibles.find(c => c.id === codigoId);
    if (!codigo) return;
    
    // Verificar si ya está seleccionado
    if (codigosSeleccionados.some(c => c.id_codigo === codigoId)) {
      Swal.fire({
        title: 'Aviso',
        text: 'Este código ya ha sido agregado',
        icon: 'info',
        confirmButtonText: 'Aceptar'
      });
      return;
    }
    
    // Calcular duración total en minutos
    const duracionMinutos = 
      Math.floor((new Date(formData.fin).getTime() - new Date(formData.inicio).getTime()) / (1000 * 60));
    
    setCodigosSeleccionados([
      ...codigosSeleccionados,
      {
        id_codigo: codigo.id,
        codigo: codigo.codigo,
        descripcion: codigo.descripcion,
        minutos: duracionMinutos,
        importe: null
      }
    ]);
  };
  
  // Eliminar código de la lista de seleccionados
  const handleRemoveCodigo = (codigoId: number) => {
    setCodigosSeleccionados(codigosSeleccionados.filter(c => c.id_codigo !== codigoId));
  };
  
  // Actualizar minutos de un código
  const handleUpdateMinutos = (codigoId: number, minutos: number) => {
    setCodigosSeleccionados(codigosSeleccionados.map(c => 
      c.id_codigo === codigoId ? { ...c, minutos } : c
    ));
  };
  
  // Guardar el incidente
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.descripcion.trim()) {
      Swal.fire({
        title: 'Error',
        text: 'La descripción es obligatoria',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const datosAEnviar = {
        ...formData,
        codigos: codigosSeleccionados.map(c => ({
          id_codigo: c.id_codigo,
          minutos: c.minutos,
          importe: c.importe
        }))
      };
      
      let response;
      if (incidente?.id) {
        // Modificado: usando api en lugar de axios y quitando el prefijo '/api'
        // Actualizar incidente existente
        response = await api.put(`/incidentes/${incidente.id}`, datosAEnviar);
      } else {
        // Modificado: usando api en lugar de axios y quitando el prefijo '/api'
        // Crear nuevo incidente
        response = await api.post('/incidentes', datosAEnviar);
      }
      
      if (response.data.success) {
        Swal.fire({
          title: '¡Éxito!',
          text: incidente?.id 
            ? 'Incidente actualizado correctamente' 
            : 'Incidente registrado correctamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        
        onHide();
        onIncidenteGuardado();
      }
    } catch (error: any) {
      console.error('Error al guardar incidente:', error);
      setError(error.response?.data?.message || 'Error al guardar incidente');
      
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.message || 'Error al guardar incidente',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Modal 
      show={show} 
      onHide={onHide}
      size="lg"
      backdrop="static"
      keyboard={false}
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {incidente?.id ? 'Editar Incidente' : 'Registrar Incidente'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}
        
        {guardia && (
          <Alert variant="info" className="mb-3">
            <strong>Guardia:</strong> {guardia.usuario} - {format(new Date(guardia.fecha), 'EEEE, d MMMM yyyy', { locale: es })}
          </Alert>
        )}
        
        <Form onSubmit={handleSubmit}>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="formInicio">
                <Form.Label>Fecha y Hora de Inicio *</Form.Label>
                <Form.Control
                  type="datetime-local"
                  name="inicio"
                  value={format(new Date(formData.inicio), "yyyy-MM-dd'T'HH:mm")}
                  onChange={(e) => handleDateTimeChange('inicio', e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="formFin">
                <Form.Label>Fecha y Hora de Fin *</Form.Label>
                <Form.Control
                  type="datetime-local"
                  name="fin"
                  value={format(new Date(formData.fin), "yyyy-MM-dd'T'HH:mm")}
                  onChange={(e) => handleDateTimeChange('fin', e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
          </Row>
          
          <Form.Group className="mb-3" controlId="formDescripcion">
            <Form.Label>Descripción del Incidente *</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              placeholder="Describa el incidente ocurrido durante la guardia"
              required
            />
          </Form.Group>
          
          <Form.Group className="mb-3" controlId="formObservaciones">
            <Form.Label>Observaciones</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              name="observaciones"
              value={formData.observaciones || ''}
              onChange={handleInputChange}
              placeholder="Observaciones adicionales (opcional)"
            />
          </Form.Group>
          
          <hr />
          
          <h5>Códigos de Facturación</h5>
          
          {loadingCodigos ? (
            <div className="text-center py-3">
              <Spinner animation="border" size="sm" className="me-2" />
              Cargando códigos...
            </div>
          ) : (
            <>
              <Row className="mb-3">
                <Col>
                  <Form.Group>
                    <Form.Label>Agregar Código</Form.Label>
                    <div className="d-flex">
                      <Form.Select 
                        onChange={(e) => handleAddCodigo(parseInt(e.target.value))}
                        value=""
                      >
                        <option value="">Seleccionar código...</option>
                        {codigosDisponibles.map((codigo) => (
                          <option key={codigo.id} value={codigo.id}>
                            {codigo.codigo} - {codigo.descripcion}
                          </option>
                        ))}
                      </Form.Select>
                      <Button 
                        variant="outline-primary" 
                        className="ms-2"
                        onClick={() => {
                          if (guardia) {
                            const guardiaDate = new Date(guardia.fecha);
                            cargarCodigosAplicables(
                              guardiaDate, 
                              new Date(formData.inicio).toTimeString().substring(0, 8),
                              new Date(formData.fin).toTimeString().substring(0, 8)
                            );
                          }
                        }}
                      >
                        <i className="bi bi-arrow-clockwise"></i> Sugerir Códigos
                      </Button>
                    </div>
                  </Form.Group>
                </Col>
              </Row>
              
              {codigosSeleccionados.length === 0 ? (
                <Alert variant="warning">
                  No hay códigos seleccionados. Agregue al menos un código de facturación.
                </Alert>
              ) : (
                <ListGroup className="mb-3">
                  {codigosSeleccionados.map((codigo) => (
                    <ListGroup.Item key={codigo.id_codigo} className="d-flex justify-content-between align-items-center">
                      <div>
                        <Badge bg="secondary" className="me-2">
                          {codigo.codigo}
                        </Badge>
                        {codigo.descripcion}
                      </div>
                      
                      <div className="d-flex align-items-center">
                        <Form.Group className="d-flex align-items-center me-3">
                          <Form.Label className="mb-0 me-2">Minutos:</Form.Label>
                          <Form.Control
                            type="number"
                            min="1"
                            style={{ width: '80px' }}
                            value={codigo.minutos}
                            onChange={(e) => handleUpdateMinutos(codigo.id_codigo, parseInt(e.target.value))}
                          />
                        </Form.Group>
                        
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => handleRemoveCodigo(codigo.id_codigo)}
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </>
          )}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <>
              <Spinner as="span" animation="border" size="sm" className="me-2" />
              Guardando...
            </>
          ) : incidente?.id ? 'Actualizar' : 'Guardar'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default IncidenteModal;