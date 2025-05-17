// src/components/AdminGuardias/AdminGuardias.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Container, Row, Col, Card, Table, Button,
  Form, Modal, Alert, Spinner, Pagination, InputGroup, Dropdown
} from 'react-bootstrap';
import { format, getYear, getMonth, getDaysInMonth, startOfMonth, addDays, isSameDay } from 'date-fns';
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

  // Estado para filtros
  const [filters, setFilters] = useState({
    year: getYear(new Date()).toString(),
    month: (getMonth(new Date()) + 1).toString().padStart(2, '0'),
    usuario: '',
    vista: 'lista', // 'lista' o 'mensual'
  });

  // Estado para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Solo para vista de lista

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

  // Obtener años disponibles para filtro
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    guardias.forEach(guardia => {
      const year = format(new Date(guardia.fecha), 'yyyy');
      years.add(year);
    });

    // Si no hay años en los datos, usar el año actual
    if (years.size === 0) {
      years.add(format(new Date(), 'yyyy'));
    }

    return Array.from(years).sort((a, b) => b.localeCompare(a)); // Ordenar descendente
  }, [guardias]);

  // Obtener usuarios disponibles para filtro
  const availableUsers = useMemo(() => {
    const users = new Set<string>();
    guardias.forEach(guardia => {
      users.add(guardia.usuario);
    });
    return Array.from(users).sort();
  }, [guardias]);

  // Obtener guardias filtradas
  const filteredGuardias = useMemo(() => {
    return guardias.filter(guardia => {
      const guardiaDate = new Date(guardia.fecha);
      const guardiaYear = format(guardiaDate, 'yyyy');
      const guardiaMonth = format(guardiaDate, 'MM');

      // Filtrar por año si está seleccionado
      if (filters.year && guardiaYear !== filters.year) {
        return false;
      }

      // Filtrar por mes si está seleccionado
      if (filters.month && guardiaMonth !== filters.month) {
        return false;
      }

      // Filtrar por usuario si está ingresado
      if (filters.usuario && !guardia.usuario.toLowerCase().includes(filters.usuario.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [guardias, filters]);

  // Paginación para vista de lista
  const paginatedGuardias = useMemo(() => {
    if (filters.vista === 'mensual') {
      return filteredGuardias;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredGuardias.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredGuardias, currentPage, itemsPerPage, filters.vista]);

  // Total de páginas para paginación
  const totalPages = useMemo(() => {
    return Math.ceil(filteredGuardias.length / itemsPerPage);
  }, [filteredGuardias, itemsPerPage]);

  // Generar datos para vista mensual
  const monthViewData = useMemo(() => {
    if (filters.vista !== 'mensual' || !filters.year || !filters.month) {
      return [];
    }

    const year = parseInt(filters.year);
    const month = parseInt(filters.month) - 1; // Ajustar para date-fns (0-11)

    const firstDayOfMonth = startOfMonth(new Date(year, month));
    const daysInMonth = getDaysInMonth(firstDayOfMonth);

    // Crear array con todos los días del mes
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const date = addDays(firstDayOfMonth, i);

      // Buscar guardia para este día
      const guardia = filteredGuardias.find(g =>
        isSameDay(new Date(g.fecha), date)
      );

      return {
        date,
        day: i + 1,
        guardia: guardia || null
      };
    });

    return days;
  }, [filters.vista, filters.year, filters.month, filteredGuardias]);

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

  // Manejar cambios en filtros
  const handleFilterChange = (filterName: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setCurrentPage(1); // Reiniciar paginación al cambiar filtros
  };

  // Cambiar vista (lista/mensual)
  const handleChangeView = (vista: 'lista' | 'mensual') => {
    setFilters(prev => ({
      ...prev,
      vista
    }));
    setCurrentPage(1);
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

  // Abrir modal para crear guardia en una fecha específica (desde vista mensual)
  const handleNewGuardiaForDate = (date: Date) => {
    setSelectedGuardia(null);
    setGuardiaForm({
      fecha: format(date, 'yyyy-MM-dd'),
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
              <h5 className="mb-0 fw-bold">Cronograma de Guardias</h5>
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
              {/* Panel de filtros */}
              <div className="mb-4 p-3 bg-light rounded">
                <Row className="align-items-end">
                  <Col lg={2} md={4} sm={6} className="mb-2">
                    <Form.Group>
                      <Form.Label className="small fw-bold">Año</Form.Label>
                      <Form.Select
                        size="sm"
                        value={filters.year}
                        onChange={(e) => handleFilterChange('year', e.target.value)}
                      >
                        <option value="">Todos</option>
                        {availableYears.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col lg={2} md={4} sm={6} className="mb-2">
                    <Form.Group>
                      <Form.Label className="small fw-bold">Mes</Form.Label>
                      <Form.Select
                        size="sm"
                        value={filters.month}
                        onChange={(e) => handleFilterChange('month', e.target.value)}
                      >
                        <option value="">Todos</option>
                        <option value="01">Enero</option>
                        <option value="02">Febrero</option>
                        <option value="03">Marzo</option>
                        <option value="04">Abril</option>
                        <option value="05">Mayo</option>
                        <option value="06">Junio</option>
                        <option value="07">Julio</option>
                        <option value="08">Agosto</option>
                        <option value="09">Septiembre</option>
                        <option value="10">Octubre</option>
                        <option value="11">Noviembre</option>
                        <option value="12">Diciembre</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col lg={3} md={4} sm={6} className="mb-2">
                    <Form.Group>
                      <Form.Label className="small fw-bold">Usuario</Form.Label>
                      <Form.Select
                        size="sm"
                        value={filters.usuario}
                        onChange={(e) => handleFilterChange('usuario', e.target.value)}
                      >
                        <option value="">Todos</option>
                        {availableUsers.map(user => (
                          <option key={user} value={user}>{user}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col lg={3} md={8} sm={6} className="mb-2 d-flex align-items-center">
                    <div className="d-flex">
                      <Button
                        variant={filters.vista === 'lista' ? 'primary' : 'outline-primary'}
                        size="sm"
                        className="me-2"
                        onClick={() => handleChangeView('lista')}
                      >
                        <i className="bi bi-list me-1"></i>
                        Vista Lista
                      </Button>
                      <Button
                        variant={filters.vista === 'mensual' ? 'primary' : 'outline-primary'}
                        size="sm"
                        onClick={() => handleChangeView('mensual')}
                        disabled={!filters.year || !filters.month}
                      >
                        <i className="bi bi-calendar-month me-1"></i>
                        Vista Mensual
                      </Button>
                    </div>
                  </Col>
                  <Col lg={2} md={4} sm={6} className="mb-2 d-flex justify-content-end">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => {
                        setFilters({
                          year: getYear(new Date()).toString(),
                          month: (getMonth(new Date()) + 1).toString().padStart(2, '0'),
                          usuario: '',
                          vista: 'lista'
                        });
                        setCurrentPage(1);
                      }}
                    >
                      <i className="bi bi-x-circle me-1"></i>
                      Limpiar Filtros
                    </Button>
                  </Col>
                </Row>
              </div>

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
              ) : filteredGuardias.length === 0 ? (
                <Alert variant="warning">
                  No se encontraron guardias con los filtros seleccionados. Intente cambiar los filtros o
                  <Button
                    variant="link"
                    className="p-0 ms-1"
                    onClick={() => handleFilterChange('usuario', '')}
                  >
                    limpiar los filtros.
                  </Button>
                </Alert>
              ) : filters.vista === 'lista' ? (
                // Vista de lista
                <>
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
                      {paginatedGuardias
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

                  {/* Paginación */}
                  {totalPages > 1 && (
                    <div className="d-flex justify-content-center mt-4">
                      <Pagination>
                        <Pagination.First
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                        />
                        <Pagination.Prev
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        />

                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum: number; // Explicitly define pageNum as number type
                          if (totalPages <= 5) {
                            // Mostrar todas las páginas si son 5 o menos
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            // Al inicio, mostrar páginas 1-5
                            pageNum = i + 1;
                          } else if (currentPage + 2 >= totalPages) {
                            // Al final, mostrar las últimas 5 páginas
                            pageNum = totalPages - 4 + i;
                          } else {
                            // En medio, mostrar 2 antes y 2 después de la actual
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <Pagination.Item
                              key={pageNum}
                              active={pageNum === currentPage}
                              onClick={() => setCurrentPage(pageNum)}
                            >
                              {pageNum}
                            </Pagination.Item>
                          );
                        })}

                        <Pagination.Next
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                        />
                        <Pagination.Last
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                        />
                      </Pagination>
                    </div>
                  )}
                </>
              ) : (
                // Vista mensual
                <div className="mb-3">
                  <h5 className="mb-3 text-center">
                    {filters.month && format(new Date(parseInt(filters.year), parseInt(filters.month) - 1), 'MMMM yyyy', { locale: es })}
                  </h5>

                  <Table bordered responsive className="calendar-table">
                    <thead className="table-light">
                      <tr>
                        <th>Día</th>
                        <th>Fecha</th>
                        <th>Usuario</th>
                        <th>Notas</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthViewData.map(dayData => (
                        <tr key={dayData.day} className={dayData.guardia ? 'table-light' : ''}>
                          <td className="text-center fw-bold">{dayData.day}</td>
                          <td>
                            {format(dayData.date, 'EEEE dd/MM/yyyy', { locale: es })}
                          </td>
                          <td>
                            {dayData.guardia ? dayData.guardia.usuario : '-'}
                          </td>
                          <td>
                            {dayData.guardia?.notas || '-'}
                          </td>
                          <td className="text-center">
                            {dayData.guardia ? (
                              <>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  className="me-2"
                                  onClick={() => handleEditGuardia(dayData.guardia!)}
                                >
                                  <i className="bi bi-pencil"></i>
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDeleteGuardia(dayData.guardia!)}
                                >
                                  <i className="bi bi-trash"></i>
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => handleNewGuardiaForDate(dayData.date)}
                              >
                                <i className="bi bi-plus-circle me-1"></i>
                                Agregar
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
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