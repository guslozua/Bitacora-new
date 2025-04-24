import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';

interface Placa {
  id?: number;
  numero_placa: string;
  titulo: string;
  descripcion: string;
  impacto: 'bajo' | 'medio' | 'alto';
  fecha_inicio: string;
  fecha_cierre?: string | null;
  cerrado_por?: string | null;
  causa_resolutiva?: string | null;
}

interface PlacaFormModalProps {
  show: boolean;
  onHide: () => void;
  onSave: () => void;
  placa?: Placa | null;
}

const PlacaFormModal: React.FC<PlacaFormModalProps> = ({ show, onHide, onSave, placa = null }) => {
  const defaultPlaca: Placa = {
    numero_placa: '',
    titulo: '',
    descripcion: '',
    impacto: 'medio',
    fecha_inicio: new Date().toISOString().slice(0, 16),
    fecha_cierre: '',
    cerrado_por: '',
    causa_resolutiva: ''
  };

  const [formData, setFormData] = useState<Placa>(placa || defaultPlaca);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Lista de usuarios para el campo "Cerrado por"
  const usuariosCierre = [
    'Brian Ledezma',
    'Sabrina Bustos',
    'Jaime Ocampo',
    'Gustavo Lozua',
    'Pablo Palomanes',
    'Guillermo Jacob',
    'Diego D´Agostino',
    'Carlos Beltrame',
    'Luciano Centurion',
    'Gaston Mingarelli'
  ];

  useEffect(() => {
    if (show) {
      setFormData(placa || defaultPlaca);
      setError('');
      setSuccess(false);
    }
  }, [show, placa]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.numero_placa) return 'El número de placa es obligatorio';
    if (!formData.titulo) return 'El título es obligatorio';
    if (!formData.impacto) return 'El impacto es obligatorio';
    if (!formData.fecha_inicio) return 'La fecha de inicio es obligatoria';
    
    // Si hay fecha de cierre, debe haber causa resolutiva y cerrado por
    if (formData.fecha_cierre && !formData.cerrado_por) {
      return 'Si hay fecha de cierre, debe indicar quién cerró la placa';
    }
    if (formData.fecha_cierre && !formData.causa_resolutiva) {
      return 'Si hay fecha de cierre, debe indicar la causa resolutiva';
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      if (placa?.id) {
        // Actualizar placa existente
        await axios.put(`http://localhost:5000/api/placas/${placa.id}`, formData);
      } else {
        // Crear nueva placa
        await axios.post('http://localhost:5000/api/placas', formData);
      }
      
      setSuccess(true);
      setTimeout(() => {
        onSave();
        onHide();
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar la placa');
    } finally {
      setLoading(false);
    }
  };

  // Formatear fecha para input datetime-local
  const formatDateForInput = (isoDate: string | null | undefined) => {
    if (!isoDate) return '';
    return isoDate.slice(0, 16); // Formato YYYY-MM-DDTHH:MM
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      backdrop="static" 
      size="lg" 
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {placa?.id ? 'Editar Placa' : 'Nueva Placa'}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">Placa guardada correctamente</Alert>}
          
          <div className="row g-3">
            <div className="col-md-6">
              <Form.Group controlId="numero_placa">
                <Form.Label>Número de Placa</Form.Label>
                <Form.Control
                  type="text"
                  name="numero_placa"
                  value={formData.numero_placa}
                  onChange={handleChange}
                  placeholder="Ej: PLACA-2025-001"
                  required
                />
              </Form.Group>
            </div>
            
            <div className="col-md-6">
              <Form.Group controlId="impacto">
                <Form.Label>Nivel de Impacto</Form.Label>
                <Form.Select
                  name="impacto"
                  value={formData.impacto}
                  onChange={handleChange}
                  required
                >
                  <option value="bajo">Bajo</option>
                  <option value="medio">Medio</option>
                  <option value="alto">Alto</option>
                </Form.Select>
              </Form.Group>
            </div>
            
            <div className="col-12">
              <Form.Group controlId="titulo">
                <Form.Label>Título</Form.Label>
                <Form.Control
                  type="text"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  placeholder="Título descriptivo de la placa"
                  required
                />
              </Form.Group>
            </div>
            
            <div className="col-12">
              <Form.Group controlId="descripcion">
                <Form.Label>Descripción</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  placeholder="Descripción detallada de la placa o novedad"
                />
              </Form.Group>
            </div>
            
            <div className="col-md-6">
              <Form.Group controlId="fecha_inicio">
                <Form.Label>Fecha y Hora de Inicio</Form.Label>
                <Form.Control
                  type="datetime-local"
                  name="fecha_inicio"
                  value={formatDateForInput(formData.fecha_inicio)}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </div>
            
            <div className="col-md-6">
              <Form.Group controlId="fecha_cierre">
                <Form.Label>Fecha y Hora de Cierre (opcional)</Form.Label>
                <Form.Control
                  type="datetime-local"
                  name="fecha_cierre"
                  value={formatDateForInput(formData.fecha_cierre)}
                  onChange={handleChange}
                />
                <Form.Text className="text-muted">
                  Dejar en blanco si aún no se ha resuelto
                </Form.Text>
              </Form.Group>
            </div>
            
            <div className="col-md-6">
              <Form.Group controlId="cerrado_por">
                <Form.Label>Cerrado por (si aplica)</Form.Label>
                <Form.Select
                  name="cerrado_por"
                  value={formData.cerrado_por || ''}
                  onChange={handleChange}
                >
                  <option value="">-- Seleccione Usuario --</option>
                  {usuariosCierre.map(usuario => (
                    <option key={usuario} value={usuario}>{usuario}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
            
            <div className="col-12">
              <Form.Group controlId="causa_resolutiva">
                <Form.Label>Causa o Acción Resolutiva (si aplica)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="causa_resolutiva"
                  value={formData.causa_resolutiva || ''}
                  onChange={handleChange}
                  placeholder="Descripción de la solución implementada"
                />
              </Form.Group>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            type="submit" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Guardando...
              </>
            ) : (
              placa?.id ? 'Actualizar' : 'Guardar'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default PlacaFormModal;