import React, { useState } from 'react';
import { Button, Modal, Form, Spinner, Alert, OverlayTrigger, Tooltip } from 'react-bootstrap';
import hitoService from '../../services/hitoService';

// 🔧 INTERFAZ CORREGIDA - solo 'sm' y 'lg' para React Bootstrap
interface ConvertToHitoProps {
  projectId: number;
  projectName: string;
  onConversionComplete?: () => void;
  buttonVariant?: 'outline-warning' | 'warning' | 'outline-primary' | 'primary';
  buttonSize?: 'sm' | 'lg'; // 🔧 CORREGIDO: solo sm y lg
  showText?: boolean; // 🆕 NUEVA: Controla si mostrar texto o solo ícono
  className?: string;
}

const ConvertToHito: React.FC<ConvertToHitoProps> = ({ 
  projectId, 
  projectName, 
  onConversionComplete,
  buttonVariant = 'outline-warning',
  buttonSize = 'sm', // 🔧 CORREGIDO: valor por defecto válido
  showText = true, // 🆕 Por defecto muestra texto
  className = ''
}) => {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [impacto, setImpacto] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'danger', text: string } | null>(null);

  const handleShow = () => {
    setShow(true);
    setMessage(null);
    console.log('🎯 Abriendo modal para convertir proyecto:', { projectId, projectName });
  };

  const handleClose = () => {
    setShow(false);
    setImpacto('');
    setMessage(null);
  };

  const handleConvert = async () => {
    setLoading(true);
    setMessage(null);
    
    console.log('🚀 Iniciando conversión:', { projectId, projectName, impacto });
    
    try {
      // Llamar al servicio para convertir el proyecto en hito
      console.log('📡 Llamando a hitoService.convertProjectToHito...');
      const response = await hitoService.convertProjectToHito(projectId, { impacto });
      
      console.log('✅ Respuesta exitosa:', response);
      setMessage({ type: 'success', text: 'Proyecto convertido a hito correctamente' });
      
      // Notificar al componente padre que la conversión se completó
      if (onConversionComplete) {
        onConversionComplete();
      }
      
      // Cerrar modal después de un breve delay para mostrar el mensaje
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error: any) {
      console.error('❌ Error en conversión:', error);
      
      let errorMessage = 'Error desconocido';
      
      if (error.response) {
        console.error('📊 Datos del error:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
        
        if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.statusText) {
          errorMessage = `${error.response.status}: ${error.response.statusText}`;
        }
      } else if (error.request) {
        console.error('📡 Error de red:', error.request);
        errorMessage = 'Error de conectividad con el servidor';
      } else {
        console.error('⚠️ Error general:', error.message);
        errorMessage = error.message;
      }
      
      setMessage({ 
        type: 'danger', 
        text: `Error al convertir el proyecto a hito: ${errorMessage}` 
      });
    } finally {
      setLoading(false);
    }
  };

  // 🆕 RENDERIZADO CONDICIONAL: Solo ícono o ícono + texto
  const renderButton = () => {
    const buttonContent = showText ? (
      <>
        <i className="bi bi-star me-1"></i>
        Convertir a Hito
      </>
    ) : (
      <i className="bi bi-star"></i>
    );

    const button = (
      <Button
        variant={buttonVariant}
        size={buttonSize}
        onClick={handleShow}
        className={`d-flex align-items-center justify-content-center ${className}`}
        disabled={loading}
      >
        {buttonContent}
      </Button>
    );

    // 🔧 Si no muestra texto, envolver en tooltip para mejor UX
    if (!showText) {
      return (
        <OverlayTrigger
          placement="top"
          overlay={
            <Tooltip>
              Convertir proyecto a hito
            </Tooltip>
          }
        >
          {button}
        </OverlayTrigger>
      );
    }

    return button;
  };

  return (
    <>
      {renderButton()}
      
      <Modal show={show} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-star me-2"></i>
            Convertir Proyecto a Hito
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body>
          {message && (
            <Alert variant={message.type} className="mb-3">
              <div className="d-flex align-items-center">
                <i className={`bi ${message.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-triangle'} me-2`}></i>
                {message.text}
              </div>
            </Alert>
          )}
          
          <div className="mb-3">
            <div className="d-flex align-items-center mb-3 p-3 bg-light rounded">
              <i className="bi bi-info-circle text-primary me-2" style={{ fontSize: '1.5rem' }}></i>
              <div>
                <strong>Proyecto a convertir:</strong><br/>
                <span className="text-primary">{projectName}</span>
              </div>
            </div>
            
            <p className="text-muted small">
              Esta acción convertirá el proyecto completado en un hito, conservando toda la información 
              del proyecto, incluyendo tareas y usuarios asignados.
            </p>

            {/* Debug info solo en desarrollo */}
            {process.env.NODE_ENV === 'development' && (
              <details className="small text-muted border rounded p-2 mb-3">
                <summary style={{ cursor: 'pointer' }}>
                  <strong>Información de desarrollo</strong>
                </summary>
                <div className="mt-2">
                  <strong>ID del Proyecto:</strong> {projectId}<br/>
                  <strong>Nombre:</strong> {projectName}<br/>
                  <strong>showText:</strong> {showText ? 'true' : 'false'}<br/>
                  <strong>buttonVariant:</strong> {buttonVariant}<br/>
                  <strong>buttonSize:</strong> {buttonSize}
                </div>
              </details>
            )}
          </div>
          
          <Form.Group className="mb-3">
            <Form.Label>
              <i className="bi bi-lightbulb me-1"></i>
              Impacto del Hito
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={impacto}
              onChange={(e) => setImpacto(e.target.value)}
              placeholder="Describa el impacto o relevancia que tuvo este proyecto para la organización..."
              disabled={loading}
            />
            <Form.Text className="text-muted">
              Opcional: Describa la importancia o el impacto que tuvo este proyecto
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        
        <Modal.Footer className="d-flex justify-content-between">
          <Button 
            variant="outline-secondary" 
            onClick={handleClose} 
            disabled={loading}
          >
            <i className="bi bi-x-circle me-1"></i>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleConvert}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner 
                  as="span" 
                  animation="border" 
                  size="sm" 
                  role="status" 
                  aria-hidden="true" 
                  className="me-2"
                />
                Convirtiendo...
              </>
            ) : (
              <>
                <i className="bi bi-star-fill me-1"></i>
                Convertir a Hito
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ConvertToHito;