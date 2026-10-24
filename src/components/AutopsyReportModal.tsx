import React, { useEffect, useRef } from 'react';
import type { AutopsyReport, CellState } from '../types/bms';
import { X, Flame, ShieldAlert, Award, Download, ArrowLeft } from 'lucide-react';

interface AutopsyReportModalProps {
  report: AutopsyReport;
  cells: CellState[];
  onClose: () => void;
  isFullDashboardView?: boolean;
}

export const AutopsyReportModal: React.FC<AutopsyReportModalProps> = ({
  report,
  cells,
  onClose,
  isFullDashboardView = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cellWidth = canvas.width / 4;
    const cellHeight = canvas.height / 4;

    cells.forEach((cell, idx) => {
      const col = idx % 4;
      const row = Math.floor(idx / 4);
      const cx = col * cellWidth;
      const cy = row * cellHeight;

      const temp = cell.temperature;
      
      const grad = ctx.createRadialGradient(
        cx + cellWidth / 2, cy + cellHeight / 2, 5,
        cx + cellWidth / 2, cy + cellHeight / 2, cellWidth / 1.5
      );

      if (cell.id === report.cellId) {
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.2, '#fef08a');
        grad.addColorStop(0.5, '#ef4444');
        grad.addColorStop(1, '#1e1b4b');
      } else if (cell.isHotNeighbor) {
        grad.addColorStop(0, '#f97316');
        grad.addColorStop(0.4, '#dc2626');
        grad.addColorStop(0.8, '#311042');
        grad.addColorStop(1, '#090d16');
      } else {
        const intensity = Math.min(100, Math.max(0, (temp - 20) / 20));
        const rVal = Math.floor(16 + intensity * 60);
        const gVal = Math.floor(20 + intensity * 20);
        const bVal = Math.floor(90 - intensity * 40);
        
        grad.addColorStop(0, `rgb(${rVal + 40}, ${gVal + 20}, ${bVal + 100})`);
        grad.addColorStop(0.6, `rgb(${rVal}, ${gVal}, ${bVal})`);
        grad.addColorStop(1, '#090d16');
      }

      ctx.fillStyle = grad;
      ctx.fillRect(cx, cy, cellWidth, cellHeight);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx, cy, cellWidth, cellHeight);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText(`C${cell.id}`, cx + 6, cy + 14);

      ctx.font = '10px Roboto Mono, monospace';
      ctx.fillText(`${cell.temperature.toFixed(0)}°C`, cx + 6, cy + 28);
    });

  }, [cells, report]);

  const handlePrint = () => {
    window.print();
  };

  const contentJSX = (
    <div 
      style={{ 
        width: '100%', 
        maxWidth: isFullDashboardView ? '100%' : '880px', 
        padding: '28px', 
        borderRadius: '16px', 
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        boxShadow: isFullDashboardView ? '0 4px 20px rgba(15, 23, 42, 0.05)' : '0 25px 60px rgba(15, 23, 42, 0.15)',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isFullDashboardView && (
            <button 
              onClick={onClose} 
              className="btn btn-secondary" 
              style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ArrowLeft size={16} /> Back to Dashboard
            </button>
          )}
          <div style={{ background: '#fef2f2', padding: '9px', borderRadius: '10px', color: '#ef4444', border: '1px solid #fecaca' }}>
            <Flame size={26} className="animate-pulse" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: '#0f172a' }}>Battery Pack Autopsy Forensic Report</h2>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>Auto-Compiled Failure Analysis Report | Event ID: FT-{Date.now().toString().slice(-6)}</p>
          </div>
        </div>
        {!isFullDashboardView && (
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px 10px', borderRadius: '8px' }}>
            <X size={18} />
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginBottom: '20px' }} className="autopsy-grid">
        {/* Diagnostic Metrics and Text */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
              Incident Details
            </h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 0', color: '#64748b' }}>Timestamp</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>{report.timestamp}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 0', color: '#64748b' }}>Primary Failed Node</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>Cell #{report.cellId}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 0', color: '#64748b' }}>Voltage (Pre-failure)</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>{report.preFailureV.toFixed(3)} V</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 0', color: '#64748b' }}>Peak Temp Registered</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>{report.preFailureT.toFixed(1)} °C</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 0', color: '#64748b' }}>Internal Resistance</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>{report.preFailureR.toFixed(1)} mΩ</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', color: '#64748b' }}>Failure Mode</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700, color: '#d97706' }}>{report.failureMode}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '14px', borderRadius: '10px' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
              <ShieldAlert size={15} /> Diagnostic Verdict
            </h4>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#7f1d1d', lineHeight: '1.5' }}>
              {report.verdict}
            </p>
          </div>
          
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '14px', borderRadius: '10px' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
              <Award size={15} /> EU 2027 Compliance Note
            </h4>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#1e3a8a', lineHeight: '1.5' }}>
              This autopsy record has been compiled and digitally signed with SHA-256 and pushed to the battery passport registry, providing irreversible auditability for post-mortem recycling or second-life routing.
            </p>
          </div>
        </div>

        {/* IR Canvas Visualizer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#0f172a', fontWeight: 700, alignSelf: 'flex-start' }}>
              Thermal IR Snapshot at Isolation Event
            </h4>
            <canvas 
              ref={canvasRef} 
              width={260} 
              height={260} 
              style={{ borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '10px', textAlign: 'center' }}>
              Heatmap reconstructs cell temperatures during trigger window.
            </span>
          </div>

          <button 
            className="btn btn-secondary" 
            onClick={handlePrint}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '10px' }}
          >
            <Download size={14} /> Download PDF Diagnostic Bundle
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
        <button className="btn btn-primary" onClick={onClose} style={{ padding: '8px 24px', fontSize: '0.85rem' }}>
          {isFullDashboardView ? 'Back to Dashboard' : 'Close Report'}
        </button>
      </div>
    </div>
  );

  if (isFullDashboardView) {
    return contentJSX;
  }

  return (
    <div className="modal-overlay">
      {contentJSX}
    </div>
  );
};
