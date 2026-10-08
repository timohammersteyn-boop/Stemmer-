import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StemId } from '../types';

interface LevelMeterProps {
  level: number; // 0.0 to 1.0
  stemId?: StemId | 'master';
  segments?: number;
  orientation?: 'vertical' | 'horizontal';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  isClipping?: boolean;
  showClipIndicator?: boolean;
  onTriggerTestClip?: () => void;
}

const STEM_COLORS: Record<string, { active: string; glow: string }> = {
  drums: { active: 'bg-zinc-100', glow: 'shadow-[0_0_6px_rgba(255,255,255,0.7)]' },
  bass: { active: 'bg-sky-400', glow: 'shadow-[0_0_6px_rgba(56,189,248,0.7)]' },
  music: { active: 'bg-emerald-400', glow: 'shadow-[0_0_6px_rgba(74,222,128,0.7)]' },
  vocal: { active: 'bg-orange-400', glow: 'shadow-[0_0_6px_rgba(251,146,60,0.7)]' },
  master: { active: 'bg-zinc-200', glow: 'shadow-[0_0_6px_rgba(255,255,255,0.6)]' },
};

export const LevelMeter: React.FC<LevelMeterProps> = ({
  level,
  stemId = 'drums',
  segments = 12,
  orientation = 'horizontal',
  className = '',
  size = 'md',
  isClipping = false,
  showClipIndicator,
  onTriggerTestClip,
}) => {
  const clampedLevel = Math.max(0, Math.min(1, level));
  const activeCount = Math.round(clampedLevel * segments);
  const colorConfig = STEM_COLORS[stemId] || STEM_COLORS.drums;

  // Clip Indicator State: glows red for 500ms when audio engine detects clipping
  const isMasterMeter = stemId === 'master';
  const shouldShowClip = showClipIndicator ?? isMasterMeter;
  const [isClipGlow, setIsClipGlow] = useState<boolean>(false);
  const clipTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger 500ms red glow on clip detection
  const trigger500msGlow = useCallback(() => {
    setIsClipGlow(true);
    if (clipTimerRef.current) {
      clearTimeout(clipTimerRef.current);
    }
    clipTimerRef.current = setTimeout(() => {
      setIsClipGlow(false);
      clipTimerRef.current = null;
    }, 500);
  }, []);

  useEffect(() => {
    if (isClipping || (isMasterMeter && level >= 0.98)) {
      trigger500msGlow();
    }
  }, [isClipping, level, isMasterMeter, trigger500msGlow]);

  useEffect(() => {
    return () => {
      if (clipTimerRef.current) {
        clearTimeout(clipTimerRef.current);
      }
    };
  }, []);

  const handleManualTestClip = () => {
    trigger500msGlow();
    onTriggerTestClip?.();
  };

  const segmentArray = Array.from({ length: segments }, (_, i) => i);

  if (orientation === 'vertical') {
    return (
      <div className={`flex flex-col select-none ${className}`}>
        {/* Clip Indicator on top of vertical ladder */}
        {shouldShowClip && (
          <button
            type="button"
            role="status"
            aria-label={isClipGlow ? 'Master audio clipping (0 dBFS peak overload)' : 'Master audio headroom normal'}
            title="Clip Indicator: Glows red for 500ms when audio engine detects clipping (Click to test clip)"
            onClick={handleManualTestClip}
            className={`w-full py-0.5 mb-1 rounded text-[7px] font-mono font-bold tracking-wider text-center transition-all duration-75 cursor-pointer select-none ${
              isClipGlow
                ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(239,68,68,0.95)] border border-red-400 ring-1 ring-red-500/50'
                : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-zinc-300'
            }`}
          >
            CLIP
          </button>
        )}

        <div className="flex-1 flex flex-col-reverse gap-1 justify-between">
          {segmentArray.map((idx) => {
            const isActive = idx < activeCount;
            const isPeak = idx >= segments - 2;
            let bg = 'bg-zinc-800/60';
            let glow = '';

            if (isActive || (isClipGlow && isPeak)) {
              if (isPeak || (isClipGlow && isMasterMeter)) {
                bg = 'bg-rose-500';
                glow = 'shadow-[0_0_6px_rgba(244,63,94,0.8)]';
              } else {
                bg = colorConfig.active;
                glow = colorConfig.glow;
              }
            }

            return (
              <div
                key={idx}
                className={`w-full rounded-[1px] transition-all duration-75 ${
                  size === 'sm' ? 'h-1' : size === 'lg' ? 'h-2' : 'h-1.5'
                } ${bg} ${isActive || (isClipGlow && isPeak) ? glow : ''}`}
              />
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-row items-center gap-1.5 select-none ${className}`}>
      {/* LED Meter Segments */}
      <div className="flex-1 flex flex-row gap-0.5 items-center">
        {segmentArray.map((idx) => {
          const isActive = idx < activeCount;
          const isPeak = idx >= segments - 2;
          let bg = 'bg-zinc-800/70';
          let glow = '';

          if (isActive || (isClipGlow && isPeak)) {
            if (isPeak || (isClipGlow && isMasterMeter)) {
              bg = 'bg-rose-500';
              glow = 'shadow-[0_0_6px_rgba(244,63,94,0.8)]';
            } else {
              bg = colorConfig.active;
              glow = colorConfig.glow;
            }
          }

          return (
            <div
              key={idx}
              className={`flex-1 rounded-[0.5px] transition-all duration-75 ${
                size === 'sm' ? 'h-2.5' : size === 'lg' ? 'h-4' : 'h-3'
              } ${bg} ${isActive || (isClipGlow && isPeak) ? glow : ''}`}
            />
          );
        })}
      </div>

      {/* Dedicated Clip Indicator for Master Level Meter */}
      {shouldShowClip && (
        <button
          type="button"
          role="status"
          aria-label={isClipGlow ? 'Master audio clipping (0 dBFS peak overload)' : 'Master audio headroom normal'}
          title="Clip Indicator: Glows red for 500ms when audio engine detects clipping (Click to test clip)"
          onClick={handleManualTestClip}
          className={`shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold tracking-wider transition-all duration-75 cursor-pointer select-none ${
            isClipGlow
              ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.95)] border border-red-400 ring-2 ring-red-500/50 scale-105'
              : 'bg-zinc-900/90 text-zinc-500 border border-zinc-800 hover:text-zinc-300 hover:border-zinc-700'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full transition-all duration-75 ${
              isClipGlow
                ? 'bg-white shadow-[0_0_6px_rgba(255,255,255,1)] animate-ping'
                : 'bg-zinc-700'
            }`}
          />
          <span>CLIP</span>
        </button>
      )}
    </div>
  );
};
