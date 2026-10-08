import React from 'react';
import { X, Sparkles, Check, Flame, Music } from 'lucide-react';
import { TrackData } from '../../types';
import { checkHarmonicCompatibility } from '../../utils/harmonicKeys';
import { triggerHaptic } from '../../utils/haptics';

interface CamelotWheelModalProps {
  currentMasterKey: string;
  tracks: TrackData[];
  onSelectTrackKey?: (key: string) => void;
  onClose: () => void;
}

// 12 Camelot positions: 1 to 12
// Angles: 1 is top-ish (e.g. 30 deg each)
// 12 is at top (0 deg or -90 deg like a clock)
const CAMELOT_NUMBERS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

const KEY_NAMES: Record<string, { minor: string; major: string; color: string }> = {
  '1': { minor: 'G#m', major: 'B', color: '#10b981' },
  '2': { minor: 'D#m', major: 'F#', color: '#06b6d4' },
  '3': { minor: 'A#m', major: 'C#', color: '#3b82f6' },
  '4': { minor: 'Fm', major: 'G#', color: '#6366f1' },
  '5': { minor: 'Cm', major: 'D#', color: '#8b5cf6' },
  '6': { minor: 'Gm', major: 'A#', color: '#ec4899' },
  '7': { minor: 'Dm', major: 'F', color: '#f43f5e' },
  '8': { minor: 'Am', major: 'C', color: '#ef4444' },
  '9': { minor: 'Em', major: 'G', color: '#f97316' },
  '10': { minor: 'Bm', major: 'D', color: '#f59e0b' },
  '11': { minor: 'F#m', major: 'A', color: '#eab308' },
  '12': { minor: 'C#m', major: 'E', color: '#84cc16' },
};

export const CamelotWheelModal: React.FC<CamelotWheelModalProps> = ({
  currentMasterKey,
  tracks,
  onSelectTrackKey,
  onClose,
}) => {
  const cleanMaster = (currentMasterKey || '8A').trim().toUpperCase();
  const masterNum = parseInt(cleanMaster, 10) || 8;
  const masterLetter = cleanMaster.slice(-1) || 'A';

  // Count tracks per key
  const trackCounts = React.useMemo(() => {
    const map: Record<string, number> = {};
    tracks.forEach((t) => {
      const k = (t.key || '8A').trim().toUpperCase();
      map[k] = (map[k] || 0) + 1;
    });
    return map;
  }, [tracks]);

  // Compatibility helper
  const getCompatibilityType = (keyStr: string): 'MASTER' | 'PERFECT' | 'RELATIVE' | 'ADJACENT' | 'ENERGY_BOOST' | 'CLASH' => {
    if (keyStr === cleanMaster) return 'MASTER';
    const res = checkHarmonicCompatibility(cleanMaster, keyStr);
    return res.level;
  };

  const handleKeyClick = (keyStr: string) => {
    triggerHaptic('tap');
    onSelectTrackKey?.(keyStr);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in duration-150 select-none">
      <div className="bg-[#0e0e13] border border-zinc-800 rounded-2xl w-full max-w-md max-h-[95vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-mono text-xs font-black text-white tracking-wider uppercase">
                CAMELOT HARMONIC WHEEL
              </h2>
              <p className="text-[10px] font-mono text-zinc-400">
                Master Deck Key:{' '}
                <span className="text-emerald-400 font-bold">{cleanMaster}</span> (
                {masterLetter === 'A' ? KEY_NAMES[String(masterNum)]?.minor : KEY_NAMES[String(masterNum)]?.major}
                )
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic('tap');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition active:scale-95"
            aria-label="Schließen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content: SVG Wheel and Legend */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center gap-4">
          {/* Wheel Graphic */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 shrink-0">
            <svg viewBox="-150 -150 300 300" className="w-full h-full transform -rotate-90">
              {/* Outer Ring: Major B keys (radius 105 to 140) */}
              {CAMELOT_NUMBERS.map((num, i) => {
                const angleDeg = (i * 30);
                const startAngle = (angleDeg - 15) * (Math.PI / 180);
                const endAngle = (angleDeg + 15) * (Math.PI / 180);
                const rInner = 100;
                const rOuter = 140;

                const x1 = rInner * Math.cos(startAngle);
                const y1 = rInner * Math.sin(startAngle);
                const x2 = rOuter * Math.cos(startAngle);
                const y2 = rOuter * Math.sin(startAngle);
                const x3 = rOuter * Math.cos(endAngle);
                const y3 = rOuter * Math.sin(endAngle);
                const x4 = rInner * Math.cos(endAngle);
                const y4 = rInner * Math.sin(endAngle);

                const keyName = `${num}B`;
                const compat = getCompatibilityType(keyName);
                const count = trackCounts[keyName] || 0;

                let fill = '#16161d';
                let stroke = '#27272a';
                if (compat === 'MASTER') {
                  fill = '#059669';
                  stroke = '#34d399';
                } else if (compat === 'RELATIVE') {
                  fill = '#0891b2';
                  stroke = '#22d3ee';
                } else if (compat === 'ADJACENT') {
                  fill = '#0284c7';
                  stroke = '#38bdf8';
                } else if (compat === 'ENERGY_BOOST') {
                  fill = '#d97706';
                  stroke = '#fbbf24';
                }

                // Mid point for text
                const midAngle = angleDeg * (Math.PI / 180);
                const textR = 120;
                const tx = textR * Math.cos(midAngle);
                const ty = textR * Math.sin(midAngle);

                return (
                  <g
                    key={`major-${num}`}
                    onClick={() => handleKeyClick(keyName)}
                    className="cursor-pointer transition-opacity hover:opacity-80"
                  >
                    <path
                      d={`M ${x1} ${y1} L ${x2} ${y2} A ${rOuter} ${rOuter} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${rInner} ${rInner} 0 0 0 ${x1} ${y1} Z`}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth="1.5"
                    />
                    <text
                      x={tx}
                      y={ty}
                      transform={`rotate(${angleDeg + 90}, ${tx}, ${ty})`}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="font-mono text-[9px] font-black fill-white select-none pointer-events-none"
                    >
                      {keyName}
                    </text>
                  </g>
                );
              })}

              {/* Inner Ring: Minor A keys (radius 55 to 98) */}
              {CAMELOT_NUMBERS.map((num, i) => {
                const angleDeg = (i * 30);
                const startAngle = (angleDeg - 15) * (Math.PI / 180);
                const endAngle = (angleDeg + 15) * (Math.PI / 180);
                const rInner = 60;
                const rOuter = 98;

                const x1 = rInner * Math.cos(startAngle);
                const y1 = rInner * Math.sin(startAngle);
                const x2 = rOuter * Math.cos(startAngle);
                const y2 = rOuter * Math.sin(startAngle);
                const x3 = rOuter * Math.cos(endAngle);
                const y3 = rOuter * Math.sin(endAngle);
                const x4 = rInner * Math.cos(endAngle);
                const y4 = rInner * Math.sin(endAngle);

                const keyName = `${num}A`;
                const compat = getCompatibilityType(keyName);
                const count = trackCounts[keyName] || 0;

                let fill = '#121218';
                let stroke = '#27272a';
                if (compat === 'MASTER') {
                  fill = '#10b981';
                  stroke = '#6ee7b7';
                } else if (compat === 'RELATIVE') {
                  fill = '#06b6d4';
                  stroke = '#67e8f9';
                } else if (compat === 'ADJACENT') {
                  fill = '#38bdf8';
                  stroke = '#93c5fd';
                } else if (compat === 'ENERGY_BOOST') {
                  fill = '#f59e0b';
                  stroke = '#fde68a';
                }

                // Mid point for text
                const midAngle = angleDeg * (Math.PI / 180);
                const textR = 79;
                const tx = textR * Math.cos(midAngle);
                const ty = textR * Math.sin(midAngle);

                return (
                  <g
                    key={`minor-${num}`}
                    onClick={() => handleKeyClick(keyName)}
                    className="cursor-pointer transition-opacity hover:opacity-80"
                  >
                    <path
                      d={`M ${x1} ${y1} L ${x2} ${y2} A ${rOuter} ${rOuter} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${rInner} ${rInner} 0 0 0 ${x1} ${y1} Z`}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth="1.5"
                    />
                    <text
                      x={tx}
                      y={ty}
                      transform={`rotate(${angleDeg + 90}, ${tx}, ${ty})`}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="font-mono text-[9px] font-black fill-white select-none pointer-events-none"
                    >
                      {keyName}
                    </text>
                  </g>
                );
              })}

              {/* Center Hub */}
              <circle cx="0" cy="0" r="56" fill="#09090c" stroke="#27272a" strokeWidth="2" />
              <text
                x="0"
                y="-10"
                textAnchor="middle"
                className="font-mono text-[10px] font-bold fill-zinc-400 select-none pointer-events-none"
                transform="rotate(90)"
              >
                MASTER
              </text>
              <text
                x="0"
                y="10"
                textAnchor="middle"
                className="font-mono text-sm font-black fill-emerald-400 select-none pointer-events-none"
                transform="rotate(90)"
              >
                {cleanMaster}
              </text>
            </svg>
          </div>

          {/* Compatibility Legend */}
          <div className="w-full grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/40">
              <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <div className="flex flex-col">
                <span className="font-bold text-emerald-200">ACTIVE / MATCH</span>
                <span className="text-[9px] text-zinc-400">Gleiche Tonart (100% harmonisch)</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-sky-950/40 border border-sky-500/40">
              <span className="w-3 h-3 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
              <div className="flex flex-col">
                <span className="font-bold text-sky-200">ADJACENT (±1)</span>
                <span className="text-[9px] text-zinc-400">Nahtloser Stufenübergang</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/40">
              <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              <div className="flex flex-col">
                <span className="font-bold text-cyan-200">RELATIVE (A ⇄ B)</span>
                <span className="text-[9px] text-zinc-400">Parallele Dur / Moll Modulation</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-950/40 border border-amber-500/40">
              <span className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
              <div className="flex flex-col">
                <span className="font-bold text-amber-200">ENERGY BOOST (+2)</span>
                <span className="text-[9px] text-zinc-400">Dynamische Stimmungsanhebung</span>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-zinc-400 font-mono text-center">
            Tippe auf ein Kreissegment, um die Library sofort nach dieser Tonart zu filtern.
          </p>
        </div>
      </div>
    </div>
  );
};
