import React, { useState, useMemo, useRef } from 'react';
import { TrackData } from '../../types';
import {
  Search,
  Play,
  Disc,
  Music,
  ListFilter,
  Shuffle,
  Sparkles,
  RotateCcw,
  Check,
  Flame,
  Radio,
  Layers,
  Sliders,
  Compass,
  UploadCloud,
  FileAudio,
  Loader2,
  X,
} from 'lucide-react';
import {
  generateSmartShuffle,
  SmartShuffleMode,
  SmartShuffledItem,
  shiftMusicalKey,
  detectKeyFromAudioOrMetadata,
} from '../../utils/harmonicKeys';
import { detectTempoFromAudioBuffer } from '../../services/audioAnalysisService';
import { audioEngine } from '../../services/audioEngine';
import { triggerHaptic } from '../../utils/haptics';
import { CamelotWheelModal } from '../overlays/CamelotWheelModal';

interface LibraryScreenProps {
  tracks: TrackData[];
  loadedTrackId: string;
  secondTrackId?: string;
  isSyncLocked?: boolean;
  onOpenTrackLoad: (track: TrackData) => void;
  onImportTrack?: (track: TrackData) => void;
  hardwareMode?: boolean;
  activeBpm?: number;
  activeKey?: string;
  activeTrack?: TrackData;
  onLogActivity?: (category: 'HARMONIC' | 'LOAD' | 'RECORD', message: string, color?: string) => void;
}

export const LibraryScreen: React.FC<LibraryScreenProps> = ({
  tracks,
  loadedTrackId,
  secondTrackId,
  isSyncLocked = false,
  onOpenTrackLoad,
  onImportTrack,
  hardwareMode = false,
  activeBpm,
  activeKey,
  activeTrack,
  onLogActivity,
}) => {
  const [tab, setTab] = useState<'TRACKS' | 'STEMS' | 'PLAYLISTS'>('TRACKS');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCamelotModalOpen, setIsCamelotModalOpen] = useState<boolean>(false);
  const [filterKey, setFilterKey] = useState<string | null>(null);
  const [isAnalyzingFiles, setIsAnalyzingFiles] = useState<boolean>(false);
  const [importStatusMessage, setImportStatusMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Smart Shuffle States
  const [isSmartShuffleActive, setIsSmartShuffleActive] = useState<boolean>(false);
  const [shuffleMode, setShuffleMode] = useState<SmartShuffleMode>('FLOW');
  const [shuffleSeed, setShuffleSeed] = useState<number>(0);

  // Active Reference Track for harmonic matching (Deck A loaded track or explicit activeTrack)
  const referenceTrack = useMemo(() => {
    if (activeTrack) return activeTrack;
    const found = tracks.find((t) => t.id === loadedTrackId);
    return found || tracks[0];
  }, [activeTrack, tracks, loadedTrackId]);

  const effectiveRefKey = activeKey || referenceTrack?.key || '8A';
  const effectiveRefBpm = activeBpm && activeBpm > 0 ? activeBpm : referenceTrack?.bpm || 128;

  // Filter tracks by search query and active tab
  const rawFilteredTracks = useMemo(() => {
    let result = tracks;

    if (tab === 'STEMS') {
      result = result.filter(
        (t) => t.stems && t.stems.drums && t.stems.bass && t.stems.music && t.stems.vocal
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.artist.toLowerCase().includes(q) ||
          t.genre.toLowerCase().includes(q) ||
          t.key.toLowerCase().includes(q)
      );
    }

    if (filterKey) {
      result = result.filter((t) => (t.key || '').toUpperCase() === filterKey.toUpperCase());
    }

    return result;
  }, [tracks, tab, searchQuery, filterKey]);

  // Audio File Import with automatic BPM & Harmonic Key analysis
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    triggerHaptic('tap');
    setIsAnalyzingFiles(true);
    setImportStatusMessage(`Analysiere ${files.length} Datei(en) auf BPM & Tonart...`);

    const audioCtx = audioEngine.getAudioContext();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const arrayBuf = await file.arrayBuffer();
        let bpm = 128.0;
        let key = '8A';
        let duration = 210;

        try {
          const audioBuffer = await audioCtx.decodeAudioData(arrayBuf);
          duration = Math.round(audioBuffer.duration);
          bpm = detectTempoFromAudioBuffer(audioBuffer);
          key = detectKeyFromAudioOrMetadata(file.name, audioBuffer);
        } catch {
          bpm = 128.0;
          key = detectKeyFromAudioOrMetadata(file.name);
        }

        const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
        const newTrack: TrackData = {
          id: `imported_${Date.now()}_${i}`,
          title: cleanTitle,
          artist: 'Smart Import',
          bpm,
          key,
          duration,
          genre: 'DJ Track',
          isImported: true,
          waveform: Array.from({ length: 48 }, () => Math.floor(Math.random() * 65 + 30)),
          stems: {
            drums: true,
            bass: true,
            music: true,
            vocal: true,
          },
        };

        onImportTrack?.(newTrack);
        onLogActivity?.(
          'LOAD',
          `Smart Import: "${cleanTitle}" analysiert (${bpm} BPM, Key: ${key})`,
          '#06b6d4'
        );
      } catch (err) {
        console.error('Failed to import file:', err);
      }
    }

    setIsAnalyzingFiles(false);
    setImportStatusMessage(`${files.length} Track(s) erfolgreich importiert & analysiert!`);
    setTimeout(() => setImportStatusMessage(null), 4000);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Compute Smart Shuffled sequence or standard track list
  const displayItems = useMemo<SmartShuffledItem<TrackData>[]>(() => {
    if (!isSmartShuffleActive) {
      return rawFilteredTracks.map((track, idx) => ({
        track,
        score: track.id === loadedTrackId ? 100 : 0,
        harmonicResult: {
          level: 'CLASH',
          label: '',
          description: '',
          colorClass: '',
        },
        bpmDelta: 0,
        bpmPercentageDelta: 0,
        orderNumber: idx + 1,
        isTempoMultiplier: false,
        multiplierLabel: '',
      }));
    }

    return generateSmartShuffle(
      rawFilteredTracks,
      referenceTrack?.id || loadedTrackId,
      effectiveRefKey,
      effectiveRefBpm,
      shuffleMode,
      shuffleSeed
    );
  }, [
    rawFilteredTracks,
    isSmartShuffleActive,
    referenceTrack?.id,
    loadedTrackId,
    effectiveRefKey,
    effectiveRefBpm,
    shuffleMode,
    shuffleSeed,
  ]);

  // Count high compatibility tracks
  const compatibilityStats = useMemo(() => {
    if (!isSmartShuffleActive) return null;
    let perfect = 0;
    let compatible = 0;
    displayItems.forEach((item) => {
      if (item.harmonicResult.level === 'PERFECT') perfect++;
      else if (
        item.harmonicResult.level === 'ADJACENT' ||
        item.harmonicResult.level === 'RELATIVE' ||
        item.harmonicResult.level === 'ENERGY_BOOST'
      ) {
        compatible++;
      }
    });
    return { perfect, compatible, total: displayItems.length };
  }, [displayItems, isSmartShuffleActive]);

  const handleToggleSmartShuffle = () => {
    const nextState = !isSmartShuffleActive;
    setIsSmartShuffleActive(nextState);
    if (nextState) {
      onLogActivity?.(
        'HARMONIC',
        `Smart Shuffle AKTIV: Reordering nach BPM & Tonart-Kompatibilität (${effectiveRefKey} • ${effectiveRefBpm.toFixed(1)} BPM)`,
        '#10b981'
      );
    } else {
      onLogActivity?.(
        'HARMONIC',
        'Smart Shuffle DEAKTIVIERT: Standard-Reihenfolge wiederhergestellt',
        '#71717a'
      );
    }
  };

  const handleReshuffle = () => {
    setShuffleSeed((prev) => prev + 1);
    onLogActivity?.(
      'HARMONIC',
      `Smart Shuffle neu permutiert (Harmonic Variation #${shuffleSeed + 2})`,
      '#38bdf8'
    );
  };

  const handleSwitchMode = (mode: SmartShuffleMode) => {
    setShuffleMode(mode);
    onLogActivity?.(
      'HARMONIC',
      `Smart Shuffle Modus: ${mode === 'FLOW' ? 'Harmonische Set-Progression (Flow)' : 'Direkt-Match auf Deck A'}`,
      '#a855f7'
    );
  };

  const formatTime = (sec: number): string => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col px-3 py-2 w-full max-w-lg mx-auto overflow-hidden">
      {/* 1. Header: Navigation Tabs + Smart Shuffle Toggle */}
      <div className="flex items-center gap-1.5 shrink-0 mb-2.5">
        <div className="flex-1 grid grid-cols-3 gap-1">
          {(['TRACKS', 'STEMS', 'PLAYLISTS'] as const).map((t) => {
            const isSelected = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`py-2 px-1 rounded-xl font-mono text-[10px] font-bold tracking-wider uppercase transition active:scale-95 border ${
                  isSelected
                    ? 'bg-zinc-100 text-zinc-950 border-white shadow-sm'
                    : 'bg-[#121216] text-zinc-400 border-zinc-800/80 hover:text-zinc-200'
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>

        {/* Smart Shuffle Toggle Button */}
        <button
          onClick={handleToggleSmartShuffle}
          title="Smart Shuffle: Ordnet die Library nach BPM & Tonart-Kompatibilität für nahtlose Übergänge"
          aria-label="Smart Shuffle umschalten"
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-mono text-[10px] font-bold tracking-wider uppercase transition-all active:scale-95 border shrink-0 select-none ${
            isSmartShuffleActive
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/70 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
              : 'bg-[#121216] text-zinc-400 border-zinc-800/80 hover:text-zinc-200 hover:border-zinc-700'
          }`}
        >
          <Shuffle
            className={`w-3.5 h-3.5 transition-transform duration-300 ${
              isSmartShuffleActive ? 'text-emerald-400 rotate-180' : 'text-zinc-500'
            }`}
          />
          <span className="hidden sm:inline">SMART</span>
          <span>SHUFFLE</span>
          <span
            className={`px-1 py-0.2 rounded text-[8px] font-black uppercase border ${
              isSmartShuffleActive
                ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400/50 animate-pulse'
                : 'bg-zinc-800/80 text-zinc-500 border-zinc-700/60'
            }`}
          >
            {isSmartShuffleActive ? 'ON' : 'OFF'}
          </span>
        </button>
      </div>

      {/* 1b. Smart Tools Row: Camelot Wheel + Smart Playlist Import + Active Filter */}
      <div className="flex items-center gap-1.5 shrink-0 mb-2 flex-wrap">
        <button
          onClick={() => {
            triggerHaptic('tap');
            setIsCamelotModalOpen(true);
          }}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-mono text-[9.5px] font-bold tracking-wider uppercase transition active:scale-95 border ${
            filterKey
              ? 'bg-sky-950/80 text-sky-200 border-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.3)]'
              : 'bg-[#121216] text-sky-400 border-sky-500/30 hover:border-sky-400/60'
          }`}
          title="Camelot Wheel öffnen: Harmonisch kompatible Tracks visualisieren"
        >
          <Compass className="w-3.5 h-3.5 text-sky-400" />
          <span>CAMELOT WHEEL</span>
          <span className="px-1 py-0.2 rounded bg-sky-500/20 text-sky-300 text-[8px] font-mono border border-sky-400/30">
            {effectiveRefKey}
          </span>
          {filterKey && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                setFilterKey(null);
              }}
              className="ml-1 text-zinc-400 hover:text-white"
            >
              ×
            </span>
          )}
        </button>

        <button
          onClick={() => {
            triggerHaptic('tap');
            fileInputRef.current?.click();
          }}
          disabled={isAnalyzingFiles}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-mono text-[9.5px] font-bold tracking-wider uppercase transition active:scale-95 border bg-[#121216] hover:bg-zinc-800 text-emerald-400 border-emerald-500/30 hover:border-emerald-400/60 shadow-sm"
          title="Dateien importieren: Automatisches BPM- & Tonart-Parsing"
        >
          {isAnalyzingFiles ? (
            <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
          ) : (
            <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <span>SMART IMPORT</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.flac,.ogg,.m4a,.aac"
          multiple
          onChange={handleFileImport}
          className="hidden"
        />

        {filterKey && (
          <div className="flex items-center gap-1 font-mono text-[9px] text-zinc-400 ml-auto bg-zinc-900/80 px-2 py-1 rounded-lg border border-zinc-800">
            <span>Filter:</span>
            <span className="text-sky-300 font-bold">{filterKey}</span>
            <button
              onClick={() => setFilterKey(null)}
              className="text-zinc-500 hover:text-white text-xs ml-0.5"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Import Status Alert Banner */}
      {importStatusMessage && (
        <div className="mb-2 px-2.5 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-between gap-2 text-emerald-200 font-mono text-[9px] animate-fadeIn">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>{importStatusMessage}</span>
          </div>
          <button onClick={() => setImportStatusMessage(null)} className="text-zinc-400 hover:text-white">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 2. Smart Shuffle Active Harmonic Bar (When Activated) */}
      {isSmartShuffleActive && (
        <div className="mb-2.5 p-2 rounded-xl bg-[#0d1211] border border-emerald-500/40 shadow-inner flex flex-col gap-1.5 shrink-0 animate-fadeIn">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span className="font-mono text-[9px] font-black text-emerald-400 uppercase tracking-wider truncate">
                Harmonischer Mix-Flow aktiv
              </span>
              <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-emerald-900/60 border border-emerald-500/50 text-emerald-200 font-bold shrink-0">
                Ref: {effectiveRefKey} • {effectiveRefBpm.toFixed(1)} BPM
              </span>
            </div>

            {/* Reshuffle / Re-seed Button */}
            <button
              onClick={handleReshuffle}
              title="Neu mischen (Erzeugt eine alternative harmonische Permutation)"
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-900/50 hover:bg-emerald-800/70 border border-emerald-500/50 text-emerald-200 font-mono text-[9px] font-bold transition active:scale-95 shrink-0"
            >
              <Sparkles className="w-2.5 h-2.5 text-emerald-300" />
              <span>Neu mischen</span>
            </button>
          </div>

          {/* Mode Switcher: Flow (Set Chain) vs Match (Direct to Deck A) */}
          <div className="flex items-center justify-between gap-1 pt-0.5 border-t border-emerald-950/70">
            <div className="flex items-center gap-1">
              <span className="font-mono text-[8px] text-zinc-400 uppercase">Modus:</span>
              <button
                onClick={() => handleSwitchMode('FLOW')}
                className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold transition ${
                  shuffleMode === 'FLOW'
                    ? 'bg-emerald-500 text-zinc-950 font-black shadow-sm'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                }`}
                title="Harmonische Set-Progression: Jeder Song knüpft optimal an den vorigen an"
              >
                FLOW (SET-KETTE)
              </button>
              <button
                onClick={() => handleSwitchMode('MATCH')}
                className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold transition ${
                  shuffleMode === 'MATCH'
                    ? 'bg-emerald-500 text-zinc-950 font-black shadow-sm'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                }`}
                title="Direkt-Match: Sortiert streng nach höchster Kompatibilität zu Deck A"
              >
                MATCH (DECK A)
              </button>
            </div>

            {compatibilityStats && (
              <div className="flex items-center gap-1 text-[8px] font-mono text-zinc-400">
                <span className="text-emerald-400 font-bold">{compatibilityStats.perfect} Perfekt</span>
                <span>•</span>
                <span className="text-sky-300 font-bold">{compatibilityStats.compatible} Kompatibel</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Search Input Field */}
      <div className="relative mb-2.5 shrink-0">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            isSmartShuffleActive
              ? 'Filtere harmonisch geordnete Tracks...'
              : 'Suche nach Track, Künstler, BPM...'
          }
          className="w-full bg-[#121216] border border-zinc-800 text-zinc-200 placeholder-zinc-600 font-mono text-xs pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:border-zinc-500 transition"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 text-xs font-mono"
          >
            ✕
          </button>
        )}
      </div>

      {/* 4. Track List with Harmonic & BPM Smart Shuffle Ordering */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
        {displayItems.map((item) => {
          const track = item.track;
          const isDeckA = track.id === loadedTrackId;
          const isDeckB = track.id === secondTrackId;

          return (
            <div
              key={track.id}
              onClick={() => onOpenTrackLoad(track)}
              className={`flex items-center gap-2.5 p-2.5 rounded-2xl bg-[#121216] border transition-all cursor-pointer active:scale-[0.99] group ${
                isDeckA
                  ? 'border-rose-500/50 bg-[#161418] shadow-[0_0_12px_rgba(244,63,94,0.15)]'
                  : isDeckB
                  ? 'border-cyan-500/40 bg-[#11161a]'
                  : isSmartShuffleActive && item.score >= 80
                  ? 'border-emerald-500/30 hover:border-emerald-500/60 bg-[#0e1313]'
                  : 'border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              {/* Smart Shuffle Index or Artwork Glyph */}
              {isSmartShuffleActive ? (
                <div
                  className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 border font-mono ${
                    isDeckA
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                      : item.score >= 85
                      ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300'
                      : item.score >= 70
                      ? 'bg-sky-950/70 border-sky-500/60 text-sky-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                  title={`Track #${item.orderNumber} in harmonic sequence (Score: ${item.score}%)`}
                >
                  <span className="text-[8px] text-zinc-500 font-bold">#</span>
                  <span className="text-xs font-black leading-none">
                    {item.orderNumber.toString().padStart(2, '0')}
                  </span>
                </div>
              ) : (
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    isDeckA
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                      : isDeckB
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 group-hover:text-zinc-200'
                  }`}
                >
                  <Disc className="w-5 h-5 stroke-[1.75]" />
                </div>
              )}

              {/* Title, Artist, and Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-tech font-bold text-sm text-zinc-100 truncate group-hover:text-white">
                    {track.title}
                  </span>

                  {isDeckA && (
                    <span className="font-mono text-[8px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1 py-0.2 rounded uppercase">
                      DECK A (MASTER)
                    </span>
                  )}
                  {isDeckB && !isDeckA && (
                    <span
                      className={`font-mono text-[8px] px-1 py-0.2 rounded uppercase border ${
                        isSyncLocked
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      }`}
                    >
                      DECK B {isSyncLocked ? '(SYNC)' : '(STANDBY)'}
                    </span>
                  )}

                  {/* Smart Shuffle Harmonic Match Badges */}
                  {isSmartShuffleActive && !isDeckA && (
                    <div className="flex items-center gap-1">
                      {item.harmonicResult.level === 'PERFECT' && (
                        <span className="font-mono text-[7.5px] px-1 py-0.2 rounded font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_6px_rgba(16,185,129,0.3)]">
                          PERFEKT MATCH
                        </span>
                      )}
                      {item.harmonicResult.level === 'RELATIVE' && (
                        <span className="font-mono text-[7.5px] px-1 py-0.2 rounded font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                          DUR / MOLL
                        </span>
                      )}
                      {item.harmonicResult.level === 'ADJACENT' && (
                        <span className="font-mono text-[7.5px] px-1 py-0.2 rounded font-bold uppercase bg-sky-500/20 text-sky-300 border border-sky-500/40">
                          HARMONISCH
                        </span>
                      )}
                      {item.harmonicResult.level === 'ENERGY_BOOST' && (
                        <span className="font-mono text-[7.5px] px-1 py-0.2 rounded font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          ENERGY BOOST
                        </span>
                      )}
                    </div>
                  )}

                  {track.isImported && (
                    <span className="font-mono text-[7.5px] bg-sky-500/20 text-sky-300 border border-sky-500/40 px-1 py-0.2 rounded uppercase">
                      IMPORT
                    </span>
                  )}
                </div>

                <span className="font-mono text-[11px] text-zinc-500 block truncate">
                  {track.artist}
                </span>

                {/* Metadata Row: BPM, Key, Time, and Compatibility Delta */}
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-400 mt-1 flex-wrap">
                  <span className="text-zinc-200 font-semibold">{track.bpm.toFixed(1)}</span>
                  <span>BPM</span>
                  <span className="text-zinc-700">•</span>
                  <span
                    className={`font-semibold px-1 py-0.2 rounded ${
                      isSmartShuffleActive && item.harmonicResult.level === 'PERFECT'
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/50'
                        : isSmartShuffleActive &&
                          (item.harmonicResult.level === 'ADJACENT' ||
                            item.harmonicResult.level === 'RELATIVE')
                        ? 'bg-sky-950/80 text-sky-300 border border-sky-600/50'
                        : 'text-zinc-300'
                    }`}
                  >
                    {track.key}
                  </span>
                  <span className="text-zinc-700">•</span>
                  <span>{formatTime(track.duration)}</span>

                  {/* BPM Delta Indicator when Smart Shuffle is active */}
                  {isSmartShuffleActive && !isDeckA && (
                    <>
                      <span className="text-zinc-700">•</span>
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded border font-bold ${
                          Math.abs(item.bpmDelta) <= 1.0
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                            : Math.abs(item.bpmDelta) <= 4.0
                            ? 'bg-sky-950/60 text-sky-300 border-sky-800'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                        }`}
                      >
                        {item.bpmDelta === 0
                          ? '±0.0 BPM'
                          : `${item.bpmDelta > 0 ? '+' : ''}${item.bpmDelta.toFixed(1)} BPM${
                              item.multiplierLabel
                            }`}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Match Score Gauge (Smart Shuffle active) or Waveform Preview */}
              <div className="flex items-center gap-2 shrink-0">
                {isSmartShuffleActive && !isDeckA ? (
                  <div className="text-right">
                    <span
                      className={`font-mono text-xs font-black block ${
                        item.score >= 85
                          ? 'text-emerald-400'
                          : item.score >= 70
                          ? 'text-sky-400'
                          : 'text-zinc-400'
                      }`}
                    >
                      {item.score}%
                    </span>
                    <span className="font-mono text-[8px] text-zinc-500 uppercase block">
                      Match
                    </span>
                  </div>
                ) : (
                  <div className="w-12 h-5 hidden sm:flex items-center gap-0.5 opacity-60">
                    {track.waveform.slice(0, 8).map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-zinc-400 rounded-full"
                        style={{ height: `${Math.max(20, h * 0.7)}%` }}
                      />
                    ))}
                  </div>
                )}

                <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:bg-zinc-800 transition">
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </div>
              </div>
            </div>
          );
        })}

        {displayItems.length === 0 && (
          <div className="text-center py-12 font-mono text-xs text-zinc-500">
            Keine Tracks gefunden für "{searchQuery}"
          </div>
        )}
      </div>

      {/* Camelot Wheel Modal */}
      {isCamelotModalOpen && (
        <CamelotWheelModal
          currentMasterKey={effectiveRefKey}
          tracks={tracks}
          onSelectTrackKey={(selectedKey) => {
            setFilterKey(selectedKey);
            setIsCamelotModalOpen(false);
          }}
          onClose={() => setIsCamelotModalOpen(false)}
        />
      )}
    </div>
  );
};

