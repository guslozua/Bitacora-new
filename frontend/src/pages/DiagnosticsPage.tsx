import React from 'react';
import { Container } from 'react-bootstrap';
import DiagnosticsPanel from '../components/Diagnostics/DiagnosticsPanel';

const DiagnosticsPage: React.FC = () => {
  return (
    <Container fluid className="py-4">
      <DiagnosticsPanel />
    </Container>
  );
};

export default DiagnosticsPage;