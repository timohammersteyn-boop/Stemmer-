import React, { useState } from 'react';
import {
  ChevronLeft,
  X,
  BookOpen,
  GraduationCap,
  Play,
  CheckCircle2,
  Sliders,
  Grid,
  Sparkles,
  Cable,
  Keyboard,
  Download,
  ArrowRight,
  Volume2,
  Award,
  Search,
  ZoomIn,
  Crosshair,
  MapPin,
  Activity,
  Terminal,
  Smartphone,
  Radio,
  Layers,
  Compass,
  Maximize2,
  Eye,
  Music2,
  Cpu,
  ShieldCheck,
  Disc,
  Shuffle,
  Camera,
} from 'lucide-react';
import { ScreenMode } from '../../types';

interface ManualSchoolOverlayProps {
  onClose: () => void;
  onNavigateMode?: (mode: ScreenMode) => void;
  onTriggerTestSound?: (soundType: string) => void;
}

export const ManualSchoolOverlay: React.FC<ManualSchoolOverlayProps> = ({
  onClose,
  onNavigateMode,
  onTriggerTestSound,
}) => {
  const [activeTab, setActiveTab] = useState<'PRODUCT' | 'SCHOOL' | 'MANUAL'>('PRODUCT');
  const [currentStep, setCurrentStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [completedSteps, setCompletedSteps] = useState<number[]>([0]);
  const [activeScreenshot, setActiveScreenshot] = useState<number>(0);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const schoolSteps = [
    {
      id: 'stems',
      title: '1. Die 4-Stem Philosophie',
      subtitle: 'Drums, Bass, Music und Vocal in Echtzeit trennen & remixen',
      icon: Volume2,
      accent: '#f4f4f5',
      badge: 'GRUNDLAGEN',
      content: (
        <div className="space-y-3 text-xs font-mono text-zinc-300 leading-relaxed">
          <p>
            Im Gegensatz zu herkömmlichen 2-Kanal DJ-Playern trennt <strong className="text-white">Schubertgrv</strong> jeden Track in 4 unabhängige Audio-Spuren (Stems):
          </p>
          <div className="grid grid-cols-2 gap-2 my-2">
            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-200 font-bold block mb-0.5">⚪ DRUMS</span>
              <span className="text-[10px] text-zinc-400">Kick, Snare, Hi-Hats, Percussion</span>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-sky-400 font-bold block mb-0.5">🔵 BASS</span>
              <span className="text-[10px] text-zinc-400">Sub-Bass, Synth-Bass, 808s</span>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-emerald-400 font-bold block mb-0.5">🟢 MUSIC</span>
              <span className="text-[10px] text-zinc-400">Melodie, Synths, Klavier, Gitarren</span>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-orange-400 font-bold block mb-0.5">🟠 VOCAL</span>
              <span className="text-[10px] text-zinc-400">Acapella, Gesang, Sprach-Samples</span>
            </div>
          </div>
          <p className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800 text-zinc-400">
            💡 <strong className="text-zinc-200">Pro-Tipp:</strong> Drücke auf der Tastatur die Tasten <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-white font-bold">1</kbd>, <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-white font-bold">2</kbd>, <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-white font-bold">3</kbd>, <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-white font-bold">4</kbd> um Stems sofort stummzuschalten (Mute), oder <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-white font-bold">Q</kbd>, <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-white font-bold">W</kbd>, <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-white font-bold">E</kbd>, <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-white font-bold">R</kbd> für Solo.
          </p>
        </div>
      ),
    },
    {
      id: 'zoom_cue',
      title: '2. Waveform Zoom & Präzise CUE-Punkte',
      subtitle: '2-Finger Pinch, 1× bis 8× Schieberegler & Millisekunden-Genauigkeit',
      icon: Crosshair,
      accent: '#38bdf8',
      badge: 'TIMELINE & CUE',
      content: (
        <div className="space-y-3 text-xs font-mono text-zinc-300 leading-relaxed">
          <p>
            Für das punktgenaue Setzen von CUE-Punkten und Drops bietet die Timeline auf dem <strong className="text-white">STEMS SCREEN</strong> eine hochauflösende Zoom-Engine:
          </p>
          <div className="bg-[#121217] p-3 rounded-xl border border-zinc-800 space-y-2">
            <div className="flex items-center gap-2">
              <ZoomIn className="w-4 h-4 text-sky-400" />
              <strong className="text-white">Pinch-Geste & Schieberegler (1× – 8×)</strong>
            </div>
            <p className="text-[11px] text-zinc-400">
              Vergrößere die Wellenform mit einer intuitiven 2-Finger-Geste (Pinch) auf dem Touchscreen oder nutze den Schieberegler bzw. die Presets <span className="text-white font-bold">1×, 2×, 4×, 8×</span>.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-sky-400 font-bold block mb-1">📍 CUE-PUNKT SETZEN</span>
              <span className="text-[10px] text-zinc-400">
                Tippe auf <strong className="text-white">[SET CUE]</strong> oder doppelklicke auf eine Transiente. Der blaue CUE-Marker rastet sofort millisekundengenau ein.
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-rose-400 font-bold block mb-1">⚡ NOTHING BEAT-GRID OVERLAY</span>
              <span className="text-[10px] text-zinc-400">
                Mathematisch exaktes Taktgitter im Nothing-Design: Rote Punktmatrix-Säulen für 4-Bar Phrasen, Taktnummern, Sub-Beat Ticks und aktive Takthervorhebung. Umschaltbar via <strong className="text-white">[GRID]</strong> Taste (BARS / BEATS / AUS).
              </span>
            </div>
          </div>
          <p className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800 text-zinc-400">
            🎯 <strong className="text-zinc-200">Phrasen-Struktur (HUD):</strong> Unten zeigt das <strong className="text-rose-400">PHRASE [ 1 2 3 4 ]</strong> Segment live an, in welchem Takt des 4-Bar Zyklus du dich befindest, synchronisiert mit 4-Beat Rhythmus-LEDs.
          </p>
        </div>
      ),
    },
    {
      id: 'pads',
      title: '3. 16 Performance Pads & 4 Bänke (A, B, C, D)',
      subtitle: 'Sofortige Bank-Umschaltung ohne störende Menü-Modals',
      icon: Grid,
      accent: '#a855f7',
      badge: 'PERFORMANCE',
      content: (
        <div className="space-y-3 text-xs font-mono text-zinc-300 leading-relaxed">
          <p>
            Im <strong className="text-purple-400">PAD MODE</strong> steuerst du eine 4×4 Matrix aus 16 haptischen Pads mit optischem LED-Feedback und minimaler Latenz.
          </p>
          <div className="space-y-1.5 my-2">
            <div className="p-2 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
              <div>
                <strong className="text-white block">BANK A — HOT CUES</strong>
                <span className="text-[10px] text-zinc-400">Springt sofort zu Taktabschnitten (Drop, Intro, Bridge)</span>
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">BANK A</span>
            </div>
            <div className="p-2 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
              <div>
                <strong className="text-white block">BANK B — SLICER & RE-GROOVE</strong>
                <span className="text-[10px] text-zinc-400">Zerschneidet den Takt in 1/8 und 1/16 Beats</span>
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">BANK B</span>
            </div>
            <div className="p-2 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
              <div>
                <strong className="text-white block">BANK C — DRUM ROLLS & TRANSITIONS</strong>
                <span className="text-[10px] text-zinc-400">Rhythmische Rolls für intensive Build-Ups</span>
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">BANK C</span>
            </div>
            <div className="p-2 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
              <div>
                <strong className="text-white block">BANK D — STEM REMIX & LIVE LOOPS</strong>
                <span className="text-[10px] text-zinc-400">Schnelles Loop-Stottern und Remix-Trigger</span>
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">BANK D</span>
            </div>
          </div>
          <p className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800 text-zinc-400">
            ⚡ <strong className="text-zinc-200">Zero-Modal Umschaltung:</strong> Du wechselst zwischen den Bänken A, B, C und D mit einem Klick auf die Taster oder per <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-white font-bold">Shift+A/B/C/D</kbd> – ganz ohne modale Dialoge!
          </p>
        </div>
      ),
    },
    {
      id: 'mix',
      title: '4. Tactile Mixing & 3-Band Reactive EQ',
      subtitle: 'Flat Material Fader, dB Anzeige und interaktive Frequenzkurven',
      icon: Sliders,
      accent: '#38bdf8',
      badge: 'SOUND SHAPING',
      content: (
        <div className="space-y-3 text-xs font-mono text-zinc-300 leading-relaxed">
          <p>
            Im <strong className="text-sky-400">MIX MODE</strong> und im <strong className="text-white">STEM EDIT OVERLAY</strong> formst du den Sound wie an einem Studio-Mischpult:
          </p>
          <ul className="list-disc pl-4 space-y-1.5 text-zinc-400">
            <li>
              <strong className="text-zinc-200">Flat Fader:</strong> Keine skeuomorphen 3D-Schatten, sondern klare digitale Präzision mit Echtzeit dB-Pegelanzeige.
            </li>
            <li>
              <strong className="text-zinc-200">Interaktive 3-Band SVG-Kurve:</strong> Ziehe direkt mit dem Finger oder der Maus über die Frequenzkurve (Low Shelf, Mid Bell, High Shelf).
            </li>
            <li>
              <strong className="text-zinc-200">Master Output EQ:</strong> In den Einstellungen kannst du vor der Summenstufe ein globales Sound-Shaping (z.B. "Club Bass Boost" oder "Smiley Curve") anwenden.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'fx',
      title: '5. Live FX & Central Arc Filter',
      subtitle: 'Der Nothing-OS inspirierte kreisförmige Hauptregler',
      icon: Sparkles,
      accent: '#f43f5e',
      badge: 'EFFEKTE',
      content: (
        <div className="space-y-3 text-xs font-mono text-zinc-300 leading-relaxed">
          <p>
            Der <strong className="text-rose-400">FX MODE</strong> stellt einen interaktiven <strong className="text-white">Echtzeit-Spektralanalysator</strong> und Biquad-Frequenzgang ins Zentrum deiner Performance:
          </p>
          <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 space-y-2">
            <div className="flex justify-between items-center text-zinc-200 font-bold">
              <span>SPEKTRALANALYSATOR & FILTERKURVE</span>
              <span className="text-rose-400">LPF / HPF / DUAL</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              48 logarithmische FFT-Balken zeigen die Audio-Energie von 20 Hz bis 20 kHz. Die rote Kurve bildet die Übertragungsfunktion mit Cutoff und Resonanz (Q) exakt ab. Berühre und ziehe direkt im Graphen, um Frequenzen live zu modulieren!
            </p>
          </div>
          <p>
            Darunter befindet sich der <strong className="text-zinc-200">STEM FX SEND BUS</strong>: Bestimme für jeden der 4 Stems (Drums, Bass, Music, Vocal) separat, wie viel Effektanteil beigemischt wird.
          </p>
        </div>
      ),
    },
    {
      id: 'midi',
      title: '6. Native Instruments Traktor Kontrol X1 Mapping',
      subtitle: 'Offizielles NI Kontrol X1 (MK1/MK2/MK3) & F1 Hardware-Mapping',
      icon: Cable,
      accent: '#fbbf24',
      badge: 'HARDWARE INTEGRATION',
      content: (
        <div className="space-y-3 text-xs font-mono text-zinc-300 leading-relaxed">
          <p>
            <strong className="text-amber-400">Schubertgrv</strong> nutzt das originale Werksprofil des <strong>Native Instruments Traktor Kontrol X1 (MK2/MK3)</strong> via Web MIDI API:
          </p>
          <div className="bg-[#121217] p-3 rounded-xl border border-zinc-800 space-y-2 font-mono text-[11px]">
            <div className="text-amber-400 font-bold border-b border-zinc-800 pb-1 flex items-center justify-between">
              <span>TRAKTOR KONTROL X1</span>
              <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded">STANDARD MAPPING</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="p-1.5 bg-zinc-900 rounded border border-zinc-800">
                <span className="text-zinc-500 block text-[9px]">4× FX DREHREGLER (TOP)</span>
                <span className="text-white font-bold block">CC 16: Drums Fader</span>
                <span className="text-sky-300 font-bold block">CC 17: Bass Fader</span>
                <span className="text-emerald-300 font-bold block">CC 18: Music Fader</span>
                <span className="text-orange-300 font-bold block">CC 19: Vocal Fader</span>
              </div>
              <div className="p-1.5 bg-zinc-900 rounded border border-zinc-800">
                <span className="text-zinc-500 block text-[9px]">4× FX TASTER (TOP)</span>
                <span className="text-white font-bold block">Note 16: Mute Drums</span>
                <span className="text-sky-300 font-bold block">Note 17: Mute Bass</span>
                <span className="text-emerald-300 font-bold block">Note 18: Mute Music</span>
                <span className="text-orange-300 font-bold block">Note 19: Mute Vocal</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="p-1.5 bg-zinc-900 rounded border border-zinc-800">
                <span className="text-zinc-500 block text-[9px]">8× HOTCUES & SHIFT</span>
                <span className="text-zinc-200 block">Note 24–31: Pads 1–8</span>
                <span className="text-zinc-400 block text-[9px]">Shift: Note 32–39 (Pads 9–16)</span>
              </div>
              <div className="p-1.5 bg-zinc-900 rounded border border-zinc-800">
                <span className="text-zinc-500 block text-[9px]">TRANSPORT & FX ENCODER</span>
                <span className="text-emerald-400 font-bold block">Note 44: PLAY / PAUSE</span>
                <span className="text-sky-400 font-bold block">Note 45: CUE POINT</span>
                <span className="text-zinc-300 block text-[9px]">CC 20: Filter Cutoff / FX</span>
              </div>
            </div>
          </div>
          <p className="text-zinc-400">
            Plug-and-play: Schließe deinen Kontrol X1 per USB an. Er wird ohne Treiberinstallation sofort erkannt. Über <strong className="text-zinc-200">MIDI Learn</strong> in den Einstellungen kannst du jedes Bedienelement umbelegen.
          </p>
        </div>
      ),
    },
    {
      id: 'shortcuts',
      title: '7. DJ Shortcuts & Minimalistisches Activity Feed',
      subtitle: 'Tastatur-Befehle, Tap Tempo und das Live-Protokoll',
      icon: Terminal,
      accent: '#10b981',
      badge: 'PRO-WORKFLOW',
      content: (
        <div className="space-y-3 text-xs font-mono text-zinc-300 leading-relaxed">
          <p>
            Für das ultimative Live-Erlebnis ohne Verzögerung bietet dir Schubertgrv ein umfassendes Tastatur-System:
          </p>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800">
              <span className="text-zinc-500 block mb-1">TRANSPORT</span>
              <span className="text-white font-bold block">SPACE / P : Play/Pause</span>
              <span className="text-white font-bold block">C : CUE • L : LOOP</span>
              <span className="text-rose-400 font-bold block">Y / Shift+S : SYNC LOCK</span>
              <span className="text-cyan-400 font-bold block">Alt+W / Shift+W : SWAP A⇄B</span>
              <span className="text-zinc-400 block text-[9px]">← / J: Zurück | → / N: Weiter</span>
            </div>
            <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800">
              <span className="text-zinc-500 block mb-1">NAVIGATION</span>
              <span className="text-white font-bold block">TAB : Modus wechseln</span>
              <span className="text-white block">S: Stems • M: Mix</span>
              <span className="text-white block">G: Pad • F: FX • B: Lib</span>
              <span className="text-zinc-400 block text-[9px]">Shift+A..D: Pad Bänke</span>
            </div>
          </div>
          <div className="p-2.5 bg-zinc-900/90 rounded-xl border border-zinc-800 space-y-1">
            <div className="flex items-center gap-1.5 text-rose-400 font-bold">
              <Terminal className="w-3.5 h-3.5" />
              <span>MINIMALISTISCHES ACTIVITY FEED</span>
            </div>
            <p className="text-[10px] text-zinc-400">
              Jede Aktion (Track Load, CUE Trigger, FX Send, Stem Mute) wird in einem dezenten Schwebeticker über der Navigationsleiste protokolliert. Klicke auf das Ticker-Widget oder das Terminal-Icon in der Kopfzeile, um das vollständige Protokoll zu öffnen.
            </p>
          </div>
        </div>
      ),
    },
  ];

  const currentLesson = schoolSteps[currentStep];

  const handleNextStep = () => {
    if (currentStep < schoolSteps.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      if (!completedSteps.includes(next)) {
        setCompletedSteps([...completedSteps, next]);
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const manualSections = [
    {
      title: '1. SYSTEM-ÜBERSICHT & ARCHITEKTUR',
      keywords: 'philosophie layout nichts traktor f1 x1 material flat',
      body: `Schubertgrv ist ein moderner, mobiler 4-Stem DJ Performance Player. Die Benutzeroberfläche kombiniert die haptische Klarheit des Native Instruments Traktor Kontrol F1 / X1 mit der minimalistischen Punktmatrix-Ästhetik von Nothing OS. Alle Hauptfunktionen sind auf einem einzigen Viewport ohne vertikales Scrollen erreichbar.`,
    },
    {
      title: '2. AUDIO ENGINE & SYNTHESE',
      keywords: 'web audio latenz engine master limiter biquad eq',
      body: `Die Audio Engine basiert auf der nativen Web Audio API mit Lookahead-Clock. Jeder Stem verfügt über eine dedizierte Signalkette bestehend aus Volume Gain, Lowpass/Highpass Resonanzfilter, 3-Band Equalizer (Low/Mid/High Biquad) und Stereo-Panner. Ein nachgeschalteter Master Limiter verhindert digitales Clipping.`,
    },
    {
      title: '3. DIE 4 PAD-BÄNKE & MODI',
      keywords: 'pad mode bank hot cue loop slicer roll quantize',
      body: `Bank A (Hot Cues): Markiert entscheidende Track-Punkte.
Bank B (Slicer): Teilt den aktuellen 4-Bar Takt in slicebare Beats.
Bank C (Roll): Ermöglicht rhythmische Beat-Loops von 1/16 bis 1 Beat.
Bank D (Stem Remix): Schaltet gezielte Stem-Mutes und Loop-Stabs.
Umschalten zwischen Bänken erfolgt ohne störende Modaldialoge über die Direkttaster oder Shift+A/B/C/D.`,
    },
    {
      title: '4. WAVEFORM-TIMELINE, PINCH-ZOOM, BEAT-GRID & TAKTSTRUKTUR',
      keywords: 'zoom pinch timeline cue marker transienten beatgrid bar welle schieberegler phrasen takte gitter nothing',
      body: `Die Timeline im Stems-Screen unterstützt hochpräzisen Transient-Zoom von 1.0× bis 8.0× und ein visuelles Beat-Grid im Nothing-Design:
• 2-Finger Pinch-Geste auf Touchscreens oder Schieberegler in der Kopfzeile.
• Presets 1×, 2×, 4×, 8× sowie Reset-Taste.
• CUE-Platzierung: Klicke auf [SET CUE] oder doppelklicke auf die Wellenform, um den CUE-Punkt exakt auf eine Transiente zu setzen.
• Nothing Beat-Grid Overlay: Rote Punktmatrix-Säulen markieren 4-Bar Phrasen (Drops & Übergänge). Weiße Micro-Dots zeigen Takte und Viertelbeats.
• Phrasen-Anzeige & HUD: PHRASE [ 1 2 3 4 ] segmentiert Takte visuell, begleitet von Beat-LEDs mit rotem Downbeat-Puls und mm:ss.ms Zeitanzeige.
• Taktgitter-Modi: Über die [GRID] Taste kann zwischen BARS (Takte), BEATS (Viertelnoten) und AUS gewechselt werden.`,
    },
    {
      title: '5. NATIVE INSTRUMENTS KONTROL X1 STANDARD-MAPPING',
      keywords: 'midi traktor kontrol x1 mapping cc note f1 controller hardware usb',
      body: `Standardbelegung für NI Traktor Kontrol X1 (MK1 / MK2 / MK3):
• 4× FX Drehregler (Top): CC 16 (Drums), CC 17 (Bass), CC 18 (Music), CC 19 (Vocal)
• 4× FX Taster: Note 16 (Mute Drums), Note 17 (Mute Bass), Note 18 (Mute Music), Note 19 (Mute Vocal)
• 8× Hot Cues: Note 24 bis 31 (Pads 1 bis 8 in Bank A)
• Shift + Cues: Note 32 bis 39 (Pads 9 bis 16)
• Dry/Wet Encoder: CC 20 (Filter Cutoff & FX Amount)
• Loop Active: Note 20
• Browse Push: Note 22 (Track laden)
• Transport: Note 44 (PLAY/PAUSE) | Note 45 (CUE) | Note 46 (SYNC) | Note 47 (FLUX)
Über Einstellungen > MIDI & HARDWARE CONTROLLER kann der Controller getestet und umbelegt werden.`,
    },
    {
      title: '6. MASTER EQUALIZER & SOUND-SHAPING',
      keywords: 'master eq shelf curve frequenzen smiley bass boost',
      body: `Vor der Summenstufe verfügt Schubertgrv über einen 3-Band Master Equalizer mit interaktiver SVG-Visualisierung:
• Low Shelf (100 Hz): ±12 dB für Sub-Bass Fundament
• Mid Peaking (1.2 kHz): ±12 dB für Präsenz und Vocal-Durchdringung
• High Shelf (8.0 kHz): ±12 dB für seidige Höhen und Brillanz
Presets: Flat Linear, Club Bass Boost, Warm Analog, Bright Air, Smiley Curve.`,
    },
    {
      title: '7. DJ TASTATURBEFEHLE (SHORTCUTS)',
      keywords: 'tastatur shortcuts keyboard hotkeys space cue loop tab transport navigation sync swap deck',
      body: `Vollständige Tastatur-Steuerung für Desktop-DJs:
• Transport: LEERTASTE / P = Play/Pause | C = CUE Point | L = Loop Toggle | Y / Shift+S = SYNC Lock | Alt+W / Shift+W = SWAP Decks | ←/J = Zurück | →/N = Weiter
• Navigation: TAB = Nächster Modus | S = Stems | M = Mix | G = Pad | F = FX | B = Library
• Stem Mutes: 1 = Drums | 2 = Bass | 3 = Music | 4 = Vocal
• Stem Solo: Q = Drums | W = Bass | E = Music | R = Vocal
• Pad Bänke: Shift + A / B / C / D`,
    },
    {
      title: '8. ACTIVITY FEED & PERFORMANCE-FEEDBACK',
      keywords: 'activity feed log terminal tracking historie protokoll feedback',
      body: `Das Activity Feed erfasst in Echtzeit alle DJ-Aktionen (Track Loaded, CUE Point Set, Stem Muted, FX Filter Sweeps):
• Schwebender Mini-Ticker direkt über der unteren Modus-Leiste.
• Klick auf den Ticker oder auf das Terminal-Icon (oben rechts) öffnet das vollständige Terminal-Overlay.
• Einträge können durchsucht, nach Kategorien gefiltert, kopiert oder gelöscht werden.`,
    },
    {
      title: '9. PWA & OFFLINE-BETRIEB',
      keywords: 'pwa offline installieren service worker homescreen safari chrome',
      body: `Schubertgrv kann als Progressive Web App (PWA) direkt auf dem Smartphone oder Desktop installiert werden:
• Android / Chrome: Klicke in der Kopfzeile auf INSTALLIEREN.
• iOS Safari: Drücke im Browser auf das Teilen-Symbol und wähle "Zum Home-Bildschirm".
Nach der Installation startet die App im echten Standalone-Vollbildmodus ohne Browser-Leisten mit Null-Latenz-Audiocache.`,
    },
    {
      title: '10. AUDIO-IMPORT, PEAK RMS & GAIN-KOMPENSATION',
      keywords: 'gain compensation peak rms lautheit normalisierung audio import pegel club referenz ebu r128',
      body: `Das Gain-Compensation-Utility im Track-Lade-Flow gleicht Lautstärkesprünge zwischen Tracks automatisch aus:
• Lokale Audiodateien (WAV, MP3, FLAC, AIFF, OGG) können direkt über [DATEI IMPORTIEREN] geladen werden.
• Die Web Audio Engine decodiert den Puffer und berechnet den mathematischen True Peak (dBFS) und den Peak RMS über Gleitfenster.
• Ziel-Referenzpegel: -14.0 dB RMS (Standard für Club-Mastering und DJ-Sets).
• Optimaler Gain-Vorschlag: Berechnet die Differenz (Ziel - Peak RMS) inklusive Schutzbegrenzung gegen Übersteuerungen (Peak Ceiling -0.3 dBFS).
• Auto Match vs. Manuell: DJs können den Vorschlag automatisch übernehmen oder mit dem Gain-Trim-Schieberegler (-12 dB bis +12 dB) feinjustieren.
• Die Aussteuerung wird direkt auf die Audio-Engine angewendet, sodass alle Tracks im Mix mit konsistenter, professioneller Lautstärke spielen.`,
    },
    {
      title: '11. FADER-KURVEN (LINEAR, EXPONENTIAL, CONSTANT POWER)',
      keywords: 'fader curve lautstärkekurve kennlinie linear exponential constant power stem mixer channel',
      body: `Über die Einstellungen (AUDIO & OUTPUT) kann die akustische Kennlinie der 4 Stem-Lautstärkeregler gewählt werden:
• Linear: Direkter 1:1 Pegelverlauf. Exakte akustische Pegelbalance bei manueller Justage.
• Exponential (Audio Taper): Logarithmischer Verlauf nach analogem Mischpult-Vorbild mit feinfühliger Auflösung im unteren Faderbereich (-48 bis -12 dB) und schnellem Pegelanstieg oben.
• Constant Power (Equal Power): Sinusförmige Gleichleistungskurve [sin(p · π/2)]. Garantiert konstante akustische Summenenergie beim Hinzumischen und Ausblenden von Stems, ohne Lautstärkeeinbruch im Mittenbereich.
Die gewählte Kennlinie wird in Echtzeit von der StemMixerChannel-Komponente auf alle Fader angewendet.`,
    },
    {
      title: '12. GLYPH-HEADER & BEAT-PHASE TAKTINDIKATOR',
      keywords: 'glyph header beat phase bpm puls takt heartbeat dot matrix rhythmus nothing rot downbeat micro leds',
      body: `Der GlyphHeader verfügt über ein synchrones Punktmatrix-Taktfeedback für den DJ:
• 4-Phasen Beat-Matrix: Das [ 1 2 3 4 ] LED-Cluster neben der BPM-Anzeige besteht aus vertikalen 3-Punkt-LED-Säulen, die in Echtzeit auf jedem Viertelbeat des aktuellen Takts aufblitzen.
• Downbeat-Farbe: Taktbeginn (Beat 1) zündet in intensivem Nothing-Rot mit akustischem Halo-Ping, während die Beats 2, 3 und 4 in hellem Phosphor-Weiß aufleuchten.
• Rhythmischer Glyph-Herzschlag: Das 4-Säulen BAR-Modul neben dem Schubert*grv* Logo sowie der Strobe-Punkt neben der BPM pulsiert im exakten Takt der BPM (mit exponentiellem Phosphor-Decay) und hält den Groove auch im Pause-/CUE-Modus präsent.`,
    },
    {
      title: '13. ECHTZEIT-SPEKTRALANALYSATOR & FILTER-FREQUENZGANG (LPF / HPF)',
      keywords: 'spectral analyzer frequenzgang spektrum biquad filter lpf hpf lowpass highpass cutoff resonanz q roll-off',
      body: `Der FX-Screen integriert einen interaktiven Spektralanalysator mit präziser Biquad-Frequenzgangkurve:
• 48 FFT-Spektralbalken: Logarithmisch skaliert von 20 Hz bis 20 kHz visualisieren in Echtzeit die akustische Energie des Tracks.
• Low-Pass (LPF) & High-Pass (HPF) Kurven: Zeigt die mathematische 2nd-Order Biquad-Übertragungsfunktion mit Resonanz-Peak Q (+0 bis +18 dB) und -12 dB/Oktave Flankensteilheit.
• DUAL DJ Modus: Mittenstellung (50%) entspricht akustischem Bypass, Linksdrehung aktiviert den Tiefpass-Filter (LPF), Rechtsdrehung den Hochpass-Filter (HPF).
• Touch-Drag-Steuerung: Der Filter-Cutoff kann sowohl über den taktilen Regler als auch direkt durch Ziehen auf dem Spektralgraphen moduliert werden.`,
    },
    {
      title: '14. TRANSPORT-SYNC & DUAL-DECK BEAT-MATCHING (BPM LOCK & SWAP)',
      keywords: 'transport sync bpm lock swap deck a deck b instant doubles beatmatching master tempo angleich takt sperre',
      body: `Der Transport-Bereich verfügt über eine professionelle Beat-Sync- & Deck-Swap-Engine:
• Taktile SYNC-Taste: Direkt in den Transport-Bedienelementen (neben Play/Pause und Track-Navigation).
• Automatische BPM-Angleichung: Durch Klick auf [SYNC] wird die Wiedergabe-BPM des Standby-Tracks (Deck B) augenblicklich und mathematisch exakt an das Master-Deck (Deck A) angepasst.
• Visuelle Lock-Statusanzeige: Bei aktivem Sync leuchtet eine intensive Nothing-Rot pulsierende LED [● SYNC LOCKED] mit Schloss-Symbol und exakter BPM-Referenz. Bei Deaktivierung erlischt die LED [○ SYNC OFF].
• Taktile SWAP-Taste (Deck A ⇄ Deck B): Tauscht mit einem einzigen Klick augenblicklich den geladenen Track zwischen Deck A (Master) und Deck B (Standby). Die Playhead-Position wird auf 0 gesetzt, die optimale Gain-Kompensation des neuen Master-Tracks wird angewendet und bei verriegeltem Sync bleibt das Tempo nahtlos synchronisiert.
• Dual-Deck HUD: Die Statusleiste oberhalb der Tasten zeigt in Echtzeit beide Decks an (z. B. DECK A 128.0 | SYNC LOCKED | DECK B 128.0) inklusive Schnell-Swap-Pille.
• Live-Tempo-Nachführung: Ändert der DJ das Tempo von Deck A (z. B. über Tap Tempo), folgt Deck B bei verriegeltem Sync-Lock automatisch mit.
• Shortcuts & MIDI: SYNC umschaltbar über [Y] / [Shift+S] (Note 63). DECK SWAP umschaltbar über [Alt+W] / [Shift+W] (Note 64).`,
    },
  ];

  const filteredManual = manualSections.filter(
    (sec) =>
      sec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sec.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sec.keywords.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-[#09090c] flex flex-col p-4 select-none animate-in fade-in duration-150">
      {/* 1. Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-900 shrink-0">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-rose-500" />
          <span className="font-mono text-xs font-bold tracking-[0.2em] uppercase text-zinc-200">
            SCHUBERTGRV ACADEMY
          </span>
        </div>

        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Mode Tabs: Produkt & Hardware vs. Onboarding School vs. Benutzerhandbuch */}
      <div className="grid grid-cols-3 gap-1.5 my-3 shrink-0">
        <button
          onClick={() => setActiveTab('PRODUCT')}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-mono text-[10px] sm:text-xs font-bold uppercase transition border ${
            activeTab === 'PRODUCT'
              ? 'bg-zinc-100 text-zinc-950 border-white shadow-sm'
              : 'bg-[#121216] text-zinc-400 border-zinc-800 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="truncate">PRODUKT & HARDWARE</span>
        </button>
        <button
          onClick={() => setActiveTab('SCHOOL')}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-mono text-[10px] sm:text-xs font-bold uppercase transition border ${
            activeTab === 'SCHOOL'
              ? 'bg-zinc-100 text-zinc-950 border-white shadow-sm'
              : 'bg-[#121216] text-zinc-400 border-zinc-800 hover:text-white'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5 text-rose-500" />
          <span className="truncate">ONBOARDING SCHOOL</span>
        </button>
        <button
          onClick={() => setActiveTab('MANUAL')}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-mono text-[10px] sm:text-xs font-bold uppercase transition border ${
            activeTab === 'MANUAL'
              ? 'bg-zinc-100 text-zinc-950 border-white shadow-sm'
              : 'bg-[#121216] text-zinc-400 border-zinc-800 hover:text-white'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-sky-400" />
          <span className="truncate">BENUTZERHANDBUCH</span>
        </button>
      </div>

      {/* 3. Tab Content */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1">
        {activeTab === 'PRODUCT' ? (
          /* PRODUCT & HARDWARE SHOWCASE TAB */
          <div className="space-y-6 pb-4">
            {/* 1. Hero Product Title & App Description */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-[#18181f] to-[#121216] border border-zinc-800 space-y-2.5 shadow-xl">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-[9px] font-black uppercase tracking-wider">
                  PRODUKT-VISION & ÖKOSYSTEM
                </span>
                <span className="font-mono text-[10px] text-zinc-500">
                  SCHUBERTGRV PRIME EDITION
                </span>
              </div>
              <h2 className="font-tech text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
                Die nächste Generation des Stem-DJings
              </h2>
              <p className="font-mono text-xs text-zinc-300 leading-relaxed">
                <strong className="text-white">Schubertgrv</strong> ist eine revolutionäre, mobile 4-Stem DJ Performance Workstation.
                Anstatt vorgefertigte Stereo-Masters abzuspielen, zerlegt die native Audio-Engine jeden Track in Echtzeit in vier unabhängige musikalische Dimensionen:
                <span className="text-zinc-100 font-bold"> Drums</span>,
                <span className="text-sky-400 font-bold"> Bass</span>,
                <span className="text-emerald-400 font-bold"> Music</span> und
                <span className="text-orange-400 font-bold"> Vocal</span>.
                Kombiniert mit stufenloser <strong className="text-amber-300">Key Shift Transposition</strong>,
                einer intelligenten <strong className="text-emerald-400">Smart Shuffle Engine</strong> und studio-tauglichem
                <strong className="text-rose-400"> Master Tape Recording</strong> entsteht ein noch nie dagewesenes Maß an spontaner kreativer Freiheit im Club und Live-Stream.
              </p>
            </div>

            {/* 2. Studio Product Photo Showcase: Minimal Piano Black Hardware Controller */}
            <div className="p-4 rounded-2xl bg-[#0c0d11] border border-zinc-800 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-amber-400" />
                  <h3 className="font-tech font-bold text-base text-zinc-100 uppercase tracking-wide">
                    Schubertgrv Prime Hardware Controller • Solo Studio-Produktfoto
                  </h3>
                </div>
                <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 uppercase">
                  Finish: Klavierlack Schwarz (Obsidian)
                </span>
              </div>

              <p className="font-mono text-xs text-zinc-400 leading-relaxed">
                Minimalistisches, bündig eingelassenes Smartphone-Dock im Zentrum eines handpolierten Klavierlack-Gehäuses.
                Ausgestattet mit allen professionellen haptischen Bedienelementen: vier leichtgängige ALPS Stem-Lautstärkefader,
                Aluminium-Drehregler für Filter & Effekte, ein Key-Shift Endlos-Encoder, 16 beleuchtete Silikon-Pads und ein optischer Master-Crossfader.
              </p>

              {/* Dual Studio Product Photographs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Photo 1: Studio Hero Shot (16:9) */}
                <div
                  onClick={() =>
                    setSelectedPhoto(
                      '/src/assets/images/hardware_controller_hero_1791393997752.jpg'
                    )
                  }
                  className="group relative rounded-xl overflow-hidden border border-zinc-800/90 bg-black cursor-pointer shadow-lg hover:border-zinc-600 transition"
                >
                  <img
                    src="/src/assets/images/hardware_controller_hero_1791393997752.jpg"
                    alt="Schubertgrv Minimalistischer Hardware Controller in Klavierlack Schwarz mit integriertem Smartphone im Studio Umfeld"
                    referrerPolicy="no-referrer"
                    className="w-full aspect-[16/9] object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition" />
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white">
                    <span className="font-mono text-[10px] font-bold tracking-wider">
                      STUDIO FOTO 1: GESAMTANSICHT
                    </span>
                    <span className="font-mono text-[9px] bg-black/60 px-1.5 py-0.5 rounded border border-white/20 flex items-center gap-1">
                      <Maximize2 className="w-2.5 h-2.5" />
                      Klick zum Vergrößern
                    </span>
                  </div>
                </div>

                {/* Photo 2: Close-up Studio Perspective (4:3) */}
                <div
                  onClick={() =>
                    setSelectedPhoto(
                      '/src/assets/images/controller_dock_angle_1791394012012.jpg'
                    )
                  }
                  className="group relative rounded-xl overflow-hidden border border-zinc-800/90 bg-black cursor-pointer shadow-lg hover:border-zinc-600 transition"
                >
                  <img
                    src="/src/assets/images/controller_dock_angle_1791394012012.jpg"
                    alt="Perspektivische Nahaufnahme des Klavierlack Controllers mit Docking-Mulde und Reglern"
                    referrerPolicy="no-referrer"
                    className="w-full aspect-[16/9] md:aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition" />
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white">
                    <span className="font-mono text-[10px] font-bold tracking-wider">
                      STUDIO FOTO 2: DOCK & REGLER-DETAIL
                    </span>
                    <span className="font-mono text-[9px] bg-black/60 px-1.5 py-0.5 rounded border border-white/20 flex items-center gap-1">
                      <Maximize2 className="w-2.5 h-2.5" />
                      Klick zum Vergrößern
                    </span>
                  </div>
                </div>
              </div>

              {/* Hardware Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                <div className="p-2.5 rounded-xl bg-[#121217] border border-zinc-800/80">
                  <span className="text-zinc-200 font-bold text-xs block mb-1">
                    ✨ Piano Black Lacquer
                  </span>
                  <span className="text-[10px] text-zinc-400 block leading-tight">
                    6-schichtig handpolierter Klavierlack mit tiefem Spiegelglanz und kratzfester Versiegelung.
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#121217] border border-zinc-800/80">
                  <span className="text-zinc-200 font-bold text-xs block mb-1">
                    📱 Flush Smartphone Dock
                  </span>
                  <span className="text-[10px] text-zinc-400 block leading-tight">
                    Bündige Zero-Gap Führung mit rückseitigem USB-C Host-Interface für Sub-2ms Audio-Latenz.
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#121217] border border-zinc-800/80">
                  <span className="text-zinc-200 font-bold text-xs block mb-1">
                    🎚️ 4× ALPS Stem-Fader
                  </span>
                  <span className="text-[10px] text-zinc-400 block leading-tight">
                    Geschmeidige 45mm Faderwege für Drums, Bass, Music und Vocal mit taktilem Nullpunkt.
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#121217] border border-zinc-800/80">
                  <span className="text-zinc-200 font-bold text-xs block mb-1">
                    🎛️ Aluminium-Drehregler
                  </span>
                  <span className="text-[10px] text-zinc-400 block leading-tight">
                    Gerändelte Metallpotis für Dual-Filter (LPF/HPF), Master-Lautstärke und FX Dry/Wet.
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#121217] border border-zinc-800/80">
                  <span className="text-zinc-200 font-bold text-xs block mb-1">
                    ⬛ 16 RGB Silikon-Pads
                  </span>
                  <span className="text-[10px] text-zinc-400 block leading-tight">
                    Anschlagdynamische Drumpads für Hot Cues, Beat Slices, Loop Rolls und Stem Remixing.
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#121217] border border-zinc-800/80">
                  <span className="text-zinc-200 font-bold text-xs block mb-1">
                    ⚡ Optischer Crossfader
                  </span>
                  <span className="text-[10px] text-zinc-400 block leading-tight">
                    Berührungslos kontaktfreie Abtastung mit umschaltbarer Cut-Kurve (Linear/Expo/Constant Power).
                  </span>
                </div>
              </div>
            </div>

            {/* 3. App Screenshots & Screen Walkthrough */}
            <div className="p-4 rounded-2xl bg-[#121217] border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-tech font-bold text-base text-zinc-100 uppercase tracking-wide">
                    Die 4 Kern-Screens der Schubertgrv App
                  </h3>
                  <span className="font-mono text-[10px] text-zinc-400">
                    Interaktive Screenshots & Funktionsübersicht der Smartphone-Oberfläche
                  </span>
                </div>
                <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 uppercase">
                  Version 2.4 Pro
                </span>
              </div>

              {/* Screenshot Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Screenshot 1: Stems & Harmonic Mixing */}
                <div className="p-3.5 rounded-xl bg-[#16161d] border border-zinc-800 space-y-2.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase">
                        SCREEN 1: STEM MIXER & HARMONIC DJ
                      </span>
                      <span className="font-mono text-[9px] text-zinc-400">Deck A & B</span>
                    </div>

                    {/* Screenshot Mockup Container */}
                    <div className="p-2.5 rounded-lg bg-[#0b0c10] border border-zinc-900 space-y-2 font-mono text-[9px]">
                      <div className="flex items-center justify-between text-[8px] text-zinc-400 border-b border-zinc-900 pb-1">
                        <span className="text-rose-400 font-bold">DECK A: 8A (Am) • 128.0 BPM</span>
                        <span className="text-emerald-400 font-bold">KEY SHIFT: +2 ST ➔ 10A (Bm)</span>
                      </div>
                      {/* Mini Waveform Graphic */}
                      <div className="h-6 flex items-center gap-0.5 bg-black/60 rounded px-1">
                        {[40, 60, 90, 75, 45, 60, 85, 100, 70, 50, 80, 95, 60, 40, 70, 90, 80, 50].map((h, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-gradient-to-t from-rose-500 to-sky-400 rounded-full"
                            style={{ height: `${h}%` }}
                          />
                        ))}
                      </div>
                      {/* 4 Stem Meters Mockup */}
                      <div className="grid grid-cols-4 gap-1 text-[7.5px] text-center font-bold">
                        <div className="bg-zinc-900 p-1 rounded border border-zinc-800 text-zinc-300">
                          DRUMS <span className="block text-emerald-400">100%</span>
                        </div>
                        <div className="bg-zinc-900 p-1 rounded border border-zinc-800 text-sky-300">
                          BASS <span className="block text-sky-400">92%</span>
                        </div>
                        <div className="bg-zinc-900 p-1 rounded border border-zinc-800 text-emerald-300">
                          MUSIC <span className="block text-emerald-400">85%</span>
                        </div>
                        <div className="bg-zinc-900 p-1 rounded border border-zinc-800 text-orange-300">
                          VOCAL <span className="block text-orange-400">SOLO</span>
                        </div>
                      </div>
                    </div>

                    <p className="font-mono text-[11px] text-zinc-400 mt-2 leading-relaxed">
                      Zentraler Performance-Screen mit 8-fach Zoom-Wellenform, CUE-Setzung, Phasen-Meter und dem
                      <strong className="text-amber-300"> Key Shift Halbton-Schieberegler (-12 bis +12 ST)</strong> für harmonisches Harmonic Mixing.
                    </p>
                  </div>

                  {onNavigateMode && (
                    <button
                      onClick={() => {
                        onNavigateMode('STEMS');
                        onClose();
                      }}
                      className="w-full py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-mono text-[10px] font-bold uppercase transition flex items-center justify-center gap-1.5"
                    >
                      <Sliders className="w-3 h-3 text-rose-400" />
                      <span>Im Stems-Screen öffnen</span>
                    </button>
                  )}
                </div>

                {/* Screenshot 2: 16 Performance Pads & Remix */}
                <div className="p-3.5 rounded-xl bg-[#16161d] border border-zinc-800 space-y-2.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[9px] font-black px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 uppercase">
                        SCREEN 2: 16 PERFORMANCE PADS
                      </span>
                      <span className="font-mono text-[9px] text-zinc-400">Bänke A / B / C / D</span>
                    </div>

                    {/* Screenshot Mockup Container */}
                    <div className="p-2.5 rounded-lg bg-[#0b0c10] border border-zinc-900 space-y-2 font-mono text-[9px]">
                      <div className="flex items-center justify-between text-[8px] text-zinc-400 border-b border-zinc-900 pb-1">
                        <span className="text-sky-300 font-bold">BANK A: HOT CUES</span>
                        <span className="text-emerald-400 font-bold">QUANTIZE: 1/4 BEAT</span>
                      </div>
                      {/* 16 Pad Matrix Mockup */}
                      <div className="grid grid-cols-4 gap-1">
                        {['CUE 1', 'CUE 2', 'CUE 3', 'DROP', 'BUILD', 'BREAK', 'VOCAL', 'SOLO', 'LOOP 1', 'LOOP 2', 'ROLL', 'STAB', 'SUB', 'CRASH', 'FILTER', 'MUTE'].map((lbl, i) => (
                          <div
                            key={i}
                            className={`p-1 text-center rounded border text-[7px] font-bold ${
                              i === 0 || i === 3
                                ? 'bg-rose-500/30 border-rose-500 text-white shadow-sm'
                                : i === 6 || i === 7
                                ? 'bg-orange-500/30 border-orange-500 text-white'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                            }`}
                          >
                            {lbl}
                          </div>
                        ))}
                      </div>
                    </div>

                    <p className="font-mono text-[11px] text-zinc-400 mt-2 leading-relaxed">
                      16 anschlagdynamische Live-Performance-Pads aufgeteilt in vier Sound-Bänke: Hot Cues, Beat Slicer, Loop Rolls und Stem Remix Stabs.
                    </p>
                  </div>

                  {onNavigateMode && (
                    <button
                      onClick={() => {
                        onNavigateMode('PAD');
                        onClose();
                      }}
                      className="w-full py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-mono text-[10px] font-bold uppercase transition flex items-center justify-center gap-1.5"
                    >
                      <Grid className="w-3 h-3 text-sky-400" />
                      <span>Im Pad-Screen öffnen</span>
                    </button>
                  )}
                </div>

                {/* Screenshot 3: FX Studio & Master Tape Recorder */}
                <div className="p-3.5 rounded-xl bg-[#16161d] border border-zinc-800 space-y-2.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                        SCREEN 3: FX & MASTER TAPE RECORDER
                      </span>
                      <span className="font-mono text-[9px] text-zinc-400">MediaRecorder API</span>
                    </div>

                    {/* Screenshot Mockup Container */}
                    <div className="p-2.5 rounded-lg bg-[#0b0c10] border border-zinc-900 space-y-2 font-mono text-[9px]">
                      <div className="flex items-center justify-between text-[8px] text-zinc-400 border-b border-zinc-900 pb-1">
                        <span className="text-emerald-300 font-bold">DUAL DJ FILTER (LPF / HPF)</span>
                        <span className="text-rose-400 font-bold">● MASTER RECORDER READY</span>
                      </div>
                      {/* FFT Spectrum Analyzer Mockup */}
                      <div className="h-6 flex items-end gap-0.5 bg-black/60 rounded px-1 pb-0.5">
                        {[25, 40, 70, 85, 95, 60, 80, 75, 50, 65, 45, 30, 20, 15, 10, 8].map((h, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-emerald-400/80 rounded-t"
                            style={{ height: `${h}%` }}
                          />
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-[7.5px] text-zinc-400 pt-0.5">
                        <span>CUTOFF: 2.4 kHz</span>
                        <span>RESONANZ: 3.2 dB</span>
                        <span className="text-rose-400 font-bold">TAPE: 00:04:12</span>
                      </div>
                    </div>

                    <p className="font-mono text-[11px] text-zinc-400 mt-2 leading-relaxed">
                      Studio-Effektprozessor mit Biquad-Resonanzfilter, Tape Delay, Hall und integriertem
                      <strong className="text-rose-400"> Master Tape Recorder</strong> mit 1-Klick WAV/WebM Download.
                    </p>
                  </div>

                  {onNavigateMode && (
                    <button
                      onClick={() => {
                        onNavigateMode('FX');
                        onClose();
                      }}
                      className="w-full py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-mono text-[10px] font-bold uppercase transition flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      <span>Im FX-Screen öffnen</span>
                    </button>
                  )}
                </div>

                {/* Screenshot 4: Library & Smart Shuffle */}
                <div className="p-3.5 rounded-xl bg-[#16161d] border border-zinc-800 space-y-2.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[9px] font-black px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase">
                        SCREEN 4: LIBRARY & SMART SHUFFLE
                      </span>
                      <span className="font-mono text-[9px] text-zinc-400">Harmonic Engine</span>
                    </div>

                    {/* Screenshot Mockup Container */}
                    <div className="p-2.5 rounded-lg bg-[#0b0c10] border border-zinc-900 space-y-1.5 font-mono text-[9px]">
                      <div className="flex items-center justify-between text-[8px] text-zinc-400 border-b border-zinc-900 pb-1">
                        <span className="text-emerald-400 font-bold">🔀 SMART SHUFFLE: AKTIV</span>
                        <span className="text-zinc-400">FLOW: 8A ➔ 9A ➔ 9B</span>
                      </div>
                      <div className="p-1 rounded bg-[#121217] border border-zinc-800 flex items-center justify-between text-[7.5px]">
                        <span className="font-bold text-white">#01 Lost Control</span>
                        <span className="text-emerald-400 font-bold">8A • 128.0 BPM (REF)</span>
                      </div>
                      <div className="p-1 rounded bg-[#0f1413] border border-emerald-500/40 flex items-center justify-between text-[7.5px]">
                        <span className="font-bold text-white">#02 Night Drive</span>
                        <span className="text-emerald-300 font-bold">9A • 126.0 BPM (94% MATCH)</span>
                      </div>
                    </div>

                    <p className="font-mono text-[11px] text-zinc-400 mt-2 leading-relaxed">
                      Smarter Track-Katalog mit automatischer Umsortierung nach harmonischer Camelot-Kompatibilität und Tempo-Nähe.
                    </p>
                  </div>

                  {onNavigateMode && (
                    <button
                      onClick={() => {
                        onNavigateMode('LIBRARY');
                        onClose();
                      }}
                      className="w-full py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-mono text-[10px] font-bold uppercase transition flex items-center justify-center gap-1.5"
                    >
                      <Shuffle className="w-3 h-3 text-purple-400" />
                      <span>In der Library öffnen</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'SCHOOL' ? (
          <div className="flex flex-col h-full justify-between space-y-4">
            {/* Step Navigation Pill Tracker */}
            <div className="flex items-center justify-between gap-1.5 p-2 bg-[#121217] rounded-xl border border-zinc-800 shrink-0 overflow-x-auto no-scrollbar">
              {schoolSteps.map((step, idx) => {
                const isCurrent = currentStep === idx;
                const isCompleted = completedSteps.includes(idx);
                return (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStep(idx)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold shrink-0 transition ${
                      isCurrent
                        ? 'bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.5)]'
                        : isCompleted
                        ? 'bg-zinc-800 text-zinc-200'
                        : 'bg-zinc-900 text-zinc-500'
                    }`}
                  >
                    {isCompleted && !isCurrent ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                    <span className="truncate max-w-[80px]">
                      {step.title.split('.')[1]?.trim()}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Current Lesson Card */}
            <div className="flex-1 bg-[#121217] rounded-2xl border border-zinc-800/90 p-4 flex flex-col justify-between shadow-lg overflow-y-auto">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor: `${currentLesson.accent}20`,
                        color: currentLesson.accent,
                      }}
                    >
                      <currentLesson.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-tech font-bold text-sm text-zinc-100 uppercase">
                        {currentLesson.title}
                      </h3>
                      <span className="font-mono text-[10px] text-zinc-400 block -mt-0.5">
                        {currentLesson.subtitle}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 uppercase border border-zinc-700">
                    {currentLesson.badge}
                  </span>
                </div>

                <div className="mt-3">{currentLesson.content}</div>
              </div>

              {/* Lesson Footer / Next Stepper */}
              <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between mt-4 shrink-0">
                <button
                  onClick={handlePrevStep}
                  disabled={currentStep === 0}
                  className={`px-3 py-2 rounded-xl font-mono text-xs font-bold uppercase transition ${
                    currentStep === 0
                      ? 'opacity-30 cursor-not-allowed text-zinc-600'
                      : 'bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800'
                  }`}
                >
                  ZURÜCK
                </button>

                <div className="flex items-center gap-1 font-mono text-[10px] text-zinc-500">
                  <span>LEKTION</span>
                  <strong className="text-zinc-200">{currentStep + 1}</strong>
                  <span>VON</span>
                  <strong className="text-zinc-200">{schoolSteps.length}</strong>
                </div>

                {currentStep < schoolSteps.length - 1 ? (
                  <button
                    onClick={handleNextStep}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-mono text-xs font-extrabold uppercase active:scale-95 transition shadow-md"
                  >
                    <span>WEITER</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={onClose}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-mono text-xs font-extrabold uppercase active:scale-95 transition shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                  >
                    <Award className="w-4 h-4" />
                    <span>KURS ABSCHLIESSEN</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* MANUAL TAB: Searchable Reference */
          <div className="space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Thema, Tastaturkürzel oder MIDI-Befehl suchen..."
                className="w-full bg-[#121217] border border-zinc-800 pl-10 pr-4 py-2.5 rounded-xl font-mono text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>

            {/* Manual Sections Accordion */}
            <div className="space-y-2">
              {filteredManual.map((sec, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-[#121217] rounded-xl border border-zinc-800 space-y-2"
                >
                  <span className="font-tech font-bold text-xs text-zinc-100 block uppercase tracking-wider text-rose-400">
                    {sec.title}
                  </span>
                  <p className="font-mono text-xs text-zinc-300 whitespace-pre-line leading-relaxed">
                    {sec.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Bottom Close Button */}
      <button
        onClick={onClose}
        className="w-full py-3.5 mt-3 rounded-2xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 font-mono text-xs font-bold tracking-widest uppercase active:scale-[0.98] transition shrink-0"
      >
        ZURÜCK ZUR PERFORMANCE [SCHLIESSEN]
      </button>

      {/* 5. Fullscreen Lightbox Modal for Studio Product Photos */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 cursor-zoom-out animate-fadeIn select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full flex flex-col items-center bg-[#090a0f] p-3 rounded-2xl border border-zinc-800 shadow-2xl"
          >
            <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-zinc-800 text-zinc-300">
              <span className="font-mono text-xs font-bold text-amber-400">
                SCHUBERTGRV PRIME HARDWARE CONTROLLER • KLAVIERLACK SCHWARZ
              </span>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full font-mono text-xs border border-zinc-700 flex items-center gap-1.5 transition"
              >
                <X className="w-4 h-4" />
                <span>SCHLIESSEN</span>
              </button>
            </div>

            <img
              src={selectedPhoto}
              alt="Studio Produktfoto des Controllers in Klavierlack Schwarz"
              referrerPolicy="no-referrer"
              className="max-h-[75vh] w-auto max-w-full rounded-xl border border-zinc-900 shadow-2xl object-contain"
            />

            <div className="mt-3 text-center">
              <span className="font-mono text-[11px] text-zinc-400">
                Offizielles Studio-Produktfoto • High-Gloss Piano Black Finish • Bündiges Smartphone-Cradle • Solo-Ansicht
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
