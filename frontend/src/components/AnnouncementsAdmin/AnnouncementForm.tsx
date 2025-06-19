// src/components/AnnouncementsAdmin/AnnouncementForm.tsx
import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Card, Alert, InputGroup, Badge } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { useTheme } from '../../context/ThemeContext';
import announcementsService, { Announcement, AnnouncementFormData } from '../../services/announcementsService';

interface AnnouncementFormProps {
  announcement?: Announcement | null;
  onSuccess: (message: string) => void;
  onCancel: () => void;
}

const AnnouncementForm: React.FC<AnnouncementFormProps> = ({
  announcement,
  onSuccess,
  onCancel
}) => {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const [formData, setFormData] = useState<AnnouncementFormData>(() => 
    announcementsService.prepareFormData(announcement || undefined)
  );

  const [initialFormData, setInitialFormData] = useState<AnnouncementFormData>(() => 
    announcementsService.prepareFormData(announcement || undefined)
  );

  // Actualizar formulario cuando cambia el anuncio
  useEffect(() => {
    const newFormData = announcementsService.prepareFormData(announcement || undefined);
    setFormData(newFormData);
    setInitialFormData(newFormData);
    setErrors([]);
    setHasUnsavedChanges(false);
  }, [announcement]);

  // Detectar cambios en el formulario
  useEffect(() => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData);
    setHasUnsavedChanges(hasChanges);
  }, [formData, initialFormData]);

  const isEditing = Boolean(announcement?.id);

  const handleInputChange = (field: keyof AnnouncementFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar errores cuando el usuario empieza a escribir
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleTypeChange = (type: 'info' | 'warning' | 'success' | 'danger') => {
    const defaultIcon = announcementsService.getDefaultIcon(type);
    setFormData(prev => ({
      ...prev,
      type,
      icon: defaultIcon
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar datos
    const validation = announcementsService.validateAnnouncementData(formData);
    if (!validation.valid) {
      setErrors(validation.errors);
      
      // Mostrar errores con SweetAlert2
      Swal.fire({
        title: 'Errores en el formulario',
        html: `
          <div class="text-start">
            <p>Por favor, corrija los siguientes errores:</p>
            <ul class="text-danger">
              ${validation.errors.map(error => `<li>${error}</li>`).join('')}
            </ul>
          </div>
        `,
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#dc3545'
      });
      return;
    }

    // Confirmar guardado con SweetAlert2
    const actionText = isEditing ? 'actualizar' : 'crear';
    const result = await Swal.fire({
      title: `¿${actionText.charAt(0).toUpperCase() + actionText.slice(1)} anuncio?`,
      html: `
        <div class="text-start">
          <p><strong>Título:</strong> ${formData.title}</p>
          <p><strong>Tipo:</strong> ${formData.type}</p>
          <p><strong>Estado:</strong> ${formData.active ? 'Activo' : 'Inactivo'}</p>
          <p><strong>Prioridad:</strong> ${formData.priority}</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: `Sí, ${actionText}`,
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      setErrors([]);
      
      if (isEditing) {
        const response = await announcementsService.updateAnnouncement(announcement!.id, formData);
        if (response.success) {
          onSuccess('Anuncio actualizado correctamente');
        }
      } else {
        const response = await announcementsService.createAnnouncement(formData);
        if (response.success) {
          onSuccess('Anuncio creado correctamente');
        }
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Error al guardar el anuncio';
      setErrors([errorMessage]);
      
      // Mostrar error con SweetAlert2
      Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#dc3545'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    // Si hay cambios sin guardar, confirmar con SweetAlert2
    if (hasUnsavedChanges) {
      const result = await Swal.fire({
        title: '¿Descartar cambios?',
        text: 'Tiene cambios sin guardar. ¿Está seguro que desea salir sin guardar?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, descartar',
        cancelButtonText: 'Continuar editando'
      });

      if (!result.isConfirmed) return;
    }

    onCancel();
  };

  const getPreviewStyle = () => {
    const baseStyle = {
      background: announcementsService.getTypeColor(formData.type),
      color: 'white',
      padding: '1rem',
      borderRadius: '0.5rem',
      minHeight: '120px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center' as 'center'
    };
    
    return baseStyle;
  };

  return (
    <div>
      {/* Mostrar errores - mantener para compatibilidad */}
      {errors.length > 0 && (
        <Alert variant="danger" className="mb-4">
          <Alert.Heading>Error en el formulario</Alert.Heading>
          <ul className="mb-0">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Row>
          {/* Columna izquierda - Formulario */}
          <Col lg={8}>
            <Card className="shadow-sm border-0 themed-card mb-4">
              <Card.Header>
                <h5 className="mb-0">
                  <i className="bi bi-pencil-square me-2"></i>
                  {isEditing ? 'Editar Anuncio' : 'Crear Nuevo Anuncio'}
                  {hasUnsavedChanges && (
                    <Badge bg="warning" className="ms-2">
                      <i className="bi bi-exclamation-circle me-1"></i>
                      Cambios sin guardar
                    </Badge>
                  )}
                </h5>
              </Card.Header>
              <Card.Body>
                {/* Título */}
                <Row className="mb-3">
                  <Col>
                    <Form.Group>
                      <Form.Label className="fw-semibold">
                        Título <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Título del anuncio..."
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        maxLength={255}
                        required
                      />
                      <Form.Text className="text-muted">
                        {formData.title.length}/255 caracteres
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Contenido */}
                <Row className="mb-3">
                  <Col>
                    <Form.Group>
                      <Form.Label className="fw-semibold">
                        Contenido <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        placeholder="Descripción del anuncio..."
                        value={formData.content}
                        onChange={(e) => handleInputChange('content', e.target.value)}
                        maxLength={1000}
                        required
                      />
                      <Form.Text className="text-muted">
                        {formData.content.length}/1000 caracteres
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Tipo e Icono */}
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">Tipo</Form.Label>
                      <div className="d-flex gap-2 flex-wrap">
                        {(['info', 'warning', 'success', 'danger'] as const).map((type) => (
                          <Button
                            key={type}
                            variant={formData.type === type ? type : `outline-${type}`}
                            size="sm"
                            onClick={() => handleTypeChange(type)}
                            type="button"
                          >
                            <i className={`${announcementsService.getDefaultIcon(type)} me-1`}></i>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </Button>
                        ))}
                      </div>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">Icono</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>
                          <i className={formData.icon}></i>
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          placeholder="bi bi-info-circle"
                          value={formData.icon}
                          onChange={(e) => handleInputChange('icon', e.target.value)}
                        />
                      </InputGroup>
                      <Form.Text className="text-muted">
                        Usar iconos de Bootstrap Icons (ej: bi bi-star)
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Prioridad y Audiencia */}
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">Prioridad</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        max="999"
                        value={formData.priority}
                        onChange={(e) => handleInputChange('priority', parseInt(e.target.value) || 0)}
                      />
                      <Form.Text className="text-muted">
                        Mayor número = mayor prioridad (0-999)
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">Audiencia objetivo</Form.Label>
                      <Form.Select
                        value={formData.target_audience}
                        onChange={(e) => handleInputChange('target_audience', e.target.value)}
                      >
                        <option value="all">Todos los usuarios</option>
                        <option value="admin">Solo administradores</option>
                        <option value="editor">Solo editores</option>
                        <option value="user">Solo usuarios normales</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Estado activo */}
                <Row className="mb-3">
                  <Col>
                    <Form.Group>
                      <Form.Check
                        type="switch"
                        id="active-switch"
                        label="Anuncio activo"
                        checked={formData.active}
                        onChange={(e) => handleInputChange('active', e.target.checked)}
                      />
                      <Form.Text className="text-muted">
                        Solo los anuncios activos se mostrarán en el carrusel
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Fechas de vigencia */}
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">Fecha de inicio</Form.Label>
                      <Form.Control
                        type="datetime-local"
                        value={formData.start_date || ''}
                        onChange={(e) => handleInputChange('start_date', e.target.value || null)}
                      />
                      <Form.Text className="text-muted">
                        Opcional. Si no se especifica, se activa inmediatamente
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">Fecha de fin</Form.Label>
                      <Form.Control
                        type="datetime-local"
                        value={formData.end_date || ''}
                        onChange={(e) => handleInputChange('end_date', e.target.value || null)}
                      />
                      <Form.Text className="text-muted">
                        Opcional. Si no se especifica, no expira nunca
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Botón de acción */}
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">Texto del botón</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Ver más"
                        value={formData.action_text || ''}
                        onChange={(e) => handleInputChange('action_text', e.target.value || null)}
                        maxLength={100}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">URL de acción</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="/ruta o https://ejemplo.com"
                        value={formData.action_url || ''}
                        onChange={(e) => handleInputChange('action_url', e.target.value || null)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>

          {/* Columna derecha - Vista previa */}
          <Col lg={4}>
            <Card className="shadow-sm border-0 themed-card position-sticky" style={{ top: '20px' }}>
              <Card.Header>
                <h6 className="mb-0">
                  <i className="bi bi-eye me-2"></i>
                  Vista Previa
                </h6>
              </Card.Header>
              <Card.Body>
                <div style={getPreviewStyle()}>
                  <div>
                    {/* Badge */}
                    <Badge 
                      className="mb-2 px-2 py-1"
                      style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                    >
                      Anuncio
                    </Badge>
                    
                    {/* Icono */}
                    <div className="mb-3">
                      <i 
                        className={`${formData.icon} fs-2`}
                        style={{ color: 'white' }}
                      ></i>
                    </div>
                    
                    {/* Título */}
                    <h6 className="fw-bold mb-2" style={{ color: 'white' }}>
                      {formData.title || 'Título del anuncio'}
                    </h6>
                    
                    {/* Contenido truncado */}
                    <p className="small mb-2" style={{ color: 'rgba(255,255,255,0.9)' }}>
                      {formData.content 
                        ? (formData.content.length > 80 
                          ? `${formData.content.substring(0, 80)}...` 
                          : formData.content)
                        : 'Contenido del anuncio...'
                      }
                    </p>
                    
                    {/* Botón de acción */}
                    {formData.action_text && (
                      <Button
                        size="sm"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          border: '1px solid rgba(255,255,255,0.4)',
                          color: 'white'
                        }}
                        disabled
                      >
                        {formData.action_text}
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Información adicional */}
                <div className="mt-3">
                  <small className="text-muted">
                    <strong>Tipo:</strong> {formData.type}<br />
                    <strong>Prioridad:</strong> {formData.priority}<br />
                    <strong>Estado:</strong> {formData.active ? 'Activo' : 'Inactivo'}<br />
                    <strong>Audiencia:</strong> {formData.target_audience}
                    {hasUnsavedChanges && (
                      <>
                        <br />
                        <span className="text-warning">
                          <i className="bi bi-exclamation-triangle me-1"></i>
                          Cambios pendientes
                        </span>
                      </>
                    )}
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Botones de acción */}
        <div className="d-flex justify-content-end gap-2 mt-4">
          <Button
            variant="secondary"
            onClick={handleCancel}
            disabled={loading}
          >
            <i className="bi bi-x-lg me-2"></i>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                {isEditing ? 'Actualizando...' : 'Creando...'}
              </>
            ) : (
              <>
                <i className={`bi ${isEditing ? 'bi-check-lg' : 'bi-plus-lg'} me-2`}></i>
                {isEditing ? 'Actualizar Anuncio' : 'Crear Anuncio'}
              </>
            )}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default AnnouncementForm;