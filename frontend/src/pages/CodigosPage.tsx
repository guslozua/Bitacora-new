// src/pages/CodigosPage.tsx
import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Button, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import CodigosList from '../components/Codigos/CodigosList';
import CodigoModal from '../components/Codigos/CodigoModal';
import CodigoFilters from '../components/Codigos/CodigoFilters';
import CodigoService, { Codigo } from '../services/CodigoService';

const CodigosPage: React.FC = () => {
  const navigate = useNavigate();
  const [codigos, setCodigos] = useState<Codigo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedCodigo, setSelectedCodigo] = useState<Codigo | null>(null);
  const [filters, setFilters] = useState({
    tipo: '',
    estado: 'activo',
    search: '',
    incluirInactivos: false
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  
  // Cargar códigos al montar el componente o cuando cambian los filtros
  useEffect(() => {
    loadCodigos();
  }, [filters]);
  
  // Función para cargar códigos con filtros
  const loadCodigos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        tipo: filters.tipo || undefined,
        estado: filters.estado || undefined,
        search: filters.search || undefined,
        incluir_inactivos: filters.incluirInactivos ? 'true' : undefined
      };
      
      const codigosData = await CodigoService.fetchCodigos(params);
      setCodigos(codigosData);
    } catch (error) {
      console.error('Error al cargar códigos:', error);
      setError('No se pudieron cargar los códigos de facturación');
    } finally {
      setLoading(false);
    }
  };
  
  // Abrir modal para crear código
  const handleNewCodigo = () => {
    setSelectedCodigo(null);
    setShowModal(true);
  };
  
  // Abrir modal para editar código
  const handleEditCodigo = (codigo: Codigo) => {
    setSelectedCodigo(codigo);
    setShowModal(true);
  };
  
  // Desactivar un código
  const handleDeactivateCodigo = async (codigo: Codigo) => {
    try {
      await CodigoService.deactivateCodigo(codigo.id!);
      loadCodigos();
    } catch (error) {
      console.error('Error al desactivar código:', error);
      setError('No se pudo desactivar el código');
    }
  };
  
  // Eliminar un código
  const handleDeleteCodigo = async (codigo: Codigo) => {
    try {
      await CodigoService.deleteCodigo(codigo.id!);
      loadCodigos();
    } catch (error) {
      console.error('Error al eliminar código:', error);
      setError('No se pudo eliminar el código');
    }
  };
  
  // Manejar cambios en los filtros
  const handleFilterChange = (newFilters: any) => {
    setFilters({ ...filters, ...newFilters });
  };
  
  // Manejar cierre de modal y recarga de datos
  const handleModalClose = (reloadData: boolean = false) => {
    setShowModal(false);
    if (reloadData) {
      loadCodigos();
    }
  };
  
  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };
  
  // Estilos para el contenido principal
  const contentStyle = {
    marginLeft: sidebarCollapsed ? '80px' : '250px',
    transition: 'all 0.3s',
    width: sidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 250px)'
  };
  
  return (
    <div className="d-flex">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        toggle={toggleSidebar} 
        onLogout={() => navigate('/login')}
      />
      
      <div style={contentStyle} className="flex-grow-1">
        <Container fluid className="py-4">
          <Card className="shadow-sm border-0 mb-4">
            <Card.Body>
              <Row className="align-items-center mb-4">
                <Col>
                  <h2 className="mb-0">Administración de Códigos de Facturación</h2>
                  <p className="text-muted">Gestione los códigos utilizados para facturar las guardias e incidentes</p>
                </Col>
                <Col xs="auto">
                  <Button variant="primary" onClick={handleNewCodigo}>
                    <i className="bi bi-plus-circle me-2"></i>
                    Nuevo Código
                  </Button>
                </Col>
              </Row>
              
              <CodigoFilters 
                filters={filters} 
                onFilterChange={handleFilterChange} 
              />
              
              {error && (
                <Alert variant="danger" className="mt-3">
                  {error}
                </Alert>
              )}
              
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3 text-muted">Cargando códigos...</p>
                </div>
              ) : (
                <CodigosList 
                  codigos={codigos} 
                  onEdit={handleEditCodigo}
                  onDeactivate={handleDeactivateCodigo}
                  onDelete={handleDeleteCodigo}
                />
              )}
            </Card.Body>
          </Card>
        </Container>
        
        <Footer />
        
        {/* Modal para crear/editar código */}
        <CodigoModal 
          show={showModal}
          onHide={handleModalClose}
          codigo={selectedCodigo}
        />
      </div>
    </div>
  );
};

export default CodigosPage;