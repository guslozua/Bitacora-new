// src/components/Incidentes/IncidenteModal.tsx - CON ACTUALIZACIÓN AUTOMÁTICA DE DURACIÓN
import React, { useState, useEffect } from 'react';
import {
  Modal, Button, Form, Row, Col, Spinner, Alert, Badge, ListGroup, Tab, Tabs
} from 'react-bootstrap';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import Swal from 'sweetalert2';
import api from '../../services/api';
import EstadoIncidente from './EstadoIncidente';

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
  codigos_aplicados?: CodigoAplicado[];
  historial_estados?: any[];
}

interface IncidenteModalProps {
  show: boolean;
  onHide: () => void;
  guardia: { id: number; fecha: string; usuario: string } | null;
  incidente?: Incidente | null;
  onIncidenteGuardado: () => void;
  modoSoloLectura?: boolean;
}

const IncidenteModal: React.FC<IncidenteModalProps> = ({
  show,
  onHide,
  guardia,
  incidente,
  onIncidenteGuardado,
  modoSoloLectura = false
}) => {
  const [formData, setFormData] = useState<Incidente>({
    id_guardia: 0,
    inicio: new Date(),
    fin: new Date(),
    descripcion: '',
    observaciones: '',
    codigos: [],
    estado: 'registrado'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codigosDisponibles, setCodigosDisponibles] = useState<Codigo[]>([]);
  const [loadingCodigos, setLoadingCodigos] = useState(false);
  const [codigosSeleccionados, setCodigosSeleccionados] = useState<CodigoAplicado[]>([]);
  const [activeTab, setActiveTab] = useState('datos');
  const [modalidadConvenio, setModalidadConvenio] = useState<'FC' | 'DC'>('FC'); // ✨ NUEVO ESTADO PARA MODALIDAD DE CONVENIO


  // ✨ FUNCIÓN HELPER MEJORADA PARA FORMATEAR FECHA AL INPUT
  const formatearFechaParaInput = (fecha: Date | string): string => {
    try {
      let fechaObj: Date;

      if (typeof fecha === 'string') {
        fechaObj = new Date(fecha);
      } else {
        fechaObj = fecha;
      }

      if (isNaN(fechaObj.getTime())) {
        console.warn('Fecha inválida:', fecha);
        return format(new Date(), "yyyy-MM-dd'T'HH:mm");
      }

      const year = fechaObj.getFullYear();
      const month = String(fechaObj.getMonth() + 1).padStart(2, '0');
      const day = String(fechaObj.getDate()).padStart(2, '0');
      const hours = String(fechaObj.getHours()).padStart(2, '0');
      const minutes = String(fechaObj.getMinutes()).padStart(2, '0');

      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return format(new Date(), "yyyy-MM-dd'T'HH:mm");
    }
  };

  // ✨ FUNCIÓN HELPER MEJORADA PARA PARSEAR FECHA DESDE INPUT
  const parsearFechaDesdeInput = (valorInput: string): Date => {
    try {
      if (!valorInput) {
        return new Date();
      }

      const fecha = new Date(valorInput);

      if (isNaN(fecha.getTime())) {
        console.warn('Fecha inválida desde input:', valorInput);
        return new Date();
      }

      return fecha;
    } catch (error) {
      console.error('Error al parsear fecha desde input:', error);
      return new Date();
    }
  };

  // Función helper para formatear hora en formato HH:MM:SS
  const formatearHora = (fecha: Date): string => {
    return fecha.toTimeString().split(' ')[0];
  };

  // ✨ FUNCIÓN HELPER PARA CALCULAR DURACIÓN EN MINUTOS
  const calcularDuracionMinutos = (inicio: Date, fin: Date): number => {
    return Math.max(0, Math.floor((fin.getTime() - inicio.getTime()) / (1000 * 60)));
  };

  // ✨ FUNCIÓN PARA ACTUALIZAR MINUTOS DE CÓDIGOS AUTOMÁTICAMENTE
  const actualizarMinutosCodigos = (nuevaInicio: Date, nuevaFin: Date) => {
    const nuevaDuracion = calcularDuracionMinutos(nuevaInicio, nuevaFin);

    setCodigosSeleccionados(prevCodigos =>
      prevCodigos.map(codigo => ({
        ...codigo,
        minutos: nuevaDuracion
      }))
    );
  };

  // ✨ INICIALIZAR EL FORMULARIO MEJORADO
  useEffect(() => {
    if (show) {
      if (incidente) {
        // Modo edición - PARSEO MEJORADO DE FECHAS
        console.log('Iniciando edición de incidente:', incidente);
        console.log('Fechas originales - inicio:', incidente.inicio, 'fin:', incidente.fin);

        let inicioDate: Date;
        let finDate: Date;

        try {
          if (typeof incidente.inicio === 'string') {
            inicioDate = new Date(incidente.inicio);
          } else {
            inicioDate = new Date(incidente.inicio);
          }

          if (typeof incidente.fin === 'string') {
            finDate = new Date(incidente.fin);
          } else {
            finDate = new Date(incidente.fin);
          }

          if (isNaN(inicioDate.getTime()) || isNaN(finDate.getTime())) {
            throw new Error('Fechas inválidas');
          }

          console.log('Fechas parseadas - inicio:', inicioDate, 'fin:', finDate);

          setFormData({
            ...incidente,
            inicio: inicioDate,
            fin: finDate
          });

        } catch (error) {
          console.error('Error al parsear fechas del incidente:', error);
          const now = new Date();
          const fin = new Date(now);
          fin.setHours(fin.getHours() + 1);

          setFormData({
            ...incidente,
            inicio: now,
            fin: fin
          });
        }

        // Manejar códigos aplicados
        if (incidente.codigos && incidente.codigos.length > 0) {
          setCodigosSeleccionados(incidente.codigos);
        } else if (incidente.codigos_aplicados && incidente.codigos_aplicados.length > 0) {
          setCodigosSeleccionados(incidente.codigos_aplicados);
        } else {
          setCodigosSeleccionados([]);
        }

      } else if (guardia) {
        // Modo creación
        const guardiaDate = new Date(guardia.fecha);
        const now = new Date();

        const inicio = new Date(guardiaDate);
        inicio.setHours(now.getHours(), now.getMinutes(), 0, 0);

        const fin = new Date(inicio);
        fin.setHours(fin.getHours() + 1);

        console.log('Creando nuevo incidente - inicio:', inicio, 'fin:', fin);

        setFormData({
          id_guardia: guardia.id,
          inicio,
          fin,
          descripcion: '',
          observaciones: '',
          estado: 'registrado'
        });

        setCodigosSeleccionados([]);

        if (!modoSoloLectura) {
          cargarCodigosAplicables(
            guardiaDate,
            formatearHora(inicio),
            formatearHora(fin)
          );
        }
      }

      if (incidente?.id && modoSoloLectura) {
        setActiveTab('estados');
      } else {
        setActiveTab('datos');
      }
    }
  }, [show, incidente, guardia, modoSoloLectura]);

  // Cargar códigos disponibles cuando se abre el modal
  useEffect(() => {
    if (show && !modoSoloLectura) {
      cargarCodigosDisponibles();
    }
  }, [show, modoSoloLectura]);

  // Cargar todos los códigos disponibles
  const cargarCodigosDisponibles = async () => {
    try {
      setLoadingCodigos(true);

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

      const response = await api.get('/codigos/aplicables', {
        params: {
          fecha: format(fecha, 'yyyy-MM-dd'),
          hora_inicio: horaInicio,
          hora_fin: horaFin,
          modalidad_convenio: modalidadConvenio // ✨ INCLUIR MODALIDAD
        }
      });

      if (response.data.success) {
        const codigosAplicables = response.data.data;

        const duracionMinutos = calcularDuracionMinutos(
          new Date(formData.inicio),
          new Date(formData.fin)
        );

        const nuevosCodigosSeleccionados = codigosAplicables.map((codigo: Codigo) => ({
          id_codigo: codigo.id,
          codigo: codigo.codigo,
          descripcion: codigo.descripcion,
          minutos: duracionMinutos,
          importe: null
        }));

        setCodigosSeleccionados(nuevosCodigosSeleccionados);

        // ✨ MOSTRAR NOTIFICACIÓN CON LA MODALIDAD USADA
        console.log(`✅ Códigos aplicables cargados para modalidad ${modalidadConvenio}:`, codigosAplicables.length);
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

  // ✨ MANEJAR CAMBIOS EN LAS FECHAS/HORAS CON ACTUALIZACIÓN AUTOMÁTICA
  const handleDateTimeChange = (field: 'inicio' | 'fin', value: string) => {
    try {
      console.log(`Cambiando ${field} a:`, value);

      const newValue = parsearFechaDesdeInput(value);
      console.log(`Fecha parseada para ${field}:`, newValue);

      if (field === 'fin') {
        const inicioActual = new Date(formData.inicio);
        if (newValue <= inicioActual) {
          Swal.fire({
            title: 'Error',
            text: 'La hora de fin debe ser posterior a la hora de inicio',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
          return;
        }
      } else if (field === 'inicio') {
        const finActual = new Date(formData.fin);
        if (newValue >= finActual) {
          Swal.fire({
            title: 'Error',
            text: 'La hora de inicio debe ser anterior a la hora de fin',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
          return;
        }
      }

      const nuevoFormData = {
        ...formData,
        [field]: newValue
      };

      setFormData(nuevoFormData);
      console.log('FormData actualizado:', nuevoFormData);

      // ✨ ACTUALIZAR AUTOMÁTICAMENTE LOS MINUTOS DE LOS CÓDIGOS
      if (codigosSeleccionados.length > 0) {
        const inicioParaCalculo = field === 'inicio' ? newValue : new Date(formData.inicio);
        const finParaCalculo = field === 'fin' ? newValue : new Date(formData.fin);

        console.log('Actualizando minutos de códigos automáticamente...');
        actualizarMinutosCodigos(inicioParaCalculo, finParaCalculo);

        // Mostrar notificación sutil de que se actualizaron los minutos
        const nuevaDuracion = calcularDuracionMinutos(inicioParaCalculo, finParaCalculo);
        console.log(`Duración actualizada: ${nuevaDuracion} minutos`);
      }

      // ✨ OPCIÓN DE RECALCULAR CÓDIGOS APLICABLES (SOLO EN MODO CREACIÓN)
      if (!incidente?.id && codigosSeleccionados.length > 0 && !modoSoloLectura) {
        // En modo edición, solo preguntamos si quiere recalcular códigos aplicables
        // (no los minutos, que ya se actualizaron automáticamente)
        Swal.fire({
          title: '¿Recalcular códigos aplicables?',
          text: 'Has cambiado el horario. ¿Deseas recalcular qué códigos son aplicables para este nuevo horario?',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Sí, recalcular códigos',
          cancelButtonText: 'No, mantener códigos actuales'
        }).then((result) => {
          if (result.isConfirmed && guardia) {
            const guardiaDate = new Date(guardia.fecha);
            const inicioDate = field === 'inicio' ? newValue : new Date(nuevoFormData.inicio);
            const finDate = field === 'fin' ? newValue : new Date(nuevoFormData.fin);

            cargarCodigosAplicables(
              guardiaDate,
              formatearHora(inicioDate),
              formatearHora(finDate)
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

    if (codigosSeleccionados.some(c => c.id_codigo === codigoId)) {
      Swal.fire({
        title: 'Aviso',
        text: 'Este código ya ha sido agregado',
        icon: 'info',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    const duracionMinutos = calcularDuracionMinutos(
      new Date(formData.inicio),
      new Date(formData.fin)
    );

    setCodigosSeleccionados([
      ...codigosSeleccionados,
      {
        id_codigo: codigo.id,
        codigo: codigo.codigo,
        descripcion: codigo.descripcion,
        minutos: duracionMinutos, // ✨ Usar duración actual
        importe: null
      }
    ]);
  };

  // Eliminar código de la lista de seleccionados
  const handleRemoveCodigo = (codigoId: number) => {
    setCodigosSeleccionados(codigosSeleccionados.filter(c => c.id_codigo !== codigoId));
  };

  // Actualizar minutos de un código específico
  const handleUpdateMinutos = (codigoId: number, minutos: number) => {
    setCodigosSeleccionados(codigosSeleccionados.map(c =>
      c.id_codigo === codigoId ? { ...c, minutos } : c
    ));
  };

  // ✨ FUNCIÓN PARA ACTUALIZAR TODOS LOS CÓDIGOS A LA DURACIÓN ACTUAL
  const actualizarTodosLosMinutos = () => {
    const duracionActual = calcularDuracionMinutos(
      new Date(formData.inicio),
      new Date(formData.fin)
    );

    setCodigosSeleccionados(prevCodigos =>
      prevCodigos.map(codigo => ({
        ...codigo,
        minutos: duracionActual
      }))
    );

    Swal.fire({
      title: '¡Actualizado!',
      text: `Todos los códigos han sido actualizados a ${duracionActual} minutos`,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    });
  };

  // Manejar cambio de estado desde el componente EstadoIncidente
  const handleEstadoChanged = (nuevoEstado: string) => {
    setFormData(prev => ({
      ...prev,
      estado: nuevoEstado
    }));
    onIncidenteGuardado();
  };

  // ✨ GUARDAR EL INCIDENTE MEJORADO
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

      // ✨ INCLUIR MODALIDAD EN LOS DATOS A ENVIAR
      const datosAEnviar = {
        ...formData,
        inicio: new Date(formData.inicio).toISOString(),
        fin: new Date(formData.fin).toISOString(),
        modalidad_convenio: modalidadConvenio, // ✨ INCLUIR MODALIDAD
        codigos: codigosSeleccionados.map(c => ({
          id_codigo: c.id_codigo,
          minutos: c.minutos,
          importe: c.importe
        }))
      };

      console.log('📤 Datos a enviar con modalidad:', datosAEnviar);

      let response;
      if (incidente?.id) {
        response = await api.put(`/incidentes/${incidente.id}`, datosAEnviar);
      } else {
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
      size="xl"
      backdrop="static"
      keyboard={false}
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {modoSoloLectura
            ? 'Ver Incidente'
            : incidente?.id
              ? 'Editar Incidente'
              : 'Registrar Incidente'}
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

        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k || 'datos')}
          className="mb-3"
        >
          <Tab eventKey="datos" title="Datos del Incidente">
            <Form onSubmit={handleSubmit}>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group controlId="formInicio">
                    <Form.Label>Fecha y Hora de Inicio *</Form.Label>
                    <Form.Control
                      type="datetime-local"
                      name="inicio"
                      value={formatearFechaParaInput(formData.inicio)}
                      onChange={(e) => handleDateTimeChange('inicio', e.target.value)}
                      required
                      disabled={modoSoloLectura}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="formFin">
                    <Form.Label>Fecha y Hora de Fin *</Form.Label>
                    <Form.Control
                      type="datetime-local"
                      name="fin"
                      value={formatearFechaParaInput(formData.fin)}
                      onChange={(e) => handleDateTimeChange('fin', e.target.value)}
                      required
                      disabled={modoSoloLectura}
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* ✨ MOSTRAR DURACIÓN ACTUAL */}
              <Row className="mb-3">
                <Col>
                  <Alert variant="info" className="d-flex justify-content-between align-items-center">
                    <span>
                      <i className="bi bi-clock me-2"></i>
                      <strong>Duración actual:</strong> {calcularDuracionMinutos(new Date(formData.inicio), new Date(formData.fin))} minutos
                      ({Math.floor(calcularDuracionMinutos(new Date(formData.inicio), new Date(formData.fin)) / 60)}h {calcularDuracionMinutos(new Date(formData.inicio), new Date(formData.fin)) % 60}m)
                    </span>
                    {codigosSeleccionados.length > 0 && !modoSoloLectura && (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={actualizarTodosLosMinutos}
                        title="Actualizar todos los códigos a la duración actual"
                      >
                        <i className="bi bi-arrow-clockwise me-1"></i>
                        Actualizar Códigos
                      </Button>
                    )}
                  </Alert>
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
                  disabled={modoSoloLectura}
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
                  disabled={modoSoloLectura}
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="formModalidadConvenio">
                <Form.Label>Modalidad de Convenio del Usuario de Guardia</Form.Label>
                <Form.Select
                  value={modalidadConvenio}
                  onChange={(e) => setModalidadConvenio(e.target.value as 'FC' | 'DC')}
                  disabled={modoSoloLectura}
                >
                  <option value="FC">Fuera de Convenio (FC)</option>
                  <option value="DC">Dentro de Convenio (DC)</option>
                </Form.Select>
                <Form.Text className="text-muted">
                  Seleccione la modalidad contractual del usuario {guardia?.usuario}.
                  Esto determinará qué códigos de facturación se aplicarán.
                </Form.Text>
              </Form.Group>

              <hr />

              <h5>Códigos de Facturación</h5>

              {!modoSoloLectura && (
                <>
                  {loadingCodigos ? (
                    <div className="text-center py-3">
                      <Spinner animation="border" size="sm" className="me-2" />
                      Cargando códigos...
                    </div>
                  ) : (
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
                                    formatearHora(new Date(formData.inicio)),
                                    formatearHora(new Date(formData.fin))
                                  );
                                }
                              }}
                              title={`Buscar códigos aplicables para modalidad ${modalidadConvenio}`}
                            >
                              <i className="bi bi-arrow-clockwise"></i> Sugerir Códigos ({modalidadConvenio})
                            </Button>
                          </div>
                        </Form.Group>
                      </Col>
                    </Row>
                  )}
                </>
              )}

              {codigosSeleccionados.length === 0 ? (
                <Alert variant="warning">
                  {modoSoloLectura
                    ? 'No hay códigos asignados a este incidente.'
                    : 'No hay códigos seleccionados. Agregue al menos un código de facturación.'}
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
                            disabled={modoSoloLectura}
                          />
                        </Form.Group>

                        {!modoSoloLectura && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleRemoveCodigo(codigo.id_codigo)}
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        )}
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Form>
          </Tab>

          {/* Pestaña de Estados - Solo visible si es edición */}
          {incidente?.id && (
            <Tab eventKey="estados" title="Estados y Workflow">
              <div className="mb-4">
                <h5 className="mb-3">
                  <i className="bi bi-gear me-2"></i>
                  Estado Actual del Incidente
                </h5>

                <EstadoIncidente
                  incidenteId={incidente.id}
                  estadoActual={formData.estado || 'registrado'}
                  onEstadoChanged={handleEstadoChanged}
                  showHistorial={true}
                  size="sm"
                />
              </div>

              <hr />

              <div className="mt-4">
                <h6>
                  <i className="bi bi-info-circle me-2"></i>
                  Información del Workflow
                </h6>
                <Alert variant="info">
                  <strong>Estados disponibles:</strong>
                  <ul className="mb-0 mt-2">
                    <li><Badge bg="secondary">Registrado</Badge> - Estado inicial del incidente</li>
                    <li><Badge bg="info">Revisado</Badge> - El incidente ha sido revisado por un supervisor</li>
                    <li><Badge bg="success">Aprobado</Badge> - El incidente ha sido aprobado para liquidación</li>
                    <li><Badge bg="danger">Rechazado</Badge> - El incidente ha sido rechazado y requiere correcciones</li>
                    <li><Badge bg="primary">Liquidado</Badge> - El incidente ha sido procesado para pago</li>
                  </ul>
                </Alert>
              </div>
            </Tab>
          )}
        </Tabs>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          {modoSoloLectura ? 'Cerrar' : 'Cancelar'}
        </Button>
        {!modoSoloLectura && (
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Guardando...
              </>
            ) : incidente?.id ? 'Actualizar' : 'Guardar'}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default IncidenteModal;