import React, { useState } from 'react';
import { StemData, StemId, FaderCurve, TrackData } from '../../types';
import { StemMixerChannel } from '../StemMixerChannel';
import { LevelMeter } from '../LevelMeter';
import { Crossfader, CrossfaderCurve } from '../Crossfader';
import { PhaseMeter } from '../PhaseMeter';
import { EqResponseGraph } from '../EqResponseGraph';
import { Lock, Gauge, ChevronDown, ChevronUp, Columns, Activity, Sliders } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import { MasterEqSettings } from '../../types';

interface MixScreenProps {
  stems: StemData[];
  onVolumeChange: (stemId: StemId, vol: number) => void;
  onToggleMute: (stemId: StemId) => void;
  onToggleSolo: (stemId: StemId) => void;
  masterLevel: number;
  masterVolume: number;
  onMasterVolumeChange: (vol: number) => void;
  hardwareMode?: boolean;
  faderCurve?: FaderCurve;
  isKeyLockActive?: boolean;
  onToggleKeyLock?: () => void;
  trackKey?: string;
  bpm?: number;
  isMasterClipping?: boolean;
  onTriggerTestClip?: () => void;
  masterEq?: MasterEqSettings;
  onMasterEqChange?: (updates: Partial<MasterEqSettings>) => void;
  masterEqPreset?: string;
  // Master Crossfader Props
  crossfaderPosition?: number;
  onCrossfaderChange?: (pos: number) => void;
  crossfaderCurve?: CrossfaderCurve;
  onCrossfaderCurveChange?: (curve: CrossfaderCurve) => void;
  deckATitle?: string;
  deckBTitle?: string;
  deckABpm?: number;
  deckBBpm?: number;
  onSwapDecks?: () => void;
  // Phase Meter Props
  deckAPosition?: number;
  deckBPosition?: number;
  isSyncLocked?: boolean;
  isPlaying?: boolean;
  onNudgeDeckB?: (direction: -1 | 1) => void;
  onToggleSync?: () => void;
  // Deck B Stems & controls
  deckBStems?: StemData[];
  onVolumeChangeDeckB?: (stemId: StemId, vol: number) => void;
  onToggleMuteDeckB?: (stemId: StemId) => void;
  onToggleSoloDeckB?: (stemId: StemId) => void;
  masterDeck?: 'A' | 'B';
  onSelectMasterDeck?: (deck: 'A' | 'B') => void;
  loadedTrack?: TrackData;
  secondTrack?: TrackData;
  onOpenStemEdit?: (stemId: StemId) => void;
  onFilterChange?: (stemId: StemId, filter: number) => void;
  onSendChange?: (stemId: StemId, send: number) => void;
  onFilterChangeDeckB?: (stemId: StemId, filter: number) => void;
  onSendChangeDeckB?: (stemId: StemId, send: number) => void;
  onBassSwap?: () => void;
  onDrumsSwap?: () => void;
}

export const MixScreen: React.FC<MixScreenProps> = ({
  stems,
  onVolumeChange,
  onToggleMute,
  onToggleSolo,
  masterLevel,
  masterVolume,
  onMasterVolumeChange,
  hardwareMode = false,
  faderCurve = 'Linear',
  isKeyLockActive = true,
  onToggleKeyLock,
  trackKey = '8A',
  bpm = 128,
  isMasterClipping = false,
  onTriggerTestClip,
  crossfaderPosition = 0.0,
  onCrossfaderChange,
  crossfaderCurve = 'SMOOTH',
  onCrossfaderCurveChange,
  deckATitle = 'Deck A',
  deckBTitle = 'Deck B',
  deckABpm = 128,
  deckBBpm = 125,
  onSwapDecks,
  deckAPosition = 0,
  deckBPosition = 0,
  isSyncLocked = false,
  isPlaying = false,
  onNudgeDeckB,
  onToggleSync,
  deckBStems,
  onVolumeChangeDeckB,
  onToggleMuteDeckB,
  onToggleSoloDeckB,
  masterDeck = 'A',
  onSelectMasterDeck,
  loadedTrack,
  secondTrack,
  onOpenStemEdit,
  onFilterChange,
  onSendChange,
  onFilterChangeDeckB,
  onSendChangeDeckB,
  onBassSwap,
  onDrumsSwap,
  masterEq = { low: 3.5, mid: -1.0, high: 2.5 },
  onMasterEqChange,
  masterEqPreset = 'Club',
}) => {
  // Deck Mixer Selector: 'DECK_A' | 'DECK_B' | 'DUAL'
  const [selectedMixDeck, setSelectedMixDeck] = useState<'DECK_A' | 'DECK_B' | 'DUAL'>('DECK_A');
  const [controlType, setControlType] = useState<'fader' | 'poti'>('fader');
  const [showPhaseDrawer, setShowPhaseDrawer] = useState<boolean>(false);
  const [showEqDrawer, setShowEqDrawer] = useState<boolean>(true);
  const [internalEq, setInternalEq] = useState<MasterEqSettings>(masterEq);

  // Sync internalEq with prop
  const currentEq = masterEq || internalEq;

  const handleUpdateEq = (updates: Partial<MasterEqSettings>) => {
    const next = { ...currentEq, ...updates };
    setInternalEq(next);
    onMasterEqChange?.(updates);
  };

  const handleResetEq = () => {
    const flat = { low: 0, mid: 0, high: 0 };
    setInternalEq(flat);
    onMasterEqChange?.(flat);
  };

  const activeDeckBStems = deckBStems || stems;

  return (
    <div className="flex-1 flex flex-col justify-between px-2 sm:px-3 py-1 sm:py-2 w-full max-w-xl mx-auto overflow-hidden">
      {/* Top Deck Switcher Bar & Live Stem Swap Controls */}
      <div className="flex items-center justify-between gap-1.5 px-1.5 py-1 mb-1 shrink-0 bg-[#0d0d12] rounded-xl border border-zinc-850 flex-wrap">
        {/* Deck Fader Bank Selector */}
        <div className="flex items-center gap-0.5 bg-black/60 p-0.5 rounded-lg border border-zinc-800 text-[8.5px] font-mono">
          <button
            onClick={() => setSelectedMixDeck('DECK_A')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded font-bold transition active:scale-95 ${
              selectedMixDeck === 'DECK_A'
                ? 'bg-blue-600 text-white font-black shadow-[0_0_8px_rgba(37,99,235,0.5)]'
                : 'text-zinc-400 hover:text-blue-300'
            }`}
            title="Deck A 4-Kanal Stem-Fader steuern"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>DECK A</span>
          </button>
          <button
            onClick={() => setSelectedMixDeck('DECK_B')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded font-bold transition active:scale-95 ${
              selectedMixDeck === 'DECK_B'
                ? 'bg-orange-600 text-white font-black shadow-[0_0_8px_rgba(234,88,12,0.5)]'
                : 'text-zinc-400 hover:text-orange-300'
            }`}
            title="Deck B 4-Kanal Stem-Fader steuern"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            <span>DECK B</span>
          </button>
          <button
            onClick={() => setSelectedMixDeck('DUAL')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded font-bold transition active:scale-95 ${
              selectedMixDeck === 'DUAL'
                ? 'bg-zinc-100 text-zinc-950 font-black'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Beide Decks (8 Kanäle) nebeneinander"
          >
            <Columns className="w-2.5 h-2.5" />
            <span>DUAL (8 CH)</span>
          </button>
        </div>

        {/* Control Type Mode (Faders vs Drehpotis) & Live Performance Transition Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setControlType(controlType === 'fader' ? 'poti' : 'fader')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border font-mono text-[8px] font-bold transition active:scale-95 shadow-xs ${
              controlType === 'poti'
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/60 shadow-[0_0_8px_rgba(245,158,11,0.25)]'
                : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:text-white'
            }`}
            title="Zwischen vertikalen Fader und kompakten Drehpotis (Knobs) umschalten"
          >
            <span>{controlType === 'poti' ? '🔘 POTIS (DREH)' : '🎚️ FADER'}</span>
          </button>

          {onBassSwap && (
            <button
              onClick={onBassSwap}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-950/80 hover:bg-sky-900 border border-sky-400/60 text-sky-300 font-mono text-[8px] font-bold transition active:scale-95 shadow-xs"
              title="Bassline Swap: Muted Bass von Deck A & aktiviert Bass von Deck B (oder umgekehrt)"
            >
              <span>⇄ BASS SWAP</span>
            </button>
          )}

          {onDrumsSwap && (
            <button
              onClick={onDrumsSwap}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-400/60 text-purple-300 font-mono text-[8px] font-bold transition active:scale-95 shadow-xs"
              title="Drums Swap: Muted Drums von Deck A & aktiviert Drums von Deck B (oder umgekehrt)"
            >
              <span>⇄ DRUMS</span>
            </button>
          )}

          {/* Phase Meter Accordion Toggle */}
          <button
            onClick={() => {
              triggerHaptic('tap');
              setShowPhaseDrawer(!showPhaseDrawer);
            }}
            className={`flex items-center gap-1 px-1.5 py-1 rounded-lg border font-mono text-[8px] font-bold transition active:scale-95 ${
              showPhaseDrawer
                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/60 shadow-xs'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
            title="Phase Meter anzeigen/verbergen"
          >
            <Gauge className="w-2.5 h-2.5 text-emerald-400" />
            <span>PHASE</span>
            {showPhaseDrawer ? <ChevronUp className="w-2 h-2" /> : <ChevronDown className="w-2 h-2" />}
          </button>

          {/* Master EQ Response Graph Accordion Toggle */}
          <button
            onClick={() => {
              triggerHaptic('tap');
              setShowEqDrawer(!showEqDrawer);
            }}
            className={`flex items-center gap-1 px-1.5 py-1 rounded-lg border font-mono text-[8px] font-bold transition active:scale-95 ${
              showEqDrawer
                ? 'bg-cyan-950/70 text-cyan-300 border-cyan-500/60 shadow-[0_0_8px_rgba(6,182,212,0.25)]'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
            title="Master EQ Response Kurve anzeigen/verbergen"
          >
            <Activity className="w-2.5 h-2.5 text-cyan-400" />
            <span>EQ CURVE</span>
            {showEqDrawer ? <ChevronUp className="w-2 h-2" /> : <ChevronDown className="w-2 h-2" />}
          </button>
        </div>
      </div>

      {/* Dynamic Master EQ Response Graph */}
      {showEqDrawer && (
        <div className="mb-1 shrink-0 animate-fadeIn">
          <EqResponseGraph
            eq={currentEq}
            filterCutoff={0.5}
            onResetEq={handleResetEq}
            presetName={masterEqPreset}
          />
        </div>
      )}

      {/* Optional Phase Meter Drawer (Keeps main mixer spacious when closed) */}
      {showPhaseDrawer && (
        <div className="mb-1 shrink-0 animate-fadeIn">
          <PhaseMeter
            deckABpm={deckABpm}
            deckBBpm={deckBBpm}
            deckAPosition={deckAPosition}
            deckBPosition={deckBPosition}
            isSyncLocked={isSyncLocked}
            isPlaying={isPlaying}
            onNudgeDeckB={onNudgeDeckB}
            onToggleSync={onToggleSync}
            variant="compact"
          />
        </div>
      )}

      {/* 4 or 8 Fader/Poti Channels Grid using StemMixerChannel */}
      <div className="flex-1 min-h-0 py-1 overflow-x-auto">
        {selectedMixDeck === 'DECK_A' && (
          <div className="grid grid-cols-4 gap-2 h-full items-stretch">
            {stems.map((stem) => (
              <StemMixerChannel
                key={`deckA-${stem.id}`}
                stem={stem}
                onVolumeChange={onVolumeChange}
                onToggleMute={onToggleMute}
                onToggleSolo={onToggleSolo}
                onFilterChange={(sId, f) => onFilterChange?.(sId, f)}
                onSendChange={(sId, s) => onSendChange?.(sId, s)}
                faderCurve={faderCurve}
                deckLabel="A"
                onOpenStemEdit={onOpenStemEdit}
                controlType={controlType}
              />
            ))}
          </div>
        )}

        {selectedMixDeck === 'DECK_B' && (
          <div className="grid grid-cols-4 gap-2 h-full items-stretch">
            {activeDeckBStems.map((stem) => (
              <StemMixerChannel
                key={`deckB-${stem.id}`}
                stem={stem}
                onVolumeChange={(sId, vol) =>
                  onVolumeChangeDeckB ? onVolumeChangeDeckB(sId, vol) : onVolumeChange(sId, vol)
                }
                onToggleMute={(sId) =>
                  onToggleMuteDeckB ? onToggleMuteDeckB(sId) : onToggleMute(sId)
                }
                onToggleSolo={(sId) =>
                  onToggleSoloDeckB ? onToggleSoloDeckB(sId) : onToggleSolo(sId)
                }
                onFilterChange={(sId, f) =>
                  onFilterChangeDeckB ? onFilterChangeDeckB(sId, f) : onFilterChange?.(sId, f)
                }
                onSendChange={(sId, s) =>
                  onSendChangeDeckB ? onSendChangeDeckB(sId, s) : onSendChange?.(sId, s)
                }
                faderCurve={faderCurve}
                deckLabel="B"
                onOpenStemEdit={onOpenStemEdit}
                controlType={controlType}
              />
            ))}
          </div>
        )}

        {selectedMixDeck === 'DUAL' && (
          <div className={`grid grid-cols-8 gap-1 h-full items-stretch ${controlType === 'poti' ? 'w-full' : 'min-w-[500px]'}`}>
            {/* Deck A 4 channels */}
            {stems.map((stem) => (
              <StemMixerChannel
                key={`dual-deckA-${stem.id}`}
                stem={stem}
                onVolumeChange={onVolumeChange}
                onToggleMute={onToggleMute}
                onToggleSolo={onToggleSolo}
                onFilterChange={(sId, f) => onFilterChange?.(sId, f)}
                onSendChange={(sId, s) => onSendChange?.(sId, s)}
                faderCurve={faderCurve}
                deckLabel="A"
                onOpenStemEdit={onOpenStemEdit}
                controlType={controlType}
              />
            ))}
            {/* Deck B 4 channels */}
            {activeDeckBStems.map((stem) => (
              <StemMixerChannel
                key={`dual-deckB-${stem.id}`}
                stem={stem}
                onVolumeChange={(sId, vol) =>
                  onVolumeChangeDeckB ? onVolumeChangeDeckB(sId, vol) : onVolumeChange(sId, vol)
                }
                onToggleMute={(sId) =>
                  onToggleMuteDeckB ? onToggleMuteDeckB(sId) : onToggleMute(sId)
                }
                onToggleSolo={(sId) =>
                  onToggleSoloDeckB ? onToggleSoloDeckB(sId) : onToggleSolo(sId)
                }
                onFilterChange={(sId, f) =>
                  onFilterChangeDeckB ? onFilterChangeDeckB(sId, f) : onFilterChange?.(sId, f)
                }
                onSendChange={(sId, s) =>
                  onSendChangeDeckB ? onSendChangeDeckB(sId, s) : onSendChange?.(sId, s)
                }
                faderCurve={faderCurve}
                deckLabel="B"
                onOpenStemEdit={onOpenStemEdit}
                controlType={controlType}
              />
            ))}
          </div>
        )}
      </div>

      {/* Master Crossfader: Deck A ⇄ Deck B Blending */}
      <div className="my-1 shrink-0">
        <Crossfader
          value={crossfaderPosition}
          onChange={onCrossfaderChange || (() => {})}
          deckATitle={deckATitle}
          deckBTitle={deckBTitle}
          deckABpm={deckABpm}
          deckBBpm={deckBBpm}
          onSwapDecks={onSwapDecks}
          curve={crossfaderCurve}
          onCurveChange={onCrossfaderCurveChange}
        />
      </div>

      {/* Master Section */}
      <div className="p-2 sm:p-2.5 rounded-xl bg-[#111115] border border-zinc-800/80 flex items-center justify-between gap-2 sm:gap-3 shrink-0">
        <div className="flex flex-col shrink-0 min-w-[65px]">
          <span className="font-mono text-[9px] sm:text-[10px] font-bold tracking-wider text-zinc-300 uppercase">
            MASTER
          </span>
          <span className="font-mono text-[11px] sm:text-xs font-semibold text-zinc-400">
            {masterVolume >= 0.99 ? '0.0 dB' : `${(20 * Math.log10(masterVolume)).toFixed(1)} dB`}
          </span>
        </div>

        {/* Master Key Lock (Pitch Lock) Toggle Button */}
        <button
          onClick={onToggleKeyLock}
          className={`px-2 py-1.5 rounded-lg flex items-center gap-1.5 border font-mono text-[8.5px] font-bold tracking-wider uppercase transition active:scale-95 shrink-0 ${
            isKeyLockActive
              ? 'bg-rose-500/25 text-rose-300 border-rose-500/60 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
          }`}
          title="Master Key Lock: Tonhöhe fixieren"
          aria-label="Toggle Master Key Lock"
        >
          <Lock className={`w-2.5 h-2.5 ${isKeyLockActive ? 'text-rose-400' : 'text-zinc-500'}`} />
          <div className="flex flex-col text-left leading-tight">
            <span className="text-[7.5px] opacity-75">{trackKey} • {bpm.toFixed(1)}</span>
            <span>KEY {isKeyLockActive ? 'LOCK ON' : 'PITCH'}</span>
          </div>
        </button>

        {/* Master LED Level Meter with Clip Indicator */}
        <div className="flex-1 min-w-[60px]">
          <LevelMeter
            level={masterLevel}
            stemId="master"
            segments={20}
            orientation="horizontal"
            size="md"
            isClipping={isMasterClipping}
            showClipIndicator={true}
            onTriggerTestClip={onTriggerTestClip}
          />
        </div>

        {/* Master Trim Quick Slider */}
        <div className="w-18 sm:w-24 shrink-0 flex items-center">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={masterVolume}
            onChange={(e) => onMasterVolumeChange(parseFloat(e.target.value))}
            className="w-full accent-zinc-200 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
            title="Master Trim Volume Fader"
            aria-label="Master Volume"
          />
        </div>
      </div>
    </div>
  );
};
