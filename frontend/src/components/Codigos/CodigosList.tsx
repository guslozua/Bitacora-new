// src/components/Codigos/CodigosList.tsx - CON INDICADORES DE MEDIANOCHE
import React, { useState } from 'react';
import { Table, Button, Badge, Pagination, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Swal from 'sweetalert2';
import { Codigo } from '../../services/CodigoService';

interface CodigosListProps {
  codigos: Codigo[];
  onEdit: (codigo: Codigo) => void;
  onDeactivate: (codigo: Codigo) => void;
  onDelete: (codigo: Codigo) => void;
}

const CodigosList: React.FC<CodigosListProps> = ({ 
  codigos, 
  onEdit, 
  onDeactivate, 
  onDelete 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Calcular índices para paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCodigos = codigos.slice(indexOfFirstItem, indexOfLastItem);
  
  // Cambiar página
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  
  // Formatear fecha
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'No definida';
    return format(new Date(date), 'dd/MM/yyyy', { locale: es });
  };

  // ✨ FUNCIÓN PARA DETECTAR SI CRUZA MEDIANOCHE
  const cruzaMedianoche = (horaInicio: string, horaFin: string): boolean => {
    if (!horaInicio || !horaFin) return false;
    
    const [inicioH, inicioM] = horaInicio.split(':').map(Number);
    const [finH, finM] = horaFin.split(':').map(Number);
    
    const inicioMinutos = inicioH * 60 + inicioM;
    const finMinutos = finH * 60 + finM;
    
    return finMinutos < inicioMinutos;
  };

  // ✨ FUNCIÓN PARA OBTENER DESCRIPCIÓN DEL HORARIO
  const getDescripcionHorario = (horaInicio: string, horaFin: string): string => {
    if (!horaInicio || !horaFin) return 'Todo el día';
    
    if (cruzaMedianoche(horaInicio, horaFin)) {
      return `${horaInicio} - ${horaFin} (cruza medianoche)`;
    } else {
      return `${horaInicio} - ${horaFin}`;
    }
  };
  
  // Obtener etiqueta de tipo
  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'guardia_pasiva':
        return 'Guardia Pasiva';
      case 'guardia_activa':
        return 'Guardia Activa';
      case 'hora_nocturna':
        return 'Hora Nocturna';
      case 'feriado':
        return 'Feriado';
      case 'fin_semana':
        return 'Fin de Semana';
      case 'adicional':
        return 'Adicional';
      default:
        return tipo;
    }
  };
  
  // Obtener color de badge según tipo
  const getTipoBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'guardia_pasiva':
        return 'primary';
      case 'guardia_activa':
        return 'success';
      case 'hora_nocturna':
        return 'dark';
      case 'feriado':
        return 'danger';
      case 'fin_semana':
        return 'warning';
      case 'adicional':
        return 'info';
      default:
        return 'secondary';
    }
  };
  
  // Confirmar desactivación
  const confirmDeactivate = (codigo: Codigo) => {
    Swal.fire({
      title: '¿Desactivar código?',
      text: `El código ${codigo.codigo} será desactivado pero se mantendrá en el historial.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#6c757d',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        onDeactivate(codigo);
      }
    });
  };
  
  // Confirmar eliminación
  const confirmDelete = (codigo: Codigo) => {
    Swal.fire({
      title: '¿Eliminar código?',
      text: `El código ${codigo.codigo} será eliminado permanentemente.`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        onDelete(codigo);
      }
    });
  };
  
  return (
    <>
      {codigos.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-info-circle fs-1 text-secondary"></i>
          <p className="mt-3 text-muted">No se encontraron códigos con los filtros aplicados.</p>
        </div>
      ) : (
        <>
          <Table hover responsive className="mt-3">
            <thead>
              <tr>
                <th>Código</th>
                <th>Descripción</th>
                <th>Tipo</th>
                <th>Horario/Multiplicador</th>
                <th>Vigencia</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentCodigos.map((codigo) => {
                const tieneHorario = codigo.hora_inicio && codigo.hora_fin;
                const cruzaNoche = tieneHorario && cruzaMedianoche(codigo.hora_inicio!, codigo.hora_fin!);
                
                return (
                  <tr key={codigo.id}>
                    <td>
                      <strong>{codigo.codigo}</strong>
                    </td>
                    <td>
                      <div>{codigo.descripcion}</div>
                      {codigo.notas && (
                        <div className="text-muted small mt-1">
                          <i className="bi bi-info-circle me-1"></i>
                          {codigo.notas.length > 100 
                            ? `${codigo.notas.substring(0, 100)}...` 
                            : codigo.notas
                          }
                        </div>
                      )}
                    </td>
                    <td>
                      <Badge bg={getTipoBadgeColor(codigo.tipo)}>
                        {getTipoLabel(codigo.tipo)}
                      </Badge>
                    </td>
                    <td className="text-center">
                      <OverlayTrigger
                        placement="top"
                        overlay={
                          <Tooltip>
                            <div><strong>Días:</strong> {codigo.dias_aplicables}</div>
                            <div><strong>Horario:</strong> {getDescripcionHorario(codigo.hora_inicio!, codigo.hora_fin!)}</div>
                            <div><strong>Factor:</strong> x{codigo.factor_multiplicador}</div>
                            {codigo.notas && codigo.notas.length > 100 && (
                              <div className="mt-2">
                                <strong>Notas:</strong>
                                <div className="small">{codigo.notas}</div>
                              </div>
                            )}
                          </Tooltip>
                        }
                      >
                        <div>
                          {/* ✨ MOSTRAR HORARIO CON INDICADORES ESPECIALES */}
                          {tieneHorario ? (
                            <div>
                              <div className="d-flex align-items-center justify-content-center">
                                <span className="me-1">
                                  {codigo.hora_inicio} - {codigo.hora_fin}
                                </span>
                                {cruzaNoche && (
                                  <i className="bi bi-moon-stars text-warning" 
                                     title="Cruza medianoche"></i>
                                )}
                              </div>
                              <small className="text-muted">
                                x{codigo.factor_multiplicador}
                              </small>
                            </div>
                          ) : (
                            <div>
                              <i className="bi bi-clock text-muted"></i>
                              <div className="small">Todo el día</div>
                              <small className="text-muted">
                                x{codigo.factor_multiplicador}
                              </small>
                            </div>
                          )}
                          
                          {codigo.notas && (
                            <i className="bi bi-info-circle ms-1 text-muted small"></i>
                          )}
                        </div>
                      </OverlayTrigger>
                    </td>
                    <td>
                      <div>{formatDate(codigo.fecha_vigencia_desde)}</div>
                      {codigo.fecha_vigencia_hasta && (
                        <div className="text-muted small">
                          hasta {formatDate(codigo.fecha_vigencia_hasta)}
                        </div>
                      )}
                    </td>
                    <td>
                      <Badge bg={codigo.estado === 'activo' ? 'success' : 'secondary'}>
                        {codigo.estado === 'activo' ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => onEdit(codigo)}
                        >
                          <i className="bi bi-pencil"></i>
                        </Button>
                        
                        {codigo.estado === 'activo' ? (
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => confirmDeactivate(codigo)}
                          >
                            <i className="bi bi-toggle-off"></i>
                          </Button>
                        ) : (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => confirmDelete(codigo)}
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          
          {/* Paginación */}
          {codigos.length > itemsPerPage && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination>
                <Pagination.First onClick={() => paginate(1)} disabled={currentPage === 1} />
                <Pagination.Prev onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} />
                
                {Array.from({ length: Math.ceil(codigos.length / itemsPerPage) }, (_, i) => {
                  // Mostrar 5 páginas alrededor de la actual
                  if (
                    i === 0 ||
                    i === Math.ceil(codigos.length / itemsPerPage) - 1 ||
                    (i >= currentPage - 2 && i <= currentPage + 2)
                  ) {
                    return (
                      <Pagination.Item
                        key={i + 1}
                        active={i + 1 === currentPage}
                        onClick={() => paginate(i + 1)}
                      >
                        {i + 1}
                      </Pagination.Item>
                    );
                  } else if (
                    i === currentPage - 3 ||
                    i === currentPage + 3
                  ) {
                    return <Pagination.Ellipsis key={`ellipsis-${i}`} />;
                  }
                  return null;
                })}
                
                <Pagination.Next
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === Math.ceil(codigos.length / itemsPerPage)}
                />
                <Pagination.Last
                  onClick={() => paginate(Math.ceil(codigos.length / itemsPerPage))}
                  disabled={currentPage === Math.ceil(codigos.length / itemsPerPage)}
                />
              </Pagination>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default CodigosList;