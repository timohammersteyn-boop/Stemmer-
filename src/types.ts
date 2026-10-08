export type StemId = 'drums' | 'bass' | 'music' | 'vocal';

export type ScreenMode =
  | 'STEMS'
  | 'MIX'
  | 'PAD'
  | 'MACRO_FX'
  | 'SLICER'
  | 'LOOP_RECORDER'
  | 'MASTER_RECORDER'
  | 'LIBRARY'
  | 'SCHOOL'
  | 'SETTINGS'
  | 'FX'; // Backward compatibility alias

export type OverlayType = 'TRACK_LOAD' | 'STEM_EDIT' | 'FX_EDIT' | 'SETTINGS' | 'ACTIVITY_FEED' | 'MANUAL_SCHOOL' | 'MIDI_LEARN' | 'PWA_INSTALL' | 'SHORTCUTS' | null;

export interface ActivityLogItem {
  id: string;
  time: string;
  category: 'LOAD' | 'PLAY' | 'CUE' | 'LOOP' | 'FX' | 'MUTE' | 'SOLO' | 'FADER' | 'PAD' | 'BANK' | 'TEMPO' | 'MIDI' | 'TRANSPORT' | 'HARMONIC' | 'RECORD';
  message: string;
  accentColor?: string;
}

export type PadMode = 'HOT CUE' | 'LOOP' | 'SLICER' | 'ROLL';

export type PadBankId = 'A' | 'B' | 'C' | 'D';

export interface PadConfig {
  id: number;
  label: string;
  sublabel?: string;
  color: StemId | 'white' | 'accent' | 'muted';
  active: boolean;
  type: 'cue' | 'loop' | 'slice' | 'roll';
  value: number; // Seconds for cues, beats for loops/rolls, slice step index
}

export type BankData = Record<PadBankId, {
  mode: PadMode;
  pads: PadConfig[];
}>;

export interface StemData {
  id: StemId;
  name: string;
  colorName: string;
  accentColor: string; // Hex color for indicators
  glowClass: string;
  textClass: string;
  bgClass: string;
  volume: number; // 0.0 to 1.0 (defaults around 0.8)
  mute: boolean;
  solo: boolean;
  cue: boolean;
  filter: number; // 0 to 1, 0.5 neutral
  pan: number; // -1 to 1
  eq: {
    low: number; // -12 to +12 dB
    mid: number;
    high: number;
  };
  level: number; // 0.0 to 1.0
  send: number; // FX send 0 to 1
}

export type MasterDeck = 'A' | 'B';

export type FXType = 'FILTER' | 'DELAY' | 'REVERB' | 'DRIVE';

export type FilterMode = 'LOWPASS' | 'HIGHPASS' | 'DUAL';

export interface ChainFXItem {
  type: FXType;
  filterMode?: FilterMode;
  amount: number; // 0 to 100 %
  secondaryParam: number; // 0 to 100 %
  timeDivision?: '1/8' | '1/4' | '1/2' | '1';
}

export interface ChainFXConfig {
  enabled: boolean;
  fx1: ChainFXItem;
  fx2: ChainFXItem;
  targetStem: StemId | 'ALL';
  routing: 'FX1_TO_FX2' | 'FX2_TO_FX1';
  mix: number; // 0 to 100 % wet/dry mix
}

export interface FXChainPreset {
  id: string; // e.g. 'chain-slot-1'
  slot: number; // 1 to 6
  name: string; // e.g. 'DUB ECHO WASH'
  description?: string; // e.g. 'Lowpass + 1/4 Delay + Hall Verb'
  targetStem: StemId | 'ALL';
  filter: {
    enabled: boolean;
    mode: FilterMode;
    cutoff: number; // 0 - 100%
    resonance: number; // 0 - 100%
  };
  delay: {
    enabled: boolean;
    timeDivision: '1/8' | '1/4' | '1/2' | '1';
    feedback: number; // 0 - 100%
    amount: number; // 0 - 100%
  };
  reverb: {
    enabled: boolean;
    roomSize: number; // 0 - 100%
    damping: number; // 0 - 100%
  };
  drive?: {
    enabled: boolean;
    amount: number;
    tone: number;
  };
  fx1Type: FXType;
  fx2Type: FXType;
  routing: 'FX1_TO_FX2' | 'FX2_TO_FX1';
  mix: number; // 0 - 100%
  isFactory?: boolean;
  savedAt?: number;
}

export interface FXSnapshot {
  id: string; // 'snap-1' | 'snap-2' | etc.
  name: string; // User-friendly label (e.g., 'DUB ECHO', 'SPACE SWEEP')
  slot: number; // 1 | 2 | 3 | 4
  type: FXType;
  filterMode?: FilterMode;
  targetStem: StemId | 'ALL';
  amount: number;
  secondaryParam: number;
  timeDivision: '1/8' | '1/4' | '1/2' | '1';
  chainMode?: boolean;
  chainFX?: ChainFXConfig;
  savedAt?: number;
}

export interface FXState {
  type: FXType;
  filterMode?: FilterMode; // 'LOWPASS' | 'HIGHPASS' | 'DUAL'
  targetStem: StemId | 'ALL';
  amount: number; // 0 to 100 %
  secondaryParam: number; // 0 to 100 % (e.g. Resonance for Filter, Feedback for Delay)
  timeDivision: '1/8' | '1/4' | '1/2' | '1';
  sync: boolean;
  active: boolean;
  chainMode?: boolean;
  chainFX?: ChainFXConfig;
}

export interface LoopRecorderState {
  isRecording: boolean;
  isPlaying: boolean;
  hasLoop: boolean;
  targetBars: 1 | 2 | 4;
  recordedBars: 1 | 2 | 4;
  duration: number; // in seconds
  currentTime: number; // in seconds
  volume: number; // 0.0 to 1.5
  isMuted: boolean;
  playbackRate: number; // 0.5, 1.0, 2.0
  waveform: number[];
  filterCutoff: number; // 0 - 100%
}

export interface MasterRecorderState {
  status: 'idle' | 'recording' | 'paused' | 'stopped';
  duration: number; // in seconds
  audioBlob: Blob | null;
  audioUrl: string | null;
  mimeType: string;
  fileSizeBytes: number;
  formattedTime: string;
}

export interface TrackData {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  duration: number; // seconds
  genre: string;
  stems: {
    drums: boolean;
    bass: boolean;
    music: boolean;
    vocal: boolean;
  };
  waveform: number[];
  peakDb?: number; // True Peak in dBFS (e.g. -0.4)
  peakRmsDb?: number; // Peak RMS in dBFS (e.g. -16.2)
  gainCompensationDb?: number; // Optimal gain compensation in dB (e.g. +2.2)
  isImported?: boolean;
}

export type FaderCurve = 'Linear' | 'Exponential' | 'Constant Power';

export interface MasterEqSettings {
  low: number; // -12 to +12 dB
  mid: number;
  high: number;
}

export interface MasterEqPresetConfig {
  id: string;
  name: string;
  description: string;
  eq: MasterEqSettings;
}

export interface AppSettings {
  audioDevice: string;
  latency: 'LOW (128)' | 'MED (256)' | 'SAFE (512)';
  faderCurve: FaderCurve;
  masterLimiter: boolean;
  padSensitivity: 'HIGH' | 'NORMAL' | 'SOFT';
  padQuantize: '1/16' | '1/8' | '1/4' | 'OFF';
  stemEngine: 'NEURAL 4-WAY V2' | 'SPECTRAL DSP';
  bpmDetection: boolean;
  autoBpm: boolean;
  keyFormat: 'CAMELOT' | 'CLASSIC';
  brightness: number;
  theme: 'NOTHING_DARK' | 'HIGH_CONTRAST' | 'MINIMAL_GRAIN';
  glyphIntensity: 'SUBTLE' | 'MEDIUM' | 'VIVID';
  hardwareMode: boolean;
  masterEq: MasterEqSettings;
  masterEqPreset: string;
  uiSounds: boolean;
  showBeatGridOverlay?: boolean;
  hapticFeedback?: boolean;
}

export type MidiActionId =
  | 'PLAY_PAUSE'
  | 'CUE'
  | 'LOOP'
  | 'SYNC'
  | 'SWAP'
  | 'CROSSFADER'
  | 'NUDGE_BACK'
  | 'NUDGE_FWD'
  | 'FADER_DRUMS'
  | 'FADER_BASS'
  | 'FADER_MUSIC'
  | 'FADER_VOCAL'
  | 'MUTE_DRUMS'
  | 'MUTE_BASS'
  | 'MUTE_MUSIC'
  | 'MUTE_VOCAL'
  | 'PAD_1' | 'PAD_2' | 'PAD_3' | 'PAD_4'
  | 'PAD_5' | 'PAD_6' | 'PAD_7' | 'PAD_8'
  | 'PAD_9' | 'PAD_10' | 'PAD_11' | 'PAD_12'
  | 'PAD_13' | 'PAD_14' | 'PAD_15' | 'PAD_16'
  | 'BANK_A' | 'BANK_B' | 'BANK_C' | 'BANK_D'
  | 'FX_AMOUNT'
  | 'LOOP_RECORDER_REC'
  | 'LOOP_RECORDER_PLAY';

export interface MidiBinding {
  actionId: MidiActionId;
  label: string;
  category: 'TRANSPORT' | 'FADERS' | 'MUTES' | 'PADS' | 'BANKS' | 'FX';
  messageType: 'cc' | 'note';
  number: number; // CC or Note number (0-127)
  channel?: number;
}

export interface MidiDeviceInfo {
  id: string;
  name: string;
  manufacturer: string;
  state: string;
}

