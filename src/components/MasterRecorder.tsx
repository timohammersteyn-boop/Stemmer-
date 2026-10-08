import React, { useState, useEffect, useRef } from 'react';
import { MasterRecorderState } from '../types';
import { masterRecorderService } from '../services/masterRecorderService';
import { audioEngine } from '../services/audioEngine';
import {
  Circle,
  Square,
  Play,
  Pause,
  Download,
  RotateCcw,
  Radio,
  FileAudio,
  Sparkles,
  CheckCircle2,
  HardDrive,
  Clock,
  Volume2,
} from 'lucide-react';

interface MasterRecorderProps {
  className?: string;
  variant?: 'full' | 'compact' | 'strip';
  onLogActivity?: (category: 'RECORD', message: string, color?: string) => void;
}

export const MasterRecorder: React.FC<MasterRecorderProps> = ({
  className = '',
  variant = 'full',
  onLogActivity,
}) => {
  const [recorderState, setRecorderState] = useState<MasterRecorderState>(
    masterRecorderService.getState()
  );
  const [liveMasterLevel, setLiveMasterLevel] = useState<number>(0);
  const [showDownloadPrompt, setShowDownloadPrompt] = useState<boolean>(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const unsub = masterRecorderService.subscribe((state) => {
      setRecorderState(state);
      if (state.status === 'stopped' && state.audioUrl) {
        setShowDownloadPrompt(true);
      }
    });
    return unsub;
  }, []);

  // Live master level animation ticker for realistic VU meters during recording
  useEffect(() => {
    let animId: number;
    const updateLevel = () => {
      if (recorderState.status === 'recording') {
        const levels = audioEngine.getLevels();
        setLiveMasterLevel(levels.master);
      } else {
        setLiveMasterLevel(0);
      }
      animId = requestAnimationFrame(updateLevel);
    };

    animId = requestAnimationFrame(updateLevel);
    return () => cancelAnimationFrame(animId);
  }, [recorderState.status]);

  const handleStartRecord = () => {
    const ok = masterRecorderService.startRecording();
    if (ok) {
      setShowDownloadPrompt(false);
      onLogActivity?.('RECORD', 'Master Output Recording STARTED via MediaRecorder API', '#f43f5e');
    }
  };

  const handleStopRecord = async () => {
    const res = await masterRecorderService.stopRecording();
    if (res) {
      setShowDownloadPrompt(true);
      onLogActivity?.(
        'RECORD',
        `Master Recording STOPPED (${res.duration.toFixed(1)}s, ${(res.blob.size / 1024 / 1024).toFixed(2)} MB)`,
        '#10b981'
      );
      // Auto prompt download for immediate convenience
      masterRecorderService.downloadRecording();
    }
  };

  const handleTogglePause = () => {
    if (recorderState.status === 'recording') {
      masterRecorderService.pauseRecording();
    } else if (recorderState.status === 'paused') {
      masterRecorderService.resumeRecording();
    }
  };

  const handleDownload = () => {
    masterRecorderService.downloadRecording();
    onLogActivity?.('RECORD', 'Master Mix Audio File downloaded to user storage', '#38bdf8');
  };

  const handleReset = () => {
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
    }
    setIsPlayingPreview(false);
    setShowDownloadPrompt(false);
    masterRecorderService.resetRecording();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Compact Strip Variant (for top toolbar or embedded quick control)
  if (variant === 'strip') {
    return (
      <div className={`flex items-center gap-1.5 font-mono text-[9px] ${className}`}>
        {recorderState.status === 'idle' && (
          <button
            onClick={handleStartRecord}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#180a0e] hover:bg-[#250f16] border border-rose-500/60 hover:border-rose-400 text-rose-300 font-bold transition active:scale-95 shadow-xs cursor-pointer"
            title="Master Output Aufnahme starten (MediaRecorder)"
          >
            <Circle className="w-2.5 h-2.5 fill-rose-500 text-rose-500 animate-pulse" />
            <span>REC MASTER</span>
          </button>
        )}

        {(recorderState.status === 'recording' || recorderState.status === 'paused') && (
          <div className="flex items-center gap-1 bg-[#180a0e] border border-rose-500/80 px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.3)]">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span className="text-rose-200 font-extrabold">{recorderState.formattedTime}</span>
            <button
              onClick={handleStopRecord}
              className="ml-1 px-1.5 py-0.2 rounded bg-rose-600 hover:bg-rose-500 text-white font-black text-[8px] uppercase active:scale-90 transition cursor-pointer"
              title="Aufnahme beenden und herunterladen"
            >
              STOP & SAVE
            </button>
          </div>
        )}

        {recorderState.status === 'stopped' && recorderState.audioUrl && (
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/60 text-emerald-300 font-bold transition active:scale-95 shadow-xs cursor-pointer animate-pulse"
            title="Aufgenommenen Master Mix herunterladen"
          >
            <Download className="w-2.5 h-2.5" />
            <span>SAVE MIX ({formatFileSize(recorderState.fileSizeBytes)})</span>
          </button>
        )}
      </div>
    );
  }

  // Compact Variant (Card within FX view)
  if (variant === 'compact') {
    return (
      <div className={`p-2.5 bg-[#101015] border border-zinc-800/90 rounded-2xl select-none shadow-sm ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-rose-400" />
            <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-zinc-300">
              MASTER AUDIO RECORDER
            </span>
          </div>
          <span className="font-mono text-[8px] font-bold text-zinc-500 uppercase">
            MEDIARECORDER API
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          {recorderState.status === 'idle' ? (
            <button
              onClick={handleStartRecord}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-mono text-[10px] font-extrabold uppercase tracking-wider transition active:scale-95 shadow-[0_0_12px_rgba(244,63,94,0.4)] cursor-pointer"
            >
              <Circle className="w-3 h-3 fill-current text-white" />
              <span>START MASTER RECORDING</span>
            </button>
          ) : recorderState.status === 'recording' || recorderState.status === 'paused' ? (
            <div className="flex-1 flex items-center justify-between gap-2 bg-[#170a0e] border border-rose-500/50 p-1.5 rounded-xl">
              <div className="flex items-center gap-2 pl-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                <div className="flex flex-col">
                  <span className="font-mono text-xs font-black text-rose-200 tracking-wider">
                    {recorderState.formattedTime}
                  </span>
                  <span className="font-mono text-[7.5px] text-zinc-400">
                    {formatFileSize(recorderState.fileSizeBytes)} • CAPTURING
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleTogglePause}
                  className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition active:scale-90"
                  title={recorderState.status === 'recording' ? 'Pause' : 'Resume'}
                >
                  {recorderState.status === 'recording' ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                </button>
                <button
                  onClick={handleStopRecord}
                  className="flex items-center gap-1 py-1.5 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono text-[9px] font-bold uppercase transition active:scale-95 shadow-sm cursor-pointer"
                >
                  <Square className="w-2.5 h-2.5 fill-current" />
                  <span>STOP & SAVE</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-between gap-2 bg-emerald-950/40 border border-emerald-500/50 p-1.5 rounded-xl">
              <div className="flex items-center gap-1.5 pl-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="font-mono text-[9.5px] font-bold text-emerald-300">
                    MIX FERTIG ({recorderState.formattedTime})
                  </span>
                  <span className="font-mono text-[7.5px] text-zinc-400">
                    {formatFileSize(recorderState.fileSizeBytes)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[8.5px] font-extrabold uppercase transition active:scale-95 shadow-sm cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>DOWNLOAD</span>
                </button>
                <button
                  onClick={handleReset}
                  className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition active:scale-90"
                  title="Neu aufnehmen"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full Workstation Variant
  return (
    <div className={`flex flex-col justify-between gap-3 p-3 bg-[#0d0d12] border border-zinc-800/90 rounded-2xl select-none shadow-md ${className}`}>
      {/* 1. Header & Technical Specification */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-850">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
            <Radio className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-xs font-bold text-zinc-100 uppercase tracking-wider">
              MASTER AUDIO RECORDER
            </span>
            <span className="font-mono text-[8px] text-zinc-500 uppercase tracking-tight">
              Live Stereo Bus Capture via Browser MediaRecorder API
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-zinc-900/90 border border-zinc-800 px-2 py-0.5 rounded-lg font-mono text-[8.5px] text-zinc-400">
          <HardDrive className="w-2.5 h-2.5 text-cyan-400" />
          <span>{recorderState.mimeType.split(';')[0] || 'AUDIO/WEBM (OPUS)'}</span>
        </div>
      </div>

      {/* 2. Central Live Time Display & VU VU Peak Level Meter */}
      <div className="flex flex-col items-center justify-center py-4 px-3 bg-[#08080a] border border-zinc-900 rounded-xl relative overflow-hidden">
        {/* Glow background when recording */}
        {recorderState.status === 'recording' && (
          <div className="absolute inset-0 bg-radial from-rose-950/30 to-transparent pointer-events-none animate-pulse" />
        )}

        <div className="flex items-center gap-2 mb-2 font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
          <Clock className="w-3 h-3 text-zinc-500" />
          <span>AUFNAHME-DAUER (ELAPSED TIME)</span>
        </div>

        {/* Big Monospace Digital Timer */}
        <div className="font-mono text-4xl sm:text-5xl font-black tracking-tight text-white flex items-center gap-2 my-1">
          {recorderState.status === 'recording' && (
            <span className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,1)] animate-ping" />
          )}
          <span className={recorderState.status === 'recording' ? 'text-rose-100' : 'text-zinc-300'}>
            {recorderState.formattedTime}
          </span>
        </div>

        {/* Live Master Level VU Meter during Recording */}
        <div className="w-full max-w-xs mt-3 flex flex-col gap-1">
          <div className="flex items-center justify-between font-mono text-[8px] text-zinc-500 font-bold">
            <span>MASTER STEREO BUS IN</span>
            <span>
              {recorderState.status === 'recording'
                ? `${(liveMasterLevel * 100).toFixed(0)}% • ${formatFileSize(recorderState.fileSizeBytes)}`
                : 'BEREIT'}
            </span>
          </div>
          <div className="h-2 w-full bg-zinc-900 rounded-full border border-zinc-800 overflow-hidden flex">
            <div
              className={`h-full transition-all duration-75 rounded-full ${
                liveMasterLevel > 0.85
                  ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]'
                  : liveMasterLevel > 0.65
                  ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                  : 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]'
              }`}
              style={{ width: `${Math.min(100, liveMasterLevel * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Tactile Recording Controls */}
      <div className="flex items-center justify-center gap-2 py-1">
        {recorderState.status === 'idle' && (
          <button
            onClick={handleStartRecord}
            className="flex-1 max-w-sm py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-mono text-xs font-black uppercase tracking-wider transition active:scale-95 shadow-[0_0_20px_rgba(244,63,94,0.4)] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Circle className="w-4 h-4 fill-current text-white animate-pulse" />
            <span>● MASTER AUFNAHME STARTEN</span>
          </button>
        )}

        {(recorderState.status === 'recording' || recorderState.status === 'paused') && (
          <div className="flex-1 flex items-center justify-center gap-2 max-w-md">
            <button
              onClick={handleTogglePause}
              className="py-2.5 px-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 font-mono text-xs font-bold uppercase transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              {recorderState.status === 'recording' ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>PAUSE</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WEITER</span>
                </>
              )}
            </button>

            <button
              onClick={handleStopRecord}
              className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-black uppercase tracking-wider transition active:scale-95 shadow-[0_0_15px_rgba(244,63,94,0.5)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>⏹ AUFNAHME BEENDEN & SPEICHERN</span>
            </button>
          </div>
        )}

        {recorderState.status === 'stopped' && (
          <div className="flex-1 flex items-center justify-center gap-2 max-w-md">
            <button
              onClick={handleDownload}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono text-xs font-black uppercase tracking-wider transition active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>DATEI HERUNTERLADEN ({formatFileSize(recorderState.fileSizeBytes)})</span>
            </button>

            <button
              onClick={handleReset}
              className="py-3 px-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition active:scale-95 cursor-pointer"
              title="Neu aufnehmen"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 4. Download Prompt & Audio Preview Card (when recording is finished) */}
      {showDownloadPrompt && recorderState.audioUrl && (
        <div className="p-3 bg-[#0a1411] border border-emerald-500/60 rounded-xl flex flex-col gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-emerald-300 font-mono text-xs font-black uppercase tracking-tight">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>AUFNAHME ERFOLGREICH ABGESCHLOSSEN</span>
            </div>
            <span className="font-mono text-[9px] text-zinc-400">
              {formatFileSize(recorderState.fileSizeBytes)}
            </span>
          </div>

          <p className="font-sans text-[11px] text-zinc-300 leading-tight">
            Dein Master Live-Mix wurde über die MediaRecorder API als Stereo-Audiodatei gerendert. Du kannst ihn sofort probehören oder auf deinem Gerät abspeichern:
          </p>

          {/* Embedded Audio Preview Player */}
          <div className="bg-zinc-950/90 border border-zinc-800 rounded-lg p-2 flex flex-col gap-1.5">
            <audio
              ref={audioPreviewRef}
              src={recorderState.audioUrl}
              controls
              className="w-full h-8 accent-emerald-500"
              onPlay={() => setIsPlayingPreview(true)}
              onPause={() => setIsPlayingPreview(false)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={handleReset}
              className="px-2.5 py-1.5 rounded-lg font-mono text-[9px] text-zinc-400 hover:text-zinc-200 uppercase tracking-wider transition"
            >
              VERWERFEN / NEU
            </button>

            <button
              onClick={handleDownload}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition active:scale-95 shadow-md cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JETZT HERUNTERLADEN</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. Helpful DJ Recording Tips Footer */}
      <div className="flex items-center justify-between font-mono text-[8px] text-zinc-500 border-t border-zinc-900 pt-1.5">
        <span className="flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-amber-400" />
          Nimmt alle 4 Stems, Crossfader, Live FX & Master EQ in Studioqualität auf
        </span>
        <span>BROWSER DIRECT CAPTURE</span>
      </div>
    </div>
  );
};
