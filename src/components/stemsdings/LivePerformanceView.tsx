import React, { useEffect, useRef } from 'react';
import { Volume2, VolumeX, Radio, Sliders, ChevronDown, Repeat } from 'lucide-react';
import { LiveStemItem, ModSlotConfig, torsoS4Engine } from '../../services/torsoS4AudioEngine';

interface LivePerformanceViewProps {
  stems: LiveStemItem[];
  selectedStemId: string;
  onSelectStem: (id: string) => void;
  onUpdateStemVolume: (id: string, vol: number) => void;
  onToggleStemMute: (id: string) => void;
  onToggleStemSolo: (id: string) => void;
  crossfader: number;
  onSetCrossfader: (pos: number) => void;
  crossfaderCurve: 'SMOOTH' | 'LINEAR' | 'CUT';
  onSetCrossfaderCurve: (curve: 'SMOOTH' | 'LINEAR' | 'CUT') => void;
  zenMode: boolean;
  showMiniWaveforms: boolean;
  showLiveModulations: boolean;
  modSlots: ModSlotConfig[];
  isPlaylistImportedBlip?: boolean;
  highlightedStemIds?: string[];
}

export const LivePerformanceView: React.FC<LivePerformanceViewProps> = ({
  stems,
  selectedStemId,
  onSelectStem,
  onUpdateStemVolume,
  onToggleStemMute,
  onToggleStemSolo,
  crossfader,
  onSetCrossfader,
  crossfaderCurve,
  onSetCrossfaderCurve,
  zenMode,
  showMiniWaveforms,
  showLiveModulations,
  modSlots,
  isPlaylistImportedBlip = false,
  highlightedStemIds,
}) => {
  const stemsZoneA = stems.filter((s) => s.zone === 'A');
  const stemsZoneB = stems.filter((s) => s.zone === 'B');

  // Ref to track peak meter DOM elements
  const meterRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    let animationFrameId: number;

    const updateMeters = () => {
      const isPlaying = torsoS4Engine.getIsPlaying();

      stems.forEach((stem) => {
        const el = meterRefs.current[stem.id];
        if (!el) return;

        let level = 0;
        if (isPlaying && !stem.isMuted) {
          // Get actual Web Audio analyser level
          level = torsoS4Engine.getStemLevel(stem.id);

          if (level === 0) {
            // Procedural fallback if Web Audio is silent/uninitialized but playing
            const time = performance.now() * 0.015;
            // Introduce some random/sinusoidal dance
            const wave =
              Math.sin(time + stem.id.charCodeAt(0)) * 0.35 +
              Math.cos(time * 0.7 + stem.id.charCodeAt(1)) * 0.15 +
              0.5;
            level = wave * stem.volume;
          } else {
            // Scale and boost the real analyser level for excellent visibility
            level = level * stem.volume * 1.6;
          }
        } else if (!isPlaying && !stem.isMuted && stem.volume > 0) {
          // Subtle ambient idle breathing when not playing
          const time = performance.now() * 0.002;
          const wave = Math.sin(time + stem.id.charCodeAt(0)) * 0.08 + 0.1;
          level = wave * stem.volume;
        }

        // Apply clamping
        const clampedLevel = Math.max(0, Math.min(1.0, level));

        // Direct DOM write for 60 FPS rendering without React overhead
        el.style.transform = `scaleY(${clampedLevel})`;
        // Reduce brightness slightly when level is low
        el.style.opacity = stem.isMuted ? '0.15' : `${0.45 + clampedLevel * 0.55}`;
      });

      animationFrameId = requestAnimationFrame(updateMeters);
    };

    animationFrameId = requestAnimationFrame(updateMeters);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [stems]);

  const renderStemStrip = (stem: LiveStemItem) => {
    const isSelected = stem.id === selectedStemId;
    const isStemHighlighted =
      isPlaylistImportedBlip &&
      (!highlightedStemIds || highlightedStemIds.length === 0 || highlightedStemIds.includes(stem.id));

    return (
      <div
        key={stem.id}
        onClick={() => onSelectStem(stem.id)}
        className={`flex-1 flex flex-col transition-all duration-300 cursor-pointer select-none p-2 relative overflow-hidden ${
          isStemHighlighted
            ? 'bg-[#00E5FF]/10 border-2 border-[#00E5FF] shadow-[0_0_24px_rgba(0,229,255,0.5)] ring-1 ring-[#00E5FF] scale-[1.02]'
            : isSelected
            ? 'bg-[#0B0B0C] border-[#E4E7EB]'
            : 'bg-[#0B0B0C] border-[#282A2E] hover:border-[#8E9296]'
        }`}
      >
        {/* Animated highlight shimmer bar if highlighted by PlaylistImported */}
        {isStemHighlighted && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#00E5FF] shadow-[0_0_8px_#00E5FF] animate-pulse" />
        )}

        {/* Header: Name & Bar Division */}
        <div className="flex items-center justify-between pb-1.5 border-b border-[#1E2024]">
          <div className="flex flex-col truncate">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-[#F9F6F0] tracking-wider truncate">
                {stem.name}
              </span>
              {isStemHighlighted && (
                <span className="text-[7px] px-1 py-0.2 bg-[#00E5FF] text-[#0B0B0C] font-extrabold tracking-widest animate-pulse rounded-xs">
                  SYNC
                </span>
              )}
            </div>
            <span className="text-[8px] text-[#8E9296] truncate">
              {stem.trackTitle}
            </span>
          </div>
          <span className="text-[8px] px-1 py-0.2 bg-[#161719] text-[#E4E7EB] border border-[#282A2E] font-bold">
            {stem.bars}B
          </span>
        </div>

        {/* Mini Waveform Display (Hidden in Zen mode if configured) */}
        {!zenMode && showMiniWaveforms && (
          <div className="w-full h-8 my-2 bg-[#161719] border border-[#282A2E] overflow-hidden flex items-center justify-around px-1">
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                className="w-0.5 bg-[#8E9296]"
                style={{
                  height: `${Math.max(15, (Math.sin(i * 0.8) * 0.5 + 0.5) * 85)}%`,
                  opacity: stem.isMuted ? 0.2 : 0.8,
                }}
              />
            ))}
          </div>
        )}

        {/* Mute & Solo Hardware Buttons */}
        <div className="flex items-center gap-1 my-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleStemMute(stem.id);
            }}
            className={`flex-1 py-1 text-[9px] font-bold border transition-colors ${
              stem.isMuted
                ? 'bg-[#E4E7EB] text-[#0B0B0C] border-[#E4E7EB]'
                : 'bg-[#161719] text-[#8E9296] border-[#282A2E] hover:text-[#E4E7EB]'
            }`}
          >
            MUTE
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleStemSolo(stem.id);
            }}
            className={`flex-1 py-1 text-[9px] font-bold border transition-colors ${
              stem.isSolo
                ? 'bg-[#E4E7EB] text-[#0B0B0C] border-[#E4E7EB]'
                : 'bg-[#161719] text-[#8E9296] border-[#282A2E] hover:text-[#E4E7EB]'
            }`}
          >
            SOLO
          </button>
        </div>

        {/* Tactile Vertical Volume Fader & Visual LED Peak Meter */}
        <div className="flex-1 flex flex-col items-center justify-center py-2">
          <div className="flex items-stretch gap-1.5 h-36">
            {/* Fader Track */}
            <div className="relative w-7 bg-[#161719] border border-[#282A2E] flex flex-col justify-end p-0.5">
              {/* Background scale marks */}
              <div className="absolute inset-y-1 left-0.5 w-1 flex flex-col justify-between pointer-events-none opacity-40">
                {Array.from({ length: 9 }).map((_, idx) => (
                  <div key={idx} className="w-1 h-px bg-[#8E9296]" />
                ))}
              </div>

              {/* Level Fill */}
              <div
                className="w-full bg-[#282A2E] transition-all"
                style={{
                  height: `${stem.volume * 100}%`,
                  opacity: stem.isMuted ? 0.3 : 1,
                }}
              />

              {/* Fader Handle Line */}
              <div
                className="absolute left-0 right-0 h-2 bg-[#E4E7EB] border border-[#0B0B0C] shadow-sm pointer-events-none"
                style={{
                  bottom: `calc(${stem.volume * 100}% - 4px)`,
                }}
              />

              {/* Invisible Slider Input for Dragging */}
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={stem.volume}
                onChange={(e) => onUpdateStemVolume(stem.id, parseFloat(e.target.value))}
                className="absolute inset-0 opacity-0 cursor-pointer h-full w-full"
              />
            </div>

            {/* LED Peak Meter */}
            <div className="w-2 bg-[#161719] border border-[#282A2E] rounded-xs flex flex-col justify-end p-0.5 relative overflow-hidden shrink-0">
              {/* Segment dividers for realistic LED effect */}
              <div className="absolute inset-0 flex flex-col justify-between p-0.5 opacity-25 pointer-events-none z-10">
                {Array.from({ length: 12 }).map((_, idx) => (
                  <div key={idx} className="w-full h-[1.5px] bg-[#0B0B0C]" />
                ))}
              </div>

              {/* High-Performance 60 FPS Meter Bar */}
              <div
                ref={(el) => {
                  meterRefs.current[stem.id] = el;
                }}
                className="w-full h-full bg-gradient-to-t from-[#00E676] via-[#FFEA00] to-[#FF1744] origin-bottom transition-transform duration-75 ease-out scale-y-0"
                style={{
                  transform: 'scaleY(0)',
                }}
              />
            </div>
          </div>

          <span className="text-[9px] text-[#8E9296] mt-1.5 tabular-nums">
            {Math.round(stem.volume * 100)}%
          </span>
        </div>

        {/* Bottom: Active S4 Stage Badge & Modulation Indicators */}
        <div className="pt-1 border-t border-[#1E2024] flex items-center justify-between text-[8px]">
          <span className="text-[#8E9296] font-semibold">{stem.activeDevice}</span>

          {/* Mod Slots targeting this stem */}
          {showLiveModulations && (
            <div className="flex items-center gap-0.5">
              <span className="text-[#00E5FF]">▲</span>
              <span className="text-[#FFEA00]">■</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex-1 flex flex-col gap-3 p-4 bg-[#0B0B0C] text-[#E4E7EB] font-mono select-none overflow-y-auto">
      {/* 8-STEM MATRIX: ZONE A (4 Stems) & ZONE B (4 Stems) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1">
        {/* ZONE A (SET A LINKS) */}
        <div className="flex flex-col bg-[#161719] border border-[#282A2E] p-3">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#282A2E]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-[#F9F6F0] tracking-widest">
                ZONE A [DECK LEFT]
              </span>
              <span className="text-[9px] text-[#8E9296]">4 SYNCHRONOUS STEMS</span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 bg-[#0B0B0C] text-[#E4E7EB] border border-[#282A2E]">
              TIME-STRETCHED
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
            {stemsZoneA.map(renderStemStrip)}
          </div>
        </div>

        {/* ZONE B (SET B RECHTS) */}
        <div className="flex flex-col bg-[#161719] border border-[#282A2E] p-3">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#282A2E]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-[#F9F6F0] tracking-widest">
                ZONE B [DECK RIGHT]
              </span>
              <span className="text-[9px] text-[#8E9296]">4 SYNCHRONOUS STEMS</span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 bg-[#0B0B0C] text-[#E4E7EB] border border-[#282A2E]">
              TIME-STRETCHED
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
            {stemsZoneB.map(renderStemStrip)}
          </div>
        </div>
      </div>

      {/* CENTER DJ CROSSFADER SECTION */}
      <div className="w-full bg-[#161719] border border-[#282A2E] p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-bold text-[#8E9296]">ZONE A (100% LEFT)</span>
          <div className="flex items-center gap-2">
            <span className="text-[#8E9296]">CROSSFADER CURVE:</span>
            <div className="flex bg-[#0B0B0C] border border-[#282A2E] p-0.5">
              {(['SMOOTH', 'LINEAR', 'CUT'] as const).map((curve) => (
                <button
                  key={curve}
                  onClick={() => onSetCrossfaderCurve(curve)}
                  className={`px-2 py-0.5 text-[9px] font-bold ${
                    crossfaderCurve === curve
                      ? 'bg-[#E4E7EB] text-[#0B0B0C]'
                      : 'text-[#8E9296] hover:text-[#E4E7EB]'
                  }`}
                >
                  {curve}
                </button>
              ))}
            </div>
          </div>
          <span className="font-bold text-[#8E9296]">ZONE B (100% RIGHT)</span>
        </div>

        {/* Physical Crossfader Rail */}
        <div className="relative w-full h-8 bg-[#0B0B0C] border border-[#282A2E] flex items-center px-2">
          {/* Center Detent mark */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-[#282A2E] -translate-x-1/2 pointer-events-none" />

          {/* Fader Handle */}
          <div
            className="absolute top-1 bottom-1 w-8 bg-[#E4E7EB] border border-[#0B0B0C] shadow-md pointer-events-none flex items-center justify-center -translate-x-1/2"
            style={{ left: `${crossfader * 100}%` }}
          >
            <div className="w-0.5 h-4 bg-[#0B0B0C]" />
          </div>

          {/* Invisible Range Slider */}
          <input
            type="range"
            min="0"
            max="1"
            step="0.005"
            value={crossfader}
            onChange={(e) => onSetCrossfader(parseFloat(e.target.value))}
            className="w-full opacity-0 cursor-ew-resize h-full"
          />
        </div>
      </div>
    </div>
  );
};
