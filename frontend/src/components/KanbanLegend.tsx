// components/KanbanLegend.tsx
import React from 'react';

const KanbanLegend: React.FC = () => {
  const items = [
    { label: 'Proyecto', color: '#bb8fce', textColor: 'white' },
    { label: 'Proyecto Completado', color: '#7d3c98', textColor: 'white' },
    { label: 'Tarea', color: '#abebc6', textColor: 'black' },
    { label: 'Tarea Completada', color: '#2ecc71', textColor: 'white' },
    { label: 'Subtarea', color: '#f9e79f', textColor: 'black' },
    { label: 'Subtarea Completada', color: '#f1c40f', textColor: 'black' },
  ];

  return (
    <div className="d-flex flex-wrap gap-2 bg-light p-2 rounded mb-3">
      {items.map((item, index) => (
        <div 
          key={index} 
          className="d-flex align-items-center"
          style={{ marginRight: '10px' }}
        >
          <div 
            style={{
              width: '16px',
              height: '16px',
              backgroundColor: item.color,
              marginRight: '5px',
              borderRadius: '3px'
            }}
          ></div>
          <span style={{ fontSize: '12px' }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default KanbanLegend;