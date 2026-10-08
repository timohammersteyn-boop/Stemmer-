/**
 * STEMSDINGS — Torso Electronics S4 Audio & Modulation Engine
 * "PLAY MUSIC DIFFERENT."
 * Realtime 8-Stem Synchronous Looper, 5-Stage Serial DSP Chain,
 * 4-Slot Modulation Matrix (▲, ■, ⬡, ●), and Web MIDI Plug-and-Play.
 */

export type S4DeviceType = 'MATERIAL' | 'GRANULAR' | 'FILTER' | 'COLOR' | 'SPACE';
export type ModSlotId = 'SLOT_1' | 'SLOT_2' | 'SLOT_3' | 'SLOT_4';

export interface ModSlotConfig {
  id: ModSlotId;
  symbol: '▲' | '■' | '⬡' | '●';
  name: string;
  color: string; // #00E5FF, #FFEA00, #00E676, #FF1744
  type: 'LFO' | 'RANDOM_SH' | 'STEP_SEQ' | 'MACRO';
  waveform: 'SINE' | 'TRIANGLE' | 'SAW' | 'SQUARE';
  rateHz: number; // 0.1 to 20 Hz
  depth: number; // 0 to 1
  steps: number[]; // 16 values (0 to 1) for step sequencer
  currentValue: number; // -1 to 1 or 0 to 1
  targetParam: string | null; // e.g. 'filterCutoff', 'granularSpray'
}

export interface S4ChainParams {
  // 1. MATERIAL
  tapeSpeed: number; // -2.0 to +2.0 (1.0 = normal, -1.0 = reverse)
  tapeReverse: boolean;
  loopBars: number; // 1, 2, 4, 8, 16
  tapeCrossfade: number; // 0.0 to 1.0

  // 2. GRANULAR
  grainSize: number; // 0.05 to 0.8
  grainDensity: number; // 0.1 to 1.0
  granularSpray: number; // 0.0 to 1.0
  warpContour: number; // 0.0 to 1.0

  // 3. FILTER
  filterMode: 'LOWPASS' | 'HIGHPASS' | 'BANDPASS' | 'NOTCH';
  filterCutoff: number; // 0.0 to 1.0 (maps to 40Hz - 18kHz)
  filterResonance: number; // 0.0 to 1.0 (Q 0.5 - 18)

  // 4. COLOR
  colorDrive: number; // 0.0 to 1.0
  bitDepth: number; // 4 to 16
  sampleRateCrush: number; // 0.0 to 1.0
  analogNoise: number; // 0.0 to 0.3

  // 5. SPACE
  delayTimeDivision: '1/16' | '1/8' | '1/4' | '1/2' | 'DOTTED';
  delayFeedback: number; // 0.0 to 0.95
  reverbRoomSize: number; // 0.0 to 1.0
  reverbDamping: number; // 0.0 to 1.0
  masterFreeze: boolean;
}

export interface LiveStemItem {
  id: string; // 'a_drums', 'a_bass', etc.
  zone: 'A' | 'B';
  role: 'drums' | 'bass' | 'music' | 'vocal';
  name: string;
  trackTitle: string;
  volume: number; // 0.0 to 1.0
  isMuted: boolean;
  isSolo: boolean;
  isPlaying: boolean;
  pan: number; // -1.0 to 1.0
  bars: 4 | 8 | 16;
  activeDevice: S4DeviceType;
  params: S4ChainParams;
}

export interface ReactiveHudEvent {
  stemId?: string;
  paramName: string;
  valueDisplay: string;
  modSymbol?: string;
  modColor?: string;
  timestamp: number;
  isPlaylistImported?: boolean;
  updatedStemIds?: string[];
}

class TorsoS4Engine {
  private ctx: AudioContext | null = null;
  private isRunning: boolean = false;
  private masterBpm: number = 128;
  private crossfaderPos: number = 0.5; // 0.0 = Zone A, 1.0 = Zone B
  private crossfaderCurve: 'SMOOTH' | 'LINEAR' | 'CUT' = 'SMOOTH';

  // Master Gain & Limiter
  private masterGainNode: GainNode | null = null;
  private masterLimiterNode: DynamicsCompressorNode | null = null;
  private masterAnalyserNode: AnalyserNode | null = null;

  // External MIDI Clock sync variables
  private extClockSyncEnabled: boolean = false;
  private lastClockTime: number = 0;
  private clockTicks: number[] = [];
  private extClockBpmListeners: Array<(bpm: number) => void> = [];

  // Zone Buses
  private zoneAGainNode: GainNode | null = null;
  private zoneBGainNode: GainNode | null = null;

  // Stems Audio Nodes
  private stemChains: Map<string, {
    gainNode: GainNode;
    filterNode: BiquadFilterNode;
    pannerNode: StereoPannerNode;
    driveNode: WaveShaperNode;
    delayNode: DelayNode;
    delayFeedbackNode: GainNode;
    noiseGainNode: GainNode;
    analyserNode: AnalyserNode;
  }> = new Map();

  // Noise Generator Source
  private noiseSourceNode: AudioBufferSourceNode | null = null;

  // Freeze Gain
  private freezeDelayNode: DelayNode | null = null;
  private freezeFeedbackNode: GainNode | null = null;

  // Modulation Slots Matrix
  private modSlots: Map<ModSlotId, ModSlotConfig> = new Map([
    [
      'SLOT_1',
      {
        id: 'SLOT_1',
        symbol: '▲',
        name: 'MOD 1 (CYAN)',
        color: '#00E5FF',
        type: 'LFO',
        waveform: 'SINE',
        rateHz: 1.0,
        depth: 0.75,
        steps: Array(16).fill(0.5),
        currentValue: 0,
        targetParam: 'filterCutoff',
      },
    ],
    [
      'SLOT_2',
      {
        id: 'SLOT_2',
        symbol: '■',
        name: 'MOD 2 (YELLOW)',
        color: '#FFEA00',
        type: 'LFO',
        waveform: 'TRIANGLE',
        rateHz: 0.5,
        depth: 0.6,
        steps: Array(16).fill(0.5),
        currentValue: 0,
        targetParam: 'granularSpray',
      },
    ],
    [
      'SLOT_3',
      {
        id: 'SLOT_3',
        symbol: '⬡',
        name: 'MOD 3 (GREEN)',
        color: '#00E676',
        type: 'STEP_SEQ',
        waveform: 'SAW',
        rateHz: 2.0,
        depth: 0.8,
        steps: [0.1, 0.4, 0.8, 0.3, 0.9, 0.2, 0.6, 0.4, 1.0, 0.5, 0.7, 0.2, 0.8, 0.3, 0.5, 0.9],
        currentValue: 0,
        targetParam: 'tapeSpeed',
      },
    ],
    [
      'SLOT_4',
      {
        id: 'SLOT_4',
        symbol: '●',
        name: 'MOD 4 (RED)',
        color: '#FF1744',
        type: 'MACRO',
        waveform: 'SQUARE',
        rateHz: 0.25,
        depth: 0.5,
        steps: Array(16).fill(0.5),
        currentValue: 0,
        targetParam: 'colorDrive',
      },
    ],
  ]);

  // Synthetic Sound Generators for 8 Stems
  private stemOscs: Map<string, { osc1: OscillatorNode; osc2?: OscillatorNode; envGain: GainNode }> = new Map();
  private beatIntervalId: number | null = null;
  private currentStep: number = 0;

  // Listeners & HUD Dispatchers
  private hudListeners: Array<(event: ReactiveHudEvent) => void> = [];
  private modMatrixListeners: Array<(slots: ModSlotConfig[]) => void> = [];
  private midiLogListeners: Array<(log: string) => void> = [];

  // MIDI Mappings
  private midiMappings: Record<number, { targetParam: string; stemId?: string }> = {};

  constructor() {
    this.loadMidiMappings();
    this.startModulationEngine();
  }

  // --- AUDIO INITIALIZATION ---
  public async ensureContext(): Promise<AudioContext> {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass({ latencyHint: 'interactive' });

      // Master Chain
      this.masterGainNode = this.ctx.createGain();
      this.masterGainNode.gain.value = 0.9;

      this.masterLimiterNode = this.ctx.createDynamicsCompressor();
      this.masterLimiterNode.threshold.value = -1.0;
      this.masterLimiterNode.knee.value = 3.0;
      this.masterLimiterNode.ratio.value = 16.0;
      this.masterLimiterNode.attack.value = 0.002;
      this.masterLimiterNode.release.value = 0.1;

      this.masterAnalyserNode = this.ctx.createAnalyser();
      this.masterAnalyserNode.fftSize = 128;

      // Zone Buses
      this.zoneAGainNode = this.ctx.createGain();
      this.zoneBGainNode = this.ctx.createGain();
      this.updateCrossfaderGains();

      this.zoneAGainNode.connect(this.masterLimiterNode);
      this.zoneBGainNode.connect(this.masterLimiterNode);
      this.masterLimiterNode.connect(this.masterGainNode);
      this.masterGainNode.connect(this.masterAnalyserNode);
      this.masterAnalyserNode.connect(this.ctx.destination);

      // Create pink noise buffer
      this.initAnalogNoise();

      // Initialize 8 Stems DSP nodes
      this.init8Stems();
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    return this.ctx;
  }

  private initAnalogNoise() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }

    this.noiseSourceNode = this.ctx.createBufferSource();
    this.noiseSourceNode.buffer = buffer;
    this.noiseSourceNode.loop = true;
    try {
      this.noiseSourceNode.start(0);
    } catch {
      // ignore
    }
  }

  private init8Stems() {
    if (!this.ctx || !this.zoneAGainNode || !this.zoneBGainNode) return;

    const stemIds = [
      { id: 'a_drums', zone: 'A', baseFreq: 60, type: 'triangle' as OscillatorType },
      { id: 'a_bass', zone: 'A', baseFreq: 110, type: 'sawtooth' as OscillatorType },
      { id: 'a_music', zone: 'A', baseFreq: 440, type: 'square' as OscillatorType },
      { id: 'a_vocal', zone: 'A', baseFreq: 330, type: 'sine' as OscillatorType },
      { id: 'b_drums', zone: 'B', baseFreq: 65, type: 'triangle' as OscillatorType },
      { id: 'b_bass', zone: 'B', baseFreq: 98, type: 'sawtooth' as OscillatorType },
      { id: 'b_music', zone: 'B', baseFreq: 523, type: 'square' as OscillatorType },
      { id: 'b_vocal', zone: 'B', baseFreq: 392, type: 'sine' as OscillatorType },
    ];

    stemIds.forEach((stem) => {
      if (!this.ctx) return;
      const gainNode = this.ctx.createGain();
      gainNode.gain.value = 0.8;

      const filterNode = this.ctx.createBiquadFilter();
      filterNode.type = 'lowpass';
      filterNode.frequency.value = 12000;
      filterNode.Q.value = 2.0;

      const pannerNode = this.ctx.createStereoPanner();
      pannerNode.pan.value = 0;

      // Color Drive WaveShaper
      const driveNode = this.ctx.createWaveShaper();
      driveNode.curve = this.createDistortionCurve(10) as unknown as Float32Array<ArrayBuffer>;
      driveNode.oversample = '2x';

      // Space Delay
      const delayNode = this.ctx.createDelay(2.0);
      delayNode.delayTime.value = 0.25; // 1/4 note at 120 bpm approx
      const delayFeedbackNode = this.ctx.createGain();
      delayFeedbackNode.gain.value = 0.3;

      delayNode.connect(delayFeedbackNode);
      delayFeedbackNode.connect(delayNode);

      // Noise Gain
      const noiseGainNode = this.ctx.createGain();
      noiseGainNode.gain.value = 0.0;
      if (this.noiseSourceNode) {
        try {
          this.noiseSourceNode.connect(noiseGainNode);
        } catch {
          // ignore
        }
      }

      const analyserNode = this.ctx.createAnalyser();
      analyserNode.fftSize = 64;

      // Chain: Gain -> Drive -> Filter -> Delay + Dry -> Panner -> Analyser -> Zone Bus
      gainNode.connect(driveNode);
      driveNode.connect(filterNode);
      filterNode.connect(pannerNode);
      filterNode.connect(delayNode);
      delayNode.connect(pannerNode);
      noiseGainNode.connect(pannerNode);

      pannerNode.connect(analyserNode);
      const destinationBus = stem.zone === 'A' ? this.zoneAGainNode! : this.zoneBGainNode!;
      analyserNode.connect(destinationBus);

      this.stemChains.set(stem.id, {
        gainNode,
        filterNode,
        pannerNode,
        driveNode,
        delayNode,
        delayFeedbackNode,
        noiseGainNode,
        analyserNode,
      });
    });
  }

  private createDistortionCurve(amount: number): Float32Array {
    const k = typeof amount === 'number' ? amount : 50;
    const nSamples = 44100;
    const curve = new Float32Array(nSamples);
    const deg = Math.PI / 180;
    for (let i = 0; i < nSamples; ++i) {
      const x = (i * 2) / nSamples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  // --- TRANSPORT & SYNC PLAYBACK ---
  public async startPlayback(): Promise<void> {
    await this.ensureContext();
    this.isRunning = true;
    this.currentStep = 0;

    if (this.beatIntervalId) {
      clearInterval(this.beatIntervalId);
    }

    const stepMs = (60000 / this.masterBpm) / 4; // 16th notes
    this.beatIntervalId = window.setInterval(() => {
      this.onSequencerTick();
    }, stepMs);
  }

  public stopPlayback(): void {
    this.isRunning = false;
    if (this.beatIntervalId) {
      clearInterval(this.beatIntervalId);
      this.beatIntervalId = null;
    }
  }

  public getIsPlaying(): boolean {
    return this.isRunning;
  }

  public setMasterBpm(bpm: number): void {
    this.masterBpm = Math.max(60, Math.min(220, bpm));
    if (this.isRunning) {
      this.stopPlayback();
      this.startPlayback();
    }
  }

  public getMasterBpm(): number {
    return this.masterBpm;
  }

  // --- CROSSFADER ---
  public setCrossfader(pos: number): void {
    this.crossfaderPos = Math.max(0, Math.min(1, pos));
    this.updateCrossfaderGains();
  }

  public getCrossfader(): number {
    return this.crossfaderPos;
  }

  private updateCrossfaderGains(): void {
    if (!this.zoneAGainNode || !this.zoneBGainNode) return;
    const pos = this.crossfaderPos;
    let gainA = 1.0;
    let gainB = 1.0;

    if (this.crossfaderCurve === 'SMOOTH') {
      gainA = Math.cos(pos * 0.5 * Math.PI);
      gainB = Math.cos((1.0 - pos) * 0.5 * Math.PI);
    } else if (this.crossfaderCurve === 'LINEAR') {
      gainA = 1.0 - pos;
      gainB = pos;
    } else {
      // CUT
      gainA = pos > 0.95 ? 0 : 1;
      gainB = pos < 0.05 ? 0 : 1;
    }

    this.zoneAGainNode.gain.setValueAtTime(gainA, this.ctx?.currentTime || 0);
    this.zoneBGainNode.gain.setValueAtTime(gainB, this.ctx?.currentTime || 0);
  }

  // --- SYNTHETIC STEP RHYTHMS FOR 8 STEMS ---
  private onSequencerTick(): void {
    if (!this.ctx || !this.isRunning) return;

    this.currentStep = (this.currentStep + 1) % 64; // 4-bar loop (64 sixteenths)
    const stepInBar = this.currentStep % 16;
    const now = this.ctx.currentTime;

    // Trigger synthetic audio ticks on beat
    this.triggerSyntheticRhythm(stepInBar, now);
  }

  private triggerSyntheticRhythm(step: number, now: number): void {
    if (!this.ctx) return;

    // Zone A Stems
    const chainADrums = this.stemChains.get('a_drums');
    if (chainADrums && (step === 0 || step === 4 || step === 8 || step === 12)) {
      this.playSyntheticDrum(chainADrums.gainNode, now, step === 0 ? 120 : 80);
    }

    const chainABass = this.stemChains.get('a_bass');
    if (chainABass && (step % 2 === 0)) {
      this.playSyntheticBass(chainABass.gainNode, now, 55 + (step % 4) * 5);
    }

    const chainAMusic = this.stemChains.get('a_music');
    if (chainAMusic && (step % 4 === 2)) {
      this.playSyntheticChords(chainAMusic.gainNode, now, 440);
    }

    // Zone B Stems (alternate sync pattern)
    const chainBDrums = this.stemChains.get('b_drums');
    if (chainBDrums && (step === 2 || step === 6 || step === 10 || step === 14)) {
      this.playSyntheticDrum(chainBDrums.gainNode, now, 140);
    }

    const chainBBass = this.stemChains.get('b_bass');
    if (chainBBass && (step % 4 === 1)) {
      this.playSyntheticBass(chainBBass.gainNode, now, 65);
    }
  }

  private playSyntheticDrum(destGain: GainNode, time: number, freq: number): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(30, time + 0.12);
    g.gain.setValueAtTime(0.7, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    osc.connect(g);
    g.connect(destGain);
    osc.start(time);
    osc.stop(time + 0.16);
  }

  private playSyntheticBass(destGain: GainNode, time: number, freq: number): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);
    g.gain.setValueAtTime(0.4, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
    osc.connect(g);
    g.connect(destGain);
    osc.start(time);
    osc.stop(time + 0.2);
  }

  private playSyntheticChords(destGain: GainNode, time: number, freq: number): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);
    g.gain.setValueAtTime(0.3, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
    osc.connect(g);
    g.connect(destGain);
    osc.start(time);
    osc.stop(time + 0.26);
  }

  // --- TORSO S4 5-STAGE PARAMETER UPDATES ---
  public updateStemParams(stemId: string, params: Partial<S4ChainParams>): void {
    const chain = this.stemChains.get(stemId);
    if (!chain || !this.ctx) return;
    const now = this.ctx.currentTime;

    if (params.filterCutoff !== undefined) {
      // Maps 0.0 - 1.0 to 50Hz - 18000Hz exponentially
      const hz = 50 * Math.pow(18000 / 50, Math.max(0.01, Math.min(1.0, params.filterCutoff)));
      chain.filterNode.frequency.setTargetAtTime(hz, now, 0.02);
    }

    if (params.filterResonance !== undefined) {
      chain.filterNode.Q.setTargetAtTime(params.filterResonance * 15 + 0.5, now, 0.02);
    }

    if (params.filterMode) {
      chain.filterNode.type = params.filterMode.toLowerCase() as BiquadFilterType;
    }

    if (params.colorDrive !== undefined) {
      chain.driveNode.curve = this.createDistortionCurve(params.colorDrive * 80) as unknown as Float32Array<ArrayBuffer>;
    }

    if (params.analogNoise !== undefined) {
      chain.noiseGainNode.gain.setTargetAtTime(params.analogNoise * 0.15, now, 0.02);
    }

    if (params.delayFeedback !== undefined) {
      chain.delayFeedbackNode.gain.setTargetAtTime(Math.min(0.92, params.delayFeedback), now, 0.02);
    }

    if (params.masterFreeze !== undefined) {
      chain.delayFeedbackNode.gain.setTargetAtTime(params.masterFreeze ? 0.99 : 0.3, now, 0.02);
    }
  }

  public setStemVolume(stemId: string, vol: number): void {
    const chain = this.stemChains.get(stemId);
    if (chain && this.ctx) {
      chain.gainNode.gain.setTargetAtTime(Math.max(0, Math.min(1.2, vol)), this.ctx.currentTime, 0.02);
    }
  }

  public setStemMute(stemId: string, isMuted: boolean): void {
    const chain = this.stemChains.get(stemId);
    if (chain && this.ctx) {
      chain.gainNode.gain.setTargetAtTime(isMuted ? 0 : 0.8, this.ctx.currentTime, 0.02);
    }
  }

  // --- MODULATION MATRIX ENGINE (60 FPS) ---
  private startModulationEngine(): void {
    let phase = 0;
    const tick = () => {
      phase += 0.04;
      const bpmFactor = this.masterBpm / 120.0;

      // Update 4 slots
      const s1 = this.modSlots.get('SLOT_1');
      if (s1) {
        s1.currentValue = Math.sin(phase * s1.rateHz * bpmFactor) * s1.depth;
      }

      const s2 = this.modSlots.get('SLOT_2');
      if (s2) {
        // Triangle wave
        const p = (phase * s2.rateHz * bpmFactor) % (2 * Math.PI);
        const norm = p / (2 * Math.PI);
        s2.currentValue = (norm < 0.5 ? norm * 4 - 1 : 3 - norm * 4) * s2.depth;
      }

      const s3 = this.modSlots.get('SLOT_3');
      if (s3) {
        // Step sequencer step
        const stepIdx = Math.floor((phase * 2) % 16);
        s3.currentValue = ((s3.steps[stepIdx] || 0.5) * 2 - 1) * s3.depth;
      }

      const s4 = this.modSlots.get('SLOT_4');
      if (s4) {
        // Macro LFO
        s4.currentValue = Math.sin(phase * 0.2) * s4.depth;
      }

      // Notify matrix listeners
      const slotsArray = Array.from(this.modSlots.values());
      this.modMatrixListeners.forEach((fn) => fn(slotsArray));

      if (typeof window !== 'undefined') {
        requestAnimationFrame(tick);
      }
    };

    if (typeof window !== 'undefined') {
      requestAnimationFrame(tick);
    }
  }

  public getModSlots(): ModSlotConfig[] {
    return Array.from(this.modSlots.values());
  }

  public updateModSlot(id: ModSlotId, updates: Partial<ModSlotConfig>): void {
    const slot = this.modSlots.get(id);
    if (slot) {
      Object.assign(slot, updates);
    }
  }

  public onModMatrixUpdate(callback: (slots: ModSlotConfig[]) => void): () => void {
    this.modMatrixListeners.push(callback);
    return () => {
      this.modMatrixListeners = this.modMatrixListeners.filter((cb) => cb !== callback);
    };
  }

  public isExtClockSyncEnabled(): boolean {
    return this.extClockSyncEnabled;
  }

  public setExtClockSyncEnabled(enabled: boolean): void {
    this.extClockSyncEnabled = enabled;
    this.logMidi(`External Master Clock Sync: ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }

  public onExtClockBpm(callback: (bpm: number) => void): () => void {
    this.extClockBpmListeners.push(callback);
    return () => {
      this.extClockBpmListeners = this.extClockBpmListeners.filter((cb) => cb !== callback);
    };
  }

  private handleMidiClockTick(): void {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (this.lastClockTime > 0) {
      const delta = now - this.lastClockTime;
      // Valid tick interval for 40 BPM to 240 BPM (10.4ms to 62.5ms)
      if (delta > 8 && delta < 90) {
        this.clockTicks.push(delta);
        if (this.clockTicks.length > 24) {
          this.clockTicks.shift();
        }

        if (this.clockTicks.length >= 8) {
          const sum = this.clockTicks.reduce((a, b) => a + b, 0);
          const avgDelta = sum / this.clockTicks.length;
          const calculatedBpm = 60000 / (avgDelta * 24);

          if (calculatedBpm >= 60 && calculatedBpm <= 220) {
            const drift = Math.abs(this.masterBpm - calculatedBpm);
            if (drift > 0.05) {
              const targetBpm = drift < 1 ? this.masterBpm * 0.95 + calculatedBpm * 0.05 : calculatedBpm;
              this.extClockBpmListeners.forEach((fn) => fn(targetBpm));
              if (this.extClockSyncEnabled) {
                this.masterBpm = parseFloat(targetBpm.toFixed(1));
                if (this.isRunning && this.beatIntervalId) {
                  const stepMs = (60000 / this.masterBpm) / 4;
                  clearInterval(this.beatIntervalId);
                  this.beatIntervalId = window.setInterval(() => {
                    this.onSequencerTick();
                  }, stepMs);
                }
              }
            }
          }
        }
      }
    }
    this.lastClockTime = now;
  }

  private handleMidiClockStart(): void {
    this.logMidi('MIDI Master Clock: START signal received');
    if (this.extClockSyncEnabled) {
      this.startPlayback();
      this.dispatchReactiveHud({
        paramName: 'MIDI CLOCK',
        valueDisplay: 'PLAY/SYNC',
        modSymbol: '▲',
        modColor: '#00E5FF',
        timestamp: Date.now(),
      });
    }
  }

  private handleMidiClockStop(): void {
    this.logMidi('MIDI Master Clock: STOP signal received');
    if (this.extClockSyncEnabled) {
      this.stopPlayback();
      this.dispatchReactiveHud({
        paramName: 'MIDI CLOCK',
        valueDisplay: 'STOP',
        modSymbol: '●',
        modColor: '#FF1744',
        timestamp: Date.now(),
      });
    }
  }

  // --- REAKTIVES 2000ms HUD DISPATCHER ---
  public dispatchReactiveHud(event: ReactiveHudEvent): void {
    this.hudListeners.forEach((fn) => fn(event));
  }

  public onReactiveHud(callback: (event: ReactiveHudEvent) => void): () => void {
    this.hudListeners.push(callback);
    return () => {
      this.hudListeners = this.hudListeners.filter((cb) => cb !== callback);
    };
  }

  // --- MIDI ENGINE (Auto-detect & Learn) ---
  public setupWebMidi(): void {
    if (typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator) {
      navigator.requestMIDIAccess({ sysex: false })
        .then((access) => {
          this.logMidi('USB MIDI Subsystem Initialized. Scanning ports...');
          this.attachMidiInputs(access);
          access.onstatechange = (e) => {
            if (e.port && e.port.type === 'input') {
              this.logMidi(`MIDI Port ${e.port.name}: ${e.port.state}`);
              this.attachMidiInputs(access);
            }
          };
        })
        .catch((err) => {
          this.logMidi(`Web MIDI permission denied or unavailable: ${err}`);
        });
    }
  }

  private attachMidiInputs(access: MIDIAccess): void {
    const inputs = access.inputs.values();
    for (const input of inputs) {
      input.onmidimessage = (e) => this.handleMidiMessage(e);
      this.logMidi(`Armed controller: [${input.name || 'Generic USB MIDI'}]`);
    }
  }

  private handleMidiMessage(e: MIDIMessageEvent): void {
    const data = e.data;
    if (!data || data.length === 0) return;
    
    const status = data[0];

    // Single-byte Real-time messages (Timing Clock, Start, Stop)
    if (status === 0xF8) {
      this.handleMidiClockTick();
      return;
    }
    if (status === 0xFA) {
      this.handleMidiClockStart();
      return;
    }
    if (status === 0xFC) {
      this.handleMidiClockStop();
      return;
    }

    if (data.length < 3) return;
    const msgType = status & 0xf0;
    const ccOrNote = data[1];
    const val = data[2];

    if (msgType === 0xb0) {
      // CC message
      const normalized = val / 127;
      const mapping = this.midiMappings[ccOrNote];
      if (mapping) {
        this.dispatchReactiveHud({
          stemId: mapping.stemId,
          paramName: mapping.targetParam.toUpperCase(),
          valueDisplay: `${Math.round(normalized * 100)}%`,
          modSymbol: '▲',
          modColor: '#00E5FF',
          timestamp: Date.now(),
        });
      }
    }
  }

  public saveMidiMapping(cc: number, targetParam: string, stemId?: string): void {
    this.midiMappings[cc] = { targetParam, stemId };
    try {
      localStorage.setItem('stemsdings_midi_mappings', JSON.stringify(this.midiMappings));
    } catch {
      // ignore
    }
  }

  private loadMidiMappings(): void {
    try {
      const raw = localStorage.getItem('stemsdings_midi_mappings');
      if (raw) {
        this.midiMappings = JSON.parse(raw);
      }
    } catch {
      this.midiMappings = {
        16: { targetParam: 'filterCutoff' },
        17: { targetParam: 'granularSpray' },
        18: { targetParam: 'tapeSpeed' },
        19: { targetParam: 'colorDrive' },
        20: { targetParam: 'delayFeedback' },
      };
    }
  }

  public logMidi(msg: string): void {
    this.midiLogListeners.forEach((fn) => fn(msg));
  }

  public onMidiLog(callback: (log: string) => void): () => void {
    this.midiLogListeners.push(callback);
    return () => {
      this.midiLogListeners = this.midiLogListeners.filter((cb) => cb !== callback);
    };
  }

  // Stem Level Analysers for metering
  public getStemLevel(stemId: string): number {
    const chain = this.stemChains.get(stemId);
    if (!chain) return 0;
    const arr = new Uint8Array(chain.analyserNode.frequencyBinCount);
    chain.analyserNode.getByteFrequencyData(arr);
    let sum = 0;
    for (let i = 0; i < arr.length; i++) sum += arr[i];
    return Math.min(1.0, (sum / arr.length) / 128);
  }
}

export const torsoS4Engine = new TorsoS4Engine();
