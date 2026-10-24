import React from 'react';
import type { CellState } from '../types/bms';
import { Shield, ShieldX, Zap } from 'lucide-react';

interface GridTwinProps {
  cells: CellState[];
  selectedCellId: number;
  onSelectCell: (id: number) => void;
}

export const GridTwin: React.FC<GridTwinProps> = ({
  cells,
  selectedCellId,
  onSelectCell,
}) => {
  const getCellColor = (cell: CellState) => {
    if (cell.isIsolated) return 'rgba(74, 85, 104, 0.4)'; // Dark Grey
    if (cell.temperature > 50) return 'rgba(239, 68, 68, 0.15)'; // Crimson Alert
    if (cell.temperature > 40 || cell.voltage < 3.0 || cell.voltage > 4.2) return 'rgba(245, 158, 11, 0.15)'; // Warning Orange
    return 'rgba(16, 185, 129, 0.08)'; // Healthy Green
  };

  const getBorderColor = (cell: CellState) => {
    if (cell.id === selectedCellId) return '#3b82f6'; // Selected Blue
    if (cell.isIsolated) return '#4a5568';
    if (cell.temperature > 50) return '#ef4444';
    if (cell.temperature > 40 || cell.voltage < 3.0 || cell.voltage > 4.2) return '#f59e0b';
    return '#10b981';
  };

  const getGlowStyle = (cell: CellState) => {
    if (cell.id === selectedCellId) return `0 0 15px rgba(59, 130, 246, 0.6)`;
    if (cell.isIsolated) return 'none';
    if (cell.temperature > 50) return `0 0 15px rgba(239, 68, 68, 0.5)`;
    if (cell.temperature > 40 || cell.voltage < 3.0 || cell.voltage > 4.2) return `0 0 10px rgba(245, 158, 11, 0.4)`;
    return `0 0 8px rgba(16, 185, 129, 0.2)`;
  };

  // Helper to determine thermal propagation vector to neighbors
  const getPropagationVectors = (cell: CellState) => {
    if (cell.temperature <= 45 || cell.isIsolated) return [];
    
    const idx = cell.id - 1;
    const row = Math.floor(idx / 4);
    const col = idx % 4;
    const targets = [];

    // Left neighbor
    if (col > 0 && !cells[idx - 1].isIsolated && cells[idx - 1].temperature < cell.temperature) {
      targets.push('left');
    }
    // Right neighbor
    if (col < 3 && !cells[idx + 1].isIsolated && cells[idx + 1].temperature < cell.temperature) {
      targets.push('right');
    }
    // Top neighbor
    if (row > 0 && !cells[idx - 4].isIsolated && cells[idx - 4].temperature < cell.temperature) {
      targets.push('top');
    }
    // Bottom neighbor
    if (row < 3 && !cells[idx + 4].isIsolated && cells[idx + 4].temperature < cell.temperature) {
      targets.push('bottom');
    }

    return targets;
  };

  return (
    <div className="card glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={18} className="text-yellow-400" /> Digital Twin Pack Grid
        </h3>
        <div style={{ display: 'flex', gap: '10px', fontSize: '0.75rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></span> Safe
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', background: '#f59e0b', borderRadius: '50%' }}></span> Warn
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%' }}></span> Crit
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', background: '#4a5568', borderRadius: '50%' }}></span> Isolated
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', flexGrow: 1, padding: '5px' }}>
        {cells.map((cell) => {
          const vectors = getPropagationVectors(cell);
          
          return (
            <div
              key={cell.id}
              onClick={() => onSelectCell(cell.id)}
              style={{
                background: getCellColor(cell),
                border: `1.5px solid ${getBorderColor(cell)}`,
                borderRadius: '12px',
                padding: '12px',
                cursor: 'pointer',
                boxShadow: getGlowStyle(cell),
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '85px',
              }}
              className="cell-grid-item"
            >
              {/* Propagation Arrows Overlay */}
              {vectors.map((vec) => (
                <div
                  key={vec}
                  className={`propagation-indicator prop-${vec}`}
                  style={{
                    position: 'absolute',
                    zIndex: 5,
                    width: vec === 'left' || vec === 'right' ? '18px' : '4px',
                    height: vec === 'top' || vec === 'bottom' ? '18px' : '4px',
                    background: '#ef4444',
                    boxShadow: '0 0 6px #ef4444',
                    borderRadius: '2px',
                    opacity: 0.8,
                    animation: 'pulse-glow 0.8s infinite alternate',
                    ...(vec === 'left' && { left: '-10px', top: 'calc(50% - 2px)' }),
                    ...(vec === 'right' && { right: '-10px', top: 'calc(50% - 2px)' }),
                    ...(vec === 'top' && { top: '-10px', left: 'calc(50% - 2px)' }),
                    ...(vec === 'bottom' && { bottom: '-10px', left: 'calc(50% - 2px)' }),
                  }}
                />
              ))}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>
                  CELL {cell.id}
                </span>
                <span>
                  {cell.isIsolated ? (
                    <ShieldX size={14} className="text-gray-400" />
                  ) : cell.isRebalanced ? (
                    <span title="Load Throttled (Active Balancing)">
                      <Shield size={14} className="text-yellow-400 animate-pulse" />
                    </span>
                  ) : (
                    <Shield size={14} className="text-green-400" />
                  )}
                </span>
              </div>

              <div style={{ margin: '8px 0', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.02em', color: cell.isIsolated ? 'rgba(255,255,255,0.3)' : 'white' }}>
                  {cell.isIsolated ? 'Bypassed' : `${cell.voltage.toFixed(3)}V`}
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 500, color: cell.temperature > 50 ? '#f87171' : cell.temperature > 40 ? '#fb923c' : 'rgba(255,255,255,0.6)' }}>
                  {cell.temperature.toFixed(1)}°C
                </div>
              </div>

              {/* Progress bar state of health */}
              <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${cell.soh}%`,
                    height: '100%',
                    background: cell.isIsolated ? '#4a5568' : cell.soh > 80 ? '#10b981' : cell.soh > 70 ? '#fbbf24' : '#ef4444',
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
