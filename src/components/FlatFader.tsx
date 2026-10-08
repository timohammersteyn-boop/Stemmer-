import React, { useRef, useState, useCallback } from 'react';
import { StemId, FaderCurve } from '../types';
import { LevelMeter } from './LevelMeter';

export function faderPositionToVolume(position: number, curve: FaderCurve = 'Linear'): number {
  const p = Math.max(0, Math.min(1, position));
  switch (curve) {
    case 'Linear':
      return p;
    case 'Exponential':
      return Math.pow(p, 2.2);
    case 'Constant Power':
      return Math.sin(p * (Math.PI / 2));
    default:
      return p;
  }
}

export function volumeToFaderPosition(volume: number, curve: FaderCurve = 'Linear'): number {
  const v = Math.max(0, Math.min(1, volume));
  switch (curve) {
    case 'Linear':
      return v;
    case 'Exponential':
      return Math.pow(v, 1 / 2.2);
    case 'Constant Power':
      return Math.asin(Math.min(1, Math.max(0, v))) / (Math.PI / 2);
    default:
      return v;
  }
}

interface FlatFaderProps {
  value: number; // 0.0 to 1.0 (effective audio volume)
  onChange: (newValue: number) => void;
  stemId: StemId;
  level: number;
  label?: string;
  className?: string;
  curve?: FaderCurve;
}

export const FlatFader: React.FC<FlatFaderProps> = ({
  value,
  onChange,
  stemId,
  level,
  className = '',
  curve = 'Linear',
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Convert normalized volume (0.0 - 1.0) to dB display (-inf to +3dB)
  const getDbDisplay = (val: number): string => {
    if (val <= 0.01) return '-∞ dB';
    const db = 20 * Math.log10(val);
    const clampedDb = Math.max(-48, Math.min(3, db));
    return `${clampedDb >= 0 ? '+' : ''}${clampedDb.toFixed(1)} dB`;
  };

  const handlePointerMove = useCallback(
    (clientY: number) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const height = rect.height;
      // Bottom is 0, Top is 1
      const offsetY = rect.bottom - clientY;
      const clampedRatio = Math.max(0, Math.min(1, offsetY / height));
      const effectiveVolume = faderPositionToVolume(clampedRatio, curve);
      onChange(effectiveVolume);
    },
    [onChange, curve]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    handlePointerMove(e.clientY);
  };

  const handlePointerDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    handlePointerMove(e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Color styles based on stem
  const handleColors: Record<StemId, { bg: string; border: string; glow: string }> = {
    drums: {
      bg: 'bg-zinc-100',
      border: 'border-zinc-300',
      glow: 'shadow-[0_0_12px_rgba(255,255,255,0.3)]',
    },
    bass: {
      bg: 'bg-sky-400',
      border: 'border-sky-300',
      glow: 'shadow-[0_0_12px_rgba(56,189,248,0.35)]',
    },
    music: {
      bg: 'bg-emerald-400',
      border: 'border-emerald-300',
      glow: 'shadow-[0_0_12px_rgba(74,222,128,0.35)]',
    },
    vocal: {
      bg: 'bg-orange-400',
      border: 'border-orange-300',
      glow: 'shadow-[0_0_12px_rgba(251,146,60,0.35)]',
    },
  };

  const currentHandle = handleColors[stemId];
  // Calculate handle position using inverse curve mapping
  const physicalPosition = volumeToFaderPosition(value, curve);
  const percent = Math.round(physicalPosition * 100);

  return (
    <div className={`flex flex-col items-center h-full select-none ${className}`}>
      {/* Fader Track Container */}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerDrag}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative flex-1 w-full max-w-[76px] px-2 py-4 flex items-center justify-center cursor-ns-resize touch-none"
      >
        {/* Generous touch track background */}
        <div className="relative w-12 h-full flex items-center justify-center">
          {/* Subtle slot track */}
          <div className="absolute inset-y-0 w-2 bg-zinc-900 rounded-full border border-zinc-800/80">
            {/* Filled track beneath handle */}
            <div
              className={`absolute bottom-0 inset-x-0 rounded-full opacity-60 ${currentHandle.bg}`}
              style={{ height: `${percent}%` }}
            />
          </div>

          {/* Tick marks on sides */}
          <div className="absolute -left-2 inset-y-2 flex flex-col justify-between py-1 opacity-25 pointer-events-none">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="w-1.5 h-[1px] bg-zinc-400" />
            ))}
          </div>

          {/* Level Meter strip on the right */}
          <div className="absolute -right-2.5 inset-y-3 w-1.5 pointer-events-none">
            <LevelMeter level={level} stemId={stemId} segments={16} orientation="vertical" size="sm" className="h-full" />
          </div>

          {/* Flat Material Fader Handle / Cap */}
          <div
            className={`absolute left-0 right-0 h-10 rounded-md border pointer-events-none ${currentHandle.border} ${currentHandle.bg} ${
              isDragging ? `${currentHandle.glow} scale-[1.03]` : 'shadow-md'
            } transition-transform flex items-center justify-center`}
            style={{
              bottom: `calc(${percent}% - 20px)`,
            }}
          >
            {/* Modern flat central grip line */}
            <div className="w-6 h-0.5 bg-zinc-950/60 rounded-full" />
          </div>
        </div>
      </div>

      {/* Numerical dB display */}
      <div className="mt-2 text-center flex flex-col items-center">
        <span className="font-mono text-xs font-semibold text-zinc-300 tracking-tight">
          {getDbDisplay(value)}
        </span>
        <span className="font-mono text-[8px] text-zinc-500 uppercase tracking-tighter">
          {curve === 'Constant Power' ? 'CONST PWR' : curve === 'Exponential' ? 'EXP' : 'LIN'}
        </span>
      </div>
    </div>
  );
};
