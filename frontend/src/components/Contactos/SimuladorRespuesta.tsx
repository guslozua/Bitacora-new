// =============================================
// SIMULADOR DE RESPUESTA COMPONENT - VERSIÓN CON MANEJO DE ERRORES MEJORADO
// components/Contactos/SimuladorRespuesta.tsx
// =============================================

import React, { useState } from 'react';
import { Card, Form, Button, Alert, Spinner, Row, Col, Badge } from 'react-bootstrap';
import { Sistema, SimulacionRespuesta } from '../../types/contactos';
import ContactosService from '../../services/ContactosService';
import Swal from 'sweetalert2';

interface SimuladorRespuestaProps {
  sistemas: Sistema[];
}

const SimuladorRespuesta: React.FC<SimuladorRespuestaProps> = ({ sistemas }) => {
  const [sistemaSeleccionado, setSistemaSeleccionado] = useState<string>('');
  const [simulacion, setSimulacion] = useState<SimulacionRespuesta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pasoActual, setPasoActual] = useState(0);

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
    setSimulacion(null);
    
    try {
      const resultado = await ContactosService.simularRespuesta(parseInt(sistemaSeleccionado));
      
      if (resultado && resultado.simulacion) {
        setSimulacion(resultado.simulacion);
        // Animar pasos secuencialmente
        animarPasos();
      } else {
        throw new Error('No se recibieron datos de simulación válidos');
      }
      
    } catch (err: any) {
      console.error('Error en simulación:', err);
      
      // ✅ MANEJO ESPECÍFICO DE ERRORES
      let errorMessage = 'Error al simular el flujo de respuesta';
      let errorTitle = 'Error de Simulación';
      
      if (err.response?.status === 404) {
        errorTitle = 'Sistema Sin Configurar';
        errorMessage = `El sistema seleccionado no tiene configurado un flujo de escalamiento.\n\nPara usar el simulador, primero debe:\n• Crear flujos de escalamiento en el backend\n• Asignar equipos responsables al sistema\n• Configurar equipos de escalamiento`;
      } else if (err.response?.status >= 500) {
        errorTitle = 'Error del Servidor';
        errorMessage = 'Error interno del servidor. Verifique que el backend esté funcionando correctamente.';
      } else if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
        errorTitle = 'Error de Conexión';
        errorMessage = 'No se puede conectar con el servidor. Verifique que el backend esté ejecutándose en http://localhost:5000';
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
          // Mostrar detalles técnicos
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

  const animarPasos = () => {
    const pasos = [1, 2, 3, 4, 5]; // Máximo 5 pasos
    let index = 0;
    
    const interval = setInterval(() => {
      setPasoActual(pasos[index]);
      index++;
      
      if (index >= pasos.length || index >= 4) { // Máximo 4 pasos base + 1 opcional
        clearInterval(interval);
      }
    }, 1000); // 1 segundo entre pasos
  };

  const resetSimulacion = () => {
    setSistemaSeleccionado('');
    setSimulacion(null);
    setPasoActual(0);
    setError(null);
  };

  const sistemaInfo = sistemas.find(s => s.id.toString() === sistemaSeleccionado);

  return (
    <Row>
      <Col md={6}>
        {/* Panel de control */}
        <Card className="mb-4">
          <Card.Header className="bg-info text-white">
            <h5 className="mb-0">
              <i className="bi bi-gear-wide-connected me-2"></i>
              Simulador de Respuesta a Incidentes
            </h5>
          </Card.Header>
          <Card.Body>
            <Alert variant="info" className="mb-3">
              <Alert.Heading className="h6">
                <i className="bi bi-info-circle me-2"></i>
                ¿Cómo funciona?
              </Alert.Heading>
              <small>
                Este simulador muestra el flujo de escalamiento configurado para responder a incidentes en sistemas críticos.
                Seleccione un sistema para ver su protocolo de respuesta.
              </small>
            </Alert>
            
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Sistema Afectado</Form.Label>
                <Form.Select
                  value={sistemaSeleccionado}
                  onChange={(e) => setSistemaSeleccionado(e.target.value)}
                  disabled={loading}
                >
                  <option value="">-- Seleccione un sistema --</option>
                  {sistemas.map(sistema => (
                    <option key={sistema.id} value={sistema.id}>
                      {sistema.nombre} ({sistema.criticidad.toUpperCase()})
                    </option>
                  ))}
                </Form.Select>
                {sistemas.length === 0 && (
                  <Form.Text className="text-muted">
                    No hay sistemas disponibles. Cree sistemas en la pestaña "Sistemas Monitoreados".
                  </Form.Text>
                )}
              </Form.Group>
              
              {sistemaInfo && (
                <Alert variant="light" className="mb-3 border">
                  <div className="d-flex align-items-start">
                    <div className="flex-shrink-0 me-3">
                      <Badge bg={ContactosService.getColorByCriticidad(sistemaInfo.criticidad)} className="me-2">
                        {sistemaInfo.criticidad.toUpperCase()}
                      </Badge>
                      <Badge bg={sistemaInfo.estado === 'operativo' ? 'success' : 'warning'}>
                        {sistemaInfo.estado}
                      </Badge>
                    </div>
                    <div className="flex-grow-1">
                      <strong>{sistemaInfo.nombre}</strong>
                      {sistemaInfo.descripcion && (
                        <div className="mt-1">
                          <small className="text-muted">{sistemaInfo.descripcion}</small>
                        </div>
                      )}
                    </div>
                  </div>
                </Alert>
              )}
              
              <div className="d-grid gap-2">
                <Button
                  variant="primary"
                  onClick={handleSimular}
                  disabled={!sistemaSeleccionado || loading}
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Simulando...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-play-circle me-2"></i>
                      Iniciar Simulación
                    </>
                  )}
                </Button>
                
                {simulacion && (
                  <Button variant="outline-secondary" onClick={resetSimulacion}>
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Nueva Simulación
                  </Button>
                )}
              </div>
            </Form>
            
            {error && (
              <Alert variant="warning" className="mt-3">
                <Alert.Heading className="h6">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Configuración Requerida
                </Alert.Heading>
                <p className="mb-2">{error}</p>
                <small>
                  <strong>Pasos para configurar:</strong><br/>
                  1. Asigne equipos responsables al sistema<br/>
                  2. Configure flujos de escalamiento en el backend<br/>
                  3. Verifique que los equipos tengan integrantes
                </small>
              </Alert>
            )}
          </Card.Body>
        </Card>
      </Col>
      
      <Col md={6}>
        {/* Flujo de respuesta animado */}
        {simulacion ? (
          <div className="flow-container">
            {/* Paso 1 */}
            <Card className={`mb-3 flow-step ${pasoActual >= 1 ? 'active' : ''} ${pasoActual > 1 ? 'completed' : ''}`}>
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div className="badge bg-primary rounded-circle p-2 me-3">1</div>
                  <div>
                    <h6 className="mb-1">🔍 {simulacion.paso1.titulo}</h6>
                    <p className="mb-0 text-muted">{simulacion.paso1.descripcion}</p>
                    <Badge bg={ContactosService.getColorByCriticidad(simulacion.paso1.sistema.criticidad)} className="mt-1">
                      {simulacion.paso1.sistema.criticidad.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {pasoActual >= 1 && (
              <div className="text-center mb-3">
                <i className="bi bi-arrow-down flow-arrow"></i>
              </div>
            )}

            {/* Paso 2 */}
            <Card className={`mb-3 flow-step ${pasoActual >= 2 ? 'active' : ''} ${pasoActual > 2 ? 'completed' : ''}`}>
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div className="badge bg-info rounded-circle p-2 me-3">2</div>
                  <div>
                    <h6 className="mb-1">📞 {simulacion.paso2.titulo}</h6>
                    <p className="mb-0 text-muted">{simulacion.paso2.descripcion}</p>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {pasoActual >= 2 && (
              <div className="text-center mb-3">
                <i className="bi bi-arrow-down flow-arrow"></i>
              </div>
            )}

            {/* Paso 3 */}
            <Card className={`mb-3 flow-step ${pasoActual >= 3 ? 'active' : ''} ${pasoActual > 3 ? 'completed' : ''}`}>
              <Card.Body>
                <div className="d-flex align-items-center mb-2">
                  <div className="badge bg-warning rounded-circle p-2 me-3">3</div>
                  <div>
                    <h6 className="mb-1">🚀 {simulacion.paso3.titulo}</h6>
                    <p className="mb-0 text-muted">{simulacion.paso3.descripcion}</p>
                  </div>
                </div>
                
                {pasoActual >= 3 && simulacion.paso3.equipo && (
                  <div className="mt-3 p-2 rounded" style={{ backgroundColor: `${simulacion.paso3.equipo.color}15`, border: `2px solid ${simulacion.paso3.equipo.color}` }}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <strong style={{ color: simulacion.paso3.equipo.color }}>
                        {simulacion.paso3.equipo.nombre}
                      </strong>
                      {simulacion.paso3.equipo.telefono && (
                        <div>
                          <Button 
                            size="sm" 
                            style={{ backgroundColor: simulacion.paso3.equipo.color, borderColor: simulacion.paso3.equipo.color }}
                            className="me-1"
                            onClick={() => ContactosService.abrirWhatsApp(simulacion.paso3.equipo.telefono)}
                          >
                            <i className="bi bi-whatsapp"></i>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline-primary"
                            onClick={() => ContactosService.abrirLlamada(simulacion.paso3.equipo.telefono)}
                          >
                            <i className="bi bi-telephone"></i>
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {simulacion.paso3.equipo.telefono && (
                      <small className="text-muted">
                        📞 {ContactosService.formatearTelefono(simulacion.paso3.equipo.telefono)}
                      </small>
                    )}
                    
                    {simulacion.paso3.equipo.integrantes && simulacion.paso3.equipo.integrantes.length > 0 && (
                      <div className="mt-2">
                        <small className="fw-bold">Contactos disponibles:</small>
                        {simulacion.paso3.equipo.integrantes.slice(0, 3).map(integrante => (
                          <div key={integrante.id} className="d-flex justify-content-between align-items-center mt-1">
                            <small>
                              {integrante.nombre} {integrante.apellido}
                              {integrante.es_coordinador && <Badge bg="warning" text="dark" className="ms-1" style={{ fontSize: '0.6rem' }}>Coord.</Badge>}
                            </small>
                            <div>
                              {integrante.whatsapp && (
                                <Button 
                                  size="sm" 
                                  variant="outline-success"
                                  className="me-1 py-0 px-1"
                                  onClick={() => ContactosService.abrirWhatsApp(integrante.whatsapp)}
                                >
                                  <i className="bi bi-whatsapp" style={{ fontSize: '0.7rem' }}></i>
                                </Button>
                              )}
                              {integrante.telefono_personal && (
                                <Button 
                                  size="sm" 
                                  variant="outline-primary"
                                  className="py-0 px-1"
                                  onClick={() => ContactosService.abrirLlamada(integrante.telefono_personal)}
                                >
                                  <i className="bi bi-telephone" style={{ fontSize: '0.7rem' }}></i>
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card.Body>
            </Card>

            {pasoActual >= 3 && (
              <div className="text-center mb-3">
                <i className="bi bi-arrow-down flow-arrow"></i>
              </div>
            )}

            {/* Paso 4 */}
            <Card className={`mb-3 flow-step ${pasoActual >= 4 ? 'active' : ''} ${pasoActual > 4 ? 'completed' : ''}`}>
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div className="badge bg-success rounded-circle p-2 me-3">4</div>
                  <div>
                    <h6 className="mb-1">✅ {simulacion.paso4.titulo}</h6>
                    <p className="mb-0 text-muted">{simulacion.paso4.descripcion}</p>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Paso 5 - Escalamiento (si existe) */}
            {simulacion.paso5 && (
              <>
                {pasoActual >= 4 && (
                  <div className="text-center mb-3">
                    <i className="bi bi-arrow-down flow-arrow text-warning"></i>
                  </div>
                )}
                
                <Card className={`mb-3 flow-step ${pasoActual >= 5 ? 'active' : ''}`} style={{ borderLeft: '4px solid #ffc107' }}>
                  <Card.Body>
                    <div className="d-flex align-items-center mb-2">
                      <div className="badge bg-warning text-dark rounded-circle p-2 me-3">5</div>
                      <div>
                        <h6 className="mb-1">⚠️ {simulacion.paso5.titulo}</h6>
                        <p className="mb-0 text-muted">{simulacion.paso5.descripcion}</p>
                      </div>
                    </div>
                    
                    {simulacion.paso5.condicion && (
                      <Alert variant="warning" className="mb-2">
                        <small><strong>Condición:</strong> {simulacion.paso5.condicion}</small>
                      </Alert>
                    )}
                    
                    {pasoActual >= 5 && simulacion.paso5.equipo_escalamiento && (
                      <div className="mt-3 p-2 rounded" style={{ backgroundColor: `${simulacion.paso5.equipo_escalamiento.color}15`, border: `2px solid ${simulacion.paso5.equipo_escalamiento.color}` }}>
                        <div className="d-flex justify-content-between align-items-center">
                          <strong style={{ color: simulacion.paso5.equipo_escalamiento.color }}>
                            {simulacion.paso5.equipo_escalamiento.nombre}
                          </strong>
                          {simulacion.paso5.equipo_escalamiento.telefono && (
                            <Button 
                              size="sm" 
                              style={{ backgroundColor: simulacion.paso5.equipo_escalamiento.color, borderColor: simulacion.paso5.equipo_escalamiento.color }}
                              onClick={() => ContactosService.abrirLlamada(simulacion.paso5?.equipo_escalamiento?.telefono)}
                            >
                              <i className="bi bi-telephone me-1"></i>
                              Llamar Escalamiento
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </>
            )}
          </div>
        ) : (
          <Card>
            <Card.Body className="text-center text-muted py-5">
              <i className="bi bi-gear-wide-connected display-1 mb-3"></i>
              <h5>Simulador de Respuesta</h5>
              <p>Seleccione un sistema y haga clic en "Iniciar Simulación" para ver el flujo de respuesta a incidentes.</p>
              {sistemas.length === 0 && (
                <Alert variant="info" className="mt-3">
                  <small>
                    <strong>Para usar el simulador:</strong><br/>
                    1. Cree sistemas en "Sistemas Monitoreados"<br/>
                    2. Asigne equipos responsables<br/>
                    3. Configure flujos de escalamiento
                  </small>
                </Alert>
              )}
            </Card.Body>
          </Card>
        )}
      </Col>
      
      <style>{`
        .flow-container {
          position: relative;
        }
        
        .flow-step {
          transition: all 0.5s ease;
          transform: translateY(20px);
          opacity: 0;
        }
        
        .flow-step.active {
          transform: translateY(0);
          opacity: 1;
        }
        
        .flow-step.completed {
          background-color: #d4edda;
          border-left: 4px solid #28a745;
        }
        
        .flow-arrow {
          font-size: 1.5rem;
          color: #007bff;
          animation: bounce 2s infinite;
        }
        
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-8px); }
          60% { transform: translateY(-4px); }
        }
      `}</style>
    </Row>
  );
};

export default SimuladorRespuesta;