import React, { useState, useEffect } from 'react';
import { FXState, StemData, StemId, FXType, FilterMode, LoopRecorderState, ChainFXConfig, ChainFXItem, FXSnapshot, FXChainPreset } from '../../types';
import { FlatKnob } from '../FlatKnob';
import { SpectralAnalyzerGraph } from '../SpectralAnalyzerGraph';
import { LoopRecorder } from '../LoopRecorder';
import { MasterRecorder } from '../MasterRecorder';
import { MacroFxRack } from '../fx/MacroFxRack';
import { BeatSlicerRack } from '../fx/BeatSlicerRack';
import { audioEngine } from '../../services/audioEngine';
import { triggerHaptic } from '../../utils/haptics';
import {
  SlidersHorizontal,
  Sliders,
  Volume2,
  Sparkles,
  ChevronRight,
  Radio,
  Circle,
  Repeat,
  Layers,
  Link2,
  ArrowRight,
  ArrowLeftRight,
  Workflow,
  Wand2,
  Camera,
  Save,
  Bookmark,
  Check,
  RotateCcw,
  Zap,
  Settings2,
  Edit2,
  X,
  Play,
  Activity,
  Scissors,
} from 'lucide-react';
import { MASTER_EQ_PRESETS } from '../../constants';

interface FxScreenProps {
  fx: FXState;
  onUpdateFX: (updates: Partial<FXState>) => void;
  stems: StemData[];
  onUpdateStemSend: (stemId: StemId, sendAmount: number) => void;
  onOpenFxEdit: () => void;
  hardwareMode?: boolean;
  masterEqPreset?: string;
  masterEq?: { low: number; mid: number; high: number };
  onSelectMasterEqPreset?: (presetName: string) => void;
  onOpenSettings?: () => void;
  bpm?: number;
  onLogActivity?: (category: 'RECORD', message: string, color?: string) => void;
}

export const FxScreen: React.FC<FxScreenProps> = ({
  fx,
  onUpdateFX,
  stems,
  onUpdateStemSend,
  onOpenFxEdit,
  hardwareMode = false,
  masterEqPreset = 'Club',
  masterEq,
  onSelectMasterEqPreset,
  onOpenSettings,
  bpm = 128,
  onLogActivity,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'FX' | 'MACRO' | 'SLICER' | 'LOOP_RECORDER' | 'MASTER_RECORD'>('FX');
  const [loopState, setLoopState] = useState<LoopRecorderState>(audioEngine.getLoopState());

  useEffect(() => {
    const unsub = audioEngine.subscribeLoopState((st) => setLoopState(st));
    return unsub;
  }, []);

  const fxTypes: FXType[] = ['FILTER', 'DELAY', 'REVERB', 'DRIVE'];
  const targets: (StemId | 'ALL')[] = ['ALL', 'drums', 'bass', 'music', 'vocal'];

  // Current active Master EQ preset object
  const activePreset = MASTER_EQ_PRESETS.find(
    (p) => p.name.toLowerCase() === masterEqPreset.toLowerCase()
  ) || MASTER_EQ_PRESETS[0];

  const currentEq = masterEq || activePreset.eq;

  const handleNextPreset = () => {
    if (!onSelectMasterEqPreset) return;
    const currentIndex = MASTER_EQ_PRESETS.findIndex(
      (p) => p.name.toLowerCase() === masterEqPreset.toLowerCase()
    );
    const nextIndex = (currentIndex + 1) % MASTER_EQ_PRESETS.length;
    onSelectMasterEqPreset(MASTER_EQ_PRESETS[nextIndex].name);
  };

  const getParamLabels = (type: FXType) => {
    switch (type) {
      case 'FILTER': return { primary: 'CUTOFF', secondary: 'RESONANCE' };
      case 'DELAY': return { primary: 'FEEDBACK', secondary: 'TIME' };
      case 'REVERB': return { primary: 'ROOM SIZE', secondary: 'DAMPING' };
      case 'DRIVE': return { primary: 'DRIVE GAIN', secondary: 'TONE' };
    }
  };

  const defaultChainConfig: ChainFXConfig = {
    enabled: true,
    fx1: {
      type: 'REVERB',
      amount: 70,
      secondaryParam: 45,
      timeDivision: '1/4',
    },
    fx2: {
      type: 'FILTER',
      filterMode: 'LOWPASS',
      amount: 60,
      secondaryParam: 35,
      timeDivision: '1/4',
    },
    targetStem: 'vocal',
    routing: 'FX1_TO_FX2',
    mix: 75,
  };

  const chainConfig: ChainFXConfig = fx.chainFX || defaultChainConfig;
  const isChainMode = !!fx.chainMode;

  const CHAIN_PRESET_STORAGE_KEY = 'schubertgrv_fx_chain_presets';

  const DEFAULT_CHAIN_PRESET_SLOTS: FXChainPreset[] = [
    {
      id: 'chain-slot-1',
      slot: 1,
      name: 'DUB SPACE',
      description: '1/4 Delay + Deep Hall Verb',
      targetStem: 'vocal',
      filter: { enabled: true, mode: 'LOWPASS', cutoff: 65, resonance: 35 },
      delay: { enabled: true, timeDivision: '1/4', feedback: 65, amount: 70 },
      reverb: { enabled: true, roomSize: 80, damping: 45 },
      fx1Type: 'DELAY',
      fx2Type: 'REVERB',
      routing: 'FX1_TO_FX2',
      mix: 80,
      isFactory: true,
    },
    {
      id: 'chain-slot-2',
      slot: 2,
      name: 'ETHEREAL SWEEP',
      description: 'Resonant LPF Sweep + Lush Verb',
      targetStem: 'music',
      filter: { enabled: true, mode: 'LOWPASS', cutoff: 45, resonance: 60 },
      delay: { enabled: false, timeDivision: '1/8', feedback: 35, amount: 25 },
      reverb: { enabled: true, roomSize: 85, damping: 50 },
      fx1Type: 'REVERB',
      fx2Type: 'FILTER',
      routing: 'FX1_TO_FX2',
      mix: 75,
      isFactory: true,
    },
    {
      id: 'chain-slot-3',
      slot: 3,
      name: 'ACID CRUNCH',
      description: 'Drive Saturation + 303 Resonant Filter',
      targetStem: 'bass',
      filter: { enabled: true, mode: 'LOWPASS', cutoff: 55, resonance: 75 },
      delay: { enabled: true, timeDivision: '1/8', feedback: 40, amount: 35 },
      reverb: { enabled: false, roomSize: 20, damping: 60 },
      drive: { enabled: true, amount: 75, tone: 65 },
      fx1Type: 'DRIVE',
      fx2Type: 'FILTER',
      routing: 'FX1_TO_FX2',
      mix: 85,
      isFactory: true,
    },
    {
      id: 'chain-slot-4',
      slot: 4,
      name: 'BEAT ECHO CHOP',
      description: 'HPF Cut + 1/8 Rhythmic Delay',
      targetStem: 'drums',
      filter: { enabled: true, mode: 'HIGHPASS', cutoff: 62, resonance: 42 },
      delay: { enabled: true, timeDivision: '1/8', feedback: 70, amount: 75 },
      reverb: { enabled: true, roomSize: 30, damping: 30 },
      fx1Type: 'FILTER',
      fx2Type: 'DELAY',
      routing: 'FX1_TO_FX2',
      mix: 70,
      isFactory: true,
    },
    {
      id: 'chain-slot-5',
      slot: 5,
      name: 'INFINITE VORTEX',
      description: '1/2 Tape Delay + 95% Washout Verb',
      targetStem: 'ALL',
      filter: { enabled: true, mode: 'LOWPASS', cutoff: 80, resonance: 30 },
      delay: { enabled: true, timeDivision: '1/2', feedback: 85, amount: 80 },
      reverb: { enabled: true, roomSize: 95, damping: 65 },
      fx1Type: 'DELAY',
      fx2Type: 'REVERB',
      routing: 'FX1_TO_FX2',
      mix: 90,
      isFactory: true,
    },
    {
      id: 'chain-slot-6',
      slot: 6,
      name: 'CLUB WASHOUT',
      description: 'Highpass Bass Kill + Big Room Decay',
      targetStem: 'ALL',
      filter: { enabled: true, mode: 'HIGHPASS', cutoff: 72, resonance: 45 },
      delay: { enabled: true, timeDivision: '1/4', feedback: 55, amount: 50 },
      reverb: { enabled: true, roomSize: 90, damping: 55 },
      fx1Type: 'FILTER',
      fx2Type: 'REVERB',
      routing: 'FX1_TO_FX2',
      mix: 85,
      isFactory: true,
    },
  ];

  const [chainPresets, setChainPresets] = useState<FXChainPreset[]>(() => {
    try {
      const raw = localStorage.getItem(CHAIN_PRESET_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length === 6) return parsed;
      }
    } catch (e) {}
    return DEFAULT_CHAIN_PRESET_SLOTS;
  });

  const [activeChainSlot, setActiveChainSlot] = useState<number | null>(null);
  const [storeChainModeActive, setStoreChainModeActive] = useState<boolean>(false);
  const [editingPresetSlot, setEditingPresetSlot] = useState<FXChainPreset | null>(null);

  const handleToggleChainMode = () => {
    const nextMode = !isChainMode;
    const nextChain: ChainFXConfig = {
      ...(fx.chainFX || defaultChainConfig),
      enabled: nextMode,
    };
    onUpdateFX({
      chainMode: nextMode,
      chainFX: nextChain,
    });
    audioEngine.setFX({
      ...fx,
      chainMode: nextMode,
      chainFX: nextChain,
    });
  };

  const handleUpdateChain = (updates: Partial<ChainFXConfig>) => {
    const updated: ChainFXConfig = {
      ...chainConfig,
      ...updates,
    };
    onUpdateFX({
      chainFX: updated,
    });
    audioEngine.setFX({
      ...fx,
      chainMode: isChainMode,
      chainFX: updated,
    });
  };

  const handleSwapChainOrder = () => {
    const swapped: ChainFXConfig = {
      ...chainConfig,
      fx1: chainConfig.fx2,
      fx2: chainConfig.fx1,
      routing: chainConfig.routing === 'FX1_TO_FX2' ? 'FX2_TO_FX1' : 'FX1_TO_FX2',
    };
    handleUpdateChain(swapped);
  };

  const handleRecallChainPreset = (preset: FXChainPreset) => {
    if (storeChainModeActive) {
      handleSaveCurrentToChainSlot(preset.slot);
      return;
    }

    setActiveChainSlot(preset.slot);
    audioEngine.applyFXChainPreset(preset);

    const newChain: ChainFXConfig = {
      enabled: true,
      fx1: {
        type: preset.fx1Type,
        amount: preset.fx1Type === 'FILTER' ? preset.filter.cutoff : preset.fx1Type === 'DELAY' ? preset.delay.amount : preset.reverb.roomSize,
        secondaryParam: preset.fx1Type === 'FILTER' ? preset.filter.resonance : preset.fx1Type === 'DELAY' ? preset.delay.feedback : preset.reverb.damping,
        filterMode: preset.filter.mode,
        timeDivision: preset.delay.timeDivision,
      },
      fx2: {
        type: preset.fx2Type,
        amount: preset.fx2Type === 'FILTER' ? preset.filter.cutoff : preset.fx2Type === 'DELAY' ? preset.delay.amount : preset.reverb.roomSize,
        secondaryParam: preset.fx2Type === 'FILTER' ? preset.filter.resonance : preset.fx2Type === 'DELAY' ? preset.delay.feedback : preset.reverb.damping,
        filterMode: preset.filter.mode,
        timeDivision: preset.delay.timeDivision,
      },
      targetStem: preset.targetStem,
      routing: preset.routing,
      mix: preset.mix,
    };

    onUpdateFX({
      chainMode: true,
      chainFX: newChain,
      type: preset.fx1Type,
      amount: newChain.fx1.amount,
      secondaryParam: newChain.fx1.secondaryParam,
      filterMode: preset.filter.mode,
      timeDivision: preset.delay.timeDivision,
      targetStem: preset.targetStem,
    });

    setFeedbackToast(`FX CHAIN [SLOT ${preset.slot}: ${preset.name}] AKTIV`);
    setTimeout(() => setFeedbackToast(null), 2000);

    onLogActivity?.(
      'RECORD',
      `FX CHAIN [Slot ${preset.slot}: ${preset.name}] recalled (${preset.fx1Type} ➔ ${preset.fx2Type} on ${preset.targetStem.toUpperCase()})`,
      '#8b5cf6'
    );
  };

  const handleSaveCurrentToChainSlot = (slotNumber: number) => {
    const existing = chainPresets.find((p) => p.slot === slotNumber);
    const customName = prompt(
      `Name für FX Chain Slot [${slotNumber}] festlegen:`,
      existing ? existing.name : `CHAIN ${slotNumber}`
    );
    if (customName === null) return;

    const presetName = customName.trim().toUpperCase() || `CHAIN ${slotNumber}`;

    const currentFilterCutoff = fx.type === 'FILTER' ? fx.amount : chainConfig.fx1.type === 'FILTER' ? chainConfig.fx1.amount : chainConfig.fx2.type === 'FILTER' ? chainConfig.fx2.amount : 60;
    const currentFilterRes = fx.type === 'FILTER' ? fx.secondaryParam : chainConfig.fx1.type === 'FILTER' ? chainConfig.fx1.secondaryParam : chainConfig.fx2.type === 'FILTER' ? chainConfig.fx2.secondaryParam : 35;
    const currentFilterMode = fx.filterMode || 'LOWPASS';

    const currentDelayAmount = fx.type === 'DELAY' ? fx.amount : chainConfig.fx1.type === 'DELAY' ? chainConfig.fx1.amount : chainConfig.fx2.type === 'DELAY' ? chainConfig.fx2.amount : 65;
    const currentDelayFeedback = fx.type === 'DELAY' ? fx.secondaryParam : chainConfig.fx1.type === 'DELAY' ? chainConfig.fx1.secondaryParam : chainConfig.fx2.type === 'DELAY' ? chainConfig.fx2.secondaryParam : 55;
    const currentDelayTime = fx.timeDivision || '1/4';

    const currentReverbAmount = fx.type === 'REVERB' ? fx.amount : chainConfig.fx1.type === 'REVERB' ? chainConfig.fx1.amount : chainConfig.fx2.type === 'REVERB' ? chainConfig.fx2.amount : 75;
    const currentReverbDamping = fx.type === 'REVERB' ? fx.secondaryParam : chainConfig.fx1.type === 'REVERB' ? chainConfig.fx1.secondaryParam : chainConfig.fx2.type === 'REVERB' ? chainConfig.fx2.secondaryParam : 45;

    const newPreset: FXChainPreset = {
      id: `chain-slot-${slotNumber}`,
      slot: slotNumber,
      name: presetName,
      description: `${chainConfig.fx1.type} ➔ ${chainConfig.fx2.type} (${chainConfig.targetStem.toUpperCase()})`,
      targetStem: chainConfig.targetStem,
      filter: {
        enabled: true,
        mode: currentFilterMode,
        cutoff: currentFilterCutoff,
        resonance: currentFilterRes,
      },
      delay: {
        enabled: true,
        timeDivision: currentDelayTime,
        feedback: currentDelayFeedback,
        amount: currentDelayAmount,
      },
      reverb: {
        enabled: true,
        roomSize: currentReverbAmount,
        damping: currentReverbDamping,
      },
      fx1Type: chainConfig.fx1.type,
      fx2Type: chainConfig.fx2.type,
      routing: chainConfig.routing,
      mix: chainConfig.mix,
      isFactory: false,
      savedAt: Date.now(),
    };

    const nextPresets = chainPresets.map((p) => (p.slot === slotNumber ? newPreset : p));
    setChainPresets(nextPresets);
    setActiveChainSlot(slotNumber);
    setStoreChainModeActive(false);

    try {
      localStorage.setItem(CHAIN_PRESET_STORAGE_KEY, JSON.stringify(nextPresets));
    } catch (e) {}

    setFeedbackToast(`GESPEICHERT IN FX CHAIN [SLOT ${slotNumber}: ${presetName}]`);
    setTimeout(() => setFeedbackToast(null), 2000);

    onLogActivity?.(
      'RECORD',
      `FX CHAIN [Slot ${slotNumber}: ${presetName}] gespeichert!`,
      '#10b981'
    );
  };

  const handleResetChainPresets = () => {
    setChainPresets(DEFAULT_CHAIN_PRESET_SLOTS);
    try {
      localStorage.removeItem(CHAIN_PRESET_STORAGE_KEY);
    } catch (e) {}
    setActiveChainSlot(null);
    setStoreChainModeActive(false);
    setFeedbackToast('FX CHAIN SLOTS ZURÜCKGESETZT');
    setTimeout(() => setFeedbackToast(null), 1800);
  };

  const handleSaveEditedPreset = (updated: FXChainPreset) => {
    const nextPresets = chainPresets.map((p) => (p.slot === updated.slot ? updated : p));
    setChainPresets(nextPresets);
    try {
      localStorage.setItem(CHAIN_PRESET_STORAGE_KEY, JSON.stringify(nextPresets));
    } catch (e) {}

    if (activeChainSlot === updated.slot) {
      handleRecallChainPreset(updated);
    }

    setEditingPresetSlot(null);
    setFeedbackToast(`SLOT ${updated.slot} AKTUALISIERT`);
    setTimeout(() => setFeedbackToast(null), 1800);
  };

  const SNAPSHOT_STORAGE_KEY = 'schubertgrv_fx_snapshots';

  const DEFAULT_FX_SNAPSHOTS: FXSnapshot[] = [
    {
      id: 'snap-1',
      name: 'TAPE ECHO',
      slot: 1,
      type: 'DELAY',
      amount: 65,
      secondaryParam: 50,
      timeDivision: '1/4',
      targetStem: 'drums',
      chainMode: false,
    },
    {
      id: 'snap-2',
      name: 'SPACE SWEEP',
      slot: 2,
      type: 'REVERB',
      amount: 75,
      secondaryParam: 45,
      timeDivision: '1/2',
      targetStem: 'vocal',
      chainMode: false,
    },
    {
      id: 'snap-3',
      name: 'ACID CRUNCH',
      slot: 3,
      type: 'FILTER',
      filterMode: 'LOWPASS',
      amount: 52,
      secondaryParam: 68,
      timeDivision: '1/8',
      targetStem: 'bass',
      chainMode: false,
    },
    {
      id: 'snap-4',
      name: 'CHAIN DRIVE',
      slot: 4,
      type: 'DRIVE',
      amount: 70,
      secondaryParam: 60,
      timeDivision: '1/4',
      targetStem: 'music',
      chainMode: true,
      chainFX: {
        enabled: true,
        fx1: { type: 'REVERB', amount: 70, secondaryParam: 45, timeDivision: '1/4' },
        fx2: { type: 'FILTER', filterMode: 'LOWPASS', amount: 55, secondaryParam: 40, timeDivision: '1/4' },
        targetStem: 'vocal',
        routing: 'FX1_TO_FX2',
        mix: 75,
      },
    },
  ];

  const [snapshots, setSnapshots] = useState<FXSnapshot[]>(() => {
    try {
      const raw = localStorage.getItem(SNAPSHOT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length === 4) return parsed;
      }
    } catch (e) {}
    return DEFAULT_FX_SNAPSHOTS;
  });

  const [activeSnapshotSlot, setActiveSnapshotSlot] = useState<number | null>(null);
  const [storeModeActive, setStoreModeActive] = useState<boolean>(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const handleRecallSnapshot = (snap: FXSnapshot) => {
    if (storeModeActive) {
      handleSaveSnapshotToSlot(snap.slot);
      return;
    }

    setActiveSnapshotSlot(snap.slot);
    const newFx: Partial<FXState> = {
      type: snap.type,
      amount: snap.amount,
      secondaryParam: snap.secondaryParam,
      timeDivision: snap.timeDivision,
      targetStem: snap.targetStem,
      filterMode: snap.filterMode || 'LOWPASS',
      chainMode: !!snap.chainMode,
      chainFX: snap.chainFX || fx.chainFX,
    };

    onUpdateFX(newFx);
    audioEngine.setFX({
      ...fx,
      ...newFx,
    });

    setFeedbackToast(`SNAPSHOT ${snap.slot}: ${snap.name} GELADEN`);
    setTimeout(() => setFeedbackToast(null), 1800);

    onLogActivity?.(
      'RECORD',
      `FX SNAPSHOT [${snap.slot}: ${snap.name}] recalled (${snap.type}${snap.chainMode ? ' CHAIN' : ''} on ${snap.targetStem.toUpperCase()})`,
      '#a855f7'
    );
  };

  const handleSaveSnapshotToSlot = (slotNumber: number) => {
    const existing = snapshots.find((s) => s.slot === slotNumber);
    const customName = prompt(
      `Name für FX Snapshot Slot [${slotNumber}] festlegen:`,
      existing ? existing.name : `SNAP ${slotNumber}`
    );
    if (customName === null) return;

    const snapName = customName.trim().toUpperCase() || `SNAP ${slotNumber}`;
    const newSnapshot: FXSnapshot = {
      id: `snap-${slotNumber}`,
      slot: slotNumber,
      name: snapName,
      type: fx.type,
      filterMode: fx.filterMode || 'LOWPASS',
      targetStem: isChainMode ? chainConfig.targetStem : fx.targetStem,
      amount: fx.amount,
      secondaryParam: fx.secondaryParam,
      timeDivision: fx.timeDivision,
      chainMode: isChainMode,
      chainFX: isChainMode ? chainConfig : fx.chainFX,
      savedAt: Date.now(),
    };

    const nextSnapshots = snapshots.map((s) => (s.slot === slotNumber ? newSnapshot : s));
    setSnapshots(nextSnapshots);
    setActiveSnapshotSlot(slotNumber);
    setStoreModeActive(false);

    try {
      localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(nextSnapshots));
    } catch (e) {}

    setFeedbackToast(`GESPEICHERT IN SLOT [${slotNumber}: ${snapName}]`);
    setTimeout(() => setFeedbackToast(null), 2000);

    onLogActivity?.(
      'RECORD',
      `FX SNAPSHOT [${slotNumber}: ${snapName}] gespeichert!`,
      '#10b981'
    );
  };

  const handleResetSnapshots = () => {
    setSnapshots(DEFAULT_FX_SNAPSHOTS);
    try {
      localStorage.removeItem(SNAPSHOT_STORAGE_KEY);
    } catch (e) {}
    setActiveSnapshotSlot(null);
    setStoreModeActive(false);
    setFeedbackToast('FX SNAPSHOTS ZURÜCKGESETZT');
    setTimeout(() => setFeedbackToast(null), 1800);
  };

  return (
    <div className="flex-1 flex flex-col justify-between px-3 py-1.5 w-full max-w-lg mx-auto overflow-hidden gap-1.5 select-none">
      {/* Top View Selector: FX Processor vs Loop Recorder vs Master Recorder */}
      <div className="flex items-center justify-between gap-1.5 shrink-0 border-b border-zinc-850/80 pb-1">
        <div className="flex items-center gap-1 bg-[#101014] p-0.5 rounded-full border border-zinc-800/90 shadow-sm">
          <button
            onClick={() => {
              triggerHaptic('tap');
              setActiveSubTab('FX');
            }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full font-mono text-[8.5px] sm:text-[9px] font-bold tracking-wider uppercase transition-all duration-150 active:scale-95 ${
              activeSubTab === 'FX'
                ? 'bg-zinc-100 text-zinc-950 shadow-md font-extrabold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <SlidersHorizontal className="w-2.5 h-2.5" />
            <span>FX & EQ</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('tap');
              setActiveSubTab('MACRO');
            }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full font-mono text-[8.5px] sm:text-[9px] font-bold tracking-wider uppercase transition-all duration-150 active:scale-95 ${
              activeSubTab === 'MACRO'
                ? 'bg-amber-400 text-zinc-950 shadow-md font-extrabold'
                : 'text-zinc-400 hover:text-amber-300'
            }`}
            title="Macro-FX Build-Up Controller: 1 Drehregler steuert Filter, Reverb & Delay gleichzeitig"
          >
            <Zap className="w-2.5 h-2.5 text-amber-500 fill-current" />
            <span>MACRO-FX</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('tap');
              setActiveSubTab('SLICER');
            }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full font-mono text-[8.5px] sm:text-[9px] font-bold tracking-wider uppercase transition-all duration-150 active:scale-95 ${
              activeSubTab === 'SLICER'
                ? 'bg-cyan-400 text-zinc-950 shadow-md font-extrabold'
                : 'text-zinc-400 hover:text-cyan-300'
            }`}
            title="Beat Slicer & Stutter Pad Grid"
          >
            <Scissors className="w-2.5 h-2.5 text-cyan-400" />
            <span>SLICER</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('tap');
              setActiveSubTab('LOOP_RECORDER');
            }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full font-mono text-[8.5px] sm:text-[9px] font-bold tracking-wider uppercase transition-all duration-150 active:scale-95 ${
              activeSubTab === 'LOOP_RECORDER'
                ? 'bg-zinc-100 text-zinc-950 shadow-md font-extrabold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                loopState.isRecording
                  ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,1)] animate-ping'
                  : loopState.isPlaying
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)] animate-pulse'
                  : loopState.hasLoop
                  ? 'bg-emerald-400'
                  : 'bg-zinc-600'
              }`}
            />
            <Repeat className="w-2.5 h-2.5 text-rose-400" />
            <span>LOOP</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('tap');
              setActiveSubTab('MASTER_RECORD');
            }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full font-mono text-[8.5px] sm:text-[9px] font-bold tracking-wider uppercase transition-all duration-150 active:scale-95 ${
              activeSubTab === 'MASTER_RECORD'
                ? 'bg-zinc-100 text-zinc-950 shadow-md font-extrabold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Circle className="w-2.5 h-2.5 fill-rose-500 text-rose-500 animate-pulse" />
            <span>REC</span>
          </button>
        </div>

        {/* Live Status indicator & Quick Master Record Button */}
        <div className="flex items-center gap-1.5 font-mono text-[8.5px]">
          <MasterRecorder variant="strip" onLogActivity={onLogActivity} />
          {loopState.isPlaying && (
            <span className="hidden sm:flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LAYER
            </span>
          )}
        </div>
      </div>

      {activeSubTab === 'MACRO' ? (
        /* Dedicated Macro-FX Build-Up Controller */
        <div className="flex-1 flex flex-col justify-between overflow-y-auto min-h-0 py-1">
          <MacroFxRack
            stems={stems}
            onUpdateStemSend={onUpdateStemSend}
            bpm={bpm}
            onLogActivity={onLogActivity}
          />
        </div>
      ) : activeSubTab === 'SLICER' ? (
        /* Dedicated Beat Slicer & Stutter Pad Grid */
        <div className="flex-1 flex flex-col justify-between overflow-y-auto min-h-0 py-1">
          <BeatSlicerRack
            bpm={bpm}
            onLogActivity={onLogActivity}
          />
        </div>
      ) : activeSubTab === 'MASTER_RECORD' ? (
        /* Full Dedicated Master Tape Recorder Workstation */
        <div className="flex-1 flex flex-col justify-between overflow-y-auto min-h-0 py-1">
          <MasterRecorder variant="full" onLogActivity={onLogActivity} />
        </div>
      ) : activeSubTab === 'LOOP_RECORDER' ? (
        /* Full Dedicated Loop Recorder Workstation */
        <div className="flex-1 flex flex-col justify-between overflow-y-auto min-h-0 py-1">
          <LoopRecorder bpm={bpm} variant="full" />
        </div>
      ) : (
        /* Standard FX / Chain FX & Equalizer View with Compact Loop Recorder Integration */
        <>
          {/* Mode Switcher: SINGLE FX vs CHAIN FX */}
          <div className="flex items-center justify-between gap-1.5 shrink-0 bg-[#0e0e12] p-1 rounded-xl border border-zinc-800/80">
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  if (isChainMode) handleToggleChainMode();
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono text-[9px] font-bold uppercase transition active:scale-95 ${
                  !isChainMode
                    ? 'bg-zinc-100 text-zinc-950 font-extrabold shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <SlidersHorizontal className="w-2.5 h-2.5" />
                <span>SINGLE FX</span>
              </button>

              <button
                onClick={() => {
                  if (!isChainMode) handleToggleChainMode();
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[9px] font-bold uppercase transition active:scale-95 ${
                  isChainMode
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black shadow-[0_0_12px_rgba(139,92,246,0.5)] border border-violet-400/60'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Link2 className={`w-3 h-3 ${isChainMode ? 'text-violet-200 animate-pulse' : 'text-zinc-500'}`} />
                <span>CHAIN FX</span>
                <span
                  className={`text-[7.5px] px-1 py-0.2 rounded font-mono font-bold ${
                    isChainMode ? 'bg-black/30 text-violet-200' : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  DAISY-CHAIN
                </span>
              </button>
            </div>

            {/* Target Stem Selector */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="font-mono text-[8px] text-zinc-500 uppercase font-bold hidden sm:inline">STEM:</span>
              <select
                value={isChainMode ? chainConfig.targetStem : fx.targetStem}
                onChange={(e) => {
                  const val = e.target.value as StemId | 'ALL';
                  if (isChainMode) {
                    handleUpdateChain({ targetStem: val });
                  } else {
                    onUpdateFX({ targetStem: val });
                  }
                }}
                className="bg-[#14141a] border border-zinc-700/80 text-zinc-100 font-mono text-[9px] font-bold uppercase rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:border-violet-500"
              >
                {targets.map((t) => (
                  <option key={t} value={t}>
                    {t === 'ALL' ? 'MASTER BUS' : t.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row of FX Snapshot Buttons (Save & Instant Recall) */}
          <div className="flex flex-col gap-1 px-2 py-1.5 rounded-xl bg-[#0d0d12] border border-zinc-850 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Bookmark className="w-3 h-3 text-violet-400" />
                <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-zinc-300">
                  FX SNAPSHOTS
                </span>
                {feedbackToast && (
                  <span className="px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-300 border border-violet-500/40 text-[7.5px] font-mono font-bold animate-pulse">
                    {feedbackToast}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setStoreModeActive(!storeModeActive)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[8px] font-bold uppercase transition active:scale-95 border ${
                    storeModeActive
                      ? 'bg-amber-500 text-black border-amber-400 font-extrabold animate-pulse'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                  title="Store-Modus: Klicke anschließend auf einen Slot (1-4), um die aktuellen FX-Einstellungen dort abzuspeichern"
                >
                  <Save className="w-2.5 h-2.5" />
                  <span>{storeModeActive ? 'ZIEL-SLOT WÄHLEN' : 'SPEICHERN'}</span>
                </button>

                <button
                  onClick={handleResetSnapshots}
                  className="p-1 rounded text-zinc-600 hover:text-zinc-400 transition"
                  title="Snapshots auf Werkseinstellungen zurücksetzen"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>

            {/* 4 Instant Snapshot Recall / Store Buttons */}
            <div className="grid grid-cols-4 gap-1.5">
              {snapshots.map((snap) => {
                const isSelected = activeSnapshotSlot === snap.slot;

                return (
                  <button
                    key={snap.id}
                    onClick={() => handleRecallSnapshot(snap)}
                    className={`group relative p-1.5 rounded-lg border text-left transition-all active:scale-95 flex flex-col justify-between overflow-hidden ${
                      storeModeActive
                        ? 'border-amber-500/70 bg-amber-950/30 hover:bg-amber-900/50'
                        : isSelected
                        ? 'bg-violet-950/50 border-violet-400/80 shadow-[0_0_12px_rgba(139,92,246,0.35)]'
                        : 'bg-[#121217] border-zinc-800 hover:border-zinc-700 hover:bg-[#16161c]'
                    }`}
                    title={
                      storeModeActive
                        ? `Aktuelle Einstellungen in Slot [${snap.slot}] speichern`
                        : `Snapshot ${snap.slot} (${snap.name}) laden: ${snap.type} auf ${snap.targetStem}`
                    }
                  >
                    {/* Top Row: Slot Number badge & Active Dot */}
                    <div className="flex items-center justify-between w-full mb-0.5">
                      <span
                        className={`font-mono text-[8.5px] font-black px-1 py-0.2 rounded ${
                          isSelected
                            ? 'bg-violet-500 text-white shadow-xs'
                            : 'bg-zinc-800 text-zinc-300 group-hover:bg-zinc-700'
                        }`}
                      >
                        {snap.slot}
                      </span>
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected
                            ? 'bg-violet-400 shadow-[0_0_6px_rgba(167,139,250,1)] animate-pulse'
                            : storeModeActive
                            ? 'bg-amber-400 animate-ping'
                            : 'bg-zinc-700'
                        }`}
                      />
                    </div>

                    {/* Snapshot Name */}
                    <span
                      className={`font-mono text-[8px] font-bold uppercase truncate tracking-tight ${
                        isSelected ? 'text-violet-200 font-extrabold' : 'text-zinc-300'
                      }`}
                    >
                      {snap.name}
                    </span>

                    {/* Micro Type & Stem Tag */}
                    <div className="flex items-center justify-between text-[7px] font-mono text-zinc-500 mt-0.5 truncate">
                      <span>{snap.chainMode ? 'CHAIN' : snap.type}</span>
                      <span className="opacity-80">{snap.targetStem.toUpperCase().slice(0, 3)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {isChainMode ? (
            /* CHAIN FX WORKSTATION (Daisy-Chaining Two Active Effects on Single Stem) */
            <div className="flex-1 flex flex-col justify-between gap-1.5 min-h-0 overflow-y-auto pr-0.5">
              {/* 1. Daisy-Chain Architecture Pipeline & Swap Control */}
              <div className="p-2 rounded-xl bg-gradient-to-r from-violet-950/40 via-[#121218] to-indigo-950/40 border border-violet-500/30 flex items-center justify-between gap-2 shadow-xs shrink-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="flex items-center gap-1 bg-violet-900/60 text-violet-200 px-2 py-0.5 rounded font-mono text-[9px] font-black border border-violet-500/50">
                    <span>1: {chainConfig.fx1.type}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-violet-400 shrink-0 animate-pulse" />
                  <div className="flex items-center gap-1 bg-indigo-900/60 text-indigo-200 px-2 py-0.5 rounded font-mono text-[9px] font-black border border-indigo-500/50">
                    <span>2: {chainConfig.fx2.type}</span>
                  </div>
                  <span className="text-[8px] font-mono text-zinc-400 uppercase hidden sm:inline">
                    on <strong className="text-violet-300 font-extrabold">{chainConfig.targetStem.toUpperCase()}</strong>
                  </span>
                </div>

                <button
                  onClick={handleSwapChainOrder}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 hover:text-white font-mono text-[8.5px] font-bold active:scale-95 transition shrink-0"
                  title="Effekt-Reihenfolge in der Daisy-Chain tauschen (z. B. Filter ➔ Reverb)"
                >
                  <ArrowLeftRight className="w-3 h-3 text-violet-400" />
                  <span>SWAP ORDER</span>
                </button>
              </div>

              {/* 2. FX CHAIN PRESET SLOTS (6 Tactile Recall / Store Slots) */}
              <div className="flex flex-col gap-1.5 p-2 rounded-xl bg-[#0d0d14] border border-violet-900/40 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Workflow className="w-3.5 h-3.5 text-violet-400" />
                    <span className="font-mono text-[9.5px] font-extrabold uppercase tracking-wider text-violet-200">
                      FX CHAIN PRESET SLOTS
                    </span>
                    <span className="text-[7.5px] font-mono text-zinc-500 hidden sm:inline">
                      (Filter + Delay + Reverb)
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setStoreChainModeActive(!storeChainModeActive)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[8px] font-bold uppercase transition active:scale-95 border ${
                        storeChainModeActive
                          ? 'bg-amber-500 text-black border-amber-400 font-black animate-pulse'
                          : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:text-white'
                      }`}
                      title="Store-Modus: Klicke anschließend auf einen Slot (1-6), um die aktuelle Filter/Delay/Reverb-Kombination dort abzuspeichern"
                    >
                      <Save className="w-2.5 h-2.5" />
                      <span>{storeChainModeActive ? 'ZIEL-SLOT WÄHLEN' : 'IN SLOT SPEICHERN'}</span>
                    </button>

                    <button
                      onClick={handleResetChainPresets}
                      className="p-1 rounded text-zinc-600 hover:text-zinc-400 transition"
                      title="FX Chain Slots auf Werkseinstellungen zurücksetzen"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>

                {/* 6 Preset Slots Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-0.5">
                  {chainPresets.map((preset) => {
                    const isSelected = activeChainSlot === preset.slot;

                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleRecallChainPreset(preset)}
                        className={`group relative p-1.5 rounded-lg border text-left transition-all active:scale-95 flex flex-col justify-between cursor-pointer select-none ${
                          storeChainModeActive
                            ? 'border-amber-500/80 bg-amber-950/40 hover:bg-amber-900/60 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                            : isSelected
                            ? 'bg-gradient-to-br from-violet-950/70 to-indigo-950/60 border-violet-400 shadow-[0_0_12px_rgba(139,92,246,0.35)]'
                            : 'bg-[#121218] border-zinc-800 hover:border-zinc-700 hover:bg-[#161620]'
                        }`}
                        title={
                          storeChainModeActive
                            ? `Aktuelle Einstellungen in Slot [${preset.slot}] speichern`
                            : `Slot ${preset.slot} (${preset.name}) laden: ${preset.description || ''}`
                        }
                      >
                        {/* Top Row: Slot # & Target Stem Badge */}
                        <div className="flex items-center justify-between w-full mb-0.5">
                          <div className="flex items-center gap-1">
                            <span
                              className={`font-mono text-[8.5px] font-black px-1.5 py-0.2 rounded ${
                                isSelected
                                  ? 'bg-violet-500 text-white shadow-xs'
                                  : 'bg-zinc-800 text-zinc-300 group-hover:bg-zinc-700'
                              }`}
                            >
                              SLOT {preset.slot}
                            </span>
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isSelected
                                  ? 'bg-violet-400 shadow-[0_0_6px_rgba(167,139,250,1)] animate-pulse'
                                  : storeChainModeActive
                                  ? 'bg-amber-400 animate-ping'
                                  : 'bg-zinc-700'
                              }`}
                            />
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="font-mono text-[7px] px-1 py-0.2 rounded bg-black/40 text-violet-300 border border-violet-900/60 font-bold uppercase">
                              {preset.targetStem === 'ALL' ? 'ALL' : preset.targetStem.toUpperCase().slice(0, 3)}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingPresetSlot(preset);
                              }}
                              className="p-0.5 text-zinc-500 hover:text-zinc-200 transition"
                              title={`Slot ${preset.slot} Parameter anpassen`}
                            >
                              <Edit2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>

                        {/* Preset Name */}
                        <span
                          className={`font-mono text-[8.5px] font-extrabold uppercase truncate tracking-tight ${
                            isSelected ? 'text-violet-200' : 'text-zinc-200'
                          }`}
                        >
                          {preset.name}
                        </span>

                        {/* Micro Spec Pills: Filter / Delay / Reverb */}
                        <div className="grid grid-cols-3 gap-0.5 mt-1 text-[6.5px] font-mono">
                          <div className="bg-rose-950/40 text-rose-300 border border-rose-900/50 rounded px-0.5 py-0.2 text-center truncate" title={`Filter: ${preset.filter.mode} ${preset.filter.cutoff}%`}>
                            F:{preset.filter.cutoff}%
                          </div>
                          <div className="bg-cyan-950/40 text-cyan-300 border border-cyan-900/50 rounded px-0.5 py-0.2 text-center truncate" title={`Delay: ${preset.delay.timeDivision} ${preset.delay.amount}%`}>
                            D:{preset.delay.timeDivision}
                          </div>
                          <div className="bg-purple-950/40 text-purple-300 border border-purple-900/50 rounded px-0.5 py-0.2 text-center truncate" title={`Reverb: ${preset.reverb.roomSize}%`}>
                            R:{preset.reverb.roomSize}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Dual Daisy-Chain Stage Racks (Stage 1 & Stage 2) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 shrink-0">
                {/* Stage 1 Rack */}
                <div className="p-2 rounded-xl bg-[#101015] border border-violet-900/50 flex flex-col gap-1.5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(167,139,250,1)]" />
                      <span className="font-mono text-[9px] font-extrabold text-violet-300 uppercase tracking-wider">
                        STAGE 1: {chainConfig.fx1.type}
                      </span>
                    </div>
                    <span className="font-mono text-[8px] text-zinc-500">SERIES INPUT</span>
                  </div>

                  {/* Stage 1 Type Selector */}
                  <div className="grid grid-cols-4 gap-0.5">
                    {fxTypes.map((t) => (
                      <button
                        key={`s1-${t}`}
                        onClick={() =>
                          handleUpdateChain({
                            fx1: { ...chainConfig.fx1, type: t },
                          })
                        }
                        className={`py-1 rounded font-mono text-[8.5px] font-bold uppercase transition border ${
                          chainConfig.fx1.type === t
                            ? 'bg-violet-600 text-white border-violet-400 font-extrabold shadow-xs'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  {/* Stage 1 Knobs & Sliders */}
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <div className="flex items-center gap-2">
                      <FlatKnob
                        value={chainConfig.fx1.amount}
                        onChange={(val) =>
                          handleUpdateChain({
                            fx1: { ...chainConfig.fx1, amount: val },
                          })
                        }
                        size="sm"
                        accentColor="#a78bfa"
                      />
                      <div className="flex flex-col">
                        <span className="font-mono text-[8px] font-bold text-zinc-400 uppercase">
                          {getParamLabels(chainConfig.fx1.type).primary}
                        </span>
                        <span className="font-mono text-[10px] font-bold text-zinc-100">
                          {chainConfig.fx1.amount}%
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 max-w-[110px] flex flex-col justify-center">
                      <div className="flex items-center justify-between font-mono text-[7.5px] text-zinc-400 uppercase">
                        <span>{getParamLabels(chainConfig.fx1.type).secondary}</span>
                        <span className="text-zinc-200">{chainConfig.fx1.secondaryParam}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={chainConfig.fx1.secondaryParam}
                        onChange={(e) =>
                          handleUpdateChain({
                            fx1: { ...chainConfig.fx1, secondaryParam: parseInt(e.target.value) },
                          })
                        }
                        className="w-full accent-violet-500 h-1 bg-zinc-800 rounded cursor-pointer mt-0.5"
                      />
                    </div>
                  </div>
                </div>

                {/* Stage 2 Rack */}
                <div className="p-2 rounded-xl bg-[#101015] border border-indigo-900/50 flex flex-col gap-1.5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_6px_rgba(129,140,248,1)]" />
                      <span className="font-mono text-[9px] font-extrabold text-indigo-300 uppercase tracking-wider">
                        STAGE 2: {chainConfig.fx2.type}
                      </span>
                    </div>
                    <span className="font-mono text-[8px] text-zinc-500">SERIES OUTPUT</span>
                  </div>

                  {/* Stage 2 Type Selector */}
                  <div className="grid grid-cols-4 gap-0.5">
                    {fxTypes.map((t) => (
                      <button
                        key={`s2-${t}`}
                        onClick={() =>
                          handleUpdateChain({
                            fx2: { ...chainConfig.fx2, type: t },
                          })
                        }
                        className={`py-1 rounded font-mono text-[8.5px] font-bold uppercase transition border ${
                          chainConfig.fx2.type === t
                            ? 'bg-indigo-600 text-white border-indigo-400 font-extrabold shadow-xs'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  {/* Stage 2 Knobs & Sliders */}
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <div className="flex items-center gap-2">
                      <FlatKnob
                        value={chainConfig.fx2.amount}
                        onChange={(val) =>
                          handleUpdateChain({
                            fx2: { ...chainConfig.fx2, amount: val },
                          })
                        }
                        size="sm"
                        accentColor="#818cf8"
                      />
                      <div className="flex flex-col">
                        <span className="font-mono text-[8px] font-bold text-zinc-400 uppercase">
                          {getParamLabels(chainConfig.fx2.type).primary}
                        </span>
                        <span className="font-mono text-[10px] font-bold text-zinc-100">
                          {chainConfig.fx2.amount}%
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 max-w-[110px] flex flex-col justify-center">
                      <div className="flex items-center justify-between font-mono text-[7.5px] text-zinc-400 uppercase">
                        <span>{getParamLabels(chainConfig.fx2.type).secondary}</span>
                        <span className="text-zinc-200">{chainConfig.fx2.secondaryParam}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={chainConfig.fx2.secondaryParam}
                        onChange={(e) =>
                          handleUpdateChain({
                            fx2: { ...chainConfig.fx2, secondaryParam: parseInt(e.target.value) },
                          })
                        }
                        className="w-full accent-indigo-500 h-1 bg-zinc-800 rounded cursor-pointer mt-0.5"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Master Chain Mix (Wet/Dry Blend) */}
              <div className="p-2 rounded-xl bg-[#111116] border border-zinc-800 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <Workflow className="w-4 h-4 text-violet-400 shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-mono text-[9px] font-bold text-zinc-300 uppercase">
                      CHAIN MASTER WET MIX
                    </span>
                    <span className="font-mono text-[7.5px] text-zinc-500">
                      Daisy-Chain Signalanteil auf {chainConfig.targetStem.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-1 max-w-[160px]">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={chainConfig.mix}
                    onChange={(e) => handleUpdateChain({ mix: parseInt(e.target.value) })}
                    className="w-full accent-violet-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                  <span className="font-mono text-[10px] font-black text-violet-300 w-8 text-right">
                    {chainConfig.mix}%
                  </span>
                </div>
              </div>

              {/* 5. Instant Loop Recorder & Master Tape Recorder Modules */}
              <div className="shrink-0 flex flex-col gap-1.5 pt-0.5">
                <LoopRecorder bpm={bpm} variant="compact" />
                <MasterRecorder variant="compact" onLogActivity={onLogActivity} />
              </div>
            </div>
          ) : (
            /* STANDARD SINGLE FX VIEW */
            <>
              {/* 1. FX Type Selector & Target Stem Header */}
              <div className="flex items-center justify-between gap-2 shrink-0">
                {/* FX Type Tabs */}
                <div className="flex-1 grid grid-cols-4 gap-1">
                  {fxTypes.map((type) => {
                    const isSelected = fx.type === type;
                    return (
                      <button
                        key={type}
                        onClick={() => onUpdateFX({ type })}
                        className={`py-1.5 px-1 rounded-xl font-mono text-[10px] font-bold tracking-wider uppercase transition active:scale-95 border ${
                          isSelected
                            ? 'bg-zinc-100 text-zinc-950 border-white shadow-sm'
                            : 'bg-[#121216] text-zinc-400 border-zinc-800/80 hover:text-zinc-200'
                        }`}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 1.5 Active Master EQ Preset Display & Quick Selector */}
              <div className="flex items-center justify-between px-2.5 py-1 rounded-xl bg-[#0f0f13] border border-zinc-800/90 shrink-0">
                <div
                  onClick={handleNextPreset}
                  className="flex items-center gap-2 cursor-pointer group select-none min-w-0"
                  title="Klicke, um zum nächsten Master EQ Preset zu wechseln (oder Einstellungen öffnen)"
                >
                  {/* Active Preset Glow Dot */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.9)] animate-pulse" />
                    <span className="font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                      MASTER EQ:
                    </span>
                  </div>

                  {/* Active Preset Name Badge */}
                  <div className="flex items-center gap-1 bg-cyan-950/60 border border-cyan-500/50 px-2 py-0.5 rounded-md text-cyan-300 font-mono text-[9.5px] font-extrabold uppercase tracking-wider shadow-sm group-hover:border-cyan-400 group-hover:text-cyan-200 transition">
                    <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                    <span>{masterEqPreset}</span>
                  </div>

                  {/* Micro Curve dB indicators */}
                  <div className="hidden sm:flex items-center gap-1.5 text-[8px] font-mono text-zinc-500 shrink-0">
                    <span>L: <strong className={currentEq.low !== 0 ? 'text-zinc-300' : 'text-zinc-600'}>{currentEq.low > 0 ? `+${currentEq.low.toFixed(1)}` : currentEq.low.toFixed(1)}</strong></span>
                    <span>M: <strong className={currentEq.mid !== 0 ? 'text-zinc-300' : 'text-zinc-600'}>{currentEq.mid > 0 ? `+${currentEq.mid.toFixed(1)}` : currentEq.mid.toFixed(1)}</strong></span>
                    <span>H: <strong className={currentEq.high !== 0 ? 'text-zinc-300' : 'text-zinc-600'}>{currentEq.high > 0 ? `+${currentEq.high.toFixed(1)}` : currentEq.high.toFixed(1)}</strong></span>
                  </div>
                </div>

                {/* Preset Selector Dropdown / Settings Link */}
                <div className="flex items-center gap-1 shrink-0">
                  {onSelectMasterEqPreset ? (
                    <select
                      value={masterEqPreset}
                      onChange={(e) => onSelectMasterEqPreset(e.target.value)}
                      className="bg-zinc-900 border border-zinc-700/80 text-zinc-200 font-mono text-[8.5px] font-bold rounded-lg px-1.5 py-0.5 cursor-pointer focus:outline-none focus:border-cyan-500"
                      title="Wähle Master EQ Preset"
                    >
                      {MASTER_EQ_PRESETS.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <button
                      onClick={onOpenSettings}
                      className="flex items-center gap-0.5 text-[8.5px] font-mono font-bold text-zinc-400 hover:text-cyan-300 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 transition"
                      title="Master EQ im Einstellungsmenü anpassen"
                    >
                      <Sliders className="w-2.5 h-2.5" />
                      <span>EDIT</span>
                    </button>
                  )}

                  {onOpenSettings && (
                    <button
                      onClick={onOpenSettings}
                      className="p-1 rounded text-zinc-500 hover:text-zinc-300 transition"
                      title="Master EQ Einstellungen öffnen"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Real-Time Spectral Analyzer & Filter Frequency Response Graph */}
              <div className="shrink-0">
                <SpectralAnalyzerGraph
                  fx={fx}
                  onUpdateCutoff={(newAmount) => onUpdateFX({ amount: newAmount })}
                  onUpdateResonance={(newSec) => onUpdateFX({ secondaryParam: newSec })}
                  onSelectFilterMode={(newMode: FilterMode) => onUpdateFX({ filterMode: newMode })}
                />
              </div>

              {/* 3. Primary & Secondary Parameter Controls */}
              <div className="flex items-center justify-between gap-3 px-3 py-1.5 bg-[#101014] rounded-2xl border border-zinc-850 shrink-0">
                {/* Primary Parameter */}
                <div className="flex items-center gap-3">
                  <FlatKnob
                    value={fx.amount}
                    onChange={(val) => onUpdateFX({ amount: val })}
                    size="md"
                    label={getParamLabels(fx.type).primary}
                    accentColor={fx.type === 'FILTER' ? '#f43f5e' : '#f4f4f5'}
                  />
                  <div className="flex flex-col">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400 font-bold">
                      {getParamLabels(fx.type).primary}
                    </span>
                    <span className="font-mono text-xs font-bold text-zinc-100">
                      {fx.amount}%
                    </span>
                  </div>
                </div>

                {/* Secondary Parameter */}
                <div className="flex-1 flex flex-col justify-center max-w-[190px] px-2">
                  <div className="flex items-center justify-between font-mono text-[9px] font-bold text-zinc-400 uppercase mb-0.5">
                    <span>{getParamLabels(fx.type).secondary}</span>
                    <span className="text-zinc-200">{fx.secondaryParam}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={fx.secondaryParam}
                    onChange={(e) => onUpdateFX({ secondaryParam: parseInt(e.target.value) })}
                    className="w-full accent-rose-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[7px] font-mono text-zinc-500 mt-0.5">
                    <span>MIN</span>
                    <span>FLAT</span>
                    <span>MAX</span>
                  </div>
                </div>
              </div>

              {/* 3.5. Instant Loop Recorder & Master Audio Recorder Compact Modules */}
              <div className="shrink-0 flex flex-col gap-1.5">
                <LoopRecorder bpm={bpm} variant="compact" />
                <MasterRecorder variant="compact" onLogActivity={onLogActivity} />
              </div>

              {/* 4. FX Sends For 4 Stems */}
              <div className="p-2 bg-[#111115] rounded-2xl border border-zinc-800/90 shrink-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[9px] font-bold tracking-wider uppercase text-zinc-400">
                    STEM FX SENDS
                  </span>
                  <button
                    onClick={onOpenFxEdit}
                    className="flex items-center gap-1 font-mono text-[8px] text-zinc-400 hover:text-zinc-200 uppercase tracking-wider bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800 active:scale-95 transition"
                  >
                    <SlidersHorizontal className="w-2.5 h-2.5" />
                    DEEP EDIT
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {stems.map((stem) => {
                    const sendPct = Math.round(stem.send * 100);

                    return (
                      <div
                        key={stem.id}
                        className="flex flex-col items-center p-1 rounded-xl bg-[#17171d] border border-zinc-800/60"
                      >
                        <FlatKnob
                          value={sendPct}
                          onChange={(val) => onUpdateStemSend(stem.id, val / 100)}
                          size="sm"
                          accentColor={stem.accentColor}
                        />
                        <span className="font-mono text-[8px] font-bold uppercase tracking-wider text-zinc-300 mt-0.5">
                          {stem.name}
                        </span>
                        <span className="font-mono text-[7px] text-zinc-500">
                          {sendPct}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* FX Chain Slot Fine-Tuning Modal / Inspector */}
      {editingPresetSlot && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-[#0e0e14] border border-violet-500/50 rounded-2xl p-4 max-w-md w-full shadow-2xl flex flex-col gap-3 font-mono text-zinc-200 select-none max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <Workflow className="w-4 h-4 text-violet-400" />
                <span className="text-[11px] font-black uppercase text-violet-300 tracking-wider">
                  FX CHAIN SLOT [{editingPresetSlot.slot}] FEINJUSTIERUNG
                </span>
              </div>
              <button
                onClick={() => setEditingPresetSlot(null)}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Name & Target Stem */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[8px] text-zinc-500 uppercase font-bold block mb-1">
                  PRESET NAME
                </label>
                <input
                  type="text"
                  value={editingPresetSlot.name}
                  onChange={(e) =>
                    setEditingPresetSlot({
                      ...editingPresetSlot,
                      name: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full bg-[#14141c] border border-zinc-800 focus:border-violet-500 rounded-lg px-2 py-1 text-xs font-mono font-bold text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[8px] text-zinc-500 uppercase font-bold block mb-1">
                  ZIEL-STEM
                </label>
                <select
                  value={editingPresetSlot.targetStem}
                  onChange={(e) =>
                    setEditingPresetSlot({
                      ...editingPresetSlot,
                      targetStem: e.target.value as StemId | 'ALL',
                    })
                  }
                  className="w-full bg-[#14141c] border border-zinc-800 focus:border-violet-500 rounded-lg px-2 py-1 text-xs font-mono font-bold text-white outline-none"
                >
                  <option value="ALL">MASTER BUS (ALLE)</option>
                  <option value="drums">DRUMS</option>
                  <option value="bass">BASS</option>
                  <option value="music">MUSIC</option>
                  <option value="vocal">VOCAL</option>
                </select>
              </div>
            </div>

            {/* 1. Filter Settings */}
            <div className="p-2.5 rounded-xl bg-[#12121a] border border-rose-950/60 flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-1">
                <span className="text-[9px] font-black text-rose-300 uppercase tracking-wider">
                  1. FILTER PARAMETER
                </span>
                {/* Filter Mode Radio Buttons */}
                <div className="flex items-center gap-1">
                  {(['LOWPASS', 'HIGHPASS', 'DUAL'] as FilterMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() =>
                        setEditingPresetSlot({
                          ...editingPresetSlot,
                          filter: { ...editingPresetSlot.filter, mode: m },
                        })
                      }
                      className={`px-1.5 py-0.5 rounded text-[7.5px] font-bold border transition ${
                        editingPresetSlot.filter.mode === m
                          ? 'bg-rose-600 text-white border-rose-400'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      {m.slice(0, 4)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex justify-between text-[7.5px] text-zinc-400 mb-0.5">
                    <span>CUTOFF</span>
                    <span className="text-rose-300 font-bold">{editingPresetSlot.filter.cutoff}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={editingPresetSlot.filter.cutoff}
                    onChange={(e) =>
                      setEditingPresetSlot({
                        ...editingPresetSlot,
                        filter: { ...editingPresetSlot.filter, cutoff: parseInt(e.target.value) },
                      })
                    }
                    className="w-full accent-rose-500 h-1 bg-zinc-800 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[7.5px] text-zinc-400 mb-0.5">
                    <span>RESONANCE</span>
                    <span className="text-rose-300 font-bold">{editingPresetSlot.filter.resonance}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={editingPresetSlot.filter.resonance}
                    onChange={(e) =>
                      setEditingPresetSlot({
                        ...editingPresetSlot,
                        filter: { ...editingPresetSlot.filter, resonance: parseInt(e.target.value) },
                      })
                    }
                    className="w-full accent-rose-500 h-1 bg-zinc-800 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* 2. Delay Settings */}
            <div className="p-2.5 rounded-xl bg-[#12121a] border border-cyan-950/60 flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-1">
                <span className="text-[9px] font-black text-cyan-300 uppercase tracking-wider">
                  2. DELAY PARAMETER
                </span>
                <div className="flex items-center gap-1">
                  {(['1/8', '1/4', '1/2', '1'] as ('1/8' | '1/4' | '1/2' | '1')[]).map((div) => (
                    <button
                      key={div}
                      onClick={() =>
                        setEditingPresetSlot({
                          ...editingPresetSlot,
                          delay: { ...editingPresetSlot.delay, timeDivision: div },
                        })
                      }
                      className={`px-1.5 py-0.5 rounded text-[7.5px] font-bold border transition ${
                        editingPresetSlot.delay.timeDivision === div
                          ? 'bg-cyan-600 text-white border-cyan-400'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      {div}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex justify-between text-[7.5px] text-zinc-400 mb-0.5">
                    <span>FEEDBACK</span>
                    <span className="text-cyan-300 font-bold">{editingPresetSlot.delay.feedback}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={editingPresetSlot.delay.feedback}
                    onChange={(e) =>
                      setEditingPresetSlot({
                        ...editingPresetSlot,
                        delay: { ...editingPresetSlot.delay, feedback: parseInt(e.target.value) },
                      })
                    }
                    className="w-full accent-cyan-500 h-1 bg-zinc-800 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[7.5px] text-zinc-400 mb-0.5">
                    <span>DELAY SEND / WET</span>
                    <span className="text-cyan-300 font-bold">{editingPresetSlot.delay.amount}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={editingPresetSlot.delay.amount}
                    onChange={(e) =>
                      setEditingPresetSlot({
                        ...editingPresetSlot,
                        delay: { ...editingPresetSlot.delay, amount: parseInt(e.target.value) },
                      })
                    }
                    className="w-full accent-cyan-500 h-1 bg-zinc-800 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* 3. Reverb Settings */}
            <div className="p-2.5 rounded-xl bg-[#12121a] border border-purple-950/60 flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-1">
                <span className="text-[9px] font-black text-purple-300 uppercase tracking-wider">
                  3. REVERB PARAMETER
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex justify-between text-[7.5px] text-zinc-400 mb-0.5">
                    <span>ROOM SIZE</span>
                    <span className="text-purple-300 font-bold">{editingPresetSlot.reverb.roomSize}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={editingPresetSlot.reverb.roomSize}
                    onChange={(e) =>
                      setEditingPresetSlot({
                        ...editingPresetSlot,
                        reverb: { ...editingPresetSlot.reverb, roomSize: parseInt(e.target.value) },
                      })
                    }
                    className="w-full accent-purple-500 h-1 bg-zinc-800 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[7.5px] text-zinc-400 mb-0.5">
                    <span>DAMPING</span>
                    <span className="text-purple-300 font-bold">{editingPresetSlot.reverb.damping}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={editingPresetSlot.reverb.damping}
                    onChange={(e) =>
                      setEditingPresetSlot({
                        ...editingPresetSlot,
                        reverb: { ...editingPresetSlot.reverb, damping: parseInt(e.target.value) },
                      })
                    }
                    className="w-full accent-purple-500 h-1 bg-zinc-800 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* 4. Chain Routing & Wet/Dry Mix */}
            <div className="p-2.5 rounded-xl bg-[#12121a] border border-zinc-800 flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-[8.5px] font-bold text-zinc-300 uppercase">CHAIN MASTER MIX</span>
                <span className="text-[7px] text-zinc-500">Wet/Dry Blend: {editingPresetSlot.mix}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={editingPresetSlot.mix}
                onChange={(e) =>
                  setEditingPresetSlot({
                    ...editingPresetSlot,
                    mix: parseInt(e.target.value),
                  })
                }
                className="flex-1 max-w-[140px] accent-violet-500 h-1.5 bg-zinc-800 rounded cursor-pointer"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-800">
              <button
                onClick={() => setEditingPresetSlot(null)}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-[9px] font-bold uppercase transition"
              >
                ABBRECHEN
              </button>
              <button
                onClick={() => handleSaveEditedPreset(editingPresetSlot)}
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-[9px] font-black uppercase transition shadow-md active:scale-95"
              >
                SPEICHERN & LADEN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

