// pages/AternityPage.tsx
import React from 'react';
import { Container } from 'react-bootstrap';
import AternityDashboard from '../components/AternityDashboard';

const AternityPage: React.FC = () => {
  return (
    <div className="min-vh-100 bg-light">
      <Container fluid className="py-4">
        <div className="mb-4">
          <h1 className="display-6 fw-bold text-primary mb-2">
            <i className="bi bi-speedometer2 me-3"></i>
            Monitoreo Aternity
          </h1>
          <p className="text-muted lead">
            Integración con Aternity para análisis avanzado de rendimiento y experiencia de usuario
          </p>
        </div>
        
        <AternityDashboard />
      </Container>
    </div>
  );
};

export default AternityPage;