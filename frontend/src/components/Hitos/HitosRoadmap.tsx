import React, { useState, useEffect, useMemo } from 'react';

// Tipos para el roadmap
type CategoriaHito = 'principal' | 'secundario' | 'features';

interface RoadmapHito {
  id: number;
  nombre: string;
  fecha_inicio: Date;
  fecha_fin?: Date;
  descripcion?: string;
  impacto?: string;
  usuarios?: any[];
  proyecto_origen_nombre?: string;
  categoria: CategoriaHito;
  x: number;
  y: number;
  width: number;
  height: number;
  connections?: number[];
}

interface RoadmapProps {
  className?: string;
}

const HitosRoadmap: React.FC<RoadmapProps> = ({ className = '' }) => {
  const [hitos, setHitos] = useState<RoadmapHito[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [animationPhase, setAnimationPhase] = useState(0);
  const [hoveredHito, setHoveredHito] = useState<number | null>(null);

  // Simulación de datos
  useEffect(() => {
    setTimeout(() => {
      const mockHitos = [
        {
          id: 1,
          nombre: 'Sistema de Autenticación',
          fecha_inicio: new Date(selectedYear, 1, 15),
          fecha_fin: new Date(selectedYear, 2, 15),
          descripcion: 'Sistema completo de auth con 2FA',
          categoria: 'principal' as const,
          proyecto_origen_nombre: 'Seguridad Core',
          connections: [2, 3]
        },
        {
          id: 2,
          nombre: 'API Gateway v2.0',
          fecha_inicio: new Date(selectedYear, 2, 20),
          fecha_fin: new Date(selectedYear, 4, 1),
          descripcion: 'Gateway principal con balanceador',
          categoria: 'principal' as const,
          proyecto_origen_nombre: 'Infrastructure',
          connections: [4, 5]
        },
        {
          id: 3,
          nombre: 'Dashboard Analytics',
          fecha_inicio: new Date(selectedYear, 3, 1),
          fecha_fin: new Date(selectedYear, 3, 30),
          descripcion: 'Panel de control en tiempo real',
          categoria: 'secundario' as const,
          connections: [6]
        },
        {
          id: 4,
          nombre: 'Base de Datos Distribuida',
          fecha_inicio: new Date(selectedYear, 4, 15),
          fecha_fin: new Date(selectedYear, 6, 1),
          descripcion: 'Migración a arquitectura distribuida',
          categoria: 'principal' as const,
          proyecto_origen_nombre: 'Database Modernization',
          connections: [7]
        },
        {
          id: 5,
          nombre: 'Sistema de Notificaciones',
          fecha_inicio: new Date(selectedYear, 5, 1),
          fecha_fin: new Date(selectedYear, 5, 20),
          descripcion: 'Push notifications y alertas',
          categoria: 'features' as const,
          connections: [8]
        },
        {
          id: 6,
          nombre: 'Mobile App v3.0',
          fecha_inicio: new Date(selectedYear, 6, 1),
          fecha_fin: new Date(selectedYear, 8, 15),
          descripcion: 'App móvil completamente rediseñada',
          categoria: 'principal' as const,
          proyecto_origen_nombre: 'Mobile Experience',
          connections: [9]
        }
      ];

      const hitosConPosiciones = calculateRoadmapPositions(mockHitos);
      setHitos(hitosConPosiciones);
      setLoading(false);
      setAnimationPhase(0);
    }, 1000);
  }, [selectedYear]);

  // Animación progresiva
  useEffect(() => {
    if (hitos.length > 0 && animationPhase < hitos.length) {
      const timer = setTimeout(() => {
        setAnimationPhase(prev => prev + 1);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [hitos, animationPhase]);

  // Calcular posiciones estilo roadmap
  const calculateRoadmapPositions = (hitosData: any[]): RoadmapHito[] => {
    const roadmapWidth = 1200;
    const yearStart = new Date(selectedYear, 0, 1).getTime();
    const yearEnd = new Date(selectedYear, 11, 31).getTime();
    const yearDuration = yearEnd - yearStart;

    const timelineY = 300;
    const lanes: Record<CategoriaHito, { baseY: number; minHeight: number; isAbove: boolean; direction: number }> = {
      principal: { baseY: 180, minHeight: 90, isAbove: true, direction: -1 }, // Crecer hacia arriba
      secundario: { baseY: 370, minHeight: 80, isAbove: false, direction: 1 }, // Crecer hacia abajo
      features: { baseY: 460, minHeight: 70, isAbove: false, direction: 1 } // Crecer hacia abajo
    };

    // Calcular posiciones básicas con altura dinámica
    const hitosConPosicionesBasicas = hitosData.map((hito) => {
      const fechaInicio = new Date(hito.fecha_inicio);
      const fechaFin = hito.fecha_fin ? new Date(hito.fecha_fin) : fechaInicio;
      
      const inicioRelativo = fechaInicio.getTime() - yearStart;
      const finRelativo = fechaFin.getTime() - yearStart;
      
      const x = 80 + (inicioRelativo / yearDuration) * (roadmapWidth - 160);
      const width = Math.max(((finRelativo - inicioRelativo) / yearDuration) * (roadmapWidth - 160), 200);
      
      const categoria = hito.categoria as CategoriaHito;
      const lane = lanes[categoria];
      
      // Calcular altura basada en contenido
      let contentHeight = 40; // Base para título
      if (hito.proyecto_origen_nombre) contentHeight += 25; // Proyecto
      contentHeight += 20; // Fechas
      const height = Math.max(contentHeight + 20, lane.minHeight); // Padding
      
      return {
        ...hito,
        categoria,
        x: Math.max(40, Math.min(x, roadmapWidth - width - 40)),
        y: lane.baseY,
        width: Math.min(width, 400), // Ancho máximo aumentado
        height,
        baseY: lane.baseY,
        isAbove: lane.isAbove,
        direction: lane.direction,
        level: 0 // Nivel inicial
      };
    });

    // Resolver solapamientos con mejor distribución
    Object.keys(lanes).forEach(categoria => {
      const hitosCategoria = hitosConPosicionesBasicas
        .filter(h => h.categoria === categoria)
        .sort((a, b) => a.x - b.x);

      // Asignar niveles para evitar solapamientos
      hitosCategoria.forEach((hitoActual, index) => {
        let nivel = 0;
        let posicionValida = false;
        
        while (!posicionValida) {
          // Calcular Y temporal para este nivel
          const yTemporal = hitoActual.baseY + (hitoActual.direction * nivel * 120);
          
          // Verificar conflictos con otros hitos en este nivel
          const conflictos = hitosCategoria.filter(otroHito => {
            if (otroHito === hitoActual || otroHito.level !== nivel) return false;
            
            // Verificar solapamiento horizontal
            const solapaX = !(otroHito.x + otroHito.width + 30 < hitoActual.x || 
                             otroHito.x > hitoActual.x + hitoActual.width + 30);
            
            // Verificar solapamiento vertical
            const solapaY = Math.abs(otroHito.y - yTemporal) < (otroHito.height + hitoActual.height) / 2 + 20;
            
            return solapaX && solapaY;
          });
          
          if (conflictos.length === 0) {
            hitoActual.level = nivel;
            hitoActual.y = yTemporal;
            posicionValida = true;
          } else {
            nivel++;
          }
          
          // Evitar bucle infinito
          if (nivel > 10) {
            hitoActual.level = nivel;
            hitoActual.y = yTemporal;
            posicionValida = true;
          }
        }
      });
    });

    return hitosConPosicionesBasicas;
  };

  // Obtener color por categoría
  const getCategoryColor = (categoria: CategoriaHito): string => {
    const colors: Record<CategoriaHito, string> = {
      principal: '#e3f2fd',
      secundario: '#f3e5f5',
      features: '#e8f5e8'
    };
    return colors[categoria];
  };

  // Obtener color del borde por categoría
  const getCategoryBorderColor = (categoria: CategoriaHito): string => {
    const colors: Record<CategoriaHito, string> = {
      principal: '#2196f3',
      secundario: '#9c27b0',
      features: '#4caf50'
    };
    return colors[categoria];
  };

  // Generar marcadores de tiempo
  const timeMarkers = useMemo(() => {
    const markers = [];
    for (let month = 0; month < 12; month += 3) {
      const date = new Date(selectedYear, month, 1);
      const position = 100 + (month / 12) * 1000;
      markers.push({
        position,
        label: date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
        fullDate: date
      });
    }
    return markers;
  }, [selectedYear]);

  // Años disponibles
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  }, []);

  if (loading) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        borderRadius: '20px',
        padding: '30px',
        minHeight: '700px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }} className={className}>
        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🚀</div>
        <h3 style={{ color: '#666' }}>Cargando Roadmap...</h3>
        <p style={{ color: '#888' }}>Preparando la línea de tiempo de hitos</p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      borderRadius: '20px',
      padding: '30px',
      minHeight: '700px',
      position: 'relative',
      overflow: 'visible',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      border: '1px solid #e0e7ff'
    }} className={className}>
      {/* Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '15px',
        padding: '20px',
        marginBottom: '30px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{ margin: '0 0 5px 0', color: '#2c3e50', fontWeight: '800' }}>
            🗺️ Roadmap de Hitos {selectedYear}
          </h2>
          <p style={{ margin: '0', color: '#7f8c8d', fontSize: '14px' }}>
            Visualización estratégica de logros y objetivos
          </p>
        </div>
        <div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            style={{
              padding: '10px 15px',
              borderRadius: '10px',
              border: '2px solid #ddd',
              background: 'white',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Roadmap Container */}
      <div style={{
        position: 'relative',
        minHeight: '600px',
        padding: '30px 0',
        overflow: 'visible'
      }}>
        {/* SVG para líneas conectoras */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1
          }}
        >          
          {/* Líneas desde timeline hacia cada hito */}
          {hitos.map(hito => {
            const hitoCenterX = hito.x + hito.width / 2;
            const hitoCenterY = hito.y + hito.height / 2;
            const timelineY = 303;
            const timelineX = hitoCenterX;
            
            return (
              <g key={`connector-${hito.id}`}>
                <line
                  x1={`${(timelineX / 1200) * 100}%`}
                  y1={timelineY}
                  x2={`${(hitoCenterX / 1200) * 100}%`}
                  y2={hitoCenterY}
                  stroke={getCategoryBorderColor(hito.categoria)}
                  strokeWidth="3"
                  opacity="0.6"
                  strokeDasharray="5,5"
                  style={{
                    transition: 'all 0.3s ease',
                    strokeWidth: hoveredHito === hito.id ? 4 : 3,
                    opacity: hoveredHito === hito.id ? 0.9 : 0.6
                  }}
                />
                
                <circle
                  cx={`${(timelineX / 1200) * 100}%`}
                  cy={timelineY}
                  r="5"
                  fill={getCategoryBorderColor(hito.categoria)}
                  stroke="white"
                  strokeWidth="2"
                  style={{
                    transition: 'all 0.3s ease',
                    transform: hoveredHito === hito.id ? 'scale(1.3)' : 'scale(1)'
                  }}
                />
              </g>
            );
          })}
        </svg>

        {/* Línea de tiempo central */}
        <div style={{
          position: 'relative',
          height: '6px',
          background: 'linear-gradient(90deg, #4a90e2 0%, #50c878 50%, #ff6b6b 100%)',
          borderRadius: '3px',
          top: '300px',
          marginBottom: '20px',
          zIndex: 5,
          boxShadow: '0 3px 12px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(0,0,0,0.1)'
        }}>
          {timeMarkers.map((marker, index) => (
            <div
              key={index}
              style={{
                position: 'absolute',
                left: `${(marker.position / 1200) * 100}%`,
                top: '-30px',
                transform: 'translateX(-50%)',
                fontSize: '12px',
                fontWeight: '700',
                color: '#333',
                backgroundColor: 'white',
                padding: '6px 12px',
                borderRadius: '15px',
                border: '2px solid #4a90e2',
                zIndex: 10,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
            >
              {marker.label}
            </div>
          ))}
        </div>

        {/* Etiquetas de categorías */}
        <div style={{
          position: 'absolute',
          left: '20px',
          top: '80px',
          fontSize: '12px',
          fontWeight: '700',
          color: 'white',
          background: getCategoryBorderColor('principal'),
          padding: '6px 12px',
          borderRadius: '15px',
          zIndex: 15,
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
          border: '2px solid white'
        }}>
          🎯 PRINCIPALES
        </div>

        <div style={{
          position: 'absolute',
          right: '20px',
          top: '380px',
          fontSize: '12px',
          fontWeight: '700',
          color: 'white',
          background: getCategoryBorderColor('secundario'),
          padding: '6px 12px',
          borderRadius: '15px',
          zIndex: 15,
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
          border: '2px solid white'
        }}>
          📊 SECUNDARIOS
        </div>

        <div style={{
          position: 'absolute',
          left: '20px',
          top: '480px',
          fontSize: '12px',
          fontWeight: '700',
          color: 'white',
          background: getCategoryBorderColor('features'),
          padding: '6px 12px',
          borderRadius: '15px',
          zIndex: 15,
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
          border: '2px solid white'
        }}>
          ⚡ FEATURES
        </div>

        {/* Hitos */}
        {hitos.map((hito, index) => (
          <div
            key={hito.id}
            style={{
              position: 'absolute',
              left: `${(hito.x / 1200) * 100}%`,
              top: `${hito.y}px`,
              width: `${Math.min((hito.width / 1200) * 100, 30)}%`,
              minWidth: '220px',
              maxWidth: '350px',
              height: 'auto',
              minHeight: `${hito.height}px`,
              backgroundColor: getCategoryColor(hito.categoria),
              border: `3px solid ${getCategoryBorderColor(hito.categoria)}`,
              borderRadius: '15px',
              padding: '16px',
              cursor: 'pointer',
              transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transform: index < animationPhase 
                ? (hoveredHito === hito.id ? 'translateY(-8px) scale(1.05)' : 'translateY(0) scale(1)')
                : 'translateY(30px) scale(0.8)',
              opacity: index < animationPhase ? 1 : 0,
              boxShadow: hoveredHito === hito.id 
                ? '0 12px 35px rgba(0, 0, 0, 0.25)' 
                : '0 6px 20px rgba(0, 0, 0, 0.15)',
              zIndex: hoveredHito === hito.id ? 100 : 20,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              gap: '8px'
            }}
            onMouseEnter={() => setHoveredHito(hito.id)}
            onMouseLeave={() => setHoveredHito(null)}
            title={hito.descripcion}
          >
            {/* Título del hito */}
            <h4 style={{
              fontSize: '15px',
              fontWeight: '700',
              color: '#2c3e50',
              margin: '0',
              lineHeight: '1.3',
              wordBreak: 'break-word',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {hito.nombre}
            </h4>
            
            {/* Proyecto origen */}
            {hito.proyecto_origen_nombre && (
              <div style={{
                fontSize: '12px',
                color: '#7f8c8d',
                fontWeight: '600',
                background: 'rgba(255, 255, 255, 0.7)',
                padding: '4px 8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span>📂</span>
                <span style={{ 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  whiteSpace: 'nowrap' 
                }}>
                  {hito.proyecto_origen_nombre}
                </span>
              </div>
            )}
            
            {/* Fechas */}
            <div style={{
              fontSize: '12px',
              color: '#34495e',
              fontWeight: '700',
              background: 'rgba(255, 255, 255, 0.8)',
              padding: '6px 10px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: 'auto'
            }}>
              <span>📅</span>
              <span>
                {hito.fecha_inicio.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                {hito.fecha_fin && ` - ${hito.fecha_fin.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`}
              </span>
            </div>
          </div>
        ))}

        {/* Leyenda */}
        <div style={{
          position: 'absolute',
          top: '30px',
          right: '30px',
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '20px',
          borderRadius: '15px',
          boxShadow: '0 6px 25px rgba(0, 0, 0, 0.15)',
          fontSize: '12px',
          border: '1px solid rgba(0,0,0,0.1)',
          zIndex: 25
        }}>
          <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: '700', color: '#2c3e50' }}>
            📋 Categorías
          </h4>
          {(['principal', 'secundario', 'features'] as CategoriaHito[]).map(categoria => (
            <div key={categoria} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{
                width: '18px',
                height: '18px',
                backgroundColor: getCategoryColor(categoria),
                border: `3px solid ${getCategoryBorderColor(categoria)}`,
                borderRadius: '6px',
                marginRight: '10px'
              }}></div>
              <span style={{ fontWeight: '600', textTransform: 'capitalize' }}>
                {categoria === 'principal' ? 'Principales' :
                 categoria === 'secundario' ? 'Secundarios' : 'Features'}
              </span>
            </div>
          ))}
        </div>

        {/* Estadísticas */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '20px',
          borderRadius: '15px',
          boxShadow: '0 6px 25px rgba(0, 0, 0, 0.15)',
          fontSize: '13px',
          zIndex: 25,
          border: '1px solid rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontWeight: '700', marginBottom: '12px', color: '#2c3e50', fontSize: '14px' }}>
            📈 Estadísticas {selectedYear}
          </div>
          <div style={{ marginBottom: '4px' }}>📌 Total: <strong>{hitos.length}</strong> hitos</div>
          <div style={{ marginBottom: '4px' }}>🎯 Principales: <strong>{hitos.filter(h => h.categoria === 'principal').length}</strong></div>
          <div style={{ marginBottom: '4px' }}>📊 Secundarios: <strong>{hitos.filter(h => h.categoria === 'secundario').length}</strong></div>
          <div>⚡ Features: <strong>{hitos.filter(h => h.categoria === 'features').length}</strong></div>
        </div>
      </div>
    </div>
  );
};

export default HitosRoadmap;