import React from 'react';
import { Zap, ChevronLeft, ChevronRight, Check } from 'lucide-react';

export interface PhaseMeterProps {
  deckABpm: number;
  deckBBpm: number;
  deckAPosition: number;
  deckBPosition: number;
  isSyncLocked: boolean;
  isPlaying?: boolean;
  onNudgeDeckB?: (direction: -1 | 1) => void;
  onToggleSync?: () => void;
  className?: string;
  variant?: 'compact' | 'expanded' | 'header';
}

export const PhaseMeter: React.FC<PhaseMeterProps> = ({
  deckABpm,
  deckBBpm,
  deckAPosition,
  deckBPosition,
  isSyncLocked,
  isPlaying = false,
  onNudgeDeckB,
  onToggleSync,
  className = '',
  variant = 'compact',
}) => {
  const bpmA = deckABpm > 0 ? deckABpm : 128;
  const bpmB = deckBBpm > 0 ? deckBBpm : 125;

  const beatDurA = 60 / bpmA;
  const beatDurB = 60 / bpmB;

  // Beat phase normalized from 0.0 to 1.0 within a single quarter beat
  const phaseA = ((deckAPosition % beatDurA) + beatDurA) % beatDurA / beatDurA;
  const phaseB = ((deckBPosition % beatDurB) + beatDurB) % beatDurB / beatDurB;

  // Relative timing offset: difference in beat fraction between Deck B and Deck A
  let beatOffset = isSyncLocked ? 0 : phaseB - phaseA;
  if (beatOffset > 0.5) beatOffset -= 1.0;
  if (beatOffset < -0.5) beatOffset += 1.0;

  // Normalized offset: -1.0 (Deck B 50% behind) to +1.0 (Deck B 50% ahead)
  const normalizedOffset = Math.max(-1, Math.min(1, beatOffset * 2));
  const msOffset = Math.round(beatOffset * beatDurA * 1000);
  const isInPhase = isSyncLocked || Math.abs(beatOffset) < 0.035;

  // Total 11 bars (5 left, 1 center, 5 right)
  const bars = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];

  if (variant === 'header') {
    return (
      <div
        className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#0b0b0f] border border-zinc-800/90 shadow-inner select-none ${className}`}
        title={`Phase Meter: Deck Timing Offset ${isSyncLocked ? 'SYNC LOCKED' : `${msOffset >= 0 ? '+' : ''}${msOffset}ms (${(beatOffset * 100).toFixed(0)}%)`}`}
        role="meter"
        aria-label="Deck Phase Meter"
        aria-valuenow={msOffset}
      >
        <div className="flex items-center gap-1 font-mono text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">
          <span className="text-rose-400">A</span>
          <span className="text-zinc-600">⇄</span>
          <span className="text-cyan-400">B</span>
        </div>

        {/* Mini Phase Meter Bar */}
        <div className="relative w-24 sm:w-28 h-3.5 bg-black/80 rounded border border-zinc-800 flex items-center justify-between px-1 overflow-hidden">
          {/* Background tick notches */}
          <div className="absolute inset-x-1 inset-y-0 flex items-center justify-between pointer-events-none opacity-40">
            {bars.map((b) => (
              <span
                key={b}
                className={`w-[1px] ${
                  b === 0 ? 'h-3 bg-white/80' : b % 2 === 0 ? 'h-2 bg-zinc-600' : 'h-1.5 bg-zinc-700'
                }`}
              />
            ))}
          </div>

          {/* Active Phase Cursor */}
          <div
            className="absolute top-0 bottom-0 w-2 -ml-1 transition-all duration-75 flex items-center justify-center pointer-events-none z-10"
            style={{
              left: `${50 + normalizedOffset * 44}%`,
            }}
          >
            <div
              className={`w-1.5 h-full rounded-sm shadow-sm transition-colors ${
                isInPhase
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                  : normalizedOffset < 0
                  ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]'
                  : 'bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.8)]'
              }`}
            />
          </div>

          {/* Center Zero Marker */}
          <div className="absolute left-1/2 -ml-[1px] top-0 bottom-0 w-[2px] bg-white/60 pointer-events-none" />
        </div>

        {/* Numerical Offset Badge */}
        <span
          className={`font-mono text-[8.5px] font-extrabold px-1 rounded tracking-tight ${
            isInPhase
              ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/40'
              : 'text-zinc-300 bg-zinc-900 border border-zinc-800'
          }`}
        >
          {isInPhase ? 'PHASE' : `${msOffset >= 0 ? '+' : ''}${msOffset}ms`}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`p-2.5 rounded-xl bg-[#0c0c10] border border-zinc-800/90 shadow-md select-none ${className}`}
      role="region"
      aria-label="Deck Phase & Beat Alignment Meter"
    >
      {/* Top Strip: Header labels & Phase status readout */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>DECK A ({bpmA.toFixed(1)})</span>
            <span className="text-zinc-600 font-normal">VS</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>DECK B ({bpmB.toFixed(1)})</span>
          </span>
        </div>

        {/* Phase Alignment Badge */}
        <div className="flex items-center gap-1">
          <span
            className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border ${
              isInPhase
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                : normalizedOffset < 0
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                : 'bg-rose-500/15 text-rose-300 border-rose-500/40'
            }`}
          >
            {isSyncLocked ? (
              <span className="flex items-center gap-1">
                <Check className="w-2.5 h-2.5" />
                <span>SYNC LOCKED</span>
              </span>
            ) : isInPhase ? (
              'IN PHASE (0 ms)'
            ) : normalizedOffset < 0 ? (
              `DECK B BEHIND (${msOffset} ms)`
            ) : (
              `DECK B AHEAD (+${msOffset} ms)`
            )}
          </span>
        </div>
      </div>

      {/* Main Phase Bar (Pioneer CDJ / Traktor style bilateral meter) */}
      <div className="relative py-1">
        {/* Visual LED Segment Array */}
        <div className="relative h-6 bg-black/90 rounded-lg border border-zinc-800 flex items-center px-2 overflow-hidden shadow-inner">
          {/* Segment Notches */}
          <div className="absolute inset-x-2 inset-y-0 flex items-center justify-between pointer-events-none">
            {bars.map((barVal) => {
              const isCenter = barVal === 0;
              return (
                <div key={barVal} className="flex flex-col items-center">
                  <span
                    className={`w-[1px] transition-all ${
                      isCenter
                        ? 'h-4 bg-white/90 shadow-[0_0_4px_rgba(255,255,255,0.8)]'
                        : Math.abs(barVal) === 5
                        ? 'h-3 bg-zinc-600'
                        : 'h-2 bg-zinc-800'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          {/* Glowing Center Target Box */}
          <div className="absolute left-1/2 -ml-2.5 top-1 bottom-1 w-5 rounded border border-emerald-500/30 bg-emerald-500/5 pointer-events-none flex items-center justify-center">
            <span className="text-[7px] font-mono font-bold text-emerald-400/80">0</span>
          </div>

          {/* Dynamic Traveling Phase Cursor */}
          <div
            className="absolute top-1 bottom-1 w-3 -ml-1.5 transition-all duration-75 flex items-center justify-center pointer-events-none z-20"
            style={{
              left: `${50 + normalizedOffset * 46}%`,
            }}
          >
            <div
              className={`w-2 h-full rounded transition-all ${
                isInPhase
                  ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,1)] ring-1 ring-emerald-300'
                  : normalizedOffset < 0
                  ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)] ring-1 ring-amber-300'
                  : 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.9)] ring-1 ring-rose-300'
              }`}
            />
          </div>

          {/* Left/Right Directional Shift Arrows when not in phase */}
          {!isInPhase && (
            <div className="absolute inset-x-2 inset-y-0 flex items-center justify-between pointer-events-none text-[8px] font-mono font-bold opacity-60">
              <span className={`text-amber-400 ${normalizedOffset < 0 ? 'animate-pulse font-extrabold' : ''}`}>
                ◀ NUDGE +
              </span>
              <span className={`text-rose-400 ${normalizedOffset > 0 ? 'animate-pulse font-extrabold' : ''}`}>
                NUDGE - ▶
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Interactive DJ Nudge & Sync Bar */}
      <div className="flex items-center justify-between mt-2 pt-1 border-t border-zinc-800/70">
        {/* Nudge Deck B Backwards (-) */}
        <div className="flex items-center gap-1">
          {onNudgeDeckB && (
            <button
              type="button"
              onClick={() => onNudgeDeckB(-1)}
              className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white active:scale-95 transition text-[9px] font-mono font-bold cursor-pointer"
              title="Deck B Nudge: Tempo kurz verlangsamen (-25ms) zum Beatmatchen"
              aria-label="Nudge Deck B Backwards"
            >
              <ChevronLeft className="w-3 h-3 text-amber-400" />
              <span>NUDGE -</span>
            </button>
          )}

          {/* Deck B Beat Pulse */}
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-850">
            <span
              className={`w-1.5 h-1.5 rounded-full transition-all duration-75 ${
                isPlaying && phaseB < 0.25 ? 'bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.9)]' : 'bg-zinc-800'
              }`}
            />
            <span className="font-mono text-[8px] text-zinc-500 font-bold">DECK B BEAT</span>
          </div>
        </div>

        {/* Sync Lock / Snap Button */}
        {onToggleSync && (
          <button
            type="button"
            onClick={onToggleSync}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9.5px] font-mono font-bold tracking-wider transition active:scale-95 cursor-pointer border ${
              isSyncLocked
                ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:text-white hover:border-zinc-700'
            }`}
            title="Beat Sync: Phasengleichheit und BPM mit Deck A arretieren"
            aria-label="Toggle Deck Sync"
          >
            <Zap className={`w-3 h-3 ${isSyncLocked ? 'text-white' : 'text-rose-400'}`} />
            <span>{isSyncLocked ? 'SYNC ON' : 'SYNC BEAT'}</span>
          </button>
        )}

        {/* Nudge Deck B Forwards (+) */}
        <div className="flex items-center gap-1">
          {/* Deck A Beat Pulse */}
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-850">
            <span
              className={`w-1.5 h-1.5 rounded-full transition-all duration-75 ${
                isPlaying && phaseA < 0.25 ? 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.9)]' : 'bg-zinc-800'
              }`}
            />
            <span className="font-mono text-[8px] text-zinc-500 font-bold">DECK A BEAT</span>
          </div>

          {onNudgeDeckB && (
            <button
              type="button"
              onClick={() => onNudgeDeckB(1)}
              className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white active:scale-95 transition text-[9px] font-mono font-bold cursor-pointer"
              title="Deck B Nudge: Tempo kurz beschleunigen (+25ms) zum Beatmatchen"
              aria-label="Nudge Deck B Forwards"
            >
              <span>NUDGE +</span>
              <ChevronRight className="w-3 h-3 text-cyan-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
