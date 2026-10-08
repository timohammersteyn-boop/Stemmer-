import React from 'react';
import { Play, Square, Activity, Cpu, Sliders, Shield, Code, Sparkles, Volume2 } from 'lucide-react';
import { ModSlotConfig } from '../../services/torsoS4AudioEngine';

interface StemsdingsHeaderProps {
  appMode: 'STUDIO' | 'LIVE';
  onToggleAppMode: (mode: 'STUDIO' | 'LIVE') => void;
  masterBpm: number;
  onSetBpm: (bpm: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  zenMode: boolean;
  onToggleZenMode: () => void;
  onOpenScreenEditor: () => void;
  onOpenMidiLearn: () => void;
  onOpenAndroidCodeHub: () => void;
  modSlots: ModSlotConfig[];
  midiDeviceName?: string;
  extClockSyncEnabled: boolean;
  onToggleExtClockSync: () => void;
  simulatedOrientation: 'LANDSCAPE' | 'PORTRAIT';
  onToggleOrientation: () => void;
}

export const StemsdingsHeader: React.FC<StemsdingsHeaderProps> = ({
  appMode,
  onToggleAppMode,
  masterBpm,
  onSetBpm,
  isPlaying,
  onTogglePlay,
  zenMode,
  onToggleZenMode,
  onOpenScreenEditor,
  onOpenMidiLearn,
  onOpenAndroidCodeHub,
  modSlots,
  midiDeviceName = 'NI TRAKTOR X1 DETECTED',
  extClockSyncEnabled,
  onToggleExtClockSync,
  simulatedOrientation,
  onToggleOrientation,
}) => {
  return (
    <header className="w-full bg-[#0B0B0C] border-b border-[#282A2E] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono select-none">
      {/* Brand & Tagline */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[#F9F6F0] font-extrabold tracking-widest text-sm">STEMSDINGS</span>
            <span className="text-[9px] px-1.5 py-0.5 bg-[#161719] border border-[#282A2E] text-[#8E9296] rounded-xs font-semibold">
              S4 CORE
            </span>
          </div>
          <span className="text-[9px] text-[#8E9296] tracking-wider font-medium">
            PLAY MUSIC DIFFERENT.
          </span>
        </div>

        {/* Global Workflow Mode Switcher: STUDIO vs LIVE */}
        <div className="ml-4 flex items-center bg-[#161719] border border-[#282A2E] p-0.5 rounded-xs">
          <button
            onClick={() => onToggleAppMode('STUDIO')}
            className={`px-3 py-1.5 transition-colors font-bold tracking-wider text-[10px] ${
              appMode === 'STUDIO'
                ? 'bg-[#E4E7EB] text-[#0B0B0C]'
                : 'text-[#8E9296] hover:text-[#E4E7EB]'
            }`}
          >
            [THE LAB: STUDIO]
          </button>
          <button
            onClick={() => onToggleAppMode('LIVE')}
            className={`px-3 py-1.5 transition-colors font-bold tracking-wider text-[10px] ${
              appMode === 'LIVE'
                ? 'bg-[#E4E7EB] text-[#0B0B0C]'
                : 'text-[#8E9296] hover:text-[#E4E7EB]'
            }`}
          >
            [PERFORMANCE: LIVE]
          </button>
        </div>
      </div>

      {/* Center: Transport & Master Tempo */}
      <div className="flex items-center gap-4">
        {/* Play/Stop Button */}
        <button
          onClick={onTogglePlay}
          className={`flex items-center gap-1.5 px-3 py-1.5 border transition-colors font-bold ${
            isPlaying
              ? 'bg-[#E4E7EB] text-[#0B0B0C] border-[#E4E7EB]'
              : 'bg-[#161719] text-[#8E9296] border-[#282A2E] hover:text-[#E4E7EB]'
          }`}
        >
          {isPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{isPlaying ? 'STOP' : 'PLAY'}</span>
        </button>

        {/* Master BPM Controls */}
        <div className="flex items-center bg-[#161719] border border-[#282A2E] px-2.5 py-1">
          <span className="text-[9px] text-[#8E9296] mr-2">BPM</span>
          <button
            onClick={() => onSetBpm(masterBpm - 1)}
            className="px-1 text-[#8E9296] hover:text-[#E4E7EB]"
          >
            -
          </button>
          <span className="px-2 font-bold text-[#F9F6F0] text-sm tabular-nums">
            {masterBpm.toFixed(1)}
          </span>
          <button
            onClick={() => onSetBpm(masterBpm + 1)}
            className="px-1 text-[#8E9296] hover:text-[#E4E7EB]"
          >
            +
          </button>
        </div>

        {/* Master External Clock Sync Toggle */}
        <button
          onClick={onToggleExtClockSync}
          className={`px-3 py-1.5 border transition-all duration-150 font-bold text-[10px] ${
            extClockSyncEnabled
              ? 'bg-[#00E5FF]/15 text-[#00E5FF] border-[#00E5FF] shadow-[0_0_8px_rgba(0,229,255,0.25)]'
              : 'bg-[#161719] text-[#8E9296] border-[#282A2E] hover:text-[#E4E7EB]'
          }`}
          title="Master Clock: Synchronize tempo, start and stop transitions with external MIDI Beat Clock signals"
        >
          MIDI CLOCK: {extClockSyncEnabled ? 'EXT SYNC' : 'INTERNAL'}
        </button>

        {/* 4-Slot Modulation Status Badges */}
        <div className="hidden lg:flex items-center gap-1.5 bg-[#161719] border border-[#282A2E] px-2 py-1">
          {modSlots.map((slot) => (
            <div
              key={slot.id}
              className="flex items-center gap-1 px-1 py-0.5 text-[9px]"
              title={`${slot.name} (${slot.type})`}
            >
              <span style={{ color: slot.color }} className="font-bold">
                {slot.symbol}
              </span>
              <span className="text-[#8E9296] text-[8px] tabular-nums">
                {slot.currentValue > 0 ? `+${slot.currentValue.toFixed(1)}` : slot.currentValue.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Controls: Hardware MIDI status, Zen Mode & Android Kotlin hub */}
      <div className="flex items-center gap-2">
        {/* Hardware Controller connection badge */}
        <button
          onClick={onOpenMidiLearn}
          className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-[#161719] border border-[#282A2E] text-[#8E9296] hover:border-[#8E9296] transition-colors"
          title="MIDI Learn & Hardware Connection"
        >
          <Cpu className="w-3 h-3 text-[#00E5FF]" />
          <span className="text-[9px] text-[#E4E7EB]">{midiDeviceName}</span>
        </button>

        {/* Responsive Orientation Simulator Toggle */}
        <button
          onClick={onToggleOrientation}
          className={`px-2.5 py-1 border transition-colors font-bold text-[10px] ${
            simulatedOrientation === 'PORTRAIT'
              ? 'bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF] shadow-[0_0_8px_rgba(0,229,255,0.25)]'
              : 'bg-[#161719] text-[#8E9296] border-[#282A2E] hover:text-[#E4E7EB]'
          }`}
          title="Simulate Mobile Portrait Router Page-Swiping vs Landscape pro multi-column"
        >
          SIM: {simulatedOrientation}
        </button>

        {/* Zen Mode Toggle */}
        <button
          onClick={onToggleZenMode}
          className={`px-2.5 py-1 border transition-colors font-bold text-[10px] ${
            zenMode
              ? 'bg-[#282A2E] text-[#00E676] border-[#00E676]'
              : 'bg-[#161719] text-[#8E9296] border-[#282A2E] hover:text-[#E4E7EB]'
          }`}
          title="Zen Mode: Hide visual clutter while audio processes 100% in background"
        >
          ZEN {zenMode ? '[ON]' : '[OFF]'}
        </button>

        {/* Screen Editor Modal Trigger */}
        <button
          onClick={onOpenScreenEditor}
          className="px-2 py-1 bg-[#161719] border border-[#282A2E] text-[#8E9296] hover:text-[#E4E7EB] hover:border-[#8E9296] transition-colors"
          title="Screen Editor: Configure Visible Modules"
        >
          <Sliders className="w-3 h-3" />
        </button>

        {/* Native Android Jetpack Compose Code Inspector */}
        <button
          onClick={onOpenAndroidCodeHub}
          className="flex items-center gap-1 px-2.5 py-1 bg-[#161719] border border-[#282A2E] text-[#00E5FF] hover:bg-[#282A2E] transition-colors font-bold text-[10px]"
          title="Inspect Native Android Jetpack Compose & Kotlin Code"
        >
          <Code className="w-3 h-3" />
          <span>ANDROID (KOTLIN)</span>
        </button>
      </div>
    </header>
  );
};
