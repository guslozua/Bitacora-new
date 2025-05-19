// src/components/Incidentes/IncidentesListaGuardia.tsx
import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Button, Badge, Spinner, Alert, Modal, OverlayTrigger, Tooltip
} from 'react-bootstrap';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Swal from 'sweetalert2';
import IncidenteModal from './IncidenteModal';
import DetalleIncidente from './DetalleIncidente';
import { Incidente, CodigoAplicado } from '../../models/Event';
import api from '../../services/api'; // Importamos nuestra instancia api en lugar de axios

// Función auxiliar para formatear minutos como horas (HH:MM)
const formatearMinutosComoHoras = (minutos: number): string => {
  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;
  return `${horas}:${minutosRestantes.toString().padStart(2, '0')}`;
};

interface Guardia {
  id: number;
  fecha: string;
  usuario: string;
  notas?: string;
}

interface IncidentesListaGuardiaProps {
  guardia: Guardia;
  onIncidentesChanged?: () => void;
}

const IncidentesListaGuardia: React.FC<IncidentesListaGuardiaProps> = ({ 
  guardia, 
  onIncidentesChanged 
}) => {
  const [incidentes, setIncidentes] = useState<Incidente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [selectedIncidente, setSelectedIncidente] = useState<Incidente | null>(null);
  const [selectedIncidenteId, setSelectedIncidenteId] = useState<number | null>(null);
  
  // Cargar incidentes al montar el componente o cuando cambia la guardia
  useEffect(() => {
    if (guardia) {
      cargarIncidentes();
    }
  }, [guardia]);
  
  // Cargar incidentes de esta guardia
  const cargarIncidentes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Cambiamos axios.get por api.get y quitamos el "/api" inicial
      const response = await api.get(`/incidentes/guardia/${guardia.id}`);
      
      if (response.data.success) {
        setIncidentes(response.data.data);
      }
    } catch (error: any) {
      console.error('Error al cargar incidentes:', error);
      setError(error.response?.data?.message || 'Error al cargar incidentes');
    } finally {
      setLoading(false);
    }
  };
  
  // Abrir modal para crear incidente
  const handleNewIncidente = () => {
    setSelectedIncidente(null);
    setShowModal(true);
  };
  
  // Abrir modal para editar incidente
  const handleEditIncidente = (incidente: Incidente) => {
    setSelectedIncidente(incidente);
    setShowModal(true);
  };

  // Abrir modal para ver detalles de incidente
  const handleVerDetalles = (incidente: Incidente) => {
    setSelectedIncidenteId(incidente.id!);
    setShowDetalleModal(true);
  };
  
  // Eliminar incidente
  const handleDeleteIncidente = (incidente: Incidente) => {
    Swal.fire({
      title: '¿Está seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Cambiamos axios.delete por api.delete y quitamos el "/api" inicial
          const response = await api.delete(`/incidentes/${incidente.id}`);
          
          if (response.data.success) {
            Swal.fire({
              title: '¡Eliminado!',
              text: 'El incidente ha sido eliminado',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
            
            cargarIncidentes();
            
            if (onIncidentesChanged) {
              onIncidentesChanged();
            }
          }
        } catch (error: any) {
          console.error('Error al eliminar incidente:', error);
          
          Swal.fire({
            title: 'Error',
            text: error.response?.data?.message || 'Error al eliminar incidente',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
        }
      }
    });
  };
  
  // Cambiar estado de incidente
  const handleCambiarEstado = async (incidente: Incidente, nuevoEstado: string) => {
    try {
      // Cambiamos axios.patch por api.patch y quitamos el "/api" inicial
      const response = await api.patch(`/incidentes/${incidente.id}/estado`, {
        estado: nuevoEstado
      });
      
      if (response.data.success) {
        Swal.fire({
          title: '¡Éxito!',
          text: 'Estado del incidente actualizado',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        
        cargarIncidentes();
        
        if (onIncidentesChanged) {
          onIncidentesChanged();
        }
      }
    } catch (error: any) {
      console.error('Error al cambiar estado:', error);
      
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.message || 'Error al cambiar estado',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    }
  };
  
  // Obtener color de badge según estado
  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case 'registrado': return 'primary';
      case 'revisado': return 'info';
      case 'aprobado': return 'success';
      case 'rechazado': return 'danger';
      case 'liquidado': return 'dark';
      default: return 'secondary';
    }
  };
  
  // Obtener texto de estado en español
  const getEstadoText = (estado: string) => {
    switch (estado) {
      case 'registrado': return 'Registrado';
      case 'revisado': return 'Revisado';
      case 'aprobado': return 'Aprobado';
      case 'rechazado': return 'Rechazado';
      case 'liquidado': return 'Liquidado';
      default: return estado;
    }
  };
  
  // Calcular opciones de estado siguientes según el estado actual
  const getEstadosSiguientes = (estadoActual: string) => {
    switch (estadoActual) {
      case 'registrado': return ['revisado', 'aprobado', 'rechazado'];
      case 'revisado': return ['aprobado', 'rechazado'];
      case 'aprobado': return ['liquidado'];
      case 'rechazado': return ['registrado'];
      case 'liquidado': return [];
      default: return [];
    }
  };
  
  // Obtener conteo de códigos como texto
  const getCodigosCount = (incidente: Incidente) => {
    if (!incidente.codigos_aplicados || incidente.codigos_aplicados.length === 0) {
      return "Sin códigos";
    }
    return `${incidente.codigos_aplicados.length} código${incidente.codigos_aplicados.length !== 1 ? 's' : ''}`;
  };
  
  return (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
        <div>
          <h5 className="mb-0 fw-bold">Incidentes de Guardia</h5>
          <div className="text-muted small">
            {format(new Date(guardia.fecha), 'EEEE, d MMMM yyyy', { locale: es })} - {guardia.usuario}
          </div>
        </div>
        <Button 
          variant="primary" 
          size="sm"
          onClick={handleNewIncidente}
        >
          <i className="bi bi-plus-circle me-1"></i>
          Registrar Incidente
        </Button>
      </Card.Header>
      <Card.Body>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">Cargando incidentes...</p>
          </div>
        ) : error ? (
          <Alert variant="danger">
            {error}
            <Button
              variant="outline-danger"
              size="sm"
              className="ms-3"
              onClick={cargarIncidentes}
            >
              Reintentar
            </Button>
          </Alert>
        ) : incidentes.length === 0 ? (
          <Alert variant="info">
            No se han registrado incidentes para esta guardia.
          </Alert>
        ) : (
          <Table responsive hover>
            <thead>
              <tr>
                <th>Horario</th>
                <th>Descripción</th>
                <th>Duración</th>
                <th>Códigos</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {incidentes.map((incidente) => (
                <tr key={incidente.id} className="cursor-pointer" onClick={() => handleVerDetalles(incidente)}>
                  <td>
                    {format(new Date(incidente.inicio), 'HH:mm', { locale: es })} - 
                    {format(new Date(incidente.fin), 'HH:mm', { locale: es })}
                  </td>
                  <td>
                    {incidente.descripcion.length > 50 
                      ? `${incidente.descripcion.substring(0, 50)}...` 
                      : incidente.descripcion}
                    {incidente.observaciones && (
                      <OverlayTrigger
                        placement="top"
                        overlay={
                          <Tooltip>
                            {incidente.observaciones}
                          </Tooltip>
                        }
                      >
                        <i className="bi bi-info-circle ms-2 text-muted"></i>
                      </OverlayTrigger>
                    )}
                  </td>
                  <td>
                    {formatearMinutosComoHoras(incidente.duracion_minutos ||
                    Math.floor((new Date(incidente.fin).getTime() - new Date(incidente.inicio).getTime()) / 60000))}
                  </td>
                  <td>
                    {incidente.codigos_aplicados && incidente.codigos_aplicados.length > 0 ? (
                      <div className="d-flex flex-wrap gap-1">
                        {incidente.codigos_aplicados.slice(0, 3).map((codigo) => (
                          <Badge
                            key={codigo.id_codigo}
                            bg="info"
                            className="text-dark"
                            title={`${codigo.descripcion}: ${formatearMinutosComoHoras(codigo.minutos)}`}
                          >
                            {codigo.codigo}
                          </Badge>
                        ))}
                        {incidente.codigos_aplicados.length > 3 && (
                          <Badge bg="secondary">+{incidente.codigos_aplicados.length - 3}</Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted">Sin códigos</span>
                    )}
                  </td>
                  <td>
                    <div className="d-flex align-items-center">
                      <Badge bg={getEstadoBadgeColor(incidente.estado)}>
                        {getEstadoText(incidente.estado)}
                      </Badge>
                      {getEstadosSiguientes(incidente.estado).length > 0 && (
                        <div className="dropdown ms-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            className="dropdown-toggle py-0 px-1"
                            data-bs-toggle="dropdown"
                          >
                            <i className="bi bi-arrow-right"></i>
                          </Button>
                          <ul className="dropdown-menu">
                            {getEstadosSiguientes(incidente.estado).map((estado) => (
                              <li key={estado}>
                                <button
                                  className="dropdown-item"
                                  onClick={() => handleCambiarEstado(incidente, estado)}
                                >
                                  {getEstadoText(estado)}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="d-flex gap-1">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => handleVerDetalles(incidente)}
                        title="Ver detalles"
                      >
                        <i className="bi bi-eye"></i>
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleEditIncidente(incidente)}
                        disabled={incidente.estado === 'liquidado'}
                        title="Editar"
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteIncidente(incidente)}
                        disabled={incidente.estado === 'liquidado'}
                        title="Eliminar"
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
      
      {/* Modal para crear/editar incidente */}
      <IncidenteModal
        show={showModal}
        onHide={() => setShowModal(false)}
        guardia={guardia}
        incidente={selectedIncidente}
        onIncidenteGuardado={() => {
          cargarIncidentes();
          if (onIncidentesChanged) {
            onIncidentesChanged();
          }
        }}
      />

      {/* Modal para ver detalles del incidente */}
      <Modal
        show={showDetalleModal}
        onHide={() => setShowDetalleModal(false)}
        size="lg"
        backdrop="static"
        keyboard={false}
        className="modal-detalle-incidente"
      >
        <Modal.Header closeButton>
          <Modal.Title>Detalle de Incidente</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedIncidenteId && (
            <DetalleIncidente
              incidenteId={selectedIncidenteId}
              onEditar={(incidente) => {
                setShowDetalleModal(false);
                setSelectedIncidente(incidente);
                setShowModal(true);
              }}
              onCambiarEstado={handleCambiarEstado}
              onEliminar={(incidente) => {
                setShowDetalleModal(false);
                handleDeleteIncidente(incidente);
              }}
              onCerrar={() => setShowDetalleModal(false)}
            />
          )}
        </Modal.Body>
      </Modal>
    </Card>
  );
};

export default IncidentesListaGuardia;