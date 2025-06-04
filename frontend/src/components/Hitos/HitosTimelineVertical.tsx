import React, { useState, useEffect } from 'react';

// Tipos para el timeline vertical
type CategoriaHito = 'principal' | 'secundario' | 'features';

interface TimelineHito {
  id: number;
  nombre: string;
  fecha_inicio: Date;
  fecha_fin?: Date;
  descripcion?: string;
  impacto?: string;
  usuarios?: any[];
  proyecto_origen_nombre?: string;
  categoria: CategoriaHito;
}

interface TimelineProps {
  className?: string;
}

const HitosTimelineVertical: React.FC<TimelineProps> = ({ className = '' }) => {
  const [hitos, setHitos] = useState<TimelineHito[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [animationPhase, setAnimationPhase] = useState(0);

  // Simulación de datos
  useEffect(() => {
    setTimeout(() => {
      const mockHitos = [
        {
          id: 1,
          nombre: 'Sistema de Autenticación',
          fecha_inicio: new Date(selectedYear, 1, 15),
          fecha_fin: new Date(selectedYear, 2, 15),
          descripcion: 'Implementación completa del sistema de autenticación con 2FA, OAuth y gestión de roles avanzada.',
          categoria: 'principal' as const,
          proyecto_origen_nombre: 'Seguridad Core',
          impacto: 'Mejoró la seguridad del sistema en un 300%'
        },
        {
          id: 2,
          nombre: 'API Gateway v2.0',
          fecha_inicio: new Date(selectedYear, 2, 20),
          fecha_fin: new Date(selectedYear, 4, 1),
          descripcion: 'Gateway principal con balanceador de carga automático y sistema de caché distribuido.',
          categoria: 'principal' as const,
          proyecto_origen_nombre: 'Infrastructure',
          impacto: 'Redujo la latencia en un 60% y mejoró la disponibilidad'
        },
        {
          id: 3,
          nombre: 'Dashboard Analytics',
          fecha_inicio: new Date(selectedYear, 3, 1),
          fecha_fin: new Date(selectedYear, 3, 30),
          descripcion: 'Panel de control en tiempo real con métricas avanzadas y reportes automáticos.',
          categoria: 'secundario' as const,
          impacto: 'Incrementó la toma de decisiones basada en datos'
        },
        {
          id: 4,
          nombre: 'Base de Datos Distribuida',
          fecha_inicio: new Date(selectedYear, 4, 15),
          fecha_fin: new Date(selectedYear, 6, 1),
          descripcion: 'Migración completa a arquitectura distribuida con replicación automática.',
          categoria: 'principal' as const,
          proyecto_origen_nombre: 'Database Modernization',
          impacto: 'Mejoró el rendimiento en un 400% y la resiliencia'
        },
        {
          id: 5,
          nombre: 'Sistema de Notificaciones',
          fecha_inicio: new Date(selectedYear, 5, 1),
          fecha_fin: new Date(selectedYear, 5, 20),
          descripcion: 'Push notifications, alertas por email y notificaciones en tiempo real.',
          categoria: 'features' as const,
          impacto: 'Aumentó el engagement de usuarios en un 150%'
        },
        {
          id: 6,
          nombre: 'Mobile App v3.0',
          fecha_inicio: new Date(selectedYear, 6, 1),
          fecha_fin: new Date(selectedYear, 8, 15),
          descripcion: 'Aplicación móvil completamente rediseñada con nueva UX y funcionalidades.',
          categoria: 'principal' as const,
          proyecto_origen_nombre: 'Mobile Experience',
          impacto: 'Incrementó la retención de usuarios móviles en un 80%'
        }
      ];

      // Ordenar por fecha de inicio
      const hitosOrdenados = mockHitos.sort((a, b) => 
        a.fecha_inicio.getTime() - b.fecha_inicio.getTime()
      );

      setHitos(hitosOrdenados);
      setLoading(false);
      setAnimationPhase(0);
    }, 1000);
  }, [selectedYear]);

  // Animación progresiva
  useEffect(() => {
    if (hitos.length > 0 && animationPhase < hitos.length) {
      const timer = setTimeout(() => {
        setAnimationPhase(prev => prev + 1);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [hitos, animationPhase]);

  // Obtener colores por categoría
  const getCategoryColors = (categoria: CategoriaHito) => {
    const colorMap = {
      principal: {
        primary: '#f54957',
        light: '#fff1f2',
        border: '#f54957'
      },
      secundario: {
        primary: '#1ebad0',
        light: '#f0fdff',
        border: '#1ebad0'
      },
      features: {
        primary: '#7cba01',
        light: '#f7fff0',
        border: '#7cba01'
      }
    };
    return colorMap[categoria];
  };

  // Años disponibles
  const availableYears = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  }, []);

  if (loading) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        borderRadius: '20px',
        padding: '50px',
        minHeight: '600px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        border: '1px solid #e2e8f0'
      }} className={className}>
        <div style={{ 
          fontSize: '4rem', 
          marginBottom: '20px',
          animation: 'bounce 2s infinite'
        }}>
          ⏰
        </div>
        <h3 style={{ 
          color: '#475569', 
          margin: '0 0 10px 0',
          fontSize: '24px',
          fontWeight: '700'
        }}>
          Cargando Timeline...
        </h3>
        <p style={{ 
          color: '#64748b', 
          margin: '0',
          fontSize: '16px'
        }}>
          Preparando la cronología de hitos
        </p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
        
        @keyframes slideInLeft {
          from { 
            opacity: 0; 
            transform: translateX(-100px) scale(0.8); 
          }
          to { 
            opacity: 1; 
            transform: translateX(0) scale(1); 
          }
        }
        
        @keyframes slideInRight {
          from { 
            opacity: 0; 
            transform: translateX(100px) scale(0.8); 
          }
          to { 
            opacity: 1; 
            transform: translateX(0) scale(1); 
          }
        }
        
        @keyframes pulse {
          0%, 100% { 
            transform: scale(1); 
            box-shadow: 0 0 0 0 currentColor; 
          }
          50% { 
            transform: scale(1.1); 
            box-shadow: 0 0 0 10px transparent; 
          }
        }
        
        .timeline-container {
          position: relative;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .timeline-container::before {
          content: '';
          position: absolute;
          width: 5px;
          background: linear-gradient(180deg, #f54957 0%, #1ebad0 50%, #7cba01 100%);
          top: 0;
          bottom: 0;
          left: 50%;
          margin-left: -2.5px;
          border-radius: 10px;
          box-shadow: 0 0 20px rgba(0,0,0,0.3);
        }
        
        .timeline-item {
          padding: 10px 40px;
          position: relative;
          background-color: inherit;
          width: 50%;
        }
        
        .timeline-item::after {
          content: '';
          position: absolute;
          width: 20px;
          height: 20px;
          background-color: white;
          border: 5px solid;
          top: 15px;
          border-radius: 50%;
          z-index: 1;
        }
        
        .timeline-left {
          left: 0;
        }
        
        .timeline-right {
          left: 50%;
        }
        
        .timeline-left::after {
          right: -12px;
        }
        
        .timeline-right::after {
          left: -13px;
        }
        
        .timeline-content {
          padding: 20px 30px;
          background-color: white;
          position: relative;
          border-radius: 15px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          border: 2px solid;
          transition: all 0.3s ease;
        }
        
        .timeline-content:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 40px rgba(0,0,0,0.15);
        }
        
        .timeline-left .timeline-content::before {
          content: '';
          position: absolute;
          top: 20px;
          right: -15px;
          width: 0;
          height: 0;
          border: 15px solid transparent;
          border-left-color: inherit;
        }
        
        .timeline-right .timeline-content::before {
          content: '';
          position: absolute;
          top: 20px;
          left: -15px;
          width: 0;
          height: 0;
          border: 15px solid transparent;
          border-right-color: inherit;
        }
        
        @media screen and (max-width: 768px) {
          .timeline-container::before {
            left: 31px;
          }
          
          .timeline-item {
            width: 100%;
            padding-left: 70px;
            padding-right: 25px;
          }
          
          .timeline-item::before {
            left: 60px;
            border: medium solid white;
            border-width: 10px 10px 10px 0;
            border-color: transparent white transparent transparent;
          }
          
          .timeline-left::after, 
          .timeline-right::after {
            left: 18px;
          }
          
          .timeline-right {
            left: 0%;
          }
          
          .timeline-left .timeline-content::before,
          .timeline-right .timeline-content::before {
            left: -15px;
            border-right-color: inherit;
            border-left-color: transparent;
          }
        }
      `}</style>

      <div style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        borderRadius: '20px',
        padding: '30px',
        minHeight: '600px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        border: '1px solid #e2e8f0'
      }} className={className}>
        
        {/* Header */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '15px',
          padding: '25px',
          marginBottom: '40px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: '1px solid #f1f5f9'
        }}>
          <div>
            <h2 style={{ 
              margin: '0 0 8px 0', 
              color: '#1e293b', 
              fontWeight: '800',
              fontSize: '28px',
              background: 'linear-gradient(135deg, #f54957, #1ebad0)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              📅 Timeline de Hitos {selectedYear}
            </h2>
            <p style={{ 
              margin: '0', 
              color: '#64748b', 
              fontSize: '16px',
              fontWeight: '500'
            }}>
              Cronología visual de logros y objetivos alcanzados
            </p>
          </div>
          <div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              style={{
                padding: '12px 20px',
                borderRadius: '12px',
                border: '2px solid #e2e8f0',
                background: 'white',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                color: '#475569',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
              }}
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Timeline Container */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.7)',
          borderRadius: '20px',
          padding: '50px 20px',
          boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.05)',
          border: '1px solid #f1f5f9'
        }}>
          <div className="timeline-container">
            {hitos.map((hito, index) => {
              const isLeft = index % 2 === 0;
              const isVisible = index < animationPhase;
              const colors = getCategoryColors(hito.categoria);
              
              return (
                <div
                  key={hito.id}
                  className={`timeline-item ${isLeft ? 'timeline-left' : 'timeline-right'}`}
                  style={{
                    animation: isVisible 
                      ? `${isLeft ? 'slideInLeft' : 'slideInRight'} 0.6s ease-out ${index * 0.2}s both`
                      : 'none',
                    opacity: isVisible ? 1 : 0
                  }}
                >
                  <div 
                    className="timeline-content"
                    style={{
                      borderColor: colors.border,
                      backgroundColor: colors.light
                    }}
                  >
                    {/* Fecha Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '-15px',
                      [isLeft ? 'right' : 'left']: '20px',
                      background: colors.primary,
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '700',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                      border: '2px solid white'
                    }}>
                      {hito.fecha_inicio.toLocaleDateString('es-ES', { 
                        month: 'short', 
                        year: 'numeric' 
                      }).toUpperCase()}
                    </div>

                    {/* Título */}
                    <h3 style={{
                      color: colors.primary,
                      margin: '15px 0 10px 0',
                      fontSize: '22px',
                      fontWeight: '700',
                      lineHeight: '1.3'
                    }}>
                      {hito.nombre}
                    </h3>

                    {/* Proyecto origen */}
                    {hito.proyecto_origen_nombre && (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: `${colors.primary}15`,
                        color: colors.primary,
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '600',
                        marginBottom: '15px',
                        border: `1px solid ${colors.primary}30`
                      }}>
                        <span>📂</span>
                        {hito.proyecto_origen_nombre}
                      </div>
                    )}

                    {/* Descripción */}
                    <p style={{
                      color: '#475569',
                      fontSize: '15px',
                      lineHeight: '1.6',
                      margin: '0 0 15px 0',
                      fontWeight: '400'
                    }}>
                      {hito.descripcion}
                    </p>

                    {/* Impacto */}
                    {hito.impacto && (
                      <div style={{
                        background: `${colors.primary}08`,
                        border: `1px solid ${colors.primary}20`,
                        borderRadius: '12px',
                        padding: '12px 15px',
                        marginBottom: '15px'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '8px'
                        }}>
                          <span style={{ 
                            fontSize: '16px',
                            marginTop: '2px'
                          }}>💡</span>
                          <div>
                            <strong style={{ 
                              color: colors.primary, 
                              fontSize: '14px',
                              fontWeight: '600'
                            }}>
                              Impacto:
                            </strong>
                            <p style={{ 
                              margin: '4px 0 0 0', 
                              fontSize: '14px', 
                              color: '#64748b',
                              lineHeight: '1.4'
                            }}>
                              {hito.impacto}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Fechas detalladas */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      color: '#64748b',
                      fontWeight: '500',
                      background: 'rgba(255,255,255,0.8)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #f1f5f9'
                    }}>
                      <span>📅</span>
                      <span>
                        {hito.fecha_inicio.toLocaleDateString('es-ES', { 
                          day: 'numeric', 
                          month: 'long',
                          year: 'numeric'
                        })}
                        {hito.fecha_fin && hito.fecha_fin.getTime() !== hito.fecha_inicio.getTime() && (
                          <>
                            {' → '}
                            {hito.fecha_fin.toLocaleDateString('es-ES', { 
                              day: 'numeric', 
                              month: 'long',
                              year: 'numeric'
                            })}
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                  
                  {/* Timeline dot con el estilo del Timeline clásico */}
                  <div 
                    style={{ 
                      borderColor: colors.primary,
                      color: colors.primary
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Estadísticas finales */}
        <div style={{
          marginTop: '30px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px'
        }}>
          {(['principal', 'secundario', 'features'] as CategoriaHito[]).map(categoria => {
            const colors = getCategoryColors(categoria);
            const count = hitos.filter(h => h.categoria === categoria).length;
            const labels = {
              principal: 'Principales',
              secundario: 'Secundarios', 
              features: 'Features'
            };
            
            return (
              <div
                key={categoria}
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '15px',
                  padding: '25px',
                  textAlign: 'center',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
                  border: `2px solid ${colors.primary}20`,
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  fontSize: '36px',
                  fontWeight: '800',
                  color: colors.primary,
                  marginBottom: '8px'
                }}>
                  {count}
                </div>
                <div style={{
                  fontSize: '16px',
                  color: '#64748b',
                  fontWeight: '600'
                }}>
                  {labels[categoria]}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default HitosTimelineVertical;