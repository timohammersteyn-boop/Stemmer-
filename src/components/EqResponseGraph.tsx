import React, { useMemo } from 'react';
import { MasterEqSettings } from '../types';
import { RotateCcw, Activity } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface EqResponseGraphProps {
  eq: MasterEqSettings;
  filterCutoff?: number; // 0..1, 0.5 neutral
  onEqChange?: (updates: Partial<MasterEqSettings>) => void;
  onResetEq?: () => void;
  className?: string;
  presetName?: string;
}

export const EqResponseGraph: React.FC<EqResponseGraphProps> = ({
  eq,
  filterCutoff = 0.5,
  onEqChange,
  onResetEq,
  className = '',
  presetName,
}) => {
  // SVG dimensions
  const width = 360;
  const height = 90;
  const paddingX = 10;
  const paddingY = 8;
  const plotWidth = width - paddingX * 2;
  const plotHeight = height - paddingY * 2;

  // DB Range: -18 dB to +12 dB (total 30 dB)
  const minDb = -18;
  const maxDb = 12;
  const dbRange = maxDb - minDb;

  const dbToY = (db: number) => {
    const clamped = Math.max(minDb, Math.min(maxDb, db));
    const normalized = (maxDb - clamped) / dbRange; // 0 at maxDb, 1 at minDb
    return paddingY + normalized * plotHeight;
  };

  const zeroDbY = dbToY(0);

  // Compute curve points along logarithmic frequency scale (20 Hz to 20 kHz)
  // Number of sample points for smooth SVG path
  const pathData = useMemo(() => {
    const numPoints = 64;
    const points: [number, number][] = [];

    // Filter shifts:
    // filterCutoff: 0.5 = neutral.
    // If < 0.5: Low-Pass Filter engages, cutting high frequencies.
    // If > 0.5: High-Pass Filter engages, cutting low frequencies.
    const isLpf = filterCutoff < 0.48;
    const isHpf = filterCutoff > 0.52;
    const lpfNorm = isLpf ? filterCutoff / 0.5 : 1; // 0 to 1
    const hpfNorm = isHpf ? (filterCutoff - 0.5) / 0.5 : 0; // 0 to 1

    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints; // 0 = 20 Hz, 1 = 20 kHz
      const x = paddingX + t * plotWidth;

      // Frequency calculation (log scale 20 to 20000)
      const freq = 20 * Math.pow(1000, t);

      // 1. Low Shelf (centered ~120 Hz)
      const lowWeight = 1 / (1 + Math.pow(freq / 200, 1.8));
      const lowContribution = eq.low * lowWeight;

      // 2. Mid Bell (centered ~1000 Hz, Q ~1.2)
      const midFreq = 1000;
      const logDist = Math.abs(Math.log10(freq / midFreq));
      const midWeight = Math.exp(-Math.pow(logDist * 1.6, 2));
      const midContribution = eq.mid * midWeight;

      // 3. High Shelf (centered ~6000 Hz)
      const highWeight = 1 / (1 + Math.pow(4000 / freq, 1.8));
      const highContribution = eq.high * highWeight;

      let totalDb = lowContribution + midContribution + highContribution;

      // 4. Filter Roll-Off shifts
      if (isHpf) {
        // High-Pass cuts frequencies below cutoff
        const hpfFreq = 30 + Math.pow(hpfNorm, 2) * 8000;
        if (freq < hpfFreq) {
          const octavesBelow = Math.log2(hpfFreq / freq);
          totalDb -= octavesBelow * 18; // 18 dB/octave slope
        }
      } else if (isLpf) {
        // Low-Pass cuts frequencies above cutoff
        const lpfFreq = 100 + Math.pow(lpfNorm, 2) * 19000;
        if (freq > lpfFreq) {
          const octavesAbove = Math.log2(freq / lpfFreq);
          totalDb -= octavesAbove * 18; // 18 dB/octave slope
        }
      }

      const y = dbToY(totalDb);
      points.push([x, y]);
    }

    // Build SVG smooth path string
    if (points.length === 0) return { path: '', area: '' };

    let pStr = `M ${points[0][0].toFixed(1)},${points[0][1].toFixed(1)}`;
    for (let i = 1; i < points.length; i++) {
      pStr += ` L ${points[i][0].toFixed(1)},${points[i][1].toFixed(1)}`;
    }

    // Area closed path for translucent glowing fill
    const areaStr = `${pStr} L ${points[points.length - 1][0].toFixed(1)},${height - paddingY} L ${points[0][0].toFixed(1)},${height - paddingY} Z`;

    return { path: pStr, area: areaStr };
  }, [eq.low, eq.mid, eq.high, filterCutoff]);

  return (
    <div className={`relative bg-[#0c0c10] border border-zinc-800/80 rounded-xl p-2 select-none overflow-hidden ${className}`}>
      {/* Header bar with readouts & preset badge */}
      <div className="flex items-center justify-between mb-1 px-1">
        <div className="flex items-center gap-1.5 font-mono text-[8px] font-bold text-zinc-400">
          <Activity className="w-2.5 h-2.5 text-cyan-400" />
          <span className="text-zinc-200">MASTER EQ RESPONSE</span>
          {presetName && (
            <span className="px-1 py-0.2 rounded bg-zinc-800 text-zinc-300 font-extrabold text-[7.5px]">
              {presetName}
            </span>
          )}
        </div>

        {/* Dynamic dB Readouts */}
        <div className="flex items-center gap-2 font-mono text-[7.5px]">
          <span className={`${eq.low >= 0 ? 'text-sky-300' : 'text-rose-400'}`}>
            LOW: {eq.low > 0 ? `+${eq.low.toFixed(1)}` : eq.low.toFixed(1)}dB
          </span>
          <span className={`${eq.mid >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
            MID: {eq.mid > 0 ? `+${eq.mid.toFixed(1)}` : eq.mid.toFixed(1)}dB
          </span>
          <span className={`${eq.high >= 0 ? 'text-purple-300' : 'text-rose-400'}`}>
            HIGH: {eq.high > 0 ? `+${eq.high.toFixed(1)}` : eq.high.toFixed(1)}dB
          </span>
          {onResetEq && (
            <button
              onClick={() => {
                triggerHaptic('tap');
                onResetEq();
              }}
              className="text-zinc-500 hover:text-white p-0.5 rounded hover:bg-zinc-800 transition active:scale-95"
              title="EQ auf Flat (0dB) zurücksetzen"
            >
              <RotateCcw className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full h-16 sm:h-20">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="w-full h-full overflow-visible"
        >
          <defs>
            <linearGradient id="eqAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#a855f7" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#0c0c10" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="eqStrokeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#4ade80" />
              <stop offset="100%" stopColor="#c084fc" />
            </linearGradient>
          </defs>

          {/* Grid dB Lines */}
          {[6, 0, -6, -12].map((db) => {
            const y = dbToY(db);
            const isZero = db === 0;
            return (
              <g key={`grid-db-${db}`}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke={isZero ? '#52525b' : '#27272a'}
                  strokeDasharray={isZero ? undefined : '2 3'}
                  strokeWidth={isZero ? '1' : '0.75'}
                />
                <text
                  x={width - paddingX + 2}
                  y={y + 2.5}
                  className="font-mono text-[6px] fill-zinc-600 select-none"
                  textAnchor="start"
                >
                  {db > 0 ? `+${db}` : db}
                </text>
              </g>
            );
          })}

          {/* Frequency Vertical Markers (100 Hz, 1 kHz, 10 kHz) */}
          {[
            { hz: '100Hz', t: Math.log10(100 / 20) / 3 },
            { hz: '1kHz', t: Math.log10(1000 / 20) / 3 },
            { hz: '10kHz', t: Math.log10(10000 / 20) / 3 },
          ].map((m) => {
            const x = paddingX + m.t * plotWidth;
            return (
              <g key={m.hz}>
                <line
                  x1={x}
                  y1={paddingY}
                  x2={x}
                  y2={height - paddingY}
                  stroke="#1f1f23"
                  strokeWidth="0.75"
                />
                <text
                  x={x}
                  y={height - 2}
                  className="font-mono text-[5.5px] fill-zinc-600 select-none"
                  textAnchor="middle"
                >
                  {m.hz}
                </text>
              </g>
            );
          })}

          {/* Area Fill Under Curve */}
          <path d={pathData.area} fill="url(#eqAreaGrad)" />

          {/* Main Dynamic EQ Curve */}
          <path
            d={pathData.path}
            fill="none"
            stroke="url(#eqStrokeGrad)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="filter drop-shadow-[0_0_6px_rgba(56,189,248,0.5)]"
          />

          {/* Low, Mid, High interactive node dots */}
          <circle
            cx={paddingX + (Math.log10(120 / 20) / 3) * plotWidth}
            cy={dbToY(eq.low)}
            r="3"
            fill="#38bdf8"
            className="shadow-sm"
          />
          <circle
            cx={paddingX + (Math.log10(1000 / 20) / 3) * plotWidth}
            cy={dbToY(eq.mid)}
            r="3"
            fill="#4ade80"
            className="shadow-sm"
          />
          <circle
            cx={paddingX + (Math.log10(8000 / 20) / 3) * plotWidth}
            cy={dbToY(eq.high)}
            r="3"
            fill="#c084fc"
            className="shadow-sm"
          />
        </svg>
      </div>
    </div>
  );
};
