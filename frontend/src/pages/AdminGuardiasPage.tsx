// src/components/AdminGuardias/AdminGuardias.tsx
import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Table, Button, 
  Form, Modal, Alert, Spinner
} from 'react-bootstrap';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import GuardiaService, { Guardia } from '../services/GuardiaService';

const AdminGuardias: React.FC = () => {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [guardias, setGuardias] = useState<Guardia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedGuardia, setSelectedGuardia] = useState<Guardia | null>(null);
  const [guardiaForm, setGuardiaForm] = useState<Omit<Guardia, 'id'>>({
    fecha: format(new Date(), 'yyyy-MM-dd'),
    usuario: '',
    notas: ''
  });
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  // Cargar guardias al montar el componente
  useEffect(() => {
    loadGuardias()
      .then(() => {
        // Si hay un ID de guardia para editar en los parámetros de URL
        if (editId) {
          const guardiaPorEditar = guardias.find(g => g.id.toString() === editId);
          if (guardiaPorEditar) {
            handleEditGuardia(guardiaPorEditar);
          } else {
            // Si no se encuentra la guardia en el estado actual, buscarla directamente
            GuardiaService.fetchGuardiaById(parseInt(editId))
              .then(guardia => {
                if (guardia) {
                  handleEditGuardia(guardia);
                }
              })
              .catch(err => {
                console.error('Error al buscar guardia por ID:', err);
                Swal.fire({
                  title: 'Error',
                  text: `No se encontró la guardia con ID ${editId}`,
                  icon: 'error',
                  confirmButtonText: 'Aceptar'
                });
              });
          }
        }
      });
  }, [editId]); // Agregar editId como dependencia

  // Función para cargar guardias
  const loadGuardias = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await GuardiaService.fetchGuardias();
      setGuardias(data);
      return data;
    } catch (error: any) {
      setError(`Error al cargar guardias: ${error.message}`);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambios en el formulario
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setGuardiaForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Abrir modal para crear nueva guardia
  const handleNewGuardia = () => {
    setSelectedGuardia(null);
    setGuardiaForm({
      fecha: format(new Date(), 'yyyy-MM-dd'),
      usuario: '',
      notas: ''
    });
    setShowModal(true);
  };

  // Abrir modal para editar guardia existente
  const handleEditGuardia = (guardia: Guardia) => {
    setSelectedGuardia(guardia);
    setGuardiaForm({
      fecha: format(new Date(guardia.fecha), 'yyyy-MM-dd'),
      usuario: guardia.usuario,
      notas: guardia.notas || ''
    });
    setShowModal(true);
  };

  // Guardar guardia (nueva o actualizada)
  const handleSaveGuardia = async () => {
    try {
      if (!guardiaForm.usuario) {
        Swal.fire({
          title: 'Error',
          text: 'El nombre del usuario es obligatorio',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
        return;
      }

      if (selectedGuardia) {
        // Actualizar guardia existente
        await GuardiaService.updateGuardia({
          id: selectedGuardia.id,
          ...guardiaForm
        });
        
        Swal.fire({
          title: '¡Éxito!',
          text: 'Guardia actualizada correctamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        // Crear nueva guardia
        await GuardiaService.createGuardia(guardiaForm);
        
        Swal.fire({
          title: '¡Éxito!',
          text: 'Guardia creada correctamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }

      setShowModal(false);
      await loadGuardias();
    } catch (error: any) {
      Swal.fire({
        title: 'Error',
        text: error.message,
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  // Eliminar guardia
  const handleDeleteGuardia = (guardia: Guardia) => {
    Swal.fire({
      title: '¿Está seguro?',
      text: `¿Desea eliminar la guardia de ${guardia.usuario} del ${format(new Date(guardia.fecha), 'dd/MM/yyyy')}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await GuardiaService.deleteGuardia(guardia.id);
          
          Swal.fire({
            title: '¡Eliminada!',
            text: 'La guardia ha sido eliminada correctamente',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
          
          await loadGuardias();
        } catch (error: any) {
          console.error('Error al eliminar guardia:', error);
          
          Swal.fire({
            title: 'Error',
            text: `Error al eliminar la guardia: ${error.message}`,
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
        }
      }
    });
  };

  // Importar guardias desde archivo Excel
  const handleImportGuardias = async () => {
    if (!importFile) {
      Swal.fire({
        title: 'Error',
        text: 'Por favor, seleccione un archivo Excel',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    try {
      setImporting(true);
      const result = await GuardiaService.importGuardiasFromExcel(importFile);
      
      setImporting(false);
      setImportFile(null);

      if (result.totalErrores > 0 && result.errors) {
        // Mostrar mensaje con errores
        Swal.fire({
          title: 'Importación completada con advertencias',
          html: `
            <p>Se importaron ${result.totalImportadas} guardias correctamente.</p>
            <p>Se encontraron ${result.totalErrores} errores:</p>
            <ul style="text-align: left; max-height: 200px; overflow-y: auto;">
              ${result.errors.map(err => `<li>${err}</li>`).join('')}
            </ul>
          `,
          icon: 'warning',
          confirmButtonText: 'Aceptar'
        });
      } else {
        // Mostrar mensaje de éxito
        Swal.fire({
          title: '¡Éxito!',
          text: `Se importaron ${result.totalImportadas} guardias correctamente`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }

      await loadGuardias();
    } catch (error: any) {
      setImporting(false);
      console.error('Error al importar guardias:', error);
      
      Swal.fire({
        title: 'Error',
        text: `Error al importar guardias: ${error.message}`,
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  // Limpiar parámetros de URL después de procesar
  useEffect(() => {
    // Si ya se encontró y editó la guardia, limpiar el parámetro de URL
    if (editId && showModal) {
      const url = new URL(window.location.href);
      url.searchParams.delete('edit');
      window.history.replaceState({}, '', url.toString());
    }
  }, [editId, showModal]);

  return (
    <Container fluid>
      <h4 className="mb-4">Administración de Guardias</h4>
      
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
          <Button
            variant="outline-danger"
            size="sm"
            className="ms-3"
            onClick={loadGuardias}
          >
            Reintentar
          </Button>
        </Alert>
      )}

      <Row className="mb-4">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Header className="d-flex justify-content-between align-items-center bg-white py-3">
              <h5 className="mb-0 fw-bold">Listado de Guardias</h5>
              <div>
                <Button
                  variant="primary"
                  size="sm"
                  className="me-2"
                  onClick={handleNewGuardia}
                >
                  <i className="bi bi-plus-circle me-1"></i>
                  Nueva Guardia
                </Button>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => document.getElementById('importFileInput')?.click()}
                >
                  <i className="bi bi-upload me-1"></i>
                  Importar Excel
                </Button>
                <input
                  type="file"
                  id="importFileInput"
                  style={{ display: 'none' }}
                  accept=".xlsx,.xls"
                  onChange={(e) => e.target.files && setImportFile(e.target.files[0])}
                />
              </div>
            </Card.Header>
            <Card.Body>
              {importFile && (
                <Alert variant="info" className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <i className="bi bi-file-earmark-excel me-2"></i>
                    Archivo seleccionado: {importFile.name}
                  </div>
                  <div>
                    <Button
                      variant="success"
                      size="sm"
                      className="me-2"
                      onClick={handleImportGuardias}
                      disabled={importing}
                    >
                      {importing ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" className="me-1" />
                          Importando...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-circle me-1"></i>
                          Procesar Archivo
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => setImportFile(null)}
                      disabled={importing}
                    >
                      <i className="bi bi-x-circle me-1"></i>
                      Cancelar
                    </Button>
                  </div>
                </Alert>
              )}

              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3 text-muted">Cargando guardias...</p>
                </div>
              ) : guardias.length === 0 ? (
                <Alert variant="info">
                  No se encontraron guardias registradas. Puede crear una nueva guardia o importar desde un archivo Excel.
                </Alert>
              ) : (
                <Table striped bordered hover responsive>
                  <thead className="table-light">
                    <tr>
                      <th>Fecha</th>
                      <th>Usuario</th>
                      <th>Notas</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guardias
                      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
                      .map((guardia) => (
                        <tr key={guardia.id}>
                          <td>{format(new Date(guardia.fecha), 'EEEE dd/MM/yyyy', { locale: es })}</td>
                          <td>{guardia.usuario}</td>
                          <td>{guardia.notas || '-'}</td>
                          <td>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-2"
                              onClick={() => handleEditGuardia(guardia)}
                            >
                              <i className="bi bi-pencil"></i>
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeleteGuardia(guardia)}
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal para crear/editar guardia */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{selectedGuardia ? 'Editar Guardia' : 'Nueva Guardia'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Fecha *</Form.Label>
              <Form.Control
                type="date"
                name="fecha"
                value={guardiaForm.fecha}
                onChange={handleFormChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Usuario *</Form.Label>
              <Form.Control
                type="text"
                name="usuario"
                value={guardiaForm.usuario}
                onChange={handleFormChange}
                placeholder="Nombre del usuario de guardia"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Notas</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="notas"
                value={guardiaForm.notas || ''}
                onChange={handleFormChange}
                placeholder="Notas adicionales (opcional)"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSaveGuardia}>
            {selectedGuardia ? 'Actualizar' : 'Guardar'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminGuardias;