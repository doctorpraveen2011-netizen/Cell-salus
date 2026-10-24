import React, { useState } from 'react';
import { X, Settings, ShieldCheck, ToggleLeft, ToggleRight, ArrowLeft } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
  isFullDashboardView?: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, isFullDashboardView = false }) => {
  const [euMode, setEuMode] = useState(true);
  const [relayPulse, setRelayPulse] = useState(100);
  const [inferenceRate, setInferenceRate] = useState(10);

  const contentJSX = (
    <div 
      style={{ 
        width: '100%', 
        maxWidth: isFullDashboardView ? '100%' : '560px', 
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
          <div style={{ background: '#eff6ff', padding: '9px', borderRadius: '10px', color: '#2563eb', border: '1px solid #bfdbfe' }}>
            <Settings size={24} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>System Configuration Settings</h2>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Configure AI inference bounds and hardware relay triggers</p>
          </div>
        </div>
        {!isFullDashboardView && (
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px 10px', borderRadius: '8px' }}>
            <X size={18} />
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
        {/* EU Mode Toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>EU 2027 Compliance Mode</div>
            <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginTop: '2px' }}>Strictly enforces GDPR sanitization on reuse handoffs</span>
          </div>
          <button 
            onClick={() => setEuMode(!euMode)} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: euMode ? '#10b981' : '#cbd5e1' }}
          >
            {euMode ? <ToggleRight size={38} /> : <ToggleLeft size={38} />}
          </button>
        </div>

        {/* L298N Relay Pulse */}
        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>L298N Relay Pulse Time</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#2563eb' }}>{relayPulse} ms</span>
          </div>
          <input 
            type="range" 
            min="50" 
            max="500" 
            step="50" 
            value={relayPulse} 
            onChange={(e) => setRelayPulse(parseInt(e.target.value))} 
            style={{ width: '100%', cursor: 'pointer' }} 
          />
          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '4px' }}>Pulse duration sent to GPIO pins to trigger latching cell bypass shunts</span>
        </div>

        {/* Inference Rate */}
        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>SHAP Inference Rate</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#7c3aed' }}>{inferenceRate} Hz</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="20" 
            value={inferenceRate} 
            onChange={(e) => setInferenceRate(parseInt(e.target.value))} 
            style={{ width: '100%', cursor: 'pointer' }} 
          />
          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '4px' }}>Frequency of local SHAP/XAI feature importance evaluations</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
        <button className="btn btn-primary" onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={16} /> {isFullDashboardView ? 'Save & Return' : 'Save Configuration'}
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
