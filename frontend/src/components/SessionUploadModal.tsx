// components/SessionUploadModal.tsx
import React, { useState, useRef } from 'react';
import { Modal, Button, Form, Alert, ProgressBar, Card } from 'react-bootstrap';
import { sessionAnalysisService } from '../services/sessionAnalysisService';

interface SessionUploadModalProps {
  show: boolean;
  onHide: () => void;
  onFileUploaded: (result: any) => void;
}

const SessionUploadModal: React.FC<SessionUploadModalProps> = ({ show, onHide, onFileUploaded }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError(null);
    
    if (selectedFile) {
      // Validar archivo
      const validation = sessionAnalysisService.validateFile(selectedFile);
      
      if (!validation.valid) {
        setError(validation.error || 'Archivo no válido');
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);

      const result = await sessionAnalysisService.uploadSessionFile(file, (progress) => {
        setUploadProgress(progress);
      });

      if (result.success) {
        onFileUploaded(result.data);
        handleClose();
      } else {
        setError(result.message || 'Error procesando el archivo');
      }
    } catch (error: any) {
      console.error('Error uploading file:', error);
      const errorMessage = sessionAnalysisService.handleError(error);
      setError(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    setFile(null);
    setError(null);
    setUploadProgress(0);
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onHide();
  };

  const removeFile = () => {
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-upload me-2 text-primary"></i>
          Subir Archivo de Sesiones
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" className="mb-3 d-flex align-items-center">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}

        {/* Información sobre el formato esperado */}
        <Card className="mb-3 border-info bg-info bg-opacity-10">
          <Card.Body className="py-3">
            <h6 className="text-info mb-2">
              <i className="bi bi-info-circle me-1"></i>
              Formato de Archivo Esperado
            </h6>
            <div className="row">
              <div className="col-md-6">
                <small className="text-muted">
                  <strong>Columnas requeridas:</strong><br/>
                  • Usuario asociado<br/>
                  • Estado de la sesión<br/>
                  • Hora de inicio de la sesión<br/>
                  • Nombre de máquina<br/>
                  • IP de punto final<br/>
                  • Versión de Receiver
                </small>
              </div>
              <div className="col-md-6">
                <small className="text-muted">
                  <strong>Formatos soportados:</strong><br/>
                  • CSV (.csv)<br/>
                  • Excel (.xlsx, .xls)<br/>
                  <strong>Tamaño máximo:</strong> 50MB
                </small>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Form>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Seleccionar Archivo</Form.Label>
            <Form.Control
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              disabled={uploading}
              className="form-control-lg"
            />
            <Form.Text className="text-muted">
              Selecciona un archivo CSV o Excel con los datos de sesiones.
            </Form.Text>
          </Form.Group>

          {file && (
            <Card className="mb-3 border-success bg-success bg-opacity-10">
              <Card.Body className="py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="flex-grow-1">
                    <h6 className="mb-1 text-success d-flex align-items-center">
                      <i className="bi bi-file-earmark-check me-2"></i>
                      {file.name}
                    </h6>
                    <div className="small text-muted">
                      <span className="me-3">
                        <i className="bi bi-hdd me-1"></i>
                        Tamaño: {sessionAnalysisService.formatFileSize(file.size)}
                      </span>
                      <span>
                        <i className="bi bi-calendar me-1"></i>
                        Modificado: {new Date(file.lastModified).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={removeFile}
                    disabled={uploading}
                    className="ms-2"
                  >
                    <i className="bi bi-x-lg"></i>
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}

          {uploading && (
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <small className="text-muted fw-bold">
                  <i className="bi bi-gear me-1"></i>
                  Procesando archivo...
                </small>
                <small className="text-muted fw-bold">{uploadProgress}%</small>
              </div>
              <ProgressBar 
                now={uploadProgress} 
                variant="success" 
                className="progress-lg"
                style={{ height: '8px' }}
              />
              <small className="text-muted mt-1 d-block">
                Analizando datos y generando métricas automáticamente...
              </small>
            </div>
          )}
        </Form>

        {/* Preview de lo que pasará */}
        {file && !uploading && (
          <Card className="border-warning bg-warning bg-opacity-10">
            <Card.Body className="py-3">
              <h6 className="text-warning mb-2">
                <i className="bi bi-gear me-1"></i>
                Proceso de Análisis Automático
              </h6>
              <small className="text-muted">
                Al procesar el archivo se realizarán las siguientes acciones:<br/>
                <strong>1.</strong> Validación de datos y formato de columnas<br/>
                <strong>2.</strong> Identificación de máquinas VM PIC (patrón VMxxxPICxxxx)<br/>
                <strong>3.</strong> Clasificación por ubicación (Home vs Call Center) basado en rangos IP<br/>
                <strong>4.</strong> Generación de métricas históricas y estadísticas<br/>
                <strong>5.</strong> Actualización automática del dashboard con nuevos datos
              </small>
            </Card.Body>
          </Card>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={uploading}>
          <i className="bi bi-x-circle me-1"></i>
          Cancelar
        </Button>
        <Button 
          variant="primary" 
          onClick={handleUpload} 
          disabled={!file || uploading}
          className="px-4"
        >
          {uploading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Procesando...
            </>
          ) : (
            <>
              <i className="bi bi-upload me-1"></i>
              Procesar Archivo
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SessionUploadModal;