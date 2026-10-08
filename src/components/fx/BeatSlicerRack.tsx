import React, { useState, useEffect, useRef } from 'react';
import { audioEngine } from '../../services/audioEngine';
import { Scissors, Play, Repeat, RotateCcw, Zap, Layers, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

interface BeatSlicerRackProps {
  bpm?: number;
  onLogActivity?: (category: 'RECORD', message: string, color?: string) => void;
}

export type SlicerResolution = '1/4' | '1/8' | '1/16' | '1/32';

export const BeatSlicerRack: React.FC<BeatSlicerRackProps> = ({
  bpm = 128,
  onLogActivity,
}) => {
  const [sliceCount, setSliceCount] = useState<4 | 8>(8);
  const [activeSlice, setActiveSlice] = useState<number | null>(null);
  const [currentPlayheadSlice, setCurrentPlayheadSlice] = useState<number>(0);
  const [resolution, setResolution] = useState<SlicerResolution>('1/16');
  const [isReverse, setIsReverse] = useState<boolean>(false);
  const [isPatternPlaying, setIsPatternPlaying] = useState<boolean>(false);
  const [activePattern, setActivePattern] = useState<string | null>(null);

  // Live playhead slice tracking based on BPM
  useEffect(() => {
    const beatIntervalMs = (60 / Math.max(40, bpm)) * 1000;
    const sliceDurationMs = (beatIntervalMs * 4) / sliceCount; // 1-bar cycle

    const interval = setInterval(() => {
      const now = performance.now();
      const current = Math.floor((now / sliceDurationMs) % sliceCount);
      setCurrentPlayheadSlice(current);
    }, 40);

    return () => clearInterval(interval);
  }, [bpm, sliceCount]);

  // Handle slice pad press
  const handleSlicePress = (index: number) => {
    triggerHaptic('tap');
    setActiveSlice(index);

    // Trigger audio effect simulation in audio engine
    audioEngine.triggerPadSound('A', index, 'slice');

    onLogActivity?.(
      'RECORD',
      `Beat Slicer: Slice [${index + 1}/${sliceCount}] Stutter triggered (${resolution}${isReverse ? ' REV' : ''})`,
      '#06b6d4'
    );
  };

  const handleSliceRelease = () => {
    setActiveSlice(null);
  };

  // Play pre-programmed stutter patterns
  const handleTriggerPattern = (name: string, slices: number[]) => {
    triggerHaptic('double');
    setActivePattern(name);
    setIsPatternPlaying(true);

    let step = 0;
    const stepDurationMs = ((60 / Math.max(40, bpm)) * 1000) / 4; // 16th note steps

    const patternTimer = setInterval(() => {
      if (step >= slices.length) {
        clearInterval(patternTimer);
        setActiveSlice(null);
        setIsPatternPlaying(false);
        setActivePattern(null);
        return;
      }
      const targetSlice = slices[step];
      setActiveSlice(targetSlice);
      audioEngine.triggerPadSound('A', targetSlice, 'slice');
      triggerHaptic('tap');
      step++;
    }, stepDurationMs);
  };

  const slicePads = Array.from({ length: sliceCount }, (_, i) => i);

  return (
    <div className="flex-1 flex flex-col justify-between p-3 bg-[#0d0d12] border border-zinc-800/80 rounded-2xl select-none">
      {/* 1. Header & Controls */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-mono text-[10px] font-black text-white">
            <Scissors className="w-3.5 h-3.5 text-cyan-400" />
            <span>BEAT SLICER & STUTTER ENGINE</span>
          </div>

          <div className="flex items-center gap-1">
            {/* Slice Mode 4 vs 8 */}
            <div className="flex items-center bg-black/60 p-0.5 rounded-lg border border-zinc-800 text-[8px] font-mono">
              <button
                onClick={() => {
                  triggerHaptic('tap');
                  setSliceCount(4);
                }}
                className={`px-2 py-0.5 rounded font-bold transition ${
                  sliceCount === 4 ? 'bg-cyan-500 text-black font-black' : 'text-zinc-400'
                }`}
              >
                4 SLICES
              </button>
              <button
                onClick={() => {
                  triggerHaptic('tap');
                  setSliceCount(8);
                }}
                className={`px-2 py-0.5 rounded font-bold transition ${
                  sliceCount === 8 ? 'bg-cyan-500 text-black font-black' : 'text-zinc-400'
                }`}
              >
                8 SLICES
              </button>
            </div>

            {/* Reverse Slice Toggle */}
            <button
              onClick={() => {
                triggerHaptic('tap');
                setIsReverse(!isReverse);
              }}
              className={`px-2 py-1 rounded-lg border font-mono text-[8px] font-bold transition active:scale-95 ${
                isReverse
                  ? 'bg-rose-500/25 border-rose-500/60 text-rose-300 shadow-sm'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
            >
              REV {isReverse ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Stutter Repeat Speeds */}
        <div className="flex items-center justify-between gap-1 text-[8px] font-mono">
          <span className="text-zinc-500 font-bold">STUTTER RATE:</span>
          <div className="flex items-center gap-1">
            {(['1/4', '1/8', '1/16', '1/32'] as SlicerResolution[]).map((r) => (
              <button
                key={r}
                onClick={() => {
                  triggerHaptic('tap');
                  setResolution(r);
                }}
                className={`px-2 py-0.5 rounded-md border transition ${
                  resolution === r
                    ? 'bg-cyan-400 text-black font-black border-cyan-300'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Visual Slice Waveform Grid Ribbon */}
      <div className="py-2">
        <div className="relative w-full h-8 bg-black/80 rounded-xl border border-zinc-800 overflow-hidden flex">
          {slicePads.map((idx) => {
            const isPlayingHere = currentPlayheadSlice === idx;
            const isPressed = activeSlice === idx;

            return (
              <div
                key={`ribbon-${idx}`}
                className={`flex-1 h-full border-r border-zinc-800/80 last:border-r-0 flex flex-col items-center justify-between p-1 transition-colors ${
                  isPressed
                    ? 'bg-cyan-400/50 shadow-inner'
                    : isPlayingHere
                    ? 'bg-zinc-700/40'
                    : 'bg-transparent'
                }`}
              >
                <span className="font-mono text-[6.5px] font-bold text-zinc-400">
                  {idx + 1}
                </span>
                <div
                  className={`w-1 rounded-full transition-all ${
                    isPressed
                      ? 'h-3 bg-cyan-300 animate-pulse'
                      : isPlayingHere
                      ? 'h-2.5 bg-white'
                      : 'h-1 bg-zinc-700'
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Interactive Slicer Performance Pad Grid */}
      <div
        className={`grid gap-2 py-1 items-stretch ${
          sliceCount === 4 ? 'grid-cols-4 h-24 sm:h-28' : 'grid-cols-4 grid-rows-2 h-36 sm:h-44'
        }`}
      >
        {slicePads.map((idx) => {
          const isPressed = activeSlice === idx;
          const isPlayingHere = currentPlayheadSlice === idx;

          return (
            <button
              key={`pad-${idx}`}
              onPointerDown={() => handleSlicePress(idx)}
              onPointerUp={handleSliceRelease}
              onPointerCancel={handleSliceRelease}
              onPointerLeave={handleSliceRelease}
              className={`rounded-xl border flex flex-col items-center justify-between p-2.5 font-mono transition-all duration-75 select-none touch-none ${
                isPressed
                  ? 'bg-cyan-400 text-black border-white shadow-[0_0_20px_rgba(6,182,212,0.9)] scale-[0.96] font-black'
                  : isPlayingHere
                  ? 'bg-zinc-800/90 text-white border-zinc-600 shadow-sm'
                  : 'bg-[#121217] text-zinc-300 border-zinc-800 hover:border-zinc-700 active:scale-95'
              }`}
            >
              <div className="w-full flex justify-between items-center text-[8.5px] opacity-75">
                <span>SLICE {idx + 1}</span>
                {isPlayingHere && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
              </div>

              <span className="text-sm sm:text-base font-black">
                {isReverse ? `◀ ${idx + 1}` : `${idx + 1} ▶`}
              </span>

              <span className="text-[7.5px] opacity-70 tracking-widest uppercase">
                {resolution}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. Slicer Presets / Stutter Patterns for Build-ups */}
      <div className="p-2 bg-black/60 border border-zinc-800 rounded-xl flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[8px] font-mono font-bold text-zinc-400 px-1">
          <span>INSTANT STUTTER BUILD-UP PATTERNS:</span>
          {activePattern && (
            <span className="text-cyan-400 animate-pulse font-black">
              PLAYING: {activePattern}
            </span>
          )}
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {[
            { name: '1-1-2-2', slices: [0, 0, 1, 1, 2, 2, 3, 3] },
            { name: 'STUTTER 4X', slices: [0, 0, 0, 0, 4, 4, 4, 4] },
            { name: 'REVERSE DROP', slices: [7, 6, 5, 4, 3, 2, 1, 0] },
            { name: 'TRIPLET BUILD', slices: [0, 1, 2, 0, 1, 2, 6, 7] },
          ].map((pat) => (
            <button
              key={pat.name}
              onClick={() => handleTriggerPattern(pat.name, pat.slices)}
              disabled={isPatternPlaying}
              className={`py-1.5 px-1 rounded-lg border font-mono text-[8px] font-bold transition active:scale-95 ${
                activePattern === pat.name
                  ? 'bg-cyan-500 text-black border-cyan-400 font-black'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:text-white hover:border-zinc-700'
              }`}
            >
              {pat.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
