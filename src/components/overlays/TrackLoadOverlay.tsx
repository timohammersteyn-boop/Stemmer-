import React, { useState, useRef } from 'react';
import { TrackData } from '../../types';
import {
  ChevronLeft,
  X,
  Check,
  Disc,
  Play,
  Pause,
  Upload,
  Gauge,
  Volume2,
  Sliders,
  RotateCcw,
  Sparkles,
  Zap,
  Info,
  AlertTriangle,
} from 'lucide-react';
import {
  analyzeAudioFile,
  getTrackAnalysis,
  TARGET_RMS_DB,
} from '../../services/audioAnalysisService';

interface TrackLoadOverlayProps {
  tracks: TrackData[];
  currentTrack: TrackData;
  secondTrack?: TrackData;
  isSyncLocked?: boolean;
  onLoadTrack: (track: TrackData, gainCompensationDb?: number, targetDeck?: 'A' | 'B') => void;
  onClose: () => void;
  onImportTrack?: (track: TrackData) => void;
}

export const TrackLoadOverlay: React.FC<TrackLoadOverlayProps> = ({
  tracks,
  currentTrack,
  secondTrack,
  isSyncLocked = false,
  onLoadTrack,
  onClose,
  onImportTrack,
}) => {
  const [tracksState, setTracksState] = useState<TrackData[]>(tracks);
  const [selectedTrack, setSelectedTrack] = useState<TrackData>(currentTrack);
  const [filterGenre, setFilterGenre] = useState<string>('Alle');
  const [search, setSearch] = useState('');
  const [isPreviewing, setIsPreviewing] = useState(false);

  // Peak RMS & Gain Compensation State
  const initialAnalysis = getTrackAnalysis(currentTrack);
  const [autoGainCompensation, setAutoGainCompensation] = useState<boolean>(true);
  const [customGainDb, setCustomGainDb] = useState<number>(
    currentTrack.gainCompensationDb ?? initialAnalysis.suggestedGainDb
  );
  const [isAnalyzingFile, setIsAnalyzingFile] = useState<boolean>(false);
  const [analysisStatus, setAnalysisStatus] = useState<string>('');
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Whenever selected track changes, update gain compensation if in auto mode
  const handleSelectTrack = (track: TrackData) => {
    setSelectedTrack(track);
    const analysis = getTrackAnalysis(track);
    if (autoGainCompensation) {
      setCustomGainDb(track.gainCompensationDb ?? analysis.suggestedGainDb);
    }
  };

  // Current analysis metrics for the active selected track
  const currentAnalysis = getTrackAnalysis(selectedTrack);
  const displayPeakDb = selectedTrack.peakDb ?? currentAnalysis.peakDb;
  const displayPeakRmsDb = selectedTrack.peakRmsDb ?? currentAnalysis.peakRmsDb;
  const suggestedGain = selectedTrack.gainCompensationDb ?? currentAnalysis.suggestedGainDb;

  // Compute resulting compensated peak & RMS
  const effectiveGain = autoGainCompensation ? suggestedGain : customGainDb;
  const compensatedPeakRms = Math.min(0, Math.round((displayPeakRmsDb + effectiveGain) * 10) / 10);
  const compensatedPeak = Math.round((displayPeakDb + effectiveGain) * 10) / 10;
  const isClippingRisk = compensatedPeak > -0.1;

  const genres = ['Alle', 'Importiert', 'Stems', 'Tech House', 'Melodic Techno', 'Minimal'];

  const filtered = tracksState.filter((t) => {
    const matchesFilter =
      filterGenre === 'Alle' ||
      (filterGenre === 'Importiert' && t.isImported) ||
      filterGenre === 'Stems' ||
      t.genre.includes(filterGenre);
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.artist.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const formatTime = (sec: number): string => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Handle Local Audio File Upload and Peak RMS Analysis
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzingFile(true);
    setAnalysisError(null);
    setAnalysisStatus('DECODING AUDIO BUFFER...');

    try {
      setAnalysisStatus('CALCULATING TRUE PEAK & PEAK RMS...');
      const result = await analyzeAudioFile(file);

      // Clean filename for title
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');

      const newTrack: TrackData = {
        id: `imported-${Date.now()}`,
        title: cleanTitle,
        artist: 'IMPORTED AUDIO',
        bpm: 128.0,
        key: '8A',
        duration: Math.round(result.duration),
        genre: 'Importiert',
        stems: { drums: true, bass: true, music: true, vocal: true },
        waveform: result.waveform,
        peakDb: result.peakDb,
        peakRmsDb: result.peakRmsDb,
        gainCompensationDb: result.suggestedGainDb,
        isImported: true,
      };

      setTracksState((prev) => [newTrack, ...prev]);
      setSelectedTrack(newTrack);
      setCustomGainDb(result.suggestedGainDb);
      setAutoGainCompensation(true);
      onImportTrack?.(newTrack);
      setAnalysisStatus('ANALYSE ERFOLGREICH!');
    } catch (err: unknown) {
      console.error('Audio decoding error:', err);
      setAnalysisError('Audio-Datei konnte nicht decodiert werden. Bitte ein gängiges Format (WAV, MP3, FLAC) wählen.');
    } finally {
      setIsAnalyzingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleConfirmLoad = (targetDeck: 'A' | 'B' = 'A') => {
    const appliedGain = autoGainCompensation ? suggestedGain : customGainDb;
    onLoadTrack(selectedTrack, appliedGain, targetDeck);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#09090c] flex flex-col p-4 select-none animate-in fade-in duration-150 overflow-hidden">
      {/* Hidden File Input for Audio Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="audio/*,.wav,.mp3,.aiff,.flac,.ogg,.m4a"
        className="hidden"
      />

      {/* 1. Header with Import Trigger */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-900 shrink-0">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center">
          <span className="font-mono text-xs font-bold tracking-[0.2em] uppercase text-zinc-200">
            TRACK LADEN & GAIN UTILITY
          </span>
          <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-tight">
            Peak RMS Analyse & Lautheits-Normalisierung
          </span>
        </div>

        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Live DJ Deck Overview: Unmistakable Deck A vs Deck B Assignment */}
      <div className="mt-2.5 p-2 rounded-2xl bg-[#0d0d12] border border-zinc-850 grid grid-cols-2 gap-2 shrink-0">
        {/* Deck A Current Status Card */}
        <div className="p-2 rounded-xl bg-[#180d11] border border-rose-900/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,1)] animate-pulse shrink-0" />
            <div className="min-w-0 truncate">
              <div className="flex items-center gap-1.5 font-mono text-[8.5px] font-black uppercase">
                <span className="text-rose-400">DECK A</span>
                <span className="px-1 py-0.2 rounded bg-rose-500/25 text-rose-300 border border-rose-500/40 text-[7.5px]">
                  LIVE MASTER
                </span>
              </div>
              <span className="font-tech font-bold text-xs text-zinc-100 block truncate">
                {currentTrack.title}
              </span>
            </div>
          </div>
          <span className="font-mono text-[9px] font-bold text-rose-400 shrink-0">
            {currentTrack.bpm.toFixed(1)} BPM
          </span>
        </div>

        {/* Deck B Current Status Card */}
        <div className="p-2 rounded-xl bg-[#09141a] border border-cyan-900/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,1)] shrink-0" />
            <div className="min-w-0 truncate">
              <div className="flex items-center gap-1.5 font-mono text-[8.5px] font-black uppercase">
                <span className="text-cyan-400">DECK B</span>
                <span className="px-1 py-0.2 rounded bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 text-[7.5px]">
                  {isSyncLocked ? 'SYNC LOCKED' : 'STANDBY / CUE'}
                </span>
              </div>
              <span className="font-tech font-bold text-xs text-zinc-100 block truncate">
                {secondTrack?.title || 'Leer (Kein Track)'}
              </span>
            </div>
          </div>
          <span className="font-mono text-[9px] font-bold text-cyan-400 shrink-0">
            {secondTrack ? `${secondTrack.bpm.toFixed(1)} BPM` : '---'}
          </span>
        </div>
      </div>

      {/* 2. Top Bar: Search + Import Audio Action */}
      <div className="my-2.5 flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Suche nach Track, Künstler, BPM..."
          className="flex-1 bg-[#121216] border border-zinc-800 text-zinc-200 placeholder-zinc-600 font-mono text-xs px-3.5 py-2 rounded-xl focus:outline-none focus:border-zinc-500"
        />

        {/* Audio File Import Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isAnalyzingFile}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 hover:text-white font-mono text-[10px] font-bold uppercase transition active:scale-95 shrink-0 shadow-sm"
          title="Eigene Audiodatei (WAV, MP3, FLAC) importieren und analysieren"
        >
          <Upload className="w-3.5 h-3.5 text-rose-500" />
          <span>DATEI IMPORTIEREN</span>
        </button>
      </div>

      {/* Audio Decoding / Analysis Loading Bar */}
      {isAnalyzingFile && (
        <div className="mb-2.5 p-3 rounded-xl bg-zinc-900/90 border border-rose-500/50 flex items-center gap-3 animate-pulse">
          <Zap className="w-4 h-4 text-rose-500 animate-spin" />
          <div className="flex flex-col flex-1">
            <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
              {analysisStatus}
            </span>
            <span className="font-mono text-[9px] text-zinc-400">
              Berechne Peak RMS Fenster & True Peak zur Ermittlung der optimalen Aussteuerung...
            </span>
          </div>
        </div>
      )}

      {analysisError && (
        <div className="mb-2.5 p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/50 flex items-center gap-2 text-rose-300 font-mono text-[10px]">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{analysisError}</span>
        </div>
      )}

      {/* Genre Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 no-scrollbar shrink-0">
        {genres.map((g) => {
          const isSelected = filterGenre === g;
          return (
            <button
              key={g}
              onClick={() => setFilterGenre(g)}
              className={`px-3 py-1 rounded-xl font-mono text-[10px] font-bold uppercase shrink-0 transition active:scale-95 border ${
                isSelected
                  ? 'bg-zinc-100 text-zinc-950 border-white shadow-sm'
                  : 'bg-[#121216] text-zinc-400 border-zinc-800/80 hover:text-zinc-200'
              }`}
            >
              {g}
            </button>
          );
        })}
      </div>

      {/* 3. Main Inspection Card with Peak RMS & Gain Compensation Utility */}
      <div className="p-3.5 rounded-2xl bg-[#121217] border border-zinc-800 mb-2.5 shadow-lg shrink-0">
        {/* Track Title & Preview */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-rose-500 shrink-0">
              <Disc className="w-5 h-5 stroke-[1.75]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-tech font-bold text-sm text-zinc-100 block">
                  {selectedTrack.title}
                </span>
                {selectedTrack.isImported && (
                  <span className="px-1.5 py-[1px] rounded bg-rose-950/60 border border-rose-500/40 text-rose-300 text-[8px] font-mono font-bold">
                    USER IMPORT
                  </span>
                )}
              </div>
              <span className="font-mono text-[10px] text-zinc-400 block">
                {selectedTrack.artist} • {selectedTrack.bpm.toFixed(1)} BPM • {selectedTrack.key} • {formatTime(selectedTrack.duration)}
              </span>
            </div>
          </div>

          {/* Quick Preview Button */}
          <button
            onClick={() => setIsPreviewing(!isPreviewing)}
            className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white active:scale-95 transition"
            title="Preview anhören"
          >
            {isPreviewing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>
        </div>

        {/* --- GAIN COMPENSATION & PEAK RMS UTILITY MODULE --- */}
        <div className="bg-[#0b0b0e] p-3 rounded-xl border border-zinc-800/90 space-y-2 mb-2.5 shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-rose-500" />
              <span className="font-mono text-[10px] font-bold text-zinc-200 uppercase tracking-wider">
                PEAK RMS & GAIN COMPENSATION UTILITY
              </span>
            </div>

            {/* Auto Match Toggle Pill */}
            <button
              onClick={() => {
                const next = !autoGainCompensation;
                setAutoGainCompensation(next);
                if (next) setCustomGainDb(suggestedGain);
              }}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[9px] font-bold border transition ${
                autoGainCompensation
                  ? 'bg-rose-500/15 border-rose-500/50 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.2)]'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Sparkles className="w-2.5 h-2.5" />
              <span>AUTO MATCH: {autoGainCompensation ? 'AKTIV' : 'MANUELL'}</span>
            </button>
          </div>

          {/* 4-Metric Loudness Grid in Nothing Style */}
          <div className="grid grid-cols-4 gap-1.5 font-mono text-center">
            {/* 1. True Peak */}
            <div className="p-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800/80">
              <span className="text-[8px] text-zinc-500 block uppercase">TRUE PEAK</span>
              <span className={`text-[11px] font-bold ${displayPeakDb > -0.5 ? 'text-amber-400' : 'text-zinc-200'}`}>
                {displayPeakDb >= 0 ? '+' : ''}{displayPeakDb.toFixed(1)} <span className="text-[7.5px] text-zinc-500">dBFS</span>
              </span>
            </div>

            {/* 2. Peak RMS */}
            <div className="p-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800/80">
              <span className="text-[8px] text-zinc-500 block uppercase">PEAK RMS</span>
              <span className="text-[11px] font-bold text-zinc-100">
                {displayPeakRmsDb.toFixed(1)} <span className="text-[7.5px] text-zinc-500">dB</span>
              </span>
            </div>

            {/* 3. Target Reference Level */}
            <div className="p-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800/80">
              <span className="text-[8px] text-zinc-500 block uppercase">ZIEL REFERENZ</span>
              <span className="text-[11px] font-bold text-sky-400">
                {TARGET_RMS_DB.toFixed(1)} <span className="text-[7.5px] text-zinc-500">RMS</span>
              </span>
            </div>

            {/* 4. Suggested Optimal Gain Compensation */}
            <div className="p-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800/80">
              <span className="text-[8px] text-zinc-500 block uppercase">GAIN VORSCHLAG</span>
              <span className={`text-[11px] font-black ${
                suggestedGain > 0 ? 'text-emerald-400' : suggestedGain < 0 ? 'text-amber-400' : 'text-zinc-300'
              }`}>
                {suggestedGain >= 0 ? '+' : ''}{suggestedGain.toFixed(1)} <span className="text-[7.5px] text-zinc-500">dB</span>
              </span>
            </div>
          </div>

          {/* Dual Peak & RMS Visual Level Comparison Bar */}
          <div className="space-y-1 pt-0.5">
            <div className="flex items-center justify-between text-[8px] font-mono text-zinc-500">
              <span>RMS ENERGIE vs. ZIELPEGEL (-14 dBFS)</span>
              <span className={isClippingRisk ? 'text-amber-400 font-bold' : 'text-zinc-400'}>
                Kompensiert: {compensatedPeakRms.toFixed(1)} dB RMS (Peak: {compensatedPeak >= 0 ? '+' : ''}{compensatedPeak.toFixed(1)} dB)
              </span>
            </div>

            {/* Visual Meter Bar */}
            <div className="relative w-full h-2.5 bg-zinc-950 rounded border border-zinc-800 overflow-hidden flex items-center">
              {/* RMS fill bar */}
              <div
                className="h-full bg-gradient-to-r from-sky-500/60 via-emerald-500/70 to-rose-500/80 transition-all duration-150"
                style={{
                  width: `${Math.max(5, Math.min(100, ((Math.abs(-30 - displayPeakRmsDb) / 30) * 100)))}%`,
                }}
              />

              {/* Target Line marker at -14 dBFS */}
              <div
                className="absolute inset-y-0 w-0.5 bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,1)] z-10 pointer-events-none"
                style={{ left: `${((Math.abs(-30 - TARGET_RMS_DB) / 30) * 100)}%` }}
                title="Target Club Reference (-14 dB RMS)"
              />

              {/* Resulting Peak Compensated Marker */}
              <div
                className="absolute inset-y-0 w-1 bg-white shadow-[0_0_4px_rgba(255,255,255,0.9)] z-20 pointer-events-none"
                style={{
                  left: `${Math.max(0, Math.min(99, ((Math.abs(-30 - compensatedPeakRms) / 30) * 100)))}%`,
                }}
                title={`Kompensierter RMS Pegel: ${compensatedPeakRms} dBFS`}
              />
            </div>
          </div>

          {/* Tactile Gain Trim Slider (-12 dB to +12 dB) */}
          <div className="pt-1 flex items-center gap-2 font-mono text-[9px]">
            <span className="text-zinc-400 font-bold shrink-0">GAIN TRIM:</span>
            <input
              type="range"
              min="-12.0"
              max="12.0"
              step="0.1"
              value={effectiveGain}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setCustomGainDb(val);
                setAutoGainCompensation(false);
              }}
              className="flex-1 h-1 accent-rose-500 bg-zinc-800 rounded-lg cursor-pointer"
            />
            <span className={`w-14 text-right font-bold shrink-0 ${
              effectiveGain > 0 ? 'text-emerald-400' : effectiveGain < 0 ? 'text-amber-400' : 'text-zinc-300'
            }`}>
              {effectiveGain >= 0 ? '+' : ''}{effectiveGain.toFixed(1)} dB
            </span>

            {/* Reset to Auto Preset Button */}
            {!autoGainCompensation && (
              <button
                onClick={() => {
                  setAutoGainCompensation(true);
                  setCustomGainDb(suggestedGain);
                }}
                className="p-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-rose-400 active:scale-95 transition"
                title="Zurück zum berechneten Optimalwert"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Waveform Visualization Preview */}
        <div>
          <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500 mb-1 px-0.5">
            <span className="uppercase font-bold text-zinc-400">AUDIO WELLENFORM</span>
            <span>00:00 — {formatTime(selectedTrack.duration)}</span>
          </div>
          <div className="h-10 bg-[#0a0a0d] rounded-xl border border-zinc-800/90 px-2 py-1 flex items-center justify-between gap-[2px] overflow-hidden">
            {selectedTrack.waveform.map((h, idx, arr) => {
              const isPassed = isPreviewing && idx / arr.length <= 0.35;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center justify-center h-full">
                  <div
                    className={`w-full max-w-[3px] rounded-full transition-all duration-100 ${
                      isPassed
                        ? 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]'
                        : 'bg-zinc-300/80 hover:bg-zinc-100'
                    }`}
                    style={{ height: `${Math.max(14, typeof h === 'number' ? h * 0.72 : 30)}%` }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Track Selection Catalog List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 mb-2.5 min-h-0">
        {filtered.map((t) => {
          const isSelected = selectedTrack.id === t.id;
          const tAnalysis = getTrackAnalysis(t);
          const tGain = t.gainCompensationDb ?? tAnalysis.suggestedGainDb;

          return (
            <div
              key={t.id}
              onClick={() => handleSelectTrack(t)}
              className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                isSelected
                  ? 'bg-zinc-800/90 border-zinc-500 text-white shadow-sm'
                  : 'bg-[#121216] border-zinc-800/70 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-2 h-7 rounded-full shrink-0 ${isSelected ? 'bg-rose-500' : 'bg-zinc-700'}`} />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-tech font-bold text-xs text-zinc-200 block">
                      {t.title}
                    </span>
                    {t.isImported && (
                      <span className="px-1 py-[0.5px] rounded bg-rose-950/70 text-rose-300 text-[7px] font-mono font-bold">
                        IMPORT
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[10px] text-zinc-500 block">
                    {t.artist} • {t.bpm.toFixed(0)} BPM • {t.key}
                  </span>
                </div>
              </div>

              {/* Peak RMS & Gain Tag */}
              <div className="flex items-center gap-2">
                <div className="text-right font-mono text-[9px]">
                  <span className="text-zinc-500 block">RMS: {t.peakRmsDb ?? tAnalysis.peakRmsDb} dB</span>
                  <span className={`font-bold ${tGain > 0 ? 'text-emerald-400' : tGain < 0 ? 'text-amber-400' : 'text-zinc-300'}`}>
                    Gain: {tGain >= 0 ? '+' : ''}{tGain.toFixed(1)} dB
                  </span>
                </div>

                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)] shrink-0" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Tactile LOAD TO DECK Buttons: Deck A (Master) or Deck B (Standby/Sync) */}
      <div className="grid grid-cols-2 gap-2 shrink-0">
        <button
          onClick={() => handleConfirmLoad('A')}
          className="py-3.5 px-3 rounded-2xl bg-[#1c0d12] hover:bg-[#281119] border-2 border-rose-500/80 text-rose-100 font-mono text-xs font-black tracking-wider uppercase active:scale-[0.98] transition shadow-[0_0_15px_rgba(244,63,94,0.25)] flex items-center justify-center gap-2 group cursor-pointer"
          title="Lade ausgewählten Track in DECK A (LIVE MASTER)"
        >
          <Disc className="w-4 h-4 text-rose-500 group-hover:rotate-45 transition-transform" />
          <span>LOAD DECK A</span>
          <span className="px-1.5 py-0.5 rounded bg-rose-500 text-zinc-950 text-[9px] font-mono font-black">
            MASTER
          </span>
        </button>

        <button
          onClick={() => handleConfirmLoad('B')}
          className="py-3.5 px-3 rounded-2xl bg-[#09161e] hover:bg-[#0d222e] border-2 border-cyan-500/80 text-cyan-100 font-mono text-xs font-black tracking-wider uppercase active:scale-[0.98] transition shadow-[0_0_15px_rgba(6,182,212,0.25)] flex items-center justify-center gap-2 group cursor-pointer"
          title="Lade ausgewählten Track in DECK B (CUE / STANDBY)"
        >
          <Disc className="w-4 h-4 text-cyan-400 group-hover:rotate-45 transition-transform" />
          <span>LOAD DECK B</span>
          <span className="px-1.5 py-0.5 rounded bg-cyan-400 text-zinc-950 text-[9px] font-mono font-black">
            {isSyncLocked ? 'SYNC' : 'STANDBY'}
          </span>
        </button>
      </div>
    </div>
  );
};

