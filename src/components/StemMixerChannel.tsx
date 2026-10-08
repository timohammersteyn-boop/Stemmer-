import React from 'react';
import { StemData, StemId, FaderCurve } from '../types';
import { FlatFader } from './FlatFader';
import { FlatKnob } from './FlatKnob';
import { Sparkles, Filter, RotateCcw } from 'lucide-react';

export interface StemMixerChannelProps {
  stem: StemData;
  onVolumeChange: (stemId: StemId, vol: number) => void;
  onToggleMute: (stemId: StemId) => void;
  onToggleSolo: (stemId: StemId) => void;
  onFilterChange?: (stemId: StemId, filter: number) => void;
  onSendChange?: (stemId: StemId, send: number) => void;
  faderCurve?: FaderCurve;
  deckLabel?: 'A' | 'B';
  className?: string;
  onOpenStemEdit?: (stemId: StemId) => void;
  controlType?: 'fader' | 'poti';
}

export const StemMixerChannel: React.FC<StemMixerChannelProps> = ({
  stem,
  onVolumeChange,
  onToggleMute,
  onToggleSolo,
  onFilterChange,
  onSendChange,
  faderCurve = 'Linear',
  deckLabel,
  className = '',
  onOpenStemEdit,
  controlType = 'fader',
}) => {
  const isMuted = stem.mute;
  const isSolo = stem.solo;
  const filterVal = stem.filter ?? 0.5; // 0.5 is neutral/bypass
  const sendVal = stem.send ?? 0.0; // 0.0 to 1.0

  // Filter display text & color
  const isLpf = filterVal < 0.48;
  const isHpf = filterVal > 0.52;
  const filterLabel = isLpf
    ? `LPF ${Math.round((0.5 - filterVal) * 200)}%`
    : isHpf
    ? `HPF ${Math.round((filterVal - 0.5) * 200)}%`
    : 'FLAT';

  const filterColorClass = isLpf
    ? 'text-cyan-400 bg-cyan-950/70 border-cyan-500/50'
    : isHpf
    ? 'text-amber-400 bg-amber-950/70 border-amber-500/50'
    : 'text-zinc-500 bg-zinc-900 border-zinc-800';

  const handleCycleSend = () => {
    if (!onSendChange) return;
    // Quick performance send cycle: 0% -> 35% -> 70% -> 0%
    if (sendVal < 0.1) onSendChange(stem.id, 0.35);
    else if (sendVal < 0.5) onSendChange(stem.id, 0.70);
    else onSendChange(stem.id, 0.0);
  };

  return (
    <div
      className={`flex flex-col justify-between items-center rounded-2xl bg-[#111115] border p-1.5 sm:p-2 transition-all select-none ${
        isSolo
          ? 'border-amber-400/40 bg-zinc-900/90 shadow-[0_0_12px_rgba(251,191,36,0.15)]'
          : isMuted
          ? 'border-zinc-900 opacity-60'
          : 'border-zinc-800/80 hover:border-zinc-700/80'
      } ${className}`}
    >
      {/* 1. Channel Header: Stem Color Matrix & Name */}
      <div className="flex flex-col items-center gap-0.5 shrink-0 pt-0.5 w-full">
        <div className="flex items-center justify-between w-full px-1">
          {deckLabel && (
            <span
              className={`font-mono text-[7px] font-black px-1 rounded ${
                deckLabel === 'A'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  : 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
              }`}
            >
              D{deckLabel}
            </span>
          )}
          {/* Stem Indicator Dot Matrix (6-dot icon) */}
          <div className="grid grid-cols-3 gap-0.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="w-1 h-1 rounded-full transition-opacity"
                style={{
                  backgroundColor: stem.accentColor,
                  opacity: isMuted ? 0.3 : 0.9,
                }}
              />
            ))}
          </div>
          {onOpenStemEdit && (
            <button
              onClick={() => onOpenStemEdit(stem.id)}
              className="text-[7px] font-mono text-zinc-500 hover:text-zinc-300 uppercase"
              title="EQ & Feinjustierung"
            >
              EQ
            </button>
          )}
        </div>

        <span className="font-mono text-[9.5px] font-bold tracking-wider text-zinc-200 uppercase truncate">
          {stem.name}
        </span>
      </div>

      {/* 2. Live Performance FX SEND & FILTER Mini Strip */}
      <div className="w-full flex flex-col gap-1 my-1 px-0.5 shrink-0">
        {/* FX SEND Punch / Cycle Button */}
        <div className="flex items-center justify-between gap-1">
          <button
            onClick={handleCycleSend}
            className={`flex-1 py-0.5 px-1 rounded-md font-mono text-[7.5px] font-bold flex items-center justify-between transition active:scale-95 border ${
              sendVal > 0.05
                ? 'bg-purple-950/80 text-purple-300 border-purple-500/60 shadow-[0_0_6px_rgba(168,85,247,0.3)]'
                : 'bg-zinc-900/90 text-zinc-500 border-zinc-800 hover:text-zinc-300'
            }`}
            title="FX Send: Klicke um 0% / 35% / 70% Send in die Effektkette zu schalten"
          >
            <span className="flex items-center gap-0.5">
              <Sparkles className="w-2 h-2 text-purple-400" />
              <span>FX</span>
            </span>
            <span>{Math.round(sendVal * 100)}%</span>
          </button>
        </div>

        {/* Bipolar Filter Sweep Controller */}
        <div className="flex flex-col gap-0.5 bg-[#09090d] p-1 rounded-lg border border-zinc-850">
          <div className="flex items-center justify-between text-[7px] font-mono">
            <span className={`px-1 py-0.2 rounded font-bold border ${filterColorClass}`}>
              {filterLabel}
            </span>
            {filterVal !== 0.5 && onFilterChange && (
              <button
                onClick={() => onFilterChange(stem.id, 0.5)}
                className="text-zinc-500 hover:text-zinc-300 transition"
                title="Filter zentrieren (Flat)"
              >
                <RotateCcw className="w-2 h-2" />
              </button>
            )}
          </div>
          {onFilterChange && (
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={filterVal}
              onChange={(e) => onFilterChange(stem.id, parseFloat(e.target.value))}
              className="w-full h-1 accent-rose-500 bg-zinc-800 rounded cursor-pointer"
              title="Links: Low-Pass (Dumpf) • Mitte: Flat • Rechts: High-Pass (Bass Kill)"
            />
          )}
        </div>
      </div>

      {/* 3. Flat Material Fader or Rotary Poti with Level Meter */}
      <div className="flex-1 w-full flex flex-col items-center justify-center my-1 min-h-0">
        {controlType === 'poti' ? (
          <div className="flex flex-col items-center justify-center py-1">
            <FlatKnob
              value={Math.round(stem.volume * 100)}
              onChange={(val) => onVolumeChange(stem.id, val / 100)}
              size="md"
              accentColor={stem.accentColor}
            />
            <div className="flex items-center gap-1 font-mono text-[8px] text-zinc-400 mt-1">
              <span>VOL</span>
              <span className="font-bold text-zinc-200">{Math.round(stem.volume * 100)}%</span>
            </div>
            {/* Horizontal Mini Level Bar under Poti */}
            <div className="w-10 h-1 bg-zinc-900 rounded-full overflow-hidden mt-1 border border-zinc-800">
              <div
                className="h-full rounded-full transition-all duration-75"
                style={{
                  width: `${Math.min(100, (isMuted ? 0 : stem.level) * 100)}%`,
                  backgroundColor: stem.accentColor,
                }}
              />
            </div>
          </div>
        ) : (
          <FlatFader
            value={stem.volume}
            onChange={(val) => onVolumeChange(stem.id, val)}
            stemId={stem.id}
            level={isMuted ? 0 : stem.level}
            curve={faderCurve}
          />
        )}
      </div>

      {/* 4. Bottom Mute & Solo Tactile Buttons */}
      <div className="flex flex-col gap-1 w-full shrink-0">
        {/* Mute Button */}
        <button
          onClick={() => onToggleMute(stem.id)}
          className={`w-full py-1.5 rounded-lg font-mono text-[11px] font-bold transition active:scale-95 border ${
            isMuted
              ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
              : 'bg-[#18181d] text-zinc-400 border-zinc-800 hover:text-zinc-200'
          }`}
          aria-label={`Mute ${stem.name}`}
          title={`Mute ${stem.name}`}
        >
          M
        </button>

        {/* Solo Button */}
        <button
          onClick={() => onToggleSolo(stem.id)}
          className={`w-full py-1.5 rounded-lg font-mono text-[11px] font-bold transition active:scale-95 border ${
            isSolo
              ? 'bg-amber-400 text-zinc-950 border-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
              : 'bg-[#18181d] text-zinc-400 border-zinc-800 hover:text-zinc-200'
          }`}
          aria-label={`Solo ${stem.name}`}
          title={`Solo ${stem.name}`}
        >
          S
        </button>
      </div>
    </div>
  );
};
