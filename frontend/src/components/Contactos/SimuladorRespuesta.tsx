// =============================================
// SIMULADOR MODERNO Y ELEGANTE - PROCEDIMIENTO OPERATIVO REAL
// components/Contactos/SimuladorRespuesta.tsx
// =============================================

import React, { useState } from 'react';
import { Card, Form, Button, Alert, Spinner, Row, Col, Badge, ProgressBar } from 'react-bootstrap';
import { API_BASE_URL } from '../../services/apiConfig';
import { Sistema, SimulacionRespuesta } from '../../types/contactos';
import ContactosService from '../../services/ContactosService';
import Swal from 'sweetalert2';

interface SimuladorRespuestaProps {
  sistemas: Sistema[];
}

const SimuladorRespuesta: React.FC<SimuladorRespuestaProps> = ({ sistemas }) => {
  const [sistemaSeleccionado, setSistemaSeleccionado] = useState<string>('');
  const [simulacion, setSimulacion] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pasoActual, setPasoActual] = useState(0);
  const [progreso, setProgreso] = useState(0);

  const handleSimular = async () => {
    if (!sistemaSeleccionado) {
      Swal.fire({
        title: 'Error',
        text: 'Debe seleccionar un sistema para simular',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    setLoading(true);
    setError(null);
    setPasoActual(0);
    setProgreso(0);
    setSimulacion(null);
    
    try {
      const resultado = await ContactosService.simularRespuesta(parseInt(sistemaSeleccionado));
      
      if (resultado && resultado.simulacion) {
        setSimulacion(resultado.simulacion);
        console.log('✅ Simulación recibida:', resultado);
        animarPasos(resultado.simulacion);
      } else {
        throw new Error('No se recibieron datos de simulación válidos');
      }
      
    } catch (err: any) {
      console.error('❌ Error en simulación:', err);
      
      let errorMessage = 'Error al simular el flujo de respuesta';
      let errorTitle = 'Error de Simulación';
      
      if (err.response?.status === 404) {
        errorTitle = 'Sistema Sin Configurar';
        errorMessage = `El sistema seleccionado no tiene equipos técnicos asignados.\n\nPara usar el simulador:\n• Vaya a "Sistemas Monitoreados"\n• Edite el sistema y asigne equipos responsables\n• Los equipos deben tener integrantes asignados`;
      } else if (err.response?.status >= 500) {
        errorTitle = 'Error del Servidor';
        errorMessage = 'Error interno del servidor. Verifique que el backend esté funcionando correctamente.';
      } else if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
        errorTitle = 'Error de Conexión';
        errorMessage = 'No se puede conectar con el servidor. Verifique que el backend esté funcionando correctamente.';
      }
      
      Swal.fire({
        title: errorTitle,
        text: errorMessage,
        icon: 'warning',
        confirmButtonText: 'Entendido',
        showCancelButton: true,
        cancelButtonText: 'Ver detalles técnicos',
        cancelButtonColor: '#6c757d'
      }).then((result) => {
        if (result.dismiss === Swal.DismissReason.cancel) {
          Swal.fire({
            title: 'Detalles Técnicos',
            html: `
              <div class="text-start">
                <strong>Error:</strong> ${err.message}<br>
                <strong>Código:</strong> ${err.response?.status || err.code || 'N/A'}<br>
                <strong>URL:</strong> ${err.config?.url || 'N/A'}<br>
                <strong>Método:</strong> ${err.config?.method?.toUpperCase() || 'N/A'}
              </div>
            `,
            icon: 'info',
            confirmButtonText: 'Cerrar'
          });
        }
      });
      
      setError('Error en la simulación. Revise la configuración del sistema.');
    } finally {
      setLoading(false);
    }
  };

  const animarPasos = (simulacionData: any) => {
    const pasos = [1, 2, 3];
    if (simulacionData.paso3b) pasos.push(3.5);
    pasos.push(4);
    
    let index = 0;
    
    const interval = setInterval(() => {
      setPasoActual(pasos[index]);
      setProgreso(((index + 1) / pasos.length) * 100);
      index++;
      
      if (index >= pasos.length) {
        clearInterval(interval);
      }
    }, 1500);
  };

  const resetSimulacion = () => {
    setSistemaSeleccionado('');
    setSimulacion(null);
    setPasoActual(0);
    setProgreso(0);
    setError(null);
  };

  const sistemaInfo = sistemas.find(s => s.id.toString() === sistemaSeleccionado);

  return (
    <>
      <Row>
        <Col md={6}>
          {/* Panel de control moderno */}
          <Card className="glass-card mb-4">
            <Card.Header className="gradient-header">
              <div className="d-flex align-items-center">
                <div className="icon-container me-3">
                  <i className="bi bi-laptop"></i>
                </div>
                <div>
                  <h5 className="mb-0 text-white">Simulador de Procedimiento Operativo</h5>
                  <small className="text-light opacity-75">Procedimiento ATPC en tiempo real</small>
                </div>
              </div>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="info-box mb-4">
                <div className="d-flex align-items-start">
                  <div className="info-icon me-3">
                    <i className="bi bi-info-circle"></i>
                  </div>
                  <div>
                    <h6 className="mb-2">Procedimiento Operativo Real</h6>
                    <p className="mb-0 small text-muted">
                      Visualiza el flujo completo que sigue ATPC para gestionar incidentes técnicos, 
                      incluyendo derivación automática y colaboración entre equipos especializados.
                    </p>
                  </div>
                </div>
              </div>
              
              <Form>
                <Form.Group className="mb-4">
                  <Form.Label className="form-label-modern">Sistema/Herramienta Afectada</Form.Label>
                  <div className="position-relative">
                    <Form.Select
                      className="form-select-modern"
                      value={sistemaSeleccionado}
                      onChange={(e) => setSistemaSeleccionado(e.target.value)}
                      disabled={loading}
                    >
                      <option value="">🔍 Seleccione un sistema...</option>
                      {sistemas.map(sistema => (
                        <option key={sistema.id} value={sistema.id}>
                          {sistema.criticidad === 'alta' ? '🔴' : sistema.criticidad === 'media' ? '🟡' : '🟢'} {sistema.nombre}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                </Form.Group>
                
                {sistemaInfo && (
                  <div className="sistema-preview">
                    <div className="d-flex align-items-start">
                      <div className="sistema-icon me-3">
                        <i className="bi bi-diagram-3"></i>
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center mb-2">
                          <h6 className="mb-0 me-2">{sistemaInfo.nombre}</h6>
                          <Badge 
                            className={`criticidad-badge criticidad-${sistemaInfo.criticidad}`}
                          >
                            {sistemaInfo.criticidad.toUpperCase()}
                          </Badge>
                          <Badge 
                            bg={sistemaInfo.estado === 'operativo' ? 'success' : 'warning'} 
                            className="ms-2"
                          >
                            {sistemaInfo.estado}
                          </Badge>
                        </div>
                        {sistemaInfo.categoria && (
                          <Badge bg="light" text="dark" className="mb-2">{sistemaInfo.categoria}</Badge>
                        )}
                        {sistemaInfo.descripcion && (
                          <p className="mb-0 small text-muted">{sistemaInfo.descripcion}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="d-grid gap-3 mt-4">
                  <Button
                    className="btn-modern-primary"
                    onClick={handleSimular}
                    disabled={!sistemaSeleccionado || loading}
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <div className="loading-spinner me-2"></div>
                        Generando Procedimiento...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-play-circle me-2"></i>
                        Iniciar Simulación
                      </>
                    )}
                  </Button>
                  
                  {simulacion && (
                    <Button 
                      variant="outline-secondary" 
                      onClick={resetSimulacion}
                      className="btn-modern-secondary"
                    >
                      <i className="bi bi-arrow-clockwise me-2"></i>
                      Nueva Simulación
                    </Button>
                  )}
                </div>
              </Form>
              
              {error && (
                <div className="error-container mt-4">
                  <div className="d-flex align-items-start">
                    <i className="bi bi-exclamation-triangle text-warning me-3 fs-5"></i>
                    <div>
                      <h6 className="text-warning mb-2">Configuración Requerida</h6>
                      <p className="mb-2 small">{error}</p>
                      <div className="small text-muted">
                        <strong>Pasos para configurar:</strong><br/>
                        1. Vaya a "Sistemas Monitoreados"<br/>
                        2. Asigne equipos responsables al sistema<br/>
                        3. Verifique que los equipos tengan integrantes
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          {/* Flujo de procedimiento moderno */}
          {simulacion ? (
            <div className="flow-container-modern">
              {/* Barra de progreso */}
              <div className="progress-container mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="progress-label">Progreso del Procedimiento</span>
                  <span className="progress-percentage">{Math.round(progreso)}%</span>
                </div>
                <ProgressBar 
                  now={progreso} 
                  className="progress-modern"
                  animated={progreso < 100}
                />
              </div>

              {/* PASO 1: Detección */}
              <div className={`step-card step-1 ${pasoActual >= 1 ? 'active' : ''} ${pasoActual > 1 ? 'completed' : ''}`}>
                <div className="step-header">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h6 className="step-title">
                      <span className="step-icon">🔍</span>
                      {simulacion.paso1.titulo}
                    </h6>
                    <p className="step-description">{simulacion.paso1.descripcion}</p>
                  </div>
                </div>
                
                {pasoActual >= 1 && (
                  <div className="step-details">
                    <div className="sistema-info">
                      <Badge className={`criticidad-badge criticidad-${simulacion.paso1.sistema.criticidad}`}>
                        {simulacion.paso1.sistema.criticidad.toUpperCase()}
                      </Badge>
                      {simulacion.paso1.sistema.categoria && (
                        <Badge bg="secondary" className="ms-2">{simulacion.paso1.sistema.categoria}</Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {pasoActual >= 1 && (
                <div className="flow-connector">
                  <div className="connector-line"></div>
                  <div className="connector-arrow">
                    <i className="bi bi-arrow-down"></i>
                  </div>
                </div>
              )}

              {/* PASO 2: ATPC Evalúa */}
              <div className={`step-card step-2 ${pasoActual >= 2 ? 'active' : ''} ${pasoActual > 2 ? 'completed' : ''}`}>
                <div className="step-header">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h6 className="step-title">
                      <span className="step-icon">📞</span>
                      {simulacion.paso2.titulo}
                    </h6>
                    <p className="step-description">{simulacion.paso2.descripcion}</p>
                  </div>
                </div>
                
                {pasoActual >= 2 && simulacion.paso2.detalles && (
                  <div className="step-details">
                    <div className="actions-list">
                      <h6 className="actions-title">Acciones realizadas:</h6>
                      {simulacion.paso2.detalles.map((detalle: string, index: number) => (
                        <div key={index} className="action-item">
                          <i className="bi bi-check-circle text-success me-2"></i>
                          {detalle}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {pasoActual >= 2 && (
                <div className="flow-connector">
                  <div className="connector-line"></div>
                  <div className="connector-arrow">
                    <i className="bi bi-arrow-down"></i>
                  </div>
                </div>
              )}

              {/* PASO 3: Derivación */}
              <div className={`step-card step-3 ${pasoActual >= 3 ? 'active' : ''} ${pasoActual > 3 ? 'completed' : ''}`}>
                <div className="step-header">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h6 className="step-title">
                      <span className="step-icon">🚀</span>
                      {simulacion.paso3.titulo}
                    </h6>
                    <p className="step-description">{simulacion.paso3.descripcion}</p>
                  </div>
                </div>
                
                {pasoActual >= 3 && simulacion.paso3.equipo && (
                  <div className="step-details">
                    <div 
                      className="equipo-card"
                      style={{ 
                        borderColor: simulacion.paso3.equipo.color,
                        background: `linear-gradient(135deg, ${simulacion.paso3.equipo.color}15, ${simulacion.paso3.equipo.color}05)`
                      }}
                    >
                      <div className="equipo-header">
                        <div className="equipo-info">
                          <h6 className="equipo-name" style={{ color: simulacion.paso3.equipo.color }}>
                            📋 {simulacion.paso3.equipo.nombre}
                          </h6>
                          <Badge bg="success" className="equipo-badge">Responsable Principal</Badge>
                        </div>
                        {simulacion.paso3.equipo.telefono && (
                          <div className="equipo-actions">
                            <Button 
                              className="btn-contact"
                              style={{ 
                                backgroundColor: simulacion.paso3.equipo.color,
                                borderColor: simulacion.paso3.equipo.color
                              }}
                              onClick={() => ContactosService.abrirWhatsApp(simulacion.paso3.equipo.telefono)}
                            >
                              <i className="bi bi-whatsapp"></i>
                            </Button>
                            <Button 
                              variant="outline-primary"
                              className="btn-contact"
                              onClick={() => ContactosService.abrirLlamada(simulacion.paso3.equipo.telefono)}
                            >
                              <i className="bi bi-telephone"></i>
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {simulacion.paso3.equipo.descripcion && (
                        <p className="equipo-description">{simulacion.paso3.equipo.descripcion}</p>
                      )}
                      
                      {simulacion.paso3.equipo.telefono && (
                        <div className="contact-info">
                          📞 {ContactosService.formatearTelefono(simulacion.paso3.equipo.telefono)}
                        </div>
                      )}
                      
                      {/* Integrantes con diseño moderno */}
                      {simulacion.paso3.equipo.integrantes && simulacion.paso3.equipo.integrantes.length > 0 && (
                        <div className="integrantes-section">
                          <h6 className="integrantes-title">Contactos Disponibles</h6>
                          <div className="integrantes-grid">
                            {simulacion.paso3.equipo.integrantes.slice(0, 4).map((integrante: any) => (
                              <div key={integrante.id} className="integrante-card">
                                <div className="integrante-info">
                                  <div className="d-flex align-items-center mb-1">
                                    <div 
                                      className="status-dot me-2"
                                      style={{ 
                                        backgroundColor: ContactosService.getColorByDisponibilidad(integrante.disponibilidad)
                                      }}
                                    ></div>
                                    <span className="integrante-name">
                                      {integrante.nombre} {integrante.apellido}
                                    </span>
                                    {integrante.es_coordinador && (
                                      <Badge bg="warning" text="dark" className="ms-2 coord-badge">
                                        ⭐ Coord.
                                      </Badge>
                                    )}
                                  </div>
                                  {integrante.rol && (
                                    <div className="integrante-role">{integrante.rol}</div>
                                  )}
                                </div>
                                <div className="integrante-actions">
                                  {integrante.whatsapp && (
                                    <Button 
                                      variant="outline-success"
                                      size="sm"
                                      className="action-btn"
                                      onClick={() => ContactosService.abrirWhatsApp(integrante.whatsapp)}
                                    >
                                      <i className="bi bi-whatsapp"></i>
                                    </Button>
                                  )}
                                  {integrante.telefono_personal && (
                                    <Button 
                                      variant="outline-primary"
                                      size="sm"
                                      className="action-btn"
                                      onClick={() => ContactosService.abrirLlamada(integrante.telefono_personal)}
                                    >
                                      <i className="bi bi-telephone"></i>
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          {simulacion.paso3.equipo.integrantes.length > 4 && (
                            <div className="more-contacts">
                              +{simulacion.paso3.equipo.integrantes.length - 4} contactos más disponibles
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* PASO 3B: Colaboración */}
              {simulacion.paso3b && pasoActual >= 3.5 && (
                <>
                  <div className="flow-connector collaboration">
                    <div className="connector-line collaboration-line"></div>
                    <div className="connector-arrow collaboration-arrow">
                      <i className="bi bi-arrow-down-right"></i>
                      <span className="collaboration-label">Colaboración</span>
                    </div>
                  </div>
                  
                  <div className="step-card step-collaboration active">
                    <div className="step-header">
                      <div className="step-number collaboration-number">3B</div>
                      <div className="step-content">
                        <h6 className="step-title">
                          <span className="step-icon">👥</span>
                          {simulacion.paso3b.titulo}
                        </h6>
                        <p className="step-description">{simulacion.paso3b.descripcion}</p>
                      </div>
                    </div>
                    
                    {simulacion.paso3b.equipos_colaboradores && (
                      <div className="step-details">
                        <div className="colaboradores-section">
                          <h6 className="colaboradores-title">Equipos Colaboradores</h6>
                          <div className="colaboradores-grid">
                            {simulacion.paso3b.equipos_colaboradores.map((equipo: any, index: number) => (
                              <div 
                                key={index} 
                                className="colaborador-card"
                                style={{ borderColor: equipo.color }}
                              >
                                <div className="colaborador-info">
                                  <h6 style={{ color: equipo.color }}>{equipo.nombre}</h6>
                                  <Badge bg="info" className="nivel-badge">
                                    {equipo.nivel_responsabilidad}
                                  </Badge>
                                </div>
                                {equipo.telefono && (
                                  <Button 
                                    size="sm"
                                    style={{ backgroundColor: equipo.color, borderColor: equipo.color }}
                                    onClick={() => ContactosService.abrirLlamada(equipo.telefono)}
                                    className="contact-colaborador"
                                  >
                                    <i className="bi bi-telephone me-1"></i>
                                    Contactar
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Conector final mejorado */}
              {((pasoActual >= 3 && !simulacion.paso3b) || pasoActual >= 3.5) && (
                <div className="flow-connector final-step">
                  <div className="connector-line final-line"></div>
                  <div className="connector-arrow final-arrow">
                    <i className="bi bi-arrow-down"></i>
                  </div>
                </div>
              )}

              {/* PASO 4: Resolución */}
              <div className={`step-card step-4 ${pasoActual >= 4 ? 'active' : ''}`}>
                <div className="step-header">
                  <div className="step-number">4</div>
                  <div className="step-content">
                    <h6 className="step-title">
                      <span className="step-icon">✅</span>
                      {simulacion.paso4.titulo}
                    </h6>
                    <p className="step-description">{simulacion.paso4.descripcion}</p>
                  </div>
                </div>
                
                {pasoActual >= 4 && simulacion.paso4.acciones && (
                  <div className="step-details">
                    <div className="actions-list">
                      <h6 className="actions-title">Proceso de cierre:</h6>
                      {simulacion.paso4.acciones.map((accion: string, index: number) => (
                        <div key={index} className="action-item">
                          <i className="bi bi-check-circle text-success me-2"></i>
                          {accion}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Resumen final moderno */}
              {pasoActual >= 4 && (
                <div className="completion-card">
                  <div className="completion-header">
                    <div className="completion-icon">
                      <i className="bi bi-check-circle"></i>
                    </div>
                    <div>
                      <h6 className="completion-title">Procedimiento Completado</h6>
                      <p className="completion-text">
                        Incidente resuelto exitosamente siguiendo el procedimiento operativo de ATPC.
                        {simulacion.paso3b && (
                          <span> Colaboración efectiva entre múltiples equipos especializados.</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="placeholder-container">
              <div className="placeholder-icon">
                <i className="bi bi-diagram-3"></i>
              </div>
              <h5 className="placeholder-title">Procedimiento ATPC</h5>
              <p className="placeholder-text">
                Seleccione un sistema y haga clic en "Iniciar Simulación" para visualizar 
                el flujo operativo completo de gestión de incidentes.
              </p>
              {sistemas.length === 0 && (
                <div className="setup-help">
                  <div className="setup-steps">
                    <h6>Configuración inicial:</h6>
                    <div className="setup-step">1. Cree sistemas en "Sistemas Monitoreados"</div>
                    <div className="setup-step">2. Asigne equipos responsables</div>
                    <div className="setup-step">3. Verifique que los equipos tengan integrantes</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Col>
      </Row>
      
      <style>{`
        /* Variables CSS para consistencia */
        :root {
          --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          --success-gradient: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
          --warning-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          --shadow-light: 0 2px 20px rgba(0,0,0,0.1);
          --shadow-medium: 0 8px 30px rgba(0,0,0,0.12);
          --border-radius: 16px;
          --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Tarjeta principal con efecto glass */
        .glass-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: var(--border-radius);
          box-shadow: var(--shadow-medium);
          transition: var(--transition);
        }

        .glass-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.15);
        }

        /* Header moderno con gradiente */
        .gradient-header {
          background: var(--primary-gradient);
          border: none;
          border-radius: var(--border-radius) var(--border-radius) 0 0;
          padding: 1.5rem;
        }

        .icon-container {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }

        /* Info box elegante */
        .info-box {
          background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
          border: 1px solid #e1e7ff;
          border-radius: 12px;
          padding: 1.25rem;
        }

        .info-icon {
          background: linear-gradient(135deg, #4c6fff 0%, #6c5ce7 100%);
          color: white;
          border-radius: 10px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }

        /* Formulario moderno */
        .form-label-modern {
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 0.75rem;
        }

        .form-select-modern {
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 0.875rem 1rem;
          font-size: 1rem;
          background: white;
          transition: var(--transition);
        }

        .form-select-modern:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          transform: translateY(-1px);
        }

        /* Preview del sistema */
        .sistema-preview {
          background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 1.25rem;
          margin-top: 1rem;
          transition: var(--transition);
        }

        .sistema-preview:hover {
          border-color: #cbd5e0;
          transform: translateY(-1px);
        }

        .sistema-icon {
          background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
          color: white;
          border-radius: 10px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }

        /* Badges de criticidad */
        .criticidad-badge {
          font-weight: 600;
          padding: 0.35rem 0.75rem;
          border-radius: 8px;
          font-size: 0.75rem;
          letter-spacing: 0.5px;
        }

        .criticidad-alta {
          background: linear-gradient(135deg, #fc8181 0%, #e53e3e 100%);
          color: white;
        }

        .criticidad-media {
          background: linear-gradient(135deg, #f6e05e 0%, #d69e2e 100%);
          color: #744210;
        }

        .criticidad-baja {
          background: linear-gradient(135deg, #68d391 0%, #38a169 100%);
          color: white;
        }

        /* Botones modernos */
        .btn-modern-primary {
          background: var(--primary-gradient);
          border: none;
          border-radius: 12px;
          padding: 0.875rem 1.5rem;
          font-weight: 600;
          letter-spacing: 0.3px;
          transition: var(--transition);
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }

        .btn-modern-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }

        .btn-modern-secondary {
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 0.75rem 1.25rem;
          font-weight: 500;
          transition: var(--transition);
        }

        .btn-modern-secondary:hover {
          border-color: #cbd5e0;
          background: #f7fafc;
          transform: translateY(-1px);
        }

        /* Spinner de carga */
        .loading-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Container de error */
        .error-container {
          background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
          border: 1px solid #feb2b2;
          border-radius: 12px;
          padding: 1.25rem;
        }

        /* Contenedor del flujo moderno */
        .flow-container-modern {
          position: relative;
          padding: 1rem 0;
        }

        /* Barra de progreso moderna */
        .progress-container {
          background: white;
          border-radius: 12px;
          padding: 1.25rem;
          box-shadow: var(--shadow-light);
          border: 1px solid #e2e8f0;
        }

        .progress-label {
          font-weight: 600;
          color: #2d3748;
          font-size: 0.9rem;
        }

        .progress-percentage {
          font-weight: 700;
          color: #667eea;
          font-size: 1.1rem;
        }

        .progress-modern {
          height: 8px;
          border-radius: 10px;
          background: #e2e8f0;
          overflow: hidden;
        }

        .progress-modern .progress-bar {
          background: var(--primary-gradient);
          border-radius: 10px;
          transition: width 0.6s ease;
        }

        /* Tarjetas de pasos */
        .step-card {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: var(--border-radius);
          margin-bottom: 1.5rem;
          padding: 1.5rem;
          box-shadow: var(--shadow-light);
          opacity: 0.6;
          transform: translateX(-20px);
          transition: var(--transition);
        }

        .step-card.active {
          opacity: 1;
          transform: translateX(0);
          border-color: #667eea;
          box-shadow: 0 8px 30px rgba(102, 126, 234, 0.15);
        }

        .step-card.completed {
          border-color: #48bb78;
          background: linear-gradient(135deg, #f0fff4 0%, #e6fffa 100%);
        }

        .step-collaboration {
          border-color: #4299e1 !important;
          background: linear-gradient(135deg, #ebf8ff 0%, #bee3f8 100%) !important;
        }

        .step-header {
          display: flex;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .step-number {
          background: var(--primary-gradient);
          color: white;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.2rem;
          margin-right: 1rem;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }

        .collaboration-number {
          background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%) !important;
        }

        .step-content {
          flex: 1;
        }

        .step-title {
          font-weight: 700;
          color: #2d3748;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
        }

        .step-icon {
          font-size: 1.3rem;
          margin-right: 0.5rem;
        }

        .step-description {
          color: #4a5568;
          margin: 0;
          line-height: 1.6;
        }

        .step-details {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
        }

        /* Conectores del flujo - Mejorados */
        .flow-connector {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 1rem 0;
          position: relative;
          opacity: 0;
          animation: fadeInConnector 0.5s ease forwards;
        }

        @keyframes fadeInConnector {
          to { opacity: 1; }
        }

        .connector-line {
          width: 3px;
          height: 30px;
          background: linear-gradient(180deg, #cbd5e0 0%, #a0aec0 100%);
          border-radius: 2px;
        }

        .collaboration-line {
          background: linear-gradient(180deg, #4299e1 0%, #3182ce 100%);
        }

        .final-line {
          background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
        }

        .connector-arrow {
          position: absolute;
          background: white;
          border: 2px solid #cbd5e0;
          border-radius: 50%;
          width: 35px;
          height: 35px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #667eea;
          font-size: 1.1rem;
          animation: bounce 2s infinite;
        }

        .collaboration-arrow {
          border-color: #4299e1;
          color: #4299e1;
          background: linear-gradient(135deg, #ebf8ff 0%, #bee3f8 100%);
        }

        .final-arrow {
          border-color: #667eea;
          color: #667eea;
          background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
        }

        .collaboration-label {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.75rem;
          color: #4299e1;
          font-weight: 600;
          white-space: nowrap;
          margin-top: 0.5rem;
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-8px); }
          60% { transform: translateY(-4px); }
        }

        /* Tarjeta de equipo */
        .equipo-card {
          border: 2px solid;
          border-radius: 12px;
          padding: 1.25rem;
          margin-top: 0.75rem;
        }

        .equipo-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .equipo-info {
          flex: 1;
        }

        .equipo-name {
          font-weight: 700;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
        }

        .equipo-badge {
          font-size: 0.7rem;
          padding: 0.25rem 0.5rem;
        }

        .equipo-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn-contact {
          border-radius: 8px;
          padding: 0.5rem;
          border: none;
          transition: var(--transition);
        }

        .btn-contact:hover {
          transform: scale(1.05);
        }

        .equipo-description {
          color: #4a5568;
          font-size: 0.9rem;
          margin-bottom: 0.75rem;
        }

        .contact-info {
          color: #718096;
          font-size: 0.9rem;
          margin-bottom: 1rem;
        }

        /* Sección de integrantes */
        .integrantes-section {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.3);
        }

        .integrantes-title {
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 0.75rem;
          font-size: 0.9rem;
        }

        .integrantes-grid {
          display: grid;
          gap: 0.75rem;
        }

        .integrante-card {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 10px;
          padding: 0.875rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: var(--transition);
        }

        .integrante-card:hover {
          background: white;
          border-color: #cbd5e0;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .integrante-info {
          flex: 1;
        }

        .integrante-name {
          font-weight: 600;
          color: #2d3748;
          font-size: 0.85rem;
        }

        .integrante-role {
          color: #718096;
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }

        .integrante-actions {
          display: flex;
          gap: 0.25rem;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .coord-badge {
          font-size: 0.6rem;
          padding: 0.15rem 0.4rem;
        }

        .action-btn {
          padding: 0.25rem 0.4rem;
          border-radius: 6px;
          transition: var(--transition);
        }

        .action-btn:hover {
          transform: scale(1.1);
        }

        .more-contacts {
          text-align: center;
          color: #718096;
          font-size: 0.8rem;
          margin-top: 0.5rem;
          font-style: italic;
        }

        /* Lista de acciones */
        .actions-list {
          background: #f7fafc;
          border-radius: 10px;
          padding: 1rem;
        }

        .actions-title {
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 0.75rem;
          font-size: 0.9rem;
        }

        .action-item {
          display: flex;
          align-items: center;
          color: #4a5568;
          font-size: 0.85rem;
          margin-bottom: 0.5rem;
          line-height: 1.5;
        }

        .action-item:last-child {
          margin-bottom: 0;
        }

        /* Sección de colaboradores */
        .colaboradores-section {
          margin-top: 0.75rem;
        }

        .colaboradores-title {
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 0.75rem;
          font-size: 0.9rem;
        }

        .colaboradores-grid {
          display: grid;
          gap: 0.75rem;
        }

        .colaborador-card {
          background: white;
          border: 2px solid;
          border-radius: 10px;
          padding: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: var(--transition);
        }

        .colaborador-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .colaborador-info {
          flex: 1;
        }

        .colaborador-info h6 {
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }

        .nivel-badge {
          font-size: 0.7rem;
          padding: 0.25rem 0.5rem;
        }

        .contact-colaborador {
          font-size: 0.8rem;
          padding: 0.5rem 0.75rem;
          border-radius: 8px;
          border: none;
          transition: var(--transition);
        }

        .contact-colaborador:hover {
          transform: scale(1.05);
        }

        /* Tarjeta de completación */
        .completion-card {
          background: var(--success-gradient);
          color: white;
          border-radius: var(--border-radius);
          padding: 1.5rem;
          margin-top: 1.5rem;
          box-shadow: 0 8px 30px rgba(17, 153, 142, 0.3);
        }

        .completion-header {
          display: flex;
          align-items: center;
        }

        .completion-icon {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          margin-right: 1rem;
        }

        .completion-title {
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .completion-text {
          margin: 0;
          opacity: 0.9;
          line-height: 1.6;
        }

        /* Placeholder moderno */
        .placeholder-container {
          background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
          border: 2px dashed #cbd5e0;
          border-radius: var(--border-radius);
          padding: 3rem 2rem;
          text-align: center;
          transition: var(--transition);
        }

        .placeholder-container:hover {
          border-color: #a0aec0;
          background: linear-gradient(135deg, #edf2f7 0%, #e2e8f0 100%);
        }

        .placeholder-icon {
          background: linear-gradient(135deg, #cbd5e0 0%, #a0aec0 100%);
          color: white;
          border-radius: 50%;
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          margin: 0 auto 1.5rem;
        }

        .placeholder-title {
          color: #2d3748;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .placeholder-text {
          color: #4a5568;
          max-width: 400px;
          margin: 0 auto 1.5rem;
          line-height: 1.6;
        }

        .setup-help {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid #e2e8f0;
        }

        .setup-steps h6 {
          color: #2d3748;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .setup-step {
          color: #4a5568;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
          padding-left: 1rem;
          position: relative;
        }

        .setup-step::before {
          content: "•";
          color: #667eea;
          position: absolute;
          left: 0;
          font-weight: bold;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .equipo-header {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .equipo-actions {
            margin-top: 0.75rem;
          }
          
          .integrante-card {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .integrante-actions {
            margin-top: 0.5rem;
            align-self: flex-end;
          }
        }
      `}</style>
    </>
  );
};

export default SimuladorRespuesta;