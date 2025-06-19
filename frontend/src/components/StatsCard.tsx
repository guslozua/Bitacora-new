// src/components/StatsCard.tsx
import React from 'react';
import { Card } from 'react-bootstrap';

interface StatsCardProps {
  title: string;
  value: number | null;
  icon: string;
  color: 'primary' | 'warning' | 'success' | 'danger' | 'info';
  loading?: boolean;
  onClick?: () => void;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  color,
  loading = false,
  onClick,
  subtitle,
  trend
}) => {
  const colorClasses = {
    primary: 'text-primary',
    warning: 'text-warning',
    success: 'text-success',
    danger: 'text-danger',
    info: 'text-info'
  };

  const bgOpacityClasses = {
    primary: 'bg-primary bg-opacity-10',
    warning: 'bg-warning bg-opacity-10',
    success: 'bg-success bg-opacity-10',
    danger: 'bg-danger bg-opacity-10',
    info: 'bg-info bg-opacity-10'
  };

  return (
    <Card 
      className={`border-0 shadow-sm h-100 themed-card ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      style={{ 
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s ease-in-out',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center">
          <div className="flex-grow-1">
            <h6 className="text-muted mb-1">{title}</h6>
            <div className="d-flex align-items-baseline gap-2">
              <h2 className="fw-bold mb-0">
                {loading ? (
                  <div className="placeholder-glow">
                    <span className="placeholder col-4"></span>
                  </div>
                ) : (
                  <span style={{ fontFamily: 'monospace' }}>
                    {value?.toLocaleString() ?? 0}
                  </span>
                )}
              </h2>
              {trend && !loading && (
                <small className={`text-${trend.isPositive ? 'success' : 'danger'}`}>
                  <i className={`bi bi-arrow-${trend.isPositive ? 'up' : 'down'} me-1`}></i>
                  {Math.abs(trend.value)}%
                </small>
              )}
            </div>
            {subtitle && (
              <small className="text-muted">{subtitle}</small>
            )}
          </div>
          <div 
            className={`${bgOpacityClasses[color]} rounded-circle d-flex align-items-center justify-content-center`}
            style={{
              width: '3.5rem',
              height: '3.5rem',
              minWidth: '3.5rem'
            }}
          >
            {loading ? (
              <div className="placeholder-glow">
                <span className="placeholder rounded-circle" style={{width: '1.5rem', height: '1.5rem'}}></span>
              </div>
            ) : (
              <i className={`${icon} fs-3 ${colorClasses[color]}`} />
            )}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default StatsCard;