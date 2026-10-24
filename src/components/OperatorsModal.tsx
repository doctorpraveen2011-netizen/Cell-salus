import React from 'react';
import { X, Users, UserCheck, ShieldAlert, ArrowLeft } from 'lucide-react';

interface OperatorsModalProps {
  onClose: () => void;
  isFullDashboardView?: boolean;
}

export const OperatorsModal: React.FC<OperatorsModalProps> = ({ onClose, isFullDashboardView = false }) => {
  const operators = [
    {
      name: "Praveen (Lead Operator)",
      role: "System Integration Engineer",
      clearance: "Level 4 (Firmware Override)",
      location: "Hamburg Hub B-4",
      status: "Active Session",
      badgeColor: "badge-primary"
    },
    {
      name: "Dr. Marcus Brandt",
      role: "Chief Safety Architect",
      clearance: "Level 5 (Root Safety Latch)",
      location: "Munich Integration Center",
      status: "Offline",
      badgeColor: "badge-success"
    },
    {
      name: "Auto-Compliance Agent",
      role: "EU 2027 Regulatory Monitor",
      clearance: "Level 5 (Auto GDPR Purge)",
      location: "Local BMS Controller",
      status: "Active (Inference Loop)",
      badgeColor: "badge-info"
    }
  ];

  const contentJSX = (
    <div 
      style={{ 
        width: '100%', 
        maxWidth: isFullDashboardView ? '100%' : '600px', 
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
            <Users size={24} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Authorized Operator Directory</h2>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Clearance registers for local hardware overrides and GDPR purge cycles</p>
          </div>
        </div>
        {!isFullDashboardView && (
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px 10px', borderRadius: '8px' }}>
            <X size={18} />
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        {operators.map((op, idx) => (
          <div key={idx} style={{ padding: '14px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <UserCheck size={16} className="text-blue-600" /> {op.name}
              </div>
              <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginTop: '3px' }}>
                {op.role} | {op.location}
              </span>
            </div>
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
              <span className={`badge ${op.badgeColor}`} style={{ fontSize: '0.68rem', padding: '3px 8px' }}>{op.clearance}</span>
              <span style={{ fontSize: '0.72rem', color: op.status.includes('Active') ? '#059669' : '#64748b', fontWeight: 600 }}>{op.status}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fef2f2', padding: '12px 16px', borderRadius: '10px', border: '1px solid #fecaca', display: 'flex', gap: '10px', alignItems: 'center', fontSize: '0.75rem', color: '#991b1b', lineHeight: '1.4' }}>
        <ShieldAlert size={18} style={{ flexShrink: 0 }} />
        <span><strong>Security Protocol:</strong> All hardware bypass and relay isolation triggers require Level 4+ operator credentials, which are crypto-signed and written to the local blockchain audit register.</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
        <button className="btn btn-secondary" onClick={onClose} style={{ fontSize: '0.85rem' }}>
          {isFullDashboardView ? 'Back to Dashboard' : 'Close Directory'}
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
