import React, { useState } from 'react';
import { Card, Form, Button, Row, Col, Badge } from 'react-bootstrap';
import { useDashboardSectionVisibility, DashboardSection } from '../services/DashboardSectionVisibilityContext';
import { useTheme } from '../context/ThemeContext';

interface DraggableSectionItemProps {
  section: DashboardSection;
  index: number;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, dropIndex: number) => void;
  onDragEnd: () => void;
  isDraggedOver: boolean;
  isDragging: boolean;
  onToggleVisibility: (id: string) => void;
}

const DraggableSectionItem: React.FC<DraggableSectionItemProps> = ({
  section,
  index,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDraggedOver,
  isDragging,
  onToggleVisibility
}) => {
  const { isDarkMode } = useTheme();

  const getThemeColors = () => {
    if (isDarkMode) {
      return {
        cardBackground: '#343a40',
        textPrimary: '#ffffff',
        border: '#495057',
        dragOverBg: '#495057'
      };
    }
    return {
      cardBackground: '#ffffff',
      textPrimary: '#212529',
      border: '#dee2e6',
      dragOverBg: '#f8f9fa'
    };
  };

  const themeColors = getThemeColors();

  return (
    <Card
      className={`mb-2 border shadow-sm ${isDraggedOver ? 'border-primary' : ''}`}
      style={{
        backgroundColor: isDraggedOver ? themeColors.dragOverBg : themeColors.cardBackground,
        borderColor: isDraggedOver ? '#0d6efd' : themeColors.border,
        opacity: isDragging ? 0.5 : 1,
        transform: isDragging ? 'rotate(2deg)' : 'none',
        transition: 'all 0.2s ease',
        cursor: 'grab'
      }}
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
    >
      <Card.Body className="p-3">
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center flex-grow-1">
            {/* Drag Handle */}
            <div 
              className="me-3 text-muted"
              style={{ 
                cursor: 'grab',
                fontSize: '1.2rem',
                userSelect: 'none'
              }}
              title="Arrastra para reordenar"
            >
              <i className="bi bi-grip-vertical"></i>
            </div>

            {/* Section Icon and Info */}
            <div className="rounded-circle me-3 d-flex align-items-center justify-content-center"
              style={{
                backgroundColor: isDarkMode ? '#495057' : '#f8f9fa',
                width: '2.5rem',
                height: '2.5rem',
                padding: 0
              }}>
              <i 
                className={`bi ${section.icon}`}
                style={{ 
                  fontSize: '1.2rem',
                  color: themeColors.textPrimary
                }}
              ></i>
            </div>
            
            <div className="flex-grow-1">
              <div className="fw-medium d-flex align-items-center" style={{ color: themeColors.textPrimary }}>
                {section.label}
                {!section.visible && (
                  <Badge bg="secondary" className="ms-2" style={{ fontSize: '0.7rem' }}>
                    Oculta
                  </Badge>
                )}
              </div>
              <small className="text-muted">
                {section.description}
              </small>
            </div>
          </div>

          {/* Visibility Toggle */}
          <div className="d-flex align-items-center">
            <Form.Check
              type="switch"
              id={`switch-order-${section.id}`}
              checked={section.visible}
              onChange={() => onToggleVisibility(section.id)}
              className="fs-5"
              title={section.visible ? 'Ocultar sección' : 'Mostrar sección'}
            />
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

// 🆕 NUEVO COMPONENTE: Vista Miniatura del Dashboard
interface DashboardPreviewProps {
  sections: DashboardSection[];
  isDarkMode: boolean;
}

const DashboardPreview: React.FC<DashboardPreviewProps> = ({ sections, isDarkMode }) => {
  const getThemeColors = () => {
    if (isDarkMode) {
      return {
        cardBackground: '#343a40',
        textPrimary: '#ffffff',
        border: '#495057',
        miniCardBg: '#495057',
        disabledBg: '#2c3034'
      };
    }
    return {
      cardBackground: '#ffffff',
      textPrimary: '#212529',
      border: '#dee2e6',
      miniCardBg: '#f8f9fa',
      disabledBg: '#e9ecef'
    };
  };

  const themeColors = getThemeColors();
  const visibleSections = sections.filter(s => s.visible);

  // Simular el layout del dashboard
  const renderMiniSection = (section: DashboardSection, index: number) => {
    const isFullWidth = ['kpis-sistema', 'anuncios', 'cronograma-proyectos'].includes(section.id);
    
    return (
      <div
        key={section.id}
        className={`mb-1 p-2 rounded d-flex align-items-center justify-content-between ${isFullWidth ? 'col-12' : 'col-6'}`}
        style={{
          backgroundColor: section.visible ? themeColors.miniCardBg : themeColors.disabledBg,
          border: `1px solid ${themeColors.border}`,
          opacity: section.visible ? 1 : 0.5,
          fontSize: '0.75rem',
          minHeight: '30px'
        }}
      >
        <div className="d-flex align-items-center">
          <i 
            className={`bi ${section.icon} me-2`}
            style={{ 
              fontSize: '0.8rem',
              color: section.visible ? themeColors.textPrimary : '#6c757d'
            }}
          ></i>
          <span style={{ 
            color: section.visible ? themeColors.textPrimary : '#6c757d',
            fontWeight: section.visible ? '500' : '400'
          }}>
            {section.label}
          </span>
        </div>
        <Badge 
          bg={section.visible ? 'success' : 'secondary'} 
          style={{ fontSize: '0.6rem' }}
        >
          {index + 1}
        </Badge>
      </div>
    );
  };

  return (
    <Card className="h-100 border-0 shadow-sm" style={{ backgroundColor: themeColors.cardBackground }}>
      <Card.Header className="py-2" style={{ backgroundColor: themeColors.cardBackground, borderColor: themeColors.border }}>
        <h6 className="mb-0 fw-bold" style={{ color: themeColors.textPrimary }}>
          <i className="bi bi-eye me-2 text-primary"></i>
          Vista Previa del Dashboard
        </h6>
      </Card.Header>
      <Card.Body className="p-3">
        <div className="mb-2">
          <small className="text-success fw-medium">
            <i className="bi bi-layout-wtf me-1"></i>
            Secciones del Dashboard ({visibleSections.length} visibles)
          </small>
        </div>

        <div className="row g-1" style={{ fontSize: '0.75rem' }}>
          {visibleSections.map((section, index) => renderMiniSection(section, index))}
        </div>

        {visibleSections.length === 0 && (
          <div className="text-center py-3" style={{ color: '#6c757d' }}>
            <i className="bi bi-eye-slash fs-4 d-block mb-1"></i>
            <small>No hay secciones visibles</small>
          </div>
        )}

        <div className="mt-3 pt-2" style={{ borderTop: `1px solid ${themeColors.border}` }}>
          <div className="d-flex justify-content-between align-items-center">
            <small style={{ color: themeColors.textPrimary }}>
              <strong>Total:</strong> {sections.length} secciones
            </small>
            <div className="d-flex gap-2">
              <Badge bg="success" style={{ fontSize: '0.6rem' }}>
                {visibleSections.length} visibles
              </Badge>
              <Badge bg="secondary" style={{ fontSize: '0.6rem' }}>
                {sections.length - visibleSections.length} ocultas
              </Badge>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

interface SectionOrderManagerProps {
  isDarkMode: boolean;
}

const SectionOrderManager: React.FC<SectionOrderManagerProps> = ({ isDarkMode }) => {
  const { 
    getSectionsInOrder, 
    reorderSections, 
    toggleSectionVisibility, 
    resetToDefaults 
  } = useDashboardSectionVisibility();

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null);

  const sections = getSectionsInOrder();

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDraggedOverIndex(index);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Solo limpiar si realmente salimos del área
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDraggedOverIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      reorderSections(draggedIndex, dropIndex);
    }
    
    setDraggedIndex(null);
    setDraggedOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDraggedOverIndex(null);
  };

  const getThemeColors = () => {
    if (isDarkMode) {
      return {
        background: '#212529',
        cardBackground: '#343a40',
        textPrimary: '#ffffff',
        textSecondary: '#adb5bd',
        border: '#495057'
      };
    }
    return {
      background: '#f8f9fa',
      cardBackground: '#ffffff',
      textPrimary: '#212529',
      textSecondary: '#495057',
      border: '#dee2e6'
    };
  };

  const themeColors = getThemeColors();

  const visibleCount = sections.filter(s => s.visible).length;
  const hiddenCount = sections.filter(s => !s.visible).length;

  return (
    <Card 
      className="mb-4 border-0 shadow-sm"
      style={{ backgroundColor: themeColors.cardBackground }}
    >
      <Card.Header 
        className="py-3"
        style={{ backgroundColor: themeColors.cardBackground, borderColor: themeColors.border }}
      >
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="fw-bold mb-0" style={{ color: themeColors.textPrimary }}>
              <i className="bi bi-arrows-move me-2 text-success"></i>
              Orden y Visibilidad del Dashboard
            </h5>
            <small style={{ color: themeColors.textSecondary }}>
              Arrastra las secciones para cambiar su orden en el dashboard
            </small>
          </div>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={resetToDefaults}
            title="Restaurar configuración por defecto"
          >
            <i className="bi bi-arrow-clockwise me-1"></i>
            Restaurar
          </Button>
        </div>
      </Card.Header>
      
      <Card.Body>
        <Row>
          {/* Panel de Control y Vista Previa */}
          <Col md={4}>
            {/* Estados */}
            <div className="mb-3">
              <h6 className="fw-bold mb-2" style={{ color: themeColors.textPrimary }}>
                <i className="bi bi-info-circle me-2 text-primary"></i>
                Estado de las Secciones
              </h6>
              
              <div className="d-flex justify-content-between align-items-center p-3 rounded" 
                   style={{ backgroundColor: isDarkMode ? '#495057' : '#f8f9fa' }}>
                <div className="text-center">
                  <div className="d-flex align-items-center justify-content-center">
                    <div 
                      style={{ 
                        width: '12px', 
                        height: '12px', 
                        backgroundColor: '#28a745', 
                        borderRadius: '50%',
                        marginRight: '8px' 
                      }}
                    ></div>
                    <strong style={{ color: themeColors.textPrimary }}>{visibleCount}</strong>
                  </div>
                  <small style={{ color: themeColors.textSecondary }}>Visibles</small>
                </div>
                
                <div className="text-center">
                  <div className="d-flex align-items-center justify-content-center">
                    <div 
                      style={{ 
                        width: '12px', 
                        height: '12px', 
                        backgroundColor: '#dc3545', 
                        borderRadius: '50%',
                        marginRight: '8px' 
                      }}
                    ></div>
                    <strong style={{ color: themeColors.textPrimary }}>{hiddenCount}</strong>
                  </div>
                  <small style={{ color: themeColors.textSecondary }}>Ocultas</small>
                </div>
                
                <div className="text-center">
                  <strong style={{ color: themeColors.textPrimary }}>{sections.length}</strong>
                  <br />
                  <small style={{ color: themeColors.textSecondary }}>Total</small>
                </div>
              </div>
            </div>

            {/* 🆕 NUEVA Vista Previa */}
            <DashboardPreview sections={sections} isDarkMode={isDarkMode} />

            {/* Instrucciones */}
            <div 
              className="p-3 rounded mt-3"
              style={{
                backgroundColor: isDarkMode ? 'rgba(13, 110, 253, 0.1)' : 'rgba(13, 110, 253, 0.1)',
                border: '1px solid rgba(13, 110, 253, 0.2)'
              }}
            >
              <h6 className="text-primary mb-2">
                <i className="bi bi-lightbulb me-1"></i>
                ¿Cómo usar?
              </h6>
              <ul className="mb-0 small" style={{ color: themeColors.textPrimary }}>
                <li className="mb-1">
                  <strong>Arrastra</strong> las secciones usando el ícono <i className="bi bi-grip-vertical"></i>
                </li>
                <li className="mb-1">
                  <strong>Activa/desactiva</strong> la visibilidad con el switch
                </li>
                <li>
                  Los cambios se <strong>aplican inmediatamente</strong>
                </li>
              </ul>
            </div>
          </Col>

          {/* Lista de Secciones Arrastrables */}
          <Col md={8}>
            <div className="pb-2 d-flex align-items-center justify-content-between">
              <h6 className="fw-bold mb-0" style={{ color: themeColors.textPrimary }}>
                <i className="bi bi-list-ol me-2 text-primary"></i>
                Secciones del Dashboard
              </h6>
            </div>

            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {sections.map((section, index) => (
                <div
                  key={section.id}
                  onDragEnter={(e) => handleDragEnter(e, index)}
                  onDragLeave={handleDragLeave}
                >
                  <DraggableSectionItem
                    section={section}
                    index={index}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onDragEnd={handleDragEnd}
                    isDraggedOver={draggedOverIndex === index}
                    isDragging={draggedIndex === index}
                    onToggleVisibility={toggleSectionVisibility}
                  />
                </div>
              ))}
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default SectionOrderManager;