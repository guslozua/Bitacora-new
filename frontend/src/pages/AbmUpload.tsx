import React, { useState, useRef, DragEvent } from 'react';
import { Form, Button, Container, Alert, Spinner, Card, Row, Col } from 'react-bootstrap';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import axios from 'axios';
import { API_BASE_URL } from '../services/apiConfig';

const AbmUpload = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [platform, setPlatform] = useState('pic');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const contentStyle: React.CSSProperties = {
    marginLeft: sidebarCollapsed ? '80px' : '250px',
    transition: 'all 0.3s',
    width: sidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 250px)',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return setError('Por favor seleccioná un archivo.');

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      setError('');
      setMessage('');

      const res = await axios.post(`${API_BASE_URL}/abm/${platform}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const responseData = res.data;
      setMessage(`✔ ${responseData.message}\nNuevos: ${responseData.total_insertados} | Duplicados: ${responseData.total_duplicados}`);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al subir el archivo. Verificá el formato.');
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
        setMessage('');
        setError('');
      } else {
        setError('Solo se permiten archivos Excel (.xlsx)');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setMessage('');
    setError('');
  };

  return (
    <div className="d-flex">
      <Sidebar collapsed={sidebarCollapsed} toggle={toggleSidebar} onLogout={handleLogout} />
      <div style={contentStyle}>
        <Container className="py-4">
          <h2 className="fw-bold mb-4">Carga de archivo ABM</h2>
          
          <Row>
            <Col md={8} className="mx-auto">
              <Card className="shadow-sm border-0 mb-4">
                <Card.Body className="p-4">
                  <div className="text-center mb-4">
                    <div className="display-6 mb-2">
                      <i className="bi bi-cloud-arrow-up-fill text-primary"></i>
                    </div>
                    <h4 className="fw-bold">Subir archivo de {platform === 'pic' ? 'PIC' : 'YSocial'}</h4>
                    <p className="text-muted">Seleccioná un archivo Excel (.xlsx) para cargar los datos</p>
                  </div>
                  
                  <Form onSubmit={handleSubmit}>
                    <Form.Group controlId="platformSelect" className="mb-4">
                      <Form.Label className="fw-bold">Plataforma</Form.Label>
                      <div className="d-flex gap-3">
                        <Button 
                          variant={platform === 'pic' ? 'primary' : 'outline-primary'} 
                          onClick={() => setPlatform('pic')}
                          className="w-50 py-3"
                        >
                          <i className="bi bi-hdd-network me-2"></i>
                          PIC
                        </Button>
                        <Button 
                          variant={platform === 'social' ? 'danger' : 'outline-danger'} 
                          onClick={() => setPlatform('social')}
                          className="w-50 py-3"
                        >
                          <i className="bi bi-share me-2"></i>
                          YSocial
                        </Button>
                      </div>
                    </Form.Group>
                    
                    <div 
                      className={`drag-drop-area border rounded-3 p-5 text-center mb-4 ${isDragging ? 'border-primary bg-light' : ''}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      style={{ cursor: 'pointer', borderStyle: 'dashed' }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {file ? (
                        <div className="text-success">
                          <i className="bi bi-file-earmark-excel fs-1 mb-2"></i>
                          <p className="mb-0 fw-bold">{file.name}</p>
                          <p className="text-muted small">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      ) : (
                        <div>
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

                    <div className="d-grid">
                      <Button 
                        variant={platform === 'pic' ? 'primary' : 'danger'} 
                        type="submit" 
                        disabled={uploading || !file}
                        className="py-3"
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

                    {message && (
                      <Alert variant="success" className="mt-4">
                        <div className="d-flex align-items-center">
                          <div className="fs-3 me-3 text-success">
                            <i className="bi bi-check-circle-fill"></i>
                          </div>
                          <div>
                            <p className="fw-bold mb-1">¡Archivo procesado correctamente!</p>
                            <p className="mb-0">Nuevos registros: <span className="fw-bold">{message.split('Nuevos: ')[1]?.split(' | ')[0]}</span></p>
                            <p className="mb-0">Duplicados: <span className="fw-bold">{message.split('Duplicados: ')[1]}</span></p>
                          </div>
                        </div>
                      </Alert>
                    )}
                    
                    {error && (
                      <Alert variant="danger" className="mt-4">
                        <div className="d-flex align-items-center">
                          <div className="fs-3 me-3 text-danger">
                            <i className="bi bi-exclamation-triangle-fill"></i>
                          </div>
                          <div>
                            <p className="fw-bold mb-1">Error</p>
                            <p className="mb-0">{error}</p>
                          </div>
                        </div>
                      </Alert>
                    )}
                  </Form>
                </Card.Body>
              </Card>
              
              <Card className="shadow-sm border-0">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-3">
                    <i className="bi bi-info-circle me-2 text-primary"></i>
                    Información importante
                  </h5>
                  <ul className="mb-0">
                    <li className="mb-2">Los archivos deben tener el formato estándar según la plataforma.</li>
                    <li className="mb-2">Para PIC: el archivo debe contener las hojas "Altas carga manual" y "Bajas carga manual".</li>
                    <li className="mb-2">Para YSocial: el archivo debe contener hojas con "alta" y "baja" en el nombre.</li>
                    <li className="mb-2">El sistema verifica automáticamente registros duplicados para evitar la carga repetida.</li>
                    <li className="mb-0">Los datos cargados estarán disponibles inmediatamente en el Dashboard.</li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
        <Footer />
      </div>
    </div>
  );
};

export default AbmUpload;