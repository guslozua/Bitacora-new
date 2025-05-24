// src/components/Codigos/CodigoModal.tsx - CON SOPORTE PARA MEDIANOCHE
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { Codigo } from '../../services/CodigoService';
import CodigoService from '../../services/CodigoService';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Swal from 'sweetalert2';
import api from '../../services/api';

interface CodigoModalProps {
  show: boolean;
  onHide: (reloadData?: boolean) => void;
  codigo: Codigo | null;
}

const CodigoModal: React.FC<CodigoModalProps> = ({ show, onHide, codigo }) => {
  const [formData, setFormData] = useState<Codigo>({
    codigo: '',
    descripcion: '',
    notas: '',
    tipo: 'guardia_pasiva',
    dias_aplicables: 'L,M,X,J,V,S,D',
    hora_inicio: null,
    hora_fin: null,
    factor_multiplicador: 1,
    fecha_vigencia_desde: new Date(),
    fecha_vigencia_hasta: null,
    estado: 'activo'
  });
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usarHorario, setUsarHorario] = useState(false);
  const [usarVigenciaHasta, setUsarVigenciaHasta] = useState(false);
  const [cruzaMedianoche, setCruzaMedianoche] = useState(false); // ✨ NUEVO ESTADO

  // ✨ FUNCIÓN PARA DETECTAR SI UN HORARIO CRUZA MEDIANOCHE
  const detectaCruzaMedianoche = (horaInicio: string, horaFin: string): boolean => {
    if (!horaInicio || !horaFin) return false;
    
    // Convertir a minutos desde 00:00
    const [inicioHoras, inicioMinutos] = horaInicio.split(':').map(Number);
    const [finHoras, finMinutos] = horaFin.split(':').map(Number);
    
    const inicioEnMinutos = inicioHoras * 60 + inicioMinutos;
    const finEnMinutos = finHoras * 60 + finMinutos;
    
    return finEnMinutos < inicioEnMinutos;
  };

  // ✨ FUNCIÓN PARA OBTENER DESCRIPCIÓN DEL HORARIO
  const getDescripcionHorario = (): string => {
    if (!formData.hora_inicio || !formData.hora_fin) return '';
    
    if (cruzaMedianoche) {
      return `${formData.hora_inicio} (día actual) hasta ${formData.hora_fin} (día siguiente)`;
    } else {
      return `${formData.hora_inicio} hasta ${formData.hora_fin} (mismo día)`;
    }
  };
  
  // Cargar datos para edición
  useEffect(() => {
    if (show && codigo) {
      const fechaVigenciaDesde = codigo.fecha_vigencia_desde instanceof Date 
        ? codigo.fecha_vigencia_desde 
        : new Date(codigo.fecha_vigencia_desde);
      
      const fechaVigenciaHasta = codigo.fecha_vigencia_hasta 
        ? (codigo.fecha_vigencia_hasta instanceof Date 
          ? codigo.fecha_vigencia_hasta 
          : new Date(codigo.fecha_vigencia_hasta)) 
        : null;
      
      setFormData({
        ...codigo,
        notas: codigo.notas || '',
        fecha_vigencia_desde: fechaVigenciaDesde,
        fecha_vigencia_hasta: fechaVigenciaHasta
      });
      
      setUsarHorario(!!codigo.hora_inicio && !!codigo.hora_fin);
      setUsarVigenciaHasta(!!codigo.fecha_vigencia_hasta);
      
      // ✨ DETECTAR SI EL CÓDIGO EXISTENTE CRUZA MEDIANOCHE
      if (codigo.hora_inicio && codigo.hora_fin) {
        const cruza = detectaCruzaMedianoche(codigo.hora_inicio, codigo.hora_fin);
        setCruzaMedianoche(cruza);
      }
    } else if (show) {
      // Reset para nuevo código
      setFormData({
        codigo: '',
        descripcion: '',
        notas: '',
        tipo: 'guardia_pasiva',
        dias_aplicables: 'L,M,X,J,V,S,D',
        hora_inicio: null,
        hora_fin: null,
        factor_multiplicador: 1,
        fecha_vigencia_desde: new Date(),
        fecha_vigencia_hasta: null,
        estado: 'activo'
      });
      setUsarHorario(false);
      setUsarVigenciaHasta(false);
      setCruzaMedianoche(false); // ✨ RESETEAR CHECKBOX
    }
    
    // Limpiar errores
    setErrors({});
    setError(null);
  }, [show, codigo]);

  // ✨ DETECTAR AUTOMÁTICAMENTE CUANDO CAMBIAN LAS HORAS
  useEffect(() => {
    if (formData.hora_inicio && formData.hora_fin && !errors.hora_inicio && !errors.hora_fin) {
      const cruza = detectaCruzaMedianoche(formData.hora_inicio, formData.hora_fin);
      if (cruza !== cruzaMedianoche) {
        setCruzaMedianoche(cruza);
      }
    }
  }, [formData.hora_inicio, formData.hora_fin]);
  
  // Manejar cambios en inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Para factor_multiplicador, asegurar que es un número
    if (name === 'factor_multiplicador') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        setFormData({ ...formData, [name]: numValue });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    // Limpiar error específico
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };
  
  // Manejar cambios en DatePicker
  const handleDateChange = (date: Date | null, field: string) => {
    setFormData({ ...formData, [field]: date });
    
    // Limpiar error específico
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };
  
  // Manejar cambios en días aplicables
  const handleDiasChange = (dia: string) => {
    const diasActuales = formData.dias_aplicables ? formData.dias_aplicables.split(',') : [];
    
    if (diasActuales.includes(dia)) {
      // Quitar día
      const nuevosDias = diasActuales.filter(d => d !== dia);
      setFormData({ ...formData, dias_aplicables: nuevosDias.join(',') });
    } else {
      // Agregar día
      const nuevosDias = [...diasActuales, dia].sort((a, b) => {
        const orden = ['L', 'M', 'X', 'J', 'V', 'S', 'D', 'F'];
        return orden.indexOf(a) - orden.indexOf(b);
      });
      setFormData({ ...formData, dias_aplicables: nuevosDias.join(',') });
    }
  };
  
  // Manejar cambio en "usar horario"
  const handleUsarHorarioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setUsarHorario(checked);
    
    if (!checked) {
      setFormData({ ...formData, hora_inicio: null, hora_fin: null });
      setCruzaMedianoche(false); // ✨ RESETEAR CHECKBOX
    } else {
      setFormData({ ...formData, hora_inicio: '09:00', hora_fin: '17:00' });
      setCruzaMedianoche(false);
    }
  };

  // ✨ MANEJAR CAMBIO EN CHECKBOX "CRUZA MEDIANOCHE"
  const handleCruzaMedianocheChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setCruzaMedianoche(checked);
    
    // Sugerir horarios típicos cuando se activa
    if (checked && (!formData.hora_inicio || !formData.hora_fin)) {
      setFormData({ 
        ...formData, 
        hora_inicio: '21:00', 
        hora_fin: '06:00' 
      });
    }
  };
  
  // Manejar cambio en "usar vigencia hasta"
  const handleUsarVigenciaHastaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setUsarVigenciaHasta(checked);
    
    if (!checked) {
      setFormData({ ...formData, fecha_vigencia_hasta: null });
    } else {
      // Establecer fecha de fin un año después por defecto
      const fechaFin = new Date(formData.fecha_vigencia_desde);
      fechaFin.setFullYear(fechaFin.getFullYear() + 1);
      setFormData({ ...formData, fecha_vigencia_hasta: fechaFin });
    }
  };
  
  // ✨ VALIDAR FORMULARIO CON LÓGICA DE MEDIANOCHE
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.codigo.trim()) {
      newErrors.codigo = 'El código es obligatorio';
    }
    
    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es obligatoria';
    }
    
    if (!formData.dias_aplicables || formData.dias_aplicables.split(',').length === 0) {
      newErrors.dias_aplicables = 'Debe seleccionar al menos un día';
    }
    
    if (usarHorario) {
      if (!formData.hora_inicio) {
        newErrors.hora_inicio = 'La hora de inicio es obligatoria';
      }
      
      if (!formData.hora_fin) {
        newErrors.hora_fin = 'La hora de fin es obligatoria';
      }
      
      // ✨ VALIDACIÓN MEJORADA PARA HORARIOS QUE CRUZAN MEDIANOCHE
      if (formData.hora_inicio && formData.hora_fin) {
        const horasIguales = formData.hora_inicio === formData.hora_fin;
        
        if (horasIguales) {
          newErrors.hora_fin = 'La hora de fin no puede ser igual a la hora de inicio';
        } else if (!cruzaMedianoche && formData.hora_inicio >= formData.hora_fin) {
          newErrors.hora_fin = 'La hora de fin debe ser posterior a la hora de inicio, o marque "Cruza medianoche"';
        }
        
        // Validar que si se marca "cruza medianoche", las horas realmente lo hagan
        if (cruzaMedianoche && formData.hora_inicio <= formData.hora_fin) {
          newErrors.hora_inicio = 'Si cruza medianoche, la hora de inicio debe ser mayor que la de fin';
        }
      }
    }
    
    if (!formData.fecha_vigencia_desde) {
      newErrors.fecha_vigencia_desde = 'La fecha de vigencia desde es obligatoria';
    }
    
    if (usarVigenciaHasta && !formData.fecha_vigencia_hasta) {
      newErrors.fecha_vigencia_hasta = 'La fecha de vigencia hasta es obligatoria';
    }
    
    if (
      usarVigenciaHasta && 
      formData.fecha_vigencia_desde && 
      formData.fecha_vigencia_hasta && 
      formData.fecha_vigencia_desde >= formData.fecha_vigencia_hasta
    ) {
      newErrors.fecha_vigencia_hasta = 'La fecha de vigencia hasta debe ser posterior a la fecha desde';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Guardar código
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Preparar datos para enviar
      const dataToSend = {
        ...formData,
        notas: formData.notas || null
        // Nota: No necesitamos enviar el flag cruzaMedianoche al backend
        // porque se puede inferir comparando hora_inicio con hora_fin
      };
      
      let response;
      const isEditing = codigo?.id;
      
      if (isEditing) {
        response = await api.put(`/codigos/${codigo.id}`, dataToSend);
      } else {
        response = await api.post('/codigos', dataToSend);
      }
      
      // Mostrar confirmación de éxito
      await Swal.fire({
        title: isEditing ? '¡Código actualizado!' : '¡Código creado!',
        html: `
          <div>
            <p><strong>Código:</strong> ${formData.codigo}</p>
            <p><strong>Descripción:</strong> ${formData.descripcion}</p>
            ${formData.hora_inicio && formData.hora_fin ? 
              `<p><strong>Horario:</strong> ${getDescripcionHorario()}</p>` : 
              ''
            }
          </div>
        `,
        icon: 'success',
        confirmButtonColor: '#28a745',
        confirmButtonText: 'Perfecto',
        timer: 4000,
        timerProgressBar: true,
        showClass: {
          popup: 'animate__animated animate__fadeInDown'
        },
        hideClass: {
          popup: 'animate__animated animate__fadeOutUp'
        }
      });
      
      onHide(true);
      
    } catch (error: any) {
      console.error('Error al guardar código:', error);
      
      if (error.response?.status === 409) {
        Swal.fire({
          title: 'Código duplicado',
          text: error.response?.data?.message || `El código "${formData.codigo}" ya existe en el sistema.`,
          icon: 'warning',
          confirmButtonColor: '#ffc107',
          confirmButtonText: 'Entendido',
          allowOutsideClick: false,
          showClass: {
            popup: 'animate__animated animate__shakeX'
          }
        }).then(() => {
          const codigoInput = document.getElementById('formCodigo');
          if (codigoInput) {
            (codigoInput as HTMLInputElement).select();
            codigoInput.focus();
          }
        });
      } else {
        Swal.fire({
          title: 'Error al guardar',
          text: error.response?.data?.message || 'Ocurrió un error inesperado.',
          icon: 'error',
          confirmButtonColor: '#dc3545',
          confirmButtonText: 'Entendido',
          showClass: {
            popup: 'animate__animated animate__shakeX'
          }
        });
        
        setError(error.response?.data?.message || 'Error al guardar el código');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Modal
      show={show}
      onHide={() => onHide(false)}
      size="lg"
      backdrop="static"
      keyboard={false}
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {codigo?.id ? 'Editar Código' : 'Nuevo Código de Facturación'}
        </Modal.Title>
      </Modal.Header>
      
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}
          
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="formCodigo">
                <Form.Label>Código *</Form.Label>
                <Form.Control
                  type="text"
                  name="codigo"
                  value={formData.codigo}
                  onChange={handleInputChange}
                  isInvalid={!!errors.codigo}
                  disabled={codigo?.id !== undefined}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.codigo}
                </Form.Control.Feedback>
                <Form.Text className="text-muted">
                  Código alfanumérico para sistema administrativo.
                </Form.Text>
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group controlId="formTipo">
                <Form.Label>Tipo *</Form.Label>
                <Form.Select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleInputChange}
                  isInvalid={!!errors.tipo}
                >
                  <option value="guardia_pasiva">Guardia Pasiva</option>
                  <option value="guardia_activa">Guardia Activa</option>
                  <option value="hora_nocturna">Hora Nocturna</option>
                  <option value="feriado">Feriado</option>
                  <option value="fin_semana">Fin de Semana</option>
                  <option value="adicional">Adicional</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.tipo}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
          
          <Form.Group className="mb-3" controlId="formDescripcion">
            <Form.Label>Descripción *</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              isInvalid={!!errors.descripcion}
            />
            <Form.Control.Feedback type="invalid">
              {errors.descripcion}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" controlId="formNotas">
            <Form.Label>Notas Informativas</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="notas"
              value={formData.notas || ''}
              onChange={handleInputChange}
              placeholder="Información adicional sobre la aplicación de este código..."
            />
            <Form.Text className="text-muted">
              Campo opcional para agregar detalles sobre cuándo y cómo se aplica este código.
            </Form.Text>
          </Form.Group>
          
          <Row className="mb-3">
            <Col>
              <Form.Label>Días Aplicables *</Form.Label>
              <div className="d-flex flex-wrap gap-2">
                {['L', 'M', 'X', 'J', 'V', 'S', 'D', 'F'].map(dia => {
                  const isActive = formData.dias_aplicables?.includes(dia);
                  const label = 
                    dia === 'L' ? 'Lunes' :
                    dia === 'M' ? 'Martes' :
                    dia === 'X' ? 'Miércoles' :
                    dia === 'J' ? 'Jueves' :
                    dia === 'V' ? 'Viernes' :
                    dia === 'S' ? 'Sábado' :
                    dia === 'D' ? 'Domingo' :
                    'Feriados';
                  
                  return (
                    <Button
                      key={dia}
                      variant={isActive ? 'primary' : 'outline-secondary'}
                      className="py-1 px-2"
                      type="button"
                      onClick={() => handleDiasChange(dia)}
                    >
                      {label}
                    </Button>
                  );
                })}
              </div>
              {errors.dias_aplicables && (
                <div className="text-danger mt-2 small">
                  {errors.dias_aplicables}
                </div>
              )}
            </Col>
          </Row>
          
          <Row className="mb-3">
            <Col>
              <Form.Group controlId="formUsarHorario">
                <Form.Check
                  type="switch"
                  label="Aplicar en un rango horario específico"
                  checked={usarHorario}
                  onChange={handleUsarHorarioChange}
                />
              </Form.Group>
            </Col>
          </Row>
          
          {usarHorario && (
            <>
              {/* ✨ NUEVO CHECKBOX PARA MEDIANOCHE */}
              <Row className="mb-3">
                <Col>
                  <Form.Group controlId="formCruzaMedianoche">
                    <Form.Check
                      type="switch"
                      label="Horario cruza medianoche (ej: 21:00 - 06:00)"
                      checked={cruzaMedianoche}
                      onChange={handleCruzaMedianocheChange}
                    />
                    <Form.Text className="text-muted">
                      Active esta opción para horarios que van de un día al siguiente
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group controlId="formHoraInicio">
                    <Form.Label>
                      Hora de inicio {cruzaMedianoche && <span className="text-primary">(día actual)</span>}
                    </Form.Label>
                    <Form.Control
                      type="time"
                      name="hora_inicio"
                      value={formData.hora_inicio || ''}
                      onChange={handleInputChange}
                      isInvalid={!!errors.hora_inicio}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.hora_inicio}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                
                <Col md={6}>
                  <Form.Group controlId="formHoraFin">
                    <Form.Label>
                      Hora de fin {cruzaMedianoche && <span className="text-warning">(día siguiente)</span>}
                    </Form.Label>
                    <Form.Control
                      type="time"
                      name="hora_fin"
                      value={formData.hora_fin || ''}
                      onChange={handleInputChange}
                      isInvalid={!!errors.hora_fin}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.hora_fin}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              {/* ✨ MOSTRAR DESCRIPCIÓN DEL HORARIO */}
              {formData.hora_inicio && formData.hora_fin && (
                <Row className="mb-3">
                  <Col>
                    <Alert variant={cruzaMedianoche ? "warning" : "info"} className="py-2">
                      <small>
                        <i className="bi bi-clock me-1"></i>
                        <strong>Horario configurado:</strong> {getDescripcionHorario()}
                      </small>
                    </Alert>
                  </Col>
                </Row>
              )}
            </>
          )}
          
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="formFactorMultiplicador">
                <Form.Label>Factor Multiplicador</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0.01"
                  name="factor_multiplicador"
                  value={formData.factor_multiplicador}
                  onChange={handleInputChange}
                  isInvalid={!!errors.factor_multiplicador}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.factor_multiplicador}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
          
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="formFechaVigenciaDesde">
                <Form.Label>Fecha Vigencia Desde *</Form.Label>
                <DatePicker
                  selected={formData.fecha_vigencia_desde instanceof Date ? formData.fecha_vigencia_desde : undefined}
                  onChange={(date: Date | null) => handleDateChange(date, 'fecha_vigencia_desde')}
                  className={`form-control ${errors.fecha_vigencia_desde ? 'is-invalid' : ''}`}
                  dateFormat="dd/MM/yyyy"
                  locale={es}
                />
                {errors.fecha_vigencia_desde && (
                  <div className="invalid-feedback d-block">
                    {errors.fecha_vigencia_desde}
                  </div>
                )}
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group controlId="formUsarVigenciaHasta">
                <Form.Check
                  type="switch"
                  label="Establecer fecha de fin de vigencia"
                  checked={usarVigenciaHasta}
                  onChange={handleUsarVigenciaHastaChange}
                  className="mb-2"
                />
                
                {usarVigenciaHasta && (
                  <>
                    <DatePicker
                      selected={formData.fecha_vigencia_hasta instanceof Date ? formData.fecha_vigencia_hasta : undefined}
                      onChange={(date: Date | null) => handleDateChange(date, 'fecha_vigencia_hasta')}
                      className={`form-control ${errors.fecha_vigencia_hasta ? 'is-invalid' : ''}`}
                      dateFormat="dd/MM/yyyy"
                      locale={es}
                      minDate={formData.fecha_vigencia_desde instanceof Date ? new Date(formData.fecha_vigencia_desde) : undefined}
                    />
                    {errors.fecha_vigencia_hasta && (
                      <div className="invalid-feedback d-block">
                        {errors.fecha_vigencia_hasta}
                      </div>
                    )}
                  </>
                )}
              </Form.Group>
            </Col>
          </Row>
          
          <Form.Group className="mb-3" controlId="formEstado">
            <Form.Label>Estado</Form.Label>
            <Form.Select
              name="estado"
              value={formData.estado}
              onChange={handleInputChange}
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        
        <Modal.Footer>
          <Button variant="secondary" onClick={() => onHide(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Guardando...
              </>
            ) : codigo?.id ? 'Actualizar' : 'Guardar'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CodigoModal;