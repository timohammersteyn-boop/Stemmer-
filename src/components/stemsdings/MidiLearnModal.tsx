import React, { useState, useEffect } from 'react';
import { X, Cpu, Check, Activity, RefreshCw } from 'lucide-react';
import { torsoS4Engine } from '../../services/torsoS4AudioEngine';

interface MidiLearnModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MidiLearnModal: React.FC<MidiLearnModalProps> = ({ isOpen, onClose }) => {
  const [midiLogs, setMidiLogs] = useState<string[]>([]);
  const [selectedParam, setSelectedParam] = useState<string>('filterCutoff');
  const [learningCc, setLearningCc] = useState<number | null>(null);
  const [statusMsg, setStatusMsg] = useState<string>('PLUG-AND-PLAY: USB MIDI PORTS ACTIVE');

  useEffect(() => {
    if (!isOpen) return;
    const unsub = torsoS4Engine.onMidiLog((log) => {
      setMidiLogs((prev) => [log, ...prev.slice(0, 10)]);
    });
    return unsub;
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLearnCc = (cc: number) => {
    torsoS4Engine.saveMidiMapping(cc, selectedParam);
    setStatusMsg(`SUCCESS: CC #${cc} MAPPED TO ${selectedParam.toUpperCase()}`);
    setTimeout(() => setStatusMsg('LISTENING FOR ENCODER MOVEMENTS...'), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none font-mono">
      <div className="w-full max-w-lg bg-[#0B0B0C] border border-[#282A2E] p-4 flex flex-col gap-3 text-[#E4E7EB]">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#282A2E]">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#00E5FF]" />
            <span className="text-xs font-bold tracking-wider text-[#F9F6F0]">
              HARDWARE INTEGRATION & MIDI LEARN
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#161719] border border-[#282A2E] text-[#8E9296] hover:text-[#E4E7EB]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status */}
        <div className="p-2.5 bg-[#161719] border border-[#282A2E] flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse" />
            <span className="font-bold text-[#E4E7EB]">{statusMsg}</span>
          </div>
          <span className="text-[9px] text-[#8E9296]">AUTO-DETECT ON</span>
        </div>

        {/* Explainer */}
        <div className="text-[10px] text-[#8E9296] leading-relaxed">
          Native Instruments Traktor X1/Z1 or custom USB controllers (Teensy 4.1 / Arduino) are automatically armed in the background without configuration menus.
        </div>

        {/* Quick Mapping Selector */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-[#8E9296]">TARGET PARAMETER TO MAP:</span>
          <select
            value={selectedParam}
            onChange={(e) => setSelectedParam(e.target.value)}
            className="bg-[#161719] border border-[#282A2E] text-[#E4E7EB] px-2 py-1.5 text-xs focus:outline-none"
          >
            <option value="filterCutoff">FILTER CUTOFF (ENCODER 1)</option>
            <option value="filterResonance">FILTER RESONANCE (ENCODER 2)</option>
            <option value="granularSpray">GRANULAR SPRAY (ENCODER 3)</option>
            <option value="grainSize">GRAIN SIZE (ENCODER 4)</option>
            <option value="tapeSpeed">TAPE SPEED / VARISPEED (ENCODER 5)</option>
            <option value="colorDrive">COLOR DRIVE (ENCODER 6)</option>
            <option value="delayFeedback">DELAY FEEDBACK (ENCODER 7)</option>
            <option value="reverbRoomSize">REVERB ROOM SIZE (ENCODER 8)</option>
            <option value="crossfader">DJ CROSSFADER (FADER)</option>
          </select>
        </div>

        {/* Quick Simulated CC Test Triggers for testing without hardware */}
        <div className="flex flex-col gap-1">
          <span className="text-[9px] text-[#8E9296]">SIMULATE ENCODER CC TEST INPUT:</span>
          <div className="grid grid-cols-4 gap-1.5">
            {[16, 17, 18, 19, 20, 21, 22, 23].map((cc) => (
              <button
                key={cc}
                onClick={() => handleLearnCc(cc)}
                className="py-1.5 bg-[#161719] border border-[#282A2E] text-[10px] font-bold text-[#E4E7EB] hover:border-[#00E5FF] hover:text-[#00E5FF] transition-colors"
              >
                CC #{cc}
              </button>
            ))}
          </div>
        </div>

        {/* Hardware Monitor Logs */}
        <div className="flex flex-col gap-1">
          <span className="text-[9px] text-[#8E9296]">LIVE MIDI PORT ACTIVITY LOG:</span>
          <div className="h-24 bg-[#161719] border border-[#282A2E] p-2 overflow-y-auto text-[9px] text-[#8E9296] font-mono flex flex-col gap-1">
            {midiLogs.length === 0 ? (
              <div className="text-[#8E9296] italic">Ready. Connect any USB MIDI controller to verify events.</div>
            ) : (
              midiLogs.map((log, i) => <div key={i}>&gt; {log}</div>)
            )}
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-2 bg-[#E4E7EB] text-[#0B0B0C] font-bold text-xs tracking-wider border border-[#E4E7EB] hover:bg-white transition-colors"
        >
          DONE
        </button>
      </div>
    </div>
  );
};
