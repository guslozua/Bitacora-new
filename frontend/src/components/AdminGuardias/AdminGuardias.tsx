import React, { useState, useEffect, useMemo } from 'react';
import {
  Container, Row, Col, Card, Table, Button,
  Form, Modal, Alert, Spinner, Pagination
} from 'react-bootstrap';
import { format, getYear, getMonth, getDaysInMonth, startOfMonth, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import GuardiaService, { Guardia } from '../../services/GuardiaService';
import { API_BASE_URL } from '../../services/apiConfig';

// Interfaz para el resultado de la importación
interface ImportResult {
  totalImportadas: number;
  totalErrores: number;
  totalOmitidas?: number;
  errors?: string[];
}

// Nombres de meses en español
const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

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

  // Estado para filtros - MODIFICADO PARA MOSTRAR DATOS EXISTENTES
  const [filters, setFilters] = useState({
    year: '', // Inicializar vacío para detectar automáticamente
    month: '', // Inicializar vacío para mostrar todos
    usuario: '',
    vista: 'lista' as 'lista' | 'mensual',
  });

  // Estado para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Obtener años disponibles para filtro
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    guardias.forEach((guardia: Guardia) => {
      const year = format(new Date(guardia.fecha), 'yyyy');
      years.add(year);
    });

    if (years.size === 0) {
      years.add(format(new Date(), 'yyyy'));
    }

    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [guardias]);

  // Obtener meses disponibles para el año seleccionado
  const availableMonths = useMemo(() => {
    if (!filters.year) {
      return [];
    }

    const months = new Set<string>();
    guardias
      .filter(g => format(new Date(g.fecha), 'yyyy') === filters.year)
      .forEach(guardia => {
        const month = format(new Date(guardia.fecha), 'MM');
        months.add(month);
      });

    return Array.from(months).sort();
  }, [guardias, filters.year]);

  // Obtener usuarios disponibles para filtro - CORREGIDO
  const availableUsers = useMemo(() => {
    const users = new Set<string>();
    guardias.forEach((guardia: Guardia) => {
      users.add(guardia.usuario);
    });
    return Array.from(users).sort();
  }, [guardias]);

  // Función para detectar automáticamente el mejor filtro inicial
  const detectBestInitialFilter = (guardiasList: Guardia[]) => {
    if (guardiasList.length === 0) {
      return {
        year: getYear(new Date()).toString(),
        month: (getMonth(new Date()) + 1).toString().padStart(2, '0'),
        usuario: '',
        vista: 'lista' as const
      };
    }

    // Obtener distribución por años
    const yearDistribution = guardiasList.reduce((acc, guardia) => {
      const year = format(new Date(guardia.fecha), 'yyyy');
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Encontrar el año con más guardias
    const mostPopularYear = Object.entries(yearDistribution)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || getYear(new Date()).toString();

    console.log('🔍 Detección automática de filtros:', {
      totalGuardias: guardiasList.length,
      yearDistribution,
      mostPopularYear
    });

    return {
      year: mostPopularYear,
      month: '', // Mostrar todos los meses del año más popular
      usuario: '',
      vista: 'lista' as const
    };
  };

  // Cargar guardias con detección automática de filtros
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🛡️ [AdminGuardias] Cargando guardias...');
        const data = await GuardiaService.fetchGuardias();
        
        console.log('✅ [AdminGuardias] Guardias cargadas:', data.length);
        setGuardias(data);

        // Auto-detectar mejores filtros iniciales solo si es la primera carga
        if (filters.year === '' && filters.month === '') {
          const bestFilters = detectBestInitialFilter(data);
          setFilters(bestFilters);
          console.log('🎯 Filtros auto-detectados aplicados:', bestFilters);
        }

        // Manejar edición desde URL
        if (editId) {
          const guardiaPorEditar = data.find(g => g.id.toString() === editId);
          if (guardiaPorEditar) {
            handleEditGuardia(guardiaPorEditar);
          } else {
            try {
              const guardia = await GuardiaService.fetchGuardiaById(parseInt(editId));
              if (guardia) {
                handleEditGuardia(guardia);
              }
            } catch (err) {
              console.error('Error al buscar guardia por ID:', err);
              Swal.fire({
                title: 'Error',
                text: `No se encontró la guardia con ID ${editId}`,
                icon: 'error',
                confirmButtonText: 'Aceptar'
              });
            }
          }
        }

      } catch (error: any) {
        console.error('❌ [AdminGuardias] Error al cargar guardias:', error);
        
        let errorMessage = 'Error desconocido';
        if (error.name === 'ApiError') {
          errorMessage = `Error API (${error.status}): ${error.message}`;
        } else if (error.message?.includes('Network Error')) {
          errorMessage = 'Error de conexión: No se puede conectar con el servidor.';
        } else if (error.response?.status === 500) {
          errorMessage = 'Error interno del servidor: Revise los logs del backend.';
        } else {
          errorMessage = `Error al cargar guardias: ${error.message}`;
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [editId]);

  // Obtener guardias filtradas
  const filteredGuardias = useMemo(() => {
    console.log('🔍 [AdminGuardias] Aplicando filtros:', {
      year: filters.year,
      month: filters.month,
      usuario: filters.usuario,
      totalGuardias: guardias.length
    });
    
    const filtered = guardias.filter(guardia => {
      const guardiaDate = new Date(guardia.fecha);
      const guardiaYear = format(guardiaDate, 'yyyy');
      const guardiaMonth = format(guardiaDate, 'MM');

      if (filters.year && guardiaYear !== filters.year) {
        return false;
      }

      if (filters.month && guardiaMonth !== filters.month) {
        return false;
      }

      if (filters.usuario && !guardia.usuario.toLowerCase().includes(filters.usuario.toLowerCase())) {
        return false;
      }

      return true;
    });
    
    console.log('📊 [AdminGuardias] Guardias filtradas:', filtered.length);
    
    return filtered;
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
    const month = parseInt(filters.month) - 1;

    const firstDayOfMonth = startOfMonth(new Date(year, month));
    const daysInMonth = getDaysInMonth(firstDayOfMonth);

    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const date = addDays(firstDayOfMonth, i);
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

  // Función para recargar guardias
  const loadGuardias = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await GuardiaService.fetchGuardias();
      setGuardias(data);
      return data;
    } catch (error: any) {
      console.error('Error al cargar guardias:', error);
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
    setCurrentPage(1);
  };

  // Resetear filtros a detección automática
  const handleResetFilters = () => {
    const bestFilters = detectBestInitialFilter(guardias);
    setFilters(bestFilters);
    setCurrentPage(1);
  };

  // Cambiar vista
  const handleChangeView = (vista: 'lista' | 'mensual') => {
    setFilters(prev => ({
      ...prev,
      vista
    }));
    setCurrentPage(1);
  };

  // Abrir modal para nueva guardia
  const handleNewGuardia = () => {
    setSelectedGuardia(null);
    setGuardiaForm({
      fecha: format(new Date(), 'yyyy-MM-dd'),
      usuario: '',
      notas: ''
    });
    setShowModal(true);
  };

  // Abrir modal para nueva guardia en fecha específica
  const handleNewGuardiaForDate = (date: Date) => {
    setSelectedGuardia(null);
    setGuardiaForm({
      fecha: format(date, 'yyyy-MM-dd'),
      usuario: '',
      notas: ''
    });
    setShowModal(true);
  };

  // Abrir modal para editar guardia
  const handleEditGuardia = (guardia: Guardia) => {
    setSelectedGuardia(guardia);
    setGuardiaForm({
      fecha: format(new Date(guardia.fecha), 'yyyy-MM-dd'),
      usuario: guardia.usuario,
      notas: guardia.notas || ''
    });
    setShowModal(true);
  };

  // Guardar guardia
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
        // Normalizar notas antes del envío
        const updateData = {
          id: selectedGuardia.id,
          ...guardiaForm,
          notas: guardiaForm.notas || null // Convertir string vacío a null
        };
        await GuardiaService.updateGuardia(updateData);

        Swal.fire({
          title: '¡Éxito!',
          text: 'Guardia actualizada correctamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        // Normalizar notas antes del envío
        const createData = {
          ...guardiaForm,
          notas: guardiaForm.notas || null // Convertir string vacío a null
        };
        await GuardiaService.createGuardia(createData);

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

  // Importar guardias desde Excel
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

    const confirmResult = await Swal.fire({
      title: 'Confirmar Importación',
      html: `
        <p>¿Está seguro que desea procesar el archivo <strong>${importFile.name}</strong>?</p>
        <p class="text-muted small">Las guardias duplicadas serán omitidas automáticamente.</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, procesar archivo',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmResult.isConfirmed) return;

    try {
      setImporting(true);
      const result: ImportResult = await GuardiaService.importGuardiasFromExcel(importFile);
      setImporting(false);
      setImportFile(null);

      let mensajeHtml = '';
      let icono: 'success' | 'warning' | 'info' = 'success';
      let titulo = '¡Importación completada exitosamente!';

      if (result.totalImportadas > 0) {
        mensajeHtml += `<div class="alert alert-success border-0 mb-2">
          ✅ Se importaron <strong>${result.totalImportadas}</strong> guardias nuevas correctamente.
        </div>`;
      }

      if (result.totalOmitidas && result.totalOmitidas > 0) {
        mensajeHtml += `<div class="alert alert-info border-0 mb-2">
          ℹ️ Se omitieron <strong>${result.totalOmitidas}</strong> guardias duplicadas.
        </div>`;
        if (result.totalImportadas === 0) {
          icono = 'info';
          titulo = 'Archivo procesado - Sin cambios realizados';
        }
      }

      await Swal.fire({
        title: titulo,
        html: mensajeHtml || 'Importación completada',
        icon: icono,
        confirmButtonText: 'Entendido'
      });

      if (result.totalImportadas > 0) {
        await loadGuardias();
      }

    } catch (error: any) {
      setImporting(false);
      Swal.fire({
        title: 'Error al procesar archivo',
        text: `Error: ${error.message}`,
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  // Limpiar parámetros de URL
  useEffect(() => {
    if (editId && showModal) {
      const url = new URL(window.location.href);
      url.searchParams.delete('edit');
      window.history.replaceState({}, '', url.toString());
    }
  }, [editId, showModal]);

  // Componente de información de filtros
  const FilterInfo: React.FC = () => (
    <Alert variant="info" className="mb-3">
      <div className="d-flex align-items-center">
        <i className="bi bi-info-circle me-2"></i>
        <div>
          <strong>Filtros aplicados:</strong> 
          {filters.year ? ` Año ${filters.year}` : ' Todos los años'} 
          {filters.month ? ` • Mes ${monthNames[parseInt(filters.month) - 1]}` : ' • Todos los meses'}
          {filters.usuario ? ` • Usuario: ${filters.usuario}` : ''}
          <span className="ms-2 text-muted">({filteredGuardias.length} resultados)</span>
        </div>
      </div>
    </Alert>
  );

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
              {/* Información de Filtros */}
              <FilterInfo />

              {/* Panel de filtros mejorados */}
              <div className="mb-4 p-3 bg-light rounded">
                <Row className="align-items-end">
                  <Col lg={3} md={4} sm={6} className="mb-2">
                    <Form.Group>
                      <Form.Label className="small fw-bold">Año</Form.Label>
                      <Form.Select
                        size="sm"
                        value={filters.year}
                        onChange={(e) => handleFilterChange('year', e.target.value)}
                      >
                        <option value="">Todos los años</option>
                        {availableYears.map(year => (
                          <option key={year} value={year}>
                            {year} ({guardias.filter(g => 
                              new Date(g.fecha).getFullYear().toString() === year
                            ).length} guardias)
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  
                  <Col lg={3} md={4} sm={6} className="mb-2">
                    <Form.Group>
                      <Form.Label className="small fw-bold">Mes</Form.Label>
                      <Form.Select
                        size="sm"
                        value={filters.month}
                        onChange={(e) => handleFilterChange('month', e.target.value)}
                        disabled={!filters.year}
                      >
                        <option value="">Todos los meses</option>
                        {availableMonths.map(month => {
                          const monthIndex = parseInt(month) - 1;
                          const monthName = monthNames[monthIndex];
                          const count = guardias.filter(g => {
                            const date = new Date(g.fecha);
                            return date.getFullYear().toString() === filters.year &&
                                   (date.getMonth() + 1).toString().padStart(2, '0') === month;
                          }).length;
                          
                          return (
                            <option key={month} value={month}>
                              {monthName} ({count} guardias)
                            </option>
                          );
                        })}
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
                        <option value="">Todos los usuarios</option>
                        {availableUsers.map(user => (
                          <option key={user} value={user}>
                            {user} ({guardias.filter(g => g.usuario === user).length})
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col lg={3} md={8} sm={6} className="mb-2">
                    <Form.Label className="small fw-bold">Vista</Form.Label>
                    <div className="d-flex">
                      <Button
                        variant={filters.vista === 'lista' ? 'primary' : 'outline-primary'}
                        size="sm"
                        className="me-2"
                        onClick={() => handleChangeView('lista')}
                      >
                        <i className="bi bi-list"></i> Lista
                      </Button>
                      <Button
                        variant={filters.vista === 'mensual' ? 'primary' : 'outline-primary'}
                        size="sm"
                        onClick={() => handleChangeView('mensual')}
                        disabled={!filters.year || !filters.month}
                      >
                        <i className="bi bi-calendar"></i> Mensual
                      </Button>
                    </div>
                  </Col>
                </Row>

                <div className="mt-3">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={handleResetFilters}
                    title="Limpiar todos los filtros"
                  >
                    <i className="bi bi-x-circle"></i> Limpiar Filtros
                  </Button>
                </div>
              </div>

              {/* Indicador de archivo seleccionado */}
              {importFile && (
                <Alert variant="info" className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <i className="bi bi-file-earmark-excel me-2"></i>
                    Archivo seleccionado: <strong>{importFile.name}</strong>
                    <span className="text-muted ms-2">({(importFile.size / 1024).toFixed(1)} KB)</span>
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
                          Procesando...
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

              {/* Contenido Principal */}
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
                  <h5>No se encontraron guardias</h5>
                  <p>No se encontraron guardias con los filtros seleccionados.</p>
                  <p className="mb-0">
                    <strong>Sugerencia:</strong> Prueba cambiando los filtros o{' '}
                    <button
                      className="btn btn-link p-0"
                      onClick={handleResetFilters}
                    >
                      usar detección automática
                    </button>
                  </p>
                </Alert>
              ) : filters.vista === 'lista' ? (
                // Vista de lista
                <>
                  <div className="card">
                    <div className="card-header">
                      <h5 className="mb-0">
                        Guardias - {filteredGuardias.length} registros
                      </h5>
                    </div>
                    <div className="card-body">
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
                                <td>
                                  {new Date(guardia.fecha).toLocaleDateString('es-ES', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </td>
                                <td>
                                  <strong>{guardia.usuario}</strong>
                                </td>
                                <td>
                                  <span className="text-muted">
                                    {guardia.notas || 'Sin notas'}
                                  </span>
                                </td>
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
                    </div>
                  </div>

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
                          let pageNum: number;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage + 2 >= totalPages) {
                            pageNum = totalPages - 4 + i;
                          } else {
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
                <div className="card">
                  <div className="card-header">
                    <h5 className="mb-0 text-center">
                      {filters.month && format(new Date(parseInt(filters.year), parseInt(filters.month) - 1), 'MMMM yyyy', { locale: es })}
                    </h5>
                  </div>
                  <div className="card-body">
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