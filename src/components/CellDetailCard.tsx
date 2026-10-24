import React from 'react';
import type { CellState } from '../types/bms';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ShieldCheck, ShieldAlert, Activity, Zap } from 'lucide-react';

interface CellDetailCardProps {
  cell: CellState;
  onIsolateCell: (id: number) => void;
  onReconnectCell: (id: number) => void;
}

export const CellDetailCard: React.FC<CellDetailCardProps> = ({
  cell,
  onIsolateCell,
  onReconnectCell,
}) => {
  // Generate predictive degradation curve based on cell properties
  const generateChartData = (currentSoh: number, currentResistance: number) => {
    const data = [];
    const step = 200;
    
    // Cycle degradation trend
    for (let c = 0; c <= 2000; c += step) {
      // Decay multiplier
      const cycleRatio = c / 2000;
      
      // Calculate capacity degradation
      const calculatedSoh = Math.max(
        50,
        100 - (100 - currentSoh) * (cycleRatio / 0.3) + (c === 0 ? 0 : Math.sin(c / 50) * 0.5)
      );
      
      // Calculate internal resistance climb
      const calculatedRes = Math.min(
        35,
        15 + (currentResistance - 15) * (cycleRatio / 0.3) + (c === 0 ? 0 : Math.cos(c / 50) * 0.2)
      );

      data.push({
        cycle: c,
        'State of Health (%)': Math.round(calculatedSoh * 10) / 10,
        'Resistance (mΩ)': Math.round(calculatedRes * 10) / 10,
      });
    }
    return data;
  };

  const chartData = generateChartData(cell.soh, cell.resistance);

  return (
    <div className="card glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} className="text-blue-400" /> Cell Analytics Monitor
        </h3>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#3b82f6' }}>
          Node #{cell.id} Selected
        </span>
      </div>

      {/* Grid of basic stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '15px' }}>
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Voltage</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: cell.isIsolated ? 'rgba(255,255,255,0.3)' : 'white' }}>
            {cell.isIsolated ? '0.000 V' : `${cell.voltage.toFixed(3)} V`}
          </div>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Temperature</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: cell.temperature > 50 ? '#ef4444' : cell.temperature > 40 ? '#fb923c' : 'white' }}>
            {cell.temperature.toFixed(1)} °C
          </div>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Load Current</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: cell.isIsolated ? 'rgba(255,255,255,0.2)' : cell.isRebalanced ? '#fbbf24' : 'white' }}>
            {cell.current.toFixed(2)} A
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>State of Health</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: cell.soh > 80 ? '#10b981' : cell.soh > 70 ? '#fbbf24' : '#ef4444' }}>
            {cell.soh.toFixed(1)} %
          </div>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Remaining Useful Life (RUL)</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: cell.rul > 800 ? '#10b981' : cell.rul > 300 ? '#fbbf24' : '#ef4444' }}>
            {cell.isIsolated ? '0 Cycles' : `${cell.rul} Cycles`}
          </div>
        </div>
      </div>

      {/* Safety Actions & Isolation Override */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        {cell.isIsolated ? (
          <button className="btn btn-success" onClick={() => onReconnectCell(cell.id)} style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <ShieldCheck size={16} /> Reconnect Cell (L298N Relay Trigger)
          </button>
        ) : (
          <button className="btn btn-danger" onClick={() => onIsolateCell(cell.id)} style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <ShieldAlert size={16} /> Isolate Cell (L298N Relay Trigger)
          </button>
        )}
      </div>

      {cell.isRebalanced && !cell.isIsolated && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '0.82rem', color: '#fb923c' }}>
          <Zap size={16} className="animate-pulse" />
          <span><strong>Active Load Balancing:</strong> Pack current bypassed by 40% around neighbors to slow thermal drift.</span>
        </div>
      )}

      {/* Live Recharts Trend */}
      <div style={{ flexGrow: 1, minHeight: '180px' }}>
        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '8px' }}>
          AI Health Decay Profile (Cycle 0 to 2000)
        </span>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="cycle" stroke="rgba(255,255,255,0.4)" fontSize={9} />
            <YAxis stroke="rgba(255,255,255,0.4)" fontSize={9} />
            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', fontSize: '11px', color: '#fff' }} />
            <Legend wrapperStyle={{ fontSize: '10px', marginTop: '5px' }} />
            <Line type="monotone" dataKey="State of Health (%)" stroke="#10b981" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="Resistance (mΩ)" stroke="#f97316" strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
