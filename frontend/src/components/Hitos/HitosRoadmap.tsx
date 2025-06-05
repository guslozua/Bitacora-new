import React, { useState, useEffect, useMemo } from 'react';
import hitoService from '../../services/hitoService';
import type { HitoCompleto, HitoFilters, ApiResponse } from '../../types/hitos.types';

// Tipos para el roadmap
type CategoriaHito = 'principal' | 'secundario' | 'features';

interface RoadmapHito extends HitoCompleto {
  x: number;
  y: number;
  width: number;
  height: number;
  connections?: number[];
  mesNumero: number;
  isAbove: boolean;
  level: number;
  categoria: CategoriaHito;
  // Propiedades auxiliares para manejar fechas como Date en cálculos
  _fechaInicioDate: Date;
  _fechaFinDate?: Date;
}

interface RoadmapProps {
  className?: string;
  filters?: HitoFilters;
}

interface Tooltip {
  visible: boolean;
  x: number;
  y: number;
  hito: RoadmapHito | null;
}

interface TimeMarker {
  position: number;
  label: string;
  fullDate: Date;
  isAlternate: boolean;
}

const HitosRoadmap: React.FC<RoadmapProps> = ({ className = '', filters = {} }) => {
  const [hitosData, setHitosData] = useState<Record<number, RoadmapHito[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [animationPhase, setAnimationPhase] = useState(0);
  const [tooltip, setTooltip] = useState<Tooltip>({ visible: false, x: 0, y: 0, hito: null });
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Función auxiliar para convertir fechas de forma segura
  const formatDate = (fecha: Date | string | undefined, options: Intl.DateTimeFormatOptions): string => {
    if (!fecha) return '-';
    try {
      const dateObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
      return dateObj.toLocaleDateString('es-ES', options);
    } catch (error) {
      return '-';
    }
  };

  // Función auxiliar para asegurar que tenemos un objeto Date
  const ensureDate = (fecha: Date | string | undefined): Date | null => {
    if (!fecha) return null;
    try {
      return typeof fecha === 'string' ? new Date(fecha) : fecha;
    } catch (error) {
      return null;
    }
  };

  // Función para determinar la categoría de un hito
  const determineCategory = (hito: HitoCompleto): CategoriaHito => {
    const nombre = (hito.nombre || '').toLowerCase();
    const proyectoOrigen = (hito.proyecto_origen_nombre || '').toLowerCase();
    
    const principalKeywords = ['api', 'base de datos', 'sistema', 'auth', 'ticky', 'infrastructure', 'security'];
    const featuresKeywords = ['dashboard', 'notification', 'mobile', 'ui', 'ux', 'frontend'];
    
    if (principalKeywords.some(keyword => nombre.includes(keyword) || proyectoOrigen.includes(keyword))) {
      return 'principal';
    } else if (featuresKeywords.some(keyword => nombre.includes(keyword) || proyectoOrigen.includes(keyword))) {
      return 'features';
    } else {
      return 'secundario';
    }
  };

  // Años disponibles
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  }, []);

  // Cargar todos los hitos y organizarlos por año
  const fetchAllHitos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Cargando todos los hitos para roadmap...');
      
      const response: ApiResponse<HitoCompleto[]> = await hitoService.getHitos(filters);
      
      if (response && response.data && Array.isArray(response.data)) {
        // Obtener detalles completos para cada hito
        const hitosConDetalles = await Promise.all(
          response.data.map(async (hito: HitoCompleto) => {
            try {
              const detalles = await hitoService.getHitoById(hito.id);
              return detalles.data || hito;
            } catch (error) {
              console.warn(`⚠️ No se pudieron cargar detalles para hito ${hito.id}:`, error);
              return hito;
            }
          })
        );

        // Organizar hitos por año
        const hitosOrganizados: Record<number, RoadmapHito[]> = {};
        
        availableYears.forEach(year => {
          const hitosDelAño = hitosConDetalles
            .filter(hito => {
              if (!hito.fecha_inicio) return false;
              const fechaInicio = ensureDate(hito.fecha_inicio);
              return fechaInicio && fechaInicio.getFullYear() === year;
            })
            .map(hito => {
              const fechaInicio = ensureDate(hito.fecha_inicio);
              const fechaFin = ensureDate(hito.fecha_fin);
              return {
                ...hito,
                fecha_inicio: fechaInicio!.toISOString(),
                fecha_fin: fechaFin ? fechaFin.toISOString() : undefined,
                categoria: determineCategory(hito),
                _fechaInicioDate: fechaInicio!,
                _fechaFinDate: fechaFin || undefined
              };
            })
            .sort((a, b) => a._fechaInicioDate.getTime() - b._fechaInicioDate.getTime());

          if (hitosDelAño.length > 0) {
            hitosOrganizados[year] = calculateRoadmapPositions(hitosDelAño, year);
          } else {
            hitosOrganizados[year] = [];
          }
        });

        setHitosData(hitosOrganizados);
        console.log('✅ Todos los hitos organizados por año:', hitosOrganizados);
        
      } else {
        console.warn('⚠️ Respuesta sin datos válidos:', response);
        setHitosData({});
      }
    } catch (error: any) {
      console.error('❌ Error al cargar hitos para roadmap:', error);
      setError('Error al cargar los hitos del roadmap');
      setHitosData({});
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchAllHitos();
  }, []);

  // Animación escalonada para el año activo
  useEffect(() => {
    const hitosActuales = hitosData[selectedYear] || [];
    if (hitosActuales.length > 0 && animationPhase < hitosActuales.length) {
      const timer = setTimeout(() => {
        setAnimationPhase(prev => prev + 1);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [hitosData, selectedYear, animationPhase]);

  // Cambiar año con transición más suave
  const changeYear = (newYear: number) => {
    if (newYear === selectedYear || isTransitioning) return;
    
    setIsTransitioning(true);
    setAnimationPhase(0);
    
    // Transición más suave - fade out
    setTimeout(() => {
      setSelectedYear(newYear);
      // Transición más suave - fade in
      setTimeout(() => {
        setIsTransitioning(false);
      }, 250);
    }, 250);
  };

  // Navegar a año anterior/siguiente
  const navigateYear = (direction: 'prev' | 'next') => {
    const currentIndex = availableYears.indexOf(selectedYear);
    let newIndex;
    
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : availableYears.length - 1;
    } else {
      newIndex = currentIndex < availableYears.length - 1 ? currentIndex + 1 : 0;
    }
    
    changeYear(availableYears[newIndex]);
  };

  const calculateRoadmapPositions = (hitosData: any[], year: number): RoadmapHito[] => {
    if (hitosData.length === 0) return [];

    // 🔧 RESPONSIVE: Ajustar dimensiones según el ancho de pantalla
    const screenWidth = window.innerWidth;
    const roadmapWidth = Math.min(1000, screenWidth - 120); // Mínimo margen de 60px a cada lado
    const availableWidth = roadmapWidth - 200; // 100px a cada lado
    const timelineY = 250;
    const cardHeight = 60;
    const cardWidth = Math.min(180, Math.max(120, screenWidth * 0.15)); // Responsive card width
    const levelDistances = [20, 30, 95];
    const maxLevels = 2;
    
    // 🔧 CORRECCIÓN DEFINITIVA: Usar método más simple y preciso
    const hitosConPosicionesBasicas = hitosData.map((hito, index) => {
      const fechaInicio = hito._fechaInicioDate;
      const mesNumero = fechaInicio.getMonth(); // 0-11
      const diaDelMes = fechaInicio.getDate(); // 1-31
      
      // 🎯 MÉTODO CORREGIDO: Cálculo más preciso con días reales del mes
      const diasDelMes = new Date(fechaInicio.getFullYear(), mesNumero + 1, 0).getDate(); // Días reales del mes
      const mesDecimal = mesNumero + (diaDelMes / diasDelMes); // Usar días reales en lugar de 30
      const proporcionDelAño = (mesDecimal + 1) / 12; // Sumar 1 para convertir a mes real (1-12)
      
      // Asegurar que esté entre 0 y 1
      const proporcionFinal = Math.max(0, Math.min(1, proporcionDelAño));
      
      // 📍 Debugging: Log para verificar cálculos
      console.log(`🔍 Hito: ${hito.nombre}`);
      console.log(`📅 Fecha: ${fechaInicio.toLocaleDateString('es-ES')}`);
      console.log(`📊 Mes base-0: ${mesNumero} (${fechaInicio.toLocaleDateString('es-ES', { month: 'short' })}), Día: ${diaDelMes}/${diasDelMes}`);
      console.log(`🔢 Mes decimal: ${mesDecimal.toFixed(3)}`);
      console.log(`⚡ Proporción: ${(proporcionFinal * 100).toFixed(1)}%`);
      console.log(`🎯 Para mes ${mesNumero+1}: debería estar al ${(((mesNumero+1)/12)*100).toFixed(1)}% aprox`);
      
      // Mapear a posición horizontal: 100px inicio + ancho disponible
      const x = 100 + proporcionFinal * availableWidth;
      
      const isAbove = index % 2 === 0;

      return {
        ...hito,
        x: Math.max(50, Math.min(x - cardWidth/2, roadmapWidth - cardWidth - 50)),
        y: 0,
        width: cardWidth,
        height: cardHeight,
        mesNumero,
        isAbove,
        level: 0
      };
    });

    const hitosArriba = hitosConPosicionesBasicas.filter(h => h.isAbove);
    const hitosAbajo = hitosConPosicionesBasicas.filter(h => !h.isAbove);

    const resolverSolapamientos = (hitos: any[], esArriba: boolean) => {
      hitos.sort((a, b) => a.x - b.x);

      hitos.forEach((hitoActual) => {
        let nivel = 0;
        let posicionValida = false;
        
        while (!posicionValida && nivel <= maxLevels) {
          hitoActual.level = nivel;
          const distancia = levelDistances[nivel] + cardHeight;
          
          if (esArriba) {
            hitoActual.y = timelineY - distancia;
          } else {
            hitoActual.y = timelineY + levelDistances[nivel];
          }
          
          const conflictos = hitos.filter(otroHito => {
            if (otroHito === hitoActual || otroHito.level !== nivel) return false;
            const margenX = 15;
            const solapaX = !(otroHito.x + otroHito.width + margenX < hitoActual.x || 
                             otroHito.x > hitoActual.x + hitoActual.width + margenX);
            return solapaX;
          });
          
          if (conflictos.length === 0) {
            posicionValida = true;
          } else {
            nivel++;
          }
        }
        
        if (!posicionValida) {
          hitoActual.level = maxLevels;
          const distancia = levelDistances[maxLevels] + cardHeight;
          if (esArriba) {
            hitoActual.y = timelineY - distancia;
          } else {
            hitoActual.y = timelineY + levelDistances[maxLevels];
          }
        }
      });
    };

    resolverSolapamientos(hitosArriba, true);
    resolverSolapamientos(hitosAbajo, false);

    return hitosConPosicionesBasicas;
  };

  const getCategoryColor = (categoria: CategoriaHito): { bg: string; border: string; text: string } => {
    const colors = {
      principal: { bg: '#fff5f5', border: '#f54957', text: '#f54957' },
      secundario: { bg: '#f0fdff', border: '#1ebad0', text: '#1ebad0' },
      features: { bg: '#f8fff0', border: '#7cba01', text: '#7cba01' }
    };
    return colors[categoria];
  };

  // 🔧 CORRECCIÓN: Marcadores de tiempo más precisos
  const timeMarkers = useMemo((): TimeMarker[] => {
    const markers: TimeMarker[] = [];
    
    // 🔧 RESPONSIVE: Calcular ancho disponible
    const screenWidth = window.innerWidth;
    const availableWidth = Math.min(800, screenWidth - 320); // Ajustar según pantalla
    
    // Meses clave con posicionamiento correcto para el año seleccionado
    const keyMonths = [
      { month: 0, label: 'ENE' },   // Enero (0/12 = 0%)
      { month: 2, label: 'MAR' },   // Marzo (2/12 = 16.67%)
      { month: 5, label: 'JUN' },   // Junio (5/12 = 41.67%)
      { month: 8, label: 'SEP' },   // Septiembre (8/12 = 66.67%)
      { month: 11, label: 'DIC' }   // Diciembre (11/12 = 91.67%)
    ];
    
    keyMonths.forEach(({ month, label }, index) => {
      // 🎯 MISMO CÁLCULO QUE LOS HITOS: mes / 12
      const proporcion = month / 12; // 🔧 CORREGIDO: dividir por 12
      const position = 100 + proporcion * availableWidth;
      
      // 📍 Debugging para marcadores
      console.log(`📌 Marcador ${label}: Mes ${month}/12 -> ${(proporcion * 100).toFixed(1)}% -> ${position.toFixed(1)}px`);
      
      const fechaMarcador = new Date(selectedYear, month, 1);
      
      markers.push({
        position,
        label,
        fullDate: fechaMarcador,
        isAlternate: index % 2 === 1
      });
    });
    
    return markers;
  }, [selectedYear]);

  const handleHitoHover = (event: React.MouseEvent, hito: RoadmapHito) => {
    setTooltip({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      hito
    });
  };

  const handleHitoLeave = () => {
    setTooltip({ visible: false, x: 0, y: 0, hito: null });
  };

  // Renderizar contenido del roadmap
  const renderRoadmapContent = () => {
    const hitos = hitosData[selectedYear] || [];
    
    return (
      <div style={{
        position: 'relative',
        minHeight: '450px',
        maxHeight: '450px',
        padding: '30px 0',
        overflow: 'hidden',
        opacity: isTransitioning ? 0 : 1,
        transform: isTransitioning ? 'translateY(20px) scale(0.98)' : 'translateY(0) scale(1)',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {hitos.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '400px',
            color: '#64748b'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📅</div>
            <h3 style={{ margin: '0 0 8px 0' }}>No hay hitos para {selectedYear}</h3>
            <p style={{ margin: '0', textAlign: 'center' }}>
              Use la navegación para cambiar de año
            </p>
          </div>
        ) : (
          <>
            {/* Línea de tiempo principal con marcadores mejorados */}
            <div style={{
              position: 'absolute',
              top: '250px',
              left: '100px',
              right: '100px',
              height: '8px',
              background: 'linear-gradient(90deg,rgb(10, 13, 189) 0%, #8b5cf6 50%, #06b6d4 100%)',
              borderRadius: '2px',
              zIndex: 5,
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
            }}>
              {/* 🔧 Marcadores de meses corregidos */}
              {timeMarkers.map((marker, index) => (
                <div key={index} style={{
                  position: 'absolute',
                  left: `${(marker.position - 100) / 800 * 100}%`,
                  top: '-45px',
                  transform: 'translateX(-50%) rotate(-90deg)',
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#c6c8c9',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  minWidth: '45px',
                  textAlign: 'center',
                  textTransform: 'uppercase'
                }}>
                  {marker.label}
                </div>
              ))}
            </div>

            {/* SVG para líneas conectoras */}
            <svg style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 10
            }}>
              {hitos.slice(0, animationPhase).map(hito => {
                const timelineY = 252;
                const cardCenterX = hito.x + hito.width / 2;
                const cardY = hito.isAbove ? hito.y + hito.height : hito.y;
                
                return (
                  <g key={`line-${hito.id}`}>
                    <line
                      x1={cardCenterX}
                      y1={timelineY}
                      x2={cardCenterX}
                      y2={cardY}
                      stroke={getCategoryColor(hito.categoria).border}
                      strokeWidth="3"
                      strokeDasharray="6,3"
                      opacity="0.8"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Puntos de conexión con animación de pulso */}
            {hitos.slice(0, animationPhase).map((hito, index) => {
              const timelineY = 252;
              const cardCenterX = hito.x + hito.width / 2;
              const colors = getCategoryColor(hito.categoria);
              
              return (
                <div
                  key={`pulse-point-${hito.id}`}
                  style={{
                    position: 'absolute',
                    left: `${cardCenterX - 10}px`,
                    top: `${timelineY - 10}px`,
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#fff',
                    border: `5px solid ${colors.border}`,
                    zIndex: 15,
                    transition: 'all 0.3s ease',
                    boxShadow: `0 0 0 0 ${colors.border}`,
                    animation: `pulse-roadmap-${index % 10} 8s ease-in-out infinite`
                  }}
                />
              );
            })}

            {/* Tarjetas de hitos */}
            {hitos.map((hito, index) => {
              const colors = getCategoryColor(hito.categoria);
              const shouldShow = index < animationPhase;
              
              return (
                <div
                  key={hito.id}
                  style={{
                    position: 'absolute',
                    left: `${hito.x}px`,
                    top: `${hito.y}px`,
                    width: `${hito.width}px`,
                    height: `${hito.height}px`,
                    backgroundColor: colors.bg,
                    border: `2px solid ${colors.border}`,
                    borderRadius: '12px',
                    padding: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: shouldShow 
                      ? 'translateY(0) scale(1)' 
                      : `translateY(${hito.isAbove ? '-20px' : '20px'}) scale(0.8)`,
                    opacity: shouldShow ? 1 : 0,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    zIndex: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => handleHitoHover(e, hito)}
                  onMouseLeave={handleHitoLeave}
                  onMouseMove={(e) => {
                    if (tooltip.visible) {
                      setTooltip(prev => ({
                        ...prev,
                        x: e.clientX,
                        y: e.clientY
                      }));
                    }
                  }}
                >
                  <h4 style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    color: colors.text,
                    margin: '0',
                    lineHeight: '1',
                    textAlign: 'center',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {hito.nombre}
                  </h4>
                  
                  <div style={{
                    fontSize: '10px',
                    color: '#64748b',
                    fontWeight: '500',
                    textAlign: 'center',
                    marginTop: '4px'
                  }}>
                    {formatDate(hito._fechaInicioDate, { day: 'numeric', month: 'short' })}
                    {hito._fechaFinDate && (
                      ` - ${formatDate(hito._fechaFinDate, { day: 'numeric', month: 'short' })}`
                    )}
                  </div>
                </div>
              );
            })}

            {/* Leyenda compacta */}
            <div style={{
              position: 'absolute',
              top: '5px',
              right: '5px',
              background: 'rgba(255, 255, 255, 0.95)',
              padding: '16px',
              borderRadius: '10px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              fontSize: '12px',
              border: '1px solid #e2e8f0',
              zIndex: 30
            }}>
              <h4 style={{ 
                margin: '0 0 12px 0', 
                fontSize: '13px', 
                fontWeight: '700', 
                color: '#374151' 
              }}>
                Categorías
              </h4>
              {(['principal', 'secundario', 'features'] as CategoriaHito[]).map(categoria => {
                const colors = getCategoryColor(categoria);
                const labels = {
                  principal: 'Principales',
                  secundario: 'Secundarios', 
                  features: 'Features'
                };
                const count = hitos.filter(h => h.categoria === categoria).length;
                
                return (
                  <div key={categoria} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: '8px' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        backgroundColor: colors.bg,
                        border: `2px solid ${colors.border}`,
                        borderRadius: '3px',
                        marginRight: '8px'
                      }}></div>
                      <span style={{ 
                        fontWeight: '600', 
                        color: '#374151',
                        fontSize: '11px'
                      }}>
                        {labels[categoria]}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: colors.border,
                      marginLeft: '8px'
                    }}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Estadísticas */}
            <div style={{
              position: 'absolute',
              bottom: '5px',
              left: '5px',
              background: 'rgba(255, 255, 255, 0.95)',
              padding: '16px',
              borderRadius: '10px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              fontSize: '12px',
              border: '1px solid #e2e8f0',
              zIndex: 30
            }}>
              <div style={{ 
                fontWeight: '700', 
                marginBottom: '8px', 
                color: '#374151', 
                fontSize: '13px' 
              }}>
                📊 Resumen {selectedYear}
              </div>
              <div style={{ color: '#64748b', lineHeight: '1.4' }}>
                <div>Total: <strong>{hitos.length}</strong> hitos</div>
                <div>Principales: <strong>{hitos.filter(h => h.categoria === 'principal').length}</strong></div>
                {hitos.length > 0 && (
                  <div style={{ fontSize: '10px', marginTop: '4px' }}>
                    Desde {formatDate(hitos[0]?._fechaInicioDate, { month: 'short' })} 
                    a {formatDate(hitos[hitos.length - 1]?._fechaInicioDate, { month: 'short' })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        borderRadius: '16px',
        padding: '40px',
        minHeight: '500px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        border: '1px solid #e2e8f0'
      }} className={className}>
        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🚀</div>
        <h3 style={{ color: '#64748b', margin: '0 0 8px 0' }}>Cargando Roadmap...</h3>
        <p style={{ color: '#94a3b8', margin: '0' }}>Obteniendo hitos desde la base de datos</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
        borderRadius: '16px',
        padding: '40px',
        minHeight: '500px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        border: '1px solid #fecaca'
      }} className={className}>
        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⚠️</div>
        <h3 style={{ color: '#dc2626', margin: '0 0 8px 0' }}>Error al cargar el Roadmap</h3>
        <p style={{ color: '#991b1b', margin: '0 0 20px 0', textAlign: 'center' }}>{error}</p>
        <button 
          onClick={fetchAllHitos}
          style={{
            background: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            cursor: 'pointer'
          }}
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      borderRadius: '16px',
      padding: '30px',
      minHeight: '500px',
      position: 'relative',
      overflow: 'visible',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      border: '1px solid #e2e8f0'
    }} className={className}>
      
      {/* Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '40px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div>
          <h2 style={{ 
            margin: '0 0 4px 0', 
            color: '#1e293b', 
            fontWeight: '700',
            fontSize: '24px'
          }}>
            Roadmap {selectedYear}
          </h2>
          <p style={{ 
            margin: '0', 
            color: '#64748b', 
            fontSize: '14px',
            fontWeight: '500'
          }}>
            Cronología de logros y objetivos alcanzados: {(hitosData[selectedYear] || []).length > 0 ? `${(hitosData[selectedYear] || []).length} hitos estratégicos del año` : 'Sin hitos para mostrar'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={fetchAllHitos}
            style={{
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      {/* Roadmap Container con transiciones personalizadas */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '12px'
      }}>
        {/* Indicadores de años - fondo transparente */}
        <div style={{
          position: 'absolute',
          top: '-5px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '10px',
          zIndex: 100,
          background: 'transparent',
          padding: '8px 16px',
          borderRadius: '20px'
        }}>
          {availableYears.map((year) => (
            <button
              key={year}
              onClick={() => changeYear(year)}
              disabled={isTransitioning}
              style={{
                minWidth: '60px',
                height: '36px',
                padding: '8px 14px',
                margin: '0',
                borderRadius: '18px',
                fontSize: '13px',
                fontWeight: '700',
                background: selectedYear === year ? '#3b82f6' : 'rgba(255, 255, 255, 0.9)',
                color: selectedYear === year ? 'white' : '#6b7280',
                cursor: isTransitioning ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: selectedYear === year ? '0 2px 8px rgba(59, 130, 246, 0.3)' : '0 2px 6px rgba(0, 0, 0, 0.1)',
                opacity: isTransitioning ? 0.6 : 1,
                whiteSpace: 'nowrap',
                backdropFilter: 'blur(10px)',
                border: selectedYear === year ? 'none' : '1px solid rgba(255, 255, 255, 0.8)'
              }}
              onMouseEnter={(e) => {
                if (selectedYear !== year && !isTransitioning) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
                  e.currentTarget.style.color = '#374151';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedYear !== year && !isTransitioning) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                  e.currentTarget.style.color = '#6b7280';
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.1)';
                }
              }}
            >
              {year}
            </button>
          ))}
        </div>

        {/* Controles de navegación sin fondo */}
        <button 
          onClick={() => navigateYear('prev')}
          disabled={isTransitioning}
          style={{
            position: 'absolute',
            left: '15px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '60px',
            height: '60px',
            background: 'transparent',
            border: 'none',
            borderRadius: '50%',
            transition: 'all 0.3s ease',
            cursor: isTransitioning ? 'not-allowed' : 'pointer',
            opacity: isTransitioning ? 0.3 : 0.7,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            if (!isTransitioning) {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isTransitioning) {
              e.currentTarget.style.opacity = '0.7';
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          <span style={{
            color: '#374151',
            fontSize: '28px',
            fontWeight: 'bold',
            lineHeight: '1'
          }}>‹</span>
        </button>
        
        <button 
          onClick={() => navigateYear('next')}
          disabled={isTransitioning}
          style={{
            position: 'absolute',
            right: '15px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '60px',
            height: '60px',
            background: 'transparent',
            border: 'none',
            borderRadius: '50%',
            transition: 'all 0.3s ease',
            cursor: isTransitioning ? 'not-allowed' : 'pointer',
            opacity: isTransitioning ? 0.3 : 0.7,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            if (!isTransitioning) {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isTransitioning) {
              e.currentTarget.style.opacity = '0.7';
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          <span style={{
            color: '#374151',
            fontSize: '28px',
            fontWeight: 'bold',
            lineHeight: '1'
          }}>›</span>
        </button>

        {/* Contenido del roadmap */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          minHeight: '500px',
          position: 'relative'
        }}>
          {renderRoadmapContent()}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip.visible && tooltip.hito && (
        <div style={{
          position: 'fixed',
          left: `${tooltip.x + 10}px`,
          top: `${tooltip.y - 10}px`,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '12px',
          borderRadius: '8px',
          fontSize: '12px',
          maxWidth: '280px',
          zIndex: 1000,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
          pointerEvents: 'none',
          transform: 'translateY(-100%)'
        }}>
          <div style={{ 
            fontWeight: '700', 
            marginBottom: '6px',
            color: getCategoryColor(tooltip.hito.categoria).border
          }}>
            {tooltip.hito.nombre}
          </div>
          
          {tooltip.hito.proyecto_origen_nombre && (
            <div style={{ marginBottom: '4px', opacity: '0.9' }}>
              📂 {tooltip.hito.proyecto_origen_nombre}
            </div>
          )}
          
          {tooltip.hito.descripcion && (
            <div style={{ marginBottom: '6px', lineHeight: '1.3' }}>
              {tooltip.hito.descripcion}
            </div>
          )}
          
          {tooltip.hito.impacto && (
            <div style={{ 
              fontSize: '11px', 
              fontStyle: 'italic',
              opacity: '0.8',
              borderTop: '1px solid rgba(255,255,255,0.2)',
              paddingTop: '6px',
              marginTop: '6px'
            }}>
              💡 {tooltip.hito.impacto}
            </div>
          )}
          
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.2)',
            paddingTop: '6px',
            marginTop: '6px',
            fontSize: '10px',
            opacity: '0.7'
          }}>
            ID: {tooltip.hito.id}
            {tooltip.hito.usuarios && tooltip.hito.usuarios.length > 0 && 
              ` | ${tooltip.hito.usuarios.length} usuario(s)`
            }
            {tooltip.hito.tareas && tooltip.hito.tareas.length > 0 && 
              ` | ${tooltip.hito.tareas.length} tarea(s)`
            }
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse-roadmap-0 { 
          0%, 85% { box-shadow: 0 0 0 0 #f54957; } 
          10% { box-shadow: 0 0 0 10px #f5495700; } 
          100% { box-shadow: 0 0 0 0 #f54957; }
        }
        @keyframes pulse-roadmap-1 { 
          0%, 80% { box-shadow: 0 0 0 0 #1ebad0; } 
          15% { box-shadow: 0 0 0 10px #1ebad000; } 
          100% { box-shadow: 0 0 0 0 #1ebad0; }
        }
        @keyframes pulse-roadmap-2 { 
          0%, 75% { box-shadow: 0 0 0 0 #7cba01; } 
          20% { box-shadow: 0 0 0 10px #7cba0100; } 
          100% { box-shadow: 0 0 0 0 #7cba01; }
        }
        @keyframes pulse-roadmap-3 { 
          0%, 70% { box-shadow: 0 0 0 0 #f54957; } 
          25% { box-shadow: 0 0 0 10px #f5495700; } 
          100% { box-shadow: 0 0 0 0 #f54957; }
        }
        @keyframes pulse-roadmap-4 { 
          0%, 65% { box-shadow: 0 0 0 0 #1ebad0; } 
          30% { box-shadow: 0 0 0 10px #1ebad000; } 
          100% { box-shadow: 0 0 0 0 #1ebad0; }
        }
        @keyframes pulse-roadmap-5 { 
          0%, 60% { box-shadow: 0 0 0 0 #7cba01; } 
          35% { box-shadow: 0 0 0 10px #7cba0100; } 
          100% { box-shadow: 0 0 0 0 #7cba01; }
        }
        @keyframes pulse-roadmap-6 { 
          0%, 55% { box-shadow: 0 0 0 0 #f54957; } 
          40% { box-shadow: 0 0 0 10px #f5495700; } 
          100% { box-shadow: 0 0 0 0 #f54957; }
        }
        @keyframes pulse-roadmap-7 { 
          0%, 50% { box-shadow: 0 0 0 0 #1ebad0; } 
          45% { box-shadow: 0 0 0 10px #1ebad000; } 
          100% { box-shadow: 0 0 0 0 #1ebad0; }
        }
        @keyframes pulse-roadmap-8 { 
          0%, 45% { box-shadow: 0 0 0 0 #7cba01; } 
          50% { box-shadow: 0 0 0 10px #7cba0100; } 
          100% { box-shadow: 0 0 0 0 #7cba01; }
        }
        @keyframes pulse-roadmap-9 { 
          0%, 40% { box-shadow: 0 0 0 0 #f54957; } 
          55% { box-shadow: 0 0 0 10px #f5495700; } 
          100% { box-shadow: 0 0 0 0 #f54957; }
        }
      `}</style>
    </div>
  );
};

export default HitosRoadmap;