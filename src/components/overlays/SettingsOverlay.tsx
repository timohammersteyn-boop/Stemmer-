import React, { useState, useEffect } from 'react';
import { AppSettings, MidiActionId, MidiBinding } from '../../types';
import {
  ChevronLeft,
  X,
  ChevronRight,
  Volume2,
  Grid,
  Layers,
  Monitor,
  HardDrive,
  Download,
  CheckCircle2,
  Activity,
  Plus,
  Minus,
  SlidersHorizontal,
  Cable,
  Radio,
  RefreshCw,
  Sliders,
  Check,
  RotateCcw,
  GraduationCap,
  Keyboard,
} from 'lucide-react';
import { FlatKnob } from '../FlatKnob';
import { midiService } from '../../services/midiService';
import { MASTER_EQ_PRESETS } from '../../constants';
import { HelpShortcutsOverlay } from './HelpShortcutsOverlay';

interface SettingsOverlayProps {
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
  onClose: () => void;
  isInstallable: boolean;
  isInstalled: boolean;
  onInstallPwa: () => void;
  bpm: number;
  onUpdateBpm: (newBpm: number) => void;
  onTapTempo?: () => void;
  tapActive?: boolean;
  onOpenManual?: () => void;
  onOpenMidiLearn?: () => void;
  onOpenShortcuts?: () => void;
}

export const SettingsOverlay: React.FC<SettingsOverlayProps> = ({
  settings,
  onUpdateSettings,
  onClose,
  isInstallable,
  isInstalled,
  onInstallPwa,
  bpm,
  onUpdateBpm,
  onTapTempo,
  tapActive = false,
  onOpenManual,
  onOpenMidiLearn,
  onOpenShortcuts,
}) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // --- MIDI Hardware Controller State ---
  const [midiDevices, setMidiDevices] = useState(midiService.getDevices());
  const [midiBindings, setMidiBindings] = useState(midiService.getBindings());
  const [learningActionId, setLearningActionId] = useState<MidiActionId | null>(
    midiService.getLearningActionId()
  );
  const [lastMidiMsg, setLastMidiMsg] = useState(midiService.getLastMessage());
  const [midiFilterCat, setMidiFilterCat] = useState<
    'ALL' | 'TRANSPORT' | 'FADERS' | 'MUTES' | 'PADS' | 'BANKS' | 'FX'
  >('ALL');
  const [isRefreshingMidi, setIsRefreshingMidi] = useState(false);

  useEffect(() => {
    const unsub = midiService.subscribe(() => {
      setMidiDevices(midiService.getDevices());
      setMidiBindings(midiService.getBindings());
      setLearningActionId(midiService.getLearningActionId());
      setLastMidiMsg(midiService.getLastMessage());
    });
    return unsub;
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#09090c] flex flex-col p-4 select-none animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
        <button
          onClick={activeSection ? () => setActiveSection(null) : onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <span className="font-mono text-xs font-bold tracking-[0.2em] uppercase text-zinc-200">
          {activeSection ? activeSection : 'SETTINGS'}
        </span>

        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Settings Navigation List / Detail */}
      <div className="flex-1 overflow-y-auto py-3 space-y-2">
        {!activeSection ? (
          <>
            {/* User Manual & Onboarding School */}
            <div
              onClick={() => {
                if (onOpenManual) {
                  onOpenManual();
                } else {
                  setActiveSection('USER MANUAL & ONBOARDING SCHOOL');
                }
              }}
              className="p-3.5 rounded-2xl bg-gradient-to-r from-[#171720] to-[#1a1520] border border-rose-500/40 hover:border-rose-500/70 flex items-center justify-between cursor-pointer transition shadow-md group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 group-hover:scale-105 transition">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-tech font-bold text-sm text-zinc-100 block">
                      User Manual & Onboarding School
                    </span>
                    <span className="font-mono text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.2 rounded font-bold uppercase">
                      6 LEKTIONEN
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-zinc-400 block">
                    Interaktiver DJ-Kurs, Traktor X1 Guide & Referenz
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-rose-400/70 group-hover:text-rose-400 transition" />
            </div>

            {/* Tempo & BPM Clock */}
            <div
              onClick={() => setActiveSection('TEMPO & MASTER CLOCK')}
              className="p-3.5 rounded-2xl bg-[#121217] border border-zinc-800/80 hover:border-zinc-700 flex items-center justify-between cursor-pointer transition shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-tech font-bold text-sm text-zinc-100 block">Tempo & Master Clock</span>
                    <span className="font-mono text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1 rounded font-bold">
                      {bpm.toFixed(1)} BPM
                    </span>
                    <span
                      className={`font-mono text-[8px] px-1.5 py-0.2 rounded font-bold border transition ${
                        settings.autoBpm
                          ? 'bg-cyan-950/70 text-cyan-300 border-cyan-500/40 shadow-xs'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700/60'
                      }`}
                    >
                      {settings.autoBpm ? 'AUTO-BPM ON' : 'MANUELL'}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-zinc-400 block">
                    Auto-BPM Tracking, Tap Tempo, Manuelle BPM Eingabe, Sync
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateSettings({ autoBpm: !settings.autoBpm });
                  }}
                  className={`relative w-10 h-5 rounded-full transition-colors flex items-center px-0.5 border ${
                    settings.autoBpm
                      ? 'bg-cyan-950 border-cyan-500/80 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                      : 'bg-zinc-900 border-zinc-700'
                  }`}
                  title="Auto-BPM Modus umschalten"
                  aria-label="Toggle Auto-BPM"
                >
                  <div
                    className={`w-4 h-4 rounded-full transition-transform ${
                      settings.autoBpm
                        ? 'translate-x-5 bg-cyan-400'
                        : 'translate-x-0 bg-zinc-600'
                    }`}
                  />
                </button>
                <ChevronRight className="w-5 h-5 text-zinc-600" />
              </div>
            </div>

            {/* Audio & Output */}
            <div
              onClick={() => setActiveSection('AUDIO & OUTPUT')}
              className="p-3.5 rounded-2xl bg-[#121217] border border-zinc-800/80 hover:border-zinc-700 flex items-center justify-between cursor-pointer transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-tech font-bold text-sm text-zinc-100 block">Audio & Output</span>
                    <span className="font-mono text-[9px] bg-zinc-800 text-rose-300 border border-zinc-700/80 px-1.5 py-0.2 rounded font-bold uppercase">
                      {settings.faderCurve || 'Linear'}
                    </span>
                    <span className={`font-mono text-[9px] px-1.5 py-0.2 rounded font-bold uppercase border ${
                      settings.uiSounds
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                    }`}>
                      {settings.uiSounds ? 'SOUNDS: AN' : 'SOUNDS: AUS'}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-zinc-500 block">Fader-Kurve, Latenz, Limiter, UI-Sounds</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-600" />
            </div>

            {/* Master Output EQ */}
            <div
              onClick={() => setActiveSection('MASTER OUTPUT EQ')}
              className="p-3.5 rounded-2xl bg-[#121217] border border-zinc-800/80 hover:border-zinc-700 flex items-center justify-between cursor-pointer transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-tech font-bold text-sm text-zinc-100 block">Master EQ</span>
                    <span className="font-mono text-[9px] bg-zinc-800 text-zinc-300 px-1 rounded">
                      {settings.masterEq.low === 0 && settings.masterEq.mid === 0 && settings.masterEq.high === 0
                        ? 'FLAT'
                        : `${settings.masterEq.low > 0 ? '+' : ''}${settings.masterEq.low} / ${settings.masterEq.mid > 0 ? '+' : ''}${settings.masterEq.mid} / ${settings.masterEq.high > 0 ? '+' : ''}${settings.masterEq.high}`}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-zinc-500 block">Globale 3-Band Frequenz-Shelves vor Masterstufe</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-600" />
            </div>

            {/* Pads & Performance */}
            <div
              onClick={() => setActiveSection('PADS & PERFORMANCE')}
              className="p-3.5 rounded-2xl bg-[#121217] border border-zinc-800/80 hover:border-zinc-700 flex items-center justify-between cursor-pointer transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                  <Grid className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-tech font-bold text-sm text-zinc-100 block">Pads & Performance</span>
                  <span className="font-mono text-[10px] text-zinc-500 block">Farben, Empfindlichkeit, Quantize</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-600" />
            </div>

            {/* MIDI & Hardware Controller */}
            <div
              onClick={() => setActiveSection('MIDI & HARDWARE CONTROLLER')}
              className="p-3.5 rounded-2xl bg-[#121217] border border-amber-500/30 hover:border-amber-500/50 flex items-center justify-between cursor-pointer transition shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Cable className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-tech font-bold text-sm text-zinc-100 block">
                      MIDI & Hardware Controller
                    </span>
                    <span className="font-mono text-[9px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-1 rounded font-bold">
                      {midiDevices.length} {midiDevices.length === 1 ? 'GERÄT' : 'GERÄTE'}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-zinc-400 block">
                    Traktor Kontrol F1, MIDI Learn, Fader & Pad Mappings
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-600" />
            </div>

            {/* Stems & Analyse */}
            <div
              onClick={() => setActiveSection('STEMS & ANALYSE')}
              className="p-3.5 rounded-2xl bg-[#121217] border border-zinc-800/80 hover:border-zinc-700 flex items-center justify-between cursor-pointer transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-tech font-bold text-sm text-zinc-100 block">Stems & Analyse</span>
                  <span className="font-mono text-[10px] text-zinc-500 block">KI-Analyse, Trennung, Qualität</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-600" />
            </div>

            {/* UI & Anzeige */}
            <div
              onClick={() => setActiveSection('UI & ANZEIGE')}
              className="p-3.5 rounded-2xl bg-[#121217] border border-zinc-800/80 hover:border-zinc-700 flex items-center justify-between cursor-pointer transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-tech font-bold text-sm text-zinc-100 block">UI & Anzeige</span>
                  <span className="font-mono text-[10px] text-zinc-500 block">Hardware Mode, Theme, Glyphen</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-600" />
            </div>

            {/* PWA & Installation */}
            <div
              onClick={() => setActiveSection('PWA & OFFLINE')}
              className="p-3.5 rounded-2xl bg-[#121217] border border-rose-500/30 hover:border-rose-500/50 flex items-center justify-between cursor-pointer transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-tech font-bold text-sm text-zinc-100 block">PWA & Offline Modus</span>
                  <span className="font-mono text-[10px] text-zinc-400 block">
                    {isInstalled ? 'Bereits als App installiert' : 'App auf Homescreen installieren'}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-600" />
            </div>

            {/* Keyboard & MIDI Shortcuts / Help */}
            <div
              onClick={() => setActiveSection('KEYBOARD & MIDI SHORTCUTS')}
              className="p-3.5 rounded-2xl bg-[#121217] border border-cyan-500/40 hover:border-cyan-500/70 flex items-center justify-between cursor-pointer transition shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Keyboard className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-tech font-bold text-sm text-zinc-100 block">
                      Tastaturkürzel & MIDI Help
                    </span>
                    <span className="font-mono text-[9px] bg-cyan-400 text-zinc-950 px-1.5 py-0.2 rounded font-black uppercase">
                      HUD
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-zinc-400 block">
                    Visuelle Übersicht aller aktiven Tastenbefehle & Hardware-Belegungen
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-600" />
            </div>

            {/* Backup & Daten */}
            <div
              onClick={() => setActiveSection('BACKUP & DATEN')}
              className="p-3.5 rounded-2xl bg-[#121217] border border-zinc-800/80 hover:border-zinc-700 flex items-center justify-between cursor-pointer transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-tech font-bold text-sm text-zinc-100 block">Backup & Daten</span>
                  <span className="font-mono text-[10px] text-zinc-500 block">Tracks, Playlists, Einstellungen</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-600" />
            </div>
          </>
        ) : (
          /* Active Section Content */
          <div className="space-y-4">
            {activeSection === 'TEMPO & MASTER CLOCK' && (
              <div className="space-y-3">
                {/* BPM Direct Input Card */}
                <div className="p-4 bg-[#121217] rounded-2xl border border-zinc-800 text-center">
                  <span className="font-mono text-[10px] uppercase font-bold text-zinc-400 tracking-wider block mb-2">
                    MASTER CLOCK BPM EINGABE
                  </span>

                  {/* Large Input Field */}
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <input
                      type="number"
                      step="0.1"
                      min="40"
                      max="240"
                      value={bpm}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val >= 30 && val <= 300) {
                          onUpdateBpm(Math.round(val * 10) / 10);
                        }
                      }}
                      className="font-mono text-4xl font-extrabold text-zinc-100 bg-zinc-900/90 border border-zinc-700/80 rounded-xl px-4 py-2 w-44 text-center focus:outline-none focus:border-rose-500 transition shadow-inner"
                    />
                    <span className="font-mono text-sm font-bold text-zinc-400">BPM</span>
                  </div>

                  {/* Nudge Steppers */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    <button
                      onClick={() => onUpdateBpm(Math.max(40, Math.round((bpm - 1.0) * 10) / 10))}
                      className="py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-xs font-bold hover:text-white hover:bg-zinc-800 active:scale-95 transition"
                    >
                      -1.0
                    </button>
                    <button
                      onClick={() => onUpdateBpm(Math.max(40, Math.round((bpm - 0.1) * 10) / 10))}
                      className="py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-xs font-bold hover:text-white hover:bg-zinc-800 active:scale-95 transition"
                    >
                      -0.1
                    </button>
                    <button
                      onClick={() => onUpdateBpm(Math.min(240, Math.round((bpm + 0.1) * 10) / 10))}
                      className="py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-xs font-bold hover:text-white hover:bg-zinc-800 active:scale-95 transition"
                    >
                      +0.1
                    </button>
                    <button
                      onClick={() => onUpdateBpm(Math.min(240, Math.round((bpm + 1.0) * 10) / 10))}
                      className="py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-xs font-bold hover:text-white hover:bg-zinc-800 active:scale-95 transition"
                    >
                      +1.0
                    </button>
                  </div>

                  {/* Smooth Range Slider */}
                  <div className="px-2 mb-3">
                    <input
                      type="range"
                      min="60"
                      max="180"
                      step="0.5"
                      value={bpm}
                      onChange={(e) => onUpdateBpm(parseFloat(e.target.value))}
                      className="w-full accent-rose-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between font-mono text-[9px] text-zinc-500 mt-1">
                      <span>60 BPM</span>
                      <span>120 BPM</span>
                      <span>180 BPM</span>
                    </div>
                  </div>
                </div>

                {/* Auto-BPM Mode Card (Automatic Audio Tempo Tracking & Sync) */}
                <div className="p-3.5 bg-[#121217] rounded-xl border border-zinc-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          settings.autoBpm
                            ? 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,1)] animate-pulse'
                            : 'bg-zinc-600'
                        }`}
                      />
                      <span className="font-mono text-xs font-bold text-zinc-100 block uppercase">
                        AUTO-BPM MODUS (AUDIO TEMPO-TRACKING)
                      </span>
                    </div>

                    {/* Tactile Toggle Switch */}
                    <button
                      onClick={() => onUpdateSettings({ autoBpm: !settings.autoBpm })}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-200 flex items-center px-0.5 border ${
                        settings.autoBpm
                          ? 'bg-cyan-950 border-cyan-500/80 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                          : 'bg-zinc-900 border-zinc-700'
                      }`}
                      aria-label="Toggle Auto-BPM Mode"
                    >
                      <div
                        className={`w-5 h-5 rounded-full transition-transform duration-200 flex items-center justify-center ${
                          settings.autoBpm
                            ? 'translate-x-6 bg-cyan-400 shadow-md'
                            : 'translate-x-0 bg-zinc-600'
                        }`}
                      />
                    </button>
                  </div>

                  <p className="font-mono text-[9.5px] text-zinc-400 leading-relaxed">
                    Verfolgt das Tempo eingehender Audiosignale kontinuierlich über Transienten- und Onset-Analyse. Passt die Master-BPM automatisch für nahtlosen Beat-Sync an, ohne manuelles Tippen.
                  </p>

                  <div className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-black/40 border border-zinc-800 text-[9px] font-mono">
                    <span className="text-zinc-500">LIVE TRACKING STATUS:</span>
                    <span
                      className={`font-bold flex items-center gap-1.5 ${
                        settings.autoBpm ? 'text-cyan-300' : 'text-zinc-500'
                      }`}
                    >
                      {settings.autoBpm ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                          <span>LOCKED & SYNCED • {bpm.toFixed(1)} BPM</span>
                        </>
                      ) : (
                        <span>MANUELLER MODUS (TAP TEMPO)</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Big Interactive Tap Tempo Trigger Button */}
                {onTapTempo && (
                  <div className="p-4 bg-[#121217] rounded-2xl border border-zinc-800 text-center">
                    <button
                      onClick={onTapTempo}
                      className={`w-full py-5 rounded-xl font-mono text-sm font-extrabold tracking-widest uppercase transition-all duration-75 active:scale-95 border select-none ${
                        tapActive
                          ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.9)] scale-[0.98]'
                          : 'bg-zinc-900 text-zinc-200 border-zinc-700 hover:bg-zinc-800 hover:text-white'
                      }`}
                    >
                      TAP TEMPO
                    </button>
                    <span className="font-mono text-[10px] text-zinc-500 block mt-2">
                      Tippe mindestens 3-mal im Takt deines Beats, um das Tempo anzugleichen.
                    </span>
                  </div>
                )}

                {/* Multipliers & Presets */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => onUpdateBpm(Math.max(40, Math.round((bpm / 2) * 10) / 10))}
                    className="py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 font-mono text-xs font-bold active:scale-95 transition"
                  >
                    HALB (÷2)
                  </button>
                  <button
                    onClick={() => onUpdateBpm(128.0)}
                    className="py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 font-mono text-xs font-bold active:scale-95 transition"
                  >
                    RESET 128
                  </button>
                  <button
                    onClick={() => onUpdateBpm(Math.min(240, Math.round((bpm * 2) * 10) / 10))}
                    className="py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 font-mono text-xs font-bold active:scale-95 transition"
                  >
                    DOPPEL (×2)
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'MASTER OUTPUT EQ' && (
              <div className="space-y-4">
                {/* 3-Band Master Shelf Curve SVG Visualizer */}
                <div className="relative w-full h-44 bg-[#111115] rounded-2xl border border-zinc-800 p-3 overflow-hidden shadow-inner">
                  {/* dB Scale */}
                  <div className="absolute left-3 inset-y-3 flex flex-col justify-between font-mono text-[9px] text-zinc-500 pointer-events-none select-none z-10">
                    <span className="text-zinc-400 font-semibold">+12 dB</span>
                    <span className="text-zinc-500">0 dB</span>
                    <span className="text-zinc-600">-12 dB</span>
                  </div>

                  {/* Frequency Labels */}
                  <div className="absolute inset-x-12 bottom-1.5 flex justify-between font-mono text-[8px] text-zinc-600 pointer-events-none select-none z-10">
                    <span>20 Hz</span>
                    <span>100 Hz (LOW)</span>
                    <span>1.2 kHz (MID)</span>
                    <span>8 kHz (HIGH)</span>
                    <span>20 kHz</span>
                  </div>

                  {/* Center 0 dB dashed reference */}
                  <div className="absolute left-12 right-4 top-[50%] border-b border-zinc-800/80 border-dashed pointer-events-none" />

                  {/* SVG Master Response Curve */}
                  {(() => {
                    const lowDb = settings.masterEq.low;
                    const midDb = settings.masterEq.mid;
                    const highDb = settings.masterEq.high;

                    const lowY = 70 - (lowDb / 12) * 55;
                    const midY = 70 - (midDb / 12) * 55;
                    const highY = 70 - (highDb / 12) * 55;

                    return (
                      <svg className="w-full h-full pl-8 pb-3 pt-4" viewBox="0 0 320 140" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="masterEqGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f4f4f5" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#f4f4f5" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Filled Area */}
                        <path
                          d={`M 0,${lowY} C 40,${lowY} 110,${midY} 160,${midY} C 210,${midY} 270,${highY} 320,${highY} L 320,140 L 0,140 Z`}
                          fill="url(#masterEqGrad)"
                          opacity="0.7"
                        />

                        {/* Master EQ Curve */}
                        <path
                          d={`M 0,${lowY} C 40,${lowY} 110,${midY} 160,${midY} C 210,${midY} 270,${highY} 320,${highY}`}
                          fill="none"
                          stroke="#f4f4f5"
                          strokeWidth="3"
                        />

                        {/* Center Nodes */}
                        <circle cx="50" cy={lowY} r="5.5" fill="#18181b" stroke="#f4f4f5" strokeWidth="2.5" />
                        <circle cx="160" cy={midY} r="6.5" fill="#18181b" stroke="#f4f4f5" strokeWidth="3" />
                        <circle cx="270" cy={highY} r="5.5" fill="#18181b" stroke="#f4f4f5" strokeWidth="2.5" />
                      </svg>
                    );
                  })()}
                </div>

                {/* 3 Master Frequency Controls */}
                <div className="grid grid-cols-3 gap-3">
                  {/* LOW SHELF */}
                  <div className="flex flex-col items-center bg-[#131318] p-3 rounded-2xl border border-zinc-800">
                    <FlatKnob
                      value={Math.round(settings.masterEq.low + 12)}
                      min={0}
                      max={24}
                      onChange={(v) => {
                        const newLow = v - 12;
                        const newEq = { ...settings.masterEq, low: newLow };
                        const matched = MASTER_EQ_PRESETS.find(
                          (p) => p.eq.low === newEq.low && p.eq.mid === newEq.mid && p.eq.high === newEq.high
                        );
                        onUpdateSettings({
                          masterEq: newEq,
                          masterEqPreset: matched ? matched.name : 'Custom',
                        });
                      }}
                      size="md"
                      accentColor="#f4f4f5"
                    />
                    <span className="font-mono text-[10px] font-bold text-zinc-400 mt-2 uppercase">LOW SHELF</span>
                    <span className="font-mono text-xs font-bold text-zinc-100">
                      {settings.masterEq.low > 0 ? `+${settings.masterEq.low.toFixed(1)}` : settings.masterEq.low.toFixed(1)} dB
                    </span>
                    <span className="font-mono text-[8px] text-zinc-500">100 Hz</span>
                  </div>

                  {/* MID BELL */}
                  <div className="flex flex-col items-center bg-[#131318] p-3 rounded-2xl border border-zinc-800">
                    <FlatKnob
                      value={Math.round(settings.masterEq.mid + 12)}
                      min={0}
                      max={24}
                      onChange={(v) => {
                        const newMid = v - 12;
                        const newEq = { ...settings.masterEq, mid: newMid };
                        const matched = MASTER_EQ_PRESETS.find(
                          (p) => p.eq.low === newEq.low && p.eq.mid === newEq.mid && p.eq.high === newEq.high
                        );
                        onUpdateSettings({
                          masterEq: newEq,
                          masterEqPreset: matched ? matched.name : 'Custom',
                        });
                      }}
                      size="md"
                      accentColor="#38bdf8"
                    />
                    <span className="font-mono text-[10px] font-bold text-zinc-400 mt-2 uppercase">MID BELL</span>
                    <span className="font-mono text-xs font-bold text-zinc-100">
                      {settings.masterEq.mid > 0 ? `+${settings.masterEq.mid.toFixed(1)}` : settings.masterEq.mid.toFixed(1)} dB
                    </span>
                    <span className="font-mono text-[8px] text-zinc-500">1.2 kHz</span>
                  </div>

                  {/* HIGH SHELF */}
                  <div className="flex flex-col items-center bg-[#131318] p-3 rounded-2xl border border-zinc-800">
                    <FlatKnob
                      value={Math.round(settings.masterEq.high + 12)}
                      min={0}
                      max={24}
                      onChange={(v) => {
                        const newHigh = v - 12;
                        const newEq = { ...settings.masterEq, high: newHigh };
                        const matched = MASTER_EQ_PRESETS.find(
                          (p) => p.eq.low === newEq.low && p.eq.mid === newEq.mid && p.eq.high === newEq.high
                        );
                        onUpdateSettings({
                          masterEq: newEq,
                          masterEqPreset: matched ? matched.name : 'Custom',
                        });
                      }}
                      size="md"
                      accentColor="#4ade80"
                    />
                    <span className="font-mono text-[10px] font-bold text-zinc-400 mt-2 uppercase">HIGH SHELF</span>
                    <span className="font-mono text-xs font-bold text-zinc-100">
                      {settings.masterEq.high > 0 ? `+${settings.masterEq.high.toFixed(1)}` : settings.masterEq.high.toFixed(1)} dB
                    </span>
                    <span className="font-mono text-[8px] text-zinc-500">8.0 kHz</span>
                  </div>
                </div>

                {/* Master Sound Shaping Presets */}
                <div className="p-3.5 bg-[#121217] rounded-xl border border-zinc-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-zinc-300 block uppercase">
                      MASTER EQ PRESETS
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-mono text-[9px] font-bold uppercase">
                        {settings.masterEqPreset || 'Club'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {MASTER_EQ_PRESETS.map((preset) => {
                      const isSelected = settings.masterEqPreset === preset.name;

                      return (
                        <button
                          key={preset.id}
                          onClick={() =>
                            onUpdateSettings({
                              masterEq: { ...preset.eq },
                              masterEqPreset: preset.name,
                            })
                          }
                          className={`p-2.5 rounded-xl font-mono text-left transition active:scale-[0.98] border flex flex-col justify-between ${
                            isSelected
                              ? 'bg-cyan-950/40 border-cyan-500/80 text-white shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                              : 'bg-zinc-900/90 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-850'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold tracking-wider uppercase text-zinc-100 flex items-center gap-1.5">
                              {isSelected && (
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,1)]" />
                              )}
                              {preset.name}
                            </span>
                            {isSelected && (
                              <span className="text-[8px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded font-bold border border-cyan-500/40">
                                ACTIVE
                              </span>
                            )}
                          </div>

                          <p className="text-[9px] text-zinc-500 line-clamp-1 mb-1.5">
                            {preset.description}
                          </p>

                          <div className="flex items-center gap-2 text-[8px] font-mono text-zinc-400 bg-black/40 px-2 py-0.5 rounded-md self-start border border-zinc-800/60">
                            <span>LOW: <strong className={preset.eq.low !== 0 ? 'text-zinc-200' : 'text-zinc-500'}>{preset.eq.low > 0 ? `+${preset.eq.low}` : preset.eq.low} dB</strong></span>
                            <span>•</span>
                            <span>MID: <strong className={preset.eq.mid !== 0 ? 'text-zinc-200' : 'text-zinc-500'}>{preset.eq.mid > 0 ? `+${preset.eq.mid}` : preset.eq.mid} dB</strong></span>
                            <span>•</span>
                            <span>HIGH: <strong className={preset.eq.high !== 0 ? 'text-zinc-200' : 'text-zinc-500'}>{preset.eq.high > 0 ? `+${preset.eq.high}` : preset.eq.high} dB</strong></span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'AUDIO & OUTPUT' && (
              <div className="space-y-3.5">
                {/* 1. Fader Curve Selection Module */}
                <div className="p-4 bg-[#121217] rounded-2xl border border-zinc-800 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-tech font-bold text-sm text-zinc-100 block">
                        Fader Curve (Lautstärkekurve)
                      </span>
                      <span className="font-mono text-[10px] text-zinc-500 block">
                        Akustische Kennlinie der 4 Stem-Lautstärkeregler
                      </span>
                    </div>
                    <span className="font-mono text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full font-bold uppercase">
                      {settings.faderCurve || 'Linear'}
                    </span>
                  </div>

                  {/* 3 Curve Selector Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    {(['Linear', 'Exponential', 'Constant Power'] as const).map((curve) => {
                      const isSelected = (settings.faderCurve || 'Linear') === curve;
                      return (
                        <button
                          key={curve}
                          onClick={() => onUpdateSettings({ faderCurve: curve })}
                          className={`py-2.5 px-2 rounded-xl font-mono text-[10px] font-bold transition active:scale-95 border flex flex-col items-center justify-center gap-1 ${
                            isSelected
                              ? 'bg-zinc-100 text-zinc-950 border-white shadow-md'
                              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-850'
                          }`}
                        >
                          <span className="leading-tight text-center">{curve}</span>
                          <span className={`text-[8px] font-mono ${isSelected ? 'text-zinc-600' : 'text-zinc-500'}`}>
                            {curve === 'Linear' ? '1:1 Direct' : curve === 'Exponential' ? 'Log Audio' : 'Equal Power'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Visual SVG Curve Graph in Nothing Style */}
                  <div className="relative w-full h-32 bg-[#0c0c0f] rounded-xl border border-zinc-800/90 p-2 overflow-hidden flex flex-col justify-between">
                    <div className="flex justify-between items-center text-[8px] font-mono text-zinc-500 px-1 z-10 pointer-events-none">
                      <span>OUT: 100% (0 dB)</span>
                      <span className="text-zinc-400 font-bold uppercase">{settings.faderCurve || 'Linear'} CHARAKTERISTIK</span>
                    </div>

                    {/* SVG Transfer Function Curve */}
                    <svg className="w-full h-20 px-2" viewBox="0 0 200 80" preserveAspectRatio="none">
                      {/* Grid lines */}
                      <line x1="0" y1="40" x2="200" y2="40" stroke="#27272a" strokeDasharray="3,3" strokeWidth="1" />
                      <line x1="100" y1="0" x2="100" y2="80" stroke="#27272a" strokeDasharray="3,3" strokeWidth="1" />

                      {/* Reference line */}
                      <line x1="0" y1="80" x2="200" y2="0" stroke="#3f3f46" strokeDasharray="2,2" strokeWidth="1" opacity="0.4" />

                      {/* Active Transfer Curve */}
                      {(() => {
                        const activeMode = settings.faderCurve || 'Linear';
                        let pathD = '';
                        if (activeMode === 'Linear') {
                          pathD = 'M 0,80 L 200,0';
                        } else if (activeMode === 'Exponential') {
                          // Exponential / Log taper curve (slower bottom, faster top)
                          pathD = 'M 0,80 C 80,80 140,50 200,0';
                        } else {
                          // Constant power sinusoidal curve (higher mid energy)
                          pathD = 'M 0,80 C 40,25 110,5 200,0';
                        }

                        return (
                          <>
                            <path
                              d={`${pathD} L 200,80 L 0,80 Z`}
                              fill="rgba(244, 63, 94, 0.12)"
                            />
                            <path
                              d={pathD}
                              fill="none"
                              stroke="#f43f5e"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            />
                            {/* Midpoint Node */}
                            <circle
                              cx="100"
                              cy={activeMode === 'Linear' ? 40 : activeMode === 'Exponential' ? 62 : 23}
                              r="4"
                              fill="#18181b"
                              stroke="#f43f5e"
                              strokeWidth="2"
                            />
                          </>
                        );
                      })()}
                    </svg>

                    <div className="flex justify-between items-center text-[8px] font-mono text-zinc-500 px-1 z-10 pointer-events-none">
                      <span>FADER: 0% (-∞ dB)</span>
                      <span className="text-rose-400 font-bold">
                        {(settings.faderCurve || 'Linear') === 'Linear'
                          ? 'Mitte: 50% (-6.0 dB)'
                          : (settings.faderCurve || 'Linear') === 'Exponential'
                          ? 'Mitte: 22% (-13.1 dB)'
                          : 'Mitte: 71% (-3.0 dB CONST PWR)'}
                      </span>
                      <span>FADER: 100%</span>
                    </div>
                  </div>

                  {/* Informative Description Card */}
                  <div className="p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800/80 text-[10px] font-mono leading-relaxed text-zinc-300">
                    {(settings.faderCurve || 'Linear') === 'Linear' && (
                      <p>
                        <strong className="text-white">Linear:</strong> Direkte proportionale 1:1 Pegelsteuerung. Ideal für präzises manuelles Pegeln und gleichmäßigen Lautstärkeverlauf über den gesamten Faderweg.
                      </p>
                    )}
                    {(settings.faderCurve || 'Linear') === 'Exponential' && (
                      <p>
                        <strong className="text-white">Exponential:</strong> Logarithmische Audio-Charakteristik nach klassischem Mischpult-Vorbild. Bietet extrem feinfühlige Auflösung im leisen Bereich (-48 bis -12 dB) und schnellen Punch im oberen Drittel.
                      </p>
                    )}
                    {(settings.faderCurve || 'Linear') === 'Constant Power' && (
                      <p>
                        <strong className="text-white">Constant Power:</strong> Equal-Power Sinus-Kennlinie [sin(p · π/2)]. Hält die akustische Summenenergie beim Mischen und Überblenden konstant, ohne Lautstärkeeinbrüche im Mittenbereich.
                      </p>
                    )}
                  </div>
                </div>

                {/* 2. Latenz Puffer Module */}
                <div className="p-3.5 bg-[#121217] rounded-xl border border-zinc-800">
                  <span className="font-mono text-xs font-bold text-zinc-300 block mb-2 uppercase">Latenz Puffer</span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['LOW (128)', 'MED (256)', 'SAFE (512)'] as const).map((l) => (
                      <button
                        key={l}
                        onClick={() => onUpdateSettings({ latency: l })}
                        className={`py-2 rounded-lg font-mono text-[10px] font-bold border transition active:scale-95 ${
                          settings.latency === l ? 'bg-zinc-100 text-zinc-950 border-white' : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Master Limiter Module */}
                <div className="p-3.5 bg-[#121217] rounded-xl border border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="font-tech font-bold text-sm text-zinc-100 block">Master Limiter</span>
                    <span className="font-mono text-[10px] text-zinc-500 block">Verhindert digitales Clipping bei +0dB</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.masterLimiter}
                    onChange={(e) => onUpdateSettings({ masterLimiter: e.target.checked })}
                    className="w-5 h-5 accent-rose-500 cursor-pointer"
                  />
                </div>

                {/* 4. UI Sounds Toggle Module */}
                <div className="p-3.5 bg-[#121217] rounded-xl border border-zinc-800 flex items-center justify-between">
                  <div className="pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-tech font-bold text-sm text-zinc-100 block">UI SOUNDS</span>
                      <span className={`font-mono text-[9px] px-1.5 py-0.2 rounded font-bold uppercase border ${
                        settings.uiSounds
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                      }`}>
                        {settings.uiSounds ? 'AKTIV' : 'STUMM'}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-zinc-500 block mt-0.5">
                      Button-Interaktionssounds und Pad-Audition-Töne (Blip-Sounds) global aktivieren oder stummschalten
                    </span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.uiSounds}
                    onClick={() => onUpdateSettings({ uiSounds: !settings.uiSounds })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      settings.uiSounds ? 'bg-rose-500' : 'bg-zinc-700'
                    }`}
                    aria-label="Toggle UI Sounds"
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        settings.uiSounds ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'PADS & PERFORMANCE' && (
              <div className="space-y-3">
                <div className="p-3.5 bg-[#121217] rounded-xl border border-zinc-800">
                  <span className="font-mono text-xs font-bold text-zinc-300 block mb-2 uppercase">Pad Quantisierung</span>
                  <div className="grid grid-cols-4 gap-2">
                    {(['1/16', '1/8', '1/4', 'OFF'] as const).map((q) => (
                      <button
                        key={q}
                        onClick={() => onUpdateSettings({ padQuantize: q })}
                        className={`py-2 rounded-lg font-mono text-xs font-bold border ${
                          settings.padQuantize === q ? 'bg-zinc-100 text-zinc-950 border-white' : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 bg-[#121217] rounded-xl border border-zinc-800">
                  <span className="font-mono text-xs font-bold text-zinc-300 block mb-2 uppercase">Pad Empfindlichkeit</span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['HIGH', 'NORMAL', 'SOFT'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => onUpdateSettings({ padSensitivity: s })}
                        className={`py-2 rounded-lg font-mono text-xs font-bold border ${
                          settings.padSensitivity === s ? 'bg-zinc-100 text-zinc-950 border-white' : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pad Audition / UI Sounds Toggle */}
                <div className="p-3.5 bg-[#121217] rounded-xl border border-zinc-800 flex items-center justify-between">
                  <div className="pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-tech font-bold text-sm text-zinc-100 block">UI & PAD SOUNDS</span>
                      <span className={`font-mono text-[9px] px-1.5 py-0.2 rounded font-bold uppercase border ${
                        settings.uiSounds
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                      }`}>
                        {settings.uiSounds ? 'AKTIV' : 'STUMM'}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-zinc-500 block mt-0.5">
                      Akustisches Pad-Trigger- und Button-Feedback (Blip-Sounds)
                    </span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.uiSounds}
                    onClick={() => onUpdateSettings({ uiSounds: !settings.uiSounds })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      settings.uiSounds ? 'bg-rose-500' : 'bg-zinc-700'
                    }`}
                    aria-label="Toggle UI & Pad Sounds"
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        settings.uiSounds ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Keyboard Shortcuts Reference */}
                <div className="p-3.5 bg-[#121217] rounded-xl border border-zinc-800">
                  <span className="font-mono text-xs font-bold text-zinc-300 block mb-2.5 uppercase">
                    DJ TASTATUR-BEFEHLE (SHORTCUTS)
                  </span>
                  <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
                    <div className="bg-zinc-900/80 p-2 rounded-lg border border-zinc-800">
                      <span className="text-zinc-500 block text-[9px]">TRANSPORT</span>
                      <span className="text-zinc-200 font-bold block mt-0.5">SPACE / P : Play / Pause</span>
                      <span className="text-zinc-200 font-bold block">C : CUE</span>
                      <span className="text-zinc-200 font-bold block">L : LOOP</span>
                      <span className="text-zinc-400 block text-[9px] mt-0.5">← / J : Zurück | → / N : Weiter</span>
                    </div>

                    <div className="bg-zinc-900/80 p-2 rounded-lg border border-zinc-800">
                      <span className="text-zinc-500 block text-[9px]">NAVIGATION</span>
                      <span className="text-zinc-200 font-bold block mt-0.5">TAB : Modus wechseln</span>
                      <span className="text-zinc-200 block text-[9px]">S : STEMS | M : MIX</span>
                      <span className="text-zinc-200 block text-[9px]">G : PAD | F : FX | B : LIB</span>
                      <span className="text-zinc-400 block text-[9px]">F1 – F5 / ALT+1..5</span>
                    </div>

                    <div className="bg-zinc-900/80 p-2 rounded-lg border border-zinc-800">
                      <span className="text-zinc-500 block text-[9px]">STEM MUTE / SOLO</span>
                      <span className="text-zinc-200 font-bold block mt-0.5">1 / 2 / 3 / 4 : Mute</span>
                      <span className="text-zinc-200 font-bold block">Q / W / E / R : Solo</span>
                    </div>

                    <div className="bg-zinc-900/80 p-2 rounded-lg border border-zinc-800">
                      <span className="text-zinc-500 block text-[9px]">PAD BANKS</span>
                      <span className="text-zinc-200 font-bold block mt-0.5">SHIFT + A / B / C / D</span>
                      <span className="text-zinc-400 block text-[9px]">Sofortiger Bank-Wechsel</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'UI & ANZEIGE' && (
              <div className="space-y-3">
                <div className="p-3.5 bg-[#121217] rounded-xl border border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="font-tech font-bold text-sm text-zinc-100 block">HARDWARE MODE</span>
                    <span className="font-mono text-[10px] text-zinc-500 block">Größere Touch Targets, maximaler Kontrast</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.hardwareMode}
                    onChange={(e) => onUpdateSettings({ hardwareMode: e.target.checked })}
                    className="w-5 h-5 accent-amber-400"
                  />
                </div>

                <div className="p-3.5 bg-[#121217] rounded-xl border border-zinc-800">
                  <span className="font-mono text-xs font-bold text-zinc-300 block mb-2 uppercase">Glyph Intensität</span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['SUBTLE', 'MEDIUM', 'VIVID'] as const).map((g) => (
                      <button
                        key={g}
                        onClick={() => onUpdateSettings({ glyphIntensity: g })}
                        className={`py-2 rounded-lg font-mono text-xs font-bold border ${
                          settings.glyphIntensity === g ? 'bg-zinc-100 text-zinc-950 border-white' : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'PWA & OFFLINE' && (
              <div className="space-y-3">
                <div className="p-4 bg-[#121217] rounded-2xl border border-zinc-800 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-700 mx-auto flex items-center justify-center text-rose-500 mb-3 shadow-md">
                    <Download className="w-7 h-7" />
                  </div>
                  <h3 className="font-tech font-bold text-base text-zinc-100 mb-1">
                    Schubertgrv als PWA
                  </h3>
                  <p className="font-mono text-xs text-zinc-400 mb-4 max-w-xs mx-auto">
                    Installiere Schubertgrv auf deinem Smartphone oder Tablet für echtes Fullscreen-Erlebnis ohne Browserleiste und Null Latenz.
                  </p>

                  {isInstalled ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-400 font-mono text-xs font-bold py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
                      <CheckCircle2 className="w-4 h-4" />
                      App ist erfolgreich installiert
                    </div>
                  ) : isInstallable ? (
                    <button
                      onClick={onInstallPwa}
                      className="w-full py-3.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-mono text-xs font-extrabold uppercase tracking-widest active:scale-[0.98] transition shadow-lg flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      JETZT INSTALLIEREN
                    </button>
                  ) : (
                    <div className="text-left font-mono text-xs text-zinc-400 bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                      <span className="font-bold text-zinc-200 block mb-1">iOS Safari Installation:</span>
                      1. Drücke unten auf das <strong>Teilen</strong>-Symbol.<br />
                      2. Wähle <strong>"Zum Home-Bildschirm"</strong> aus.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'STEMS & ANALYSE' && (
              <div className="p-3.5 bg-[#121217] rounded-xl border border-zinc-800 space-y-2">
                <span className="font-mono text-xs font-bold text-zinc-300 block uppercase">Algorithmus Modell</span>
                <span className="font-mono text-xs text-zinc-400 block bg-zinc-900 p-2.5 rounded-lg border border-zinc-800">
                  NEURAL 4-WAY SEPARATION V2.4 (OFFLINE OPTIMIZED)
                </span>
                <div className="flex items-center justify-between pt-2">
                  <span className="font-mono text-xs text-zinc-300">Live BPM Erkennung</span>
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-rose-500" />
                </div>
              </div>
            )}

            {activeSection === 'MIDI & HARDWARE CONTROLLER' && (
              <div className="space-y-3">
                {/* Dedicated MIDI Learn Fullscreen Launcher Card */}
                {onOpenMidiLearn && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-[#141418] border border-amber-500/50 flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/25 border border-amber-500/50 flex items-center justify-center text-amber-300 shrink-0">
                        <Cable className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-tech font-bold text-sm text-zinc-100 block">
                            Dediziertes MIDI Learn & A25 Hardware Studio
                          </span>
                          <span className="font-mono text-[9px] bg-amber-400 text-zinc-950 px-1.5 py-0.2 rounded font-black uppercase">
                            NEU
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-zinc-300 block">
                          Parameter antippen & Regler/Taste am Controller berühren zum Sofort-Belegen
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={onOpenMidiLearn}
                      className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-mono text-[10px] font-black uppercase tracking-wider transition active:scale-95 shadow-md shrink-0 flex items-center gap-1.5"
                    >
                      <span>LEARN ÖFFNEN</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* 1. Connected Devices & Port Manager */}
                <div className="p-4 bg-[#121217] rounded-2xl border border-zinc-800">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Cable className="w-4 h-4 text-amber-400" />
                      <span className="font-mono text-xs uppercase font-bold text-zinc-200 tracking-wider">
                        VERBUNDENE MIDI GERÄTE ({midiDevices.length})
                      </span>
                    </div>
                    <button
                      onClick={async () => {
                        setIsRefreshingMidi(true);
                        await midiService.initMidi();
                        setTimeout(() => setIsRefreshingMidi(false), 500);
                      }}
                      className="flex items-center gap-1 font-mono text-[9px] text-zinc-400 hover:text-white bg-zinc-900 px-2 py-1 rounded-md border border-zinc-800 active:scale-95 transition"
                    >
                      <RefreshCw className={`w-3 h-3 ${isRefreshingMidi ? 'animate-spin text-amber-400' : ''}`} />
                      SCANNEN
                    </button>
                  </div>

                  {/* Device List */}
                  <div className="space-y-2 mb-3">
                    {midiDevices.map((dev) => (
                      <div
                        key={dev.id}
                        className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between"
                      >
                        <div>
                          <span className="font-tech font-bold text-xs text-zinc-100 block">
                            {dev.name}
                          </span>
                          <span className="font-mono text-[9px] text-zinc-500 block">
                            {dev.manufacturer} • Port: {dev.id}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[9px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          ONLINE
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Live MIDI Activity Monitor */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#0d0d10] border border-zinc-800/80 font-mono text-[10px]">
                    <span className="text-zinc-500 uppercase tracking-tight flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                      MIDI MONITOR:
                    </span>
                    <span className="text-amber-400 font-bold truncate max-w-[200px]">
                      {lastMidiMsg ? lastMidiMsg.text : 'Warte auf Signal...'}
                    </span>
                  </div>
                </div>

                {/* 2. MIDI Learn Mode Status Banner */}
                {learningActionId && (
                  <div className="p-3 bg-amber-500/15 border border-amber-500/50 rounded-2xl flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                      <div>
                        <span className="font-mono text-xs font-bold text-amber-300 block uppercase">
                          MIDI LEARN AKTIV
                        </span>
                        <span className="font-mono text-[10px] text-amber-200 block">
                          Bewege jetzt Fader oder drücke Pad für:{' '}
                          <strong>
                            {midiBindings.find((b) => b.actionId === learningActionId)?.label}
                          </strong>
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => midiService.cancelLearn()}
                      className="px-2.5 py-1 bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-lg font-mono text-[10px] font-bold active:scale-95 transition"
                    >
                      ABBRECHEN
                    </button>
                  </div>
                )}

                {/* 3. Preset Quick Actions */}
                <div className="flex flex-col gap-2 p-3 bg-[#121217] rounded-2xl border border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-zinc-400 uppercase font-bold">
                      OFFIZIELLE HARDWARE PRESETS (PLUG & PLAY):
                    </span>
                    <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold">
                      {midiService.getActivePreset() === 'KOMPLETE_KONTROL_A25'
                        ? '★ NI KONTROL A25 AKTIV'
                        : midiService.getActivePreset() === 'TRAKTOR_KONTROL_X1'
                        ? '★ KONTROL X1 AKTIV'
                        : '★ KONTROL F1 AKTIV'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      onClick={() => midiService.resetToA25Defaults()}
                      className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border font-mono text-[10px] font-extrabold uppercase active:scale-95 transition ${
                        midiService.getActivePreset() === 'KOMPLETE_KONTROL_A25'
                          ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                          : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:text-white hover:border-zinc-700'
                      }`}
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-white" />
                      NI KOMPLETE KONTROL A25
                    </button>
                    <button
                      onClick={() => midiService.resetToX1Defaults()}
                      className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border font-mono text-[10px] font-extrabold uppercase active:scale-95 transition ${
                        midiService.getActivePreset() === 'TRAKTOR_KONTROL_X1'
                          ? 'bg-zinc-100 text-zinc-950 border-white shadow-md'
                          : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:text-white'
                      }`}
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                      TRAKTOR KONTROL X1
                    </button>
                    <button
                      onClick={() => midiService.resetToF1Defaults()}
                      className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border font-mono text-[10px] font-bold uppercase active:scale-95 transition ${
                        midiService.getActivePreset() === 'TRAKTOR_KONTROL_F1'
                          ? 'bg-zinc-100 text-zinc-950 border-white shadow-md'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
                      TRAKTOR KONTROL F1
                    </button>
                  </div>

                  {/* A25 Hardware Quick Map Infobox */}
                  {midiService.getActivePreset() === 'KOMPLETE_KONTROL_A25' && (
                    <div className="p-2.5 rounded-xl bg-black/60 border border-rose-900/40 text-[9px] font-mono space-y-1">
                      <div className="flex items-center justify-between text-rose-300 font-bold border-b border-rose-900/30 pb-1">
                        <span>NI KOMPLETE KONTROL A25 HARDWARE-BELEGUNG:</span>
                        <span className="text-[8px] bg-rose-500/20 px-1.5 py-0.2 rounded text-rose-300">AUTO-CONNECT BEREIT</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-zinc-400">
                        <div>• <strong className="text-zinc-200">Drehregler 1–4 (CC 14–17):</strong> Stems Lautstärke (Drums, Bass, Music, Vocal)</div>
                        <div>• <strong className="text-zinc-200">Drehregler 5 & Mod Wheel:</strong> Master FX Sweep / Filter Cutoff</div>
                        <div>• <strong className="text-zinc-200">Drehregler 6 (CC 19):</strong> Master Crossfader (Deck A ⇄ Deck B)</div>
                        <div>• <strong className="text-zinc-200">Tasten C2–D#3 (48–63):</strong> 16 Performance Pads / Hotcues / Chops</div>
                        <div>• <strong className="text-zinc-200">Tasten E3–G3 (64–67):</strong> Stem Mutes (Drums, Bass, Music, Vocal)</div>
                        <div>• <strong className="text-zinc-200">Hardware Transport & Keys:</strong> Play (C4), Cue (B3), Loop (A#3), Sync (A3), Deck Swap (G#3)</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Category Filter Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                  {(['ALL', 'TRANSPORT', 'FADERS', 'MUTES', 'PADS', 'BANKS', 'FX'] as const).map(
                    (cat) => {
                      const isSel = midiFilterCat === cat;
                      return (
                        <button
                          key={cat}
                          onClick={() => setMidiFilterCat(cat)}
                          className={`px-2.5 py-1 rounded-lg font-mono text-[9px] font-bold uppercase shrink-0 transition active:scale-95 border ${
                            isSel
                              ? 'bg-zinc-100 text-zinc-950 border-white'
                              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    }
                  )}
                </div>

                {/* 5. Mapping Table & MIDI Learn List */}
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {midiBindings
                    .filter((b) => midiFilterCat === 'ALL' || b.category === midiFilterCat)
                    .map((binding) => {
                      const isLearningThis = learningActionId === binding.actionId;

                      return (
                        <div
                          key={binding.actionId}
                          className={`p-2 rounded-xl border flex items-center justify-between transition ${
                            isLearningThis
                              ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                              : 'bg-[#121217] border-zinc-800/80 hover:border-zinc-700'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-tech font-bold text-xs text-zinc-200 block truncate">
                                {binding.label}
                              </span>
                              <span className="font-mono text-[8px] px-1 py-0.5 rounded bg-zinc-800 text-zinc-400 uppercase">
                                {binding.category}
                              </span>
                            </div>
                            <span className="font-mono text-[9px] text-zinc-500 block">
                              {binding.messageType.toUpperCase()} #{binding.number} (Kanal {binding.channel || 1})
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Learn Button */}
                            <button
                              onClick={() => {
                                if (isLearningThis) {
                                  midiService.cancelLearn();
                                } else {
                                  midiService.startLearn(binding.actionId);
                                }
                              }}
                              className={`px-2.5 py-1 rounded-lg font-mono text-[9px] font-bold uppercase transition active:scale-95 border ${
                                isLearningThis
                                  ? 'bg-amber-400 text-black border-amber-300 animate-pulse'
                                  : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:text-white hover:border-zinc-700'
                              }`}
                            >
                              {isLearningThis ? 'WIRD GELERNT...' : 'LERNEN'}
                            </button>

                            {/* Simulate / Test Button */}
                            <button
                              onClick={() => {
                                midiService.simulateMidi(
                                  binding.messageType,
                                  binding.number,
                                  binding.messageType === 'cc' ? 100 : 127,
                                  binding.channel || 1
                                );
                              }}
                              className="px-2 py-1 rounded-lg font-mono text-[9px] font-bold uppercase bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/80 text-zinc-300 hover:text-white active:scale-95 transition"
                              title="Sendet ein Testsignal"
                            >
                              TEST
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* 6. Virtual NI Traktor Kontrol X1 Hardware Chassis Simulator */}
                <div className="p-3.5 bg-[#0e0e13] rounded-2xl border border-zinc-800 shadow-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span className="font-mono text-xs font-bold text-zinc-100 uppercase tracking-wider">
                        NI TRAKTOR KONTROL X1 — HARDWARE SIMULATOR
                      </span>
                    </div>
                    <span className="font-mono text-[9px] text-zinc-500 uppercase">
                      DIREKTES MIDI FEEDBACK
                    </span>
                  </div>

                  {/* Top FX Potis (CC 16-19) */}
                  <div>
                    <div className="flex justify-between items-center mb-1 text-[9px] font-mono text-zinc-400 font-bold uppercase">
                      <span>4× FX POTIS / STEM LEVELS (CC 16–19)</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { name: 'DRUMS', cc: 16, color: '#f4f4f5' },
                        { name: 'BASS', cc: 17, color: '#38bdf8' },
                        { name: 'MUSIC', cc: 18, color: '#4ade80' },
                        { name: 'VOCAL', cc: 19, color: '#fb923c' },
                      ].map((knob) => (
                        <div
                          key={knob.name}
                          className="flex flex-col items-center bg-[#14141a] p-2 rounded-xl border border-zinc-800"
                        >
                          <span className="font-mono text-[8px] font-bold" style={{ color: knob.color }}>
                            {knob.name}
                          </span>
                          <span className="font-mono text-[7px] text-zinc-500 mb-1">CC #{knob.cc}</span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => midiService.simulateMidi('cc', knob.cc, 127)}
                              className="px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[8px] font-mono font-bold text-zinc-200 hover:text-white"
                              title="100%"
                            >
                              MAX
                            </button>
                            <button
                              onClick={() => midiService.simulateMidi('cc', knob.cc, 64)}
                              className="px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[8px] font-mono font-bold text-zinc-400 hover:text-white"
                              title="50%"
                            >
                              50%
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 4 FX Buttons (Notes 16-19 → Mutes) */}
                  <div>
                    <div className="flex justify-between items-center mb-1 text-[9px] font-mono text-zinc-400 font-bold uppercase">
                      <span>4× FX TASTER (NOTE 16–19 → MUTE TOGGLES)</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'FX 1 [DRUMS]', note: 16 },
                        { label: 'FX 2 [BASS]', note: 17 },
                        { label: 'FX 3 [MUSIC]', note: 18 },
                        { label: 'FX 4 [VOCAL]', note: 19 },
                      ].map((btn) => (
                        <button
                          key={btn.note}
                          onClick={() => midiService.simulateMidi('note', btn.note, 127)}
                          className="py-2 px-1 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-rose-400 font-mono text-[8px] font-bold active:scale-95 transition"
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Middle Encoders (LOOP & BROWSE) */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => midiService.simulateMidi('note', 20, 127)}
                      className="py-2.5 px-3 rounded-xl bg-[#14141a] border border-zinc-800 hover:border-zinc-700 text-zinc-200 font-mono text-[9px] font-bold flex items-center justify-between active:scale-95 transition"
                    >
                      <span>LOOP ACTIVE (NOTE #20)</span>
                      <span className="text-[8px] text-zinc-500">X1 LOOP</span>
                    </button>
                    <button
                      onClick={() => midiService.simulateMidi('note', 22, 127)}
                      className="py-2.5 px-3 rounded-xl bg-[#14141a] border border-zinc-800 hover:border-zinc-700 text-zinc-200 font-mono text-[9px] font-bold flex items-center justify-between active:scale-95 transition"
                    >
                      <span>BROWSE PUSH (NOTE #22)</span>
                      <span className="text-[8px] text-zinc-500">X1 LOAD</span>
                    </button>
                  </div>

                  {/* 8 Hotcue Matrix (Notes 24-31) */}
                  <div>
                    <div className="flex justify-between items-center mb-1 text-[9px] font-mono text-zinc-400 font-bold uppercase">
                      <span>8× HOTCUE MATRIX (NOTE 24–31 → PADS 1–8)</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((cNum) => {
                        const noteNum = 23 + cNum;
                        return (
                          <button
                            key={cNum}
                            onClick={() => midiService.simulateMidi('note', noteNum, 127)}
                            className="py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:bg-zinc-800 font-mono text-[9px] font-bold active:scale-95 transition flex flex-col items-center justify-center"
                          >
                            <span>CUE {cNum}</span>
                            <span className="text-[7px] text-zinc-500">NOTE #{noteNum}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bottom Transport Row (Notes 44-47: PLAY, CUE, SYNC, FLUX) */}
                  <div>
                    <div className="flex justify-between items-center mb-1 text-[9px] font-mono text-zinc-400 font-bold uppercase">
                      <span>X1 TRANSPORT TASTEN (PLAY, CUE, SYNC, FLUX)</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        onClick={() => midiService.simulateMidi('note', 44, 127)}
                        className="py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 font-mono text-[9px] font-extrabold uppercase active:scale-95 transition flex flex-col items-center"
                      >
                        <span>▶ PLAY</span>
                        <span className="text-[7px] text-emerald-400/70">NOTE #44</span>
                      </button>
                      <button
                        onClick={() => midiService.simulateMidi('note', 45, 127)}
                        className="py-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 font-mono text-[9px] font-extrabold uppercase active:scale-95 transition flex flex-col items-center"
                      >
                        <span>■ CUE</span>
                        <span className="text-[7px] text-amber-400/70">NOTE #45</span>
                      </button>
                      <button
                        onClick={() => midiService.simulateMidi('note', 46, 127)}
                        className="py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 font-mono text-[9px] font-bold uppercase active:scale-95 transition flex flex-col items-center"
                      >
                        <span>SYNC</span>
                        <span className="text-[7px] text-zinc-500">NOTE #46</span>
                      </button>
                      <button
                        onClick={() => midiService.simulateMidi('note', 47, 127)}
                        className="py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 font-mono text-[9px] font-bold uppercase active:scale-95 transition flex flex-col items-center"
                      >
                        <span>FLUX</span>
                        <span className="text-[7px] text-zinc-500">NOTE #47</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'KEYBOARD & MIDI SHORTCUTS' && (
              <div className="space-y-4">
                <HelpShortcutsOverlay
                  onClose={() => setActiveSection(null)}
                  onOpenMidiLearn={() => {
                    if (onOpenMidiLearn) {
                      onClose();
                      onOpenMidiLearn();
                    } else {
                      setActiveSection('MIDI & HARDWARE CONTROLLER');
                    }
                  }}
                  isInlineSection={true}
                />
              </div>
            )}

            {activeSection === 'BACKUP & DATEN' && (
              <div className="space-y-3">
                <button
                  onClick={() => alert('Einstellungen und Cue-Punkte exportiert.')}
                  className="w-full py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 font-mono text-xs font-bold hover:bg-zinc-800 transition"
                >
                  SETUP & CUES EXPORTIEREN
                </button>
                <button
                  onClick={() => {
                    if (confirm('Alle Einstellungen und Cues zurücksetzen?')) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                  className="w-full py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-xs font-bold hover:bg-rose-500/20 transition"
                >
                  ALLES ZURÜCKSETZEN
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Close Button */}
      <button
        onClick={onClose}
        className="w-full py-3.5 mt-2 rounded-2xl bg-zinc-100 hover:bg-white text-zinc-950 font-mono text-xs font-bold tracking-widest uppercase active:scale-[0.98] transition shadow-md shrink-0"
      >
        SCHLIEßEN
      </button>
    </div>
  );
};
