import React, { useState, useEffect } from 'react';
import { 
  Globe, MapPin, Navigation, Compass, FileText, Info, 
  Barcode, Cpu 
} from 'lucide-react';

interface GPSTrackerProps {
  isSanitized: boolean;
  onOpenLiveMap?: () => void;
  onOpenBuyerLookup?: () => void;
  onOpenSensorModal?: () => void;
}

export const GPSTracker: React.FC<GPSTrackerProps> = ({ 
  isSanitized,
  onOpenLiveMap,
  onOpenBuyerLookup,
  onOpenSensorModal
}) => {
  const [showLifecycleHelp, setShowLifecycleHelp] = useState(false);
  const [speed, setSpeed] = useState(62);
  const [coords, setCoords] = useState({ lat: 53.4632, lng: 9.9821 });

  // Micro movement simulation on the dashboard widget
  useEffect(() => {
    const interval = setInterval(() => {
      setSpeed(Math.round(58 + Math.random() * 12));
      setCoords(prev => ({
        lat: Number((prev.lat + (Math.random() - 0.5) * 0.0006).toFixed(4)),
        lng: Number((prev.lng + (Math.random() - 0.5) * 0.0006).toFixed(4))
      }));
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      {/* Header */}
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
          <Globe className="text-blue-600 animate-spin-slow" size={18} /> GPS Route & Fleet Tracker
        </h3>
        <div style={{ display: 'flex', gap: '6px' }}>
          {onOpenLiveMap && (
            <button 
              onClick={onOpenLiveMap}
              className="btn btn-primary"
              style={{ fontSize: '0.72rem', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Navigation size={12} /> Google Map
            </button>
          )}
          <button 
            onClick={() => setShowLifecycleHelp(!showLifecycleHelp)} 
            className="btn btn-secondary" 
            style={{ fontSize: '0.7rem', padding: '5px 10px', borderRadius: '8px' }}
          >
            <Info size={12} /> {showLifecycleHelp ? 'Hide' : 'Info'}
          </button>
        </div>
      </div>

      {/* Main Grid: Visual Route Map + Telemetry Card */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '16px' }} className="autopsy-grid">
        
        {/* Dynamic Stylized Fleet Route Map - Clean Light Theme */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px', border: '1px solid #e2e8f0', position: 'relative', overflow: 'hidden' }}>
            <svg viewBox="0 0 320 130" style={{ display: 'block', width: '100%' }}>
              {/* Light Grid Lines */}
              <line x1="0" y1="32" x2="320" y2="32" stroke="#e2e8f0" strokeWidth="1" />
              <line x1="0" y1="65" x2="320" y2="65" stroke="#e2e8f0" strokeWidth="1" />
              <line x1="0" y1="98" x2="320" y2="98" stroke="#e2e8f0" strokeWidth="1" />
              <line x1="80" y1="0" x2="80" y2="130" stroke="#e2e8f0" strokeWidth="1" />
              <line x1="160" y1="0" x2="160" y2="130" stroke="#e2e8f0" strokeWidth="1" />
              <line x1="240" y1="0" x2="240" y2="130" stroke="#e2e8f0" strokeWidth="1" />

              {/* Transit Paths */}
              <path d="M 280,105 Q 210,65 140,75" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3,3" />
              <path d="M 140,75 Q 100,50 65,35" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeDasharray="4,4" />

              {/* Station 1: Factory Origin (Shenzhen) */}
              <circle cx="280" cy="105" r="4" fill="#10b981" />
              <text x="215" y="118" fontSize="7" fill="#64748b" fontWeight="600">Shenzhen (Cells)</text>

              {/* Station 2: Integration Plant (Munich) */}
              <circle cx="140" cy="75" r="4.5" fill="#f59e0b" />
              <text x="148" y="78" fontSize="7.5" fill="#475569" fontWeight="700">Munich Plant</text>

              {/* Station 3: Active Fleet Position (Near Hamburg) */}
              {!isSanitized ? (
                <>
                  <circle cx="85" cy="48" r="9" fill="none" stroke="#2563eb" strokeWidth="1.2" opacity="0.6" style={{ transformOrigin: '85px 48px', animation: 'pulse-glow 1s infinite alternate' }} />
                  <circle cx="85" cy="48" r="4.5" fill="#2563eb" />
                  <text x="96" y="52" fontSize="7.5" fill="#2563eb" fontWeight="bold">Carrier EV-09</text>

                  <circle cx="65" cy="35" r="5" fill="#ef4444" />
                  <text x="28" y="24" fontSize="8" fill="#dc2626" fontWeight="bold">Hamburg Hub B-4 (Dest)</text>
                </>
              ) : (
                <>
                  <circle cx="65" cy="35" r="4" fill="#94a3b8" />
                  <text x="28" y="24" fontSize="7.5" fill="#94a3b8" fontWeight="600">[GPS SANITIZED]</text>
                </>
              )}
            </svg>
          </div>

          {/* Quick Action Navigation Bar */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {onOpenBuyerLookup && (
              <button 
                onClick={onOpenBuyerLookup}
                className="btn btn-secondary" 
                style={{ flexGrow: 1, fontSize: '0.74rem', padding: '7px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
              >
                <Barcode size={13} className="text-blue-600" /> Buyer & Bill Finder
              </button>
            )}
            {onOpenSensorModal && (
              <button 
                onClick={onOpenSensorModal}
                className="btn btn-secondary" 
                style={{ flexGrow: 1, fontSize: '0.74rem', padding: '7px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
              >
                <Cpu size={13} className="text-purple-600" /> Sensor Detection
              </button>
            )}
          </div>
        </div>

        {/* Telemetry Log Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          {/* Coordinates Block */}
          <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
              Current Coordinates
            </span>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <MapPin size={13} className="text-red-500" />
              {isSanitized ? '[ENCRYPTED / ANONYMOUS]' : `${coords.lat}° N, ${coords.lng}° E`}
            </div>
            <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
              {isSanitized ? 'Location redacted for privacy handoff' : 'En route to Hamburg Logistics Hub B-4'}
            </span>
          </div>

          {/* Speed & Zone Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, display: 'block' }}>Fleet Speed</span>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', color: '#0f172a' }}>
                <Navigation size={13} className="text-blue-600" /> {isSanitized ? '0 km/h' : `${speed} km/h`}
              </div>
            </div>
            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, display: 'block' }}>Carrier Route</span>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', color: '#0f172a' }}>
                <Compass size={13} className="text-purple-600" /> {isSanitized ? 'EU-North' : 'A7 Highway'}
              </div>
            </div>
          </div>

          {/* Linked Buyer & Bill Snapshot */}
          <div style={{ background: '#eff6ff', padding: '9px 12px', borderRadius: '8px', border: '1px solid #bfdbfe', fontSize: '0.75rem' }}>
            <div style={{ color: '#1d4ed8', fontWeight: 700 }}>Purchaser: Hamburg Green Logistics SE</div>
            <div style={{ color: '#475569', marginTop: '2px' }}>Bill #INV-2024-8849 | 16S LFP 51.2V 50Ah</div>
          </div>
        </div>
      </div>

      {/* Expanded Lifecycle & Help View */}
      {showLifecycleHelp && (
        <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.75rem', color: '#475569', lineHeight: '1.4' }}>
          <strong style={{ color: '#0f172a' }}>EU Chain-of-Custody & Privacy Architecture:</strong>
          <p style={{ margin: '4px 0 0 0' }}>
            CellSalus integrates global GPS transit tracking with EU Digital Passport cryptographic certificates. Real-time carrier speed and GNSS waypoints can be viewed in the Live Google Map view with custom API key support.
          </p>
        </div>
      )}
    </div>
  );
};
