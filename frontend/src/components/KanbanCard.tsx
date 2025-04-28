// components/KanbanCard.tsx
import React, { useState } from 'react';
import UserAvatars from './UserAvatars';

interface KanbanCardProps {
  id: string;
  title: string;
  description: string;
  type: 'project' | 'task' | 'subtask';
  status: string;
  priority?: string;
  startDate?: string;
  endDate?: string;
  entityId: string;
  parentId?: string;
  children?: React.ReactNode;
  hasChildren?: boolean;
}

const KanbanCard: React.FC<KanbanCardProps> = ({
  id,
  title,
  description,
  type,
  status,
  priority,
  startDate,
  endDate,
  entityId,
  parentId,
  children,
  hasChildren
}) => {
  const [expanded, setExpanded] = useState(false);

  // Obtener colores según tipo y estado
  const getBackgroundColor = () => {
    if (type === 'project') {
      return status === 'completado' ? '#7d3c98' : '#bb8fce';
    } else if (type === 'task') {
      return status === 'completado' ? '#2ecc71' : '#abebc6';
    } else {
      return status === 'completado' ? '#f1c40f' : '#f9e79f';
    }
  };

  // Obtener color según prioridad
  const getPriorityColor = () => {
    switch (priority?.toLowerCase()) {
      case 'alta':
        return '#e74c3c';
      case 'media':
        return '#f39c12';
      case 'baja':
        return '#3498db';
      default:
        return '#95a5a6';
    }
  };

  // Formatear fecha
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };

  return (
    <div 
      className="kanban-card" 
      style={{ 
        backgroundColor: getBackgroundColor(),
        padding: '10px',
        borderRadius: '6px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        marginBottom: '10px',
        color: type === 'project' ? '#ffffff' : '#333333'
      }}
      data-task-id={id}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '5px'
      }}>
        <div style={{ 
          fontSize: '14px', 
          fontWeight: 'bold', 
          marginBottom: '5px',
          display: 'flex',
          alignItems: 'center' 
        }}>
          {title}
          {hasChildren && (
            <span 
              className="task-expander"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? '▼' : '▶'}
            </span>
          )}
        </div>
        <div>
          <span 
            style={{ 
              backgroundColor: getTypeColor(type),
              color: 'white',
              padding: '2px 6px',
              borderRadius: '3px',
              fontSize: '10px',
              marginRight: '4px'
            }}
          >
            {getTypeLabel(type)}
          </span>
          {priority && (
            <span 
              style={{ 
                backgroundColor: getPriorityColor(),
                color: 'white',
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '10px'
              }}
            >
              {priority}
            </span>
          )}
        </div>
      </div>
      
      {description && (
        <div style={{ fontSize: '12px', marginBottom: '5px' }}>
          {description.length > 100 ? `${description.substring(0, 100)}...` : description}
        </div>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
        <div>
          {(startDate || endDate) && (
            <div style={{ fontSize: '11px' }}>
              {startDate && <span>Inicio: {formatDate(startDate)}</span>}
              {startDate && endDate && <span> | </span>}
              {endDate && <span>Fin: {formatDate(endDate)}</span>}
            </div>
          )}
        </div>
        <UserAvatars 
          itemId={entityId} 
          itemType={type} 
          maxDisplay={2} 
          size="sm" 
        />
      </div>
      
      {expanded && children && (
        <div className="task-children">
          {children}
        </div>
      )}
    </div>
  );
};

// Función auxiliar para obtener color según tipo
const getTypeColor = (type: string): string => {
  switch (type) {
    case 'project':
      return '#8e44ad';
    case 'task':
      return '#27ae60';
    case 'subtask':
      return '#f1c40f';
    default:
      return '#95a5a6';
  }
};

// Función auxiliar para obtener etiqueta según tipo
const getTypeLabel = (type: string): string => {
  switch (type) {
    case 'project':
      return 'Proyecto';
    case 'task':
      return 'Tarea';
    case 'subtask':
      return 'Subtarea';
    default:
      return type;
  }
};

export default KanbanCard;