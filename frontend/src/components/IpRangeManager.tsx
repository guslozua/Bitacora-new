// components/IpRangeManager.tsx
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Table, Alert, Card, Badge, InputGroup } from 'react-bootstrap';
import { sessionAnalysisService } from '../services/sessionAnalysisService';

interface IpRange {
  id: number;
  nombre_call_center: string;
  ip_inicio: string;
  ip_fin: string;
  descripcion: string;
  activo: boolean;
  created_at: string;
}

interface IpRangeManagerProps {
  show: boolean;
  onHide: () => void;
  onRangesUpdated?: () => void;
}

const IpRangeManager: React.FC<IpRangeManagerProps> = ({ show, onHide, onRangesUpdated }) => {
  const [ranges, setRanges] = useState<IpRange[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRange, setEditingRange] = useState<IpRange | null>(null);
  const [alert, setAlert] = useState<{type: string, message: string} | null>(null);
  const [formData, setFormData] = useState({
    nombre_call_center: '',
    ip_inicio: '',
    ip_fin: '',
    descripcion: ''
  });

  useEffect(() => {
    if (show) {
      loadRanges();
    }
  }, [show]);

  const loadRanges = async () => {
    try {
      setLoading(true);
      const response = await sessionAnalysisService.getIpRanges();
      if (response.success) {
        setRanges(response.data);
      }
    } catch (error) {
      console.error('Error cargando rangos IP:', error);
      const errorMessage = sessionAnalysisService.handleError(error);
      setAlert({type: 'danger', message: errorMessage});
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.nombre_call_center || !formData.ip_inicio || !formData.ip_fin) {
        setAlert({type: 'warning', message: 'Por favor complete todos los campos requeridos'});
        return;
      }

      // Validar formato de IPs
      if (!sessionAnalysisService.validateIpFormat(formData.ip_inicio)) {
        setAlert({type: 'danger', message: 'Formato de IP inicial inválido'});
        return;
      }

      if (!sessionAnalysisService.validateIpFormat(formData.ip_fin)) {
        setAlert({type: 'danger', message: 'Formato de IP final inválido'});
        return;
      }

      let response;
      if (editingRange) {
        response = await sessionAnalysisService.updateIpRange(editingRange.id, {
          ...formData,
          activo: true
        });
      } else {
        response = await sessionAnalysisService.saveIpRange(formData);
      }

      if (response.success) {
        setAlert({
          type: 'success', 
          message: editingRange ? 'Rango actualizado exitosamente' : 'Rango agregado exitosamente'
        });
        setShowForm(false);
        setEditingRange(null);
        resetForm();
        loadRanges();
        if (onRangesUpdated) onRangesUpdated();
      }
    } catch (error: any) {
      const errorMessage = sessionAnalysisService.handleError(error);
      setAlert({type: 'danger', message: errorMessage});
    }
  };

  const handleEdit = (range: IpRange) => {
    setEditingRange(range);
    setFormData({
      nombre_call_center: range.nombre_call_center,
      ip_inicio: range.ip_inicio,
      ip_fin: range.ip_fin,
      descripcion: range.descripcion || ''
    });
    setShowForm(true);
    setAlert(null);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este rango IP?')) {
      return;
    }

    try {
      const response = await sessionAnalysisService.deleteIpRange(id);
      if (response.success) {
        setAlert({type: 'success', message: 'Rango eliminado exitosamente'});
        loadRanges();
        if (onRangesUpdated) onRangesUpdated();
      }
    } catch (error: any) {
      const errorMessage = sessionAnalysisService.handleError(error);
      setAlert({type: 'danger', message: errorMessage});
    }
  };

  const resetForm = () => {
    setFormData({
      nombre_call_center: '',
      ip_inicio: '',
      ip_fin: '',
      descripcion: ''
    });
    setEditingRange(null);
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar alertas de validación en tiempo real
    if (field === 'ip_inicio' || field === 'ip_fin') {
      if (!value || sessionAnalysisService.validateIpFormat(value)) {
        setAlert(null);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingRange(null);
    resetForm();
    setAlert(null);
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-router me-2 text-primary"></i>
          Gestión de Rangos IP - Call Centers
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {alert && (
          <Alert 
            variant={alert.type} 
            dismissible 
            onClose={() => setAlert(null)}
            className="mb-3 d-flex align-items-center"
          >
            <i className={`bi ${alert.type === 'success' ? 'bi-check-circle' : alert.type === 'danger' ? 'bi-exclamation-triangle' : 'bi-info-circle'} me-2`}></i>
            {alert.message}
          </Alert>
        )}

        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h6 className="mb-1">Rangos IP Configurados</h6>
            <small className="text-muted">
              Gestiona los rangos de IP para identificar automáticamente call centers
            </small>
          </div>
          <Button 
            variant={showForm ? "outline-secondary" : "primary"} 
            size="sm"
            onClick={() => showForm ? handleCancel() : setShowForm(true)}
          >
            <i className={`bi ${showForm ? 'bi-x-lg' : 'bi-plus-lg'} me-1`}></i>
            {showForm ? 'Cancelar' : 'Nuevo Rango'}
          </Button>
        </div>

        {showForm && (
          <Card className="mb-4 border-primary bg-primary bg-opacity-5">
            <Card.Header className="bg-primary bg-opacity-10 border-primary">
              <h6 className="mb-0 text-primary d-flex align-items-center">
                <i className={`bi ${editingRange ? 'bi-pencil' : 'bi-plus-circle'} me-2`}></i>
                {editingRange ? 'Editar Rango IP' : 'Agregar Nuevo Rango IP'}
              </h6>
            </Card.Header>
            <Card.Body>
              <Form>
                <div className="row">
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">
                        Nombre del Call Center *
                      </Form.Label>
                      <InputGroup>
                        <InputGroup.Text>
                          <i className="bi bi-building"></i>
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          placeholder="Ej: Call Center Norte"
                          value={formData.nombre_call_center}
                          onChange={(e) => handleFormChange('nombre_call_center', e.target.value)}
                        />
                      </InputGroup>
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Descripción</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>
                          <i className="bi bi-info-circle"></i>
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          placeholder="Descripción opcional"
                          value={formData.descripcion}
                          onChange={(e) => handleFormChange('descripcion', e.target.value)}
                        />
                      </InputGroup>
                    </Form.Group>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">IP Inicio *</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>
                          <i className="bi bi-arrow-right"></i>
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          placeholder="Ej: 192.168.1.1"
                          value={formData.ip_inicio}
                          onChange={(e) => handleFormChange('ip_inicio', e.target.value)}
                          isInvalid={!!formData.ip_inicio && !sessionAnalysisService.validateIpFormat(formData.ip_inicio)}
                        />
                        <Form.Control.Feedback type="invalid">
                          Formato de IP inválido
                        </Form.Control.Feedback>
                      </InputGroup>
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">IP Fin *</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>
                          <i className="bi bi-arrow-left"></i>
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          placeholder="Ej: 192.168.1.100"
                          value={formData.ip_fin}
                          onChange={(e) => handleFormChange('ip_fin', e.target.value)}
                          isInvalid={!!formData.ip_fin && !sessionAnalysisService.validateIpFormat(formData.ip_fin)}
                        />
                        <Form.Control.Feedback type="invalid">
                          Formato de IP inválido
                        </Form.Control.Feedback>
                      </InputGroup>
                    </Form.Group>
                  </div>
                </div>
                <div className="d-flex justify-content-end gap-2">
                  <Button 
                    variant="outline-secondary" 
                    onClick={handleCancel}
                  >
                    <i className="bi bi-x-lg me-1"></i>
                    Cancelar
                  </Button>
                  <Button 
                    variant="success" 
                    onClick={handleSave}
                    disabled={!formData.nombre_call_center || !formData.ip_inicio || !formData.ip_fin}
                  >
                    <i className={`bi ${editingRange ? 'bi-check2-square' : 'bi-check-lg'} me-1`}></i>
                    {editingRange ? 'Actualizar Rango' : 'Guardar Rango'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        )}

        <div className="table-responsive">
          <Table striped hover className="mb-0">
            <thead className="table-dark">
              <tr>
                <th className="border-0">
                  <i className="bi bi-building me-1"></i>
                  Call Center
                </th>
                <th className="border-0">
                  <i className="bi bi-router me-1"></i>
                  Rango IP
                </th>
                <th className="border-0">Descripción</th>
                <th className="border-0 text-center">Estado</th>
                <th className="border-0 text-center">Fecha Creación</th>
                <th className="border-0 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-4">
                    <div className="d-flex justify-content-center align-items-center">
                      <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                      Cargando rangos IP...
                    </div>
                  </td>
                </tr>
              ) : ranges.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-5">
                    <i className="bi bi-inbox fs-1 d-block mb-2 text-muted"></i>
                    <h6 className="text-muted">No hay rangos IP configurados</h6>
                    <p className="small text-muted mb-3">
                      Agrega rangos IP para identificar automáticamente call centers
                    </p>
                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={() => setShowForm(true)}
                    >
                      <i className="bi bi-plus-lg me-1"></i>
                      Agregar Primer Rango
                    </Button>
                  </td>
                </tr>
              ) : (
                ranges.map((range) => (
                  <tr key={range.id}>
                    <td className="align-middle">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-building-fill text-primary me-2 fs-5"></i>
                        <div>
                          <div className="fw-bold">{range.nombre_call_center}</div>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle">
                      <div className="d-flex align-items-center">
                        <code className="bg-light px-2 py-1 rounded me-1">{range.ip_inicio}</code>
                        <i className="bi bi-arrow-right text-muted mx-1"></i>
                        <code className="bg-light px-2 py-1 rounded ms-1">{range.ip_fin}</code>
                      </div>
                    </td>
                    <td className="align-middle">
                      <small className="text-muted">
                        {range.descripcion || 'Sin descripción'}
                      </small>
                    </td>
                    <td className="text-center align-middle">
                      <Badge bg={range.activo ? 'success' : 'secondary'}>
                        <i className={`bi ${range.activo ? 'bi-check-circle' : 'bi-pause-circle'} me-1`}></i>
                        {range.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="text-center align-middle">
                      <small className="text-muted">
                        {new Date(range.created_at).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit'
                        })}
                      </small>
                    </td>
                    <td className="text-center align-middle">
                      <div className="d-flex justify-content-center gap-1">
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => handleEdit(range)}
                          title="Editar rango"
                        >
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => handleDelete(range.id)}
                          title="Eliminar rango"
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>

        {/* Información de ayuda */}
        <Card className="mt-3 border-info bg-info bg-opacity-5">
          <Card.Body className="py-3">
            <h6 className="text-info mb-2 d-flex align-items-center">
              <i className="bi bi-lightbulb me-2"></i>
              Información Importante
            </h6>
            <div className="row">
              <div className="col-md-6">
                <small className="text-muted">
                  <strong>¿Cómo funciona?</strong><br/>
                  • Los rangos IP definen qué direcciones pertenecen a cada call center<br/>
                  • Las IPs fuera de estos rangos se clasifican como "Home Office"<br/>
                  • Los cambios se aplicarán en el próximo archivo que proceses
                </small>
              </div>
              <div className="col-md-6">
                <small className="text-muted">
                  <strong>Consejos:</strong><br/>
                  • Asegúrate de que los rangos no se superpongan<br/>
                  • Usa rangos específicos para mayor precisión<br/>
                  • Puedes editar o eliminar rangos en cualquier momento
                </small>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          <i className="bi bi-x-circle me-1"></i>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default IpRangeManager;