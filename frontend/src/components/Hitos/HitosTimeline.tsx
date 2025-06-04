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

const HitosTimeline: React.FC<TimelineProps> = ({ className = '' }) => {
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
          descripcion: 'Implementación completa del sistema de autenticación con 2FA, OAuth y gestión de roles.',
          categoria: 'principal' as const,
          proyecto_origen_nombre: 'Seguridad Core',
          impacto: 'Mejoró la seguridad del sistema en un 300%'
        },
        {
          id: 2,
          nombre: 'API Gateway v2.0',
          fecha_inicio: new Date(selectedYear, 2, 20),
          fecha_fin: new Date(selectedYear, 4, 1),
          descripcion: 'Gateway principal con balanceador de carga y sistema de caché distribuido.',
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
          descripcion: 'Migración a arquitectura distribuida con replicación automática y backup.',
          categoria: 'principal' as const,
          proyecto_origen_nombre: 'Database Modernization',
          impacto: 'Mejoró el rendimiento en un 400% y la resilencia'
        },
        {
          id: 5,
          nombre: 'Sistema de Notificaciones',
          fecha_inicio: new Date(selectedYear, 5, 1),
          fecha_fin: new Date(selectedYear, 5, 20),
          descripcion: 'Push notifications, alertas por email y sistema de notificaciones en tiempo real.',
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
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [hitos, animationPhase]);

  // Obtener color por categoría
  const getCategoryColor = (categoria: CategoriaHito): string => {
    const colors: Record<CategoriaHito, string> = {
      principal: '#f54957',
      secundario: '#1ebad0',
      features: '#7cba01'
    };
    return colors[categoria];
  };

  // Años disponibles
  const availableYears = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  }, []);

  if (loading) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        borderRadius: '20px',
        padding: '50px',
        minHeight: '600px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }} className={className}>
        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⏰</div>
        <h3 style={{ color: '#666', margin: '0 0 10px 0' }}>Cargando Timeline...</h3>
        <p style={{ color: '#888', margin: '0' }}>Preparando la línea de tiempo de hitos</p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      borderRadius: '20px',
      padding: '30px',
      minHeight: '600px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }} className={className}>
      
      {/* Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '15px',
        padding: '25px',
        marginBottom: '40px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{ 
            margin: '0 0 5px 0', 
            color: '#2c3e50', 
            fontWeight: '800',
            fontSize: '28px'
          }}>
            📅 Timeline de Hitos {selectedYear}
          </h2>
          <p style={{ margin: '0', color: '#7f8c8d', fontSize: '15px' }}>
            Cronología de logros y objetivos alcanzados
          </p>
        </div>
        <div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            style={{
              padding: '12px 18px',
              borderRadius: '12px',
              border: '2px solid #ddd',
              background: 'white',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer'
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
        position: 'relative',
        overflow: 'hidden',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '40px 20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        
        {/* Línea central vertical */}
        <div style={{
          position: 'absolute',
          width: '5px',
          height: '90%',
          background: 'linear-gradient(180deg, #f54957 0%, #1ebad0 50%, #7cba01 100%)',
          borderRadius: '10px',
          top: '5%',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1,
          boxShadow: '0 0 20px rgba(0, 0, 0, 0.2)'
        }} />

        {/* Timeline Items */}
        {hitos.map((hito, index) => {
          const isEven = index % 2 === 0;
          const isVisible = index < animationPhase;
          const categoryColor = getCategoryColor(hito.categoria);
          
          return (
            <div
              key={hito.id}
              style={{
                width: '50%',
                paddingLeft: isEven ? '0' : '100px',
                paddingRight: isEven ? '100px' : '0',
                float: isEven ? 'left' : 'right',
                position: 'relative',
                marginBottom: index === hitos.length - 1 ? '0' : '60px',
                clear: 'both'
              }}
            >
              {/* Punto de conexión */}
              <div style={{
                position: 'absolute',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#fff',
                border: `5px solid ${categoryColor}`,
                top: '50%',
                [isEven ? 'right' : 'left']: '-10px',
                transform: 'translateY(-50%)',
                zIndex: 10,
                transition: 'all 0.3s ease',
                boxShadow: `0 0 0 0 ${categoryColor}`,
                animation: isVisible ? `pulse-${index} 2s ease-in-out infinite` : 'none'
              }} />

              {/* Línea conectora punteada */}
              <div style={{
                position: 'absolute',
                width: '90px',
                height: '10px',
                borderTop: '7px dotted #333',
                top: '50%',
                [isEven ? 'right' : 'left']: '-92px',
                transform: 'translateY(-50%)',
                opacity: 0.3
              }} />

              {/* Contenido del timeline */}
              <div style={{
                display: 'block',
                paddingLeft: isEven ? '0' : '150px',
                paddingRight: isEven ? '150px' : '0',
                position: 'relative',
                transform: isVisible ? 'translateX(0) scale(1)' : `translateX(${isEven ? '-50px' : '50px'}) scale(0.9)`,
                opacity: isVisible ? 1 : 0,
                transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transitionDelay: `${index * 0.1}s`
              }}>
                
                {/* Año/Fecha circular */}
                <div style={{
                  position: 'absolute',
                  top: '0',
                  [isEven ? 'left' : 'right']: '0',
                  width: '120px',
                  height: '120px',
                  lineHeight: '100px',
                  borderRadius: '50%',
                  border: `10px solid ${categoryColor}`,
                  fontSize: '16px',
                  fontWeight: '700',
                  color: categoryColor,
                  textAlign: 'center',
                  background: 'white',
                  boxShadow: `inset 0 0 10px rgba(0,0,0,0.1), 0 5px 20px ${categoryColor}40`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>
                    {hito.fecha_inicio.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '800' }}>
                    {hito.fecha_inicio.getFullYear()}
                  </div>
                  
                  {/* Flecha */}
                  <div style={{
                    position: 'absolute',
                    bottom: '-13px',
                    [isEven ? 'right' : 'left']: '0',
                    width: '0',
                    height: '0',
                    borderLeft: isEven ? 'none' : `20px solid ${categoryColor}`,
                    borderRight: isEven ? `20px solid ${categoryColor}` : 'none',
                    borderTop: '10px solid transparent',
                    borderBottom: '10px solid transparent',
                    transform: isEven ? 'rotate(45deg)' : 'rotate(-45deg)'
                  }} />
                </div>

                {/* Contenido interno */}
                <div style={{ 
                  marginTop: isEven ? '0' : '0',
                  background: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '15px',
                  padding: '25px',
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                  border: `2px solid ${categoryColor}20`
                }}>
                  
                  {/* Título */}
                  <h3 style={{
                    fontSize: '22px',
                    fontWeight: '700',
                    color: categoryColor,
                    textTransform: 'uppercase',
                    margin: '0 0 10px 0',
                    letterSpacing: '0.5px'
                  }}>
                    {hito.nombre}
                  </h3>

                  {/* Proyecto origen */}
                  {hito.proyecto_origen_nombre && (
                    <div style={{
                      display: 'inline-block',
                      background: `${categoryColor}15`,
                      color: categoryColor,
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      marginBottom: '15px',
                      border: `1px solid ${categoryColor}30`
                    }}>
                      📂 {hito.proyecto_origen_nombre}
                    </div>
                  )}

                  {/* Descripción */}
                  <p style={{
                    fontSize: '15px',
                    color: '#555',
                    lineHeight: '1.6',
                    margin: '0 0 15px 0',
                    letterSpacing: '0.3px'
                  }}>
                    {hito.descripcion}
                  </p>

                  {/* Impacto */}
                  {hito.impacto && (
                    <div style={{
                      background: `${categoryColor}10`,
                      border: `1px solid ${categoryColor}30`,
                      borderRadius: '10px',
                      padding: '12px',
                      marginBottom: '15px'
                    }}>
                      <strong style={{ color: categoryColor, fontSize: '14px' }}>
                        💡 Impacto:
                      </strong>
                      <span style={{ marginLeft: '8px', fontSize: '14px', color: '#666' }}>
                        {hito.impacto}
                      </span>
                    </div>
                  )}

                  {/* Fechas */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '13px',
                    color: '#777',
                    fontWeight: '600'
                  }}>
                    <span>📅</span>
                    <span style={{ marginLeft: '8px' }}>
                      {hito.fecha_inicio.toLocaleDateString('es-ES', { 
                        day: 'numeric', 
                        month: 'long',
                        year: 'numeric'
                      })}
                      {hito.fecha_fin && hito.fecha_fin.getTime() !== hito.fecha_inicio.getTime() && (
                        <span>
                          {' → '}
                          {hito.fecha_fin.toLocaleDateString('es-ES', { 
                            day: 'numeric', 
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Clear float */}
        <div style={{ clear: 'both' }} />
      </div>

      {/* Estadísticas */}
      <div style={{
        marginTop: '30px',
        display: 'flex',
        justifyContent: 'space-around',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '15px',
        padding: '20px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#f54957' }}>
            {hitos.filter(h => h.categoria === 'principal').length}
          </div>
          <div style={{ fontSize: '14px', color: '#666', fontWeight: '600' }}>
            Principales
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#1ebad0' }}>
            {hitos.filter(h => h.categoria === 'secundario').length}
          </div>
          <div style={{ fontSize: '14px', color: '#666', fontWeight: '600' }}>
            Secundarios
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#7cba01' }}>
            {hitos.filter(h => h.categoria === 'features').length}
          </div>
          <div style={{ fontSize: '14px', color: '#666', fontWeight: '600' }}>
            Features
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse-0 { 0%, 100% { box-shadow: 0 0 0 0 #f54957; } 50% { box-shadow: 0 0 0 10px #f5495700; } }
        @keyframes pulse-1 { 0%, 100% { box-shadow: 0 0 0 0 #1ebad0; } 50% { box-shadow: 0 0 0 10px #1ebad000; } }
        @keyframes pulse-2 { 0%, 100% { box-shadow: 0 0 0 0 #7cba01; } 50% { box-shadow: 0 0 0 10px #7cba0100; } }
        @keyframes pulse-3 { 0%, 100% { box-shadow: 0 0 0 0 #f54957; } 50% { box-shadow: 0 0 0 10px #f5495700; } }
        @keyframes pulse-4 { 0%, 100% { box-shadow: 0 0 0 0 #1ebad0; } 50% { box-shadow: 0 0 0 10px #1ebad000; } }
        @keyframes pulse-5 { 0%, 100% { box-shadow: 0 0 0 0 #7cba01; } 50% { box-shadow: 0 0 0 10px #7cba0100; } }
      `}</style>
    </div>
  );
};

export default HitosTimeline;