import React, { useState, useRef, DragEvent } from 'react';
import { Form, Button, Modal, Alert, Spinner, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import Swal from 'sweetalert2';

interface AbmUploadModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess?: () => void;
}

const AbmUploadModal: React.FC<AbmUploadModalProps> = ({ show, onHide, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [platform, setPlatform] = useState('pic');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return setError('Por favor seleccioná un archivo.');

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      setError('');

      const res = await axios.post(`http://localhost:5000/api/abm/${platform}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const responseData = res.data;
      
      // Mostrar SweetAlert de éxito
      Swal.fire({
        title: '¡Archivo procesado correctamente!',
        text: `Se procesaron ${responseData.total_insertados} registros nuevos y ${responseData.total_duplicados} duplicados.`,
        icon: 'success',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false
      });
      
      // Resetear el estado y cerrar el modal
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Llamar al callback de éxito si existe
      if (onSuccess) {
        onSuccess();
      }
      
      // Cerrar el modal después de un pequeño retraso para que el usuario vea el mensaje de éxito
      setTimeout(() => {
        onHide();
      }, 500);
      
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al subir el archivo. Verificá el formato.');
      
      // Mostrar SweetAlert de error
      Swal.fire({
        title: 'Error',
        text: err.response?.data?.error || 'Error al subir el archivo. Verificá el formato.',
        icon: 'error',
        confirmButtonText: 'Intentar nuevamente'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.xlsx')) {
        setFile(droppedFile);
        setError('');
      } else {
        setError('Solo se permiten archivos Excel (.xlsx)');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setError('');
  };

  // Resetear estado al cerrar
  const handleClose = () => {
    setFile(null);
    setError('');
    setPlatform('pic');
    setIsDragging(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onHide();
  };

  return (
    <Modal 
      show={show} 
      onHide={handleClose}
      size="lg"
      centered
      backdrop="static"
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <div className="d-flex align-items-center">
            <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-2">
              <i className="bi bi-cloud-upload-fill text-primary"></i>
            </div>
            Carga de archivos PIC & Social
          </div>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        <div className="text-center mb-4">
          <h5 className="fw-bold">Subir archivo de {platform === 'pic' ? 'PIC' : 'YSocial'}</h5>
          <p className="text-muted">Seleccioná un archivo Excel (.xlsx) para cargar los datos</p>
        </div>
        
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="platformSelect" className="mb-4">
            <Form.Label className="fw-bold">Plataforma</Form.Label>
            <div className="d-flex gap-3">
              <Button 
                variant={platform === 'pic' ? 'primary' : 'outline-primary'} 
                onClick={() => setPlatform('pic')}
                className="w-50 py-2"
                type="button"
              >
                <i className="bi bi-hdd-network me-2"></i>
                PIC
              </Button>
              <Button 
                variant={platform === 'social' ? 'danger' : 'outline-danger'} 
                onClick={() => setPlatform('social')}
                className="w-50 py-2"
                type="button"
              >
                <i className="bi bi-share me-2"></i>
                YSocial
              </Button>
            </div>
          </Form.Group>
          
          <div 
            className={`drag-drop-area border rounded-3 p-4 text-center mb-4 ${isDragging ? 'border-primary bg-light' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{ cursor: 'pointer', borderStyle: 'dashed' }}
            onClick={() => fileInputRef.current?.click()}
          >
            {file ? (
              <div className="text-success py-3">
                <i className="bi bi-file-earmark-excel fs-1 mb-2"></i>
                <p className="mb-0 fw-bold">{file.name}</p>
                <p className="text-muted small">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            ) : (
              <div className="py-3">
                <i className="bi bi-file-earmark-arrow-up fs-1 mb-2 text-muted"></i>
                <p className="mb-0">Arrastrá un archivo aquí o hacé click para seleccionar</p>
                <p className="text-muted small">Solo archivos Excel (.xlsx)</p>
              </div>
            )}
            <input 
              ref={fileInputRef}
              type="file" 
              className="d-none" 
              accept=".xlsx" 
              onChange={handleFileChange} 
            />
          </div>

          {error && (
            <Alert variant="danger" className="mb-4">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error}
            </Alert>
          )}

          <Row className="mb-3">
            <Col md={6}>
              <div className="d-grid">
                <Button 
                  variant="secondary" 
                  onClick={handleClose}
                  className="py-2"
                >
                  <i className="bi bi-x-circle me-2"></i>
                  Cancelar
                </Button>
              </div>
            </Col>
            <Col md={6}>
              <div className="d-grid">
                <Button 
                  variant={platform === 'pic' ? 'primary' : 'danger'} 
                  type="submit" 
                  disabled={uploading || !file}
                  className="py-2"
                >
                  {uploading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-upload me-2"></i>
                      Subir Archivo
                    </>
                  )}
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
        
        <div className="mt-4 p-3 bg-light rounded border">
          <h6 className="fw-bold mb-2">
            <i className="bi bi-info-circle me-2 text-primary"></i>
            Información importante
          </h6>
          <ul className="mb-0 small">
            <li className="mb-1">Los archivos deben tener el formato estándar según la plataforma.</li>
            <li className="mb-1">Para PIC: el archivo debe contener las hojas "Altas carga manual" y "Bajas carga manual".</li>
            <li className="mb-1">Para YSocial: el archivo debe contener hojas con "alta" y "baja" en el nombre.</li>
            <li className="mb-0">El sistema verifica automáticamente registros duplicados para evitar la carga repetida.</li>
          </ul>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default AbmUploadModal;