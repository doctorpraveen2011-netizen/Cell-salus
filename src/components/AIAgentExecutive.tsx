import React, { useEffect, useState } from 'react';
import { Cpu, ShieldCheck, Zap, LineChart, Brain } from 'lucide-react';
import type { CellState } from '../types/bms';

interface AIAgentExecutiveProps {
  cells: CellState[];
  simMode: string;
}

export const AIAgentExecutive: React.FC<AIAgentExecutiveProps> = ({ cells, simMode }) => {
  const [thoughts, setThoughts] = useState<string[]>([]);
  const [activeTask, setActiveTask] = useState<string>("Analyzing pack thermodynamic patterns...");

  // Generate real-time agent thoughts based on telemetry and simMode
  useEffect(() => {
    const updateThoughts = () => {
      const hotCell = cells.find(c => c.temperature > 40 && !c.isIsolated);
      const isolatedCells = cells.filter(c => c.isIsolated).map(c => c.id);
      
      const newThoughts: string[] = [];

      if (simMode === 'RUNAWAY') {
        newThoughts.push("ThermalGuard: Critical anomaly detected in Cell 7! Temp gradient > 2.8°C/s.");
        newThoughts.push("LoadBalancer: Throttling current to 60% on Cell 7 and 80% on immediate grid neighbors.");
        newThoughts.push("ThermalGuard: Initiating L298N relay isolation signal for Cell 7 to prevent fire cascade.");
        setActiveTask("Goal: Mitigate thermal runaway in Cell 7.");
      } else if (simMode === 'CONTAINED') {
        newThoughts.push("ThermalGuard: Cell 7 successfully isolated via bistable latching relay in 58ms.");
        newThoughts.push("LoadBalancer: Active current bypass engaged. Remaining 15 cells stabilized.");
        newThoughts.push("CyclePredictor: Autonomous disconnect averted cascade. Pack integrity secured.");
        setActiveTask("Goal: Runaway contained. Cell 7 isolated; remaining pack operating safely in bypass.");
      } else if (simMode === 'CRITICAL_FAILURE') {
        newThoughts.push("System-Agent: Cascading thermal failures detected in multiple cells!");
        newThoughts.push("ThermalGuard: Relays failing to latch. Overheating cells detected [7, 11, 12].");
        newThoughts.push("System-Agent: Triggering emergency shutdown. Generating forensic autopsy report...");
        setActiveTask("Goal: Safeguard human life. Execute emergency pack shutdown.");
      } else {
        if (hotCell) {
          newThoughts.push(`ThermalGuard: Cell ${hotCell.id} registered early thermal warning (${hotCell.temperature}°C).`);
          newThoughts.push(`LoadBalancer: Initiating active shunt bypass routing on Cell ${hotCell.id}.`);
          setActiveTask(`Goal: Manage local thermal rise on Cell ${hotCell.id}.`);
        } else {
          newThoughts.push("ThermalGuard: Monitoring 16 nodes. Standard operational temperature bounds active.");
          newThoughts.push("LoadBalancer: Pack current distribution balanced at 5.0A across all connected buses.");
          newThoughts.push("CyclePredictor: RUL projection stable. Pack average SoH is nominal.");
          setActiveTask("Goal: Optimize pack health and capacity distribution.");
        }
      }

      if (isolatedCells.length > 0) {
        newThoughts.push(`System-Agent: Running pack in bypass mode. Isolated cell ids: [${isolatedCells.join(', ')}].`);
      }

      setThoughts(newThoughts);
    };

    updateThoughts();
  }, [cells, simMode]);

  return (
    <div className="card glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Brain className="text-purple-600 animate-pulse" size={18} /> AI Agent Executive Core
        </h3>
        <span style={{ fontSize: '0.75rem', color: '#7c3aed', background: 'rgba(124, 58, 237, 0.1)', padding: '3px 8px', borderRadius: '12px', fontWeight: 600 }}>
          3 Co-Pilots Active
        </span>
      </div>

      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {/* Active Goal */}
        <div style={{ background: 'rgba(124, 58, 237, 0.04)', border: '1px solid rgba(124, 58, 237, 0.15)', padding: '12px', borderRadius: '8px' }}>
          <span style={{ display: 'block', fontSize: '0.7rem', color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Current System Objective
          </span>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Cpu size={14} className="text-purple-600 animate-spin-slow" /> {activeTask}
          </div>
        </div>

        {/* Subagent Status Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {/* ThermalGuard */}
          <div style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(15,23,42,0.06)', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
            <ShieldCheck size={16} style={{ color: '#10b981', margin: '0 auto 4px auto' }} />
            <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>ThermalGuard</div>
            <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 700 }}>ACTIVE</span>
          </div>

          {/* LoadBalancer */}
          <div style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(15,23,42,0.06)', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
            <Zap size={16} style={{ color: '#f59e0b', margin: '0 auto 4px auto', animation: thoughts.some(t => t.includes('LoadBalancer')) ? 'pulse-glow 0.6s infinite alternate' : 'none' }} />
            <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>LoadBalancer</div>
            <span style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 700 }}>{thoughts.some(t => t.includes('LoadBalancer')) ? 'THROTTLING' : 'ACTIVE'}</span>
          </div>

          {/* CyclePredictor */}
          <div style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(15,23,42,0.06)', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
            <LineChart size={16} style={{ color: '#3b82f6', margin: '0 auto 4px auto' }} />
            <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>CyclePredictor</div>
            <span style={{ fontSize: '0.65rem', color: '#3b82f6', fontWeight: 700 }}>ACTIVE</span>
          </div>
        </div>

        {/* Live Thoughts Stream */}
        <div style={{ flexGrow: 1 }}>
          <span style={{ fontSize: '0.75rem', color: 'rgba(15, 23, 42, 0.5)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
            Live Reasoning Trace (Agent Thoughts)
          </span>
          <div style={{ background: 'rgba(15, 23, 42, 0.03)', padding: '10px', borderRadius: '8px', maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {thoughts.map((thought, idx) => (
              <div key={idx} style={{ fontFamily: 'monospace', fontSize: '0.75rem', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                <span style={{ color: '#7c3aed' }}>▶</span>
                <span style={{ color: '#334155' }}>{thought}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
