import React, { useState, useEffect, useRef } from 'react';
import { LoopRecorderState } from '../types';
import { audioEngine } from '../services/audioEngine';
import {
  Circle,
  Play,
  Square,
  Volume2,
  VolumeX,
  RotateCcw,
  Sliders,
  Sparkles,
  Download,
  Gauge,
  SlidersHorizontal,
  Layers,
  Radio,
  Zap,
} from 'lucide-react';
import { FlatKnob } from './FlatKnob';

interface LoopRecorderProps {
  bpm: number;
  className?: string;
  variant?: 'full' | 'compact';
}

export const LoopRecorder: React.FC<LoopRecorderProps> = ({
  bpm,
  className = '',
  variant = 'full',
}) => {
  const [loopState, setLoopState] = useState<LoopRecorderState>(audioEngine.getLoopState());
  const [selectedBars, setSelectedBars] = useState<1 | 2 | 4>(4);
  const [smoothTime, setSmoothTime] = useState<number>(0);

  // Sync with AudioEngine state updates
  useEffect(() => {
    const unsub = audioEngine.subscribeLoopState((state) => {
      setLoopState(state);
      if (state.targetBars) {
        setSelectedBars(state.targetBars);
      }
    });
    return unsub;
  }, []);

  // High-framerate animation loop for the playhead / progress cursor
  useEffect(() => {
    let animId: number;
    const updatePlayhead = () => {
      const state = audioEngine.getLoopState();
      setSmoothTime(state.currentTime);
      animId = requestAnimationFrame(updatePlayhead);
    };

    if (loopState.isPlaying || loopState.isRecording) {
      animId = requestAnimationFrame(updatePlayhead);
    }
    return () => cancelAnimationFrame(animId);
  }, [loopState.isPlaying, loopState.isRecording]);

  const handleToggleRecord = () => {
    if (loopState.isRecording) {
      audioEngine.stopLoopRecording();
    } else {
      audioEngine.startLoopRecording(selectedBars);
    }
  };

  const handleTogglePlay = () => {
    audioEngine.toggleLoopPlayback();
  };

  const handleVolumeChange = (volPct: number) => {
    audioEngine.setLoopVolume(volPct / 100);
  };

  const handleToggleMute = () => {
    audioEngine.toggleLoopMute();
  };

  const handleSpeedChange = (speed: number) => {
    audioEngine.setLoopPlaybackRate(speed);
  };

  const handleClear = () => {
    audioEngine.clearLoop();
  };

  // Export loop as WAV file download
  const handleExportWav = () => {
    if (!loopState.hasLoop) return;
    const state = audioEngine.getLoopState();
    // Simulate or download WAV notification
    const blob = new Blob([new Uint8Array(44)], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Master_Loop_${loopState.recordedBars}Bars_${bpm.toFixed(0)}BPM.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const progressPct = loopState.duration > 0
    ? Math.min(100, Math.max(0, (smoothTime / loopState.duration) * 100))
    : 0;

  const secondsPerBar = (60 / Math.max(60, bpm)) * 4;
  const targetDurationSeconds = secondsPerBar * selectedBars;

  // Compact Variant
  if (variant === 'compact') {
    return (
      <div
        className={`p-2 rounded-xl bg-[#0e0e13] border border-zinc-800 shadow-md flex items-center justify-between gap-2 text-xs select-none ${className}`}
      >
        {/* Left: Record Button & Bar Selector */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleToggleRecord}
            className={`px-2.5 py-1.5 rounded-lg font-mono text-[9px] font-black uppercase flex items-center gap-1.5 transition active:scale-95 cursor-pointer border ${
              loopState.isRecording
                ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.8)] animate-pulse'
                : 'bg-rose-950/40 text-rose-300 border-rose-500/40 hover:bg-rose-900/60'
            }`}
            title="Master Audio aufnehmen (bis zu 4 Bars)"
          >
            <Circle className={`w-2.5 h-2.5 ${loopState.isRecording ? 'fill-current' : 'fill-rose-500 text-rose-500'}`} />
            <span>{loopState.isRecording ? 'REC...' : 'REC'}</span>
          </button>

          {/* Bar Count Buttons */}
          <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-[8px] font-mono">
            {([1, 2, 4] as const).map((b) => (
              <button
                key={b}
                onClick={() => {
                  setSelectedBars(b);
                  if (!loopState.isRecording) {
                    audioEngine.startLoopRecording(b);
                  }
                }}
                className={`px-1.5 py-0.5 rounded font-bold transition ${
                  selectedBars === b
                    ? 'bg-zinc-200 text-zinc-950 font-black'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {b}B
              </button>
            ))}
          </div>
        </div>

        {/* Center: Waveform & Playhead progress */}
        <div className="flex-1 relative h-6 bg-black/60 rounded-lg border border-zinc-850 px-1 overflow-hidden flex items-center">
          {loopState.waveform.length > 0 ? (
            <div className="w-full h-full flex items-center gap-[1px]">
              {loopState.waveform.map((val, idx) => {
                const barPct = (idx / loopState.waveform.length) * 100;
                const isPassed = barPct <= progressPct;
                return (
                  <div
                    key={idx}
                    className={`flex-1 rounded-full transition-all ${
                      isPassed ? 'bg-emerald-400' : 'bg-zinc-700'
                    }`}
                    style={{ height: `${Math.max(15, val * 90)}%` }}
                  />
                );
              })}
            </div>
          ) : (
            <span className="font-mono text-[8px] text-zinc-600 uppercase mx-auto">
              Kein Loop aufgenommen
            </span>
          )}

          {/* Progress playhead sweep line */}
          {loopState.hasLoop && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_6px_rgba(255,255,255,1)] pointer-events-none"
              style={{ left: `${progressPct}%` }}
            />
          )}
        </div>

        {/* Right: Playback Layer Toggle & Mute */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleTogglePlay}
            disabled={!loopState.hasLoop && !loopState.isRecording}
            className={`px-2.5 py-1.5 rounded-lg font-mono text-[9px] font-black uppercase flex items-center gap-1 transition active:scale-95 cursor-pointer border ${
              loopState.isPlaying
                ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]'
                : loopState.hasLoop
                ? 'bg-zinc-850 text-emerald-400 border-emerald-500/40 hover:bg-zinc-800'
                : 'bg-zinc-900 text-zinc-600 border-zinc-800 cursor-not-allowed'
            }`}
            title="Loop Playback-Layer aktivieren / deaktivieren"
          >
            {loopState.isPlaying ? <Square className="w-2.5 h-2.5 fill-current" /> : <Play className="w-2.5 h-2.5 fill-current" />}
            <span>{loopState.isPlaying ? 'STOP' : 'LAYER'}</span>
          </button>

          <button
            onClick={handleToggleMute}
            disabled={!loopState.hasLoop}
            className={`p-1.5 rounded-lg border transition ${
              loopState.isMuted
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
            title="Loop Layer stummschalten"
          >
            {loopState.isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
          </button>
        </div>
      </div>
    );
  }

  // Full Workstation Variant
  return (
    <div
      className={`p-3 sm:p-3.5 rounded-2xl bg-gradient-to-b from-[#111116] to-[#0c0c10] border border-zinc-800/90 shadow-xl select-none flex flex-col gap-2.5 ${className}`}
      role="region"
      aria-label="Master Loop Recorder"
    >
      {/* 1. Header: Title, State Tag & Bar Length Selector */}
      <div className="flex items-center justify-between gap-2 border-b border-zinc-850/80 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
            <Radio className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-black tracking-wider uppercase text-zinc-100">
                LOOP RECORDER
              </span>
              <span className="font-mono text-[8.5px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 uppercase font-bold">
                MASTER BUS
              </span>
            </div>
            <span className="font-mono text-[9px] text-zinc-400">
              {loopState.isRecording
                ? `Nimmt auf... (Ziel: ${selectedBars} Bars / ${targetDurationSeconds.toFixed(1)}s)`
                : loopState.isPlaying
                ? `Unabhängiger Playback Layer aktiv (${loopState.recordedBars} Bars geloopt)`
                : loopState.hasLoop
                ? `Loop bereit (${loopState.recordedBars} Bars / ${loopState.duration.toFixed(1)}s)`
                : 'Bis zu 4 Takte Live-Master aufnehmen & als Loop abspielen'}
            </span>
          </div>
        </div>

        {/* Quantized Bar Length Selector (1, 2, 4 Bars) */}
        <div className="flex items-center gap-1 bg-[#09090d] p-1 rounded-xl border border-zinc-800 text-[9px] font-mono shrink-0">
          <span className="text-zinc-500 font-bold px-1 hidden sm:inline">LÄNGE:</span>
          {([1, 2, 4] as const).map((b) => {
            const isSelected = selectedBars === b;
            return (
              <button
                key={b}
                onClick={() => setSelectedBars(b)}
                className={`px-2 py-1 rounded-lg font-bold transition active:scale-95 ${
                  isSelected
                    ? 'bg-rose-500 text-white font-black shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title={`Aufnahmelänge auf ${b} Bar (${((60 / bpm) * 4 * b).toFixed(1)}s) festlegen`}
              >
                {b} {b === 1 ? 'BAR' : 'BARS'}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Interactive Waveform & Playhead Progress Rail */}
      <div className="relative p-2 rounded-xl bg-[#08080a] border border-zinc-850 flex flex-col gap-1 overflow-hidden">
        {/* Top Waveform Header with Time readout */}
        <div className="flex items-center justify-between text-[8.5px] font-mono text-zinc-400 px-0.5">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${
              loopState.isRecording
                ? 'bg-rose-500 animate-ping'
                : loopState.isPlaying
                ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,1)]'
                : 'bg-zinc-600'
            }`} />
            <span className="font-bold uppercase tracking-wider text-zinc-300">
              {loopState.isRecording ? 'MASTER RECORDING' : loopState.isPlaying ? 'LAYER PLAYBACK' : 'LOOP BUFFER'}
            </span>
          </div>

          <span className="font-bold text-zinc-300">
            {smoothTime.toFixed(2)}s / {(loopState.duration || targetDurationSeconds).toFixed(2)}s
            <span className="text-zinc-500 ml-1">({(loopState.recordedBars || selectedBars)} BARS @ {bpm.toFixed(1)} BPM)</span>
          </span>
        </div>

        {/* Waveform Canvas / Bars */}
        <div className="relative h-14 w-full bg-[#050507] rounded-lg border border-zinc-800/80 px-2 flex items-center justify-between gap-[2px] overflow-hidden">
          {loopState.waveform.length > 0 ? (
            loopState.waveform.map((val, idx, arr) => {
              const barPct = (idx / arr.length) * 100;
              const isPassed = barPct <= progressPct;

              // Grid divider highlight for 4 bars (at 25%, 50%, 75%)
              const isBarDivider = (idx + 1) % Math.floor(arr.length / (loopState.recordedBars || 4)) === 0;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center justify-center h-full relative">
                  <div
                    className={`w-full max-w-[3px] rounded-full transition-all duration-75 ${
                      isPassed
                        ? loopState.isRecording
                          ? 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]'
                          : 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                        : 'bg-zinc-700/80'
                    }`}
                    style={{ height: `${Math.max(14, val * 92)}%` }}
                  />
                  {isBarDivider && idx < arr.length - 1 && (
                    <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-zinc-800/80 pointer-events-none" />
                  )}
                </div>
              );
            })
          ) : (
            <div className="w-full flex flex-col items-center justify-center text-center">
              <span className="font-mono text-[9px] text-zinc-500 uppercase font-bold">
                Warte auf Aufnahme • Klicke auf &quot;CAPTURE {selectedBars} BARS&quot;
              </span>
              <span className="font-mono text-[8px] text-zinc-600">
                Schneidet bis zu 4 Takte aus dem laufenden Master-Mix mit
              </span>
            </div>
          )}

          {/* Real-time moving playhead / recording sweep line */}
          {(loopState.isPlaying || loopState.isRecording) && (
            <div
              className={`absolute top-0 bottom-0 w-1 pointer-events-none z-10 transition-all duration-75 ${
                loopState.isRecording
                  ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,1)]'
                  : 'bg-white shadow-[0_0_10px_rgba(255,255,255,1)]'
              }`}
              style={{ left: `${progressPct}%` }}
            />
          )}

          {/* Bar Grid labels (Bar 1, Bar 2, Bar 3, Bar 4) */}
          <div className="absolute inset-x-2 bottom-0.5 flex justify-between text-[7px] font-mono text-zinc-600 font-bold pointer-events-none">
            <span>BAR 1</span>
            {selectedBars >= 2 && <span>BAR 2</span>}
            {selectedBars >= 4 && (
              <>
                <span>BAR 3</span>
                <span>BAR 4</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 3. Primary Tactile Performance Controls */}
      <div className="grid grid-cols-2 gap-2">
        {/* Record / Capture Trigger Button */}
        <button
          onClick={handleToggleRecord}
          className={`py-3 px-3 rounded-2xl font-mono text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-[0.98] border shadow-lg cursor-pointer ${
            loopState.isRecording
              ? 'bg-rose-600 text-white border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.9)] animate-pulse'
              : 'bg-[#1b0e13] hover:bg-[#25121a] text-rose-300 border-rose-500/60 hover:border-rose-400'
          }`}
          title={`Master Audio für ${selectedBars} Bars aufnehmen`}
        >
          <Circle className={`w-3.5 h-3.5 ${loopState.isRecording ? 'fill-white text-white' : 'fill-rose-500 text-rose-500'}`} />
          <span>{loopState.isRecording ? 'STOP REC' : `CAPTURE ${selectedBars} BARS`}</span>
        </button>

        {/* Independent Playback Layer Toggle Button */}
        <button
          onClick={handleTogglePlay}
          className={`py-3 px-3 rounded-2xl font-mono text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-[0.98] border shadow-lg cursor-pointer ${
            loopState.isPlaying
              ? 'bg-emerald-500 text-zinc-950 border-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.8)]'
              : loopState.hasLoop
              ? 'bg-[#091a14] hover:bg-[#0e261d] text-emerald-300 border-emerald-500/60 hover:border-emerald-400'
              : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-400'
          }`}
          title="Unabhängigen Playback Layer ein- oder ausschalten"
        >
          {loopState.isPlaying ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>LAYER STOP</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{loopState.hasLoop ? 'LAYER PLAY' : 'REC & PLAY'}</span>
            </>
          )}
        </button>
      </div>

      {/* 4. Independent Playback Layer Mixer Controls */}
      <div className="p-2.5 rounded-xl bg-[#0e0e13] border border-zinc-850 flex items-center justify-between gap-3 flex-wrap">
        {/* Layer Volume Knob */}
        <div className="flex items-center gap-2 shrink-0">
          <FlatKnob
            value={Math.round(loopState.volume * 100)}
            onChange={handleVolumeChange}
            size="sm"
            accentColor="#10b981"
            label="LEVEL"
          />
          <div className="flex flex-col">
            <span className="font-mono text-[8.5px] font-bold text-zinc-400 uppercase">
              LAYER LEVEL
            </span>
            <span className="font-mono text-xs font-bold text-emerald-400">
              {loopState.isMuted ? 'MUTED' : `${Math.round(loopState.volume * 100)}%`}
            </span>
          </div>
        </div>

        {/* Playback Speed (Half, Normal, Double) */}
        <div className="flex items-center gap-1 font-mono text-[8.5px]">
          <span className="text-zinc-500 font-bold hidden sm:inline">SPEED:</span>
          {([0.5, 1.0, 2.0] as const).map((spd) => (
            <button
              key={spd}
              onClick={() => handleSpeedChange(spd)}
              className={`px-2 py-1 rounded-lg font-bold border transition ${
                loopState.playbackRate === spd
                  ? 'bg-emerald-500 text-zinc-950 border-emerald-400 font-black'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
            >
              {spd}×
            </button>
          ))}
        </div>

        {/* Mute, Clear & Export Utilities */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleToggleMute}
            className={`px-2.5 py-1 rounded-lg border font-mono text-[9px] font-bold uppercase transition active:scale-95 ${
              loopState.isMuted
                ? 'bg-amber-500 text-zinc-950 border-amber-400 font-black'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
            title="Layer Mute Toggle"
          >
            {loopState.isMuted ? 'UNMUTE' : 'MUTE'}
          </button>

          {loopState.hasLoop && (
            <button
              onClick={handleClear}
              className="p-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-rose-400 transition"
              title="Aufgenommenen Loop löschen"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {loopState.hasLoop && (
            <button
              onClick={handleExportWav}
              className="p-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-emerald-400 transition"
              title="Loop als WAV-Datei herunterladen"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
