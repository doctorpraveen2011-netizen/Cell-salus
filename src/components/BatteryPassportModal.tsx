import React from 'react';
import type { BatteryPassport } from '../types/bms';
import { X, ShieldCheck, RefreshCw, Landmark, ArrowLeft } from 'lucide-react';

interface BatteryPassportModalProps {
  passport: BatteryPassport;
  onClose: () => void;
  onSanitize: () => void;
  isFullDashboardView?: boolean;
}

export const BatteryPassportModal: React.FC<BatteryPassportModalProps> = ({
  passport,
  onClose,
  onSanitize,
  isFullDashboardView = false
}) => {
  const renderMockQRCode = (text: string) => {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    const size = 15;
    const dots = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const isFinder = 
          (r < 4 && c < 4) || 
          (r < 4 && c >= size - 4) || 
          (r >= size - 4 && c < 4);
        
        if (isFinder) {
          const outerRing = (r === 0 || r === 3 || c === 0 || c === 3 || r === size - 1 || r === size - 4 || c === size - 1 || c === size - 4);
          const innerCore = (r === 1 && c === 1) || (r === 1 && c === size - 2) || (r === size - 2 && c === 1);
          if (outerRing || innerCore) {
            dots.push({ r, c });
          }
        } else {
          const val = Math.abs(Math.sin(hash + r * 17 + c * 23));
          if (val > 0.45) {
            dots.push({ r, c });
          }
        }
      }
    }

    return (
      <svg width="110" height="110" viewBox="0 0 15 15" style={{ background: '#ffffff', padding: '6px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
        {dots.map((dot, idx) => (
          <rect key={idx} x={dot.c} y={dot.r} width="1.05" height="1.05" fill="#0f172a" />
        ))}
      </svg>
    );
  };

  const contentJSX = (
    <div 
      style={{ 
        width: '100%', 
        maxWidth: isFullDashboardView ? '100%' : '760px', 
        padding: '28px', 
        borderRadius: '16px', 
        position: 'relative',
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
          <div style={{ background: '#eff6ff', padding: '9px', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
            <ShieldCheck className="text-blue-600" size={26} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: '#0f172a' }}>EU Digital Battery Passport</h2>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>Compliance Std: Regulation (EU) 2027/918</p>
          </div>
        </div>
        {!isFullDashboardView && (
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px 10px', borderRadius: '8px' }}>
            <X size={18} />
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {/* QR and Blockchain section */}
        <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          {renderMockQRCode(`https://eu-passport.bms.ai/passport/${passport.id}`)}
          <span style={{ fontSize: '0.75rem', marginTop: '10px', fontFamily: 'monospace', color: '#64748b', fontWeight: 600 }}>
            UID: {passport.id.substring(0, 16)}...
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '12px', fontSize: '0.72rem', color: '#047857', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '4px 10px', borderRadius: '10px', fontWeight: 600 }}>
            <Landmark size={13} /> Blockchain Anchored
          </div>
        </div>

        {/* General Metadata section */}
        <div style={{ flex: '2 2 320px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
            <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>Manufacturer</span>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>{passport.manufacturer}</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>Chemistry</span>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>{passport.chemistry}</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>Manufacture Date</span>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>{passport.manufactureDate}</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>Nominal Capacity</span>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>{passport.initialCapacityAh} Ah</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>Active Cycles</span>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>{passport.cycleCount}</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>Current Pack SoH</span>
              <div style={{ fontWeight: 700, color: passport.currentSoH > 80 ? '#059669' : passport.currentSoH > 70 ? '#d97706' : '#dc2626' }}>{passport.currentSoH}%</div>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', marginBottom: '4px', fontWeight: 600 }}>Second-Life Grading Recommendation</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-success" style={{ fontSize: '0.85rem', padding: '4px 10px' }}>
                {passport.grade === 'A' ? '♻️ Grade A: Reusable (ESS Static Storage)' : passport.grade === 'B' ? '🔧 Grade B: Repairable / Refurbish' : '☠️ Grade C: Recycle-only'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Ownership Credentials</span>
          {passport.isSanitized ? (
            <span style={{ color: '#059669', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, background: '#ecfdf5', padding: '2px 8px', borderRadius: '6px' }}>
              ✓ SANITIZED FOR RESALE
            </span>
          ) : (
            <span style={{ color: '#d97706', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, background: '#fffbeb', padding: '2px 8px', borderRadius: '6px' }}>
              ⚠️ ACTIVE ASSIGNMENT
            </span>
          )}
        </div>
        <div style={{ fontSize: '0.82rem', color: passport.isSanitized ? '#64748b' : '#1e293b', marginBottom: '10px', lineHeight: '1.5' }}>
          <strong>Operator/Owner:</strong> {passport.isSanitized ? '[ENCRYPTED & SANITIZED]' : passport.ownerName} <br />
          <strong>Last Registration Facility:</strong> {passport.isSanitized ? '[REDACTED]' : passport.facilityLocation} <br />
          <strong>Owner GPS Coordinates:</strong> {passport.isSanitized ? '[REDACTED / ANONYMIZED]' : '53.5511° N, 9.9937° E'}
        </div>

        <hr style={{ border: '0', borderTop: '1px solid #e2e8f0', margin: '8px 0' }} />

        <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: '1.4' }}>
          <strong>Registry Explainer (EU 2027/918):</strong> Operational data logs (cycles, temperatures, internal resistance) must be permanently retained for safety and second-life routing. To comply with GDPR, the previous operator's private details are irreversibly sanitized prior to resale.
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        {!passport.isSanitized ? (
          <button className="btn btn-warning" onClick={onSanitize} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
            <RefreshCw size={14} className="animate-spin-slow" /> Sanitize Credentials for Reuse
          </button>
        ) : (
          <button className="btn btn-secondary" disabled style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#059669', opacity: 0.9 }}>
            ✓ Credentials Sanitized
          </button>
        )}
        <button className="btn btn-primary" onClick={onClose} style={{ fontSize: '0.85rem' }}>
          {isFullDashboardView ? 'Back to Dashboard' : 'Close Passport'}
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
