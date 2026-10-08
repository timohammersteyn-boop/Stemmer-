import React, { useState } from 'react';
import { StemData, StemId } from '../../types';
import { ChevronLeft, X, SlidersHorizontal } from 'lucide-react';
import { FlatKnob } from '../FlatKnob';

interface StemEditOverlayProps {
  stem: StemData;
  onUpdateStem: (stemId: StemId, updates: Partial<StemData>) => void;
  onClose: () => void;
}

export const StemEditOverlay: React.FC<StemEditOverlayProps> = ({
  stem,
  onUpdateStem,
  onClose,
}) => {
  const [tab, setTab] = useState<'VOLUME' | 'EQ' | 'FILTER' | 'PAN'>('EQ');
  const [preset, setPreset] = useState('DRUMS CLARITY');

  const eqPresets: Record<string, { low: number; mid: number; high: number }> = {
    'DRUMS CLARITY': { low: 2, mid: -1, high: 3 },
    'BASS BOOST': { low: 5, mid: -2, high: -1 },
    'VOCAL PRESENCE': { low: -3, mid: 3, high: 2 },
    'FLAT': { low: 0, mid: 0, high: 0 },
  };

  const handleSelectPreset = (pName: string) => {
    setPreset(pName);
    if (eqPresets[pName]) {
      onUpdateStem(stem.id, { eq: eqPresets[pName] });
    }
  };

  // Convert EQ dB (-12 to +12) to SVG coordinate Y (0 is top = +12, 100 is mid = 0, 200 is bot = -12)
  const dbToY = (db: number) => {
    return 100 - (db / 12) * 80;
  };

  const lowY = dbToY(stem.eq.low);
  const midY = dbToY(stem.eq.mid);
  const highY = dbToY(stem.eq.high);

  // Direct Interactive Dragging on the 3-Band SVG
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [activeDragBand, setActiveDragBand] = useState<'low' | 'mid' | 'high' | null>(null);

  const handleSvgPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;

    // Determine target band by X coordinate
    let band: 'low' | 'mid' | 'high' = 'mid';
    if (relX < 0.35) band = 'low';
    else if (relX > 0.65) band = 'high';

    setActiveDragBand(band);
    (e.target as Element).setPointerCapture?.(e.pointerId);

    // Calculate dB from Y (top = +12 dB, center = 0 dB, bottom = -12 dB)
    const newDb = Math.max(-12, Math.min(12, Math.round((1 - relY * 2) * 12 * 10) / 10));
    onUpdateStem(stem.id, { eq: { ...stem.eq, [band]: newDb } });
  };

  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!activeDragBand || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const newDb = Math.max(-12, Math.min(12, Math.round((1 - relY * 2) * 12 * 10) / 10));
    onUpdateStem(stem.id, { eq: { ...stem.eq, [activeDragBand]: newDb } });
  };

  const handleSvgPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    setActiveDragBand(null);
    try {
      (e.target as Element).releasePointerCapture?.(e.pointerId);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#09090c] flex flex-col p-4 select-none animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: stem.accentColor }}
          />
          <span className="font-mono text-xs font-bold tracking-[0.2em] uppercase text-zinc-200">
            {stem.name} EDIT
          </span>
        </div>

        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Stem Waveform Graphic Strip */}
      <div className="my-3 h-16 bg-[#121217] rounded-xl border border-zinc-800/80 p-2 flex items-center justify-between gap-1 overflow-hidden">
        {Array.from({ length: 32 }).map((_, i) => {
          const pseudoHeight = 20 + Math.sin(i * 0.4) * 30 + (i % 4 === 0 ? 30 : 0);
          return (
            <div
              key={i}
              className="flex-1 rounded-full opacity-80"
              style={{
                height: `${pseudoHeight}%`,
                backgroundColor: stem.accentColor,
              }}
            />
          );
        })}
      </div>

      {/* 4 Tabs: VOLUME, EQ, FILTER, PAN */}
      <div className="grid grid-cols-4 gap-1.5 mb-4 shrink-0">
        {(['VOLUME', 'EQ', 'FILTER', 'PAN'] as const).map((t) => {
          const isSelected = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-2 px-1 rounded-xl font-mono text-[10px] font-bold tracking-wider uppercase transition active:scale-95 border ${
                isSelected
                  ? 'bg-zinc-100 text-zinc-950 border-white shadow-sm'
                  : 'bg-[#121216] text-zinc-400 border-zinc-800/80 hover:text-zinc-200'
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* Content based on Tab */}
      <div className="flex-1 flex flex-col justify-center min-h-0">
        {tab === 'EQ' && (
          <div className="flex flex-col items-center justify-between h-full py-2">
            {/* 3-Band Interactive SVG Shape Visualization (Low, Mid, High) */}
            <div className="relative w-full h-48 bg-[#101014] rounded-2xl border border-zinc-800/90 p-3 overflow-hidden shadow-inner">
              {/* dB Reference Grid & Labels */}
              <div className="absolute left-3 inset-y-3 flex flex-col justify-between font-mono text-[9px] text-zinc-500 pointer-events-none select-none z-10">
                <span className="text-zinc-400 font-semibold">+12 dB</span>
                <span className="text-zinc-500">0 dB</span>
                <span className="text-zinc-600">-12 dB</span>
              </div>

              {/* 3 Frequency Band Indicator Badges */}
              <div className="absolute inset-x-14 top-2.5 flex justify-between font-mono text-[9px] pointer-events-none select-none z-10">
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-900/90 border border-zinc-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                  <span className="text-zinc-300 font-bold">LOW</span>
                  <span className="text-zinc-500 font-medium">{stem.eq.low > 0 ? `+${stem.eq.low.toFixed(1)}` : stem.eq.low.toFixed(1)}</span>
                </div>

                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-900/90 border border-zinc-800">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stem.accentColor }} />
                  <span className="text-zinc-300 font-bold">MID</span>
                  <span className="text-zinc-500 font-medium">{stem.eq.mid > 0 ? `+${stem.eq.mid.toFixed(1)}` : stem.eq.mid.toFixed(1)}</span>
                </div>

                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-900/90 border border-zinc-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                  <span className="text-zinc-300 font-bold">HIGH</span>
                  <span className="text-zinc-500 font-medium">{stem.eq.high > 0 ? `+${stem.eq.high.toFixed(1)}` : stem.eq.high.toFixed(1)}</span>
                </div>
              </div>

              {/* Frequency Scale Labels */}
              <div className="absolute inset-x-12 bottom-1.5 flex justify-between font-mono text-[8px] text-zinc-600 pointer-events-none select-none z-10">
                <span>20 Hz</span>
                <span>100 Hz</span>
                <span>1 kHz</span>
                <span>10 kHz</span>
                <span>20 kHz</span>
              </div>

              {/* Center 0 dB dashed reference line */}
              <div className="absolute left-12 right-4 top-[50%] border-b border-zinc-800/80 border-dashed pointer-events-none" />

              {/* SVG 3-Band Reactive Shapes & Overall Response Curve */}
              <svg
                ref={svgRef}
                onPointerDown={handleSvgPointerDown}
                onPointerMove={handleSvgPointerMove}
                onPointerUp={handleSvgPointerUp}
                onPointerCancel={handleSvgPointerUp}
                className="w-full h-full pl-8 pb-3 pt-6 cursor-ns-resize touch-none"
                viewBox="0 0 320 160"
                preserveAspectRatio="none"
              >
                <defs>
                  {/* Low Band Gradient */}
                  <linearGradient id="lowBandGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f4f4f5" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#f4f4f5" stopOpacity="0.0" />
                  </linearGradient>

                  {/* Mid Band Gradient */}
                  <linearGradient id="midBandGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={stem.accentColor} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={stem.accentColor} stopOpacity="0.0" />
                  </linearGradient>

                  {/* High Band Gradient */}
                  <linearGradient id="highBandGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                  </linearGradient>

                  {/* Glow filter */}
                  <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={stem.accentColor} floodOpacity="0.6" />
                  </filter>
                </defs>

                {/* 1. Low Band Reactive SVG Shape (Shelf / Area, x: 0 to 120) */}
                <path
                  d={`M 0,80 L 0,${lowY * 0.8} C 35,${lowY * 0.8} 65,${lowY * 0.8} 85,${(lowY * 0.8 + 80) / 2} C 105,80 115,80 120,80 Z`}
                  fill="url(#lowBandGrad)"
                  opacity="0.8"
                />
                <path
                  d={`M 0,${lowY * 0.8} C 35,${lowY * 0.8} 65,${lowY * 0.8} 85,${(lowY * 0.8 + 80) / 2} C 105,80 115,80 120,80`}
                  fill="none"
                  stroke="#f4f4f5"
                  strokeWidth="1.5"
                  strokeDasharray="2 3"
                  opacity="0.6"
                />

                {/* 2. Mid Band Reactive SVG Shape (Bell / Gaussian Curve, x: 80 to 240) */}
                <path
                  d={`M 90,80 C 120,80 135,${midY * 0.8} 160,${midY * 0.8} C 185,${midY * 0.8} 200,80 230,80 Z`}
                  fill="url(#midBandGrad)"
                  opacity="0.9"
                />
                <path
                  d={`M 90,80 C 120,80 135,${midY * 0.8} 160,${midY * 0.8} C 185,${midY * 0.8} 200,80 230,80`}
                  fill="none"
                  stroke={stem.accentColor}
                  strokeWidth="1.5"
                  strokeDasharray="2 3"
                  opacity="0.6"
                />

                {/* 3. High Band Reactive SVG Shape (Shelf / Area, x: 200 to 320) */}
                <path
                  d={`M 200,80 C 215,80 225,80 240,${(highY * 0.8 + 80) / 2} C 260,${highY * 0.8} 290,${highY * 0.8} 320,${highY * 0.8} L 320,80 Z`}
                  fill="url(#highBandGrad)"
                  opacity="0.8"
                />
                <path
                  d={`M 200,80 C 215,80 225,80 240,${(highY * 0.8 + 80) / 2} C 260,${highY * 0.8} 290,${highY * 0.8} 320,${highY * 0.8}`}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  strokeDasharray="2 3"
                  opacity="0.6"
                />

                {/* 4. Combined 3-Band Master Sum Response Curve */}
                <path
                  d={`M 0,${lowY * 0.8} C 40,${lowY * 0.8} 110,${midY * 0.8} 160,${midY * 0.8} C 210,${midY * 0.8} 270,${highY * 0.8} 320,${highY * 0.8}`}
                  fill="none"
                  stroke={stem.accentColor}
                  strokeWidth="3"
                  filter="url(#glowFilter)"
                />

                {/* Band 1 Center Node (Low: 100Hz) */}
                <circle cx="50" cy={lowY * 0.8} r="6.5" fill="#18181b" stroke="#f4f4f5" strokeWidth="2.5" />
                <circle cx="50" cy={lowY * 0.8} r="2.5" fill="#f4f4f5" />

                {/* Band 2 Center Node (Mid: 1.2kHz) */}
                <circle cx="160" cy={midY * 0.8} r="7.5" fill="#18181b" stroke={stem.accentColor} strokeWidth="3" />
                <circle cx="160" cy={midY * 0.8} r="3" fill={stem.accentColor} />

                {/* Band 3 Center Node (High: 8kHz) */}
                <circle cx="270" cy={highY * 0.8} r="6.5" fill="#18181b" stroke="#38bdf8" strokeWidth="2.5" />
                <circle cx="270" cy={highY * 0.8} r="2.5" fill="#38bdf8" />
              </svg>
            </div>

            {/* 3 Parametric Knobs (LOW, MID, HIGH) */}
            <div className="grid grid-cols-3 gap-3 w-full my-3">
              <div className="flex flex-col items-center bg-[#131318] p-2.5 rounded-xl border border-zinc-800">
                <FlatKnob
                  value={Math.round(stem.eq.low + 12)}
                  min={0}
                  max={24}
                  onChange={(v) => onUpdateStem(stem.id, { eq: { ...stem.eq, low: v - 12 } })}
                  size="sm"
                  accentColor={stem.accentColor}
                />
                <span className="font-mono text-[9px] font-bold text-zinc-400 mt-1 uppercase">LOW</span>
                <span className="font-mono text-[10px] text-zinc-200">
                  {stem.eq.low > 0 ? `+${stem.eq.low.toFixed(1)}` : stem.eq.low.toFixed(1)} dB
                </span>
              </div>

              <div className="flex flex-col items-center bg-[#131318] p-2.5 rounded-xl border border-zinc-800">
                <FlatKnob
                  value={Math.round(stem.eq.mid + 12)}
                  min={0}
                  max={24}
                  onChange={(v) => onUpdateStem(stem.id, { eq: { ...stem.eq, mid: v - 12 } })}
                  size="sm"
                  accentColor={stem.accentColor}
                />
                <span className="font-mono text-[9px] font-bold text-zinc-400 mt-1 uppercase">MID</span>
                <span className="font-mono text-[10px] text-zinc-200">
                  {stem.eq.mid > 0 ? `+${stem.eq.mid.toFixed(1)}` : stem.eq.mid.toFixed(1)} dB
                </span>
              </div>

              <div className="flex flex-col items-center bg-[#131318] p-2.5 rounded-xl border border-zinc-800">
                <FlatKnob
                  value={Math.round(stem.eq.high + 12)}
                  min={0}
                  max={24}
                  onChange={(v) => onUpdateStem(stem.id, { eq: { ...stem.eq, high: v - 12 } })}
                  size="sm"
                  accentColor={stem.accentColor}
                />
                <span className="font-mono text-[9px] font-bold text-zinc-400 mt-1 uppercase">HIGH</span>
                <span className="font-mono text-[10px] text-zinc-200">
                  {stem.eq.high > 0 ? `+${stem.eq.high.toFixed(1)}` : stem.eq.high.toFixed(1)} dB
                </span>
              </div>
            </div>

            {/* Preset Selector */}
            <div className="w-full flex items-center justify-between p-3 rounded-xl bg-[#131318] border border-zinc-800">
              <span className="font-mono text-[10px] font-bold text-zinc-400 uppercase">
                EQ PRESET
              </span>
              <select
                value={preset}
                onChange={(e) => handleSelectPreset(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 text-zinc-200 font-mono text-xs px-2.5 py-1.5 rounded-lg focus:outline-none"
              >
                {Object.keys(eqPresets).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {tab === 'VOLUME' && (
          <div className="flex flex-col items-center justify-center p-6 bg-[#111115] rounded-2xl border border-zinc-800">
            <span className="font-mono text-xs font-bold text-zinc-400 uppercase mb-2">
              STEM TRIM
            </span>
            <span className="font-mono text-3xl font-extrabold text-zinc-100 mb-6">
              {Math.round(stem.volume * 100)}%
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={stem.volume}
              onChange={(e) => onUpdateStem(stem.id, { volume: parseFloat(e.target.value) })}
              className="w-full max-w-xs accent-zinc-100 h-2 bg-zinc-800 rounded-lg cursor-pointer"
            />
          </div>
        )}

        {tab === 'FILTER' && (
          <div className="flex flex-col items-center justify-center p-6 bg-[#111115] rounded-2xl border border-zinc-800">
            <FlatKnob
              value={Math.round(stem.filter * 100)}
              onChange={(v) => onUpdateStem(stem.id, { filter: v / 100 })}
              size="lg"
              label="HPF / LPF DUAL"
              accentColor={stem.accentColor}
            />
            <span className="font-mono text-xs text-zinc-400 mt-4">
              {stem.filter < 0.48 ? 'LOW-PASS ACTIVE' : stem.filter > 0.52 ? 'HIGH-PASS ACTIVE' : 'BYPASS FLAT'}
            </span>
          </div>
        )}

        {tab === 'PAN' && (
          <div className="flex flex-col items-center justify-center p-6 bg-[#111115] rounded-2xl border border-zinc-800">
            <span className="font-mono text-xs font-bold text-zinc-400 uppercase mb-2">
              STEREO PAN
            </span>
            <span className="font-mono text-3xl font-extrabold text-zinc-100 mb-6">
              {stem.pan === 0 ? 'CENTER' : stem.pan < 0 ? `L ${Math.abs(Math.round(stem.pan * 100))}` : `R ${Math.round(stem.pan * 100)}`}
            </span>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.05"
              value={stem.pan}
              onChange={(e) => onUpdateStem(stem.id, { pan: parseFloat(e.target.value) })}
              className="w-full max-w-xs accent-zinc-100 h-2 bg-zinc-800 rounded-lg cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* Done Button */}
      <button
        onClick={onClose}
        className="w-full py-3.5 mt-3 rounded-2xl bg-zinc-100 hover:bg-white text-zinc-950 font-mono text-xs font-bold tracking-widest uppercase active:scale-[0.98] transition shadow-md shrink-0"
      >
        FERTIG / SCHLIEßEN
      </button>
    </div>
  );
};
