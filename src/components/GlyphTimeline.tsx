import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Crosshair,
  MapPin,
  Grid,
  Zap,
  ChevronLeft,
  ChevronRight,
  Check,
  Disc,
  ArrowLeftRight,
  Sliders,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

export type GridOverlayMode = 'BARS' | 'BEATS' | 'OFF';

export interface GlyphTimelineProps {
  playbackPosition: number; // in seconds
  duration: number; // in seconds
  onSeek: (seconds: number) => void;
  className?: string;
  bars?: number[];
  bpm?: number;
  cuePosition?: number;
  onSetCuePoint?: (seconds: number) => void;
  hotCues?: Array<{ id: number; label: string; value: number; color?: string }>;
  zoomLevel?: number;
  onZoomChange?: (zoom: number) => void;
  masterDeck?: 'A' | 'B';
  deckId?: 'A' | 'B';
  deckTitle?: string;
  variant?: 'standard' | 'compact' | 'mini';
  isPlaying?: boolean;
  // Manual Beat Matching & Beat Grid Synchronization
  isSyncLocked?: boolean;
  onToggleSync?: () => void;
  referenceBpm?: number;
  referencePlaybackPosition?: number;
  referenceDeckId?: 'A' | 'B';
  referenceDeckTitle?: string;
  onNudge?: (direction: -1 | 1) => void;
  onBeatJump?: (beats: number) => void;
  showBeatGrid?: boolean;
}

export const GlyphTimeline: React.FC<GlyphTimelineProps> = ({
  playbackPosition,
  duration,
  onSeek,
  className = '',
  bars = [15, 25, 45, 60, 75, 90, 85, 95, 100, 70, 85, 90, 95, 60, 40, 25, 50, 75, 90, 95, 100, 80, 65, 45, 30, 20, 10],
  bpm = 128,
  cuePosition,
  onSetCuePoint,
  hotCues,
  zoomLevel: propZoomLevel,
  onZoomChange,
  masterDeck = 'A',
  deckId,
  deckTitle,
  variant = 'standard',
  isPlaying = false,
  isSyncLocked = false,
  onToggleSync,
  referenceBpm,
  referencePlaybackPosition,
  referenceDeckId,
  referenceDeckTitle,
  onNudge,
  onBeatJump,
  showBeatGrid = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pinchStartRef = useRef<{ dist: number; zoom: number } | null>(null);

  // Zoom State: 1.0x (full track overview) to 8.0x (ultra-fine transient zoom)
  const [internalZoomLevel, setInternalZoomLevel] = useState<number>(1.0);
  const zoomLevel = propZoomLevel !== undefined ? propZoomLevel : internalZoomLevel;

  const setZoomLevel = useCallback(
    (nextZoom: number) => {
      const clamped = Math.max(1, Math.min(8, Math.round(nextZoom * 10) / 10));
      if (onZoomChange) {
        onZoomChange(clamped);
      } else {
        setInternalZoomLevel(clamped);
      }
    },
    [onZoomChange]
  );

  const [manualPanOffset, setManualPanOffset] = useState<number | null>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);

  // Grid Overlay Mode State: 'BARS' (4-Bar phrases + 1-Bar measures), 'BEATS' (Quarter-beats), 'OFF'
  const [gridMode, setGridMode] = useState<GridOverlayMode>(() => {
    try {
      return (localStorage.getItem('glyph_grid_mode') as GridOverlayMode) || 'BARS';
    } catch {
      return 'BARS';
    }
  });

  // Beat-Grid Offset Calibration State (shifts grid relative to track transients)
  const [gridOffset, setGridOffset] = useState<number>(() => {
    try {
      return parseFloat(localStorage.getItem(`schubertgrv_grid_offset_${deckId || 'A'}`) || '0') || 0;
    } catch {
      return 0;
    }
  });
  const [showGridCalibration, setShowGridCalibration] = useState<boolean>(false);

  const handleAlignGridToCurrent = () => {
    // Snap gridOffset so playbackPosition lands exactly on a 1.0 bar downbeat
    const safeBpm = Math.max(30, bpm || 128);
    const secPerBar = (60 / safeBpm) * 4;
    const mod = playbackPosition % secPerBar;
    setGridOffset(mod);
    try {
      localStorage.setItem(`schubertgrv_grid_offset_${deckId || 'A'}`, String(mod));
    } catch {}
  };

  const handleNudgeGrid = (deltaMs: number) => {
    const next = gridOffset + deltaMs / 1000;
    setGridOffset(next);
    try {
      localStorage.setItem(`schubertgrv_grid_offset_${deckId || 'A'}`, String(next));
    } catch {}
  };

  const handleResetGrid = () => {
    setGridOffset(0);
    try {
      localStorage.removeItem(`schubertgrv_grid_offset_${deckId || 'A'}`);
    } catch {}
  };

  const progress = duration > 0 ? Math.min(1, Math.max(0, playbackPosition / duration)) : 0;

  // Window calculation: at zoomLevel, we see (1 / zoomLevel) of the track
  const windowSpan = 1 / zoomLevel;

  // If manualPanOffset is set and not playing, use it; otherwise center viewport around playhead
  let windowStart = 0;
  if (zoomLevel <= 1.0) {
    windowStart = 0;
  } else if (manualPanOffset !== null) {
    windowStart = Math.max(0, Math.min(1 - windowSpan, manualPanOffset));
  } else {
    // Keep playhead centered in zoomed view
    windowStart = Math.max(0, Math.min(1 - windowSpan, progress - windowSpan / 2));
  }
  const windowEnd = Math.min(1, windowStart + windowSpan);

  // High-Density Interpolated Bars for Crisp Zoom Transients (120 sub-bars)
  const highDensityBars = React.useMemo(() => {
    const totalSamples = 128;
    const result: number[] = [];
    for (let i = 0; i < totalSamples; i++) {
      const srcIdx = (i / totalSamples) * (bars.length - 1);
      const low = Math.floor(srcIdx);
      const high = Math.min(bars.length - 1, Math.ceil(srcIdx));
      const frac = srcIdx - low;
      const baseH = bars[low] * (1 - frac) + bars[high] * frac;
      // Add subtle transient micro-peaks on beat subdivisions
      const beatPulse = (i % 8 === 0) ? 18 : (i % 4 === 0) ? 10 : 0;
      result.push(Math.min(100, Math.max(8, baseH + beatPulse)));
    }
    return result;
  }, [bars]);

  // Handle Pinch-to-Zoom Gesture via Touch Events
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchStartRef.current = { dist, zoom: zoomLevel };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && pinchStartRef.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scaleRatio = dist / pinchStartRef.current.dist;
      const nextZoom = Math.max(1, Math.min(8, Math.round(pinchStartRef.current.zoom * scaleRatio * 10) / 10));
      setZoomLevel(nextZoom);
    }
  };

  const handleTouchEnd = () => {
    pinchStartRef.current = null;
  };

  // Wheel Zoom support (Ctrl + Wheel or Shift + Wheel)
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      e.preventDefault();
      const delta = -e.deltaY * 0.005;
      const nextZoom = Math.max(1, Math.min(8, Math.round((zoomLevel + delta) * 10) / 10));
      setZoomLevel(nextZoom);
    }
  };

  // Interactive Seeking with Millisecond Accuracy under Zoom
  const calcSeekTimeFromX = useCallback(
    (clientX: number): number => {
      if (!containerRef.current) return playbackPosition;
      const rect = containerRef.current.getBoundingClientRect();
      const localRatio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const targetRatio = windowStart + localRatio * windowSpan;
      return Math.max(0, Math.min(duration, targetRatio * duration));
    },
    [windowStart, windowSpan, duration, playbackPosition]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pinchStartRef.current) return;
    setIsScrubbing(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const targetTime = calcSeekTimeFromX(e.clientX);
    onSeek(targetTime);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const targetTime = calcSeekTimeFromX(e.clientX);
    setHoverTime(targetTime);
    if (isScrubbing) {
      onSeek(targetTime);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsScrubbing(false);
    setHoverTime(null);
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {}
  };

  // Format Helper: mm:ss.xx (hundredths of a second for precision cueing)
  const formatPrecisionTime = (sec: number): string => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 100);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Musical Bar Structure Calculations (Exact Beat-Aligned Math with Grid Calibration)
  const safeBpm = Math.max(30, bpm || 128);
  const secondsPerBeat = 60 / safeBpm;
  const secondsPerBar = secondsPerBeat * 4;
  const totalTrackBars = Math.max(1, Math.ceil(duration / secondsPerBar));
  const totalTrackBeats = duration / secondsPerBeat;

  const effectivePlayTime = Math.max(0, playbackPosition - gridOffset);
  const currentTotalBeats = effectivePlayTime / secondsPerBeat;
  const currentBar = Math.floor(currentTotalBeats / 4) + 1;
  const currentBeatInBar = (Math.floor(currentTotalBeats) % 4) + 1;
  const currentPhraseBar = ((currentBar - 1) % 4) + 1; // 1, 2, 3, or 4 inside the 4-bar phrase
  const currentPhraseIndex = Math.floor((currentBar - 1) / 4) + 1;

  // Viewport boundaries in seconds
  const visibleStartTime = windowStart * duration;
  const visibleEndTime = (windowStart + windowSpan) * duration;

  // Visible bars inside current viewport (offset-calibrated)
  const startBarIdx = Math.max(0, Math.floor((visibleStartTime - gridOffset) / secondsPerBar) - 1);
  const endBarIdx = Math.min(totalTrackBars + 2, Math.ceil((visibleEndTime - gridOffset) / secondsPerBar) + 1);

  // Manual Beat Matching & Phase Calculations (Current Deck vs Reference Deck)
  const effectiveRefBpm = referenceBpm && referenceBpm > 0 ? referenceBpm : (deckId === 'A' ? 125 : 128);
  const refSecondsPerBeat = 60 / effectiveRefBpm;
  const refSecondsPerBar = refSecondsPerBeat * 4;

  const currentBeatPhase = (((effectivePlayTime % secondsPerBeat) + secondsPerBeat) % secondsPerBeat) / secondsPerBeat;
  const refBeatPhase = referencePlaybackPosition !== undefined
    ? (((referencePlaybackPosition % refSecondsPerBeat) + refSecondsPerBeat) % refSecondsPerBeat) / refSecondsPerBeat
    : 0;

  // Relative beat phase offset: -0.5 (behind) to +0.5 (ahead)
  let beatPhaseDiff = isSyncLocked ? 0 : (currentBeatPhase - refBeatPhase);
  if (beatPhaseDiff > 0.5) beatPhaseDiff -= 1.0;
  if (beatPhaseDiff < -0.5) beatPhaseDiff += 1.0;

  const msPhaseOffset = Math.round(beatPhaseDiff * secondsPerBeat * 1000);
  const normalizedPhaseDrift = Math.max(-1, Math.min(1, beatPhaseDiff * 2)); // -1 to +1
  const isPhaseAligned = isSyncLocked || Math.abs(beatPhaseDiff) < 0.038; // within ~18ms at 128bpm

  // Measure / Bar downbeat offset (0 to 4 beats within the measure)
  const currentBarPhase = (((effectivePlayTime % secondsPerBar) + secondsPerBar) % secondsPerBar) / secondsPerBar;
  const refBarPhase = referencePlaybackPosition !== undefined
    ? (((referencePlaybackPosition % refSecondsPerBar) + refSecondsPerBar) % refSecondsPerBar) / refSecondsPerBar
    : 0;
  let barPhaseDiff = isSyncLocked ? 0 : (currentBarPhase - refBarPhase);
  if (barPhaseDiff > 0.5) barPhaseDiff -= 1.0;
  if (barPhaseDiff < -0.5) barPhaseDiff += 1.0;
  const isMeasureAligned = isSyncLocked || Math.abs(barPhaseDiff) < 0.038;

  interface GridBarItem {
    barIndex: number; // 0-based
    barNumber: number; // 1-based (Bar 1, Bar 2...)
    isMajorPhrase: boolean; // Bar 1, 5, 9, 13, 17, 21, 25, 29, 33... (every 4 bars)
    isMasterSection: boolean; // Bar 1, 17, 33, 49... (every 16 bars)
    isActiveBar: boolean;
    relPos: number; // in visible window: 0..1
    time: number;
  }

  const visibleBars: GridBarItem[] = [];
  if (showBeatGrid && duration > 0 && gridMode !== 'OFF') {
    for (let b = startBarIdx; b <= endBarIdx; b++) {
      const barTime = b * secondsPerBar + gridOffset;
      const relPos = ((barTime / duration) - windowStart) / windowSpan;
      if (relPos >= -0.05 && relPos <= 1.05) {
        visibleBars.push({
          barIndex: b,
          barNumber: b + 1,
          isMajorPhrase: b % 4 === 0,
          isMasterSection: b % 16 === 0,
          isActiveBar: currentBar === b + 1,
          relPos,
          time: barTime,
        });
      }
    }
  }

  // Ghost Reference Grid for Manual Beat Matching (when sync is disabled)
  interface RefGridBarItem {
    barIndex: number;
    relPos: number;
    time: number;
  }

  const visibleRefBars: RefGridBarItem[] = [];
  if (showBeatGrid && referencePlaybackPosition !== undefined && !isSyncLocked && duration > 0 && gridMode !== 'OFF') {
    const timeDelta = playbackPosition - referencePlaybackPosition;
    const refStartBar = Math.max(0, Math.floor((visibleStartTime - timeDelta) / refSecondsPerBar) - 1);
    const refEndBar = Math.min(
      Math.ceil((duration / refSecondsPerBar) + 5),
      Math.ceil((visibleEndTime - timeDelta) / refSecondsPerBar) + 1
    );

    for (let rb = refStartBar; rb <= refEndBar; rb++) {
      const refTimeInWindow = rb * refSecondsPerBar + timeDelta;
      const relPos = ((refTimeInWindow / duration) - windowStart) / windowSpan;
      if (relPos >= -0.02 && relPos <= 1.02) {
        visibleRefBars.push({
          barIndex: rb,
          relPos,
          time: refTimeInWindow,
        });
      }
    }
  }

  interface GridBeatItem {
    key: string;
    barNumber: number;
    beatInBar: number;
    relPos: number;
    time: number;
  }

  interface GridSubdivisionItem {
    key: string;
    subdivision: '1/8' | '1/16';
    relPos: number;
    time: number;
  }

  const visibleBeats: GridBeatItem[] = [];
  const visibleSubBeats: GridSubdivisionItem[] = [];

  // Dynamic grid scaling based on zoom level and BPM
  const shouldShowQuarterBeats = gridMode === 'BEATS' || (gridMode === 'BARS' && zoomLevel >= 1.5);
  const shouldShowEighthBeats = (gridMode === 'BEATS' || gridMode === 'BARS') && zoomLevel >= 3.0;
  const shouldShowSixteenthBeats = (gridMode === 'BEATS' || gridMode === 'BARS') && zoomLevel >= 5.5;

  // Determine current active grid resolution description
  const dynamicGridResolution = shouldShowSixteenthBeats
    ? '1/16 BEAT'
    : shouldShowEighthBeats
    ? '1/8 BEAT'
    : shouldShowQuarterBeats
    ? '1/4 BEAT'
    : '1/1 BAR';

  if (showBeatGrid && gridMode !== 'OFF' && duration > 0) {
    for (let b = startBarIdx; b <= endBarIdx; b++) {
      const barTime = b * secondsPerBar + gridOffset;

      // Quarter Beats 2, 3, 4
      if (shouldShowQuarterBeats) {
        for (let beat = 2; beat <= 4; beat++) {
          const beatTime = barTime + (beat - 1) * secondsPerBeat;
          const relPos = ((beatTime / duration) - windowStart) / windowSpan;
          if (relPos >= -0.02 && relPos <= 1.02) {
            visibleBeats.push({
              key: `${b}-${beat}`,
              barNumber: b + 1,
              beatInBar: beat,
              relPos,
              time: beatTime,
            });
          }
        }
      }

      // 1/8 note subdivisions (half-beat points between 1, 2, 3, 4)
      if (shouldShowEighthBeats) {
        for (let beat = 1; beat <= 4; beat++) {
          const eighthTime = barTime + (beat - 1) * secondsPerBeat + secondsPerBeat * 0.5;
          const relPos = ((eighthTime / duration) - windowStart) / windowSpan;
          if (relPos >= -0.02 && relPos <= 1.02) {
            visibleSubBeats.push({
              key: `${b}-${beat}-8th`,
              subdivision: '1/8',
              relPos,
              time: eighthTime,
            });
          }

          // 1/16 note subdivisions at ultra-zoom for fine transient alignment
          if (shouldShowSixteenthBeats) {
            const sixteenth1Time = barTime + (beat - 1) * secondsPerBeat + secondsPerBeat * 0.25;
            const sixteenth2Time = barTime + (beat - 1) * secondsPerBeat + secondsPerBeat * 0.75;

            const relPos1 = ((sixteenth1Time / duration) - windowStart) / windowSpan;
            if (relPos1 >= -0.02 && relPos1 <= 1.02) {
              visibleSubBeats.push({
                key: `${b}-${beat}-16th-1`,
                subdivision: '1/16',
                relPos: relPos1,
                time: sixteenth1Time,
              });
            }

            const relPos2 = ((sixteenth2Time / duration) - windowStart) / windowSpan;
            if (relPos2 >= -0.02 && relPos2 <= 1.02) {
              visibleSubBeats.push({
                key: `${b}-${beat}-16th-2`,
                subdivision: '1/16',
                relPos: relPos2,
                time: sixteenth2Time,
              });
            }
          }
        }
      }
    }
  }

  // Active bar bounding range in zoom window
  const activeBarStartTime = (currentBar - 1) * secondsPerBar + gridOffset;
  const currentDeck = deckId || masterDeck;
  const isDeckMaster = currentDeck === masterDeck;
  const isCompact = variant === 'compact';

  // Master BPM Downbeat calculation for rhythmic visual guidance (4 Beats per Bar)
  const barDuration = (60 / safeBpm) * 4;
  const beatDuration = 60 / safeBpm;
  const isDownbeat = currentBeatInBar === 1;

  const activeBarEndTime = currentBar * secondsPerBar + gridOffset;
  const activeBarRelStart = duration > 0 ? ((activeBarStartTime / duration) - windowStart) / windowSpan : 0;
  const activeBarRelEnd = duration > 0 ? ((activeBarEndTime / duration) - windowStart) / windowSpan : 0;
  const activeBarRelWidth = activeBarRelEnd - activeBarRelStart;
  const isActiveBarVisible = activeBarRelEnd >= 0 && activeBarRelStart <= 1;

  return (
    <div className={`w-full flex flex-col gap-1 select-none ${className}`}>
      {/* Downbeat rhythmic pulse CSS Keyframes */}
      <style>{`
        @keyframes downbeatWaveGlowBlue {
          0% {
            box-shadow: 0 0 28px rgba(59, 130, 246, 0.55), inset 0 0 16px rgba(59, 130, 246, 0.25);
            border-color: rgba(96, 165, 250, 0.95);
          }
          18% {
            box-shadow: 0 0 16px rgba(59, 130, 246, 0.25), inset 0 0 8px rgba(59, 130, 246, 0.1);
            border-color: rgba(59, 130, 246, 0.65);
          }
          100% {
            box-shadow: 0 0 10px rgba(59, 130, 246, 0.12), inset 0 0 2px rgba(59, 130, 246, 0.02);
            border-color: rgba(59, 130, 246, 0.35);
          }
        }
        @keyframes downbeatWaveGlowOrange {
          0% {
            box-shadow: 0 0 28px rgba(249, 115, 22, 0.55), inset 0 0 16px rgba(249, 115, 22, 0.25);
            border-color: rgba(251, 146, 60, 0.95);
          }
          18% {
            box-shadow: 0 0 16px rgba(249, 115, 22, 0.25), inset 0 0 8px rgba(249, 115, 22, 0.1);
            border-color: rgba(249, 115, 22, 0.65);
          }
          100% {
            box-shadow: 0 0 10px rgba(249, 115, 22, 0.12), inset 0 0 2px rgba(249, 115, 22, 0.02);
            border-color: rgba(249, 115, 22, 0.35);
          }
        }
      `}</style>

      {/* 1. Zoom Control Strip & Mini Overview Map */}
      <div className="flex items-center justify-between px-0.5 text-[8.5px] font-mono text-zinc-400">
        {/* Left: Deck Badge, Title & Mini Overview Timeline Strip */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {/* Deck Badge */}
          <div
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[8px] font-black uppercase tracking-wider shrink-0 border ${
              currentDeck === 'A'
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-[0_0_8px_rgba(59,130,246,0.25)]'
                : 'bg-orange-500/20 text-orange-300 border-orange-500/50 shadow-[0_0_8px_rgba(249,115,22,0.25)]'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                currentDeck === 'A' ? 'bg-blue-400' : 'bg-orange-400'
              } ${isPlaying ? 'animate-pulse' : ''}`}
            />
            <span>DECK {currentDeck}</span>
            {isDeckMaster && (
              <span className="text-[6.5px] px-1 py-0 rounded bg-black/40 font-extrabold text-white">
                MSTR
              </span>
            )}
          </div>

          {/* Deck Title if provided */}
          {deckTitle && (
            <span className="font-mono text-[9px] font-bold text-zinc-200 truncate max-w-[120px] sm:max-w-[180px]">
              {deckTitle}
            </span>
          )}

          {/* 4-Beat Rhythmic Bar Pulse Guidance Meter */}
          <div
            className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-[#0b0b0f] border border-zinc-800 shrink-0"
            title={`Takt-Phase: Beat ${currentBeatInBar} von 4 (${isDownbeat ? 'DOWNBEAT 1' : ''})`}
          >
            {[1, 2, 3, 4].map((b) => (
              <span
                key={b}
                className={`w-1 h-1 rounded-full transition-all duration-75 ${
                  isPlaying && currentBeatInBar === b
                    ? b === 1
                      ? currentDeck === 'A'
                        ? 'bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,1)] scale-125'
                        : 'bg-orange-400 shadow-[0_0_8px_rgba(249,115,22,1)] scale-125'
                      : 'bg-zinc-200 shadow-xs'
                    : b === 1
                    ? currentDeck === 'A'
                      ? 'bg-blue-900'
                      : 'bg-orange-950'
                    : 'bg-zinc-800'
                }`}
              />
            ))}
          </div>

          {/* Mini Overview Timeline Strip with Zoom Window Rect */}
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickRatio = (e.clientX - rect.left) / rect.width;
              onSeek(clickRatio * duration);
            }}
            className={`relative flex-1 max-w-[180px] ${isCompact ? 'h-2.5' : 'h-3'} bg-[#111115] rounded border border-zinc-800/80 cursor-pointer overflow-hidden`}
            title="Klicken zum Navigieren im Gesamttrack (Makro-Taktstruktur)"
          >
            {/* Full Waveform Mini Strip */}
            <div className="absolute inset-0 flex items-center justify-between gap-[1px] px-0.5 opacity-40">
              {bars.map((h, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-full ${currentDeck === 'A' ? 'bg-blue-400' : 'bg-orange-400'}`}
                  style={{ height: `${h * 0.7}%` }}
                />
              ))}
            </div>

            {/* Macro 4-Bar & 16-Bar Phrase Divider Ticks across entire track */}
            {duration > 0 &&
              gridMode !== 'OFF' &&
              Array.from({ length: Math.ceil(totalTrackBars / 4) }).map((_, pIdx) => {
                const pBar = pIdx * 4;
                const pRatio = (pBar * secondsPerBar) / duration;
                if (pRatio > 1) return null;
                const isMaster16 = pIdx % 4 === 0;
                return (
                  <div
                    key={`p-${pIdx}`}
                    className={`absolute inset-y-0 pointer-events-none ${
                      isMaster16
                        ? 'w-[1.5px] bg-rose-500/70 z-5'
                        : 'w-[1px] bg-zinc-600/35 z-4'
                    }`}
                    style={{ left: `${pRatio * 100}%` }}
                  />
                );
              })}

            {/* Playhead in Overview */}
            <div
              className={`absolute inset-y-0 w-0.5 z-20 pointer-events-none ${
                currentDeck === 'A'
                  ? 'bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.9)]'
                  : 'bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.9)]'
              }`}
              style={{ left: `${progress * 100}%` }}
            />

            {/* CUE Point Tick in Overview */}
            {cuePosition !== undefined && duration > 0 && (
              <div
                className="absolute inset-y-0 w-1 bg-sky-400 z-10 pointer-events-none shadow-[0_0_4px_rgba(56,189,248,0.8)]"
                style={{ left: `${(cuePosition / duration) * 100}%` }}
                title={`Aktueller CUE Punkt: ${formatPrecisionTime(cuePosition)}`}
              />
            )}

            {/* Zoom Window Box */}
            {zoomLevel > 1 && (
              <div
                className="absolute inset-y-0 bg-rose-500/15 border-x border-rose-500/60 pointer-events-none transition-all duration-75"
                style={{
                  left: `${windowStart * 100}%`,
                  width: `${windowSpan * 100}%`,
                }}
              />
            )}
          </div>
        </div>

        {/* Right: Tactile Zoom Controls, Grid Mode & Time readout */}
        <div className="flex items-center gap-1 shrink-0 ml-1">
          {/* Elapsed / Total Time */}
          <span className="font-mono text-[8px] text-zinc-400 hidden sm:inline">
            {formatPrecisionTime(playbackPosition)} / {formatPrecisionTime(duration)}
          </span>

          {/* Tactile Beat-Grid Mode Toggle */}
          <button
            onClick={() => {
              const nextMode: GridOverlayMode =
                gridMode === 'BARS' ? 'BEATS' : gridMode === 'BEATS' ? 'OFF' : 'BARS';
              setGridMode(nextMode);
              try {
                localStorage.setItem('glyph_grid_mode', nextMode);
              } catch {}
            }}
            className={`flex items-center gap-0.5 px-1 py-0.5 rounded border font-mono text-[7.5px] font-bold transition active:scale-95 ${
              gridMode !== 'OFF'
                ? 'bg-zinc-900 border-zinc-700 text-zinc-100 shadow-[0_0_6px_rgba(244,63,94,0.15)]'
                : 'bg-[#101014] border-zinc-800 text-zinc-500 hover:text-zinc-400'
            }`}
            title={`Vertikales Beat-Grid Overlay: ${gridMode !== 'OFF' ? `${dynamicGridResolution} @ ${bpm.toFixed(1)} BPM` : 'AUS'}`}
          >
            <Grid className={`w-2.5 h-2.5 ${gridMode !== 'OFF' ? 'text-rose-500' : 'text-zinc-600'}`} />
            <span>
              {gridMode !== 'OFF' ? `${dynamicGridResolution} • ${bpm.toFixed(1)}` : 'GRID OFF'}
            </span>
          </button>

          {/* Quick Overview / Detailed Toggle */}
          <div className="flex items-center gap-0.5 bg-black/40 p-0.5 rounded border border-zinc-800">
            <button
              onClick={() => {
                setZoomLevel(1.0);
                setManualPanOffset(null);
              }}
              className={`px-1.5 py-0.5 rounded text-[7.5px] font-bold font-mono transition active:scale-90 ${
                zoomLevel <= 1.2
                  ? 'bg-zinc-100 text-zinc-950 font-extrabold'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Overview (1.0×)"
            >
              OVERVIEW
            </button>
            <button
              onClick={() => {
                setZoomLevel(4.0);
              }}
              className={`px-1.5 py-0.5 rounded text-[7.5px] font-bold font-mono transition active:scale-90 ${
                zoomLevel > 1.2
                  ? 'bg-rose-500 text-white font-extrabold'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Detailed (4.0×) - Präzise CUE-Platzierung"
            >
              DETAILED
            </button>
          </div>

          {/* Zoom Level Indicator */}
          <span className="font-bold text-zinc-300 font-mono text-[9px] flex items-center gap-1">
            <Crosshair className="w-2.5 h-2.5 text-rose-500" />
            {zoomLevel.toFixed(1)}×
          </span>

          {/* Slider */}
          <input
            type="range"
            min="1"
            max="8"
            step="0.2"
            value={zoomLevel}
            onChange={(e) => {
              const next = parseFloat(e.target.value);
              setZoomLevel(next);
              if (next === 1) setManualPanOffset(null);
            }}
            className="w-14 h-1 accent-rose-500 bg-zinc-800 rounded-lg cursor-pointer"
            title="Pinch oder Schieberegler zum Vergrößern"
          />

          {/* Quick Presets: 1x, 2x, 4x, 8x */}
          <div className="flex items-center gap-0.5">
            {[1, 2, 4, 8].map((lvl) => (
              <button
                key={lvl}
                onClick={() => {
                  setZoomLevel(lvl);
                  if (lvl === 1) setManualPanOffset(null);
                }}
                className={`px-1.5 py-0.5 rounded text-[8px] font-bold transition active:scale-90 border ${
                  Math.round(zoomLevel) === lvl
                    ? 'bg-zinc-100 text-zinc-950 border-white'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                {lvl}×
              </button>
            ))}
          </div>

          {/* Reset Zoom Button */}
          {zoomLevel > 1 && (
            <button
              onClick={() => {
                setZoomLevel(1.0);
                setManualPanOffset(null);
              }}
              className="p-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-rose-400 active:scale-95 transition"
              title="Zoom zurücksetzen (1×)"
            >
              <RotateCcw className="w-2.5 h-2.5" />
            </button>
          )}

          {/* Dedicated Tactile SET CUE Button for Precise Cue Placement */}
          {onSetCuePoint && (
            <button
              onClick={() => onSetCuePoint(playbackPosition)}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-500/15 border border-sky-400/50 text-sky-300 hover:text-white hover:bg-sky-500/30 active:scale-95 transition font-mono text-[8px] font-bold shadow-[0_0_8px_rgba(56,189,248,0.25)]"
              title={`CUE Punkt auf aktuelle Position (${formatPrecisionTime(playbackPosition)}) setzen`}
            >
              <MapPin className="w-2.5 h-2.5 text-sky-400" />
              <span>SET CUE</span>
            </button>
          )}
        </div>
      </div>

      {/* 1b. Traktor-Style Visual Beat-Grid & Manual Beat Matching HUD Ribbon */}
      {showBeatGrid && (
        <div className="flex flex-wrap items-center justify-between gap-1 px-2 py-1 bg-[#0b0b0f] border border-zinc-800/90 rounded-lg shadow-sm">
        {/* Left: Measure Indicator & 4-Beat Rhythmic LED Guideline */}
        <div className="flex items-center gap-2">
          {/* Current Measure / Downbeat Badge */}
          <div className="flex items-center gap-1.5 bg-black/60 px-2 py-0.5 rounded border border-zinc-800">
            <span className="font-mono text-[7px] text-zinc-500 font-bold uppercase tracking-wider">MEASURE</span>
            <span className={`font-mono text-[9px] font-black ${currentDeck === 'A' ? 'text-blue-400' : 'text-orange-400'}`}>
              BAR {currentBar}
            </span>
            <span className="font-mono text-[8px] text-zinc-400 font-extrabold">
              .{currentBeatInBar}
            </span>
            <span className="text-zinc-600 font-mono text-[7px]">/ 4</span>
          </div>

          {/* 4-Beat Measure Downbeat Ticker LEDs */}
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/50 border border-zinc-800/80"
            title={`Takt-Phase: Beat ${currentBeatInBar} von 4 (${isDownbeat ? 'DOWNBEAT 1' : ''})`}
          >
            {[1, 2, 3, 4].map((b) => {
              const isHit = isPlaying && currentBeatInBar === b;
              return (
                <div key={b} className="flex flex-col items-center">
                  <span
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-75 ${
                      isHit
                        ? b === 1
                          ? currentDeck === 'A'
                            ? 'bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,1)] scale-125'
                            : 'bg-orange-400 shadow-[0_0_8px_rgba(249,115,22,1)] scale-125'
                          : 'bg-zinc-100 shadow-[0_0_4px_rgba(255,255,255,0.8)]'
                        : b === 1
                        ? currentDeck === 'A'
                          ? 'bg-blue-900/80 border border-blue-500/40'
                          : 'bg-orange-950/80 border border-orange-500/40'
                        : 'bg-zinc-800'
                    }`}
                  />
                  <span className="text-[5.5px] font-mono text-zinc-600 font-bold leading-none mt-0.5">
                    {b}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Sync Status / Manual Beatmatch Indicator */}
          {isSyncLocked ? (
            <div
              onClick={onToggleSync}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/60 text-emerald-300 font-mono text-[7.5px] font-extrabold shadow-[0_0_6px_rgba(16,185,129,0.25)] cursor-pointer hover:brightness-125 active:scale-95 transition"
              title="SYNC ist AKTIV: Decks sind synchronisiert. Klicken zum Lösen für manuelles Beatmatching."
            >
              <Check className="w-2.5 h-2.5 text-emerald-400" />
              <span>SYNC LOCKED</span>
            </div>
          ) : (
            <button
              onClick={onToggleSync}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-950/90 border border-amber-500/80 text-amber-200 font-mono text-[7.5px] font-black shadow-[0_0_10px_rgba(251,191,36,0.35)] hover:brightness-125 active:scale-95 transition"
              title="SYNC ist AUS: Manuelles Beatmatching aktiv! Nutze Beatgrid-Taktgrenzen und Nudge zum Angleichen."
            >
              <Zap className="w-2.5 h-2.5 text-amber-400 animate-pulse" />
              <span>MANUAL BEATMATCH</span>
            </button>
          )}
        </div>

        {/* Center: Real-Time Beat Phase Meter & Drift Readout (Traktor Kontrol D2 Screen Style) */}
        <div className="flex items-center gap-2">
          {/* Phase Drift Status Label */}
          <div className="flex items-center gap-1 font-mono text-[8px] font-bold">
            {isSyncLocked || isPhaseAligned ? (
              <span className="text-emerald-400 flex items-center gap-0.5">
                <Check className="w-2.5 h-2.5" />
                <span>IN PHASE (0ms)</span>
              </span>
            ) : msPhaseOffset > 0 ? (
              <span className="text-amber-400 flex items-center gap-0.5" title="Deck ist zu schnell/voraus - Nudge rückwärts (-)">
                <span>+{msPhaseOffset}ms SLOW</span>
                <ChevronLeft className="w-3 h-3 text-amber-400 animate-pulse" />
              </span>
            ) : (
              <span className="text-rose-400 flex items-center gap-0.5" title="Deck ist zu langsam/hinterher - Nudge vorwärts (+)">
                <ChevronRight className="w-3 h-3 text-rose-400 animate-pulse" />
                <span>{msPhaseOffset}ms FAST</span>
              </span>
            )}
          </div>

          {/* Graphical Phase Bar Meter (Traktor D2 Phase Indicator) */}
          <div
            className="relative w-24 sm:w-32 h-3 bg-black/80 rounded border border-zinc-800 flex items-center px-0.5 overflow-hidden shadow-inner"
            title={`Beat-Phasen Drift: ${msPhaseOffset >= 0 ? '+' : ''}${msPhaseOffset}ms (${(beatPhaseDiff * 100).toFixed(0)}% eines Beats)`}
          >
            {/* Center Zero Line */}
            <div className="absolute left-1/2 -ml-[0.5px] inset-y-0 w-[1px] bg-white/70 z-10 pointer-events-none" />

            {/* Scale Hash Marks */}
            <div className="absolute inset-0 flex justify-between px-1 items-center pointer-events-none opacity-30">
              {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((t) => (
                <span
                  key={t}
                  className={`w-[1px] ${t === 0 ? 'h-full bg-white' : 'h-1.5 bg-zinc-500'}`}
                />
              ))}
            </div>

            {/* Moving Phase Needle */}
            <div
              className="absolute top-0 bottom-0 w-2 -ml-1 transition-all duration-75 flex items-center justify-center pointer-events-none z-20"
              style={{
                left: `${50 + normalizedPhaseDrift * 44}%`,
              }}
            >
              <div
                className={`w-1.5 h-full rounded-xs shadow-sm transition-colors ${
                  isPhaseAligned
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)]'
                    : msPhaseOffset > 0
                    ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,1)]'
                    : 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,1)]'
                }`}
              />
            </div>
          </div>

          {/* Measure Downbeat Alignment Chip */}
          <div
            className={`hidden md:flex items-center gap-1 px-1.5 py-0.5 rounded text-[7px] font-mono font-bold border ${
              isMeasureAligned
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400'
            }`}
            title="Taktgrenzen-Status (Downbeat 1.0 von 4 Beats)"
          >
            <span className={`w-1 h-1 rounded-full ${isMeasureAligned ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span>{isMeasureAligned ? 'TAKT 1:1' : 'OFFSET'}</span>
          </div>
        </div>

        {/* Right: Tactile DJ Nudge Steppers & Beatgrid Alignment Tools */}
        <div className="flex items-center gap-1">
          {/* Nudge Backward (-) */}
          <button
            onClick={() => {
              triggerHaptic('nudge');
              onNudge ? onNudge(-1) : onSeek(Math.max(0, playbackPosition - 0.025));
            }}
            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 active:scale-90 transition font-mono text-[7.5px] font-bold shadow-xs"
            title="Nudge Rückwärts (-25ms): Track leicht bremsen zum Beatmatchen"
          >
            <ChevronLeft className="w-2.5 h-2.5 text-zinc-400" />
            <span>NUDGE -</span>
          </button>

          {/* Nudge Forward (+) */}
          <button
            onClick={() => {
              triggerHaptic('nudge');
              onNudge ? onNudge(1) : onSeek(Math.min(duration, playbackPosition + 0.025));
            }}
            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 active:scale-90 transition font-mono text-[7.5px] font-bold shadow-xs"
            title="Nudge Vorwärts (+25ms): Track leicht beschleunigen zum Beatmatchen"
          >
            <span>NUDGE +</span>
            <ChevronRight className="w-2.5 h-2.5 text-zinc-400" />
          </button>

          {/* Align Grid 1.1 Button */}
          <button
            onClick={handleAlignGridToCurrent}
            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/50 text-cyan-300 active:scale-90 transition font-mono text-[7.5px] font-bold shadow-xs"
            title="Beat-Grid Taktgrenze (Beat 1.0) auf aktuelle Playhead-Position kalibrieren"
          >
            <Disc className="w-2.5 h-2.5 text-cyan-400" />
            <span>ALIGN 1.1</span>
          </button>

          {/* Grid Calibration Stepper Drawer Toggle */}
          <button
            onClick={() => setShowGridCalibration(!showGridCalibration)}
            className={`p-1 rounded border font-mono text-[7.5px] transition active:scale-90 ${
              showGridCalibration || gridOffset !== 0
                ? 'bg-rose-950/70 border-rose-500/70 text-rose-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
            title="Beat-Grid Fein-Offset Menü öffnen"
          >
            <Sliders className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>
      )}

      {/* Optional Fine Grid Calibration Drawer */}
      {showGridCalibration && showBeatGrid && (
        <div className="flex items-center justify-between px-2 py-1 bg-[#101014] border border-cyan-500/40 rounded-md font-mono text-[7.5px]">
          <div className="flex items-center gap-2 text-zinc-300">
            <span className="text-cyan-400 font-bold">GRID OFFSET:</span>
            <span>{gridOffset !== 0 ? `${(gridOffset * 1000).toFixed(0)}ms` : '0ms (Standard)'}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleNudgeGrid(-5)}
              className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 active:scale-95"
              title="Grid 5ms früher"
            >
              -5ms
            </button>
            <button
              onClick={() => handleNudgeGrid(5)}
              className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 active:scale-95"
              title="Grid 5ms später"
            >
              +5ms
            </button>
            {gridOffset !== 0 && (
              <button
                onClick={handleResetGrid}
                className="px-1.5 py-0.5 rounded bg-rose-950 border border-rose-500/50 text-rose-300 active:scale-95"
                title="Grid-Offset zurücksetzen"
              >
                RESET
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Interactive Zoomed Waveform Viewport (Supports Pinch-to-Zoom & Sub-Beat Precision Cueing) */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={(e) => {
          const targetTime = calcSeekTimeFromX(e.clientX);
          onSeek(targetTime);
          onSetCuePoint?.(targetTime);
        }}
        style={
          isPlaying
            ? {
                animation: `${currentDeck === 'A' ? 'downbeatWaveGlowBlue' : 'downbeatWaveGlowOrange'} ${barDuration}s cubic-bezier(0.1, 0.9, 0.2, 1) infinite`,
              }
            : undefined
        }
        className={`relative w-full ${
          isCompact ? 'h-11 sm:h-12' : 'h-14'
        } bg-[#0d0d12] rounded-xl px-2 py-1 flex items-center justify-between cursor-crosshair overflow-hidden touch-none transition-all duration-200 shadow-inner ${
          currentDeck === 'A'
            ? 'border border-blue-500/50 shadow-[0_0_24px_rgba(59,130,246,0.22)] ring-1 ring-blue-500/25'
            : 'border border-orange-500/50 shadow-[0_0_24px_rgba(249,115,22,0.25)] ring-1 ring-orange-500/25'
        }`}
      >
        {/* Playhead in Zoomed Window */}
        {(() => {
          const playheadRelRatio = (progress - windowStart) / windowSpan;
          const isVisible = playheadRelRatio >= 0 && playheadRelRatio <= 1;

          if (!isVisible) return null;

          return (
            <div
              className={`absolute inset-y-0 w-0.5 z-20 pointer-events-none transition-[left] duration-75 ease-linear ${
                currentDeck === 'A'
                  ? 'bg-blue-500 shadow-[0_0_14px_rgba(59,130,246,1)]'
                  : 'bg-orange-500 shadow-[0_0_14px_rgba(249,115,22,1)]'
              }`}
              style={{ left: `${playheadRelRatio * 100}%` }}
            >
              {/* Playhead Downbeat Pulse Aura */}
              {isPlaying && isDownbeat && (
                <div
                  className={`absolute inset-y-0 -left-2 w-4 rounded-full pointer-events-none opacity-70 animate-ping ${
                    currentDeck === 'A'
                      ? 'bg-blue-400 shadow-[0_0_16px_rgba(59,130,246,1)]'
                      : 'bg-orange-400 shadow-[0_0_16px_rgba(249,115,22,1)]'
                  }`}
                />
              )}
              <div
                className={`absolute top-0 -left-1.5 w-3.5 h-1.5 rounded-sm ${
                  currentDeck === 'A'
                    ? 'bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.9)]'
                    : 'bg-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.9)]'
                }`}
              />
              <div
                className={`absolute bottom-0 -left-1.5 w-3.5 h-1.5 rounded-sm ${
                  currentDeck === 'A'
                    ? 'bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.9)]'
                    : 'bg-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.9)]'
                }`}
              />
            </div>
          );
        })()}

        {/* CUE Point Marker in Zoomed Window */}
        {cuePosition !== undefined && duration > 0 && (() => {
          const cueRelRatio = (cuePosition / duration - windowStart) / windowSpan;
          const isVisible = cueRelRatio >= -0.02 && cueRelRatio <= 1.02;

          if (!isVisible) return null;

          return (
            <div
              className="absolute inset-y-0 w-0.5 bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,1)] z-25 pointer-events-none"
              style={{ left: `${cueRelRatio * 100}%` }}
            >
              <div className="absolute top-0 -left-3 px-1 py-[1px] bg-sky-400 text-zinc-950 text-[7px] font-black rounded-xs shadow-[0_0_8px_rgba(56,189,248,0.9)] flex items-center gap-0.5 leading-none">
                <span>CUE</span>
              </div>
              <div className="absolute bottom-0 -left-1 w-2.5 h-1 bg-sky-400 rounded-xs" />
            </div>
          );
        })()}

        {/* Hot Cues in Zoomed Window */}
        {hotCues &&
          hotCues.map((hc) => {
            if (hc.value === undefined || duration <= 0) return null;
            const hcRelRatio = (hc.value / duration - windowStart) / windowSpan;
            if (hcRelRatio < -0.02 || hcRelRatio > 1.02) return null;

            return (
              <div
                key={hc.id}
                className="absolute inset-y-0 w-[1px] bg-amber-400/80 z-20 pointer-events-none"
                style={{ left: `${hcRelRatio * 100}%` }}
              >
                <div className="absolute top-1 -left-2 px-0.5 py-[0.5px] bg-amber-400 text-zinc-950 text-[6px] font-black rounded-xs leading-none shadow-[0_0_4px_rgba(251,191,36,0.8)]">
                  {hc.label.replace('CUE ', '')}
                </div>
              </div>
            );
          })}

        {/* Hover / Scrub Precision Time Tooltip */}
        {hoverTime !== null && (
          <div
            className="absolute top-1 z-30 px-1.5 py-0.5 rounded bg-zinc-900/95 border border-rose-500/60 font-mono text-[8px] font-bold text-rose-300 shadow-md pointer-events-none"
            style={{
              left: `${Math.max(8, Math.min(92, ((hoverTime / duration - windowStart) / windowSpan) * 100))}%`,
              transform: 'translateX(-50%)',
            }}
          >
            {formatPrecisionTime(hoverTime)}
          </div>
        )}

        {/* 2a. Visual Beat-Aligned Bar Grid Overlay (Nothing-Inspired Aesthetic) */}
        {gridMode !== 'OFF' && (
          <div className="absolute inset-0 px-2 pointer-events-none z-10 overflow-hidden">
            {/* Active Playing Bar Highlight Zone with Nothing Red Phosphor Bloom */}
            {isActiveBarVisible && (
              <div
                className="absolute inset-y-0 pointer-events-none z-5 transition-[left,width] duration-75"
                style={{
                  left: `${Math.max(0, activeBarRelStart) * 100}%`,
                  width: `${Math.min(1 - Math.max(0, activeBarRelStart), Math.max(0.005, activeBarRelWidth)) * 100}%`,
                }}
              >
                {/* Luminous Active Bar Raster Band */}
                <div className="absolute inset-0 bg-gradient-to-r from-rose-500/[0.09] via-rose-500/[0.04] to-rose-500/[0.09] border-x border-rose-500/50 shadow-[inset_0_0_14px_rgba(244,63,94,0.2)]" />
                <div className="absolute top-0 inset-x-0 h-[2px] bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]" />
                <div className="absolute bottom-0 inset-x-0 h-[1.5px] bg-rose-500/80" />
              </div>
            )}

            {/* Sub-Beats (Beats 2, 3, 4) within each Bar */}
            {visibleBeats.map((beat) => (
              <div
                key={beat.key}
                className="absolute inset-y-0 flex flex-col justify-between items-center -translate-x-1/2 pointer-events-none z-8"
                style={{ left: `${beat.relPos * 100}%` }}
              >
                {/* Top Sub-Beat Marker */}
                <div className="pt-0.5 flex flex-col items-center">
                  <div className="w-[1px] h-2 bg-zinc-500/80" />
                  {zoomLevel >= 1.8 && (
                    <span className="font-mono text-[6px] text-zinc-400 font-bold tracking-tighter leading-none select-none mt-0.5">
                      .{beat.beatInBar}
                    </span>
                  )}
                </div>

                {/* Vertical Sub-Beat Guide Line */}
                <div className="flex-1 w-[1px] border-l border-dotted border-zinc-700/60 my-0.5" />

                {/* Bottom Marker */}
                <div className="pb-0.5">
                  <div className="w-[1px] h-1.5 bg-zinc-500/80" />
                </div>
              </div>
            ))}

            {/* Fine Sub-Beat Subdivision Vertical Grid Lines (1/8th and 1/16th notes dynamically scaled) */}
            {visibleSubBeats.map((sb) => (
              <div
                key={sb.key}
                className="absolute inset-y-0 flex flex-col justify-between items-center -translate-x-1/2 pointer-events-none z-6"
                style={{ left: `${sb.relPos * 100}%` }}
              >
                <div className={`w-[1px] ${sb.subdivision === '1/8' ? 'h-1.5 bg-cyan-400/60' : 'h-1 bg-zinc-600/50'}`} />
                <div
                  className={`flex-1 w-[1px] border-l ${
                    sb.subdivision === '1/8'
                      ? 'border-dashed border-cyan-500/25 shadow-[0_0_2px_rgba(6,182,212,0.3)]'
                      : 'border-dotted border-zinc-700/30'
                  } my-0.5`}
                />
                <div className={`w-[1px] ${sb.subdivision === '1/8' ? 'h-1.5 bg-cyan-400/60' : 'h-1 bg-zinc-600/50'}`} />
              </div>
            ))}

            {/* Ghost Reference Measure Grid from other Deck (Active when Sync is Disabled for Manual Beatmatching) */}
            {visibleRefBars.map((rb) => (
              <div
                key={`ref-bar-${rb.barIndex}`}
                className="absolute inset-y-0 flex flex-col justify-between items-center -translate-x-1/2 pointer-events-none z-7"
                style={{ left: `${rb.relPos * 100}%` }}
              >
                {/* Top Reference Bar Tag */}
                <div className="pt-0.5 select-none">
                  <div
                    className={`px-1 py-[0.5px] rounded-2xs border text-[6px] font-mono font-bold leading-none shadow-xs ${
                      currentDeck === 'A'
                        ? 'bg-orange-950/80 border-orange-500/60 text-orange-300'
                        : 'bg-blue-950/80 border-blue-500/60 text-blue-300'
                    }`}
                  >
                    REF {rb.barIndex + 1}
                  </div>
                </div>

                {/* Ghost Reference Line */}
                <div
                  className={`h-full w-[1px] border-l border-dashed ${
                    currentDeck === 'A' ? 'border-orange-400/70' : 'border-blue-400/70'
                  } my-0.5`}
                />

                {/* Bottom Notch */}
                <div
                  className={`w-[1px] h-1.5 ${
                    currentDeck === 'A' ? 'bg-orange-400/60' : 'bg-blue-400/60'
                  }`}
                />
              </div>
            ))}

            {/* Exact Bar Downbeat Columns (Bars 1, 2, 3...) & 4-Bar / 16-Bar Phrases */}
            {visibleBars.map((bar) => {
              return (
                <div
                  key={`bar-${bar.barIndex}`}
                  className="absolute inset-y-0 flex flex-col justify-between items-center -translate-x-1/2 pointer-events-none z-10"
                  style={{ left: `${bar.relPos * 100}%` }}
                >
                  {/* Top Bar Marker / Tag in Traktor & Nothing Dot-Matrix Style */}
                  <div className="pt-0.5 flex flex-col items-center select-none">
                    {bar.isMajorPhrase ? (
                      <div
                        className={`flex items-center gap-1 px-1.5 py-[1px] rounded-xs bg-[#0d0d12]/95 border shadow-sm transition-colors ${
                          bar.isActiveBar
                            ? currentDeck === 'A'
                              ? 'border-blue-400 text-blue-100 shadow-[0_0_10px_rgba(59,130,246,0.8)]'
                              : 'border-orange-400 text-orange-100 shadow-[0_0_10px_rgba(249,115,22,0.8)]'
                            : 'border-rose-500/70 text-rose-300 shadow-[0_0_6px_rgba(244,63,94,0.3)]'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            currentDeck === 'A'
                              ? 'bg-blue-400 shadow-[0_0_6px_rgba(59,130,246,1)]'
                              : 'bg-orange-400 shadow-[0_0_6px_rgba(249,115,22,1)]'
                          } shrink-0 animate-pulse`}
                        />
                        <span className="font-mono text-[7px] font-black tracking-wider leading-none">
                          BAR {bar.barNumber < 10 ? `0${bar.barNumber}` : bar.barNumber}
                        </span>
                      </div>
                    ) : (
                      <div
                        className={`flex items-center px-1 py-[0.5px] rounded-2xs bg-[#0d0d12]/95 border ${
                          bar.isActiveBar
                            ? currentDeck === 'A'
                              ? 'border-blue-400 text-white shadow-[0_0_6px_rgba(59,130,246,0.6)]'
                              : 'border-orange-400 text-white shadow-[0_0_6px_rgba(249,115,22,0.6)]'
                            : 'border-zinc-700/80 text-zinc-300'
                        }`}
                      >
                        <span className="font-mono text-[6.5px] font-extrabold tracking-tighter leading-none">
                          BAR {bar.barNumber < 10 ? `0${bar.barNumber}` : bar.barNumber}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* High-Visibility Vertical Beat Column (Traktor Laser Downbeat Line) */}
                  <div className="flex-1 w-full flex flex-col items-center justify-between py-0.5">
                    {bar.isMajorPhrase ? (
                      <div
                        className={`h-full w-[2px] ${
                          currentDeck === 'A'
                            ? 'bg-gradient-to-b from-blue-400 via-sky-300 to-blue-500 shadow-[0_0_10px_rgba(56,189,248,0.9)]'
                            : 'bg-gradient-to-b from-orange-400 via-amber-300 to-orange-500 shadow-[0_0_10px_rgba(251,146,60,0.9)]'
                        } flex flex-col justify-around items-center`}
                      >
                        {Array.from({ length: 4 }).map((_, dIdx) => (
                          <div
                            key={dIdx}
                            className={`w-1.5 h-1.5 rounded-full ${
                              currentDeck === 'A'
                                ? 'bg-blue-300 shadow-[0_0_4px_rgba(147,197,253,1)]'
                                : 'bg-orange-300 shadow-[0_0_4px_rgba(253,186,116,1)]'
                            } -translate-x-[0.5px]`}
                          />
                        ))}
                      </div>
                    ) : (
                      <div
                        className={`h-full w-[1.5px] ${
                          currentDeck === 'A'
                            ? 'bg-gradient-to-b from-blue-500/90 via-blue-400/70 to-blue-500/90 shadow-[0_0_6px_rgba(59,130,246,0.5)]'
                            : 'bg-gradient-to-b from-orange-500/90 via-orange-400/70 to-orange-500/90 shadow-[0_0_6px_rgba(249,115,22,0.5)]'
                        } flex flex-col justify-around items-center`}
                      >
                        {Array.from({ length: 3 }).map((_, dIdx) => (
                          <div
                            key={dIdx}
                            className={`w-1 h-1 rounded-full ${
                              currentDeck === 'A' ? 'bg-blue-400/70' : 'bg-orange-400/70'
                            } -translate-x-[0.5px]`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bottom Phrase Badge / Micro Notch */}
                  <div className="pb-0.5 flex flex-col items-center select-none">
                    {bar.isMajorPhrase ? (
                      <div
                        className={`flex items-center gap-0.5 px-1 py-[1px] rounded-2xs border shadow-sm ${
                          currentDeck === 'A'
                            ? 'bg-blue-950/80 border-blue-500/60 text-blue-200'
                            : 'bg-orange-950/80 border-orange-500/60 text-orange-200'
                        }`}
                      >
                        <span className="font-mono text-[6px] font-extrabold leading-none">
                          P{Math.floor(bar.barIndex / 4) + 1}
                        </span>
                      </div>
                    ) : (
                      <div
                        className={`w-[1.5px] h-2 rounded-full ${
                          currentDeck === 'A' ? 'bg-blue-400/80' : 'bg-orange-400/80'
                        }`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 2b. High-Resolution Audio Waveform Display with Pinch Scaling */}
        <div className="absolute inset-0 px-2 flex items-center justify-between gap-[1.5px] pointer-events-none z-0 overflow-hidden">
          {highDensityBars.map((heightPct, idx, arr) => {
            const barAbsRatio = idx / (arr.length - 1);

            // Filter bars visible inside current zoom window
            if (barAbsRatio < windowStart - 0.05 || barAbsRatio > windowEnd + 0.05) {
              return null;
            }

            const barRelInWindow = (barAbsRatio - windowStart) / windowSpan;
            const isPassed = barAbsRatio <= progress;

            return (
              <div
                key={idx}
                className="absolute flex flex-col items-center justify-center h-full pointer-events-none -translate-x-1/2"
                style={{ left: `${barRelInWindow * 100}%` }}
              >
                <div
                  className={`w-[2.5px] rounded-full transition-colors duration-75 ${
                    isPassed
                      ? 'bg-zinc-100 shadow-[0_0_6px_rgba(255,255,255,0.4)]'
                      : 'bg-zinc-800/80 hover:bg-zinc-700'
                  }`}
                  style={{
                    height: `${Math.max(14, heightPct * 0.72)}%`,
                    width: `${Math.max(2, Math.min(5, zoomLevel * 1.2))}px`,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Live Bar Structure & Millisecond Precision HUD */}
      <div className="flex items-center justify-between px-1">
        {/* Left: 4-Bar Phrase Matrix & Beat-Pulse LED HUD (Nothing Aesthetic) */}
        <div className="flex items-center gap-2 font-mono text-[9px]">
          {/* 4-Bar Phrase Segment Visualizer */}
          <div className="flex items-center gap-1 bg-[#101014] px-1.5 py-0.5 rounded border border-zinc-800/90 shadow-xs">
            <span className="text-[7.5px] text-zinc-500 font-mono font-bold tracking-wider">PHRASE</span>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4].map((pBar) => {
                const isCurrentPhraseBar = pBar === currentPhraseBar;
                return (
                  <div
                    key={pBar}
                    className={`px-1 py-[0.5px] rounded-xs text-[7px] font-mono font-bold transition-all duration-75 ${
                      isCurrentPhraseBar
                        ? 'bg-rose-500 text-white shadow-[0_0_6px_rgba(244,63,94,0.85)]'
                        : 'bg-zinc-800/80 text-zinc-500'
                    }`}
                    title={`Takt ${pBar} der aktuellen 4-Bar Phrase`}
                  >
                    {pBar}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4-Beat Rhythmic LED Pulse */}
          <div className="flex items-center gap-0.5 bg-[#101014] px-1.5 py-0.5 rounded border border-zinc-800/90">
            {Array.from({ length: 4 }).map((_, bIdx) => {
              const isBeatHit = bIdx + 1 === currentBeatInBar;
              const isDownbeat = bIdx === 0;
              return (
                <span
                  key={bIdx}
                  className={`w-1.5 h-1.5 rounded-full transition-colors duration-75 ${
                    isBeatHit
                      ? isDownbeat
                        ? 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.95)]'
                        : 'bg-zinc-100 shadow-[0_0_4px_rgba(255,255,255,0.8)]'
                      : 'bg-zinc-800'
                  }`}
                  title={`Beat ${bIdx + 1}`}
                />
              );
            })}
          </div>

          {/* Bar & Phrase Counter Readout */}
          <div className="flex items-center gap-1 text-zinc-400">
            <span className="text-zinc-200 font-bold">
              BAR {currentBar}.{currentBeatInBar}
            </span>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-500">{totalTrackBars}</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400 text-[8px]">
              P{currentPhraseIndex}
            </span>
          </div>
        </div>

        {/* Right: High-Precision Time Display (mm:ss.ms) for Exact Cueing */}
        <div className="flex items-center gap-1.5 font-mono text-[9px] text-zinc-400">
          <span className="text-zinc-200 font-bold bg-[#101014] px-1.5 py-0.5 rounded border border-zinc-800">
            {formatPrecisionTime(playbackPosition)}
          </span>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-500">
            {formatPrecisionTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
};
