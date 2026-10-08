import React from 'react';
import { ChevronLeft, ChevronRight, ArrowLeftRight, Sliders } from 'lucide-react';

export type CrossfaderCurve = 'SMOOTH' | 'LINEAR' | 'CUT';

interface CrossfaderProps {
  value: number; // 0.0 (Deck A) to 1.0 (Deck B)
  onChange: (value: number) => void;
  deckATitle?: string;
  deckBTitle?: string;
  deckABpm?: number;
  deckBBpm?: number;
  onSwapDecks?: () => void;
  className?: string;
  curve?: CrossfaderCurve;
  onCurveChange?: (curve: CrossfaderCurve) => void;
}

export const Crossfader: React.FC<CrossfaderProps> = ({
  value,
  onChange,
  deckATitle = 'Deck A',
  deckBTitle = 'Deck B',
  deckABpm = 128,
  deckBBpm = 125,
  onSwapDecks,
  className = '',
  curve = 'SMOOTH',
  onCurveChange,
}) => {
  const clampedValue = Math.max(0, Math.min(1, value));

  // Compute Volume Percentages based on chosen curve
  let deckAVolume = 1.0;
  let deckBVolume = 1.0;

  if (curve === 'SMOOTH') {
    // Constant-power cosine/sine crossfader (DJ industry standard -3dB center)
    deckAVolume = Math.cos(clampedValue * 0.5 * Math.PI);
    deckBVolume = Math.sin(clampedValue * 0.5 * Math.PI);
  } else if (curve === 'LINEAR') {
    deckAVolume = 1.0 - clampedValue;
    deckBVolume = clampedValue;
  } else if (curve === 'CUT') {
    // Scratch DJ sharp cut curve
    deckAVolume = clampedValue > 0.92 ? 0 : 1.0;
    deckBVolume = clampedValue < 0.08 ? 0 : 1.0;
  }

  const deckAPct = Math.round(deckAVolume * 100);
  const deckBPct = Math.round(deckBVolume * 100);

  const isFullA = clampedValue <= 0.02;
  const isFullB = clampedValue >= 0.98;
  const isCenter = Math.abs(clampedValue - 0.5) < 0.03;

  return (
    <div
      className={`p-2.5 sm:p-3 rounded-2xl bg-[#0d0d12] border border-zinc-800/90 shadow-lg select-none ${className}`}
      role="region"
      aria-label="Master DJ Crossfader"
    >
      {/* Top Header: Deck A Info, Center Detent Indicator, Deck B Info */}
      <div className="flex items-center justify-between gap-2 mb-2">
        {/* Deck A Status Card */}
        <button
          type="button"
          onClick={() => onChange(0.0)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-left transition active:scale-95 cursor-pointer max-w-[42%] ${
            isFullA
              ? 'bg-blue-500/20 text-blue-300 border-blue-500/60 shadow-[0_0_12px_rgba(59,130,246,0.35)]'
              : clampedValue < 0.5
              ? 'bg-zinc-900 text-zinc-200 border-zinc-700/80'
              : 'bg-zinc-950/70 text-zinc-500 border-zinc-850'
          }`}
          title="Schnellsprung zu Deck A (100% Deck A / 0% Deck B)"
        >
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isFullA ? 'bg-blue-500 animate-pulse' : clampedValue < 0.5 ? 'bg-blue-400/70' : 'bg-zinc-700'
            }`}
          />
          <div className="flex flex-col truncate leading-tight">
            <div className="flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-wider">
              <span>DECK A</span>
              <span className="text-[8px] opacity-75 font-normal">({deckAPct}%)</span>
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-zinc-100 truncate">
              {deckATitle}
            </span>
            <span className="font-mono text-[8px] text-zinc-500">
              {deckABpm.toFixed(1)} BPM
            </span>
          </div>
        </button>

        {/* Center Utilities: Swap Decks & Center Snap */}
        <div className="flex items-center gap-1 shrink-0">
          {onSwapDecks && (
            <button
              type="button"
              onClick={onSwapDecks}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition active:scale-90"
              title="Decks tauschen (Deck A ⇄ Deck B)"
              aria-label="Swap Decks A and B"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onChange(0.5)}
            className={`px-2 py-1 rounded-lg font-mono text-[8.5px] font-bold tracking-wider border transition active:scale-95 ${
              isCenter
                ? 'bg-zinc-100 text-zinc-950 border-white shadow-sm font-extrabold'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
            title="Auf Center zentrieren (50/50 Blend)"
          >
            CENTER
          </button>
        </div>

        {/* Deck B Status Card */}
        <button
          type="button"
          onClick={() => onChange(1.0)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-right transition active:scale-95 cursor-pointer max-w-[42%] justify-end ${
            isFullB
              ? 'bg-orange-500/20 text-orange-300 border-orange-500/60 shadow-[0_0_12px_rgba(249,115,22,0.35)]'
              : clampedValue > 0.5
              ? 'bg-zinc-900 text-zinc-200 border-zinc-700/80'
              : 'bg-zinc-950/70 text-zinc-500 border-zinc-850'
          }`}
          title="Schnellsprung zu Deck B (0% Deck A / 100% Deck B)"
        >
          <div className="flex flex-col truncate leading-tight items-end">
            <div className="flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-wider">
              <span className="text-[8px] opacity-75 font-normal">({deckBPct}%)</span>
              <span>DECK B</span>
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-zinc-100 truncate">
              {deckBTitle}
            </span>
            <span className="font-mono text-[8px] text-zinc-500">
              {deckBBpm.toFixed(1)} BPM
            </span>
          </div>
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isFullB ? 'bg-orange-500 animate-pulse' : clampedValue > 0.5 ? 'bg-orange-400/70' : 'bg-zinc-700'
            }`}
          />
        </button>
      </div>

      {/* Horizontal Crossfader Rail Track */}
      <div className="relative flex flex-col gap-1 px-1 py-1">
        {/* Dynamic Dual Balance Bar Gauge */}
        <div className="relative h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden flex border border-zinc-800/80">
          {/* Deck A Left Gauge */}
          <div
            className="h-full bg-blue-500 transition-all duration-75"
            style={{ width: `${(1 - clampedValue) * 50}%`, marginLeft: `${clampedValue * 50}%` }}
          />
          {/* Center Zero Notch */}
          <div className="absolute top-0 bottom-0 left-1/2 -ml-[1px] w-[2px] bg-white/40 pointer-events-none z-10" />
          {/* Deck B Right Gauge */}
          <div
            className="h-full bg-orange-500 transition-all duration-75"
            style={{ width: `${clampedValue * 50}%` }}
          />
        </div>

        {/* Real-time Slider Control */}
        <div className="relative flex items-center py-1">
          <input
            type="range"
            min="0"
            max="1"
            step="0.005"
            value={clampedValue}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-3 bg-transparent appearance-none cursor-pointer z-20 focus:outline-none focus:ring-0
              [&::-webkit-slider-runnable-track]:h-2.5 [&::-webkit-slider-runnable-track]:bg-[#181820] [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:border [&::-webkit-slider-runnable-track]:border-zinc-700/80
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-9 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:-mt-2.5 [&::-webkit-slider-thumb]:rounded-lg [&::-webkit-slider-thumb]:bg-zinc-200 [&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.8)] [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-zinc-400 [&::-webkit-slider-thumb]:cursor-grab active:[&::-webkit-slider-thumb]:cursor-grabbing [&::-webkit-slider-thumb]:transition-transform active:[&::-webkit-slider-thumb]:scale-105"
            aria-label="Deck A / Deck B Crossfader"
          />

          {/* Center Detent Visual Tick on Track */}
          <div className="absolute left-1/2 -ml-[1px] top-1/2 -mt-2 w-[2px] h-4 bg-zinc-500/50 pointer-events-none z-10" />
        </div>

        {/* Bottom Navigation Marks & Snap Controls */}
        <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500 px-1 pt-0.5">
          <button
            type="button"
            onClick={() => onChange(0.0)}
            className="flex items-center gap-0.5 hover:text-rose-400 transition cursor-pointer"
            title="Snap Deck A (0%)"
          >
            <ChevronLeft className="w-2.5 h-2.5" />
            <span className="font-bold">DECK A</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[8px] opacity-70">
              {isCenter ? '50 / 50 MIX' : clampedValue < 0.5 ? `DECK A +${Math.round((0.5 - clampedValue) * 200)}%` : `DECK B +${Math.round((clampedValue - 0.5) * 200)}%`}
            </span>

            {/* Crossfader Curve Mode Toggle */}
            {onCurveChange && (
              <div className="flex items-center gap-0.5 bg-zinc-900 px-1 py-0.5 rounded border border-zinc-800">
                {(['SMOOTH', 'LINEAR', 'CUT'] as CrossfaderCurve[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onCurveChange(c)}
                    className={`px-1 py-0.2 rounded text-[7.5px] font-bold transition ${
                      curve === c
                        ? 'bg-zinc-100 text-zinc-950'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                    title={`Crossfader Curve: ${c}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onChange(1.0)}
            className="flex items-center gap-0.5 hover:text-cyan-400 transition cursor-pointer"
            title="Snap Deck B (100%)"
          >
            <span className="font-bold">DECK B</span>
            <ChevronRight className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
