import React, { useState } from 'react';
import { Table, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';

const PaginaConTabla = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
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
          <h2 className="mb-4">Listado de Datos</h2>

          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>Ejemplo</td>
                <td>ejemplo@email.com</td>
                <td>Editar | Eliminar</td>
              </tr>
              {/* Agregar más filas dinámicamente */}
            </tbody>
          </Table>
        </Container>

        <Footer />
      </div>
    </div>
  );
};

export default PaginaConTabla;
