// src/components/notificaciones/CampanillaNot.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Dropdown, Badge, Button, ListGroup, Alert, Spinner 
} from 'react-bootstrap';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import NotificacionService, { Notificacion } from '../../services/NotificacionService';

interface CampanillaNotProps {
  refreshInterval?: number;
  userId: number;
}

const CampanillaNot: React.FC<CampanillaNotProps> = ({ 
  refreshInterval = 30000,
  userId
}) => {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const [noLeidasCount, setNoLeidasCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // 🎭 Referencia para la animación de la campana
  const campanaRef = useRef<HTMLElement | null>(null);
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cargar notificaciones al montar el componente
  useEffect(() => {
    cargarNotificaciones();
    
    // Configurar actualización automática
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(cargarNotificaciones, refreshInterval);
    }
    
    // 🎭 Configurar animación aleatoria de la campana
    const setupCampanaAnimation = () => {
      const animateCampana = () => {
        if (campanaRef.current) {
          campanaRef.current.classList.add('animate__animated', 'animate__tada');
          setTimeout(() => {
            campanaRef.current?.classList.remove('animate__animated', 'animate__tada');
          }, 1000); // Duración de la animación
        }
      };
      
      // Ejecutar cada 15-20 segundos aleatoriamente
      const scheduleNextAnimation = () => {
        const randomDelay = Math.floor(Math.random() * 5000) + 15000; // 15-20 segundos
        animationIntervalRef.current = setTimeout(() => {
          animateCampana();
          scheduleNextAnimation(); // Programar la siguiente animación
        }, randomDelay);
      };
      
      scheduleNextAnimation();
    };
    
    setupCampanaAnimation();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (animationIntervalRef.current) {
        clearTimeout(animationIntervalRef.current);
      }
    };
  }, [refreshInterval, userId]);

  const cargarNotificaciones = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Usar tu servicio existente
      const notificacionesData = await NotificacionService.obtenerNotificaciones(userId, false);
      const contadorNoLeidas = await NotificacionService.obtenerContadorNoLeidas(userId);
      
      setNotificaciones(notificacionesData.slice(0, 10)); // Últimas 10
      setNoLeidasCount(contadorNoLeidas);
      
    } catch (error: any) {
      console.error('Error al cargar notificaciones:', error);
      setError('Error al cargar notificaciones');
    } finally {
      setLoading(false);
    }
  };

  const marcarComoLeida = async (id: number) => {
    try {
      await NotificacionService.marcarComoLeida(id);
      
      // Actualizar estado local
      setNotificaciones(prev => prev.map(n => 
        n.id === id ? { ...n, leida: true } : n
      ));
      
      // Actualizar contador
      setNoLeidasCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
    }
  };

  const marcarTodasComoLeidas = async () => {
    try {
      await NotificacionService.marcarTodasComoLeidas(userId);
      
      // Actualizar estado local
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
      setNoLeidasCount(0);
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
    }
  };

  const getIconoTipo = (tipo: string) => {
    switch (tipo) {
      case 'nuevo_incidente':
        return 'bi-exclamation-triangle-fill text-warning';
      case 'cambio_estado':
        return 'bi-arrow-repeat text-info';
      case 'incidente_liquidado':
        return 'bi-cash-coin text-success';
      case 'incidente_rechazado':
        return 'bi-x-circle-fill text-danger';
      case 'recordatorio':
        return 'bi-clock-fill text-secondary';
      default:
        return 'bi-bell-fill text-primary';
    }
  };

  const handleNotificacionClick = (notificacion: Notificacion) => {
    // Marcar como leída si no lo está
    if (!notificacion.leida) {
      marcarComoLeida(notificacion.id);
    }
    
    // Navegar según el tipo de notificación
    if (notificacion.referencia_id && notificacion.referencia_tipo === 'incidente') {
      // Aquí podrías navegar al incidente específico
      console.log('Navegar a incidente:', notificacion.referencia_id);
    }
    
    setShow(false);
  };

  const formatearTiempo = (fecha: string) => {
    const now = new Date();
    const fechaNotificacion = new Date(fecha);
    const diffMinutos = Math.floor((now.getTime() - fechaNotificacion.getTime()) / (1000 * 60));
    
    if (diffMinutos < 1) return 'Ahora';
    if (diffMinutos < 60) return `${diffMinutos}m`;
    if (diffMinutos < 1440) return `${Math.floor(diffMinutos / 60)}h`;
    return format(fechaNotificacion, 'dd/MM', { locale: es });
  };

  return (
    <Dropdown show={show} onToggle={setShow} align="end">
      <Dropdown.Toggle
        as={Button}
        variant="link"
        className="position-relative p-2 border-0 bg-transparent"
        style={{ boxShadow: 'none' }}
      >
        <span 
          ref={campanaRef} // 🎭 Referencia en un span que envuelve el ícono
          style={{ display: 'inline-block' }} // Necesario para que funcione la animación
        >
          <i className="bi bi-bell fs-5"></i>
        </span>
        {noLeidasCount > 0 && (
          <Badge 
            bg="danger" 
            pill 
            className="position-absolute top-0 start-100 translate-middle"
            style={{ fontSize: '0.7rem' }}
          >
            {noLeidasCount > 99 ? '99+' : noLeidasCount}
          </Badge>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu className="shadow-lg" style={{ width: '350px', maxHeight: '500px' }}>
        <div className="px-3 py-2 border-bottom d-flex justify-content-between align-items-center">
          <h6 className="mb-0">
            <i className="bi bi-bell me-2"></i>
            Notificaciones
          </h6>
          {noLeidasCount > 0 && (
            <Button
              variant="link"
              size="sm"
              className="p-0 text-decoration-none"
              onClick={marcarTodasComoLeidas}
            >
              Marcar todas como leídas
            </Button>
          )}
        </div>

        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" size="sm" />
              <div className="mt-2">Cargando...</div>
            </div>
          ) : error ? (
            <Alert variant="danger" className="m-3 mb-0">
              {error}
            </Alert>
          ) : notificaciones.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-bell-slash fs-1"></i>
              <div className="mt-2">No hay notificaciones</div>
            </div>
          ) : (
            <ListGroup variant="flush">
              {notificaciones.map((notificacion) => (
                <ListGroup.Item
                  key={notificacion.id}
                  action
                  className={`border-0 ${!notificacion.leida ? 'bg-light' : ''}`}
                  onClick={() => handleNotificacionClick(notificacion)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex align-items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <i className={getIconoTipo(notificacion.tipo)}></i>
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <div className="d-flex justify-content-between align-items-start">
                        <h6 className="mb-1 fw-bold">
                          {notificacion.titulo}
                        </h6>
                        <small className="text-muted flex-shrink-0 ms-2">
                          {formatearTiempo(notificacion.fecha_creacion)}
                        </small>
                      </div>
                      <p className="mb-1 text-muted small">
                        {notificacion.mensaje}
                      </p>
                      {!notificacion.leida && (
                        <Badge bg="primary" className="badge-sm">
                          Nueva
                        </Badge>
                      )}
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </div>

        {notificaciones.length > 0 && (
          <div className="border-top px-3 py-2 text-center">
            <Button
              variant="link"
              size="sm"
              className="text-decoration-none"
              onClick={() => {
                setShow(false);
                // Navegar a la página completa de notificaciones
                window.location.href = '/notificaciones';
              }}
            >
              Ver todas las notificaciones
            </Button>
          </div>
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default CampanillaNot;