import React, { useState } from 'react';
import { Button, Modal, Form, Spinner, Alert } from 'react-bootstrap';
import hitoService from '../../services/hitoService';
import type { ConvertToHitoProps } from '../../types/hitos.types';

const ConvertToHito: React.FC<ConvertToHitoProps> = ({ 
  projectId, 
  projectName, 
  onConversionComplete 
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

  return (
    <>
      <Button
        variant="outline-warning"
        size="sm"
        onClick={handleShow}
        className="d-flex align-items-center"
      >
        <i className="bi bi-star me-1"></i>
        Convertir a Hito
      </Button>
      
      <Modal show={show} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Convertir Proyecto a Hito</Modal.Title>
        </Modal.Header>
        
        <Modal.Body>
          {message && (
            <Alert variant={message.type} className="mb-3">
              {message.text}
            </Alert>
          )}
          
          <div className="mb-3">
            <p>
              Está a punto de convertir el proyecto <strong>{projectName}</strong> en un hito. 
              Esta acción conservará toda la información del proyecto, incluyendo tareas y usuarios asignados.
            </p>
            
            {/* Debug info */}
            <div className="small text-muted border rounded p-2 mb-3">
              <strong>Debug Info:</strong><br/>
              ID del Proyecto: {projectId}<br/>
              Nombre: {projectName}
            </div>
          </div>
          
          <Form.Group className="mb-3">
            <Form.Label>Impacto del Hito</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={impacto}
              onChange={(e) => setImpacto(e.target.value)}
              placeholder="Describa el impacto o relevancia que tuvo este proyecto para la organización"
              disabled={loading}
            />
            <Form.Text className="text-muted">
              Describa el impacto o relevancia que tuvo este proyecto para la organización
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={handleClose} 
            disabled={loading}
          >
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
              'Convertir a Hito'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ConvertToHito;