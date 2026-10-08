import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StemData, BankData, PadBankId, StemId, PadConfig, TrackData } from '../../types';
import { GlyphTimeline } from '../GlyphTimeline';
import {
  Repeat,
  Headphones,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  MoreVertical,
  Columns,
  RotateCcw,
  Circle,
  Sliders,
  Zap,
  Check,
  Activity,
  Sparkles,
  SlidersHorizontal,
  ArrowLeftRight,
} from 'lucide-react';
import { shiftMusicalKey } from '../../utils/harmonicKeys';
import { triggerHaptic } from '../../utils/haptics';
import { audioEngine } from '../../services/audioEngine';

interface AutomationNode {
  t: number; // 0 to 1 normalized across 4 beats
  v: number;
}

interface StemAutomationData {
  volume: Record<StemId, AutomationNode[]>;
  filter: Record<StemId, AutomationNode[]>;
}

interface StemsScreenProps {
  stems: StemData[];
  onToggleMute: (stemId: StemId) => void;
  onToggleSolo: (stemId: StemId) => void;
  onVolumeChange?: (stemId: StemId, vol: number) => void;
  onFilterChange?: (stemId: StemId, filter: number) => void;
  onSendChange?: (stemId: StemId, send: number) => void;
  onOpenStemEdit: (stemId: StemId) => void;
  playbackPosition: number;
  duration: number;
  onSeek: (seconds: number) => void;
  activeBankId: PadBankId;
  banks: BankData;
  onTriggerPad?: (bankId: PadBankId, pad: PadConfig) => void;
  onSelectBank?: (bankId: PadBankId) => void;
  onUpdateBankMode?: (bankId: PadBankId, mode: any) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  isLooping: boolean;
  onToggleLoop: () => void;
  isCueActive: boolean;
  onToggleCue: () => void;
  waveformBars?: number[];
  hardwareMode?: boolean;
  bpm?: number;
  cuePosition?: number;
  onSetCuePoint?: (seconds: number) => void;
  isSyncLocked?: boolean;
  onToggleSync?: () => void;
  onSwapDecks?: () => void;
  secondTrackBpm?: number;
  secondTrackTitle?: string;
  isQuantizeActive?: boolean;
  onToggleQuantize?: () => void;
  isKeyLockActive?: boolean;
  onToggleKeyLock?: () => void;
  trackKey?: string;
  keyShift?: number;
  onUpdateKeyShift?: (semitones: number) => void;
  secondTrackKey?: string;
  onBeatJump?: (beats: number) => void;
  deckBPosition?: number;
  onNudgeDeckB?: (direction: -1 | 1) => void;
  masterDeck?: 'A' | 'B';
  onSelectMasterDeck?: (deck: 'A' | 'B') => void;
  loadedTrack?: TrackData;
  secondTrack?: TrackData;
  secondTrackDuration?: number;
  secondTrackWaveformBars?: number[];
  onSeekDeckB?: (seconds: number) => void;
  deckBStems?: StemData[];
  onToggleMuteDeckB?: (stemId: StemId) => void;
  onToggleSoloDeckB?: (stemId: StemId) => void;
  onVolumeChangeDeckB?: (stemId: StemId, vol: number) => void;
  onFilterChangeDeckB?: (stemId: StemId, filter: number) => void;
  onSendChangeDeckB?: (stemId: StemId, send: number) => void;
  onBassSwap?: () => void;
  onDrumsSwap?: () => void;
  onResetStems?: () => void;
  isPerformanceView?: boolean;
  showBeatGridOverlay?: boolean;
  onToggleBeatGridOverlay?: () => void;
}

export const StemsScreen: React.FC<StemsScreenProps> = ({
  stems,
  onToggleMute,
  onToggleSolo,
  onVolumeChange,
  onFilterChange,
  onSendChange,
  onOpenStemEdit,
  playbackPosition,
  duration,
  onSeek,
  banks,
  activeBankId,
  onTriggerPad,
  isPlaying,
  onTogglePlay,
  onPrev,
  onNext,
  isLooping,
  onToggleLoop,
  isCueActive,
  onToggleCue,
  waveformBars,
  bpm = 128,
  cuePosition,
  onSetCuePoint,
  trackKey = '8A',
  keyShift = 0,
  loadedTrack,
  secondTrack,
  masterDeck = 'A',
  onSelectMasterDeck,
  onBassSwap,
  onDrumsSwap,
  isSyncLocked = false,
  onToggleSync,
  secondTrackBpm = 125,
  secondTrackTitle,
  deckBPosition = 0,
  onNudgeDeckB,
  onBeatJump,
  secondTrackDuration = 240,
  secondTrackWaveformBars,
  onSeekDeckB,
  isPerformanceView = false,
  showBeatGridOverlay = true,
  onToggleBeatGridOverlay,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [pressedPadId, setPressedPadId] = useState<number | null>(null);
  const [deckViewMode, setDeckViewMode] = useState<'DECK_A' | 'DECK_B' | 'DUAL'>(
    isPerformanceView ? 'DUAL' : 'DECK_A'
  );

  // 4-Beat Automation Engine State
  const [isAutomationRecording, setIsAutomationRecording] = useState<boolean>(false);
  const [isAutomationPlaying, setIsAutomationPlaying] = useState<boolean>(false);
  const [recStartPos, setRecStartPos] = useState<number>(0);
  const [automationProgress, setAutomationProgress] = useState<number>(0);
  const [showFilterSliders, setShowFilterSliders] = useState<boolean>(false);

  // Quick-Swap Mode & Deck Channel Mapping State
  const [quickSwapMode, setQuickSwapMode] = useState<boolean>(false);
  const [quickSwapPendingStem, setQuickSwapPendingStem] = useState<StemId | null>(null);
  const [stemDeckMap, setStemDeckMap] = useState<Record<StemId, 'A' | 'B'>>({
    drums: 'A',
    bass: 'A',
    music: 'A',
    vocal: 'A',
  });
  const [quickSwapFlash, setQuickSwapFlash] = useState<StemId | null>(null);
  const lastHeaderTapRef = useRef<{ stemId: StemId; time: number } | null>(null);

  // Granular 3-Band (Low, Mid, High) EQ State per individual stem channel
  const [show3BandEq, setShow3BandEq] = useState<boolean>(false);
  const [stemEqMap, setStemEqMap] = useState<Record<StemId, { low: number; mid: number; high: number }>>(() => {
    const map: Record<StemId, { low: number; mid: number; high: number }> = {
      drums: { low: 0, mid: 0, high: 0 },
      bass: { low: 0, mid: 0, high: 0 },
      music: { low: 0, mid: 0, high: 0 },
      vocal: { low: 0, mid: 0, high: 0 },
    };
    stems.forEach((s) => {
      map[s.id] = { low: s.eq?.low ?? 0, mid: s.eq?.mid ?? 0, high: s.eq?.high ?? 0 };
    });
    return map;
  });

  const handleStemEqChange = (stemId: StemId, band: 'low' | 'mid' | 'high', val: number) => {
    setStemEqMap((prev) => {
      const current = prev[stemId] || { low: 0, mid: 0, high: 0 };
      const updated = { ...current, [band]: Math.round(val * 10) / 10 };
      audioEngine.setStemEQ(stemId, updated);
      return { ...prev, [stemId]: updated };
    });
  };

  const handleResetStemEqBand = (stemId: StemId, band: 'low' | 'mid' | 'high') => {
    triggerHaptic('tap');
    handleStemEqChange(stemId, band, 0);
  };

  // Quick-Swap Header Tap Handler (Dual simultaneous tap or Quick-swap toggle)
  const handleStemHeaderTap = (stemId: StemId) => {
    const now = performance.now();
    const last = lastHeaderTapRef.current;

    // Check if dual simultaneous tap occurred within 450ms or quick-swap mode active
    if (quickSwapMode || (last && last.stemId !== stemId && now - last.time < 450)) {
      const firstStem = quickSwapPendingStem || (last && last.stemId !== stemId ? last.stemId : null);

      if (firstStem && firstStem !== stemId) {
        // Instant Cross-Deck Quick-Swap execution!
        triggerHaptic('double');
        setStemDeckMap((prev) => {
          const next = { ...prev };
          const deckForFirst = prev[firstStem] === 'A' ? 'B' : 'A';
          const deckForSecond = prev[stemId] === 'A' ? 'B' : 'A';
          next[firstStem] = deckForFirst;
          next[stemId] = deckForSecond;
          return next;
        });

        // Trigger deck audio swap routes
        if (firstStem === 'bass' || stemId === 'bass') onBassSwap?.();
        if (firstStem === 'drums' || stemId === 'drums') onDrumsSwap?.();

        setQuickSwapFlash(stemId);
        setTimeout(() => setQuickSwapFlash(null), 800);
        setQuickSwapPendingStem(null);
        lastHeaderTapRef.current = null;
        return;
      } else {
        triggerHaptic('tap');
        setQuickSwapPendingStem(stemId);
        lastHeaderTapRef.current = { stemId, time: now };
        return;
      }
    }

    lastHeaderTapRef.current = { stemId, time: now };
    onOpenStemEdit(stemId);
  };

  const [automationData, setAutomationData] = useState<StemAutomationData>({
    volume: { drums: [], bass: [], music: [], vocal: [] },
    filter: { drums: [], bass: [], music: [], vocal: [] },
  });

  const fourBeatsDuration = (60 / Math.max(30, bpm || 128)) * 4;

  // Track playback position to record and loop automation
  useEffect(() => {
    if (isAutomationRecording) {
      const elapsed = playbackPosition - recStartPos;
      const prog = Math.min(1, Math.max(0, elapsed / fourBeatsDuration));
      setAutomationProgress(prog);

      if (prog >= 1.0) {
        // 4 beats completed! Switch automatically to loop playback
        setIsAutomationRecording(false);
        setIsAutomationPlaying(true);
        triggerHaptic('double');
      }
    } else if (isAutomationPlaying) {
      const cyclePos = ((playbackPosition % fourBeatsDuration) + fourBeatsDuration) % fourBeatsDuration;
      const prog = cyclePos / fourBeatsDuration;
      setAutomationProgress(prog);

      // Interpolate and apply automation values to stems
      (['drums', 'bass', 'music', 'vocal'] as StemId[]).forEach((sId) => {
        const volNodes = automationData.volume[sId];
        if (volNodes && volNodes.length > 1) {
          // Find closest node
          const closest = volNodes.reduce((prev, curr) =>
            Math.abs(curr.t - prog) < Math.abs(prev.t - prog) ? curr : prev
          );
          if (closest) {
            onVolumeChange?.(sId, closest.v);
            audioEngine.setStemVolume(sId, closest.v);
          }
        }

        const fltNodes = automationData.filter[sId];
        if (fltNodes && fltNodes.length > 1) {
          const closest = fltNodes.reduce((prev, curr) =>
            Math.abs(curr.t - prog) < Math.abs(prev.t - prog) ? curr : prev
          );
          if (closest) {
            onFilterChange?.(sId, closest.v);
            audioEngine.setStemFilter(sId, closest.v);
          }
        }
      });
    }
  }, [
    playbackPosition,
    isAutomationRecording,
    isAutomationPlaying,
    recStartPos,
    fourBeatsDuration,
    automationData,
    onVolumeChange,
    onFilterChange,
  ]);

  const handleStartAutomationRec = () => {
    triggerHaptic('cue');
    setRecStartPos(playbackPosition);
    setIsAutomationRecording(true);
    setIsAutomationPlaying(false);
    setAutomationProgress(0);
    // Clear previous motion
    setAutomationData({
      volume: { drums: [], bass: [], music: [], vocal: [] },
      filter: { drums: [], bass: [], music: [], vocal: [] },
    });
  };

  const handleToggleAutomationPlay = () => {
    triggerHaptic('tap');
    setIsAutomationRecording(false);
    setIsAutomationPlaying(!isAutomationPlaying);
  };

  const handleClearAutomation = () => {
    triggerHaptic('tap');
    setIsAutomationRecording(false);
    setIsAutomationPlaying(false);
    setAutomationProgress(0);
    setAutomationData({
      volume: { drums: [], bass: [], music: [], vocal: [] },
      filter: { drums: [], bass: [], music: [], vocal: [] },
    });
  };

  // Helper when user modifies volume slider
  const handleStemVolumeAdjust = (stemId: StemId, val: number) => {
    onVolumeChange?.(stemId, val);
    if (isAutomationRecording) {
      setAutomationData((prev) => ({
        ...prev,
        volume: {
          ...prev.volume,
          [stemId]: [...(prev.volume[stemId] || []), { t: automationProgress, v: val }],
        },
      }));
    }
  };

  // Helper when user modifies filter slider
  const handleStemFilterAdjust = (stemId: StemId, val: number) => {
    onFilterChange?.(stemId, val);
    audioEngine.setStemFilter(stemId, val);
    if (isAutomationRecording) {
      setAutomationData((prev) => ({
        ...prev,
        filter: {
          ...prev.filter,
          [stemId]: [...(prev.filter[stemId] || []), { t: automationProgress, v: val }],
        },
      }));
    }
  };

  const hasAnyAutomation = (['drums', 'bass', 'music', 'vocal'] as StemId[]).some(
    (sId) => automationData.volume[sId].length > 0 || automationData.filter[sId].length > 0
  );

  const keyInfo = shiftMusicalKey(trackKey || '8A', keyShift);
  const hotCues = banks.A?.pads?.filter((p) => p.type === 'cue') || [];

  const formatTime = (sec: number): string => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handlePadPress = (pad: PadConfig) => {
    setPressedPadId(pad.id);
    onTriggerPad?.(activeBankId, pad);
  };

  const handlePadRelease = () => {
    setPressedPadId(null);
  };

  const padColors = [
    '#f97316', // orange
    '#10b981', // green
    '#06b6d4', // cyan
    '#3b82f6', // blue
    '#a855f7', // purple
    '#ec4899', // pink
    '#e2e8f0', // white
    '#64748b', // slate
  ];

  const currentPads = banks[activeBankId]?.pads || [];

  return (
    <div className="flex-1 flex flex-col justify-between px-3 py-1 sm:py-2 w-full max-w-lg mx-auto overflow-hidden h-full select-none">
      {/* 1. Track Info Header (Lost Control (Original Mix) • 128.0  8A  02:34 / 04:12) */}
      <div className="flex flex-col gap-0.5 shrink-0 px-1 pt-0.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-tech font-bold text-sm tracking-tight text-white truncate">
              {loadedTrack?.title || 'Lost Control (Original Mix)'}
            </span>
            {/* Deck View & Dual Beatgrid Waveform Selector */}
            <div className="flex items-center gap-0.5 bg-black/60 p-0.5 rounded-lg border border-zinc-800 shrink-0">
              <button
                onClick={() => setDeckViewMode('DECK_A')}
                className={`px-1.5 py-0.5 rounded font-mono text-[7.5px] font-bold transition active:scale-95 ${
                  deckViewMode === 'DECK_A'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                DECK A
              </button>
              <button
                onClick={() => setDeckViewMode('DECK_B')}
                className={`px-1.5 py-0.5 rounded font-mono text-[7.5px] font-bold transition active:scale-95 ${
                  deckViewMode === 'DECK_B'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                DECK B
              </button>
              <button
                onClick={() => setDeckViewMode('DUAL')}
                className={`px-1.5 py-0.5 rounded font-mono text-[7.5px] font-bold transition flex items-center gap-1 active:scale-95 ${
                  deckViewMode === 'DUAL'
                    ? 'bg-zinc-100 text-zinc-950 font-extrabold shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Traktor Kontrol D2 Dual-Waveform View: Deck A & Deck B Beatgrids gleichzeitig vergleichen"
              >
                <Columns className="w-2.5 h-2.5" />
                <span>DUAL D2</span>
              </button>
            </div>
          </div>
          <button
            onClick={() => onOpenStemEdit('drums')}
            className="text-zinc-500 hover:text-zinc-300 p-0.5 transition"
            title="Stem Feinabstimmung & EQ"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-[9px] text-zinc-400">
            <span className="font-bold text-zinc-200">{bpm.toFixed(1)}</span>
            <span className="text-zinc-600">•</span>
            <span className="font-bold text-zinc-300">{keyInfo.shiftedKey}</span>
            <span className="text-zinc-600">•</span>
            <span>
              {formatTime(playbackPosition)} / {formatTime(duration)}
            </span>
          </div>

          {/* Quick Bass & Drums Swap Controls */}
          {(onBassSwap || onDrumsSwap) && (
            <div className="flex items-center gap-1">
              {onBassSwap && (
                <button
                  onClick={onBassSwap}
                  className="text-[7.5px] font-mono px-1.5 py-0.2 rounded bg-sky-950/70 border border-sky-500/40 text-sky-300 hover:text-white transition active:scale-95"
                  title="Bass Swap mit zweitem Deck"
                >
                  ⇄ BASS
                </button>
              )}
              {onDrumsSwap && (
                <button
                  onClick={onDrumsSwap}
                  className="text-[7.5px] font-mono px-1.5 py-0.2 rounded bg-purple-950/70 border border-purple-500/40 text-purple-300 hover:text-white transition active:scale-95"
                  title="Drums Swap mit zweitem Deck"
                >
                  ⇄ DRUMS
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Waveform Display with Visual Beat-Grid, Measure Boundaries & Manual Beatmatch HUD */}
      <div className="w-full shrink-0 my-1">
        {deckViewMode === 'DECK_A' && (
          <GlyphTimeline
            deckId="A"
            deckTitle={loadedTrack?.title || 'Deck A'}
            playbackPosition={playbackPosition}
            duration={duration}
            onSeek={onSeek}
            bars={waveformBars}
            bpm={bpm}
            cuePosition={cuePosition}
            onSetCuePoint={onSetCuePoint}
            hotCues={hotCues}
            zoomLevel={zoomLevel}
            onZoomChange={setZoomLevel}
            masterDeck={masterDeck}
            variant="standard"
            isPlaying={isPlaying}
            isSyncLocked={isSyncLocked}
            onToggleSync={onToggleSync}
            referenceBpm={secondTrackBpm}
            referencePlaybackPosition={deckBPosition}
            referenceDeckId="B"
            referenceDeckTitle={secondTrackTitle || secondTrack?.title || 'Deck B'}
            onNudge={onNudgeDeckB}
            onBeatJump={onBeatJump}
            showBeatGrid={showBeatGridOverlay}
          />
        )}

        {deckViewMode === 'DECK_B' && (
          <GlyphTimeline
            deckId="B"
            deckTitle={secondTrack?.title || secondTrackTitle || 'Deck B'}
            playbackPosition={deckBPosition}
            duration={secondTrackDuration}
            onSeek={onSeekDeckB || (() => {})}
            bars={secondTrackWaveformBars || waveformBars}
            bpm={secondTrackBpm}
            cuePosition={cuePosition}
            onSetCuePoint={onSetCuePoint}
            zoomLevel={zoomLevel}
            onZoomChange={setZoomLevel}
            masterDeck={masterDeck}
            variant="standard"
            isPlaying={isPlaying}
            isSyncLocked={isSyncLocked}
            onToggleSync={onToggleSync}
            referenceBpm={bpm}
            referencePlaybackPosition={playbackPosition}
            referenceDeckId="A"
            referenceDeckTitle={loadedTrack?.title || 'Deck A'}
            onNudge={onNudgeDeckB}
            onBeatJump={onBeatJump}
            showBeatGrid={showBeatGridOverlay}
          />
        )}

        {deckViewMode === 'DUAL' && (
          <div className="flex flex-col gap-1.5">
            {/* Deck A Waveform */}
            <GlyphTimeline
              deckId="A"
              deckTitle={loadedTrack?.title || 'Deck A'}
              playbackPosition={playbackPosition}
              duration={duration}
              onSeek={onSeek}
              bars={waveformBars}
              bpm={bpm}
              cuePosition={cuePosition}
              onSetCuePoint={onSetCuePoint}
              hotCues={hotCues}
              zoomLevel={zoomLevel}
              onZoomChange={setZoomLevel}
              masterDeck={masterDeck}
              variant="compact"
              isPlaying={isPlaying}
              isSyncLocked={isSyncLocked}
              onToggleSync={onToggleSync}
              referenceBpm={secondTrackBpm}
              referencePlaybackPosition={deckBPosition}
              referenceDeckId="B"
              referenceDeckTitle={secondTrackTitle || secondTrack?.title || 'Deck B'}
              onNudge={onNudgeDeckB}
              onBeatJump={onBeatJump}
              showBeatGrid={showBeatGridOverlay}
            />

            {/* Deck B Waveform */}
            <GlyphTimeline
              deckId="B"
              deckTitle={secondTrack?.title || secondTrackTitle || 'Deck B'}
              playbackPosition={deckBPosition}
              duration={secondTrackDuration}
              onSeek={onSeekDeckB || (() => {})}
              bars={secondTrackWaveformBars || waveformBars}
              bpm={secondTrackBpm}
              cuePosition={cuePosition}
              onSetCuePoint={onSetCuePoint}
              zoomLevel={zoomLevel}
              onZoomChange={setZoomLevel}
              masterDeck={masterDeck}
              variant="compact"
              isPlaying={isPlaying}
              isSyncLocked={isSyncLocked}
              onToggleSync={onToggleSync}
              referenceBpm={bpm}
              referencePlaybackPosition={playbackPosition}
              referenceDeckId="A"
              referenceDeckTitle={loadedTrack?.title || 'Deck A'}
              onNudge={onNudgeDeckB}
              onBeatJump={onBeatJump}
              showBeatGrid={showBeatGridOverlay}
            />
          </div>
        )}
      </div>

      {/* 2b. 4-Beat Stem Filter & Volume Automation Bar */}
      <div className="flex items-center justify-between px-2 py-1 bg-[#0d0d12] border border-zinc-800 rounded-xl my-1 shrink-0">
        <div className="flex items-center gap-1.5 font-mono text-[8px] font-bold">
          <Activity className="w-3 h-3 text-cyan-400" />
          <span className="text-zinc-200">4-BEAT MOTION AUTOMATION</span>
          {isAutomationRecording ? (
            <span className="px-1.5 py-0.2 rounded bg-rose-500 text-white animate-pulse font-black text-[7.5px] flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              <span>REC ({(automationProgress * 4).toFixed(1)}/4 BEATS)</span>
            </span>
          ) : isAutomationPlaying ? (
            <span className="px-1.5 py-0.2 rounded bg-emerald-500/25 border border-emerald-500/60 text-emerald-300 font-black text-[7.5px] flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>LOOPING ({(automationProgress * 4).toFixed(1)}/4)</span>
            </span>
          ) : hasAnyAutomation ? (
            <span className="px-1 py-0.2 rounded bg-zinc-800 text-zinc-400 text-[7px]">
              DATA READY
            </span>
          ) : (
            <span className="text-zinc-500 text-[7.5px]">STANDBY</span>
          )}
        </div>

        {/* 4-Beat Progress Bar */}
        <div className="flex-1 max-w-[120px] mx-2 h-1.5 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden relative">
          <div
            className={`h-full transition-all duration-75 ${
              isAutomationRecording
                ? 'bg-rose-500'
                : isAutomationPlaying
                ? 'bg-emerald-400'
                : 'bg-zinc-700'
            }`}
            style={{ width: `${automationProgress * 100}%` }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {/* Record Button */}
          <button
            onClick={handleStartAutomationRec}
            className={`px-2 py-0.5 rounded font-mono text-[7.5px] font-bold border flex items-center gap-1 transition active:scale-95 ${
              isAutomationRecording
                ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                : 'bg-zinc-900 text-rose-400 border-zinc-800 hover:text-white'
            }`}
            title="4-Beat Automation aufnehmen: Bewege Stem-Volume oder Filter"
          >
            <Circle className={`w-2 h-2 ${isAutomationRecording ? 'fill-white' : 'fill-rose-500'}`} />
            <span>{isAutomationRecording ? 'REC 4B' : 'REC'}</span>
          </button>

          {/* Loop Playback Toggle */}
          <button
            onClick={handleToggleAutomationPlay}
            disabled={!hasAnyAutomation && !isAutomationRecording}
            className={`px-2 py-0.5 rounded font-mono text-[7.5px] font-bold border flex items-center gap-1 transition active:scale-95 ${
              isAutomationPlaying
                ? 'bg-emerald-500 text-zinc-950 font-black border-emerald-400'
                : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:text-white disabled:opacity-40'
            }`}
            title="Aufgenommene 4-Beat Automation abspielen / loopen"
          >
            <Play className={`w-2 h-2 ${isAutomationPlaying ? 'fill-zinc-950' : ''}`} />
            <span>PLAY</span>
          </button>

          {/* Quick-Swap Mode Toggle */}
          <button
            onClick={() => {
              triggerHaptic('tap');
              setQuickSwapMode(!quickSwapMode);
              if (quickSwapMode) setQuickSwapPendingStem(null);
            }}
            className={`px-2 py-0.5 rounded font-mono text-[7.5px] font-bold border flex items-center gap-1 transition active:scale-95 ${
              quickSwapMode
                ? 'bg-amber-500 text-zinc-950 font-black border-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-pulse'
                : 'bg-zinc-900 text-amber-400 border-zinc-800 hover:text-white'
            }`}
            title="Quick-Swap Modus: Tippe auf 2 Stems gleichzeitig zum Tauschen des Deck-Audio-Routings"
          >
            <ArrowLeftRight className="w-2.5 h-2.5" />
            <span>{quickSwapMode ? 'QUICK-SWAP ON' : 'QUICK-SWAP'}</span>
          </button>

          {/* 3-Band EQ Granular Sliders Toggle */}
          <button
            onClick={() => {
              triggerHaptic('tap');
              setShow3BandEq(!show3BandEq);
            }}
            className={`px-2 py-0.5 rounded font-mono text-[7.5px] font-bold border flex items-center gap-1 transition active:scale-95 ${
              show3BandEq
                ? 'bg-purple-500/30 border-purple-400 text-purple-200 shadow-sm'
                : 'bg-zinc-900 border-zinc-800 text-purple-400 hover:text-white'
            }`}
            title="Granulare 3-Band (Low, Mid, High) EQ-Slider pro Stem anzeigen"
          >
            <SlidersHorizontal className="w-2.5 h-2.5" />
            <span>3-BAND EQ</span>
          </button>

          {/* Filter Sliders Toggle */}
          <button
            onClick={() => {
              triggerHaptic('tap');
              setShowFilterSliders(!showFilterSliders);
            }}
            className={`p-1 rounded font-mono text-[7.5px] border transition active:scale-95 ${
              showFilterSliders
                ? 'bg-cyan-500/25 border-cyan-500/60 text-cyan-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
            title="Filter-Slider für Automation einblenden"
          >
            <Sliders className="w-2.5 h-2.5" />
          </button>

          {/* Clear Automation */}
          {hasAnyAutomation && (
            <button
              onClick={handleClearAutomation}
              className="p-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-rose-400 active:scale-95 transition"
              title="Automation löschen"
            >
              <RotateCcw className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. 4 Horizontal Stem Rows (DRUMS, BASS, MUSIC, VOCAL) */}
      <div className="flex flex-col gap-1.5 shrink-0 my-1">
        {stems.map((stem) => {
          const isMuted = stem.mute;
          const isSolo = stem.solo;
          const volPct = Math.round(stem.volume * 100);
          const hasVolAuto = automationData.volume[stem.id]?.length > 0;
          const hasFltAuto = automationData.filter[stem.id]?.length > 0;
          const assignedDeck = stemDeckMap[stem.id] || 'A';
          const isPendingSwap = quickSwapPendingStem === stem.id;
          const isFlashingSwap = quickSwapFlash === stem.id;

          return (
            <div
              key={stem.id}
              className={`flex flex-col gap-1 px-2.5 py-1.5 rounded-xl bg-[#121217] border transition-all ${
                isFlashingSwap
                  ? 'border-white bg-white/20 shadow-[0_0_16px_rgba(255,255,255,0.8)] scale-[1.01]'
                  : isPendingSwap
                  ? 'border-amber-400 bg-amber-950/40 shadow-[0_0_12px_rgba(245,158,11,0.5)] animate-pulse'
                  : isSolo
                  ? 'border-amber-400/60 bg-amber-950/20 shadow-[0_0_8px_rgba(251,191,36,0.2)]'
                  : isMuted
                  ? 'border-zinc-900 opacity-60'
                  : 'border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-2">
                {/* Stem Name Pill Badge with Quick-Swap Deck Routing */}
                <button
                  onClick={() => handleStemHeaderTap(stem.id)}
                  className={`w-20 sm:w-22 py-1 px-1.5 rounded-lg font-mono text-[9px] font-black uppercase tracking-wider text-left transition hover:opacity-90 active:scale-95 shrink-0 flex items-center justify-between border ${
                    isPendingSwap
                      ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-black'
                      : ''
                  }`}
                  style={{
                    backgroundColor: `${stem.accentColor}25`,
                    color: stem.accentColor,
                    borderColor: `${stem.accentColor}60`,
                  }}
                  title={
                    quickSwapMode
                      ? `Quick-Swap: Tippe auf einen 2. Stem zum Tauschen`
                      : `${stem.name} bearbeiten (Doppeltap für Quick-Swap Deck ${assignedDeck})`
                  }
                >
                  <span className="truncate">{stem.name}</span>
                  <div className="flex items-center gap-0.5">
                    {/* Cross-Deck Routing Tag */}
                    <span
                      className={`text-[7px] font-mono font-black px-1 rounded ${
                        assignedDeck === 'B'
                          ? 'bg-cyan-500 text-zinc-950 shadow-[0_0_6px_rgba(6,182,212,0.8)]'
                          : 'bg-zinc-800/90 text-zinc-300'
                      }`}
                    >
                      D{assignedDeck}
                    </span>
                    {(hasVolAuto || hasFltAuto) && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    )}
                  </div>
                </button>

                {/* Volume Slider with Level Fill */}
                <div className="flex-1 relative flex items-center h-4 group min-w-[60px]">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={stem.volume}
                    onChange={(e) => handleStemVolumeAdjust(stem.id, parseFloat(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer overflow-hidden accent-white"
                    style={{
                      background: `linear-gradient(to right, ${stem.accentColor} ${volPct}%, #27272a ${volPct}%)`,
                    }}
                    title={`${stem.name} Lautstärke: ${volPct}%`}
                  />
                </div>

                {/* Percentage Readout */}
                <span className="font-mono text-[10px] font-bold text-zinc-300 w-8 text-right shrink-0">
                  {volPct}%
                </span>

                {/* Mute Button */}
                <button
                  onClick={() => onToggleMute(stem.id)}
                  className={`w-7 h-7 rounded-lg font-mono text-[10.5px] font-extrabold transition active:scale-90 border shrink-0 ${
                    isMuted
                      ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                  title={`Mute ${stem.name}`}
                >
                  M
                </button>

                {/* Solo Button */}
                <button
                  onClick={() => onToggleSolo(stem.id)}
                  className={`w-7 h-7 rounded-lg font-mono text-[10.5px] font-extrabold transition active:scale-90 border shrink-0 ${
                    isSolo
                      ? 'bg-amber-400 text-zinc-950 border-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                  title={`Solo ${stem.name}`}
                >
                  S
                </button>
              </div>

              {/* Granular 3-Band (Low, Mid, High) EQ Sliders Row */}
              {show3BandEq && (
                <div className="flex flex-col gap-1 pt-1.5 px-1 border-t border-zinc-800/80 font-mono text-[7.5px] bg-black/40 rounded-lg p-1.5 mt-0.5 animate-fadeIn">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="font-bold text-purple-300 uppercase flex items-center gap-1">
                      <SlidersHorizontal className="w-2.5 h-2.5" />
                      <span>{stem.name} 3-BAND FREQUENCY EQ</span>
                    </span>
                    <button
                      onClick={() => {
                        triggerHaptic('tap');
                        handleStemEqChange(stem.id, 'low', 0);
                        handleStemEqChange(stem.id, 'mid', 0);
                        handleStemEqChange(stem.id, 'high', 0);
                      }}
                      className="text-zinc-500 hover:text-white px-1.5 py-0.2 rounded hover:bg-zinc-800 transition"
                      title="EQ auf 0.0 dB Flat zurücksetzen"
                    >
                      FLAT EQ (0 dB)
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-0.5">
                    {/* LOW BAND (100Hz) */}
                    <div className="flex flex-col gap-0.5">
                      <div className="flex justify-between items-center text-[7.5px]">
                        <span className="text-rose-400 font-bold">LOW (100Hz)</span>
                        <span
                          onClick={() => handleResetStemEqBand(stem.id, 'low')}
                          className="text-zinc-300 cursor-pointer hover:text-white font-mono"
                          title="Klick zum Zurücksetzen auf 0 dB"
                        >
                          {(stemEqMap[stem.id]?.low ?? 0) > 0 ? '+' : ''}
                          {(stemEqMap[stem.id]?.low ?? 0).toFixed(1)} dB
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-12"
                        max="12"
                        step="0.5"
                        value={stemEqMap[stem.id]?.low ?? 0}
                        onChange={(e) => handleStemEqChange(stem.id, 'low', parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-rose-500"
                      />
                    </div>

                    {/* MID BAND (1.2kHz) */}
                    <div className="flex flex-col gap-0.5">
                      <div className="flex justify-between items-center text-[7.5px]">
                        <span className="text-cyan-400 font-bold">MID (1.2kHz)</span>
                        <span
                          onClick={() => handleResetStemEqBand(stem.id, 'mid')}
                          className="text-zinc-300 cursor-pointer hover:text-white font-mono"
                          title="Klick zum Zurücksetzen auf 0 dB"
                        >
                          {(stemEqMap[stem.id]?.mid ?? 0) > 0 ? '+' : ''}
                          {(stemEqMap[stem.id]?.mid ?? 0).toFixed(1)} dB
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-12"
                        max="12"
                        step="0.5"
                        value={stemEqMap[stem.id]?.mid ?? 0}
                        onChange={(e) => handleStemEqChange(stem.id, 'mid', parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-cyan-400"
                      />
                    </div>

                    {/* HIGH BAND (8kHz) */}
                    <div className="flex flex-col gap-0.5">
                      <div className="flex justify-between items-center text-[7.5px]">
                        <span className="text-purple-400 font-bold">HIGH (8kHz)</span>
                        <span
                          onClick={() => handleResetStemEqBand(stem.id, 'high')}
                          className="text-zinc-300 cursor-pointer hover:text-white font-mono"
                          title="Klick zum Zurücksetzen auf 0 dB"
                        >
                          {(stemEqMap[stem.id]?.high ?? 0) > 0 ? '+' : ''}
                          {(stemEqMap[stem.id]?.high ?? 0).toFixed(1)} dB
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-12"
                        max="12"
                        step="0.5"
                        value={stemEqMap[stem.id]?.high ?? 0}
                        onChange={(e) => handleStemEqChange(stem.id, 'high', parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-purple-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Optional Stem Filter Slider Row */}
              {showFilterSliders && (
                <div className="flex items-center gap-2 pt-0.5 px-0.5 border-t border-zinc-800/60 font-mono text-[7.5px]">
                  <span className="text-zinc-500 w-12 font-bold uppercase">FILTER:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={stem.filter}
                    onChange={(e) => handleStemFilterAdjust(stem.id, parseFloat(e.target.value))}
                    className="flex-1 h-1 rounded-full appearance-none cursor-pointer bg-zinc-800 accent-cyan-400"
                    title={`${stem.name} Filter Cutoff: ${Math.round(stem.filter * 100)}%`}
                  />
                  <span className="text-zinc-400 w-8 text-right">
                    {stem.filter < 0.48 ? 'LPF' : stem.filter > 0.52 ? 'HPF' : 'OFF'}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 4. Bottom Half: 4x2 Performance Pads + Circular LOOP & CUE Buttons */}
      <div className="flex items-center gap-2.5 my-1 shrink-0">
        {/* 4x2 Pads Grid (8 Performance Pads) */}
        <div className="flex-1 grid grid-cols-4 grid-rows-2 gap-1.5 h-20 sm:h-22">
          {currentPads.slice(0, 8).map((pad, idx) => {
            const isPressed = pressedPadId === pad.id;
            const padBgColor = padColors[idx % padColors.length];

            return (
              <button
                key={pad.id}
                onPointerDown={() => handlePadPress(pad)}
                onPointerUp={handlePadRelease}
                onPointerLeave={handlePadRelease}
                className={`rounded-xl border transition-all active:scale-95 flex flex-col items-center justify-center p-1 font-mono select-none ${
                  isPressed
                    ? 'bg-white text-black shadow-[0_0_16px_rgba(255,255,255,0.9)] scale-95 border-white'
                    : 'shadow-xs hover:brightness-110'
                }`}
                style={
                  !isPressed
                    ? {
                        backgroundColor: `${padBgColor}30`,
                        borderColor: `${padBgColor}70`,
                        color: '#f4f4f5',
                        boxShadow: `0 0 8px ${padBgColor}25`,
                      }
                    : undefined
                }
              >
                <span className="text-[7px] opacity-60 font-bold self-start pl-0.5">{idx + 1}</span>
                <span className="text-[8.5px] font-bold uppercase truncate px-0.5">
                  {pad.label || `PAD ${idx + 1}`}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Side: Circular LOOP & CUE Buttons */}
        <div className="flex flex-col gap-1.5 shrink-0">
          {/* Circular LOOP Button */}
          <button
            onClick={onToggleLoop}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border flex flex-col items-center justify-center transition active:scale-90 font-mono text-[7px] font-bold ${
              isLooping
                ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.7)]'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
            title="Loop 4 Bars umschalten"
          >
            <Repeat className="w-3.5 h-3.5" />
            <span className="mt-0.5 font-extrabold">LOOP</span>
          </button>

          {/* Circular CUE Button */}
          <button
            onClick={onToggleCue}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border flex flex-col items-center justify-center transition active:scale-90 font-mono text-[7px] font-bold ${
              isCueActive
                ? 'bg-sky-500 text-zinc-950 border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.7)]'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
            title="CUE Punkt anspringen"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span className="mt-0.5 font-extrabold">CUE</span>
          </button>
        </div>
      </div>

      {/* 5. Minimalist Transport Bar: |<< , Large Play/Pause (>), >>| */}
      <div className="flex items-center justify-center gap-4 py-1 shrink-0">
        <button
          onClick={onPrev}
          className="w-12 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white active:scale-95 transition"
          title="Vorheriger Track / Cue"
        >
          <SkipBack className="w-4 h-4 fill-current" />
        </button>

        <button
          onClick={onTogglePlay}
          className={`w-16 h-11 sm:h-12 rounded-2xl flex items-center justify-center transition active:scale-95 shadow-md ${
            isPlaying
              ? 'bg-rose-500 text-white shadow-[0_0_16px_rgba(244,63,94,0.6)]'
              : 'bg-white text-zinc-950 hover:bg-zinc-200 shadow-[0_0_12px_rgba(255,255,255,0.3)]'
          }`}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
        </button>

        <button
          onClick={onNext}
          className="w-12 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white active:scale-95 transition"
          title="Nächster Track / Jump"
        >
          <SkipForward className="w-4 h-4 fill-current" />
        </button>
      </div>
    </div>
  );
};
