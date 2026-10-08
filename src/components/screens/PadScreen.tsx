import React, { useState, useEffect } from 'react';
import { BankData, PadBankId, PadMode, PadConfig } from '../../types';
import { TransportBar } from '../TransportBar';
import { ChevronLeft, ChevronRight, Trash2, MapPin, Plus, Sparkles, Check, Edit3 } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

interface HotCueSlot {
  id: number;
  label: string;
  sublabel: string;
  position: number | null; // seconds, null if empty
}

const DEFAULT_HOT_CUES: HotCueSlot[] = [
  { id: 0, label: 'CUE 1', sublabel: 'INTRO', position: 0 },
  { id: 1, label: 'CUE 2', sublabel: 'BUILD', position: 30 },
  { id: 2, label: 'CUE 3', sublabel: 'DROP', position: 60 },
  { id: 3, label: 'CUE 4', sublabel: 'VOX HOOK', position: 90 },
  { id: 4, label: 'CUE 5', sublabel: 'BREAK', position: null },
  { id: 5, label: 'CUE 6', sublabel: 'PEAK', position: 154 },
  { id: 6, label: 'CUE 7', sublabel: 'SUB ROLL', position: null },
  { id: 7, label: 'CUE 8', sublabel: 'OUTRO', position: 214 },
];

const HOT_CUE_COLORS = [
  { name: 'Cyan', bg: 'bg-cyan-500', border: 'border-cyan-300', glow: 'shadow-[0_0_16px_rgba(6,182,212,0.8)]', hex: '#06b6d4', text: 'text-zinc-950' },
  { name: 'Emerald', bg: 'bg-emerald-500', border: 'border-emerald-300', glow: 'shadow-[0_0_16px_rgba(16,185,129,0.8)]', hex: '#10b981', text: 'text-zinc-950' },
  { name: 'Amber', bg: 'bg-amber-500', border: 'border-amber-300', glow: 'shadow-[0_0_16px_rgba(245,158,11,0.8)]', hex: '#f59e0b', text: 'text-zinc-950' },
  { name: 'Purple', bg: 'bg-purple-500', border: 'border-purple-300', glow: 'shadow-[0_0_16px_rgba(168,85,247,0.8)]', hex: '#a855f7', text: 'text-white' },
  { name: 'Pink', bg: 'bg-pink-500', border: 'border-pink-300', glow: 'shadow-[0_0_16px_rgba(236,72,153,0.8)]', hex: '#ec4899', text: 'text-zinc-950' },
  { name: 'Sky', bg: 'bg-sky-500', border: 'border-sky-300', glow: 'shadow-[0_0_16px_rgba(2,132,199,0.8)]', hex: '#0284c7', text: 'text-white' },
  { name: 'Rose', bg: 'bg-rose-500', border: 'border-rose-300', glow: 'shadow-[0_0_16px_rgba(244,63,94,0.8)]', hex: '#f43f5e', text: 'text-white' },
  { name: 'Lime', bg: 'bg-lime-500', border: 'border-lime-300', glow: 'shadow-[0_0_16px_rgba(132,204,22,0.8)]', hex: '#84cc16', text: 'text-zinc-950' },
];

interface PadScreenProps {
  banks: BankData;
  activeBankId: PadBankId;
  onSelectBank: (bankId: PadBankId) => void;
  onUpdateBankMode: (bankId: PadBankId, mode: PadMode) => void;
  onTriggerPad: (bankId: PadBankId, pad: PadConfig) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  hardwareMode?: boolean;
  isSyncLocked?: boolean;
  onToggleSync?: () => void;
  onSwapDecks?: () => void;
  masterBpm?: number;
  secondTrackBpm?: number;
  secondTrackTitle?: string;
  isQuantizeActive?: boolean;
  onToggleQuantize?: () => void;
  masterDeck?: 'A' | 'B';
  onSelectMasterDeck?: (deck: 'A' | 'B') => void;
  playbackPosition?: number;
  duration?: number;
  onSeek?: (seconds: number) => void;
  onOpenEdit?: () => void;
}

export const PadScreen: React.FC<PadScreenProps> = ({
  banks,
  activeBankId,
  onSelectBank,
  onUpdateBankMode,
  onTriggerPad,
  isPlaying,
  onTogglePlay,
  onPrev,
  onNext,
  hardwareMode = false,
  isSyncLocked = false,
  onToggleSync,
  onSwapDecks,
  masterBpm = 128,
  secondTrackBpm = 125,
  secondTrackTitle,
  isQuantizeActive = true,
  onToggleQuantize,
  masterDeck = 'A',
  onSelectMasterDeck,
  playbackPosition = 0,
  duration = 240,
  onSeek,
  onOpenEdit,
}) => {
  const currentBank = banks[activeBankId];
  const [pressedPadId, setPressedPadId] = useState<number | null>(null);
  const [deleteModeActive, setDeleteModeActive] = useState<boolean>(false);

  // 8 Distinct Hot Cues per Bank/Track State
  const [hotCues, setHotCues] = useState<HotCueSlot[]>(() => {
    try {
      const stored = localStorage.getItem(`schubertgrv_hotcues_${activeBankId}`);
      if (stored) return JSON.parse(stored);
    } catch {}
    return DEFAULT_HOT_CUES;
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`schubertgrv_hotcues_${activeBankId}`);
      if (stored) setHotCues(JSON.parse(stored));
      else setHotCues(DEFAULT_HOT_CUES);
    } catch {}
  }, [activeBankId]);

  const bankIds: PadBankId[] = ['A', 'B', 'C', 'D'];
  const padModes: PadMode[] = ['HOT CUE', 'LOOP', 'SLICER', 'ROLL'];

  const handleBankPrev = () => {
    triggerHaptic('tap');
    const idx = bankIds.indexOf(activeBankId);
    const prevIdx = (idx - 1 + bankIds.length) % bankIds.length;
    onSelectBank(bankIds[prevIdx]);
  };

  const handleBankNext = () => {
    triggerHaptic('tap');
    const idx = bankIds.indexOf(activeBankId);
    const nextIdx = (idx + 1) % bankIds.length;
    onSelectBank(bankIds[nextIdx]);
  };

  const handlePadPress = (pad: PadConfig) => {
    triggerHaptic('tap');
    setPressedPadId(pad.id);
    onTriggerPad(activeBankId, pad);
  };

  const handlePadRelease = () => {
    setPressedPadId(null);
  };

  // Hot Cue 8-Pad Handlers
  const handleHotCuePress = (cue: HotCueSlot, index: number) => {
    if (deleteModeActive) {
      // Delete this cue slot
      triggerHaptic('double');
      const updated = hotCues.map((c, i) => (i === index ? { ...c, position: null } : c));
      setHotCues(updated);
      try {
        localStorage.setItem(`schubertgrv_hotcues_${activeBankId}`, JSON.stringify(updated));
      } catch {}
      return;
    }

    if (cue.position === null) {
      // Store current playbackPosition
      triggerHaptic('cue');
      const updated = hotCues.map((c, i) =>
        i === index ? { ...c, position: Math.round(playbackPosition * 10) / 10 } : c
      );
      setHotCues(updated);
      try {
        localStorage.setItem(`schubertgrv_hotcues_${activeBankId}`, JSON.stringify(updated));
      } catch {}
    } else {
      // Trigger jump to cue point instantly
      triggerHaptic('cue');
      setPressedPadId(index);
      if (onSeek) {
        onSeek(cue.position);
      }
      // Also notify parent pad trigger
      if (currentBank.pads[index]) {
        onTriggerPad(activeBankId, {
          ...currentBank.pads[index],
          value: cue.position,
        });
      }
    }
  };

  const formatCueTime = (sec: number | null): string => {
    if (sec === null) return '+ STORE';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  // Stem & Accent Color classes for standard pads
  const getPadColorStyle = (pad: PadConfig, isPressed: boolean) => {
    if (isPressed) {
      return 'bg-white text-black shadow-[0_0_24px_rgba(255,255,255,0.9)] scale-[0.96] border-white';
    }

    if (!pad.active) {
      return 'bg-[#15151a] text-zinc-500 border-zinc-800/80 hover:border-zinc-700 hover:text-zinc-300';
    }

    switch (pad.color) {
      case 'drums':
        return 'bg-zinc-200 text-zinc-950 border-zinc-100 shadow-[0_0_12px_rgba(255,255,255,0.25)]';
      case 'bass':
        return 'bg-sky-400 text-zinc-950 border-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.3)]';
      case 'music':
        return 'bg-emerald-400 text-zinc-950 border-emerald-300 shadow-[0_0_12px_rgba(74,222,128,0.3)]';
      case 'vocal':
        return 'bg-orange-400 text-zinc-950 border-orange-300 shadow-[0_0_12px_rgba(251,146,60,0.3)]';
      case 'accent':
        return 'bg-rose-500 text-white border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.3)]';
      default:
        return 'bg-zinc-300 text-zinc-950 border-zinc-200';
    }
  };

  const isHotCueMode = currentBank.mode === 'HOT CUE';

  return (
    <div className="flex-1 flex flex-col justify-between px-3 py-1.5 w-full max-w-lg mx-auto overflow-hidden select-none">
      {/* 1. Mode Selector Pills & Quantize / Delete Cue Toggle */}
      <div className="flex items-center justify-between gap-1.5 shrink-0 mb-2">
        <div className="flex-1 grid grid-cols-4 gap-1 sm:gap-1.5">
          {padModes.map((mode) => {
            const isSelected = currentBank.mode === mode;
            return (
              <button
                key={mode}
                onClick={() => {
                  triggerHaptic('tap');
                  onUpdateBankMode(activeBankId, mode);
                }}
                className={`py-1.5 sm:py-2 px-1 rounded-xl font-mono text-[9px] sm:text-[10px] font-bold tracking-wider uppercase transition active:scale-95 border truncate ${
                  isSelected
                    ? 'bg-zinc-100 text-zinc-950 border-white shadow-sm'
                    : 'bg-[#121216] text-zinc-400 border-zinc-800/80 hover:text-zinc-200'
                }`}
              >
                {mode}
              </button>
            );
          })}
        </div>

        {/* Quantize & Delete Cue Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {isHotCueMode && (
            <button
              onClick={() => {
                triggerHaptic('tap');
                setDeleteModeActive(!deleteModeActive);
              }}
              className={`flex items-center gap-1 px-2 py-1.5 sm:py-2 rounded-xl font-mono text-[8.5px] font-bold uppercase transition active:scale-95 border ${
                deleteModeActive
                  ? 'bg-rose-500 text-white border-rose-400 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.6)]'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-rose-400'
              }`}
              title="Delete Cue Modus: Tippe auf einen Cue-Punkt zum Löschen"
            >
              <Trash2 className="w-2.5 h-2.5" />
              <span>{deleteModeActive ? 'DEL CUE ON' : 'DEL CUE'}</span>
            </button>
          )}

          {/* Tactile Quantize Toggle Button */}
          <button
            onClick={() => {
              triggerHaptic('tap');
              onToggleQuantize?.();
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:py-2 rounded-xl font-mono text-[9px] sm:text-[10px] font-bold tracking-wider uppercase transition active:scale-95 border ${
              isQuantizeActive
                ? 'bg-cyan-500/25 text-cyan-300 border-cyan-500/60 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                : 'bg-[#121216] text-zinc-400 border-zinc-800/80 hover:text-zinc-200'
            }`}
            title="Quantize (QTZ): Pad-Trigger snappen exakt auf den Beat des Master BPM"
            aria-label="Toggle Quantize"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isQuantizeActive ? 'bg-cyan-400 animate-pulse' : 'bg-zinc-600'}`} />
            <span>QTZ {isQuantizeActive ? 'ON' : 'OFF'}</span>
          </button>

          {/* Quick Edit Overlay Button */}
          {onOpenEdit && (
            <button
              onClick={() => {
                triggerHaptic('tap');
                onOpenEdit();
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 sm:py-2 rounded-xl font-mono text-[9px] sm:text-[10px] font-bold uppercase transition active:scale-95 border bg-zinc-900 text-amber-300 border-zinc-800 hover:border-amber-500/50"
              title="Pad & Stem Setup bearbeiten"
            >
              <Edit3 className="w-2.5 h-2.5 text-amber-400" />
              <span>EDIT</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Pad Stage: Dedicated 8-Pad HOT CUE Layout OR 16-Pad Matrix */}
      {isHotCueMode ? (
        /* Dedicated 8 Distinct Color-Coded Hot Cue Performance Pads (2x4 Giant Grid) */
        <div className="flex-1 grid grid-cols-4 grid-rows-2 gap-2 sm:gap-2.5 items-stretch min-h-0 select-none">
          {hotCues.map((cue, idx) => {
            const isPressed = pressedPadId === idx;
            const colorCfg = HOT_CUE_COLORS[idx % HOT_CUE_COLORS.length];
            const isStored = cue.position !== null;

            return (
              <button
                key={`hotcue-${cue.id}`}
                onPointerDown={() => handleHotCuePress(cue, idx)}
                onPointerUp={handlePadRelease}
                onPointerCancel={handlePadRelease}
                onPointerLeave={handlePadRelease}
                className={`relative rounded-2xl border flex flex-col items-center justify-between p-2.5 sm:p-3 cursor-pointer transition-all duration-75 select-none touch-none ${
                  isPressed
                    ? 'bg-white text-black border-white shadow-[0_0_24px_rgba(255,255,255,1)] scale-[0.96]'
                    : isStored
                    ? `${colorCfg.bg} ${colorCfg.text} ${colorCfg.border} ${colorCfg.glow} hover:brightness-110 active:scale-95`
                    : 'bg-[#14141a] text-zinc-500 border-zinc-800/90 hover:border-zinc-700 hover:text-zinc-300 active:scale-95'
                }`}
              >
                {/* Header: Slot Number & Active Indicator */}
                <div className="w-full flex items-center justify-between text-[10px] font-mono font-black opacity-80">
                  <span>PAD {idx + 1}</span>
                  {isStored ? (
                    <span className="w-2 h-2 rounded-full bg-white/90 shadow-sm" />
                  ) : (
                    <Plus className="w-3 h-3 text-zinc-600" />
                  )}
                </div>

                {/* Center: Cue Name & Sublabel */}
                <div className="flex flex-col items-center text-center">
                  <span className="font-mono text-sm sm:text-base font-black tracking-tight leading-none">
                    {cue.label}
                  </span>
                  <span className="font-mono text-[8px] font-bold opacity-80 uppercase tracking-wider mt-0.5">
                    {cue.sublabel}
                  </span>
                </div>

                {/* Footer: Exact Timestamp / Position */}
                <div className="w-full flex items-center justify-between font-mono text-[8.5px] font-black tracking-wider">
                  <span>{formatCueTime(cue.position)}</span>
                  {isStored && <MapPin className="w-2.5 h-2.5 opacity-70" />}
                </div>

                {/* Tactile Inner Rim */}
                <div className="absolute inset-1 rounded-xl border border-white/20 pointer-events-none" />
              </button>
            );
          })}
        </div>
      ) : (
        /* 4x4 Standard Performance Pad Matrix (16 Pads) */
        <div className="flex-1 grid grid-cols-4 grid-rows-4 gap-2 items-stretch min-h-0 select-none">
          {currentBank.pads.map((pad) => {
            const isPressed = pressedPadId === pad.id;
            const colorClasses = getPadColorStyle(pad, isPressed);

            return (
              <div
                key={pad.id}
                onPointerDown={() => handlePadPress(pad)}
                onPointerUp={handlePadRelease}
                onPointerCancel={handlePadRelease}
                onPointerLeave={handlePadRelease}
                className={`relative rounded-xl border flex flex-col items-center justify-between p-2 cursor-pointer transition-all duration-75 select-none touch-none ${colorClasses}`}
              >
                {/* Pad Number / Index */}
                <span className="font-mono text-[9px] font-bold opacity-60 self-start tracking-tighter">
                  {pad.id + 1}
                </span>

                {/* Main Pad Label */}
                <span className="font-mono text-center font-bold text-xs uppercase tracking-tight leading-tight px-0.5">
                  {pad.label}
                </span>

                {/* Sub-label (Function / Cue point) */}
                <span className="font-mono text-[8px] font-medium opacity-75 self-end uppercase tracking-wider">
                  {pad.sublabel || ''}
                </span>

                {/* Tactile Inner Border / Surface Accent */}
                <div className="absolute inset-0.5 rounded-[10px] border border-white/10 pointer-events-none" />
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Instant Bank Selector (< BANK X > and Direct A / B / C / D Buttons) */}
      <div className="flex items-center justify-between gap-2 mt-2 px-1 py-1.5 bg-[#101014] rounded-xl border border-zinc-800/90 shrink-0">
        {/* Left Arrow */}
        <button
          onClick={handleBankPrev}
          className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white active:scale-95 transition"
          aria-label="Previous Pad Bank"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Bank Indicator & Instant Bank Tabs */}
        <div className="flex items-center gap-1.5">
          {bankIds.map((bid) => {
            const isSelected = activeBankId === bid;
            return (
              <button
                key={bid}
                onClick={() => {
                  triggerHaptic('tap');
                  onSelectBank(bid);
                }}
                className={`w-11 h-9 rounded-lg font-mono text-xs font-bold transition-all active:scale-95 border ${
                  isSelected
                    ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.6)]'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                }`}
              >
                BANK {bid}
              </button>
            );
          })}
        </div>

        {/* Right Arrow */}
        <button
          onClick={handleBankNext}
          className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white active:scale-95 transition"
          aria-label="Next Pad Bank"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* 4. Bottom Transport */}
      <div className="shrink-0 pt-2 pb-0.5">
        <TransportBar
          isPlaying={isPlaying}
          onTogglePlay={onTogglePlay}
          onPrev={onPrev}
          onNext={onNext}
          isSyncLocked={isSyncLocked}
          onToggleSync={onToggleSync}
          onSwapDecks={onSwapDecks}
          masterBpm={masterBpm}
          secondTrackBpm={secondTrackBpm}
          secondTrackTitle={secondTrackTitle}
          size={hardwareMode ? 'large' : 'normal'}
        />
      </div>
    </div>
  );
};
