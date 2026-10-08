import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FXState, FilterMode } from '../types';
import { audioEngine } from '../services/audioEngine';
import { Activity, Zap, Waves, Sliders } from 'lucide-react';

interface SpectralAnalyzerGraphProps {
  fx: FXState;
  onUpdateCutoff: (newAmount: number) => void;
  onUpdateResonance?: (newSecondary: number) => void;
  onSelectFilterMode?: (mode: FilterMode) => void;
  className?: string;
}

export const SpectralAnalyzerGraph: React.FC<SpectralAnalyzerGraphProps> = ({
  fx,
  onUpdateCutoff,
  onUpdateResonance,
  onSelectFilterMode,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [spectrumData, setSpectrumData] = useState<number[]>(new Array(48).fill(0));

  const filterMode: FilterMode = fx.filterMode || (fx.type === 'FILTER' ? 'LOWPASS' : 'DUAL');
  const amount = fx.amount;
  const secondary = fx.secondaryParam;

  // Calculate actual cutoff frequency in Hz based on mode
  const getCutoffHz = useCallback((): number => {
    if (fx.type !== 'FILTER') return 1200;
    if (filterMode === 'LOWPASS') {
      const minF = 60;
      const maxF = 20000;
      return minF * Math.pow(maxF / minF, Math.max(0.01, amount / 100));
    } else if (filterMode === 'HIGHPASS') {
      const minF = 20;
      const maxF = 12000;
      return minF * Math.pow(maxF / minF, Math.max(0.01, amount / 100));
    } else {
      // DUAL DJ Mode
      if (amount < 48) {
        const norm = amount / 48;
        return 80 * Math.pow(20000 / 80, Math.max(0.01, norm));
      } else if (amount > 52) {
        const norm = (amount - 52) / 48;
        return 20 * Math.pow(10000 / 20, Math.max(0.01, norm));
      } else {
        return 1000; // Bypass
      }
    }
  }, [fx.type, filterMode, amount]);

  const cutoffHz = getCutoffHz();
  const resonanceQ = 0.707 + (secondary / 100) * 12; // 0.7 to 12.7
  const resonanceDb = 20 * Math.log10(Math.max(1, resonanceQ));

  // --- Real-time FFT Audio Spectrum Polling ---
  useEffect(() => {
    let animId: number;
    let prevData = new Array(48).fill(0);

    const updateLoop = () => {
      const raw = audioEngine.getSpectrumData();
      const bins = 48;
      const smoothed = new Array(bins);

      for (let i = 0; i < bins; i++) {
        // Map 48 display bins across 64 raw FFT bins with logarithmic emphasis
        const rawIdx = Math.min(raw.length - 1, Math.floor(Math.pow(i / bins, 1.3) * raw.length));
        const rawVal = raw[rawIdx] || 0; // 0 - 255

        // Fallback subtle ambient groove if audio is silent
        const ambient = 8 + Math.sin((Date.now() / 250) + i * 0.4) * 4;
        const target = Math.max(rawVal, ambient);

        // Instant attack, smooth exponential decay
        if (target > prevData[i]) {
          smoothed[i] = target;
        } else {
          smoothed[i] = prevData[i] * 0.86;
        }
      }

      prevData = smoothed;
      setSpectrumData([...smoothed]);
      animId = requestAnimationFrame(updateLoop);
    };

    animId = requestAnimationFrame(updateLoop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // --- Frequency to Logarithmic Graph Coordinate (0 to 100%) ---
  const freqToX = (freq: number): number => {
    const minF = 20;
    const maxF = 20000;
    const clamped = Math.max(minF, Math.min(maxF, freq));
    return (Math.log10(clamped / minF) / Math.log10(maxF / minF)) * 100;
  };

  const xToFreq = (xPercent: number): number => {
    const minF = 20;
    const maxF = 20000;
    const norm = Math.max(0, Math.min(1, xPercent / 100));
    return minF * Math.pow(maxF / minF, norm);
  };

  // Convert dB gain (-48dB to +18dB) to SVG Y coordinate (0 to 100)
  const dbToY = (db: number): number => {
    const minDb = -42;
    const maxDb = 18;
    const clamped = Math.max(minDb, Math.min(maxDb, db));
    // 0 is top (+18dB), 100 is bottom (-42dB)
    return ((maxDb - clamped) / (maxDb - minDb)) * 100;
  };

  // --- Calculate 2nd-order Biquad Filter Frequency Response Curve ---
  const generateResponseCurvePath = (): string => {
    const pointsCount = 80;
    const points: [number, number][] = [];

    for (let i = 0; i <= pointsCount; i++) {
      const xPercent = (i / pointsCount) * 100;
      const f = xToFreq(xPercent);
      let gainDb = 0;

      if (fx.type === 'FILTER') {
        const fc = cutoffHz;
        const Q = resonanceQ;
        const ratio = f / fc;
        const ratioSq = ratio * ratio;

        if (filterMode === 'LOWPASS') {
          // Low-pass transfer magnitude: 1 / sqrt((1 - ratio^2)^2 + (ratio / Q)^2)
          const denom = Math.sqrt(Math.pow(1 - ratioSq, 2) + Math.pow(ratio / Q, 2));
          const mag = 1 / Math.max(0.0001, denom);
          gainDb = 20 * Math.log10(mag);
        } else if (filterMode === 'HIGHPASS') {
          // High-pass transfer magnitude: ratio^2 / sqrt((1 - ratio^2)^2 + (ratio / Q)^2)
          const denom = Math.sqrt(Math.pow(1 - ratioSq, 2) + Math.pow(ratio / Q, 2));
          const mag = ratioSq / Math.max(0.0001, denom);
          gainDb = 20 * Math.log10(Math.max(0.0001, mag));
        } else {
          // Dual DJ Mode
          if (amount < 48) {
            const denom = Math.sqrt(Math.pow(1 - ratioSq, 2) + Math.pow(ratio / Q, 2));
            const mag = 1 / Math.max(0.0001, denom);
            gainDb = 20 * Math.log10(mag);
          } else if (amount > 52) {
            const denom = Math.sqrt(Math.pow(1 - ratioSq, 2) + Math.pow(ratio / Q, 2));
            const mag = ratioSq / Math.max(0.0001, denom);
            gainDb = 20 * Math.log10(Math.max(0.0001, mag));
          } else {
            gainDb = 0; // Bypass
          }
        }
      } else if (fx.type === 'DELAY') {
        // Bandpass damping curve for echo repeats
        const center = 1200;
        const ratio = f / center;
        const mag = 1 / (1 + Math.pow(Math.log10(ratio) * 1.8, 2));
        const wetMix = amount / 100;
        gainDb = (20 * Math.log10(Math.max(0.1, mag))) * wetMix * 0.6;
      } else if (fx.type === 'REVERB') {
        // High frequency air absorption roll-off
        const dampFreq = 4000 * (1 - secondary / 160);
        if (f > dampFreq) {
          gainDb = -20 * Math.log10(f / dampFreq) * (amount / 100);
        } else {
          gainDb = (amount / 100) * 2;
        }
      } else if (fx.type === 'DRIVE') {
        // Saturation harmonic boost in mid frequencies (500Hz - 3kHz)
        const midRatio = f / 1200;
        const midBoost = Math.exp(-Math.pow(Math.log10(midRatio) * 1.5, 2)) * (amount / 100) * 8;
        gainDb = midBoost;
      }

      // Clamp gain to graph visual limits
      const yPercent = dbToY(gainDb);
      points.push([xPercent, yPercent]);
    }

    return points.reduce((acc, [x, y], idx) => {
      return idx === 0 ? `M ${x.toFixed(1)},${y.toFixed(1)}` : `${acc} L ${x.toFixed(1)},${y.toFixed(1)}`;
    }, '');
  };

  // --- Interactive Drag Handling on Graph ---
  const handlePointerMove = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const xRatio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));

      if (filterMode === 'LOWPASS') {
        // Logarithmic frequency to 0-100 amount
        onUpdateCutoff(Math.round(xRatio * 100));
      } else if (filterMode === 'HIGHPASS') {
        onUpdateCutoff(Math.round(xRatio * 100));
      } else {
        // DUAL mode
        onUpdateCutoff(Math.round(xRatio * 100));
      }
    },
    [filterMode, onUpdateCutoff]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    handlePointerMove(e.clientX);
  };

  const handlePointerDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    handlePointerMove(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Cutoff marker coordinates
  const cutoffX = freqToX(cutoffHz);
  const cutoffY = dbToY(filterMode === 'DUAL' && amount >= 48 && amount <= 52 ? 0 : resonanceDb);
  const curvePath = generateResponseCurvePath();
  const fillPath = `${curvePath} L 100,100 L 0,100 Z`;

  // Grid frequency lines
  const gridFrequencies = [
    { freq: 50, label: '50Hz' },
    { freq: 200, label: '200Hz' },
    { freq: 1000, label: '1kHz' },
    { freq: 5000, label: '5kHz' },
    { freq: 15000, label: '15kHz' },
  ];

  return (
    <div className={`flex flex-col bg-[#0b0b0e] rounded-2xl border border-zinc-800/90 p-3 select-none ${className}`}>
      {/* 1. Header: Title, Live Cutoff Readout & Filter Mode Selectors */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80 mb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.9)] animate-pulse" />
            <span className="font-mono text-[10px] font-bold tracking-wider text-zinc-100 uppercase">
              SPECTRAL ANALYZER
            </span>
          </div>

          {/* Mode Badge / Selector */}
          {fx.type === 'FILTER' && onSelectFilterMode && (
            <div className="flex items-center gap-1 bg-[#141419] p-0.5 rounded-lg border border-zinc-800">
              {(['LOWPASS', 'HIGHPASS', 'DUAL'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => onSelectFilterMode(m)}
                  className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold tracking-wider transition ${
                    filterMode === m
                      ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {m === 'LOWPASS' ? 'LPF' : m === 'HIGHPASS' ? 'HPF' : 'DUAL'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Real-time Frequency Readout */}
        <div className="flex items-center gap-2 font-mono text-[9px]">
          <div className="flex items-center gap-1 text-zinc-400">
            <span>CUTOFF:</span>
            <span className="text-zinc-100 font-bold">
              {cutoffHz >= 1000 ? `${(cutoffHz / 1000).toFixed(2)} kHz` : `${Math.round(cutoffHz)} Hz`}
            </span>
          </div>
          <span className="text-zinc-600 font-bold">•</span>
          <div className="flex items-center gap-1 text-zinc-400">
            <span>RES (Q):</span>
            <span className="text-rose-400 font-bold">{resonanceQ.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* 2. Interactive SVG Graph & Spectral Bars Container */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerDrag}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative w-full h-36 bg-[#070709] rounded-xl border border-zinc-900 overflow-hidden cursor-ew-resize touch-none"
      >
        {/* Background Dot-Matrix Texture */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
            backgroundSize: '12px 12px',
          }}
        />

        {/* 2a. Real-time Spectral Analyzer Bars (FFT Spectrum) */}
        <div className="absolute inset-x-0 bottom-0 top-3 flex items-end justify-between px-2 gap-0.5 pointer-events-none z-0">
          {spectrumData.map((val, idx) => {
            // Apply theoretical filter attenuation to spectrum bar height
            const binFreq = xToFreq((idx / (spectrumData.length - 1)) * 100);
            let filterAtten = 1.0;

            if (fx.type === 'FILTER') {
              if (filterMode === 'LOWPASS' && binFreq > cutoffHz) {
                filterAtten = Math.max(0.05, Math.pow(cutoffHz / binFreq, 1.8));
              } else if (filterMode === 'HIGHPASS' && binFreq < cutoffHz) {
                filterAtten = Math.max(0.05, Math.pow(binFreq / cutoffHz, 1.8));
              } else if (filterMode === 'DUAL') {
                if (amount < 48 && binFreq > cutoffHz) {
                  filterAtten = Math.max(0.05, Math.pow(cutoffHz / binFreq, 1.8));
                } else if (amount > 52 && binFreq < cutoffHz) {
                  filterAtten = Math.max(0.05, Math.pow(binFreq / cutoffHz, 1.8));
                }
              }
            }

            const rawHeightPct = (val / 255) * 100;
            const effectiveHeight = Math.max(4, rawHeightPct * filterAtten);
            const isNearCutoff = Math.abs(binFreq - cutoffHz) / cutoffHz < 0.25;

            return (
              <div
                key={idx}
                className="flex-1 flex flex-col justify-end items-center h-full"
              >
                <div
                  className={`w-full rounded-t-sm transition-[height] duration-75 ${
                    isNearCutoff && fx.type === 'FILTER'
                      ? 'bg-rose-500/80 shadow-[0_0_6px_rgba(244,63,94,0.6)]'
                      : 'bg-zinc-300/40'
                  }`}
                  style={{
                    height: `${effectiveHeight}%`,
                    opacity: 0.25 + (val / 255) * 0.75,
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* 2b. SVG Frequency Response Transfer Curve Overlay */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Vertical Frequency Logarithmic Grid Lines */}
          {gridFrequencies.map((item) => {
            const gx = freqToX(item.freq);
            return (
              <line
                key={item.freq}
                x1={gx}
                y1="0"
                x2={gx}
                y2="100"
                stroke="#27272a"
                strokeDasharray="2,2"
                strokeWidth="0.5"
                opacity="0.7"
              />
            );
          })}

          {/* Horizontal dB Gain Grid Lines */}
          {/* Unity Gain (0 dB) Line */}
          <line
            x1="0"
            y1={dbToY(0)}
            x2="100"
            y2={dbToY(0)}
            stroke="#52525b"
            strokeWidth="0.8"
            strokeDasharray="3,3"
            opacity="0.8"
          />
          {/* +12 dB Boost Reference */}
          <line
            x1="0"
            y1={dbToY(12)}
            x2="100"
            y2={dbToY(12)}
            stroke="#3f3f46"
            strokeWidth="0.4"
            opacity="0.5"
          />
          {/* -12 dB Reference */}
          <line
            x1="0"
            y1={dbToY(-12)}
            x2="100"
            y2={dbToY(-12)}
            stroke="#3f3f46"
            strokeWidth="0.4"
            opacity="0.5"
          />
          {/* -24 dB Reference */}
          <line
            x1="0"
            y1={dbToY(-24)}
            x2="100"
            y2={dbToY(-24)}
            stroke="#27272a"
            strokeWidth="0.4"
            opacity="0.5"
          />

          {/* Filter Cut Zone Gradient Shading (Area under curve) */}
          <path
            d={fillPath}
            fill="url(#filterResponseGrad)"
            opacity="0.22"
          />

          {/* Active Frequency Response Curve Line */}
          <path
            d={curvePath}
            fill="none"
            stroke={fx.type === 'FILTER' ? '#f43f5e' : '#38bdf8'}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              filter: `drop-shadow(0 0 6px ${fx.type === 'FILTER' ? 'rgba(244, 63, 94, 0.8)' : 'rgba(56, 189, 248, 0.8)'})`,
            }}
          />

          {/* Vertical Cutoff Guide Line */}
          {fx.type === 'FILTER' && (
            <line
              x1={cutoffX}
              y1="0"
              x2={cutoffX}
              y2="100"
              stroke="#f43f5e"
              strokeWidth="1.2"
              strokeDasharray="2,2"
              opacity="0.8"
            />
          )}

          {/* Interactive Cutoff Node Handle */}
          {fx.type === 'FILTER' && (
            <g transform={`translate(${cutoffX}, ${Math.min(90, Math.max(10, cutoffY))})`}>
              {/* Outer pulsing beacon ring */}
              <circle
                r="6"
                fill="none"
                stroke="#f43f5e"
                strokeWidth="1"
                opacity="0.5"
                className="animate-ping"
              />
              {/* Node core */}
              <circle
                r="3.5"
                fill="#ffffff"
                stroke="#f43f5e"
                strokeWidth="2"
                style={{ filter: 'drop-shadow(0 0 8px rgba(244, 63, 94, 1))' }}
              />
            </g>
          )}

          {/* Gradients */}
          <defs>
            <linearGradient id="filterResponseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#f43f5e" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* 2c. On-screen dB Labels */}
        <div className="absolute left-1.5 inset-y-0 flex flex-col justify-between py-1 text-[7px] font-mono text-zinc-500 pointer-events-none z-20">
          <span>+12 dB</span>
          <span className="text-zinc-400 font-bold">0 dB</span>
          <span>-12 dB</span>
          <span>-24 dB</span>
        </div>

        {/* Drag Helper Tip on Hover */}
        <div className="absolute right-2 top-1.5 px-1.5 py-0.5 rounded bg-zinc-900/80 border border-zinc-800 text-[8px] font-mono text-zinc-400 pointer-events-none z-20">
          <span>TIEN: DRAG TO FILTER</span>
        </div>
      </div>

      {/* 3. Bottom Frequency Spectrum Axis Labels */}
      <div className="flex items-center justify-between text-[8px] font-mono text-zinc-500 px-1 pt-2">
        <span className="text-zinc-400 font-bold">20Hz [SUB]</span>
        <span>100Hz</span>
        <span>500Hz [MID]</span>
        <span>2kHz</span>
        <span>8kHz [PRESENCE]</span>
        <span className="text-zinc-400 font-bold">20kHz [AIR]</span>
      </div>
    </div>
  );
};
