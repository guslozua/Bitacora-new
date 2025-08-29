// FORCE RECOMPILE: 2025-08-14T18:20:34.743Z
// src/components/AnnouncementsAdmin/AnnouncementsList.tsx
// 🔐 COMPONENTE CON CONTROL DE PERMISOS APLICADO
// - Editar anuncio: ANNOUNCEMENT_PERMISSIONS.EDIT_ANNOUNCEMENTS
// - Eliminar anuncio: ANNOUNCEMENT_PERMISSIONS.DELETE_ANNOUNCEMENTS
// - Cambiar estado: ANNOUNCEMENT_PERMISSIONS.PUBLISH_ANNOUNCEMENTS

import React, { useState } from 'react';
import { Table, Button, Badge, Dropdown, Form, InputGroup, Spinner, Alert } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { useTheme } from '../../context/ThemeContext';
import announcementsService, { Announcement } from '../../services/announcementsService';

// 🔐 IMPORTS PARA EL SISTEMA DE PERMISOS
import PermissionGate from '../PermissionGate';
import { usePermissions } from '../../hooks/usePermissions';
import { ANNOUNCEMENT_PERMISSIONS } from '../../utils/permissions';

interface AnnouncementsListProps {
  announcements: Announcement[];
  loading: boolean;
  onEdit: (announcement: Announcement) => void;
  onView: (announcement: Announcement) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (id: number, active: boolean) => void;
  onDuplicate: (id: number) => void;
  onRefresh: () => void;
}

const AnnouncementsList: React.FC<AnnouncementsListProps> = ({
  announcements,
  loading,
  onEdit,
  onView,
  onDelete,
  onToggleStatus,
  onDuplicate,
  onRefresh
}) => {
  const { isDarkMode } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('priority');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  
  // 🔐 HOOK PARA VERIFICAR PERMISOS
  const { hasPermission } = usePermissions();

  // ✅ PROTECCIÓN CRÍTICA: Validar props
  if (!announcements) {
    console.warn('AnnouncementsList: announcements prop is undefined');
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="warning" />
        <p className="mt-3 text-warning">Esperando datos de anuncios...</p>
      </div>
    );
  }

  if (!Array.isArray(announcements)) {
    console.error('AnnouncementsList: announcements is not an array:', announcements);
    return (
      <Alert variant="danger">
        <h5>Error de datos</h5>
        <p>Los datos de anuncios no tienen el formato esperado.</p>
      </Alert>
    );
  }

  // Filtrar y ordenar anuncios
  const filteredAnnouncements = announcements
    .filter(announcement => {
      const matchesSearch = !searchTerm || 
        announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        announcement.content.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === 'all' || announcement.type === filterType;
      
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'active' && announcement.active) ||
        (filterStatus === 'inactive' && !announcement.active);
      
      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      let valueA: any, valueB: any;
      
      switch (sortBy) {
        case 'title':
          valueA = a.title.toLowerCase();
          valueB = b.title.toLowerCase();
          break;
        case 'type':
          valueA = a.type;
          valueB = b.type;
          break;
        case 'priority':
          valueA = a.priority;
          valueB = b.priority;
          break;
        case 'created_at':
          valueA = new Date(a.created_at);
          valueB = new Date(b.created_at);
          break;
        default:
          valueA = a.priority;
          valueB = b.priority;
      }
      
      if (sortOrder === 'ASC') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });

  const getTypeColor = (type: string) => {
    const colors = {
      info: 'info',
      warning: 'warning',
      success: 'success',
      danger: 'danger'
    };
    return colors[type as keyof typeof colors] || 'secondary';
  };

  const getStatusBadge = (announcement: Announcement) => {
    const status = announcementsService.getStatusText(announcement);
    return (
      <Badge bg={status.color.replace('#', '')} style={{ backgroundColor: status.color }}>
        {status.text}
      </Badge>
    );
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('DESC');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return <i className="bi bi-arrow-down-up text-muted"></i>;
    return sortOrder === 'ASC' ? 
      <i className="bi bi-arrow-up text-primary"></i> : 
      <i className="bi bi-arrow-down text-primary"></i>;
  };

  // Manejar eliminación con confirmación SweetAlert2
  const handleDeleteClick = async (announcement: Announcement) => {
    const result = await Swal.fire({
      title: '¿Eliminar anuncio?',
      html: `
        <div class="text-start">
          <p><strong>Título:</strong> ${announcement.title}</p>
          <p><strong>Tipo:</strong> <span class="badge badge-${getTypeColor(announcement.type)}">${announcement.type}</span></p>
          <p><strong>Estado:</strong> ${announcement.active ? 'Activo' : 'Inactivo'}</p>
          <p class="text-danger mt-3"><i class="bi bi-exclamation-triangle me-2"></i><strong>Esta acción no se puede deshacer.</strong></p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      if (announcement.id) {
        onDelete(announcement.id);
      } else {
        console.error('AnnouncementsList: announcement.id is undefined for delete', announcement);
        Swal.fire({
          title: 'Error',
          text: 'No se puede eliminar: ID del anuncio no válido',
          icon: 'error'
        });
      }
    }
  };

  // Manejar cambio de estado con confirmación SweetAlert2
  const handleToggleStatusClick = async (announcement: Announcement) => {
    const newStatus = !announcement.active;
    const actionText = newStatus ? 'activar' : 'desactivar';

    const result = await Swal.fire({
      title: `¿${actionText.charAt(0).toUpperCase() + actionText.slice(1)} anuncio?`,
      html: `
        <div class="text-start">
          <p><strong>Título:</strong> ${announcement.title}</p>
          <p><strong>Estado actual:</strong> 
            <span class="badge bg-${announcement.active ? 'success' : 'secondary'}">${announcement.active ? 'Activo' : 'Inactivo'}</span>
          </p>
          <p><strong>Nuevo estado:</strong> 
            <span class="badge bg-${newStatus ? 'success' : 'secondary'}">${newStatus ? 'Activo' : 'Inactivo'}</span>
          </p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: newStatus ? '#28a745' : '#ffc107',
      cancelButtonColor: '#6c757d',
      confirmButtonText: `Sí, ${actionText}`,
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      if (announcement.id) {
        onToggleStatus(announcement.id, newStatus);
      } else {
        console.error('AnnouncementsList: announcement.id is undefined', announcement);
        Swal.fire({
          title: 'Error',
          text: 'No se puede cambiar el estado: ID del anuncio no válido',
          icon: 'error'
        });
      }
    }
  };

  // Manejar duplicación con confirmación SweetAlert2
  const handleDuplicateClick = async (announcement: Announcement) => {
    const result = await Swal.fire({
      title: '¿Duplicar anuncio?',
      html: `
        <div class="text-start">
          <p><strong>Título original:</strong> ${announcement.title}</p>
          <p><strong>Nuevo título:</strong> ${announcement.title} (Copia)</p>
          <p class="text-info mt-3"><i class="bi bi-info-circle me-2"></i>El anuncio duplicado se creará como <strong>inactivo</strong>.</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0d6efd',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, duplicar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      if (announcement.id) {
        onDuplicate(announcement.id);
      } else {
        console.error('AnnouncementsList: announcement.id is undefined for duplicate', announcement);
        Swal.fire({
          title: 'Error',
          text: 'No se puede duplicar: ID del anuncio no válido',
          icon: 'error'
        });
      }
    }
  };

  // Manejar actualización con confirmación SweetAlert2
  const handleRefreshClick = async () => {
    const result = await Swal.fire({
      title: '¿Actualizar lista?',
      text: 'Se recargarán todos los anuncios desde el servidor.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0d6efd',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, actualizar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      onRefresh();
      
      // Mostrar confirmación de recarga
      Swal.fire({
        title: '¡Actualizado!',
        text: 'La lista de anuncios ha sido actualizada',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Cargando anuncios...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filtros y búsqueda */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <InputGroup>
            <InputGroup.Text>
              <i className="bi bi-search"></i>
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Buscar anuncios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <Button 
                variant="outline-secondary" 
                onClick={() => setSearchTerm('')}
                title="Limpiar búsqueda"
              >
                <i className="bi bi-x"></i>
              </Button>
            )}
          </InputGroup>
        </div>
        
        <div className="col-md-2">
          <Form.Select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">Todos los tipos</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="success">Success</option>
            <option value="danger">Danger</option>
          </Form.Select>
        </div>
        
        <div className="col-md-2">
          <Form.Select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </Form.Select>
        </div>
        
        <div className="col-md-2">
          <Form.Select 
            value={`${sortBy}-${sortOrder}`} 
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order as 'ASC' | 'DESC');
            }}
          >
            <option value="priority-DESC">Prioridad (Mayor)</option>
            <option value="priority-ASC">Prioridad (Menor)</option>
            <option value="created_at-DESC">Más reciente</option>
            <option value="created_at-ASC">Más antiguo</option>
            <option value="title-ASC">Título (A-Z)</option>
            <option value="title-DESC">Título (Z-A)</option>
          </Form.Select>
        </div>
        
        <div className="col-md-2">
          <Button 
            variant="outline-secondary" 
            onClick={handleRefreshClick} 
            className="w-100"
            disabled={loading}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Actualizar
          </Button>
        </div>
      </div>

      {/* Información de filtros activos */}
      {(searchTerm || filterType !== 'all' || filterStatus !== 'all') && (
        <div className="mb-3">
          <small className="text-muted">
            Filtros activos: 
            {searchTerm && <Badge bg="secondary" className="ms-1">Buscar: "{searchTerm}"</Badge>}
            {filterType !== 'all' && <Badge bg="secondary" className="ms-1">Tipo: {filterType}</Badge>}
            {filterStatus !== 'all' && <Badge bg="secondary" className="ms-1">Estado: {filterStatus}</Badge>}
            <Button 
              variant="link" 
              size="sm" 
              className="text-decoration-none ms-2"
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setFilterStatus('all');
              }}
            >
              <i className="bi bi-x-circle me-1"></i>Limpiar filtros
            </Button>
          </small>
        </div>
      )}

      {/* Resultados */}
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <span className="text-muted">
          Mostrando {filteredAnnouncements.length} de {announcements.length} anuncios
        </span>
        <div>
          <Badge bg="success" className="me-1">
            {announcements.filter(a => {
              const status = announcementsService.getStatusText(a);
              return status.text === 'Activo';
            }).length} Activos
          </Badge>
          <Badge bg="secondary" className="me-1">
            {announcements.filter(a => !a.active).length} Inactivos
          </Badge>
          <Badge bg="danger">
            {announcements.filter(a => {
              const status = announcementsService.getStatusText(a);
              return status.text === 'Expirado';
            }).length} Expirados
          </Badge>
        </div>
      </div>

      {/* Tabla */}
      {filteredAnnouncements.length === 0 ? (
        <Alert variant="info" className="text-center">
          <i className="bi bi-info-circle fs-1 d-block mb-3"></i>
          <h5>
            {announcements.length === 0 
              ? 'No hay anuncios creados aún' 
              : 'No hay anuncios que coincidan con los filtros'
            }
          </h5>
          <p>
            {announcements.length === 0 
              ? 'Comience creando su primer anuncio con el botón "Nuevo Anuncio".' 
              : 'Intenta cambiar los criterios de búsqueda o filtros.'
            }
          </p>
        </Alert>
      ) : (
        <div className="table-responsive">
          <Table hover className={isDarkMode ? 'table-dark' : ''}>
            <thead>
              <tr>
                <th 
                  style={{ cursor: 'pointer' }} 
                  onClick={() => handleSort('title')}
                  className="user-select-none"
                >
                  Título {getSortIcon('title')}
                </th>
                <th 
                  style={{ cursor: 'pointer' }} 
                  onClick={() => handleSort('type')}
                  className="user-select-none"
                >
                  Tipo {getSortIcon('type')}
                </th>
                <th 
                  style={{ cursor: 'pointer' }} 
                  onClick={() => handleSort('priority')}
                  className="user-select-none"
                >
                  Prioridad {getSortIcon('priority')}
                </th>
                <th>Estado</th>
                <th>Estadísticas</th>
                <th>Autor</th>
                <th 
                  style={{ cursor: 'pointer' }} 
                  onClick={() => handleSort('created_at')}
                  className="user-select-none"
                >
                  Fecha {getSortIcon('created_at')}
                </th>
                <th style={{ width: '200px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredAnnouncements.map((announcement) => (
                <tr key={announcement.id}>
                  <td>
                    <div>
                      <div className="d-flex align-items-center">
                        <i 
                          className={`${announcement.icon} me-2 fs-5`} 
                          style={{ color: announcementsService.getTypeColor(announcement.type) }}
                        ></i>
                        <strong>{announcement.title}</strong>
                      </div>
                      <small className="text-muted">
                        {announcement.content && announcement.content.length > 100 
                          ? `${announcement.content.substring(0, 100)}...` 
                          : announcement.content
                        }
                      </small>
                    </div>
                  </td>
                  <td>
                    <Badge bg={getTypeColor(announcement.type)}>
                      {announcement.type}
                    </Badge>
                  </td>
                  <td>
                    <div className="d-flex align-items-center">
                      <span className="fw-bold me-2">{announcement.priority}</span>
                      <div 
                        className="progress" 
                        style={{ width: '40px', height: '6px' }}
                        title={`Prioridad: ${announcement.priority}/999`}
                      >
                        <div 
                          className="progress-bar" 
                          role="progressbar" 
                          style={{ 
                            width: `${(announcement.priority / 999) * 100}%`,
                            backgroundColor: announcement.priority >= 700 ? '#dc3545' : 
                                           announcement.priority >= 400 ? '#ffc107' : '#28a745'
                          }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {getStatusBadge(announcement)}
                  </td>
                  <td>
                    <small>
                      <div><i className="bi bi-eye me-1"></i>{announcement.views_count || 0} vistas</div>
                      <div><i className="bi bi-hand-index me-1"></i>{announcement.clicks_count || 0} clics</div>
                      {(announcement.views_count || 0) > 0 && (
                        <div className="text-muted">
                          CTR: {(((announcement.clicks_count || 0) / (announcement.views_count || 1)) * 100).toFixed(1)}%
                        </div>
                      )}
                    </small>
                  </td>
                  <td>
                    <small>{announcement.created_by_name || 'N/A'}</small>
                  </td>
                  <td>
                    <small>
                      {announcementsService.formatDate(announcement.created_at)}
                    </small>
                  </td>
                  <td>
                    <div className="d-flex gap-1">
                      {/* 🔐 BOTÓN RÁPIDO DE ESTADO - Solo con permiso de publicar */}
                      <PermissionGate permission={ANNOUNCEMENT_PERMISSIONS.PUBLISH_ANNOUNCEMENTS}>
                        <Button
                          size="sm"
                          variant={announcement.active ? 'success' : 'outline-success'}
                          onClick={() => announcement.id ? handleToggleStatusClick(announcement) : console.error('AnnouncementsList: announcement.id is undefined for toggle button', announcement)}
                          title={announcement.active ? 'Desactivar anuncio' : 'Activar anuncio'}
                        >
                          <i className={`bi ${announcement.active ? 'bi-pause-fill' : 'bi-play-fill'}`}></i>
                        </Button>
                      </PermissionGate>

                      {/* Dropdown de acciones */}
                      <Dropdown>
                        <Dropdown.Toggle 
                          variant="outline-secondary" 
                          size="sm"
                          className="border-0"
                        >
                          <i className="bi bi-three-dots-vertical"></i>
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                          {/* VER - Siempre visible si tiene acceso al dashboard */}
                          <Dropdown.Item 
                            onClick={() => onView(announcement)}
                            className="d-flex align-items-center"
                          >
                            <i className="bi bi-eye me-2"></i>Ver
                          </Dropdown.Item>
                          
                          {/* 🔐 EDITAR - Solo con permiso */}
                          <PermissionGate permission={ANNOUNCEMENT_PERMISSIONS.EDIT_ANNOUNCEMENTS}>
                            <Dropdown.Item 
                              onClick={() => onEdit(announcement)}
                              className="d-flex align-items-center"
                            >
                              <i className="bi bi-pencil me-2"></i>Editar
                            </Dropdown.Item>
                          </PermissionGate>

                          <Dropdown.Divider />

                          {/* 🔐 CAMBIAR ESTADO - Solo con permiso de publicar */}
                          <PermissionGate permission={ANNOUNCEMENT_PERMISSIONS.PUBLISH_ANNOUNCEMENTS}>
                            <Dropdown.Item 
                              onClick={() => announcement.id ? handleToggleStatusClick(announcement) : console.error('AnnouncementsList: announcement.id is undefined for toggle dropdown', announcement)}
                              className="d-flex align-items-center"
                            >
                              <i className={`bi ${announcement.active ? 'bi-pause' : 'bi-play'} me-2`}></i>
                              {announcement.active ? 'Desactivar' : 'Activar'}
                            </Dropdown.Item>
                          </PermissionGate>
                          
                          {/* 🔐 DUPLICAR - Solo con permiso de crear */}
                          <PermissionGate permission={ANNOUNCEMENT_PERMISSIONS.CREATE_ANNOUNCEMENTS}>
                            <Dropdown.Item 
                              onClick={() => handleDuplicateClick(announcement)}
                              className="d-flex align-items-center"
                            >
                              <i className="bi bi-files me-2"></i>Duplicar
                            </Dropdown.Item>
                          </PermissionGate>

                          {announcement.action_url && (
                            <>
                              <Dropdown.Divider />
                              <Dropdown.Item 
                                href={announcement.action_url}
                                target="_blank"
                                className="d-flex align-items-center"
                              >
                                <i className="bi bi-box-arrow-up-right me-2"></i>
                                Abrir enlace
                              </Dropdown.Item>
                            </>
                          )}

                          <Dropdown.Divider />

                          {/* 🔐 ELIMINAR - Solo con permiso */}
                          <PermissionGate permission={ANNOUNCEMENT_PERMISSIONS.DELETE_ANNOUNCEMENTS}>
                            <Dropdown.Item 
                              onClick={() => handleDeleteClick(announcement)}
                              className="d-flex align-items-center text-danger"
                            >
                              <i className="bi bi-trash me-2"></i>Eliminar
                            </Dropdown.Item>
                          </PermissionGate>
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* Información adicional */}
      {filteredAnnouncements.length > 0 && (
        <div className="mt-3 pt-3 border-top">
          <div className="row text-muted small">
            <div className="col-md-6">
              <div className="d-flex align-items-center">
                <i className="bi bi-info-circle me-2"></i>
                <span>
                  Mostrando <strong>{filteredAnnouncements.length}</strong> de <strong>{announcements.length}</strong> anuncios
                </span>
              </div>
            </div>
            <div className="col-md-6 text-md-end">
              <div className="d-flex align-items-center justify-content-md-end">
                <span className="me-3">
                  <i className="bi bi-check-circle-fill text-success me-1"></i>
                  {announcements.filter(a => {
                    const status = announcementsService.getStatusText(a);
                    return status.text === 'Activo';
                  }).length} activos
                </span>
                <span className="me-3">
                  <i className="bi bi-pause-circle-fill text-secondary me-1"></i>
                  {announcements.filter(a => !a.active).length} inactivos
                </span>
                <span>
                  <i className="bi bi-x-circle-fill text-danger me-1"></i>
                  {announcements.filter(a => {
                    const status = announcementsService.getStatusText(a);
                    return status.text === 'Expirado';
                  }).length} expirados
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsList;