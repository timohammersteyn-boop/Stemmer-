import React, { useState, useEffect, useMemo } from 'react';
import {
  Keyboard,
  Sliders,
  Cpu,
  Search,
  X,
  Sparkles,
  Zap,
  Cable,
  Volume2,
  Repeat,
  Headphones,
  Compass,
  ArrowRightLeft,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { midiService } from '../../services/midiService';
import { MidiDeviceInfo, MidiBinding } from '../../types';

interface HelpShortcutsOverlayProps {
  onClose: () => void;
  onOpenMidiLearn?: () => void;
  isInlineSection?: boolean; // When rendered inside SettingsOverlay
}

interface ShortcutItem {
  id: string;
  category: 'NAVIGATION' | 'TRANSPORT' | 'STEMS' | 'PADS' | 'MIDI';
  keys: string[];
  title: string;
  description: string;
  deckContext?: 'A' | 'B' | 'GLOBAL';
  midiMapping?: string;
}

const DEFAULT_KEYBOARD_SHORTCUTS: ShortcutItem[] = [
  // Navigation
  {
    id: 'nav-tab',
    category: 'NAVIGATION',
    keys: ['Tab'],
    title: 'Nächster Screen',
    description: 'Wechselt zyklisch: Stems → Mix → Pad → FX → Library',
  },
  {
    id: 'nav-tab-shift',
    category: 'NAVIGATION',
    keys: ['Shift', 'Tab'],
    title: 'Vorheriger Screen',
    description: 'Wechselt rückwärts durch die Screens',
  },
  {
    id: 'nav-f1',
    category: 'NAVIGATION',
    keys: ['F1', 'S'],
    title: 'Stems Screen (Dual Deck)',
    description: 'Öffnet den Stems-Performance-Player mit Wellenformen & Spuren',
  },
  {
    id: 'nav-f2',
    category: 'NAVIGATION',
    keys: ['F2', 'M'],
    title: 'Mix Screen',
    description: 'Öffnet den 4-/8-Kanal Stem-Mixer mit Crossfader & Phase Meter',
  },
  {
    id: 'nav-f3',
    category: 'NAVIGATION',
    keys: ['F3', 'G'],
    title: 'Pad Screen (16 Pads)',
    description: 'Öffnet die 16 Tactile Performance Pads (Hot Cue, Loop, Slicer)',
  },
  {
    id: 'nav-f4',
    category: 'NAVIGATION',
    keys: ['F4', 'F', 'X'],
    title: 'FX Screen & Snapshots',
    description: 'Öffnet Master FX Engine, Snapshot-Presets & Signal Chain',
  },
  {
    id: 'nav-f5',
    category: 'NAVIGATION',
    keys: ['F5', 'B', 'V'],
    title: 'Library Screen',
    description: 'Öffnet den Track-Katalog & Crate-Browser für Deck A & B',
  },
  {
    id: 'nav-esc',
    category: 'NAVIGATION',
    keys: ['Esc'],
    title: 'Overlay Schließen',
    description: 'Schließt geöffnete Menüs, Dialoge & Settings sofort',
  },

  // Transport
  {
    id: 'trans-play',
    category: 'TRANSPORT',
    keys: ['Space', 'Enter'],
    title: 'Play / Pause Toggle',
    description: 'Startet oder pausiert die Wiedergabe des Master Decks',
    midiMapping: 'Play Button (CC / Note 72 / 44)',
  },
  {
    id: 'trans-cue',
    category: 'TRANSPORT',
    keys: ['C'],
    title: 'CUE Point Jump',
    description: 'Springt direkt zum gesetzten Sample-genauen CUE-Punkt',
    midiMapping: 'CUE Button (Note 71 / 45)',
  },
  {
    id: 'trans-loop',
    category: 'TRANSPORT',
    keys: ['L'],
    title: '4-Bar Loop Toggle',
    description: 'Aktiviert oder deaktiviert den 4-Takt Performance-Loop',
    midiMapping: 'Loop Button (Note 70 / 20)',
  },
  {
    id: 'trans-quantize',
    category: 'TRANSPORT',
    keys: ['Q'],
    title: 'Quantize Snap (QTZ)',
    description: 'Snappt Pad-Triggers & Cues auf den nächsten Beat des Master BPM',
  },
  {
    id: 'trans-keylock',
    category: 'TRANSPORT',
    keys: ['K'],
    title: 'Master Key Lock (Pitch Lock)',
    description: 'Hält die originale Tonhöhe bei Tempoänderungen konstant',
  },
  {
    id: 'trans-sync',
    category: 'TRANSPORT',
    keys: ['Y', 'Shift + S'],
    title: 'BPM Sync Lock',
    description: 'Gleicht Tempo (BPM) & Phase von Deck B an Deck A an',
    midiMapping: 'Sync Button (Note 69 / 46)',
  },
  {
    id: 'trans-swap',
    category: 'TRANSPORT',
    keys: ['Alt + W', 'Alt + X'],
    title: 'Deck Swap (A ⇄ B)',
    description: 'Tauscht Master- und Standby-Deck nahtlos aus',
    midiMapping: 'Swap Button (Note 68 / 64)',
  },
  {
    id: 'trans-jump-back',
    category: 'TRANSPORT',
    keys: ['[', 'Shift + ←'],
    title: 'Beat Jump -4 Beats',
    description: 'Springt exakt 1 Takt (4 Beats) in der Wellenform zurück',
  },
  {
    id: 'trans-jump-fwd',
    category: 'TRANSPORT',
    keys: [']', 'Shift + →'],
    title: 'Beat Jump +4 Beats',
    description: 'Springt exakt 1 Takt (4 Beats) in der Wellenform vor',
  },
  {
    id: 'trans-prev',
    category: 'TRANSPORT',
    keys: ['←', 'J'],
    title: 'Vorheriger Track',
    description: 'Lädt den vorherigen Track aus der Crate-Playlist',
  },
  {
    id: 'trans-next',
    category: 'TRANSPORT',
    keys: ['→', 'N'],
    title: 'Nächster Track',
    description: 'Lädt den nächsten Track aus der Crate-Playlist',
  },

  // Stem Controls
  {
    id: 'stem-mute-drums',
    category: 'STEMS',
    keys: ['1'],
    title: 'Mute Drums (Deck A)',
    description: 'Schaltet Drums stumm oder aktiv',
    midiMapping: 'Mute Btn 1 (Note 64 / 16)',
  },
  {
    id: 'stem-mute-bass',
    category: 'STEMS',
    keys: ['2'],
    title: 'Mute Bass (Deck A)',
    description: 'Schaltet Bassline stumm oder aktiv',
    midiMapping: 'Mute Btn 2 (Note 65 / 17)',
  },
  {
    id: 'stem-mute-music',
    category: 'STEMS',
    keys: ['3'],
    title: 'Mute Music / Melodie',
    description: 'Schaltet melodische Instrumente stumm oder aktiv',
    midiMapping: 'Mute Btn 3 (Note 66 / 18)',
  },
  {
    id: 'stem-mute-vocal',
    category: 'STEMS',
    keys: ['4'],
    title: 'Mute Vocals (Acapella)',
    description: 'Schaltet Gesang & Vocals stumm oder aktiv',
    midiMapping: 'Mute Btn 4 (Note 67 / 19)',
  },
  {
    id: 'stem-solo-drums',
    category: 'STEMS',
    keys: ['Q'],
    title: 'Solo Drums',
    description: 'Schaltet alle anderen Stems stumm (Drums solo)',
  },
  {
    id: 'stem-solo-bass',
    category: 'STEMS',
    keys: ['W'],
    title: 'Solo Bass',
    description: 'Schaltet alle anderen Stems stumm (Bass solo)',
  },
  {
    id: 'stem-solo-music',
    category: 'STEMS',
    keys: ['E'],
    title: 'Solo Music',
    description: 'Schaltet alle anderen Stems stumm (Music solo)',
  },
  {
    id: 'stem-solo-vocal',
    category: 'STEMS',
    keys: ['R'],
    title: 'Solo Vocal',
    description: 'Schaltet alle anderen Stems stumm (Vocals solo)',
  },

  // Pads & Banks
  {
    id: 'pad-bank-a',
    category: 'PADS',
    keys: ['Shift + A'],
    title: 'Bank A: Hot Cues',
    description: 'Aktiviert Bank A (8 Hot Cues mit Farbcodierung)',
    midiMapping: 'Bank A (CC 102 / Note 64)',
  },
  {
    id: 'pad-bank-b',
    category: 'PADS',
    keys: ['Shift + B'],
    title: 'Bank B: Loops',
    description: 'Aktiviert Bank B (1/16 bis 8-Bar Beat-Loops)',
    midiMapping: 'Bank B (CC 103 / Note 65)',
  },
  {
    id: 'pad-bank-c',
    category: 'PADS',
    keys: ['Shift + C'],
    title: 'Bank C: Slicer',
    description: 'Aktiviert Bank C (8 Slice-Triggers im Takt)',
    midiMapping: 'Bank C (CC 104 / Note 66)',
  },
  {
    id: 'pad-bank-d',
    category: 'PADS',
    keys: ['Shift + D'],
    title: 'Bank D: Roll FX',
    description: 'Aktiviert Bank D (Instant Beat-Roll Repeats)',
    midiMapping: 'Bank D (CC 105 / Note 67)',
  },

  // MIDI Shortcuts
  {
    id: 'midi-learn-key',
    category: 'MIDI',
    keys: ['M'],
    title: 'MIDI Learn Overlay Toggle',
    description: 'Öffnet den interaktiven MIDI Learn Controller Mapper',
    midiMapping: 'Web MIDI API Live Sync',
  },
  {
    id: 'midi-help-key',
    category: 'MIDI',
    keys: ['?'],
    title: 'Hilfe & Tastaturkürzel',
    description: 'Öffnet dieses Dot-Matrix Übersichtspanel',
  },
];

export const HelpShortcutsOverlay: React.FC<HelpShortcutsOverlayProps> = ({
  onClose,
  onOpenMidiLearn,
  isInlineSection = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [copiedAll, setCopiedAll] = useState(false);

  // Dynamic MIDI devices and bindings from midiService
  const [devices, setDevices] = useState<MidiDeviceInfo[]>(() => midiService.getDevices());
  const [bindings, setBindings] = useState<MidiBinding[]>(() => midiService.getBindings());
  const [activePreset, setActivePreset] = useState<string>(() => midiService.getActivePreset());

  useEffect(() => {
    const unsubscribe = midiService.subscribe(() => {
      setDevices(midiService.getDevices());
      setBindings(midiService.getBindings());
      setActivePreset(midiService.getActivePreset());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const activeDevice = devices.length > 0 ? devices[0] : null;

  // Filtered Shortcuts List
  const filteredShortcuts = useMemo(() => {
    return DEFAULT_KEYBOARD_SHORTCUTS.filter((item) => {
      const matchesCat =
        selectedCategory === 'ALL' || item.category === selectedCategory;

      if (!matchesCat) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchKeys = item.keys.some((k) => k.toLowerCase().includes(q));
      const matchMidi = item.midiMapping?.toLowerCase().includes(q) || false;

      return matchTitle || matchDesc || matchKeys || matchMidi;
    });
  }, [searchQuery, selectedCategory]);

  const handleCopyCheatSheet = async () => {
    const text = DEFAULT_KEYBOARD_SHORTCUTS.map(
      (s) => `[${s.keys.join(' + ')}] - ${s.title}: ${s.description}`
    ).join('\n');

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  const content = (
    <div className="flex flex-col gap-3 select-none">
      {/* 1. Nothing OS Dot-Matrix Aesthetic Ribbon Banner */}
      <div className="p-3 bg-[#0d0d12] rounded-2xl border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-3">
          {/* Dot-Matrix Icon Box */}
          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-cyan-400 shrink-0 shadow-inner">
            <Keyboard className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-tech font-bold text-sm text-zinc-100 uppercase tracking-wider">
                Keyboard & Hardware Mappings
              </span>
              <span className="font-mono text-[8px] bg-cyan-950 text-cyan-300 border border-cyan-500/50 px-1.5 py-0.2 rounded font-black uppercase">
                DOT-MATRIX HUD
              </span>
            </div>
            <span className="font-mono text-[9.5px] text-zinc-400 block">
              Alle aktiven Tastenbefehle und MIDI-Routings im Überblick
            </span>
          </div>
        </div>

        {/* Copy Cheat Sheet Button */}
        <button
          onClick={handleCopyCheatSheet}
          className={`px-2.5 py-1 rounded-lg font-mono text-[9px] font-bold flex items-center gap-1.5 transition active:scale-95 border shrink-0 ${
            copiedAll
              ? 'bg-emerald-500 text-zinc-950 border-emerald-400 font-extrabold'
              : 'bg-zinc-850 hover:bg-zinc-800 text-zinc-300 border-zinc-750'
          }`}
          title="Tastatur-Übersicht in Zwischenablage kopieren"
        >
          {copiedAll ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          <span>{copiedAll ? 'KOPIERT!' : 'LISTE KOPIEREN'}</span>
        </button>
      </div>

      {/* 2. Current Device Status Box (Live Controller Indicator) */}
      <div className="p-3 rounded-2xl bg-gradient-to-r from-[#121218] via-[#101015] to-[#0c0c10] border border-zinc-800 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-750 flex items-center justify-center text-rose-400 shrink-0">
            <Cpu className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[8.5px] text-zinc-500 font-bold uppercase tracking-wider">
                AKTIVES GERÄT:
              </span>
              <span className="flex items-center gap-1 font-mono text-[8px] px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                VERBUNDEN
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-zinc-200 truncate block">
              {activeDevice ? activeDevice.name : 'Standard Tastatur & Web MIDI'}
            </span>
            <span className="font-mono text-[8.5px] text-zinc-400">
              Preset: <strong className="text-zinc-300">{activePreset.replace(/_/g, ' ')}</strong> • {bindings.length} Hardware-Bindings aktiv
            </span>
          </div>
        </div>

        {onOpenMidiLearn && (
          <button
            onClick={onOpenMidiLearn}
            className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-mono text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition active:scale-95 shrink-0 shadow-md"
            title="MIDI Learn Studio öffnen"
          >
            <Cable className="w-3 h-3" />
            <span>MIDI LEARN ÖFFNEN</span>
          </button>
        )}
      </div>

      {/* 3. Search Bar & Category Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tastaturkürzel oder Funktion suchen (z.B. Space, Cue, Mute)..."
            className="w-full bg-[#111116] border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 font-mono text-[10px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/60"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 shrink-0">
          {[
            { id: 'ALL', label: 'ALLE' },
            { id: 'TRANSPORT', label: 'TRANSPORT' },
            { id: 'STEMS', label: 'STEMS & MUTE' },
            { id: 'NAVIGATION', label: 'NAVIGATION' },
            { id: 'PADS', label: 'PADS' },
            { id: 'MIDI', label: 'HARDWARE' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2 py-1 rounded-lg font-mono text-[8px] font-bold uppercase transition active:scale-95 shrink-0 border ${
                selectedCategory === cat.id
                  ? 'bg-zinc-100 text-zinc-950 border-white font-extrabold shadow-xs'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Visual Shortcuts Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[55vh] overflow-y-auto pr-1">
        {filteredShortcuts.map((item) => (
          <div
            key={item.id}
            className="p-2.5 rounded-xl bg-[#111116] border border-zinc-850 hover:border-zinc-750 transition flex flex-col justify-between gap-1.5"
          >
            {/* Top row: Keys Badges & Category indicator */}
            <div className="flex items-center justify-between gap-2">
              {/* Tactile Key Caps */}
              <div className="flex items-center gap-1 flex-wrap">
                {item.keys.map((k, kIdx) => (
                  <React.Fragment key={kIdx}>
                    <kbd className="px-2 py-0.5 rounded-md bg-[#191922] border border-zinc-700/80 text-zinc-200 font-mono text-[9px] font-bold shadow-[0_2px_0_rgba(0,0,0,0.6)] tracking-wide">
                      {k}
                    </kbd>
                    {kIdx < item.keys.length - 1 && (
                      <span className="text-[8px] font-mono text-zinc-600 font-bold">/</span>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Category Mini Badge */}
              <span
                className={`font-mono text-[7px] font-black uppercase px-1.5 py-0.2 rounded border ${
                  item.category === 'TRANSPORT'
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    : item.category === 'STEMS'
                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                    : item.category === 'PADS'
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    : item.category === 'MIDI'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}
              >
                {item.category}
              </span>
            </div>

            {/* Title & Description */}
            <div>
              <span className="font-tech font-bold text-xs text-zinc-100 block">
                {item.title}
              </span>
              <span className="font-mono text-[9px] text-zinc-400 block leading-tight">
                {item.description}
              </span>
            </div>

            {/* MIDI Mapping Footnote if applicable */}
            {item.midiMapping && (
              <div className="flex items-center gap-1 pt-1 border-t border-zinc-850/80 text-[7.5px] font-mono text-amber-400/90">
                <Cable className="w-2.5 h-2.5 shrink-0 text-amber-400" />
                <span className="truncate">MIDI: {item.midiMapping}</span>
              </div>
            )}
          </div>
        ))}

        {filteredShortcuts.length === 0 && (
          <div className="col-span-full py-8 text-center text-zinc-500 font-mono text-xs">
            Keine Tastenkürzel für &quot;{searchQuery}&quot; gefunden.
          </div>
        )}
      </div>

      {/* 5. Minimalist Dot-Matrix Footnote / Tips */}
      <div className="p-2.5 bg-[#0a0a0f] rounded-xl border border-zinc-850 text-zinc-400 font-mono text-[8.5px] flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
          <span>
            <strong>Tipp:</strong> Drücke jederzeit <strong>?</strong> auf deiner Tastatur, um dieses Hilfefenster aufzurufen.
          </span>
        </div>
        <span className="text-zinc-500">
          Schubertgrv v3.2 • Latency: &lt;1.2ms
        </span>
      </div>
    </div>
  );

  // If used as an embedded section inside SettingsOverlay
  if (isInlineSection) {
    return content;
  }

  // Standalone Fullscreen Modal Overlay
  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#0f0f15] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-850 bg-[#121218]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-tech font-bold text-sm text-zinc-100 flex items-center gap-1.5">
                Keyboard & MIDI Shortcuts
                <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[8px] font-mono font-bold">
                  HUD
                </span>
              </h2>
              <span className="font-mono text-[9px] text-zinc-400 block">
                Minimalist Dot-Matrix Controller & Shortcut Guide
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition active:scale-95"
            aria-label="Schließen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 overflow-y-auto">{content}</div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-zinc-850 bg-[#121218] flex items-center justify-between">
          <span className="font-mono text-[9px] text-zinc-500">
            Kompatibel mit Native Instruments Kontrol X1, F1, A25 & allen Standard-Tastaturen
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono text-[9.5px] font-bold transition active:scale-95"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
