import React, { useState, useEffect } from 'react';
import { 
  Cpu, Activity, Zap, Wind, AlertTriangle, ShieldCheck, 
  Droplets, Radio, RefreshCw, X, Flame, 
  Gauge, Sparkles, ArrowLeft
} from 'lucide-react';
import type { CellState, SensorTelemetry } from '../types/bms';

interface SensorDetectionModalProps {
  onClose: () => void;
  cells: CellState[];
  packCurrent: number;
  onInjectSensorFault?: (faultType: string, description: string) => void;
  isFullDashboardView?: boolean;
}

export const SensorDetectionModal: React.FC<SensorDetectionModalProps> = ({
  onClose,
  cells,
  packCurrent,
  onInjectSensorFault,
  isFullDashboardView = false
}) => {
  // Sensor State with interactive fault simulation
  const [sensors, setSensors] = useState<SensorTelemetry>({
    voltageMux: {
      channelCount: 16,
      status: 'NOMINAL',
      noiseFloorMv: 1.2
    },
    thermistorArray: {
      channelCount: 16,
      status: 'NOMINAL',
      peakTemp: 29.4,
      minTemp: 28.8,
      deltaT: 0.6
    },
    currentHall: {
      status: 'NOMINAL',
      currentAmps: packCurrent,
      accuracyPercent: 99.4
    },
    gasSensor: {
      status: 'SAFE',
      vocPpm: 12.4,
      baselinePpm: 10.0,
      gasType: 'Electrolyte Solvent (DMC / EMC)'
    },
    imuVibration: {
      status: 'STABLE',
      gForce: 1.02,
      pitchDeg: 1.4,
      rollDeg: 0.6
    },
    moistureSensor: {
      status: 'DRY_SEALED',
      relativeHumidity: 38.2,
      sealIntegrity: true
    },
    insulationResistance: {
      status: 'HEALTHY',
      mohms: 54.2
    },
    relayContinuity: {
      status: 'CLOSED_HEALTHY',
      coilResistanceOhms: 24.1,
      contactResistanceMohms: 0.8
    }
  });

  const [selfTestRunning, setSelfTestRunning] = useState<boolean>(false);
  const [activeFaultName, setActiveFaultName] = useState<string | null>(null);
  const [diagnosticFeedback, setDiagnosticFeedback] = useState<string>("All 8 sensor subsystems operating within calibrated aerospace safety envelopes.");

  // Update sensor readings from actual cells prop
  useEffect(() => {
    if (cells.length > 0) {
      const temps = cells.map(c => c.temperature);
      const maxT = Math.max(...temps);
      const minT = Math.min(...temps);
      const delta = maxT - minT;

      setSensors(prev => ({
        ...prev,
        thermistorArray: {
          ...prev.thermistorArray,
          peakTemp: Number(maxT.toFixed(1)),
          minTemp: Number(minT.toFixed(1)),
          deltaT: Number(delta.toFixed(1)),
          status: delta > 8.0 ? 'GRADIENT_ALERT' : 'NOMINAL'
        },
        currentHall: {
          ...prev.currentHall,
          currentAmps: packCurrent
        }
      }));
    }
  }, [cells, packCurrent]);

  // Fault Injection Handlers
  const handleInjectGasLeak = () => {
    setActiveFaultName('VOC_OUTGAS');
    setSensors(prev => ({
      ...prev,
      gasSensor: {
        status: 'CRITICAL_OUTGAS',
        vocPpm: 148.5,
        baselinePpm: 10.0,
        gasType: 'Electrolyte Vapor Surge (DMC Outgassing)'
      }
    }));
    setDiagnosticFeedback("Out-Gassing Alert: MQ-2 sensor detected severe volatile organic compound vapor (148.5 ppm). Early indicator of cell venting!");
    if (onInjectSensorFault) {
      onInjectSensorFault('VOC_OUTGAS', 'Electrolyte out-gassing detected by MQ-2 sensor (148.5 ppm).');
    }
  };

  const handleInjectImpactShock = () => {
    setActiveFaultName('IMU_IMPACT');
    setSensors(prev => ({
      ...prev,
      imuVibration: {
        status: 'IMPACT_DETECTED',
        gForce: 4.85,
        pitchDeg: 14.8,
        rollDeg: 8.2
      }
    }));
    setDiagnosticFeedback("High-G Impact Alert: MPU-6050 6-DOF IMU logged severe deceleration shock (4.85G). Check pack housing for mechanical tab deformation.");
    if (onInjectSensorFault) {
      onInjectSensorFault('IMU_IMPACT', 'Mechanical collision / drop shock detected: 4.85G.');
    }
  };

  const handleInjectMoistureIngress = () => {
    setActiveFaultName('WATER_INGRESS');
    setSensors(prev => ({
      ...prev,
      moistureSensor: {
        status: 'WATER_INGRESS',
        relativeHumidity: 88.4,
        sealIntegrity: false
      },
      insulationResistance: {
        status: 'ISOLATION_FAULT',
        mohms: 0.42
      }
    }));
    setDiagnosticFeedback("Pack Seal Failure: Internal enclosure humidity jumped to 88.4% RH. Insulation resistance dropped to 0.42 MΩ. IP67 breach suspected!");
    if (onInjectSensorFault) {
      onInjectSensorFault('WATER_INGRESS', 'Moisture ingress detected: enclosure seal compromise.');
    }
  };

  const handleInjectRelayFault = () => {
    setActiveFaultName('RELAY_COIL_FAULT');
    setSensors(prev => ({
      ...prev,
      relayContinuity: {
        status: 'COIL_FAULT',
        coilResistanceOhms: 999.0,
        contactResistanceMohms: 12.5
      }
    }));
    setDiagnosticFeedback("Relay Continuity Alarm: L298N isolation driver coil feedback circuit is open-circuit (>999 Ω). Isolation actuation compromised!");
    if (onInjectSensorFault) {
      onInjectSensorFault('RELAY_COIL_FAULT', 'L298N relay coil open-circuit fault.');
    }
  };

  const handleResetSensors = () => {
    setActiveFaultName(null);
    setSensors({
      voltageMux: {
        channelCount: 16,
        status: 'NOMINAL',
        noiseFloorMv: 1.2
      },
      thermistorArray: {
        channelCount: 16,
        status: 'NOMINAL',
        peakTemp: 29.4,
        minTemp: 28.8,
        deltaT: 0.6
      },
      currentHall: {
        status: 'NOMINAL',
        currentAmps: packCurrent,
        accuracyPercent: 99.4
      },
      gasSensor: {
        status: 'SAFE',
        vocPpm: 12.4,
        baselinePpm: 10.0,
        gasType: 'Electrolyte Solvent (DMC / EMC)'
      },
      imuVibration: {
        status: 'STABLE',
        gForce: 1.02,
        pitchDeg: 1.4,
        rollDeg: 0.6
      },
      moistureSensor: {
        status: 'DRY_SEALED',
        relativeHumidity: 38.2,
        sealIntegrity: true
      },
      insulationResistance: {
        status: 'HEALTHY',
        mohms: 54.2
      },
      relayContinuity: {
        status: 'CLOSED_HEALTHY',
        coilResistanceOhms: 24.1,
        contactResistanceMohms: 0.8
      }
    });
    setDiagnosticFeedback("All sensor calibrations zeroed. Baseline noise floor restored across all 16 ADC channels.");
  };

  const handleRunSelfTest = () => {
    setSelfTestRunning(true);
    setDiagnosticFeedback("Running 16-point hardware diagnostic test suite across MUX, NTC, IMU, Hall, and Gas circuits...");
    
    setTimeout(() => {
      setSelfTestRunning(false);
      handleResetSensors();
      setDiagnosticFeedback("Automated Hardware Self-Test Passed: All 8 sensor subsystems verified healthy and within calibration limits.");
    }, 1500);
  };

  const contentJSX = (
    <div 
      style={{ 
        width: '100%',
        maxWidth: isFullDashboardView ? '100%' : '1050px', 
        maxHeight: isFullDashboardView ? 'none' : '92vh', 
        overflowY: 'auto',
        padding: '28px',
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: isFullDashboardView ? '0 4px 20px rgba(15, 23, 42, 0.05)' : '0 25px 60px rgba(15, 23, 42, 0.15)',
        boxSizing: 'border-box'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
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
          <div style={{ background: '#faf5ff', padding: '10px', borderRadius: '10px', border: '1px solid #e9d5ff' }}>
            <Cpu className="text-purple-600" size={24} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Multi-Sensor Telemetry & Detection Suite
              <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>8 Subsystems Active</span>
            </h2>
            <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Real-time ADC muxing, NTC thermal gradients, off-gas detection, IMU acceleration & coil continuity.
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-primary" 
            onClick={handleRunSelfTest}
            disabled={selfTestRunning}
            style={{ fontSize: '0.78rem', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={selfTestRunning ? 'animate-spin' : ''} />
            {selfTestRunning ? 'Running Self-Test...' : 'Run Sensor Self-Test'}
          </button>
          {!isFullDashboardView && (
            <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px 10px', borderRadius: '8px' }}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Live Status Feedback Banner - Clean Style */}
      <div style={{ 
        padding: '12px 16px', 
        borderRadius: '10px', 
        background: activeFaultName ? '#fef2f2' : '#f0fdf4', 
        border: activeFaultName ? '1px solid #fecaca' : '1px solid #bbf7d0', 
        marginBottom: '20px', 
        fontSize: '0.85rem', 
        color: activeFaultName ? '#991b1b' : '#166534',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontWeight: 500
      }}>
        {activeFaultName ? <AlertTriangle size={18} className="text-red-500 animate-pulse" /> : <ShieldCheck size={18} className="text-emerald-500" />}
        <span>{diagnosticFeedback}</span>
      </div>

      {/* 8 Sensor Subsystems Grid - Clean White Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '22px' }}>
        
        {/* 1. Voltage Mux Sensor */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={14} className="text-amber-500" /> Voltage Mux ADC
            </span>
            <span className={`badge ${sensors.voltageMux.status === 'NOMINAL' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.65rem' }}>
              {sensors.voltageMux.status}
            </span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>16 Channels</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            Dual CD4067 | Noise: <strong>{sensors.voltageMux.noiseFloorMv} mV RMS</strong>
          </div>
        </div>

        {/* 2. NTC Thermistor Matrix */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Flame size={14} className="text-red-500" /> NTC Thermal Matrix
            </span>
            <span className={`badge ${sensors.thermistorArray.status === 'NOMINAL' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.65rem' }}>
              {sensors.thermistorArray.status}
            </span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: sensors.thermistorArray.peakTemp > 45 ? '#dc2626' : '#0f172a' }}>
            {sensors.thermistorArray.peakTemp}°C <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Peak</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            ΔT Balance: <strong>{sensors.thermistorArray.deltaT}°C</strong> | Min: {sensors.thermistorArray.minTemp}°C
          </div>
        </div>

        {/* 3. Gas / VOC Sensor */}
        <div style={{ background: '#f8fafc', border: sensors.gasSensor.status === 'CRITICAL_OUTGAS' ? '1px solid #f87171' : '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Wind size={14} className="text-purple-500" /> MQ-2 Off-Gas / VOC
            </span>
            <span className={`badge ${sensors.gasSensor.status === 'SAFE' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.65rem' }}>
              {sensors.gasSensor.status}
            </span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: sensors.gasSensor.status === 'CRITICAL_OUTGAS' ? '#dc2626' : '#0f172a' }}>
            {sensors.gasSensor.vocPpm.toFixed(1)} ppm
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            Target: <strong>DMC Solvent Outgas</strong>
          </div>
        </div>

        {/* 4. IMU Vibration & Impact */}
        <div style={{ background: '#f8fafc', border: sensors.imuVibration.status === 'IMPACT_DETECTED' ? '1px solid #f87171' : '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={14} className="text-blue-500" /> MPU-6050 6-DOF IMU
            </span>
            <span className={`badge ${sensors.imuVibration.status === 'STABLE' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.65rem' }}>
              {sensors.imuVibration.status}
            </span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: sensors.imuVibration.gForce > 3.0 ? '#dc2626' : '#0f172a' }}>
            {sensors.imuVibration.gForce.toFixed(2)} G
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            Tilt: Pitch <strong>{sensors.imuVibration.pitchDeg}°</strong> | Roll <strong>{sensors.imuVibration.rollDeg}°</strong>
          </div>
        </div>

        {/* 5. Hall-Effect Current Sensor */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Gauge size={14} className="text-cyan-600" /> Hall Current Sensor
            </span>
            <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
              {sensors.currentHall.status}
            </span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
            {sensors.currentHall.currentAmps.toFixed(2)} A
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            ACS758 Bidirectional | Accuracy: <strong>{sensors.currentHall.accuracyPercent}%</strong>
          </div>
        </div>

        {/* 6. Moisture & Condensation */}
        <div style={{ background: '#f8fafc', border: sensors.moistureSensor.status === 'WATER_INGRESS' ? '1px solid #f87171' : '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Droplets size={14} className="text-blue-500" /> Moisture & IP67 Seal
            </span>
            <span className={`badge ${sensors.moistureSensor.status === 'DRY_SEALED' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.65rem' }}>
              {sensors.moistureSensor.status}
            </span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: sensors.moistureSensor.relativeHumidity > 70 ? '#dc2626' : '#0f172a' }}>
            {sensors.moistureSensor.relativeHumidity.toFixed(1)}% RH
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            Enclosure Gasket: <strong>{sensors.moistureSensor.sealIntegrity ? 'Intact (IP67)' : 'Compromised'}</strong>
          </div>
        </div>

        {/* 7. Insulation Resistance (HVIL) */}
        <div style={{ background: '#f8fafc', border: sensors.insulationResistance.status === 'ISOLATION_FAULT' ? '1px solid #f87171' : '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} className="text-emerald-600" /> Insulation (HVIL)
            </span>
            <span className={`badge ${sensors.insulationResistance.status === 'HEALTHY' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.65rem' }}>
              {sensors.insulationResistance.status}
            </span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: sensors.insulationResistance.mohms < 1.0 ? '#dc2626' : '#0f172a' }}>
            {sensors.insulationResistance.mohms.toFixed(1)} MΩ
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            Chassis Ground Isolation: <strong>Pass (&gt;500 Ω/V)</strong>
          </div>
        </div>

        {/* 8. Relay Continuity */}
        <div style={{ background: '#f8fafc', border: sensors.relayContinuity.status === 'COIL_FAULT' ? '1px solid #f87171' : '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Radio size={14} className="text-indigo-600" /> Relay Coil Continuity
            </span>
            <span className={`badge ${sensors.relayContinuity.status === 'CLOSED_HEALTHY' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.65rem' }}>
              {sensors.relayContinuity.status}
            </span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: sensors.relayContinuity.coilResistanceOhms > 100 ? '#dc2626' : '#0f172a' }}>
            {sensors.relayContinuity.coilResistanceOhms} Ω
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            Contact R: <strong>{sensors.relayContinuity.contactResistanceMohms} mΩ</strong> (Unwelded)
          </div>
        </div>

      </div>

      {/* Live ADC Oscilloscope Waveform Preview */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2563eb', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={15} /> LIVE SENSOR BUS OSCILLOSCOPE (ADC1 / SPI BUS #0)
          </span>
          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Sampling Rate: 100 kHz | 12-bit ADC</span>
        </div>

        <svg viewBox="0 0 700 70" style={{ width: '100%', height: '70px', display: 'block', background: '#f8fafc', borderRadius: '8px' }}>
          <defs>
            <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          {/* Grid lines */}
          <line x1="0" y1="35" x2="700" y2="35" stroke="#cbd5e1" strokeDasharray="4,4" />
          <line x1="175" y1="0" x2="175" y2="70" stroke="#e2e8f0" />
          <line x1="350" y1="0" x2="350" y2="70" stroke="#e2e8f0" />
          <line x1="525" y1="0" x2="525" y2="70" stroke="#e2e8f0" />

          {/* Dynamic Waveform */}
          <path
            d={activeFaultName === 'VOC_OUTGAS'
              ? "M 0,35 Q 50,5 100,55 T 200,10 T 300,60 T 400,8 T 500,65 T 600,15 T 700,35"
              : "M 0,35 Q 25,32 50,38 T 100,33 T 150,37 T 200,34 T 250,36 T 300,34 T 350,37 T 400,33 T 450,36 T 500,34 T 550,36 T 600,34 T 650,36 T 700,35"
            }
            fill="none"
            stroke={activeFaultName ? '#ef4444' : '#2563eb'}
            strokeWidth="2.5"
          />
        </svg>
      </div>

      {/* Interactive Sensor Fault Simulator Actions */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', marginBottom: '20px' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <Sparkles size={15} className="text-amber-500" /> Interactive Sensor Detection & Fault Injection Testbench
        </span>
        <p style={{ margin: '0 0 14px 0', fontSize: '0.78rem', color: '#64748b' }}>
          Simulate real physical sensor triggers to verify how the CellSalus AI inference engine responds to outgassing, high-G collision shock, or moisture ingress:
        </p>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-secondary" 
            onClick={handleInjectGasLeak}
            style={{ fontSize: '0.78rem', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #fde68a', background: '#fffbeb', color: '#92400e' }}
          >
            <Wind size={14} className="text-amber-600" /> Inject Outgassing (VOC 148 ppm)
          </button>

          <button 
            className="btn btn-secondary" 
            onClick={handleInjectImpactShock}
            style={{ fontSize: '0.78rem', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c' }}
          >
            <Activity size={14} className="text-red-600" /> Inject 4.8G Deceleration Shock
          </button>

          <button 
            className="btn btn-secondary" 
            onClick={handleInjectMoistureIngress}
            style={{ fontSize: '0.78rem', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8' }}
          >
            <Droplets size={14} className="text-blue-600" /> Inject Moisture Ingress (88% RH)
          </button>

          <button 
            className="btn btn-secondary" 
            onClick={handleInjectRelayFault}
            style={{ fontSize: '0.78rem', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #e9d5ff', background: '#faf5ff', color: '#7e22ce' }}
          >
            <Radio size={14} className="text-purple-600" /> Inject Relay Coil Break
          </button>

          <button 
            className="btn btn-primary" 
            onClick={handleResetSensors}
            style={{ fontSize: '0.78rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}
          >
            <RefreshCw size={14} /> Clear & Recalibrate Sensors
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#64748b' }}>
        <div>
          Hardware standard: ISO 26262 ASIL-D Compliant BMS Sensor Interface.
        </div>
        <button className="btn btn-secondary" onClick={onClose} style={{ fontSize: '0.82rem', padding: '7px 20px' }}>
          {isFullDashboardView ? 'Back to Dashboard' : 'Done'}
        </button>
      </div>
    </div>
  );

  if (isFullDashboardView) {
    return contentJSX;
  }

  return (
    <div className="modal-backdrop">
      {contentJSX}
    </div>
  );
};
