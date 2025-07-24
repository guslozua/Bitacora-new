import React, { useState } from 'react';
import { Form, Button, Container, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../services/apiConfig';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

const TabulacionesUpload = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Por favor seleccioná un archivo.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      setError('');
      setMessage('');

      const res = await axios.post(`${API_BASE_URL}/tabulaciones/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const responseData = res.data?.data || res.data;
      const { total_insertados, total_duplicados } = responseData;

      setMessage(`✔ Registros nuevos: ${total_insertados} | Repetidos: ${total_duplicados}`);
    } catch (err) {
      setError('Error al subir el archivo. Verificá que sea un .xlsx válido.');
      console.error('Error de carga:', err);
    } finally {
      setUploading(false);
    }
  };

  const contentStyle = {
    marginLeft: sidebarCollapsed ? '80px' : '250px',
    transition: 'all 0.3s',
    width: sidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 250px)',
    display: 'flex' as 'flex',
    flexDirection: 'column' as 'column',
    minHeight: '100vh',
  };

  return (
    <div className="d-flex">
      <Sidebar collapsed={sidebarCollapsed} toggle={toggleSidebar} onLogout={handleLogout} />

      <div style={contentStyle}>
        <Container className="py-4">
          <h2 className="mb-4">Carga de Tabulaciones</h2>

          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="formFile" className="mb-3">
              <Form.Label>Archivo Excel (.xlsx) con la hoja "Tareas"</Form.Label>
              <Form.Control
                type="file"
                accept=".xlsx"
                onChange={(e) => {
                  const target = e.target as HTMLInputElement;
                  setFile(target.files?.[0] || null);
                  setMessage('');
                  setError('');
                }}
              />
            </Form.Group>

            <Button variant="primary" type="submit" disabled={uploading}>
              {uploading ? <Spinner animation="border" size="sm" /> : 'Subir'}
            </Button>

            {message && <Alert variant="success" className="mt-3">{message}</Alert>}
            {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
          </Form>
        </Container>

        <Footer />
      </div>
    </div>
  );
};

export default TabulacionesUpload;
