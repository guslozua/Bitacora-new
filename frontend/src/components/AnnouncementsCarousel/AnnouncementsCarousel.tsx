// src/components/AnnouncementsCarousel/AnnouncementsCarousel.tsx
import React, { useState, useEffect } from 'react';
import { Carousel, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { useTheme } from '../../context/ThemeContext';
import announcementsService, { Announcement } from '../../services/announcementsService';

const AnnouncementsCarousel: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [index, setIndex] = useState(0);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar anuncios al montar el componente
  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Obtener anuncios activos
        const response = await announcementsService.getActiveAnnouncements('all');
        
        if (response.success && response.data && response.data.length > 0) {
          setAnnouncements(response.data);
        } else {
          setAnnouncements([]);
        }
      } catch (err: any) {
        console.error('Error cargando anuncios:', err);
        setError(err.message || 'Error al cargar anuncios');
        setAnnouncements([]);
      } finally {
        setLoading(false);
      }
    };

    loadAnnouncements();
  }, []);

  // Auto-advance carousel si hay anuncios
  useEffect(() => {
    if (announcements.length <= 1) return;

    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % announcements.length);
    }, 10000); // Cambia cada 10 segundos

    return () => clearInterval(interval);
  }, [announcements.length]);

  const handleSelect = (selectedIndex: number) => {
    setIndex(selectedIndex);
  };

  // Manejar clic en botón de acción
  const handleActionClick = async (announcement: Announcement) => {
    try {
      // Registrar clic en estadísticas
      await announcementsService.registerClick(announcement.id);
      
      // Navegar a la URL si existe
      if (announcement.action_url) {
        if (announcement.action_url.startsWith('http')) {
          // URL externa
          window.open(announcement.action_url, '_blank');
        } else {
          // Ruta interna
          window.location.href = announcement.action_url;
        }
      }
    } catch (err) {
      console.error('Error registrando clic:', err);
      // No mostrar error al usuario, solo navegar
      if (announcement.action_url) {
        if (announcement.action_url.startsWith('http')) {
          window.open(announcement.action_url, '_blank');
        } else {
          window.location.href = announcement.action_url;
        }
      }
    }
  };

  const getGradientColors = (type: string) => {
    const gradients = {
      success: isDarkMode 
        ? 'linear-gradient(135deg, #198754 0%, #20c997 100%)'
        : 'linear-gradient(135deg, #198754 0%, #20c997 100%)',
      warning: isDarkMode 
        ? 'linear-gradient(135deg, #fd7e14 0%, #ffc107 100%)'
        : 'linear-gradient(135deg, #fd7e14 0%, #ffc107 100%)',
      info: isDarkMode 
        ? 'linear-gradient(135deg, #0dcaf0 0%, #6f42c1 100%)'
        : 'linear-gradient(135deg, #0dcaf0 0%, #6f42c1 100%)',
      danger: isDarkMode 
        ? 'linear-gradient(135deg, #dc3545 0%, #d63384 100%)'
        : 'linear-gradient(135deg, #dc3545 0%, #d63384 100%)'
    };
    return gradients[type as keyof typeof gradients] || gradients.info;
  };

  const getTextColor = () => {
    return 'white'; // Siempre blanco para contrastar con los gradientes
  };

  // Estado de carga
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '320px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Cargando anuncios...</p>
        </div>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <Alert variant="warning" className="mb-4">
        <Alert.Heading>No se pudieron cargar los anuncios</Alert.Heading>
        <p>{error}</p>
        <Button 
          variant="outline-warning" 
          size="sm" 
          onClick={() => window.location.reload()}
        >
          Reintentar
        </Button>
      </Alert>
    );
  }

  // No hay anuncios activos
  if (announcements.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '320px' }}>
        <div className="text-center text-muted">
          <i className="bi bi-megaphone fs-1 d-block mb-3"></i>
          <h5>No hay anuncios disponibles</h5>
          <p>No existen anuncios activos en este momento.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="position-relative">
      <Carousel
        activeIndex={index}
        onSelect={handleSelect}
        interval={null}
        indicators={false}
        controls={false}
        className="rounded-4 overflow-hidden shadow-lg"
        style={{ height: '320px' }} // Altura aumentada para mejor espaciado
      >
        {announcements.map((announcement) => (
          <Carousel.Item key={announcement.id}>
            <div 
              className="position-relative d-flex align-items-center"
              style={{ 
                background: getGradientColors(announcement.type),
                height: '320px' // Altura actualizada
              }}
            >
              {/* Overlay decorativo */}
              <div 
                className="position-absolute top-0 start-0 w-100 h-100"
                style={{
                  background: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  opacity: 0.3
                }}
              />

              <div className="container position-relative">
                <div className="row h-100">
                  <div className="col-lg-8 mx-auto d-flex flex-column justify-content-center text-center py-3">
                    {/* Badge con número de anuncio - versión sutil */}
                    <div 
                      className="mb-2 px-3 py-1 rounded-pill d-inline-block align-self-center"
                      style={{ 
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        color: 'rgba(255,255,255,0.8)',
                        fontSize: '0.75rem',
                        backdropFilter: 'blur(5px)',
                        border: '1px solid rgba(255,255,255,0.15)'
                      }}
                    >
                      {index + 1} de {announcements.length} • {announcementsService.formatDate(announcement.created_at)}
                    </div>

                    {/* Icono más compacto */}
                    <div className="mb-3">
                      <div 
                        className="mx-auto rounded-circle d-flex align-items-center justify-content-center"
                        style={{
                          width: '60px',
                          height: '60px',
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          backdropFilter: 'blur(10px)',
                          border: '2px solid rgba(255,255,255,0.3)'
                        }}
                      >
                        <i className={`${announcement.icon} fs-2`} style={{ color: 'white' }}></i>
                      </div>
                    </div>

                    {/* Título optimizado */}
                    <h1 
                      className="h3 fw-bold mb-3"
                      style={{ 
                        color: getTextColor(),
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        lineHeight: '1.2',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}
                    >
                      {announcement.title}
                    </h1>

                    {/* Contenido con límite de líneas */}
                    <p 
                      className="mb-3"
                      style={{ 
                        color: 'rgba(255,255,255,0.9)',
                        fontSize: '1rem',
                        lineHeight: '1.4',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical'
                      }}
                    >
                      {announcement.content}
                    </p>

                    {/* Sección inferior con botón y autor */}
                    <div className="mt-auto">
                      {/* Botón de acción más compacto */}
                      {announcement.action_text && (
                        <div className="mb-3">
                          <Button
                            className="px-4 py-2 fw-bold"
                            style={{
                              backgroundColor: 'rgba(255,255,255,0.2)',
                              border: '2px solid rgba(255,255,255,0.4)',
                              color: 'white',
                              backdropFilter: 'blur(10px)',
                              transition: 'all 0.3s ease',
                              fontSize: '0.9rem'
                            }}
                            onClick={() => handleActionClick(announcement)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                            {announcement.action_text}
                            <i className="bi bi-arrow-right ms-2"></i>
                          </Button>
                        </div>
                      )}

                      {/* Autor con separación inferior */}
                      {announcement.created_by_name && (
                        <div className="mt-1 mb-3">
                          <small 
                            style={{ 
                              color: 'rgba(255,255,255,0.7)',
                              fontSize: '0.8rem'
                            }}
                          >
                            <i className="bi bi-person-circle me-1"></i>
                            Publicado por {announcement.created_by_name}
                          </small>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Carousel.Item>
        ))}
      </Carousel>

      {/* Controles personalizados - Solo si hay más de un anuncio */}
      {announcements.length > 1 && (
        <>
          <div className="position-absolute top-50 start-0 translate-middle-y ms-3">
            <Button
              variant="light"
              className="rounded-circle shadow"
              style={{
                width: '50px',
                height: '50px',
                backgroundColor: 'transparent',
                border: 'none',
                backdropFilter: 'blur(5px)'
              }}
              onClick={() => setIndex(index === 0 ? announcements.length - 1 : index - 1)}
            >
              <i className="bi bi-chevron-left" style={{ color: 'white' }}></i>
            </Button>
          </div>

          <div className="position-absolute top-50 end-0 translate-middle-y me-3">
            <Button
              variant="light"
              className="rounded-circle shadow"
              style={{
                width: '50px',
                height: '50px',
                backgroundColor: 'transparent',
                border: 'none',
                backdropFilter: 'blur(5px)'
              }}
              onClick={() => setIndex((index + 1) % announcements.length)}
            >
              <i className="bi bi-chevron-right" style={{ color: 'white' }}></i>
            </Button>
          </div>

          {/* Indicadores personalizados mejorados */}
          <div className="position-absolute bottom-0 start-50 translate-middle-x mb-2">
            <div className="d-flex gap-2">
              {announcements.map((_, idx) => (
                <button
                  key={idx}
                  className="btn p-0 border-0"
                  style={{
                    width: index === idx ? '40px' : '12px',
                    height: '4px',
                    borderRadius: '2px',
                    backgroundColor: index === idx 
                      ? 'rgba(255,255,255,0.9)' 
                      : 'rgba(255,255,255,0.4)',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => setIndex(idx)}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Badge de progreso */}
      <div className="position-absolute top-0 end-0 m-3">
        <Badge 
          className="px-3 py-2 rounded-pill"
          style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: 'white',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.3)'
          }}
        >
          <i className="bi bi-megaphone me-2"></i>
          Anuncios
        </Badge>
      </div>
    </div>
  );
};

export default AnnouncementsCarousel;