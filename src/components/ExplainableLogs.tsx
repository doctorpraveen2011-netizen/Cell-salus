import React from 'react';
import type { DecisionLogEntry } from '../types/bms';
import { ShieldAlert, CheckCircle, Info, Zap, Sparkles } from 'lucide-react';

interface ExplainableLogsProps {
  logs: DecisionLogEntry[];
}

export const ExplainableLogs: React.FC<ExplainableLogsProps> = ({ logs }) => {
  const getIcon = (type: DecisionLogEntry['eventType']) => {
    switch (type) {
      case 'ISOLATION':
        return <ShieldAlert className="log-icon text-red-500" size={18} />;
      case 'RECONNECT':
        return <CheckCircle className="log-icon text-green-500" size={18} />;
      case 'REBALANCE':
        return <Zap className="log-icon text-yellow-500 animate-pulse" size={18} />;
      case 'WARNING':
        return <Info className="log-icon text-orange-500" size={18} />;
      case 'CRITICAL':
        return <ShieldAlert className="log-icon text-red-600 animate-bounce" size={18} />;
      default:
        return <Sparkles className="log-icon text-blue-400" size={18} />;
    }
  };

  const getBadgeClass = (type: DecisionLogEntry['eventType']) => {
    switch (type) {
      case 'ISOLATION':
        return 'badge-danger';
      case 'RECONNECT':
        return 'badge-success';
      case 'REBALANCE':
        return 'badge-warning';
      case 'WARNING':
        return 'badge-info';
      case 'CRITICAL':
        return 'badge-critical';
      default:
        return 'badge-primary';
    }
  };

  return (
    <div className="card glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles className="text-purple-400" size={18} /> Explainable Decision Log (XAI)
        </h3>
        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '12px' }}>
          SHAP Engine Active
        </span>
      </div>

      <div className="log-container" style={{ flexGrow: 1, overflowY: 'auto', maxHeight: '380px', paddingRight: '5px' }}>
        {logs.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '150px', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
            <p>No decision logs recorded yet.</p>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.2)' }}>Monitoring cell telemetry...</span>
          </div>
        ) : (
          [...logs].reverse().map((log) => (
            <div key={log.id} className="log-item" style={{ borderLeft: '3px solid', borderColor: log.eventType === 'ISOLATION' ? '#ef4444' : log.eventType === 'REBALANCE' ? '#fbbf24' : '#3b82f6', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '0 8px 8px 0', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {getIcon(log.eventType)}
                  <span className={`badge ${getBadgeClass(log.eventType)}`}>
                    {log.eventType}
                  </span>
                  {log.cellId > 0 && <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Cell {log.cellId}</span>}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                  {log.timestamp}
                </span>
              </div>
              
              <p style={{ margin: '0 0 10px 0', fontSize: '0.88rem', lineHeight: '1.4', color: '#e2e8f0' }}>
                {log.message}
              </p>

              {log.shapValues && (
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '4px', fontSize: '0.75rem' }}>
                  <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '5px' }}>
                    AI Feature Attribution (SHAP Importance)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {/* Temperature Attribution */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '90px', color: '#f87171' }}>Temp Spike:</span>
                      <div style={{ flexGrow: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${log.shapValues.temperature}%`, height: '100%', background: '#ef4444', borderRadius: '3px' }}></div>
                      </div>
                      <span style={{ width: '32px', textAlign: 'right' }}>{Math.round(log.shapValues.temperature)}%</span>
                    </div>

                    {/* Resistance Attribution */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '90px', color: '#fb923c' }}>Resistance Δ:</span>
                      <div style={{ flexGrow: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${log.shapValues.resistance}%`, height: '100%', background: '#f97316', borderRadius: '3px' }}></div>
                      </div>
                      <span style={{ width: '32px', textAlign: 'right' }}>{Math.round(log.shapValues.resistance)}%</span>
                    </div>

                    {/* SoH Degradation Attribution */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '90px', color: '#60a5fa' }}>Capacity Loss:</span>
                      <div style={{ flexGrow: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${log.shapValues.soh}%`, height: '100%', background: '#3b82f6', borderRadius: '3px' }}></div>
                      </div>
                      <span style={{ width: '32px', textAlign: 'right' }}>{Math.round(log.shapValues.soh)}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
