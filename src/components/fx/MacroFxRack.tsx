import React, { useState, useEffect } from 'react';
import { StemData, StemId } from '../../types';
import { audioEngine } from '../../services/audioEngine';
import { FlatKnob } from '../FlatKnob';
import { Sparkles, Sliders, Zap, Check, RotateCcw, Flame, Waves, Radio } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

interface MacroFxRackProps {
  stems: StemData[];
  onUpdateStemSend: (stemId: StemId, sendAmount: number) => void;
  bpm?: number;
  onLogActivity?: (category: 'RECORD', message: string, color?: string) => void;
}

export type MacroProfile = 'BUILD_UP_RISER' | 'DUB_WASHOUT' | 'GLITCH_CRUSH' | 'SUB_DROP';

export const MacroFxRack: React.FC<MacroFxRackProps> = ({
  stems,
  onUpdateStemSend,
  bpm = 128,
  onLogActivity,
}) => {
  const [macroValue, setMacroValue] = useState<number>(0); // 0 to 100%
  const [profile, setProfile] = useState<MacroProfile>('BUILD_UP_RISER');

  // Toggle stems affected by this macro
  const [affectedStems, setAffectedStems] = useState<Record<StemId, boolean>>({
    drums: false,
    bass: false,
    music: true,
    vocal: true,
  });

  const toggleStem = (stemId: StemId) => {
    triggerHaptic('tap');
    setAffectedStems((prev) => ({
      ...prev,
      [stemId]: !prev[stemId],
    }));
  };

  const handleMacroChange = (val: number) => {
    setMacroValue(val);
    const norm = val / 100;

    // Apply combined parameters to all assigned stems
    stems.forEach((stem) => {
      if (!affectedStems[stem.id]) {
        // Return to neutral if not affected
        return;
      }

      switch (profile) {
        case 'BUILD_UP_RISER': {
          // Sweeps High-Pass Filter from 0.5 (neutral) up to 0.95 + Ramps Reverb/Send from 0 to 0.95
          const filterVal = 0.5 + norm * 0.45;
          const sendVal = norm * 0.9;
          audioEngine.setStemFilter(stem.id, filterVal);
          audioEngine.setStemSend(stem.id, sendVal);
          onUpdateStemSend(stem.id, sendVal);
          break;
        }
        case 'DUB_WASHOUT': {
          // Sweeps Low-Pass Filter down from 0.5 to 0.05 + Ramps Tape Echo Send from 0 to 0.85
          const filterVal = 0.5 - norm * 0.45;
          const sendVal = norm * 0.85;
          audioEngine.setStemFilter(stem.id, filterVal);
          audioEngine.setStemSend(stem.id, sendVal);
          onUpdateStemSend(stem.id, sendVal);
          break;
        }
        case 'GLITCH_CRUSH': {
          // Bandpass resonant shift + Drive send
          const filterVal = 0.5 + Math.sin(norm * Math.PI) * 0.35;
          const sendVal = norm * 0.8;
          audioEngine.setStemFilter(stem.id, filterVal);
          audioEngine.setStemSend(stem.id, sendVal);
          onUpdateStemSend(stem.id, sendVal);
          break;
        }
        case 'SUB_DROP': {
          // Drops highs/mids, preserves heavy low end
          const filterVal = 0.5 - norm * 0.35;
          const sendVal = (1 - norm) * 0.3;
          audioEngine.setStemFilter(stem.id, filterVal);
          audioEngine.setStemSend(stem.id, sendVal);
          onUpdateStemSend(stem.id, sendVal);
          break;
        }
      }
    });

    if (val === 100) {
      triggerHaptic('heavy');
      onLogActivity?.('RECORD', `Macro-FX Peak Reached (100% ${profile})`, '#f43f5e');
    }
  };

  const handleReset = () => {
    triggerHaptic('tap');
    setMacroValue(0);
    // Reset affected stems to neutral
    stems.forEach((stem) => {
      audioEngine.setStemFilter(stem.id, 0.5);
      audioEngine.setStemSend(stem.id, stem.send);
    });
  };

  // Calculate live sub-parameter values for visual gauges
  const norm = macroValue / 100;
  const filterCutoffPct = profile === 'BUILD_UP_RISER'
    ? Math.round((0.5 + norm * 0.45) * 100)
    : profile === 'DUB_WASHOUT'
    ? Math.round((0.5 - norm * 0.45) * 100)
    : Math.round((0.5 + Math.sin(norm * Math.PI) * 0.35) * 100);

  const reverbWetPct = Math.round(norm * 90);
  const delayFeedbackPct = Math.round(norm * 75);
  const resonancePct = Math.round(norm * 60);

  return (
    <div className="flex-1 flex flex-col justify-between p-3 bg-[#0d0d12] border border-zinc-800/80 rounded-2xl select-none">
      {/* Header Profile Switcher */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-mono text-[10px] font-black text-white">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>MACRO-FX BUILD-UP CONTROLLER</span>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white font-mono text-[8px] active:scale-95 transition"
            title="Macro auf 0% zurücksetzen"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>RESET</span>
          </button>
        </div>

        {/* Macro Preset Selection Pills */}
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { id: 'BUILD_UP_RISER', label: 'RISER', desc: 'HPF + Verb + Delay' },
            { id: 'DUB_WASHOUT', label: 'WASHOUT', desc: 'LPF + Tape Echo' },
            { id: 'GLITCH_CRUSH', label: 'GLITCH', desc: 'Drive + Resonator' },
            { id: 'SUB_DROP', label: 'SUB DROP', desc: 'Bass Focus + Kill' },
          ].map((p) => {
            const isSel = profile === p.id;
            return (
              <button
                key={p.id}
                onClick={() => {
                  triggerHaptic('tap');
                  setProfile(p.id as MacroProfile);
                  setMacroValue(0);
                }}
                className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl border font-mono transition active:scale-95 ${
                  isSel
                    ? 'bg-amber-400 text-black border-amber-300 font-black shadow-[0_0_12px_rgba(251,191,36,0.5)]'
                    : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                <span className="text-[9px] font-extrabold">{p.label}</span>
                <span className="text-[6.5px] opacity-75 truncate">{p.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Center Stage: Giant Tactile Macro Knob & Gauge Breakdown */}
      <div className="flex items-center justify-around py-3">
        {/* Large Macro Knob */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="relative p-2 rounded-full bg-black/60 border border-amber-500/30 shadow-[0_0_20px_rgba(251,191,36,0.15)]">
            <FlatKnob
              value={macroValue}
              min={0}
              max={100}
              onChange={handleMacroChange}
              size="lg"
              label="MACRO"
              accentColor={macroValue > 80 ? '#f43f5e' : macroValue > 40 ? '#f59e0b' : '#38bdf8'}
              unit="%"
            />
          </div>
          <span className="font-mono text-[9px] font-bold text-amber-300 tracking-wider">
            {profile.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Real-time Sub-parameter Gauges */}
        <div className="flex flex-col gap-2 w-36 sm:w-44 font-mono text-[8px]">
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between text-zinc-400">
              <span>FILTER CUTOFF</span>
              <span className="text-sky-300 font-bold">{filterCutoffPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
              <div
                className="h-full bg-sky-400 transition-all duration-75"
                style={{ width: `${filterCutoffPct}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between text-zinc-400">
              <span>REVERB WETNESS</span>
              <span className="text-purple-300 font-bold">{reverbWetPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
              <div
                className="h-full bg-purple-400 transition-all duration-75"
                style={{ width: `${reverbWetPct}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between text-zinc-400">
              <span>DELAY FEEDBACK</span>
              <span className="text-emerald-300 font-bold">{delayFeedbackPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
              <div
                className="h-full bg-emerald-400 transition-all duration-75"
                style={{ width: `${delayFeedbackPct}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between text-zinc-400">
              <span>RESONANCE / DRIVE</span>
              <span className="text-rose-400 font-bold">{resonancePct}%</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
              <div
                className="h-full bg-rose-400 transition-all duration-75"
                style={{ width: `${resonancePct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stem Assignment Toggles (Drums, Bass, Music, Vocal) */}
      <div className="p-2 bg-black/60 border border-zinc-800 rounded-xl flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[8px] font-mono font-bold text-zinc-400 px-1">
          <span>ASSIGN STEMS AFFECTED BY MACRO:</span>
          <span className="text-amber-400">
            {Object.values(affectedStems).filter(Boolean).length} / 4 ACTIVE
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {stems.map((stem) => {
            const isAssigned = affectedStems[stem.id];
            return (
              <button
                key={stem.id}
                onClick={() => toggleStem(stem.id)}
                className={`py-1.5 px-2 rounded-lg font-mono text-[9px] font-black uppercase transition-all duration-100 active:scale-95 border flex items-center justify-between ${
                  isAssigned
                    ? 'border-white text-white shadow-sm'
                    : 'bg-zinc-900/60 text-zinc-500 border-zinc-800 hover:border-zinc-700'
                }`}
                style={{
                  backgroundColor: isAssigned ? stem.accentColor : undefined,
                  color: isAssigned ? '#000000' : undefined,
                }}
                title={`Macro-Effekt auf ${stem.name} ${isAssigned ? 'aktiviert' : 'deaktiviert'}`}
              >
                <span>{stem.name}</span>
                {isAssigned && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
