import React, { useState, useEffect } from 'react';
import { MidiActionId, MidiBinding, MidiDeviceInfo } from '../../types';
import { midiService } from '../../services/midiService';
import {
  ChevronLeft,
  X,
  Cable,
  Radio,
  RotateCcw,
  Check,
  Zap,
  Sliders,
  Volume2,
  Layers,
  Sparkles,
  Play,
  Square,
  Repeat,
  ArrowLeftRight,
  Gauge,
  SlidersHorizontal,
  Info,
  Activity,
  Keyboard,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';

interface MidiLearnOverlayProps {
  onClose: () => void;
  onOpenSettings?: () => void;
}

type CategoryFilter = 'ALL' | 'TRANSPORT' | 'FADERS' | 'MUTES' | 'PADS' | 'BANKS' | 'FX';

export const MidiLearnOverlay: React.FC<MidiLearnOverlayProps> = ({ onClose, onOpenSettings }) => {
  const [devices, setDevices] = useState<MidiDeviceInfo[]>(midiService.getDevices());
  const [bindings, setBindings] = useState<MidiBinding[]>(midiService.getBindings());
  const [learningActionId, setLearningActionId] = useState<MidiActionId | null>(
    midiService.getLearningActionId()
  );
  const [lastMidiMsg, setLastMidiMsg] = useState(midiService.getLastMessage());
  const [activePreset, setActivePreset] = useState(midiService.getActivePreset());
  const [filterCategory, setFilterCategory] = useState<CategoryFilter>('ALL');
  const [notification, setNotification] = useState<string | null>(null);
  const [testedActionId, setTestedActionId] = useState<MidiActionId | null>(null);
  const [hardwareTab, setHardwareTab] = useState<'A25_VISUAL' | 'LEARN_TABLE' | 'MONITOR'>('A25_VISUAL');

  // Sync with midiService state changes
  useEffect(() => {
    const unsub = midiService.subscribe(() => {
      setDevices(midiService.getDevices());
      setBindings(midiService.getBindings());
      setLearningActionId(midiService.getLearningActionId());
      setLastMidiMsg(midiService.getLastMessage());
      setActivePreset(midiService.getActivePreset());
    });
    return unsub;
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 2800);
  };

  const handleStartLearn = (actionId: MidiActionId) => {
    midiService.startLearn(actionId);
    showNotification(`MIDI Learn aktiv: Drehe Knopf oder drücke Taste für "${actionId.replace(/_/g, ' ')}"`);
  };

  const handleCancelLearn = () => {
    midiService.cancelLearn();
    showNotification('MIDI Learn abgebrochen');
  };

  const handleTestTrigger = (actionId: MidiActionId) => {
    setTestedActionId(actionId);
    setTimeout(() => setTestedActionId(null), 350);

    const binding = bindings.find((b) => b.actionId === actionId);
    if (binding) {
      midiService.simulateMidi(binding.messageType, binding.number, 127, binding.channel || 1);
    } else {
      // Default fallback simulation
      midiService.simulateMidi('note', 48, 127, 1);
    }
  };

  const handleResetToA25 = () => {
    midiService.resetToA25Defaults();
    showNotification('Native Instruments Komplete Kontrol A25 Preset geladen (Plug & Play)');
  };

  const handleResetToX1 = () => {
    midiService.resetToX1Defaults();
    showNotification('Traktor Kontrol X1 Standard Preset geladen');
  };

  const handleResetToF1 = () => {
    midiService.resetToF1Defaults();
    showNotification('Traktor Kontrol F1 Preset geladen');
  };

  const categories: { id: CategoryFilter; label: string; count: number }[] = [
    { id: 'ALL', label: 'ALLE BELEGUNGEN', count: bindings.length },
    { id: 'TRANSPORT', label: 'TRANSPORT', count: bindings.filter((b) => b.category === 'TRANSPORT').length },
    { id: 'FADERS', label: 'STEMS & CROSSFADER', count: bindings.filter((b) => b.category === 'FADERS').length },
    { id: 'MUTES', label: 'STEM MUTES', count: bindings.filter((b) => b.category === 'MUTES').length },
    { id: 'PADS', label: 'PERFORMANCE PADS', count: bindings.filter((b) => b.category === 'PADS').length },
    { id: 'BANKS', label: 'BANK SWITCH', count: bindings.filter((b) => b.category === 'BANKS').length },
    { id: 'FX', label: 'MASTER FX', count: bindings.filter((b) => b.category === 'FX').length },
  ];

  const filteredBindings = bindings.filter(
    (b) => filterCategory === 'ALL' || b.category === filterCategory
  );

  // Note Number to Note Name (e.g. 48 -> C2, 60 -> C3)
  const getNoteName = (midiNumber: number): string => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midiNumber / 12) - 1;
    const note = notes[midiNumber % 12];
    return `${note}${octave}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#08080b] flex flex-col p-2 sm:p-4 select-none animate-in fade-in duration-150 overflow-hidden text-zinc-200">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-zinc-900 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-900 transition active:scale-95"
            title="Zurück zum Deck"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs sm:text-sm font-bold tracking-[0.2em] uppercase text-zinc-100 flex items-center gap-1.5">
                <Cable className="w-4 h-4 text-amber-400" />
                MIDI LEARN & HARDWARE
              </span>
              <span className="font-mono text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-black uppercase">
                KOMPLETE KONTROL A25 READY
              </span>
            </div>
            <span className="font-mono text-[10px] text-zinc-400 hidden sm:block">
              Controller anschließen & sofort loslegen oder Parameter frei belegen
            </span>
          </div>
        </div>

        {/* Tab Switcher & Close Button */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-zinc-900/90 p-0.5 rounded-xl border border-zinc-800 text-[10px] font-mono">
            <button
              onClick={() => setHardwareTab('A25_VISUAL')}
              className={`px-2 sm:px-2.5 py-1 rounded-lg font-bold transition ${
                hardwareTab === 'A25_VISUAL'
                  ? 'bg-amber-500 text-zinc-950 font-black shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              NI A25 LAYOUT
            </button>
            <button
              onClick={() => setHardwareTab('LEARN_TABLE')}
              className={`px-2 sm:px-2.5 py-1 rounded-lg font-bold transition ${
                hardwareTab === 'LEARN_TABLE'
                  ? 'bg-amber-500 text-zinc-950 font-black shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              MIDI LEARN MATRIX ({bindings.length})
            </button>
            <button
              onClick={() => setHardwareTab('MONITOR')}
              className={`px-2 sm:px-2.5 py-1 rounded-lg font-bold transition ${
                hardwareTab === 'MONITOR'
                  ? 'bg-amber-500 text-zinc-950 font-black shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              LIVE MONITOR
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-900 transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Floating Instant Notification Flash */}
      {notification && (
        <div className="my-1 py-1.5 px-3 rounded-xl bg-amber-500/20 border border-amber-500/60 text-amber-200 font-mono text-[11px] font-bold flex items-center justify-between animate-in slide-in-from-top-2 shrink-0">
          <span className="flex items-center gap-2 truncate">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            {notification}
          </span>
          <button
            onClick={() => setNotification(null)}
            className="text-amber-400/80 hover:text-amber-200 ml-2 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Quick Controller Presets & Active Hardware Status Bar */}
      <div className="py-2 flex items-center justify-between gap-2 flex-wrap border-b border-zinc-900/80 shrink-0">
        {/* Hardware Status Tag */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-mono text-[10px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)] animate-pulse" />
            <span className="font-bold">STATUS:</span>
            <span>
              {devices[0]?.name || 'NI Komplete Kontrol A25 Plug & Play Verbunden'}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1 font-mono text-[9px] text-zinc-500">
            <span>PRESET:</span>
            <strong className="text-zinc-300">{activePreset.replace(/_/g, ' ')}</strong>
          </div>
        </div>

        {/* 1-Click Preset Switcher Buttons */}
        <div className="flex items-center gap-1.5 font-mono text-[9px]">
          <span className="text-zinc-500 hidden sm:inline">SCHNELL-PRESETS:</span>
          <button
            onClick={handleResetToA25}
            className={`px-2 py-1 rounded-lg font-bold border transition ${
              activePreset === 'KOMPLETE_KONTROL_A25'
                ? 'bg-amber-400 text-zinc-950 border-amber-400 font-black shadow-xs'
                : 'bg-[#141418] text-zinc-300 border-zinc-800 hover:border-zinc-700'
            }`}
            title="Native Instruments Komplete Kontrol A25 Werksprofil laden"
          >
            NI A25 (Aktiv)
          </button>

          <button
            onClick={handleResetToX1}
            className={`px-2 py-1 rounded-lg font-bold border transition ${
              activePreset === 'TRAKTOR_KONTROL_X1'
                ? 'bg-amber-400 text-zinc-950 border-amber-400 font-black shadow-xs'
                : 'bg-[#141418] text-zinc-300 border-zinc-800 hover:border-zinc-700'
            }`}
            title="Traktor Kontrol X1 (MK1/MK2/MK3) Profil laden"
          >
            TRAKTOR X1
          </button>

          <button
            onClick={handleResetToF1}
            className={`px-2 py-1 rounded-lg font-bold border transition ${
              activePreset === 'TRAKTOR_KONTROL_F1'
                ? 'bg-amber-400 text-zinc-950 border-amber-400 font-black shadow-xs'
                : 'bg-[#141418] text-zinc-300 border-zinc-800 hover:border-zinc-700'
            }`}
            title="Traktor Kontrol F1 Pad Controller Profil laden"
          >
            TRAKTOR F1
          </button>
        </div>
      </div>

      {/* Main Content Area based on Tab */}
      <div className="flex-1 overflow-y-auto py-2 min-h-0 space-y-3">
        {/* TAB 1: NI Komplete Kontrol A25 Interactive Hardware Graphic & Quick Map */}
        {hardwareTab === 'A25_VISUAL' && (
          <div className="space-y-3">
            {/* Info Card: Plug & Play guarantee */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-[#171410] to-[#121217] border border-amber-500/40 flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <Keyboard className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-tech font-bold text-sm text-zinc-100 block">
                      Native Instruments Komplete Kontrol A25 — Plug & Play Belegung
                    </span>
                    <span className="font-mono text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-bold uppercase">
                      ZERO-CONFIG
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-zinc-300 block">
                    Stecke dein A25 per USB an. Die 8 Drehregler steuern Drums, Bass, Music, Vocals, FX & Crossfader. Die Tasten steuern Pads, Mutes & Transport.
                  </span>
                </div>
              </div>

              <button
                onClick={handleResetToA25}
                className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-mono text-[10px] font-black uppercase tracking-wider shrink-0 shadow-sm active:scale-95 transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3 h-3" />
                <span>A25 RESET</span>
              </button>
            </div>

            {/* Virtual Interactive A25 Hardware Console */}
            <div className="p-3 sm:p-4 rounded-2xl bg-[#0f0f14] border border-zinc-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                  <span className="font-mono text-xs font-bold text-zinc-100 uppercase tracking-widest">
                    NATIVE INSTRUMENTS KOMPLETE KONTROL A25 (HARDWARE INTERFACE)
                  </span>
                </div>
                <span className="font-mono text-[9px] text-zinc-500 uppercase">
                  KLICKE ELEMENTE ZUM TESTEN ODER BELEGEN
                </span>
              </div>

              {/* 1. 8 Rotary Encoders (Knobs 1 - 8) */}
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-1.5">
                  <span className="uppercase font-bold text-amber-300 flex items-center gap-1">
                    <Sliders className="w-3 h-3 text-amber-400" />
                    8 DREHREGLER / ENCODER (POTIS 1 — 8)
                  </span>
                  <span className="text-zinc-500">CC 14 — CC 21 & Mod Wheel</span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {[
                    { knob: 1, cc: 14, label: 'DRUMS', sub: 'Stem Level', action: 'FADER_DRUMS' as MidiActionId, color: 'text-rose-400' },
                    { knob: 2, cc: 15, label: 'BASS', sub: 'Stem Level', action: 'FADER_BASS' as MidiActionId, color: 'text-amber-400' },
                    { knob: 3, cc: 16, label: 'MUSIC', sub: 'Stem Level', action: 'FADER_MUSIC' as MidiActionId, color: 'text-sky-400' },
                    { knob: 4, cc: 17, label: 'VOCAL', sub: 'Stem Level', action: 'FADER_VOCAL' as MidiActionId, color: 'text-emerald-400' },
                    { knob: 5, cc: 1, label: 'FX SWEEP', sub: 'Mod Wheel', action: 'FX_AMOUNT' as MidiActionId, color: 'text-purple-400' },
                    { knob: 6, cc: 19, label: 'CROSSFADE', sub: 'Deck A ⇄ B', action: 'CROSSFADER' as MidiActionId, color: 'text-cyan-400' },
                    { knob: 7, cc: 20, label: 'BANK A/B', sub: 'Select', action: 'BANK_A' as MidiActionId, color: 'text-zinc-300' },
                    { knob: 8, cc: 21, label: 'SYNC/SWAP', sub: 'Push Enc', action: 'SWAP' as MidiActionId, color: 'text-zinc-300' },
                  ].map((k) => {
                    const isLearningThis = learningActionId === k.action;
                    return (
                      <div
                        key={k.knob}
                        className={`p-2 rounded-xl border flex flex-col items-center justify-between text-center transition ${
                          isLearningThis
                            ? 'bg-amber-500/20 border-amber-400 animate-pulse'
                            : 'bg-[#14141a] border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <span className="font-mono text-[8px] text-zinc-500 font-bold">KNOB {k.knob}</span>
                        <div
                          onClick={() => {
                            midiService.simulateMidi('cc', k.cc, 85, 1);
                            showNotification(`A25 Knob ${k.knob} getestet (CC ${k.cc} -> ${k.label})`);
                          }}
                          className={`w-9 h-9 my-1 rounded-full bg-zinc-900 border border-zinc-700 hover:border-amber-400 flex items-center justify-center cursor-pointer transition active:scale-90 ${k.color}`}
                          title={`Klicke zum Testen von Knob ${k.knob} (CC #${k.cc})`}
                        >
                          <SlidersHorizontal className="w-4 h-4" />
                        </div>
                        <span className={`font-mono text-[9px] font-bold truncate max-w-full ${k.color}`}>
                          {k.label}
                        </span>
                        <span className="font-mono text-[7px] text-zinc-500">CC #{k.cc}</span>
                        <button
                          onClick={() => handleStartLearn(k.action)}
                          className="mt-1 w-full py-0.5 rounded bg-zinc-800 hover:bg-amber-500/30 text-zinc-300 hover:text-amber-200 font-mono text-[7.5px] font-bold uppercase transition"
                        >
                          {isLearningThis ? 'LERNT...' : 'LEARN'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. 25 Synth Keys Bed (Color Coded Performance Zones) */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-1.5 flex-wrap gap-1">
                  <span className="uppercase font-bold text-rose-300 flex items-center gap-1">
                    <Keyboard className="w-3 h-3 text-rose-400" />
                    25-TASTEN KLAVIATUR (C2 BIS C4 / NOTEN 48 — 72)
                  </span>
                  <div className="flex items-center gap-2 text-[8px]">
                    <span className="flex items-center gap-1 text-cyan-400">
                      <span className="w-2 h-2 rounded bg-cyan-500/80" /> 16 Pads (C2 - D#3)
                    </span>
                    <span className="flex items-center gap-1 text-amber-400">
                      <span className="w-2 h-2 rounded bg-amber-500/80" /> 4 Mutes (E3 - G3)
                    </span>
                    <span className="flex items-center gap-1 text-rose-400">
                      <span className="w-2 h-2 rounded bg-rose-500/80" /> Transport (G#3 - C4)
                    </span>
                  </div>
                </div>

                {/* 25 Keys Layout Visualizer */}
                <div className="bg-[#0a0a0d] p-2 rounded-xl border border-zinc-800 overflow-x-auto">
                  <div className="flex items-start gap-1 min-w-[700px] h-28 relative select-none">
                    {/* Keys 48 to 72 */}
                    {Array.from({ length: 25 }, (_, i) => {
                      const noteNum = 48 + i;
                      const noteName = getNoteName(noteNum);
                      const isBlack = noteName.includes('#');

                      // Categorize Key
                      let zone: 'PAD' | 'MUTE' | 'TRANSPORT' = 'PAD';
                      let actionId: MidiActionId = `PAD_${i + 1}` as MidiActionId;
                      let label = `Pad ${i + 1}`;
                      let badgeColor = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';

                      if (noteNum >= 64 && noteNum <= 67) {
                        zone = 'MUTE';
                        const stemNames: Record<number, { id: MidiActionId; name: string }> = {
                          64: { id: 'MUTE_DRUMS', name: 'Mute Drum' },
                          65: { id: 'MUTE_BASS', name: 'Mute Bass' },
                          66: { id: 'MUTE_MUSIC', name: 'Mute Mus' },
                          67: { id: 'MUTE_VOCAL', name: 'Mute Voc' },
                        };
                        actionId = stemNames[noteNum].id;
                        label = stemNames[noteNum].name;
                        badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                      } else if (noteNum >= 68) {
                        zone = 'TRANSPORT';
                        const transNames: Record<number, { id: MidiActionId; name: string }> = {
                          68: { id: 'SWAP', name: 'Swap A/B' },
                          69: { id: 'SYNC', name: 'Sync BPM' },
                          70: { id: 'LOOP', name: 'Loop On' },
                          71: { id: 'CUE', name: 'CUE Pt' },
                          72: { id: 'PLAY_PAUSE', name: 'Play/P' },
                        };
                        actionId = transNames[noteNum].id;
                        label = transNames[noteNum].name;
                        badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
                      }

                      const isLearningThis = learningActionId === actionId;

                      return (
                        <div
                          key={noteNum}
                          onClick={() => {
                            midiService.simulateMidi('note', noteNum, 127, 1);
                            showNotification(`A25 Taste ${noteName} (#${noteNum}) ausgelöst -> ${label}`);
                          }}
                          className={`flex-1 rounded-b-lg border flex flex-col justify-between p-1 cursor-pointer transition active:translate-y-1 ${
                            isBlack
                              ? 'bg-zinc-900 border-zinc-700 h-20 text-zinc-300 shadow-md z-10 -mx-1'
                              : 'bg-zinc-100 hover:bg-white border-zinc-300 h-28 text-zinc-900 shadow-sm z-0'
                          } ${isLearningThis ? '!border-amber-400 !bg-amber-300 ring-2 ring-amber-400' : ''}`}
                          title={`Taste ${noteName} (Midi #${noteNum}): ${label}`}
                        >
                          <span className={`font-mono text-[7px] font-black truncate block ${isBlack ? 'text-zinc-400' : 'text-zinc-600'}`}>
                            {noteName}
                          </span>

                          <div className="flex flex-col items-center">
                            <span className={`font-mono text-[6.5px] font-bold px-0.5 rounded border uppercase truncate max-w-full ${badgeColor}`}>
                              {label}
                            </span>
                            <span className={`font-mono text-[6px] ${isBlack ? 'text-zinc-500' : 'text-zinc-400'}`}>
                              #{noteNum}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Full Categorized MIDI Learn Matrix & Parameter Mapping */}
        {hardwareTab === 'LEARN_TABLE' && (
          <div className="space-y-3">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setFilterCategory(c.id)}
                  className={`px-2.5 py-1 rounded-xl font-mono text-[9.5px] font-bold uppercase tracking-wider whitespace-nowrap transition active:scale-95 border ${
                    filterCategory === c.id
                      ? 'bg-amber-400 text-zinc-950 border-amber-400 font-extrabold shadow-sm'
                      : 'bg-[#121216] text-zinc-400 border-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  {c.label} ({c.count})
                </button>
              ))}
            </div>

            {/* Active Learning Banner if waiting */}
            {learningActionId && (
              <div className="p-3 bg-amber-500/20 border border-amber-500/70 rounded-2xl flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
                  <div>
                    <span className="font-mono text-xs font-black text-amber-300 block uppercase">
                      WARTET AUF CONTROLLER-BEWEGUNG...
                    </span>
                    <span className="font-mono text-[10px] text-amber-200 block">
                      Bewege jetzt einen Drehregler oder drücke eine Taste am Controller für:{' '}
                      <strong className="underline">
                        {bindings.find((b) => b.actionId === learningActionId)?.label || learningActionId}
                      </strong>
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleCancelLearn}
                  className="px-3 py-1 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white font-mono text-[10px] font-bold uppercase transition"
                >
                  ABBRECHEN
                </button>
              </div>
            )}

            {/* Parameters List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {filteredBindings.map((binding) => {
                const isLearning = learningActionId === binding.actionId;
                const isBeingTested = testedActionId === binding.actionId;

                return (
                  <div
                    key={binding.actionId}
                    className={`p-3 rounded-2xl border transition-all ${
                      isLearning
                        ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.25)] ring-1 ring-amber-400'
                        : isBeingTested
                        ? 'bg-emerald-500/20 border-emerald-400'
                        : 'bg-[#111116] border-zinc-800/90 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                          binding.category === 'TRANSPORT'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : binding.category === 'FADERS'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : binding.category === 'MUTES'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : binding.category === 'PADS'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                            : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                        }`}>
                          {binding.messageType.toUpperCase()}
                        </div>

                        <div className="min-w-0 truncate">
                          <span className="font-tech font-bold text-xs text-zinc-100 block truncate">
                            {binding.label}
                          </span>
                          <span className="font-mono text-[9px] text-zinc-400 block truncate">
                            ID: <code className="text-zinc-300">{binding.actionId}</code> • Kat: {binding.category}
                          </span>
                        </div>
                      </div>

                      {/* Current Midi Value Badge */}
                      <div className="text-right shrink-0">
                        <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded-lg bg-zinc-900 border border-zinc-700 text-amber-300 block">
                          {binding.messageType.toUpperCase()} #{binding.number}
                          {binding.messageType === 'note' ? ` (${getNoteName(binding.number)})` : ''}
                        </span>
                        <span className="font-mono text-[8px] text-zinc-500 block">
                          Kanal {binding.channel || 1}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons: Learn, Test, Clear */}
                    <div className="mt-2.5 pt-2 border-t border-zinc-850 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleTestTrigger(binding.actionId)}
                        className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white font-mono text-[9px] font-bold uppercase transition active:scale-95 flex items-center gap-1"
                        title="Diesen Parameter jetzt testen"
                      >
                        <Play className="w-2.5 h-2.5 text-emerald-400 fill-current" />
                        <span>TESTEN</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        {isLearning ? (
                          <button
                            onClick={handleCancelLearn}
                            className="px-3 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/50 font-mono text-[9px] font-black uppercase transition active:scale-95"
                          >
                            STOP LERNEN
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStartLearn(binding.actionId)}
                            className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono text-[9px] font-black uppercase tracking-wider transition active:scale-95 shadow-xs flex items-center gap-1"
                          >
                            <Zap className="w-3 h-3 fill-current" />
                            <span>MIDI LEARN</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: Live Real-Time MIDI Feed & Diagnostics Monitor */}
        {hardwareTab === 'MONITOR' && (
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-[#0e0e13] border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
                  <span className="font-mono text-xs uppercase font-bold text-zinc-100 tracking-wider">
                    ECHTZEIT MIDI MONITOR & PORT STATUS
                  </span>
                </div>
                <span className="font-mono text-[10px] text-zinc-500">
                  Web MIDI API Standard 1.0
                </span>
              </div>

              {/* Last Message High-Contrast Readout */}
              <div className="p-3 rounded-xl bg-black/80 border border-zinc-800 font-mono flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-zinc-500 block uppercase">LETZTES EMPFANGENES PAKET:</span>
                  <span className="text-sm font-bold text-amber-300">
                    {lastMidiMsg ? lastMidiMsg.text : 'Warte auf Signal... (Bewege Regler am A25)'}
                  </span>
                </div>
                {lastMidiMsg && (
                  <span className="text-[9px] text-zinc-500">
                    {new Date(lastMidiMsg.time).toLocaleTimeString()}
                  </span>
                )}
              </div>

              {/* Detected Hardware Devices List */}
              <div className="space-y-2">
                <span className="font-mono text-[10px] uppercase font-bold text-zinc-400 block">
                  ERKANNTES HARDWARE-PORT ({devices.length}):
                </span>
                {devices.map((d) => (
                  <div
                    key={d.id}
                    className="p-2.5 rounded-xl bg-[#141418] border border-zinc-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                        <Cable className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-tech font-bold text-xs text-zinc-200 block">
                          {d.name}
                        </span>
                        <span className="font-mono text-[9px] text-zinc-500 block">
                          Hersteller: {d.manufacturer} • Port: {d.id}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-mono font-bold uppercase">
                      VERBUNDEN
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer Actions */}
      <div className="pt-2 sm:pt-3 border-t border-zinc-900 flex items-center justify-between shrink-0 text-xs">
        <button
          onClick={handleResetToA25}
          className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white font-mono text-[10px] font-bold uppercase transition flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>AUF NI A25 STANDARD ZURÜCKSETZEN</span>
        </button>

        <button
          onClick={onClose}
          className="px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-mono text-xs font-black uppercase tracking-wider active:scale-95 transition shadow-lg"
        >
          FERTIG / ZURÜCK ZUM MIX
        </button>
      </div>
    </div>
  );
};
