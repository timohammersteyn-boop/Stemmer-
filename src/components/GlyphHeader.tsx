import React, { useState, useEffect } from 'react';
import { ScreenMode, TrackData } from '../types';
import { Menu, ChevronLeft, MoreVertical, Download, Zap, Terminal, GraduationCap, ArrowLeftRight, Cable, Music, Edit3 } from 'lucide-react';
import { PhaseMeter } from './PhaseMeter';
import { checkHarmonicCompatibility } from '../utils/harmonicKeys';

interface GlyphHeaderProps {
  currentMode: ScreenMode;
  onSelectMode: (mode: ScreenMode) => void;
  onOpenSettings: () => void;
  onOpenEdit?: () => void;
  track: TrackData;
  secondTrack?: TrackData;
  playbackPosition: number; // in seconds
  secondTrackPlaybackPosition?: number;
  isSyncLocked?: boolean;
  isPlaying?: boolean;
  hardwareMode: boolean;
  onToggleHardwareMode: () => void;
  isInstallable: boolean;
  onInstallPwa: () => void;
  onOpenPwaModal?: () => void;
  onTapTempo?: () => void;
  tapActive?: boolean;
  onNudgeDeckB?: (direction: -1 | 1) => void;
  onToggleSync?: () => void;
  onSwapDecks?: () => void;
  onOpenTrackLoad?: (deck: 'A' | 'B') => void;
  onOpenActivityFeed?: () => void;
  onOpenManual?: () => void;
  onOpenMidiLearn?: () => void;
  keyShift?: number;
  shiftedKey?: string;
  className?: string;
  masterDeck?: 'A' | 'B';
  onSelectMasterDeck?: (deck: 'A' | 'B') => void;
  isPerformanceView?: boolean;
  onTogglePerformanceView?: () => void;
}

export const GlyphHeader: React.FC<GlyphHeaderProps> = ({
  currentMode,
  onSelectMode,
  onOpenSettings,
  onOpenEdit,
  track,
  secondTrack,
  playbackPosition,
  secondTrackPlaybackPosition = 0,
  isSyncLocked = false,
  isPlaying = false,
  hardwareMode,
  onToggleHardwareMode,
  isInstallable,
  onInstallPwa,
  onOpenPwaModal,
  onTapTempo,
  tapActive = false,
  onNudgeDeckB,
  onToggleSync,
  onSwapDecks,
  onOpenTrackLoad,
  onOpenActivityFeed,
  onOpenManual,
  onOpenMidiLearn,
  keyShift = 0,
  shiftedKey,
  className = '',
  masterDeck = 'A',
  onSelectMasterDeck,
  isPerformanceView = false,
  onTogglePerformanceView,
}) => {
  const formatTime = (sec: number): string => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isHome = currentMode === 'STEMS';

  // --- Beat Phase & BPM Synchronization Engine ---
  const bpm = track.bpm > 0 ? track.bpm : 128;
  const secondsPerBeat = 60 / bpm;
  const [pulseTime, setPulseTime] = useState<number>(0);

  // Rhythmic heartbeat ticker for continuous visual tempo phase when idle / paused
  useEffect(() => {
    let animId: number;
    let last = performance.now();

    const tick = (now: number) => {
      const delta = (now - last) / 1000;
      last = now;
      if (!isPlaying) {
        setPulseTime((prev) => (prev + delta) % (secondsPerBeat * 4));
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, secondsPerBeat]);

  // Use playback position when audio is active, or internal tempo ticker when idle
  const activeTime = Math.max(0, isPlaying ? playbackPosition : pulseTime);
  const currentTotalBeats = activeTime / secondsPerBeat;
  // Non-negative modulo for standard 4-beat bar structure (0, 1, 2, 3)
  const currentBeatIndex = ((Math.floor(currentTotalBeats) % 4) + 4) % 4;
  const beatProgress = Math.max(0, Math.min(1, ((currentTotalBeats % 1) + 1) % 1));
  // Organic phosphor exponential decay for authentic LED heartbeat flash (1.0 -> 0.02)
  const pulseEnvelope = Math.max(0, Math.min(1, Math.exp(-beatProgress * 4.4)));
  const isBeatFlash = beatProgress < 0.28;
  const isDownbeat = currentBeatIndex === 0;

  const effectiveKeyA = shiftedKey || track.key;
  const harmonicCompatibility = secondTrack ? checkHarmonicCompatibility(effectiveKeyA, secondTrack.key) : null;

  return (
    <header className={`w-full pt-2 pb-2 px-4 border-b border-zinc-900 bg-[#09090b]/95 backdrop-blur-md select-none ${className}`}>
      {/* Top Bar: Brand, navigation, options */}
      <div className="flex items-center justify-between h-9">
        {/* Left icon: Back button or Settings hamburger */}
        {isHome ? (
          <button
            onClick={onOpenSettings}
            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition active:scale-95"
            aria-label="Settings"
          >
            <Menu className="w-5 h-5 stroke-[1.75]" />
          </button>
        ) : (
          <button
            onClick={() => onSelectMode('STEMS')}
            className="flex items-center gap-1.5 -ml-2 px-2 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition active:scale-95"
            aria-label="Back to Stems"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2]" />
            <span className="font-mono text-xs uppercase tracking-wider text-zinc-400 font-semibold">STEMS</span>
          </button>
        )}

        {/* Center: Schubert*grv* Brand + Pulsating Dot-Matrix Beat-Phase Heartbeat Ribbon */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs tracking-[0.25em] font-extrabold text-zinc-200 uppercase">
              Schubert<span className="text-rose-500 font-bold">*</span>grv<span className="text-rose-500 font-bold">*</span>
            </span>

            {/* Pulsating 4-Column Dot-Matrix Glyph Beat-Phase Indicator */}
            <div
              className="relative flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/85 border border-zinc-800/90 shadow-inner"
              title={`BPM Beat-Phase Taktanzeige: Beat ${currentBeatIndex + 1}/4 • ${bpm.toFixed(1)} BPM`}
              aria-label={`Beat ${currentBeatIndex + 1} of 4, ${bpm.toFixed(1)} BPM`}
            >
              <span className="text-[7px] font-mono tracking-wider text-zinc-500 font-bold uppercase select-none mr-0.5">
                BAR
              </span>
              {[0, 1, 2, 3].map((b) => {
                const isActive = currentBeatIndex === b;
                const isDown = b === 0;
                const scale = isActive ? 1 + pulseEnvelope * 0.35 : 1;
                const opacity = isActive ? 0.45 + pulseEnvelope * 0.55 : 0.22;

                return (
                  <div key={b} className="relative flex flex-col items-center justify-center gap-[2px]">
                    {/* Vertical 3-Dot Matrix Column */}
                    {[0, 1, 2].map((dotIdx) => {
                      const isDotLit = isActive && (dotIdx === 0 || pulseEnvelope > dotIdx * 0.25);
                      return (
                        <span
                          key={dotIdx}
                          className={`w-1 h-1 rounded-full transition-all duration-75 block ${
                            isDotLit
                              ? isDown
                                ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,1)]'
                                : 'bg-zinc-100 shadow-[0_0_6px_rgba(255,255,255,0.95)]'
                              : 'bg-zinc-800 border border-zinc-700/50'
                          }`}
                          style={{
                            transform: `scale(${scale})`,
                            opacity: isDotLit ? 1 : opacity,
                          }}
                        />
                      );
                    })}
                    {/* Downbeat / Quarterbeat Acoustic Pulse Ring */}
                    {isActive && isBeatFlash && (
                      <span
                        className={`absolute -inset-1 rounded-full animate-ping pointer-events-none opacity-40 ${
                          isDown ? 'bg-rose-500' : 'bg-white'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {!isHome && (
            <span className="font-mono text-[10px] tracking-widest text-zinc-400 font-bold uppercase -mt-0.5">
              {currentMode}
            </span>
          )}
        </div>

        {/* Right action icons */}
        <div className="flex items-center gap-1 -mr-2">
          {/* Performance View Live Mode Toggle */}
          {onTogglePerformanceView && (
            <button
              onClick={onTogglePerformanceView}
              className={`px-2.5 py-1 rounded-full font-mono text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition active:scale-95 border ${
                isPerformanceView
                  ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.7)] animate-pulse'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700/80 hover:text-white'
              }`}
              title="Performance View: Maximiert Wellenformen & Stem-Mixer, verbirgt Logs & Library"
            >
              <Zap className={`w-3 h-3 ${isPerformanceView ? 'fill-current text-white' : 'text-rose-400'}`} />
              <span>{isPerformanceView ? 'PERF ON' : 'PERF VIEW'}</span>
            </button>
          )}

          {/* Quick Edit Overlay Button */}
          {onOpenEdit && (
            <button
              onClick={onOpenEdit}
              className="px-2 py-1 rounded-full font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition active:scale-95 border bg-zinc-900 hover:bg-zinc-800 text-amber-300 border-amber-500/40 hover:border-amber-400"
              title="Aktuellen Screen bearbeiten (Overlay öffnen)"
            >
              <Edit3 className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">EDIT</span>
            </button>
          )}

          {/* Academy / User Manual (Hidden in Performance View) */}
          {!isPerformanceView && onOpenManual && (
            <button
              onClick={onOpenManual}
              className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-500 hover:text-emerald-400 hover:bg-zinc-900 transition active:scale-95"
              title="User Manual & Onboarding School"
              aria-label="User Manual"
            >
              <GraduationCap className="w-4 h-4 stroke-[1.75]" />
            </button>
          )}

          {/* Activity Feed Toggle (Hidden in Performance View) */}
          {!isPerformanceView && onOpenActivityFeed && (
            <button
              onClick={onOpenActivityFeed}
              className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-500 hover:text-rose-400 hover:bg-zinc-900 transition active:scale-95"
              title="Activity Feed & Performance Log"
              aria-label="Activity Feed"
            >
              <Terminal className="w-4 h-4 stroke-[1.75]" />
            </button>
          )}

          {/* MIDI Learn & Hardware Shortcut */}
          {!isPerformanceView && onOpenMidiLearn && (
            <button
              onClick={onOpenMidiLearn}
              className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-500 hover:text-amber-400 hover:bg-zinc-900 transition active:scale-95"
              title="MIDI Learn & Hardware Controller (NI Komplete Kontrol A25 / X1)"
              aria-label="MIDI Learn"
            >
              <Cable className="w-4 h-4 stroke-[1.75]" />
            </button>
          )}

          {/* Hardware mode shortcut */}
          <button
            onClick={onToggleHardwareMode}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition active:scale-95 ${
              hardwareMode
                ? 'text-amber-400 bg-amber-400/10 border border-amber-400/30'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
            }`}
            title="Toggle Hardware Mode"
          >
            <Zap className="w-4 h-4 fill-current" />
          </button>

          {/* PWA Install / Direct Address Button (Hidden in Performance View) */}
          {!isPerformanceView && (
            <button
              onClick={() => {
                if (isInstallable && onInstallPwa) {
                  onInstallPwa();
                } else if (onOpenPwaModal) {
                  onOpenPwaModal();
                }
              }}
              className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/80 text-zinc-200 text-[9.5px] font-mono flex items-center gap-1 active:scale-95 transition shadow-xs"
              title="Schubertgrv als PWA-App installieren (Adresse kopieren & Anleitung)"
            >
              <Download className="w-3 h-3 text-emerald-400" />
              <span className="font-bold">PWA</span>
            </button>
          )}

          {/* More / Settings Menu */}
          <button
            onClick={onOpenSettings}
            className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition active:scale-95"
            aria-label="Settings Menu"
          >
            <MoreVertical className="w-5 h-5 stroke-[1.75]" />
          </button>
        </div>
      </div>

      {/* Performance Dual-Deck Live Strip (Unmistakable Deck A vs Deck B Identity) */}
      <div className="mt-1.5 flex flex-col gap-1 text-xs">
        {/* Top Deck Overview: Deck A (Blue Accent / Master) ⇄ Phase Alignment ⇄ Deck B (Orange Accent / Standby) */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2">
          {/* DECK A Card (Blue Accent) */}
          <button
            type="button"
            onClick={() => {
              if (onSelectMasterDeck && masterDeck !== 'A') {
                onSelectMasterDeck('A');
              } else {
                onOpenTrackLoad?.('A');
              }
            }}
            className={`flex items-center gap-1.5 sm:gap-2 px-2 py-1 rounded-xl transition-all text-left flex-1 min-w-0 max-w-[42%] sm:max-w-[44%] cursor-pointer group shadow-xs ${
              masterDeck === 'A'
                ? 'bg-[#091424] border border-blue-500/80 shadow-[0_0_20px_rgba(59,130,246,0.35)] ring-1 ring-blue-500/30'
                : 'bg-[#090e16] border border-blue-900/40 hover:border-blue-700/60'
            }`}
            title={`DECK A (${masterDeck === 'A' ? 'MASTER' : 'STANDBY'}): Klicke um Deck A zu aktivieren oder Track zu laden`}
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                masterDeck === 'A'
                  ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,1)] animate-pulse'
                  : 'bg-blue-800'
              }`}
            />
            <div className="flex flex-col min-w-0 truncate leading-tight">
              <div className="flex items-center gap-1">
                <span
                  className={`font-mono text-[8px] font-black px-1 py-0.2 rounded uppercase tracking-tight border ${
                    masterDeck === 'A'
                      ? 'bg-blue-500/25 text-blue-300 border-blue-500/60 shadow-[0_0_6px_rgba(59,130,246,0.3)]'
                      : 'bg-blue-950/40 text-blue-400/80 border-blue-900/40'
                  }`}
                >
                  DECK A • {masterDeck === 'A' ? 'MASTER' : 'STANDBY'}
                </span>
                <span className={`font-mono text-[8px] font-bold ${masterDeck === 'A' ? 'text-blue-300 font-extrabold' : 'text-blue-400/80'}`}>
                  {bpm.toFixed(1)}
                </span>
                <span
                  className={`font-mono text-[8px] font-bold px-1 py-0.2 rounded border ${
                    keyShift !== 0
                      ? 'bg-amber-400/20 text-amber-300 border-amber-400/50 shadow-[0_0_6px_rgba(251,191,36,0.3)]'
                      : 'bg-zinc-800 text-zinc-300 border-zinc-700/60'
                  }`}
                  title={`Deck A Tonart: ${effectiveKeyA}${keyShift !== 0 ? ` (Transponiert um ${keyShift > 0 ? `+${keyShift}` : keyShift} Halbtöne)` : ' (Original)'}`}
                >
                  {effectiveKeyA}{keyShift !== 0 ? ` ${keyShift > 0 ? `+${keyShift}` : keyShift}` : ''}
                </span>
              </div>
              <span className={`font-tech font-bold text-zinc-100 text-[11px] sm:text-[12px] tracking-tight truncate ${masterDeck === 'A' ? 'group-hover:text-blue-200' : 'group-hover:text-zinc-200'}`}>
                {track.title}
              </span>
            </div>
          </button>

          {/* Center Stage: Phase Alignment Meter & Quick Swap */}
          <div className="flex items-center gap-1 shrink-0">
            {secondTrack && (
              <PhaseMeter
                deckABpm={bpm}
                deckBBpm={secondTrack.bpm}
                deckAPosition={playbackPosition}
                deckBPosition={secondTrackPlaybackPosition}
                isSyncLocked={isSyncLocked}
                isPlaying={isPlaying}
                onNudgeDeckB={onNudgeDeckB}
                onToggleSync={onToggleSync}
                variant="header"
                className="hidden sm:flex"
              />
            )}

            {onSwapDecks && (
              <button
                type="button"
                onClick={onSwapDecks}
                className="flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition active:scale-90 text-[8.5px] font-mono font-bold cursor-pointer"
                title="Decks tauschen (Deck A ➔ B | Deck B ➔ A)"
                aria-label="Swap Decks A and B"
              >
                <ArrowLeftRight className="w-3 h-3 text-amber-400" />
                <span className="hidden md:inline">SWAP</span>
              </button>
            )}
          </div>

          {/* DECK B Card (Orange Accent) */}
          {secondTrack && (
            <button
              type="button"
              onClick={() => {
                if (onSelectMasterDeck && masterDeck !== 'B') {
                  onSelectMasterDeck('B');
                } else {
                  onOpenTrackLoad?.('B');
                }
              }}
              className={`flex items-center gap-1.5 sm:gap-2 px-2 py-1 rounded-xl transition-all text-right flex-1 min-w-0 max-w-[42%] sm:max-w-[44%] justify-end cursor-pointer group shadow-xs ${
                masterDeck === 'B'
                  ? 'bg-[#1e0e05] border border-orange-500/80 shadow-[0_0_20px_rgba(249,115,22,0.35)] ring-1 ring-orange-500/30'
                  : 'bg-[#120a04] border border-orange-950/50 hover:border-orange-800/60'
              }`}
              title={`DECK B (${masterDeck === 'B' ? 'MASTER' : 'STANDBY'}): Klicke um Deck B als Master zu setzen oder Track zu laden`}
            >
              <div className="flex flex-col min-w-0 truncate leading-tight items-end">
                <div className="flex items-center gap-1">
                  <span
                    className="font-mono text-[8px] font-bold px-1 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60"
                    title={`Deck B Tonart: ${secondTrack.key}`}
                  >
                    {secondTrack.key}
                  </span>
                  <span className={`font-mono text-[8px] font-bold ${masterDeck === 'B' ? 'text-orange-300 font-extrabold' : 'text-orange-400/80'}`}>
                    {secondTrack.bpm.toFixed(1)}
                  </span>
                  <span
                    className={`font-mono text-[8px] font-black px-1 py-0.2 rounded uppercase tracking-tight border ${
                      masterDeck === 'B'
                        ? 'bg-orange-500/25 text-orange-300 border-orange-500/60 shadow-[0_0_6px_rgba(249,115,22,0.3)]'
                        : 'bg-orange-950/40 text-orange-400/80 border-orange-950/50'
                    }`}
                  >
                    DECK B • {masterDeck === 'B' ? 'MASTER' : isSyncLocked ? 'SYNC' : 'STANDBY'}
                  </span>
                </div>
                <span className={`font-tech font-bold text-zinc-100 text-[11px] sm:text-[12px] tracking-tight truncate ${masterDeck === 'B' ? 'group-hover:text-orange-200' : 'group-hover:text-zinc-200'}`}>
                  {secondTrack.title}
                </span>
              </div>
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  masterDeck === 'B'
                    ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,1)] animate-pulse'
                    : 'bg-orange-800'
                }`}
              />
            </button>
          )}
          {/* Harmonic Mixing Match Strip if second deck is present */}
          {harmonicCompatibility && secondTrack && (
            <div className="flex items-center justify-between px-2 py-0.5 rounded-lg bg-[#0b0c10] border border-zinc-800/80 text-[8.5px] font-mono mt-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500 font-bold uppercase tracking-wider text-[7.5px]">HARMONIC:</span>
                <span className="text-rose-400 font-bold">{effectiveKeyA}</span>
                <span className="text-zinc-600">⇄</span>
                <span className="text-cyan-400 font-bold">{secondTrack.key}</span>
              </div>
              <div
                className={`flex items-center gap-1 px-1.5 py-0.2 rounded font-bold uppercase tracking-tight text-[7.5px] border ${harmonicCompatibility.colorClass}`}
                title={harmonicCompatibility.description}
              >
                <Music className="w-2.5 h-2.5" />
                <span>{harmonicCompatibility.label}</span>
              </div>
            </div>
          )}
        </div>

        {/* Sub-strip: Tap Tempo, Beat Matrix, BPM & Time */}
        <div className="flex items-center justify-between text-xs pt-0.5">
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-400">
            <span className="text-zinc-500 font-bold uppercase tracking-wider text-[9px]">LIVE AUDIO:</span>
            <span className="text-rose-400 font-bold">DECK A</span>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-300 font-medium">{formatTime(playbackPosition)}</span>
            <span className="text-zinc-500">({formatTime(track.duration)})</span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-400 shrink-0">
            {/* Tap Tempo Button */}
            {onTapTempo && (
              <button
                onClick={onTapTempo}
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase transition-all duration-75 border active:scale-90 select-none ${
                  tapActive
                    ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.9)] scale-95'
                    : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:text-white hover:border-zinc-700'
                }`}
                title="Tap Tempo (Tippe im Takt)"
              >
                TAP
              </button>
            )}

            {/* Dot-Matrix Beat-Phase Indicator & BPM Cluster */}
            <div
              className="flex items-center gap-1.5 bg-[#0b0b0e]/95 border border-zinc-800/90 rounded-lg px-2 py-0.5 shadow-sm"
              title={`Beat-Phase Taktanzeige: Beat ${currentBeatIndex + 1}/4 • ${bpm.toFixed(1)} BPM`}
              aria-label={`Beat ${currentBeatIndex + 1} of 4, ${bpm.toFixed(1)} BPM`}
            >
              {/* 4-Cell Dot-Matrix Phase LEDs */}
              <div className="flex items-center gap-1" aria-label={`Beat ${currentBeatIndex + 1} of 4`}>
                {[0, 1, 2, 3].map((b) => {
                  const isActive = currentBeatIndex === b;
                  const isDown = b === 0;
                  const scale = isActive ? 1 + pulseEnvelope * 0.14 : 1;
                  const opacity = isActive ? 0.45 + pulseEnvelope * 0.55 : 0.22;

                  return (
                    <div
                      key={b}
                      className={`relative px-1 py-0.5 rounded-[3px] transition-all duration-75 flex items-center gap-1 border select-none ${
                        isActive
                          ? isDown
                            ? 'bg-rose-950/40 border-rose-500/70 shadow-[0_0_8px_rgba(244,63,94,0.35)]'
                            : 'bg-zinc-800/60 border-zinc-600/80 shadow-[0_0_6px_rgba(255,255,255,0.25)]'
                          : 'bg-[#121217] border-zinc-800/90'
                      }`}
                      style={{
                        transform: `scale(${scale})`,
                      }}
                    >
                      {/* Vertical 3-Dot Matrix Column */}
                      <div className="flex flex-col gap-[1.5px] items-center">
                        {[0, 1, 2].map((dotIdx) => {
                          const isDotLit = isActive && (dotIdx === 0 || pulseEnvelope > dotIdx * 0.25);
                          return (
                            <span
                              key={dotIdx}
                              className={`w-[2.5px] h-[2.5px] rounded-full transition-all duration-75 block ${
                                isDotLit
                                  ? isDown
                                    ? 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,1)]'
                                    : 'bg-zinc-100 shadow-[0_0_5px_rgba(255,255,255,0.95)]'
                                  : 'bg-zinc-800 border border-zinc-700/40'
                              }`}
                              style={{
                                opacity: isDotLit ? 1 : opacity,
                              }}
                            />
                          );
                        })}
                      </div>

                      {/* Beat Number in Dot-Matrix Monospace */}
                      <span
                        className={`text-[8px] font-mono font-extrabold leading-none transition-colors duration-75 ${
                          isActive
                            ? isDown
                              ? 'text-rose-400'
                              : 'text-zinc-100'
                            : 'text-zinc-600'
                        }`}
                      >
                        {b + 1}
                      </span>

                      {/* Acoustic Pulse Ping on Active Beat Flash */}
                      {isActive && isBeatFlash && (
                        <span
                          className={`absolute -inset-0.5 rounded-[4px] animate-ping pointer-events-none opacity-30 ${
                            isDown ? 'bg-rose-500' : 'bg-white'
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* BPM Readout with Pulsating Dot-Matrix Heartbeat Strobe */}
              <div className="flex items-center gap-1.5 border-l border-zinc-800/90 pl-1.5">
                <div className="relative flex items-center justify-center">
                  <span
                    className={`w-1.5 h-1.5 rounded-full transition-transform duration-75 block ${
                      isDownbeat
                        ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,1)]'
                        : 'bg-zinc-100 shadow-[0_0_6px_rgba(255,255,255,0.95)]'
                    }`}
                    style={{
                      transform: `scale(${1 + pulseEnvelope * 0.45})`,
                      opacity: 0.4 + pulseEnvelope * 0.6,
                    }}
                  />
                  {isBeatFlash && (
                    <span
                      className={`absolute -inset-1 rounded-full animate-ping pointer-events-none opacity-40 ${
                        isDownbeat ? 'bg-rose-500' : 'bg-white'
                      }`}
                    />
                  )}
                </div>
                <span className="text-zinc-200 font-bold text-[10px] tracking-tight">{track.bpm.toFixed(1)}</span>
                <span className="text-[8px] text-zinc-500 font-semibold uppercase tracking-wider">BPM</span>
              </div>
            </div>

            <div
              className={`font-mono font-bold px-1.5 py-0.5 rounded border text-[10px] flex items-center gap-1 ${
                keyShift !== 0
                  ? 'bg-amber-950/70 border-amber-500/70 text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.3)]'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300'
              }`}
              title={`Musikalische Tonart: ${effectiveKeyA} ${keyShift !== 0 ? `(${keyShift > 0 ? `+${keyShift}` : keyShift} Halbtöne)` : '(Original)'}`}
            >
              <span>{effectiveKeyA}</span>
              {keyShift !== 0 && (
                <span className="text-[8px] font-extrabold text-amber-400">
                  {keyShift > 0 ? `+${keyShift}` : keyShift}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
