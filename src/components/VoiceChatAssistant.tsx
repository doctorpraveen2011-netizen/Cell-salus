import React, { useState, useEffect, useRef } from 'react';
import type { CellState, DecisionLogEntry } from '../types/bms';
import { MessageSquare, Mic, MicOff, Send, Volume2, VolumeX } from 'lucide-react';

interface VoiceChatAssistantProps {
  cells: CellState[];
  logs: DecisionLogEntry[];
  onIsolateCell: (cellId: number) => void;
  onReconnectCell: (cellId: number) => void;
}

interface Message {
  sender: 'user' | 'bms';
  text: string;
  timestamp: string;
}

export const VoiceChatAssistant: React.FC<VoiceChatAssistantProps> = ({
  cells,
  logs,
  onIsolateCell,
  onReconnectCell,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bms',
      text: "Hello! I am the CellSalus AI Sentinel. I monitor cell states and explain autonomous balancing and isolation actions. Try asking: 'Why did you disconnect Cell 7?' or say 'Give me the pack health report.'",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speakEnabled, setSpeakEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Speech Recognition setup (Web Speech API)
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        handleSend(transcript);
      };

      rec.onerror = (e: any) => {
        console.error('Speech recognition error:', e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, [cells, logs]); // Re-bind on state changes so responder reads fresh values

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Speak text output (Web Speech API)
  const speakText = (text: string) => {
    if (!speakEnabled) return;
    window.speechSynthesis.cancel(); // Cancel any ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  const startVoiceInput = () => {
    if (!recognition) {
      alert("Voice recognition is not supported in this browser. Please use Chrome/Edge or type your question.");
      return;
    }
    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const handleSend = (textToSend = inputText) => {
    if (!textToSend.trim()) return;

    const userMessage: Message = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');

    // Generate AI response
    setTimeout(() => {
      const responseText = processQuery(textToSend);
      const aiMessage: Message = {
        sender: 'bms',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMessage]);
      speakText(responseText);
    }, 600);
  };

  const processQuery = (query: string): string => {
    const q = query.toLowerCase();

    // 1. Check for Cell Isolation questions: "Why did you disconnect Cell X?", "Why is Cell X isolated?"
    const cellIsolateMatch = q.match(/(?:why did you disconnect|why is cell|explain cell)\s*(\d+)/);
    if (cellIsolateMatch) {
      const cellId = parseInt(cellIsolateMatch[1]);
      if (cellId < 1 || cellId > cells.length) {
        return `Cell ${cellId} is out of bounds. The battery pack contains cells 1 through ${cells.length}.`;
      }
      
      const cell = cells[cellId - 1];
      if (cell.isIsolated) {
        // Find logs related to this cell
        const cellLogs = logs.filter(l => l.cellId === cellId && l.eventType === 'ISOLATION');
        if (cellLogs.length > 0) {
          const latestLog = cellLogs[cellLogs.length - 1];
          return `Cell ${cellId} was isolated dynamically by the AI controller because its health metrics breached safety limits. ${latestLog.message}`;
        }
        return `Cell ${cellId} was isolated because its temperature rose to ${cell.temperature.toFixed(1)}°C and internal resistance reached ${cell.resistance.toFixed(1)} mΩ, threatening thermal-runaway propagation to neighbors.`;
      } else {
        return `Cell ${cellId} is fully operational and healthy. Its state of health is ${cell.soh.toFixed(1)}%, temperature is ${cell.temperature.toFixed(1)}°C, and internal resistance is normal at ${cell.resistance.toFixed(1)} mΩ.`;
      }
    }

    // 2. Action: "Isolate Cell X" or "Disconnect Cell X"
    const isolateActionMatch = q.match(/(?:isolate|disconnect|shut down|turn off)\s*(?:cell)?\s*(\d+)/);
    if (isolateActionMatch) {
      const cellId = parseInt(isolateActionMatch[1]);
      if (cellId < 1 || cellId > cells.length) return `Cell ${cellId} does not exist.`;
      const cell = cells[cellId - 1];
      if (cell.isIsolated) return `Cell ${cellId} is already isolated.`;
      onIsolateCell(cellId);
      return `Understood. Overriding manual safety: Initiating L298N relay trigger to physically isolate Cell ${cellId}. Active current is now bypassed.`;
    }

    // 3. Action: "Reconnect Cell X" or "Enable Cell X"
    const reconnectActionMatch = q.match(/(?:reconnect|enable|turn on|activate)\s*(?:cell)?\s*(\d+)/);
    if (reconnectActionMatch) {
      const cellId = parseInt(reconnectActionMatch[1]);
      if (cellId < 1 || cellId > cells.length) return `Cell ${cellId} does not exist.`;
      const cell = cells[cellId - 1];
      if (!cell.isIsolated) return `Cell ${cellId} is already connected.`;
      onReconnectCell(cellId);
      return `Command processed. Energizing L298N bypass bridge to reconnect Cell ${cellId} to the active current bus.`;
    }

    // 4. Query: "Health report", "pack health", "how is the battery"
    if (q.includes('health') || q.includes('report') || q.includes('status')) {
      const isolatedCells = cells.filter(c => c.isIsolated).map(c => c.id);
      const avgSoH = cells.reduce((sum, c) => sum + c.soh, 0) / cells.length;
      const thermalThreat = cells.some(c => c.temperature > 50 && !c.isIsolated);
      
      let statusStr = `Pack health is currently nominal with an average State of Health of ${avgSoH.toFixed(1)}%. `;
      if (isolatedCells.length > 0) {
        statusStr += `Notice: Cells [${isolatedCells.join(', ')}] have been physically isolated for safety. `;
      }
      if (thermalThreat) {
        statusStr += `Warning: An active thermal runaway hazard is detected. System is preparing load-balancing countermeasures.`;
      } else if (isolatedCells.length > 0) {
        statusStr += `Active bypass is routing current safely around isolated nodes, maintaining pack operations.`;
      } else {
        statusStr += `All 16 cells are operating within safe bounds.`;
      }
      return statusStr;
    }

    // 5. Query: "Second life", "reusable", "recycle"
    if (q.includes('second life') || q.includes('grade') || q.includes('reuse') || q.includes('recycle')) {
      const avgSoH = cells.reduce((sum, c) => sum + c.soh, 0) / cells.length;
      if (avgSoH >= 80) {
        return `The pack grade is classified as Grade A (Reusable). With an average State of Health of ${avgSoH.toFixed(1)}%, it is highly suitable for second-life applications such as grid storage or home backup solar batteries.`;
      } else if (avgSoH >= 65) {
        return `The pack grade is classified as Grade B (Repairable). Some cells have degraded. By replacing individual failed cells, the remaining modules can be refurbished for utility load shedding.`;
      } else {
        return `The pack grade is classified as Grade C (Recycle-only). Average State of Health is ${avgSoH.toFixed(1)}%, which is below the safe second-life threshold. Disassembly for raw element extraction is recommended.`;
      }
    }

    // 6. Query: "EU regulation", "passport", "law", "2027"
    if (q.includes('eu') || q.includes('passport') || q.includes('regulation') || q.includes('2027')) {
      return "Under EU Regulation 2027/918, all industrial and EV batteries must bear a Digital Battery Passport. This requires immutable logging of manufacturing details, active cycles, and SOH. Crucially, before handoff to a second-life user, the previous operator's credentials must be sanitized to protect corporate privacy while keeping the lifecycle degradation logs fully intact, which our dashboard fully handles.";
    }

    // Default conversational response
    return "I am scanning battery telemetry. You can ask me about cell health, why a cell was isolated, manual override commands (e.g. 'Isolate Cell 5'), or battery passport compliance regulations.";
  };

  return (
    <div className="card glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare className="text-blue-400" size={18} /> AI Voice Assistant
        </h3>
        <button
          onClick={() => setSpeakEnabled(!speakEnabled)}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          title={speakEnabled ? "Mute Speech Synthesis" : "Unmute Speech Synthesis"}
        >
          {speakEnabled ? <Volume2 size={18} className="text-blue-400" /> : <VolumeX size={18} />}
        </button>
      </div>

      {/* Chat Messages Log */}
      <div className="chat-messages" style={{ flexGrow: 1, overflowY: 'auto', maxHeight: '250px', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '5px', marginBottom: '15px' }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              maxWidth: '85%',
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row',
            }}
          >
            <div
              style={{
                background: msg.sender === 'user' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                border: msg.sender === 'user' ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                padding: '8px 12px',
                borderRadius: msg.sender === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                fontSize: '0.85rem',
                lineHeight: '1.4',
                color: '#e2e8f0',
              }}
            >
              {msg.text}
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: '4px', textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={startVoiceInput}
          style={{
            background: isListening ? '#ef4444' : 'rgba(255, 255, 255, 0.05)',
            border: isListening ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
            color: isListening ? 'white' : 'rgba(255,255,255,0.7)',
            borderRadius: '8px',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          className={isListening ? 'animate-pulse' : ''}
          title="Click to speak"
        >
          {isListening ? <MicOff size={16} /> : <Mic size={16} />}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={isListening ? "Listening..." : "Type battery questions..."}
          style={{
            flexGrow: 1,
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '0 12px',
            color: 'white',
            fontSize: '0.85rem',
            outline: 'none',
          }}
        />

        <button
          onClick={() => handleSend()}
          style={{
            background: '#3b82f6',
            border: 'none',
            color: 'white',
            borderRadius: '8px',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};
