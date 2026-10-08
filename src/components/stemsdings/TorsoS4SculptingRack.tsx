import React, { useState, useEffect, useRef } from 'react';
import {
  S4DeviceType,
  S4ChainParams,
  ModSlotConfig,
  ModSlotId,
  LiveStemItem,
} from '../../services/torsoS4AudioEngine';
import { Sparkles, Sliders, Play, RotateCcw, Lock, Unlock, ChevronDown, Check } from 'lucide-react';

interface TorsoS4SculptingRackProps {
  activeDevice: S4DeviceType;
  onSelectDevice: (device: S4DeviceType) => void;
  stem: LiveStemItem;
  onUpdateParams: (params: Partial<S4ChainParams>) => void;
  modSlots: ModSlotConfig[];
  onUpdateModSlot: (id: ModSlotId, updates: Partial<ModSlotConfig>) => void;
  onTriggerHud: (paramName: string, valueDisplay: string, slotSymbol?: string, modColor?: string) => void;
}

export const TorsoS4SculptingRack: React.FC<TorsoS4SculptingRackProps> = ({
  activeDevice,
  onSelectDevice,
  stem,
  onUpdateParams,
  modSlots,
  onUpdateModSlot,
  onTriggerHud,
}) => {
  const [showModMatrix, setShowModMatrix] = useState<boolean>(false);
  const [activeModSlotId, setActiveModSlotId] = useState<ModSlotId>('SLOT_1');

  const granularCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const filterCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const params = stem.params;

  // Render Granular Particle Cloud Visualizer
  useEffect(() => {
    if (activeDevice !== 'GRANULAR') return;
    const canvas = granularCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const grains: Array<{ x: number; y: number; size: number; alpha: number; speedX: number; speedY: number }> = [];

    // Init grains based on density
    const count = Math.floor(params.grainDensity * 40) + 10;
    for (let i = 0; i < count; i++) {
      grains.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: params.grainSize * 6 + 1.5,
        alpha: Math.random() * 0.7 + 0.3,
        speedX: (Math.random() - 0.5) * (params.granularSpray * 3 + 0.5),
        speedY: (Math.random() - 0.5) * (params.granularSpray * 3 + 0.5),
      });
    }

    const render = () => {
      ctx.fillStyle = '#0B0B0C';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#E4E7EB';
      grains.forEach((g) => {
        g.x += g.speedX;
        g.y += g.speedY;
        if (g.x < 0) g.x = canvas.width;
        if (g.x > canvas.width) g.x = 0;
        if (g.y < 0) g.y = canvas.height;
        if (g.y > canvas.height) g.y = 0;

        ctx.globalAlpha = g.alpha;
        ctx.fillRect(g.x, g.y, g.size, g.size);
      });
      ctx.globalAlpha = 1.0;

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [activeDevice, params.grainDensity, params.grainSize, params.granularSpray]);

  // Render Filter Response Graph
  useEffect(() => {
    if (activeDevice !== 'FILTER') return;
    const canvas = filterCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#0B0B0C';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = '#1E2024';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Filter curve
    ctx.strokeStyle = '#E4E7EB';
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    const cutoffX = params.filterCutoff * w;
    const resPeak = params.filterResonance * (h * 0.4);

    for (let x = 0; x < w; x += 2) {
      let y = h * 0.3;
      if (params.filterMode === 'LOWPASS') {
        if (x < cutoffX) {
          y = h * 0.3 - (Math.max(0, 1 - Math.abs(x - cutoffX) / 30) * resPeak);
        } else {
          y = (h * 0.3) + Math.pow((x - cutoffX) / (w - cutoffX), 2) * (h * 0.6);
        }
      } else if (params.filterMode === 'HIGHPASS') {
        if (x > cutoffX) {
          y = h * 0.3 - (Math.max(0, 1 - Math.abs(x - cutoffX) / 30) * resPeak);
        } else {
          y = (h * 0.3) + Math.pow((cutoffX - x) / cutoffX, 2) * (h * 0.6);
        }
      } else {
        // BANDPASS
        const dist = Math.abs(x - cutoffX);
        y = h * 0.3 + (dist / (w * 0.4)) * (h * 0.5) - (Math.max(0, 1 - dist / 30) * resPeak);
      }

      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, Math.max(4, Math.min(h - 4, y)));
    }
    ctx.stroke();
  }, [activeDevice, params.filterCutoff, params.filterResonance, params.filterMode]);

  // Helper to render hardware encoder with push-to-reset and modulation badge
  const renderEncoder = (
    label: string,
    value: number, // 0.0 to 1.0
    displayValue: string,
    onChange: (val: number) => void,
    onReset: () => void,
    targetKey: string
  ) => {
    // Check if any modulation slot targets this parameter
    const matchedSlot = modSlots.find((s) => s.targetParam === targetKey);
    const modOffset = matchedSlot ? matchedSlot.currentValue * 0.15 : 0;
    const effectiveVal = Math.max(0, Math.min(1, value + modOffset));

    return (
      <div
        key={label}
        onDoubleClick={onReset}
        className="flex-1 flex flex-col items-center justify-between p-2 bg-[#0B0B0C] border border-[#282A2E] hover:border-[#8E9296] select-none group"
      >
        <span className="text-[9px] text-[#8E9296] font-bold tracking-wider">{label}</span>

        {/* Circular Dial Visualizer */}
        <div className="relative w-12 h-12 flex items-center justify-center my-1">
          <svg className="w-full h-full -rotate-90">
            {/* Background Arc */}
            <circle
              cx="24"
              cy="24"
              r="18"
              fill="none"
              stroke="#282A2E"
              strokeWidth="2.5"
            />
            {/* Value Arc (Color only if modulated) */}
            <circle
              cx="24"
              cy="24"
              r="18"
              fill="none"
              stroke={matchedSlot ? matchedSlot.color : '#E4E7EB'}
              strokeWidth="2.5"
              strokeDasharray="113"
              strokeDashoffset={113 * (1 - effectiveVal)}
              strokeLinecap="butt"
            />
          </svg>

          {/* Center Indicator Dot or Mod Symbol */}
          <div className="absolute inset-0 flex items-center justify-center">
            {matchedSlot ? (
              <span style={{ color: matchedSlot.color }} className="text-[10px] font-bold">
                {matchedSlot.symbol}
              </span>
            ) : (
              <div className="w-1.5 h-1.5 bg-[#8E9296]" />
            )}
          </div>

          {/* Invisible interactive input */}
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={value}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              onChange(v);
              onTriggerHud(label, `${Math.round(v * 100)}%`, matchedSlot?.symbol, matchedSlot?.color);
            }}
            className="absolute inset-0 opacity-0 cursor-pointer h-full w-full"
            title={`${label}: Double-click or push to reset`}
          />
        </div>

        {/* Value Readout & Push to Reset Hint */}
        <div className="flex items-center gap-1 text-[9px]">
          <span className="text-[#E4E7EB] font-bold tabular-nums">{displayValue}</span>
          <button
            onClick={onReset}
            className="text-[8px] text-[#8E9296] hover:text-[#E4E7EB] px-1 bg-[#161719] border border-[#282A2E]"
            title="Push to reset to default"
          >
            PUSH
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-[#161719] border border-[#282A2E] p-3 flex flex-col gap-3 font-mono text-[#E4E7EB]">
      {/* S4 Header: Stage Tabs & Modulation Drawer Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#282A2E]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#F9F6F0] tracking-wider">
            TORSO S4 CHAIN // STEM: [{stem.name}]
          </span>
        </div>

        {/* 5-Stage Serial Tabs */}
        <div className="flex items-center gap-1 bg-[#0B0B0C] border border-[#282A2E] p-0.5">
          {(['MATERIAL', 'GRANULAR', 'FILTER', 'COLOR', 'SPACE'] as const).map((stage, idx) => (
            <button
              key={stage}
              onClick={() => onSelectDevice(stage)}
              className={`px-2.5 py-1 text-[10px] font-bold tracking-wider transition-colors ${
                activeDevice === stage
                  ? 'bg-[#E4E7EB] text-[#0B0B0C]'
                  : 'text-[#8E9296] hover:text-[#E4E7EB]'
              }`}
            >
              {idx + 1}. {stage}
            </button>
          ))}
        </div>

        {/* Modulation Matrix Drawer Toggle */}
        <button
          onClick={() => setShowModMatrix(!showModMatrix)}
          className={`flex items-center gap-1.5 px-2.5 py-1 border text-[10px] font-bold transition-colors ${
            showModMatrix
              ? 'bg-[#282A2E] text-[#00E5FF] border-[#00E5FF]'
              : 'bg-[#0B0B0C] text-[#8E9296] border-[#282A2E] hover:text-[#E4E7EB]'
          }`}
        >
          <Sparkles className="w-3 h-3 text-[#00E5FF]" />
          <span>MOD MATRIX (4 SLOTS)</span>
        </button>
      </div>

      {/* 9 PHYSICAL ENCODERS & DEDICATED VISUALIZER FOR ACTIVE STAGE */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Encoders Row */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {activeDevice === 'MATERIAL' && (
            <>
              {renderEncoder(
                'TAPE SPEED',
                (params.tapeSpeed + 2) / 4,
                `${Math.round(params.tapeSpeed * 100)}%`,
                (v) => onUpdateParams({ tapeSpeed: v * 4 - 2 }),
                () => onUpdateParams({ tapeSpeed: 1.0, tapeReverse: false }),
                'tapeSpeed'
              )}
              {renderEncoder(
                'X-FADE',
                params.tapeCrossfade,
                `${Math.round(params.tapeCrossfade * 100)}%`,
                (v) => onUpdateParams({ tapeCrossfade: v }),
                () => onUpdateParams({ tapeCrossfade: 0.15 }),
                'tapeCrossfade'
              )}
              {renderEncoder(
                'LOOP LENGTH',
                params.loopBars / 16,
                `${params.loopBars} BARS`,
                (v) => onUpdateParams({ loopBars: v > 0.5 ? 16 : v > 0.25 ? 8 : 4 }),
                () => onUpdateParams({ loopBars: 4 }),
                'loopBars'
              )}
              <div className="flex-1 flex flex-col items-center justify-between p-2 bg-[#0B0B0C] border border-[#282A2E]">
                <span className="text-[9px] text-[#8E9296] font-bold">REVERSE</span>
                <button
                  onClick={() => onUpdateParams({ tapeReverse: !params.tapeReverse, tapeSpeed: -params.tapeSpeed })}
                  className={`px-3 py-1.5 border font-bold text-[10px] my-auto ${
                    params.tapeReverse
                      ? 'bg-[#E4E7EB] text-[#0B0B0C] border-[#E4E7EB]'
                      : 'bg-[#161719] text-[#8E9296] border-[#282A2E]'
                  }`}
                >
                  {params.tapeReverse ? 'REV ON' : 'FWD'}
                </button>
                <span className="text-[8px] text-[#8E9296]">VARISPEED</span>
              </div>
            </>
          )}

          {activeDevice === 'GRANULAR' && (
            <>
              {renderEncoder(
                'GRAIN SIZE',
                params.grainSize,
                `${Math.round(params.grainSize * 400 + 10)}ms`,
                (v) => onUpdateParams({ grainSize: v }),
                () => onUpdateParams({ grainSize: 0.25 }),
                'grainSize'
              )}
              {renderEncoder(
                'DENSITY',
                params.grainDensity,
                `${Math.round(params.grainDensity * 64)}/s`,
                (v) => onUpdateParams({ grainDensity: v }),
                () => onUpdateParams({ grainDensity: 0.5 }),
                'grainDensity'
              )}
              {renderEncoder(
                'SPRAY',
                params.granularSpray,
                `${Math.round(params.granularSpray * 100)}%`,
                (v) => onUpdateParams({ granularSpray: v }),
                () => onUpdateParams({ granularSpray: 0.0 }),
                'granularSpray'
              )}
              {renderEncoder(
                'CONTOUR',
                params.warpContour,
                `${Math.round(params.warpContour * 100)}%`,
                (v) => onUpdateParams({ warpContour: v }),
                () => onUpdateParams({ warpContour: 0.4 }),
                'warpContour'
              )}
            </>
          )}

          {activeDevice === 'FILTER' && (
            <>
              {renderEncoder(
                'CUTOFF',
                params.filterCutoff,
                `${Math.round(params.filterCutoff * 100)}%`,
                (v) => onUpdateParams({ filterCutoff: v }),
                () => onUpdateParams({ filterCutoff: 0.7 }),
                'filterCutoff'
              )}
              {renderEncoder(
                'RESONANCE',
                params.filterResonance,
                `${Math.round(params.filterResonance * 100)}%`,
                (v) => onUpdateParams({ filterResonance: v }),
                () => onUpdateParams({ filterResonance: 0.3 }),
                'filterResonance'
              )}
              <div className="flex-1 flex flex-col items-center justify-between p-2 bg-[#0B0B0C] border border-[#282A2E]">
                <span className="text-[9px] text-[#8E9296] font-bold">MODE</span>
                <select
                  value={params.filterMode}
                  onChange={(e) => onUpdateParams({ filterMode: e.target.value as any })}
                  className="bg-[#161719] border border-[#282A2E] text-[#E4E7EB] text-[10px] px-1 py-1 my-auto focus:outline-none"
                >
                  <option value="LOWPASS">LOWPASS</option>
                  <option value="HIGHPASS">HIGHPASS</option>
                  <option value="BANDPASS">BANDPASS</option>
                  <option value="NOTCH">NOTCH</option>
                </select>
                <span className="text-[8px] text-[#8E9296]">12dB/OCT</span>
              </div>
              {renderEncoder(
                'DRIVE',
                params.colorDrive,
                `${Math.round(params.colorDrive * 100)}%`,
                (v) => onUpdateParams({ colorDrive: v }),
                () => onUpdateParams({ colorDrive: 0.0 }),
                'colorDrive'
              )}
            </>
          )}

          {activeDevice === 'COLOR' && (
            <>
              {renderEncoder(
                'DRIVE',
                params.colorDrive,
                `${Math.round(params.colorDrive * 100)}%`,
                (v) => onUpdateParams({ colorDrive: v }),
                () => onUpdateParams({ colorDrive: 0.0 }),
                'colorDrive'
              )}
              {renderEncoder(
                'BIT DEPTH',
                (params.bitDepth - 4) / 12,
                `${params.bitDepth} BITS`,
                (v) => onUpdateParams({ bitDepth: Math.round(v * 12 + 4) }),
                () => onUpdateParams({ bitDepth: 16 }),
                'bitDepth'
              )}
              {renderEncoder(
                'SR CRUSH',
                params.sampleRateCrush,
                `${Math.round(params.sampleRateCrush * 100)}%`,
                (v) => onUpdateParams({ sampleRateCrush: v }),
                () => onUpdateParams({ sampleRateCrush: 0.0 }),
                'sampleRateCrush'
              )}
              {renderEncoder(
                'NOISE',
                params.analogNoise / 0.3,
                `${Math.round((params.analogNoise / 0.3) * 100)}%`,
                (v) => onUpdateParams({ analogNoise: v * 0.3 }),
                () => onUpdateParams({ analogNoise: 0.0 }),
                'analogNoise'
              )}
            </>
          )}

          {activeDevice === 'SPACE' && (
            <>
              {renderEncoder(
                'DELAY FB',
                params.delayFeedback,
                `${Math.round(params.delayFeedback * 100)}%`,
                (v) => onUpdateParams({ delayFeedback: v }),
                () => onUpdateParams({ delayFeedback: 0.3 }),
                'delayFeedback'
              )}
              {renderEncoder(
                'ROOM SIZE',
                params.reverbRoomSize,
                `${Math.round(params.reverbRoomSize * 100)}%`,
                (v) => onUpdateParams({ reverbRoomSize: v }),
                () => onUpdateParams({ reverbRoomSize: 0.5 }),
                'reverbRoomSize'
              )}
              {renderEncoder(
                'DAMPING',
                params.reverbDamping,
                `${Math.round(params.reverbDamping * 100)}%`,
                (v) => onUpdateParams({ reverbDamping: v }),
                () => onUpdateParams({ reverbDamping: 0.4 }),
                'reverbDamping'
              )}
              {/* MASTER FREEZE BUTTON */}
              <div className="flex-1 flex flex-col items-center justify-between p-2 bg-[#0B0B0C] border border-[#282A2E]">
                <span className="text-[9px] text-[#8E9296] font-bold">MASTER FREEZE</span>
                <button
                  onClick={() => {
                    const newState = !params.masterFreeze;
                    onUpdateParams({ masterFreeze: newState });
                    onTriggerHud('FREEZE', newState ? 'LATCHED' : 'OFF', '●', '#FF1744');
                  }}
                  className={`px-3 py-2 border font-bold text-[10px] my-auto transition-colors ${
                    params.masterFreeze
                      ? 'bg-[#FF1744] text-[#0B0B0C] border-[#FF1744] shadow-[0_0_12px_rgba(255,23,68,0.5)]'
                      : 'bg-[#161719] text-[#8E9296] border-[#282A2E] hover:text-[#E4E7EB]'
                  }`}
                >
                  {params.masterFreeze ? 'FROZEN [●]' : 'HOLD FREEZE'}
                </button>
                <span className="text-[8px] text-[#8E9296]">INFINITE DRONE</span>
              </div>
            </>
          )}
        </div>

        {/* Stage-Specific Visual Display (Cloud / Curve / Varispeed) */}
        <div className="w-full lg:w-48 h-28 bg-[#0B0B0C] border border-[#282A2E] p-1 flex flex-col justify-between">
          <div className="flex items-center justify-between px-1 text-[8px] text-[#8E9296]">
            <span>{activeDevice} VISUALIZER</span>
            <span className="text-[#E4E7EB]">60 FPS</span>
          </div>

          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            {activeDevice === 'GRANULAR' && (
              <canvas ref={granularCanvasRef} width={180} height={80} className="w-full h-full block" />
            )}
            {activeDevice === 'FILTER' && (
              <canvas ref={filterCanvasRef} width={180} height={80} className="w-full h-full block" />
            )}
            {activeDevice === 'MATERIAL' && (
              <div className="text-center font-mono">
                <div className="text-lg font-bold text-[#F9F6F0]">
                  {params.tapeSpeed > 0 ? `+${(params.tapeSpeed * 100).toFixed(0)}%` : `${(params.tapeSpeed * 100).toFixed(0)}%`}
                </div>
                <div className="text-[9px] text-[#8E9296]">
                  {params.tapeReverse ? '[TAPE HEAD REVERSED]' : '[TAPE HEAD FORWARD]'}
                </div>
              </div>
            )}
            {activeDevice === 'COLOR' && (
              <div className="text-center font-mono">
                <div className="text-sm font-bold text-[#F9F6F0]">
                  {params.bitDepth} BITS / {(44.1 * (1 - params.sampleRateCrush * 0.75)).toFixed(1)} kHz
                </div>
                <div className="text-[9px] text-[#8E9296]">ANALOG HARMONIC SATURATION</div>
              </div>
            )}
            {activeDevice === 'SPACE' && (
              <div className="text-center font-mono">
                <div className="text-sm font-bold text-[#F9F6F0]">
                  {params.masterFreeze ? 'DRONE LATCH ACTIVE' : 'DIFFUSE STEREO SPACE'}
                </div>
                <div className="text-[9px] text-[#8E9296]">TENSOR ROOM GEOMETRY</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODULATION MATRIX DRAWER (4-SLOT SYSTEM) */}
      {showModMatrix && (
        <div className="w-full bg-[#0B0B0C] border border-[#282A2E] p-3 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs pb-1 border-b border-[#282A2E]">
            <span className="font-bold tracking-wider text-[#F9F6F0]">
              4-SLOT MODULATION MATRIX // S4 GEOMETRIC SYSTEM
            </span>
            <div className="flex items-center gap-1">
              {modSlots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => setActiveModSlotId(slot.id)}
                  style={{
                    borderColor: activeModSlotId === slot.id ? slot.color : '#282A2E',
                    color: activeModSlotId === slot.id ? slot.color : '#8E9296',
                  }}
                  className="px-2 py-0.5 border text-[10px] font-bold bg-[#161719]"
                >
                  {slot.symbol} {slot.name}
                </button>
              ))}
            </div>
          </div>

          {/* Active Slot Configuration */}
          {(() => {
            const slot = modSlots.find((s) => s.id === activeModSlotId);
            if (!slot) return null;

            return (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-[10px]">
                {/* Waveform / Type */}
                <div className="flex flex-col gap-1">
                  <span className="text-[#8E9296]">MODULATOR TYPE:</span>
                  <div className="flex gap-1">
                    {(['SINE', 'TRIANGLE', 'SAW', 'SQUARE'] as const).map((wf) => (
                      <button
                        key={wf}
                        onClick={() => onUpdateModSlot(slot.id, { waveform: wf })}
                        className={`flex-1 py-1 text-[8px] font-bold border ${
                          slot.waveform === wf
                            ? 'bg-[#E4E7EB] text-[#0B0B0C] border-[#E4E7EB]'
                            : 'bg-[#161719] text-[#8E9296] border-[#282A2E]'
                        }`}
                      >
                        {wf.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rate */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span className="text-[#8E9296]">LFO RATE:</span>
                    <span className="text-[#E4E7EB] font-bold">{slot.rateHz.toFixed(1)} Hz</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={slot.rateHz}
                    onChange={(e) => onUpdateModSlot(slot.id, { rateHz: parseFloat(e.target.value) })}
                    className="w-full cursor-pointer"
                  />
                </div>

                {/* Depth */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span className="text-[#8E9296]">DEPTH:</span>
                    <span className="text-[#E4E7EB] font-bold">{Math.round(slot.depth * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={slot.depth}
                    onChange={(e) => onUpdateModSlot(slot.id, { depth: parseFloat(e.target.value) })}
                    className="w-full cursor-pointer"
                  />
                </div>

                {/* Target Parameter Assignment */}
                <div className="flex flex-col gap-1">
                  <span className="text-[#8E9296]">TARGET PARAMETER:</span>
                  <select
                    value={slot.targetParam || ''}
                    onChange={(e) => onUpdateModSlot(slot.id, { targetParam: e.target.value || null })}
                    className="bg-[#161719] border border-[#282A2E] text-[#E4E7EB] px-2 py-1 text-[10px] focus:outline-none"
                  >
                    <option value="">[NONE / UNASSIGNED]</option>
                    <option value="filterCutoff">FILTER CUTOFF</option>
                    <option value="filterResonance">FILTER RESONANCE</option>
                    <option value="granularSpray">GRANULAR SPRAY</option>
                    <option value="grainSize">GRAIN SIZE</option>
                    <option value="tapeSpeed">TAPE SPEED</option>
                    <option value="colorDrive">COLOR DRIVE</option>
                    <option value="delayFeedback">DELAY FEEDBACK</option>
                  </select>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
