import React, { useState } from 'react';
import { Modal, Form, Button, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { API_BASE_URL } from '../services/apiConfig';

interface ItrackerUploadModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess?: (message: string) => void;
}

const ItrackerUploadModal = ({ show, onHide, onSuccess }: ItrackerUploadModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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

      console.log("👉 Enviando archivo al backend...");

      const res = await axios.post(`${API_BASE_URL}/itracker/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Debug: ver estructura real de la respuesta
      console.log("Respuesta del backend:", res);

      // Manejo flexible: accede a res.data o res.data.data
      const responseData = res.data?.data || res.data;
      const { total_insertados, total_duplicados } = responseData;

      const successMessage = `✔ Registros nuevos: ${total_insertados} | Repetidos: ${total_duplicados}`;
      setMessage(successMessage);
      
      // Notificar al componente padre del éxito
      if (onSuccess) {
        onSuccess(successMessage);
      }
      
      // Cerrar el modal después de un éxito (opcional)
      setTimeout(() => {
        onHide();
        setFile(null);
        setMessage('');
      }, 2000);
      
    } catch (err) {
      setError('Error al subir el archivo. Verificá que sea un .xlsx válido.');
      console.error('Error de carga:', err);
    } finally {
      setUploading(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setMessage('');
    setError('');
    onHide();
  };

  return (
    <Modal show={show} onHide={resetModal} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-file-earmark-excel me-2 text-success"></i>
          Carga reporte iTracker
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="formFile" className="mb-3">
            <Form.Label>Archivo Excel (.xlsx)</Form.Label>
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
            <Form.Text className="text-muted">
              Seleccioná el archivo de iTracker en formato Excel (.xlsx)
            </Form.Text>
          </Form.Group>

          {message && <Alert variant="success" className="mt-3">{message}</Alert>}
          {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={resetModal}>
          Cancelar
        </Button>
        <Button 
          variant="success" 
          onClick={handleSubmit} 
          disabled={uploading || !file}
        >
          {uploading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Subiendo...
            </>
          ) : (
            <>
              <i className="bi bi-cloud-upload-fill me-2"></i>
              Subir archivo
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ItrackerUploadModal;