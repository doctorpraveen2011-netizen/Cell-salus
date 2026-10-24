import { useState, useEffect } from 'react';
import type { CellState, DecisionLogEntry, BatteryPassport, AutopsyReport } from './types/bms';
import { GridTwin } from './components/GridTwin';
import { CellDetailCard } from './components/CellDetailCard';
import { ExplainableLogs } from './components/ExplainableLogs';
import { VoiceChatAssistant } from './components/VoiceChatAssistant';
import { BatteryPassportModal } from './components/BatteryPassportModal';
import { AutopsyReportModal } from './components/AutopsyReportModal';
import { AIAgentExecutive } from './components/AIAgentExecutive';
import { GPSTracker } from './components/GPSTracker';
import { SettingsModal } from './components/SettingsModal';
import { OperatorsModal } from './components/OperatorsModal';
import { BuyerLookupModal } from './components/BuyerLookupModal';
import { LiveTrackingMapModal } from './components/LiveTrackingMapModal';
import { SensorDetectionModal } from './components/SensorDetectionModal';
import { 
  Flame, ShieldAlert, Layers, RotateCcw, 
  Search, Bell, Activity, HelpCircle, UserCheck,
  Settings, Users, Barcode, Navigation, Cpu
} from 'lucide-react';

const NUM_CELLS = 16;
const INITIAL_CURRENT = 5.0; // Amps

export default function App() {
  // Telemetry States
  const [cells, setCells] = useState<CellState[]>([]);
  const [selectedCellId, setSelectedCellId] = useState<number>(3);
  const [packCurrent, setPackCurrent] = useState<number>(INITIAL_CURRENT);
  const [logs, setLogs] = useState<DecisionLogEntry[]>([]);
  const [cycleCount] = useState<number>(584);
  const [simMode, setSimMode] = useState<'IDLE' | 'RUNAWAY' | 'CONTAINED' | 'CRITICAL_FAILURE'>('IDLE');

  // View State for Full Dashboard Navigation
  type ActiveFeatureView = 'DASHBOARD' | 'BUYER_LOOKUP' | 'LIVE_MAP' | 'SENSOR_DIAGNOSTICS' | 'EU_REGISTRY' | 'AUTOPSY' | 'SETTINGS' | 'OPERATORS';
  const [activeView, setActiveView] = useState<ActiveFeatureView>('DASHBOARD');

  // Modals (for optional popup overrides)
  const [showPassport, setShowPassport] = useState<boolean>(false);
  const [showAutopsy, setShowAutopsy] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showOperators, setShowOperators] = useState<boolean>(false);
  const [showBuyerLookup, setShowBuyerLookup] = useState<boolean>(false);
  const [showLiveMap, setShowLiveMap] = useState<boolean>(false);
  const [showSensorModal, setShowSensorModal] = useState<boolean>(false);
  const [autopsyData, setAutopsyData] = useState<AutopsyReport | null>({
    cellId: 7,
    timestamp: "2026-08-20 14:32:05",
    preFailureV: 3.12,
    preFailureT: 98.6,
    preFailureR: 24.5,
    failureMode: "Thermal Runaway Cascade (Historical Run)",
    verdict: "Autopsy reveals internal dendrite growth caused short-circuiting in Cell 7. Temperatures exceeded 90°C, triggering local relay isolation in 58ms, which successfully protected neighboring cells 6 and 8 from cascading runaway."
  });

  // Battery Passport state
  const [passport, setPassport] = useState<BatteryPassport>({
    id: "BMS-LFP-32700-4X4-89F3A4",
    manufacturer: "Aether Energy Systems GmbH",
    chemistry: "LiFePO4 (Lithium Iron Phosphate)",
    manufactureDate: "2024-11-12",
    initialCapacityAh: 51.2,
    cycleCount: 584,
    currentSoH: 92.4,
    grade: 'A',
    ownerName: "Hamburg Green Logistics SE",
    facilityLocation: "Hamburg Logistics Hub B-4",
    isSanitized: false,
    blockchainHash: "0x89e2bc9fa360c7f2162589be4041d8e1fae39d107293b6e82c5a0b9e8210ff4a",
  });

  const addLog = (type: DecisionLogEntry['eventType'], cellId: number, message: string, shap?: DecisionLogEntry['shapValues']) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newLog: DecisionLogEntry = {
      id: `L-${Date.now()}-${cellId}`,
      timestamp,
      cellId,
      eventType: type,
      message,
      shapValues: shap || {
        temperature: type === 'ISOLATION' ? 75.4 : 24.5,
        resistance: type === 'ISOLATION' ? 18.2 : 50.2,
        soh: type === 'ISOLATION' ? 6.4 : 25.3,
      },
    };
    setLogs((prev) => [...prev, newLog]);
  };

  const isolateCell = (cellId: number, reasoning: string) => {
    setCells((prevCells) =>
      prevCells.map((c) => {
        if (c.id === cellId) {
          return {
            ...c,
            isIsolated: true,
            isRebalanced: false,
            current: 0.0,
            voltage: 0.0,
          };
        }
        // Unthrottle hot neighbor if the hot cell has been successfully isolated
        if (c.isHotNeighbor) {
          return {
            ...c,
            isHotNeighbor: false,
            isRebalanced: false,
            current: packCurrent,
          };
        }
        return c;
      })
    );

    if (simMode === 'RUNAWAY' && cellId === 7) {
      setSimMode('CONTAINED');
    }

    addLog('ISOLATION', cellId, reasoning, {
      temperature: 75.4,
      resistance: 18.2,
      soh: 6.4,
    });
  };

  const reconnectCell = (cellId: number) => {
    setCells((prevCells) =>
      prevCells.map((c) => {
        if (c.id === cellId) {
          return {
            ...c,
            isIsolated: false,
            isRebalanced: false,
            isHotNeighbor: false,
            voltage: 3.82,
            temperature: 26.5,
            current: packCurrent,
          };
        }
        return c;
      })
    );

    if (simMode === 'CONTAINED' || simMode === 'RUNAWAY') {
      setSimMode('IDLE');
    }

    addLog('RECONNECT', cellId, `Manual override: Cell ${cellId} L298N isolation relays reset. Telemetry re-established.`);
  };

  const rebalancePackAround = (hotCellId: number, reasoning: string) => {
    const hotIdx = hotCellId - 1;
    const hotRow = Math.floor(hotIdx / 4);
    const hotCol = hotIdx % 4;

    setCells((prevCells) =>
      prevCells.map((c, i) => {
        const cRow = Math.floor(i / 4);
        const cCol = i % 4;
        const isNeighbor = Math.abs(cRow - hotRow) + Math.abs(cCol - hotCol) === 1;

        if (c.id === hotCellId) {
          return {
            ...c,
            isRebalanced: true,
            current: packCurrent * 0.6,
          };
        } else if (isNeighbor) {
          return {
            ...c,
            isHotNeighbor: true,
            isRebalanced: true,
            current: packCurrent * 0.8,
          };
        }
        return c;
      })
    );

    addLog('REBALANCE', hotCellId, reasoning, {
      temperature: 42.1,
      resistance: 38.4,
      soh: 19.5,
    });
  };

  const resetCells = () => {
    const initialCells: CellState[] = Array.from({ length: NUM_CELLS }, (_, i) => {
      const cellId = i + 1;
      const seed = Math.sin(cellId * 13) * 0.5;
      const rVal = 16.2 + seed;
      const sohVal = 98.4 - (seed * 2) - (cycleCount * 0.01);
      const rulVal = Math.round((sohVal - 70) / 0.018);

      return {
        id: cellId,
        voltage: 3.82 + (seed * 0.01),
        temperature: 26.8 + (seed * 0.4),
        current: INITIAL_CURRENT,
        resistance: rVal,
        soh: sohVal,
        rul: Math.max(0, rulVal),
        isIsolated: false,
        isRebalanced: false,
        isHotNeighbor: false,
      };
    });
    setCells(initialCells);
    setPackCurrent(INITIAL_CURRENT);
    setSimMode('IDLE');
    setLogs([
      {
        id: "L-INIT",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        cellId: 0,
        eventType: 'NORMAL',
        message: "CellSalus AI-BMS initialization complete. Core inference engine running SHAP estimations at 10Hz.",
      }
    ]);
  };

  // Initialize cells
  useEffect(() => {
    resetCells();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Telemetry updates simulation loop
  useEffect(() => {
    const interval = setInterval(() => {
      setCells((prevCells) => {
        if (prevCells.length === 0) return prevCells;
        
        return prevCells.map((cell, idx) => {
          // If physically isolated: current = 0A (bypassed), voltage = 0V, cools down to ambient (25.0°C)
          if (cell.isIsolated) {
            const cooledT = Math.max(25.0, cell.temperature - 0.45);
            return {
              ...cell,
              voltage: 0.0,
              current: 0.0,
              temperature: Number(cooledT.toFixed(1)),
            };
          }

          const wiggleV = (Math.random() - 0.5) * 0.004;
          const wiggleT = (Math.random() - 0.5) * 0.12;
          
          // Realistic Joule heating with Newton's cooling dissipation:
          // Ambient is 25.0°C. Target equilibrium under normal 5A load is ~28.5°C - 30.5°C.
          const ambientT = 25.0;
          const currentFactor = Math.pow(cell.current / 5.0, 1.8);
          const resistanceFactor = cell.resistance / 16.0;
          const targetEquilibriumT = ambientT + (currentFactor * resistanceFactor * 4.2);

          // Thermal relaxation towards equilibrium
          let nextT = cell.temperature + (targetEquilibriumT - cell.temperature) * 0.12 + wiggleT;

          // Check if neighboring cells are hot (> 42°C) and conduct thermal leakage
          const row = Math.floor(idx / 4);
          const col = idx % 4;
          let neighborHeat = 0;
          [
            col > 0 ? prevCells[idx - 1] : null,
            col < 3 ? prevCells[idx + 1] : null,
            row > 0 ? prevCells[idx - 4] : null,
            row < 3 ? prevCells[idx + 4] : null,
          ].forEach((neighbor) => {
            if (neighbor && !neighbor.isIsolated && neighbor.temperature > 42.0) {
              neighborHeat += (neighbor.temperature - 42.0) * 0.08;
            }
          });
          nextT += neighborHeat;

          // Stable nominal terminal voltage around 3.82V with micro load transients
          const nominalV = 3.82 - ((cell.current - 5.0) * 0.01) + (Math.sin(Date.now() / 3000 + cell.id) * 0.003);
          let nextV = nominalV + wiggleV;

          // Thermal Runaway injection on Cell 7
          if (simMode === 'RUNAWAY' && cell.id === 7) {
            nextT = cell.temperature + 2.8 + Math.random() * 0.4;
            nextV = Math.max(2.5, cell.voltage - 0.05);
          }

          // Critical pack failure mode on multiple cells
          if (simMode === 'CRITICAL_FAILURE' && (cell.id === 7 || cell.id === 11 || cell.id === 12)) {
            nextT = cell.temperature + 4.2 + Math.random() * 0.5;
            nextV = Math.max(1.8, cell.voltage - 0.12);
          }

          return {
            ...cell,
            voltage: Number(nextV.toFixed(3)),
            temperature: Number(nextT.toFixed(1)),
          };
        });
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [simMode, packCurrent]);

  // AI Decision loop
  useEffect(() => {
    if (cells.length === 0) return;

    cells.forEach((cell) => {
      // Immediate isolation trigger at 50°C
      if (cell.temperature >= 50.0 && !cell.isIsolated) {
        isolateCell(cell.id, `Dynamic Thermal Protection triggered. Cell temperature spiked to ${cell.temperature}°C (Safety limit: 50.0°C). Bistable relay engaged.`);
      }
      // Pre-emptive load throttling between 40°C and 50°C
      else if (cell.temperature >= 40.0 && cell.temperature < 50.0 && !cell.isRebalanced && !cell.isIsolated) {
        rebalancePackAround(cell.id, `Pre-emptive Current Bypass enabled. Local thermal rise in Cell ${cell.id} reached ${cell.temperature}°C (SHAP confidence: 89%).`);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cells]);

  // Quick Action triggers
  const triggerRunaway = () => {
    if (simMode === 'RUNAWAY') return;
    setSimMode('RUNAWAY');
    addLog('WARNING', 7, "Thermal spike injected into Cell 7. Local temperature rising rapidly at 2.8°C/s.");
  };

  const triggerPackFailure = () => {
    setSimMode('CRITICAL_FAILURE');
    addLog('CRITICAL', 0, "Critical cascading thermal propagation injected. AI failsafe triggered. Auto-compiling autopsy report...");
    
    setTimeout(() => {
      const failedCell = cells.find(c => c.id === 7) || cells[6];
      setAutopsyData({
        cellId: 7,
        timestamp: new Date().toLocaleString(),
        preFailureV: failedCell.voltage,
        preFailureT: 98.6,
        preFailureR: failedCell.resistance,
        failureMode: "Thermal Runaway Cascade (Unmitigated Simulation)",
        verdict: "Autopsy reveals internal dendrite growth caused short-circuiting in Cell 7. Because rebalancing safety limits were overridden, temperatures exceeded 90°C, leaking heat to adjacent Cells 6, 8, and 11 which triggered a complete pack thermal propagation shutdown."
      });
      setShowAutopsy(true);
    }, 4000);
  };

  const handleSanitizePassport = () => {
    setPassport((prev) => ({
      ...prev,
      isSanitized: true,
      ownerName: "[ENCRYPTED & SANITIZED]",
      facilityLocation: "[REDACTED]",
    }));
    addLog('NORMAL', 0, "EU Passport GDPR Sanitization complete. Previous owner Hamburg Green Logistics SE redacted.");
  };

  // Calculations
  const avgSoh = cells.length > 0 ? cells.reduce((s, c) => s + c.soh, 0) / cells.length : 0;
  const activeTemp = cells.length > 0 ? Math.max(...cells.map((c) => c.temperature)) : 0;
  const avgRes = cells.length > 0 ? cells.reduce((s, c) => s + c.resistance, 0) / cells.length : 0;
  const isolatedCount = cells.filter(c => c.isIsolated).length;

  const getSystemStatusLabel = () => {
    if (simMode === 'CRITICAL_FAILURE') return '🔴 EMERGENCY SHUTDOWN';
    if (simMode === 'RUNAWAY') return '🟡 RUNAWAY THREAD DETECTED';
    if (simMode === 'CONTAINED') return '🟢 RUNAWAY CONTAINED (BYPASS ACTIVE)';
    if (isolatedCount > 0) return '🟡 NODE BYPASSED / REBALANCED';
    return '🟢 SYSTEM OPERATIONAL';
  };

  return (
    <div style={{ display: 'flex' }}>
      
      {/* 1. Left Sidebar Component */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Activity size={20} className="text-blue-600 animate-pulse" /> CellSalus
        </div>
        <ul className="sidebar-menu">
          <li className={`sidebar-item ${activeView === 'DASHBOARD' ? 'active' : ''}`} onClick={() => setActiveView('DASHBOARD')}>
            <Activity size={16} /> Dashboard
          </li>
          <li className="sidebar-item" onClick={() => { setActiveView('DASHBOARD'); setSelectedCellId(7); }}>
            <Flame size={16} /> Critical Nodes
          </li>
          <li className={`sidebar-item ${activeView === 'BUYER_LOOKUP' ? 'active' : ''}`} onClick={() => setActiveView('BUYER_LOOKUP')}>
            <Barcode size={16} /> Buyer & Bill Registry
          </li>
          <li className={`sidebar-item ${activeView === 'LIVE_MAP' ? 'active' : ''}`} onClick={() => setActiveView('LIVE_MAP')}>
            <Navigation size={16} /> Live Google Map
          </li>
          <li className={`sidebar-item ${activeView === 'SENSOR_DIAGNOSTICS' ? 'active' : ''}`} onClick={() => setActiveView('SENSOR_DIAGNOSTICS')}>
            <Cpu size={16} /> Sensor Diagnostics
          </li>
          <li className={`sidebar-item ${activeView === 'EU_REGISTRY' ? 'active' : ''}`} onClick={() => setActiveView('EU_REGISTRY')}>
            <Layers size={16} /> EU Registry
          </li>
          <li className={`sidebar-item ${activeView === 'AUTOPSY' ? 'active' : ''}`} onClick={() => setActiveView('AUTOPSY')}>
            <ShieldAlert size={16} /> Forensic Reports
          </li>
          <li className={`sidebar-item ${activeView === 'SETTINGS' ? 'active' : ''}`} onClick={() => setActiveView('SETTINGS')}>
            <Settings size={16} /> Settings
          </li>
          <li className={`sidebar-item ${activeView === 'OPERATORS' ? 'active' : ''}`} onClick={() => setActiveView('OPERATORS')}>
            <Users size={16} /> Operators
          </li>
        </ul>
        <div className="sidebar-card">
          <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>PACK DIAGNOSTIC</div>
          <div style={{ color: '#475569' }}>Connected: 16 / 16 Nodes</div>
          <div style={{ fontSize: '0.68rem', color: '#059669', marginTop: '6px', fontWeight: 700 }}>Inference Eng: 10Hz</div>
        </div>
      </aside>

      {/* 2. Main content area */}
      <main className="main-content">
        
        {/* Top Header - Clean White Theme */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '12px 24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>BMS Status:</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: simMode === 'CRITICAL_FAILURE' ? '#dc2626' : isolatedCount > 0 ? '#d97706' : '#059669' }}>
              {getSystemStatusLabel()}
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input type="text" placeholder="Search cell nodes..." style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px 12px 6px 32px', fontSize: '0.82rem', outline: 'none', color: '#0f172a' }} />
              <Search size={14} style={{ position: 'absolute', left: '10px', color: '#64748b' }} />
            </div>
            <div style={{ position: 'relative', cursor: 'pointer' }}>
              <Bell size={18} className="text-gray-500" />
              {isolatedCount > 0 && <span style={{ position: 'absolute', top: '-3px', right: '-3px', background: '#dc2626', width: '7px', height: '7px', borderRadius: '50%' }}></span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '4px 10px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
              <div style={{ background: '#eff6ff', padding: '5px', borderRadius: '50%', color: '#2563eb' }}>
                <UserCheck size={15} />
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>Sr. Operator</span>
            </div>
          </div>
        </header>

        {/* View Switcher: Render features fully inside main dashboard */}
        {activeView === 'BUYER_LOOKUP' && (
          <BuyerLookupModal
            isFullDashboardView={true}
            onClose={() => setActiveView('DASHBOARD')}
            onSelectCoordinates={() => setActiveView('LIVE_MAP')}
          />
        )}

        {activeView === 'LIVE_MAP' && (
          <LiveTrackingMapModal
            isFullDashboardView={true}
            onClose={() => setActiveView('DASHBOARD')}
            buyerName={passport.isSanitized ? '[REDACTED]' : passport.ownerName}
            invoiceId="INV-2024-8849"
            packVoltage={cells.length > 0 ? cells.reduce((s, c) => s + c.voltage, 0) : 51.2}
            packTemp={cells.length > 0 ? Math.max(...cells.map(c => c.temperature)) : 29.4}
            onOpenBuyerDetails={() => setActiveView('BUYER_LOOKUP')}
          />
        )}

        {activeView === 'SENSOR_DIAGNOSTICS' && (
          <SensorDetectionModal
            isFullDashboardView={true}
            cells={cells}
            packCurrent={packCurrent}
            onClose={() => setActiveView('DASHBOARD')}
            onInjectSensorFault={(faultType, desc) => {
              addLog('WARNING', 0, `[Sensor Diagnostics] ${faultType}: ${desc}`);
            }}
          />
        )}

        {activeView === 'EU_REGISTRY' && (
          <BatteryPassportModal
            isFullDashboardView={true}
            passport={passport}
            onClose={() => setActiveView('DASHBOARD')}
            onSanitize={handleSanitizePassport}
          />
        )}

        {activeView === 'AUTOPSY' && autopsyData && (
          <AutopsyReportModal
            isFullDashboardView={true}
            report={autopsyData}
            cells={cells}
            onClose={() => setActiveView('DASHBOARD')}
          />
        )}

        {activeView === 'SETTINGS' && (
          <SettingsModal
            isFullDashboardView={true}
            onClose={() => setActiveView('DASHBOARD')}
          />
        )}

        {activeView === 'OPERATORS' && (
          <OperatorsModal
            isFullDashboardView={true}
            onClose={() => setActiveView('DASHBOARD')}
          />
        )}

        {/* Default Full BMS Dashboard View */}
        {activeView === 'DASHBOARD' && (
          <>
            {/* 3. Top Metrics Row (6 cards) */}
            <section className="metrics-row">
              <div className="metric-card">
                <span className="metric-title">Pack Health</span>
                <span className="metric-value">{avgSoh.toFixed(1)}%</span>
                <span className="metric-status" style={{ color: avgSoh > 85 ? '#10b981' : '#fbbf24' }}>Excellent</span>
              </div>
              <div className="metric-card">
                <span className="metric-title">Peak Temp</span>
                <span className="metric-value">{activeTemp.toFixed(1)}°C</span>
                <span className="metric-status" style={{ color: activeTemp > 45 ? '#ef4444' : '#10b981' }}>{activeTemp > 45 ? 'Thermal Warning' : 'Normal'}</span>
              </div>
              <div className="metric-card">
                <span className="metric-title">Avg Resistance</span>
                <span className="metric-value">{avgRes.toFixed(2)} mΩ</span>
                <span className="metric-status" style={{ color: avgRes > 17.5 ? '#fbbf24' : '#10b981' }}>Stable</span>
              </div>
              <div className="metric-card">
                <span className="metric-title">Current Load</span>
                <span className="metric-value">{packCurrent.toFixed(1)} A</span>
                <span className="metric-status" style={{ color: '#3b82f6' }}>Continuous</span>
              </div>
              <div className="metric-card">
                <span className="metric-title">Bypassed Nodes</span>
                <span className="metric-value">{isolatedCount} / 16</span>
                <span className="metric-status" style={{ color: isolatedCount > 0 ? '#fbbf24' : '#10b981' }}>{isolatedCount > 0 ? 'Bypass Active' : 'All Connected'}</span>
              </div>
              <div className="metric-card">
                <span className="metric-title">Mitigation Loop</span>
                <span className="metric-value" style={{ color: simMode === 'CRITICAL_FAILURE' ? '#ef4444' : simMode === 'RUNAWAY' ? '#f59e0b' : '#10b981', fontSize: '1.05rem' }}>
                  {simMode === 'CRITICAL_FAILURE' ? 'SHUTDOWN' : simMode === 'RUNAWAY' ? 'RUNAWAY SPIKE' : simMode === 'CONTAINED' ? 'CONTAINED' : isolatedCount > 0 ? 'ACTIVE BYPASS' : 'SECURED'}
                </span>
                <span className="metric-status">EU compliance</span>
              </div>
            </section>

            {/* 4. Middle Grid Layout (3 columns) */}
            <section className="dashboard-layout-grid">
              
              {/* Left Column: Cell Overview list & Passport details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Key Cells Monitor List */}
                <div className="card glass-panel" style={{ flexGrow: 1 }}>
                  <div className="card-header"><h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Active Nodes Overview</h3></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {(() => {
                      const alerted = cells.filter(c => c.isIsolated || c.isRebalanced || c.temperature > 38);
                      const displayCells = alerted.length > 0 
                        ? alerted.slice(0, 4) 
                        : cells.filter(c => c.id === 1 || c.id === 7 || c.id === 12);
                      return displayCells.map(cell => (
                        <div 
                          key={cell.id} 
                          onClick={() => setSelectedCellId(cell.id)} 
                          style={{ 
                            padding: '10px', 
                            background: cell.id === selectedCellId ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.02)', 
                            border: cell.id === selectedCellId ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.04)', 
                            borderRadius: '8px', 
                            cursor: 'pointer', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>CELL-0{cell.id}</div>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>SoH: {cell.soh.toFixed(1)}% | {cell.temperature.toFixed(1)}°C</span>
                          </div>
                          <span className={`badge ${cell.isIsolated ? 'badge-danger' : cell.isRebalanced ? 'badge-warning' : 'badge-success'}`}>
                            {cell.isIsolated ? 'Isolated' : cell.isRebalanced ? 'Throttled' : 'Healthy'}
                          </span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Battery Passport Registry Card */}
                <div className="card glass-panel">
                  <div className="card-header"><h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>EU Passport Registry</h3></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
                    <div>
                      <strong>Owner Registry:</strong> {passport.isSanitized ? '[GDPR REDACTED / ANONYMOUS]' : passport.ownerName}
                    </div>
                    <div>
                      <strong>Active Location:</strong> {passport.isSanitized ? '[REDACTED]' : passport.facilityLocation}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px', lineHeight: '1.3' }}>
                      <strong>Registry Explainable:</strong> EU Regulation mandates logging cycle lifespans. However, operator details and real-time coordinates must be sanitized to safeguard privacy on second-life handoff, while preserving cell diagnosis histories.
                    </div>
                    <button className="btn btn-primary" onClick={() => setActiveView('EU_REGISTRY')} style={{ fontSize: '0.75rem', padding: '6px 12px', width: '100%', justifyContent: 'center' }}>
                      Open EU Verifiable Passport
                    </button>
                  </div>
                </div>
              </div>

              {/* Middle Column: Pack Digital Twin (Grid) & GPS Tracker */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ flexGrow: 1 }}>
                  <GridTwin
                    cells={cells}
                    selectedCellId={selectedCellId}
                    onSelectCell={setSelectedCellId}
                  />
                </div>
                <div>
                  <GPSTracker 
                    isSanitized={passport.isSanitized} 
                    onOpenLiveMap={() => setActiveView('LIVE_MAP')}
                    onOpenBuyerLookup={() => setActiveView('BUYER_LOOKUP')}
                    onOpenSensorModal={() => setActiveView('SENSOR_DIAGNOSTICS')}
                  />
                </div>
              </div>

              {/* Right Column: Analytics & AI Agent status */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ flexGrow: 1 }}>
                  {cells.length > 0 && (
                    <CellDetailCard
                      cell={cells[selectedCellId - 1]}
                      onIsolateCell={(id) => isolateCell(id, `Manual override: Disconnecting Cell ${id} via L298N relay driver.`)}
                      onReconnectCell={reconnectCell}
                    />
                  )}
                </div>
                <div>
                  <AIAgentExecutive cells={cells} simMode={simMode} />
                </div>
              </div>

            </section>

            {/* 5. Bottom Row: Logs, Voice Assistant & What-If Simulator */}
            <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }} className="dashboard-grid">
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <ExplainableLogs logs={logs} />
                
                {/* What-If Simulator Control Center */}
                <div className="card glass-panel">
                  <div className="card-header">
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <HelpCircle size={16} className="text-blue-500" /> What-If Pack Simulator
                    </h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Load Current:</span>
                      <input type="range" min="1.0" max="15.0" step="0.5" value={packCurrent} onChange={(e) => setPackCurrent(parseFloat(e.target.value))} style={{ cursor: 'pointer', width: '120px' }} />
                      <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{packCurrent.toFixed(1)} A</span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button className="btn btn-warning" onClick={triggerRunaway} style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
                        <Flame size={12} /> Inject Runaway (C7)
                      </button>
                      <button className="btn btn-danger" onClick={triggerPackFailure} style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
                        <ShieldAlert size={12} /> Force Fail Cascade
                      </button>
                      <button className="btn btn-secondary" onClick={resetCells} style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
                        <RotateCcw size={12} /> Reset Pack
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <VoiceChatAssistant
                  cells={cells}
                  logs={logs}
                  onIsolateCell={(id) => isolateCell(id, `Voice/chat commanded: physically disconnecting Cell ${id}.`)}
                  onReconnectCell={reconnectCell}
                />
              </div>

            </section>
          </>
        )}

      </main>

      {/* Modals */}
      {showPassport && (
        <BatteryPassportModal
          passport={passport}
          onClose={() => setShowPassport(false)}
          onSanitize={handleSanitizePassport}
        />
      )}

      {showAutopsy && autopsyData && (
        <AutopsyReportModal
          report={autopsyData}
          cells={cells}
          onClose={() => setShowAutopsy(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
        />
      )}

      {showOperators && (
        <OperatorsModal
          onClose={() => setShowOperators(false)}
        />
      )}

      {showBuyerLookup && (
        <BuyerLookupModal
          onClose={() => setShowBuyerLookup(false)}
          onSelectCoordinates={() => {
            setShowLiveMap(true);
          }}
        />
      )}

      {showLiveMap && (
        <LiveTrackingMapModal
          onClose={() => setShowLiveMap(false)}
          buyerName={passport.isSanitized ? '[REDACTED]' : passport.ownerName}
          invoiceId="INV-2024-8849"
          packVoltage={cells.length > 0 ? cells.reduce((s, c) => s + c.voltage, 0) : 51.2}
          packTemp={cells.length > 0 ? Math.max(...cells.map(c => c.temperature)) : 29.4}
          onOpenBuyerDetails={() => {
            setShowLiveMap(false);
            setShowBuyerLookup(true);
          }}
        />
      )}

      {showSensorModal && (
        <SensorDetectionModal
          cells={cells}
          packCurrent={packCurrent}
          onClose={() => setShowSensorModal(false)}
          onInjectSensorFault={(faultType, desc) => {
            addLog('WARNING', 0, `[Sensor Diagnostics] ${faultType}: ${desc}`);
          }}
        />
      )}

    </div>
  );
}
