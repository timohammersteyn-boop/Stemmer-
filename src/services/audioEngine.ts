/**
 * Schubertgrv - Realtime 4-Stem Web Audio Engine
 * Provides actual synthesizer & sampler playback for Drums, Bass, Music, and Vocal stems,
 * with real volume faders, mute/solo, 3-band EQ, filter cutoff, delay/reverb/drive FX,
 * and live level metering.
 */

import { StemId, FXState, LoopRecorderState, ChainFXConfig, FXChainPreset } from '../types';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private isRunning: boolean = false;
  private isMuted: boolean = false;
  private bpm: number = 128;
  private currentStep: number = 0;
  private nextNoteTime: number = 0;
  private timerId: number | null = null;
  private onStepCallback: ((step: number) => void) | null = null;

  // Auto-BPM Live Tempo Tracking Engine
  private autoBpmEnabled: boolean = true;
  private autoBpmCallback: ((bpm: number) => void) | null = null;
  private recentOnsets: number[] = [];
  private lastDetectedTempo: number = 128;
  private isBpmLockedState: boolean = true;

  // Master Key Lock (Pitch Lock) Engine: Preserves track's original pitch when adjusting BPM
  private isKeyLockEnabled: boolean = true;
  private baseBpm: number = 128;
  private keyShiftSemitones: number = 0; // -12 to +12 semitones transposition

  // Master Quantize Engine: Snaps triggers to nearest beat grid
  private isQuantizeEnabled: boolean = true;

  // Master Clip Detection Engine: Detects 0 dBFS overs & triggers 500ms red glow
  private lastClipTimestamp: number = 0;
  private isClippingDetected: boolean = false;

  // Global UI & Button Interaction Sounds
  private uiSoundsEnabled: boolean = true;

  // Master DJ Crossfader Engine (Deck A ⇄ Deck B blending)
  private crossfaderPosition: number = 0.0; // 0.0 = 100% Deck A, 1.0 = 100% Deck B
  private crossfaderCurve: 'SMOOTH' | 'LINEAR' | 'CUT' = 'SMOOTH';
  private deckAGain: GainNode | null = null;
  private deckBGain: GainNode | null = null;

  // Master Chain
  private masterGain: GainNode | null = null;
  private trackGainNode: GainNode | null = null;
  private gainCompensationDb: number = 0;
  private masterFilter: BiquadFilterNode | null = null;
  private masterEqLow: BiquadFilterNode | null = null;
  private masterEqMid: BiquadFilterNode | null = null;
  private masterEqHigh: BiquadFilterNode | null = null;
  private masterLimiter: DynamicsCompressorNode | null = null;
  private masterAnalyser: AnalyserNode | null = null;
  private masterMediaStreamDest: MediaStreamAudioDestinationNode | null = null;

  // Stems Chain
  private stemChains: Map<StemId, {
    gain: GainNode;
    filter: BiquadFilterNode;
    panner: StereoPannerNode;
    eqLow: BiquadFilterNode;
    eqMid: BiquadFilterNode;
    eqHigh: BiquadFilterNode;
    analyser: AnalyserNode;
  }> = new Map();

  // Deck B Stems Chain
  private deckBStemChains: Map<StemId, {
    gain: GainNode;
    filter: BiquadFilterNode;
    sendGain: GainNode;
    analyser: AnalyserNode;
  }> = new Map();

  // FX Chain
  private delayNode: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;
  private delayFilter: BiquadFilterNode | null = null;
  private fxSendGains: Map<StemId, GainNode> = new Map();
  private driveNode: WaveShaperNode | null = null;
  private driveGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;
  private chainFilterNode: BiquadFilterNode | null = null;
  private currentChainConfig: ChainFXConfig | null = null;

  // Master Loop Recorder Engine (Captures up to 4 bars as an independent playback layer)
  private isRecordingLoop: boolean = false;
  private isLoopPlaying: boolean = false;
  private loopTargetBars: 1 | 2 | 4 = 4;
  private loopRecordedBars: 1 | 2 | 4 = 4;
  private loopBuffer: AudioBuffer | null = null;
  private loopSourceNode: AudioBufferSourceNode | null = null;
  private loopGainNode: GainNode | null = null;
  private loopFilterNode: BiquadFilterNode | null = null;
  private loopVolume: number = 1.0;
  private loopIsMuted: boolean = false;
  private loopPlaybackRate: number = 1.0;
  private loopFilterCutoff: number = 100; // 0 - 100%
  private loopWaveform: number[] = [];
  private loopDuration: number = 0;
  private loopPlaybackStartTime: number = 0;
  private loopRecordingChunksLeft: Float32Array[] = [];
  private loopRecordingChunksRight: Float32Array[] = [];
  private loopRecordedSampleCount: number = 0;
  private loopTargetSampleCount: number = 0;
  private loopRecorderProcessor: ScriptProcessorNode | null = null;
  private loopRecorderDummyGain: GainNode | null = null;
  private loopStateListeners: Set<(state: LoopRecorderState) => void> = new Set();

  constructor() {
    // Lazy initialize on first interaction
  }

  public getAudioContext(): AudioContext {
    this.init();
    return this.ctx!;
  }

  private init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtx();

    // Master
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.9, this.ctx.currentTime);

    this.masterFilter = this.ctx.createBiquadFilter();
    this.masterFilter.type = 'lowpass';
    this.masterFilter.frequency.setValueAtTime(20000, this.ctx.currentTime);

    // Global Master EQ frequency shelves for sound shaping
    this.masterEqLow = this.ctx.createBiquadFilter();
    this.masterEqLow.type = 'lowshelf';
    this.masterEqLow.frequency.setValueAtTime(100, this.ctx.currentTime);
    this.masterEqLow.gain.setValueAtTime(0, this.ctx.currentTime);

    this.masterEqMid = this.ctx.createBiquadFilter();
    this.masterEqMid.type = 'peaking';
    this.masterEqMid.frequency.setValueAtTime(1200, this.ctx.currentTime);
    this.masterEqMid.Q.setValueAtTime(1.0, this.ctx.currentTime);
    this.masterEqMid.gain.setValueAtTime(0, this.ctx.currentTime);

    this.masterEqHigh = this.ctx.createBiquadFilter();
    this.masterEqHigh.type = 'highshelf';
    this.masterEqHigh.frequency.setValueAtTime(8000, this.ctx.currentTime);
    this.masterEqHigh.gain.setValueAtTime(0, this.ctx.currentTime);

    this.masterLimiter = this.ctx.createDynamicsCompressor();
    this.masterLimiter.threshold.setValueAtTime(-1.0, this.ctx.currentTime);
    this.masterLimiter.knee.setValueAtTime(4, this.ctx.currentTime);
    this.masterLimiter.ratio.setValueAtTime(12, this.ctx.currentTime);
    this.masterLimiter.attack.setValueAtTime(0.003, this.ctx.currentTime);
    this.masterLimiter.release.setValueAtTime(0.1, this.ctx.currentTime);

    this.masterAnalyser = this.ctx.createAnalyser();
    this.masterAnalyser.fftSize = 128; // 64 frequency bins for real-time spectral analyzer
    this.masterAnalyser.smoothingTimeConstant = 0.8;

    // Track Gain Compensation node
    this.trackGainNode = this.ctx.createGain();
    const linearGain = Math.max(0.01, Math.min(4.0, Math.pow(10, this.gainCompensationDb / 20)));
    this.trackGainNode.gain.setValueAtTime(linearGain, this.ctx.currentTime);

    // Routing: Filter -> Master EQ Low -> Master EQ Mid -> Master EQ High -> Track Gain Compensation -> Master Gain -> Limiter -> Analyser -> Output
    this.masterFilter.connect(this.masterEqLow);
    this.masterEqLow.connect(this.masterEqMid);
    this.masterEqMid.connect(this.masterEqHigh);
    this.masterEqHigh.connect(this.trackGainNode);
    this.trackGainNode.connect(this.masterGain);
    this.masterGain.connect(this.masterLimiter);
    this.masterLimiter.connect(this.masterAnalyser);
    this.masterAnalyser.connect(this.ctx.destination);

    // Delay FX Send bus
    this.delayNode = this.ctx.createDelay(2.0);
    this.delayNode.delayTime.setValueAtTime((60 / this.bpm) * 0.75, this.ctx.currentTime);
    this.delayFeedback = this.ctx.createGain();
    this.delayFeedback.gain.setValueAtTime(0.35, this.ctx.currentTime);
    this.delayFilter = this.ctx.createBiquadFilter();
    this.delayFilter.type = 'bandpass';
    this.delayFilter.frequency.setValueAtTime(1200, this.ctx.currentTime);

    this.delayNode.connect(this.delayFilter);
    this.delayFilter.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);
    this.delayFilter.connect(this.masterGain);

    // Reverb FX Send bus with synthetic impulse response
    try {
      this.reverbNode = this.ctx.createConvolver();
      const impulse = this.buildImpulseResponse(2.2, 2.5);
      if (impulse) this.reverbNode.buffer = impulse;
      this.reverbGain = this.ctx.createGain();
      this.reverbGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
      this.reverbNode.connect(this.reverbGain);
      this.reverbGain.connect(this.masterGain);
    } catch (e) {
      console.warn('Reverb init error', e);
    }

    // Drive / Overdrive saturation bus
    try {
      this.driveNode = this.ctx.createWaveShaper();
      this.driveNode.curve = this.makeDistortionCurve(50);
      this.driveNode.oversample = '4x';
      this.driveGain = this.ctx.createGain();
      this.driveGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
      this.driveNode.connect(this.driveGain);
      this.driveGain.connect(this.masterGain);
    } catch (e) {
      console.warn('Drive init error', e);
    }

    // Dedicated Chain FX Filter Node for daisy-chained routing
    try {
      this.chainFilterNode = this.ctx.createBiquadFilter();
      this.chainFilterNode.type = 'lowpass';
      this.chainFilterNode.frequency.setValueAtTime(20000, this.ctx.currentTime);
    } catch (e) {
      console.warn('Chain filter init error', e);
    }

    // Master Crossfader Sub-Buses: Deck A & Deck B
    this.deckAGain = this.ctx.createGain();
    this.deckBGain = this.ctx.createGain();
    const initialAGain = Math.cos(this.crossfaderPosition * 0.5 * Math.PI);
    const initialBGain = Math.sin(this.crossfaderPosition * 0.5 * Math.PI);
    this.deckAGain.gain.setValueAtTime(initialAGain, this.ctx.currentTime);
    this.deckBGain.gain.setValueAtTime(initialBGain, this.ctx.currentTime);
    this.deckAGain.connect(this.masterFilter);
    this.deckBGain.connect(this.masterFilter);

    // Master Loop Recorder: Return Bus (Independent Playback Layer)
    this.loopGainNode = this.ctx.createGain();
    this.loopGainNode.gain.setValueAtTime(this.loopIsMuted ? 0 : this.loopVolume, this.ctx.currentTime);
    this.loopFilterNode = this.ctx.createBiquadFilter();
    this.loopFilterNode.type = 'lowpass';
    this.loopFilterNode.frequency.setValueAtTime(20000, this.ctx.currentTime);
    this.loopGainNode.connect(this.loopFilterNode);
    this.loopFilterNode.connect(this.masterLimiter);

    // Master Loop Recorder: Audio Processing tap capturing master audio
    try {
      this.loopRecorderProcessor = this.ctx.createScriptProcessor(4096, 2, 2);
      this.loopRecorderDummyGain = this.ctx.createGain();
      this.loopRecorderDummyGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.masterLimiter.connect(this.loopRecorderProcessor);
      this.loopRecorderProcessor.connect(this.loopRecorderDummyGain);
      this.loopRecorderDummyGain.connect(this.ctx.destination);

      this.loopRecorderProcessor.onaudioprocess = (e) => {
        if (!this.isRecordingLoop) return;
        const leftInput = e.inputBuffer.getChannelData(0);
        const rightInput = e.inputBuffer.getChannelData(1);
        this.handleRecordedAudioChunk(leftInput, rightInput);
      };
    } catch (e) {
      console.warn('ScriptProcessor tap error', e);
    }

    // Stems setup
    const stems: StemId[] = ['drums', 'bass', 'music', 'vocal'];
    stems.forEach((id) => {
      if (!this.ctx || !this.masterGain) return;

      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'allpass'; // Default flat

      const eqLow = this.ctx.createBiquadFilter();
      eqLow.type = 'lowshelf';
      eqLow.frequency.setValueAtTime(120, this.ctx.currentTime);

      const eqMid = this.ctx.createBiquadFilter();
      eqMid.type = 'peaking';
      eqMid.frequency.setValueAtTime(1200, this.ctx.currentTime);
      eqMid.Q.setValueAtTime(1.0, this.ctx.currentTime);

      const eqHigh = this.ctx.createBiquadFilter();
      eqHigh.type = 'highshelf';
      eqHigh.frequency.setValueAtTime(8000, this.ctx.currentTime);

      const panner = this.ctx.createStereoPanner();
      const analyser = this.ctx.createAnalyser();
      analyser.fftSize = 64;

      // Stem routing: Chain -> Gain -> EQ Low -> EQ Mid -> EQ High -> Filter -> Panner -> Analyser -> Deck A Crossfader Bus
      filter.connect(eqLow);
      eqLow.connect(eqMid);
      eqMid.connect(eqHigh);
      eqHigh.connect(gain);
      gain.connect(panner);
      panner.connect(analyser);
      if (this.deckAGain) {
        analyser.connect(this.deckAGain);
      } else if (this.masterFilter) {
        analyser.connect(this.masterFilter);
      }

      // FX Send
      const sendGain = this.ctx.createGain();
      sendGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.connect(sendGain);
      if (this.delayNode) {
        sendGain.connect(this.delayNode);
      }
      if (this.reverbNode) {
        sendGain.connect(this.reverbNode);
      }
      if (this.driveNode) {
        sendGain.connect(this.driveNode);
      }
      this.fxSendGains.set(id, sendGain);

      this.stemChains.set(id, {
        gain,
        filter,
        panner,
        eqLow,
        eqMid,
        eqHigh,
        analyser,
      });
    });

    // Deck B Stems setup
    stems.forEach((id) => {
      if (!this.ctx || !this.deckBGain) return;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'allpass';
      const analyser = this.ctx.createAnalyser();
      analyser.fftSize = 64;

      filter.connect(gain);
      gain.connect(analyser);
      analyser.connect(this.deckBGain);

      const sendGain = this.ctx.createGain();
      sendGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
      gain.connect(sendGain);
      if (this.delayNode) sendGain.connect(this.delayNode);
      if (this.reverbNode) sendGain.connect(this.reverbNode);
      if (this.driveNode) sendGain.connect(this.driveNode);

      this.deckBStemChains.set(id, { gain, filter, sendGain, analyser });
    });
  }

  public async resume(): Promise<void> {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public setBpm(newBpm: number) {
    this.bpm = Math.max(60, Math.min(180, newBpm));
    if (this.delayNode && this.ctx) {
      this.delayNode.delayTime.setValueAtTime((60 / this.bpm) * 0.75, this.ctx.currentTime);
    }
  }

  public setAutoBpmEnabled(enabled: boolean) {
    this.autoBpmEnabled = enabled;
  }

  public isAutoBpmEnabled(): boolean {
    return this.autoBpmEnabled;
  }

  public onAutoBpmDetected(cb: (bpm: number) => void) {
    this.autoBpmCallback = cb;
  }

  public getDetectedTempo(): number {
    return this.lastDetectedTempo;
  }

  public isBpmLocked(): boolean {
    return this.isBpmLockedState;
  }

  public triggerAutoBpmSync(targetBpm: number) {
    const clamped = Math.max(60, Math.min(180, Math.round(targetBpm * 10) / 10));
    this.bpm = clamped;
    this.lastDetectedTempo = clamped;
    this.isBpmLockedState = true;
    if (this.delayNode && this.ctx) {
      this.delayNode.delayTime.setValueAtTime((60 / this.bpm) * 0.75, this.ctx.currentTime);
    }
    if (this.autoBpmCallback) {
      this.autoBpmCallback(clamped);
    }
  }

  // --- Master Key Lock (Pitch Lock) Controls ---
  public setKeyLock(enabled: boolean) {
    this.isKeyLockEnabled = enabled;
  }

  public isKeyLock(): boolean {
    return this.isKeyLockEnabled;
  }

  public setBaseBpm(base: number) {
    this.baseBpm = Math.max(40, Math.min(240, base));
  }

  public getBaseBpm(): number {
    return this.baseBpm;
  }

  // --- Master Key Shift (Semi-Tone Pitch Transposition -12 to +12) ---
  public setKeyShift(semitones: number) {
    this.keyShiftSemitones = Math.max(-12, Math.min(12, Math.round(semitones)));
  }

  public getKeyShift(): number {
    return this.keyShiftSemitones;
  }

  // --- Quantize Beat-Snap Controls ---
  public setQuantize(enabled: boolean) {
    this.isQuantizeEnabled = enabled;
  }

  public isQuantize(): boolean {
    return this.isQuantizeEnabled;
  }

  public setOnStepListener(cb: (step: number) => void) {
    this.onStepCallback = cb;
  }

  public start() {
    this.resume();
    if (this.isRunning) return;
    this.isRunning = true;
    if (this.ctx) {
      this.nextNoteTime = this.ctx.currentTime + 0.05;
    }
    this.scheduler();
  }

  public stop() {
    this.isRunning = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.currentStep = 0;
  }

  public pause() {
    this.isRunning = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  private scheduler = () => {
    if (!this.isRunning || !this.ctx) return;

    const lookAhead = 0.1; // seconds
    const scheduleAheadTime = 0.2;

    while (this.nextNoteTime < this.ctx.currentTime + scheduleAheadTime) {
      this.scheduleStep(this.currentStep, this.nextNoteTime);
      this.advanceStep();
    }

    this.timerId = window.setTimeout(this.scheduler, lookAhead * 1000);
  };

  private advanceStep() {
    const secondsPerBeat = 60.0 / this.bpm;
    const secondsPer16th = 0.25 * secondsPerBeat;
    this.nextNoteTime += secondsPer16th;
    this.currentStep = (this.currentStep + 1) % 16;
    if (this.onStepCallback) {
      this.onStepCallback(this.currentStep);
    }
  }

  private scheduleStep(step: number, time: number) {
    if (!this.ctx) return;

    // 1. DRUMS (4/4 punch kick on 0, 4, 8, 12; Clap on 4, 12; Hat on 2, 6, 10, 14, 16th hats)
    this.playDrumsStep(step, time);

    // 2. BASS (Groovy rolling sub-bassline in F minor / 8A)
    this.playBassStep(step, time);

    // 3. MUSIC (Tech house chord stab on offbeats / syncopations)
    this.playMusicStep(step, time);

    // 4. VOCAL (Formant chops on steps 3, 7, 11, 15)
    this.playVocalStep(step, time);

    // 5. DECK B (Secondary Deck Groove Synthesis blended by Crossfader)
    this.playDeckBStep(step, time);
  }

  // --- Stem 1: DRUMS SYNTHESIS ---
  private playDrumsStep(step: number, time: number) {
    if (!this.ctx) return;
    const chain = this.stemChains.get('drums');
    if (!chain) return;

    // Kick on 0, 4, 8, 12
    if (step % 4 === 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(38, time + 0.08);

      gain.gain.setValueAtTime(1.0, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.32);

      osc.connect(gain);
      gain.connect(chain.filter);
      osc.start(time);
      osc.stop(time + 0.33);

      // Transient click
      const click = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      click.type = 'triangle';
      click.frequency.setValueAtTime(800, time);
      clickGain.gain.setValueAtTime(0.4, time);
      clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
      click.connect(clickGain);
      clickGain.connect(chain.filter);
      click.start(time);
      click.stop(time + 0.025);
    }

    // Snare / Clap on 4 and 12
    if (step === 4 || step === 12) {
      this.playWhiteNoiseBurst(time, 0.18, 1200, chain.filter, 0.7);
    }

    // Closed Hat on 2, 6, 10, 14 & Open Hat on offbeats
    if (step % 2 === 0) {
      const isOpen = (step % 4 === 2);
      this.playHiHat(time, isOpen ? 0.22 : 0.05, chain.filter, isOpen ? 0.45 : 0.25);
    }
  }

  // --- Stem 2: BASS SYNTHESIS ---
  private playBassStep(step: number, time: number) {
    if (!this.ctx) return;
    const chain = this.stemChains.get('bass');
    if (!chain) return;

    // Key Lock (Pitch Lock): If Key Lock is active, multiplier is 1.0 (original pitch locked).
    // If Key Lock is OFF, pitch scales proportionally to tempo (vinyl varispeed).
    // Key Shift applies chromatic semitone transposition (-12 to +12 semitones).
    const keyShiftRatio = Math.pow(2, this.keyShiftSemitones / 12);
    const pitchRatio = (this.isKeyLockEnabled ? 1.0 : (this.bpm / this.baseBpm)) * keyShiftRatio;

    // Bass notes in F minor (F1=43.65Hz, Ab1=51.9Hz, Bb1=58.27Hz, C2=65.4Hz)
    const pattern = [43.65, 0, 43.65, 43.65, 0, 51.9, 0, 43.65, 58.27, 0, 43.65, 51.9, 0, 43.65, 65.4, 51.9];
    const freq = pattern[step];
    if (freq > 0) {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(freq * pitchRatio, time);
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(freq * 0.5 * pitchRatio, time); // Sub-octave

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, time);
      filter.frequency.exponentialRampToValueAtTime(110, time + 0.15);
      filter.Q.setValueAtTime(3.0, time);

      gain.gain.setValueAtTime(0.7, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(chain.filter);

      osc1.start(time);
      osc2.start(time);
      osc1.stop(time + 0.2);
      osc2.stop(time + 0.2);
    }
  }

  // --- Stem 3: MUSIC SYNTHESIS ---
  private playMusicStep(step: number, time: number) {
    if (!this.ctx) return;
    const chain = this.stemChains.get('music');
    if (!chain) return;

    const keyShiftRatio = Math.pow(2, this.keyShiftSemitones / 12);
    const pitchRatio = (this.isKeyLockEnabled ? 1.0 : (this.bpm / this.baseBpm)) * keyShiftRatio;

    // Tech house minor chords on steps 2, 6, 8, 14
    if (step === 2 || step === 6 || step === 8 || step === 14) {
      // Fm7: F3 (174.61), Ab3 (207.65), C4 (261.63), Eb4 (311.13)
      const freqs = [174.61, 207.65, 261.63, 311.13];
      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filt = this.ctx.createBiquadFilter();

        osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq * pitchRatio, time);

        filt.type = 'bandpass';
        filt.frequency.setValueAtTime(1800, time);
        filt.frequency.exponentialRampToValueAtTime(600, time + 0.22);
        filt.Q.setValueAtTime(2.0, time);

        gain.gain.setValueAtTime(0.25, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

        osc.connect(filt);
        filt.connect(gain);
        gain.connect(chain.filter);

        osc.start(time);
        osc.stop(time + 0.26);
      });
    }
  }

  // --- Stem 4: VOCAL SYNTHESIS ---
  private playVocalStep(step: number, time: number) {
    if (!this.ctx) return;
    const chain = this.stemChains.get('vocal');
    if (!chain) return;

    const keyShiftRatio = Math.pow(2, this.keyShiftSemitones / 12);
    const pitchRatio = (this.isKeyLockEnabled ? 1.0 : (this.bpm / this.baseBpm)) * keyShiftRatio;

    // Formant vocal chops on steps 3, 11
    if (step === 3 || step === 11) {
      const osc = this.ctx.createOscillator();
      const formantA = this.ctx.createBiquadFilter();
      const formantB = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      const rootPitch = (step === 3 ? 220 : 261.63) * pitchRatio; // A3 or C4
      osc.frequency.setValueAtTime(rootPitch, time);
      osc.frequency.linearRampToValueAtTime(rootPitch * 0.95, time + 0.16);

      // Formants for "Ah" / "Oh"
      formantA.type = 'bandpass';
      formantA.frequency.setValueAtTime(800, time);
      formantA.Q.setValueAtTime(5.0, time);

      formantB.type = 'bandpass';
      formantB.frequency.setValueAtTime(1200, time);
      formantB.Q.setValueAtTime(4.0, time);

      gain.gain.setValueAtTime(0.4, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

      osc.connect(formantA);
      osc.connect(formantB);
      formantA.connect(gain);
      formantB.connect(gain);
      gain.connect(chain.filter);

      osc.start(time);
      osc.stop(time + 0.2);
    }
  }

  // --- Deck B: Secondary Deck Groove Synthesis (Blended via Crossfader) ---
  private playDeckBStep(step: number, time: number) {
    if (!this.ctx || !this.deckBGain) return;
    // Save CPU if crossfader is fully turned towards Deck A
    if (this.crossfaderPosition <= 0.02) return;

    const drumsDest = this.deckBStemChains.get('drums')?.filter || this.deckBGain;
    const bassDest = this.deckBStemChains.get('bass')?.filter || this.deckBGain;
    const musicDest = this.deckBStemChains.get('music')?.filter || this.deckBGain;

    // Deck B 4/4 Punch Kick (on 0, 4, 8, 12)
    if (step % 4 === 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(165, time);
      osc.frequency.exponentialRampToValueAtTime(46, time + 0.08);

      gain.gain.setValueAtTime(0.9, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.26);

      osc.connect(gain);
      gain.connect(drumsDest);
      osc.start(time);
      osc.stop(time + 0.27);
    }

    // Deck B Crisp Percussion / Hats (on 2, 6, 10, 14)
    if (step % 4 === 2) {
      this.playWhiteNoiseBurst(time, 0.06, 7000, drumsDest, 0.35);
    }

    // Deck B Deep Synth Bassline (Driving techno bass pulse in C minor / 5A)
    if (step % 2 === 0) {
      const pitchRatio = this.isKeyLockEnabled ? 1.0 : (this.bpm / this.baseBpm);
      const notes = [65.41, 65.41, 77.78, 65.41, 87.31, 77.78, 65.41, 98.00];
      const noteFreq = notes[(step / 2) % notes.length] * pitchRatio;

      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(noteFreq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(480, time);
      filter.Q.setValueAtTime(2.0, time);

      gain.gain.setValueAtTime(0.4, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(bassDest);

      osc.start(time);
      osc.stop(time + 0.17);
    }

    // Deck B Melodic Synth Chords (Steps 4 & 12)
    if (step % 8 === 4) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(261.63, time);
      gain.gain.setValueAtTime(0.2, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
      osc.connect(gain);
      gain.connect(musicDest);
      osc.start(time);
      osc.stop(time + 0.36);
    }
  }

  private playWhiteNoiseBurst(time: number, duration: number, bandFreq: number, dest: AudioNode, level: number) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(bandFreq, time);
    filter.Q.setValueAtTime(1.5, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(level, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    whiteNoise.start(time);
    whiteNoise.stop(time + duration);
  }

  private playHiHat(time: number, duration: number, dest: AudioNode, level: number) {
    if (!this.ctx) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(level, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    noise.start(time);
    noise.stop(time + duration);
  }

  // --- Real-Time Controls ---
  public setStemVolume(stemId: StemId, vol: number) {
    const chain = this.stemChains.get(stemId);
    if (chain && this.ctx) {
      // logarithmic volume
      const actualGain = Math.max(0, Math.min(1.2, vol));
      chain.gain.gain.setTargetAtTime(actualGain, this.ctx.currentTime, 0.02);
    }
  }

  public setStemMute(stemId: StemId, isMuted: boolean) {
    const chain = this.stemChains.get(stemId);
    if (chain && this.ctx) {
      chain.gain.gain.setTargetAtTime(isMuted ? 0 : 0.8, this.ctx.currentTime, 0.02);
    }
  }

  public setStemFilter(stemId: StemId, filterNorm: number) {
    // filterNorm: 0.0 (high lowpass cut) -> 0.5 (neutral/bypass) -> 1.0 (highpass cut)
    const chain = this.stemChains.get(stemId);
    if (chain && this.ctx) {
      if (filterNorm < 0.48) {
        // Lowpass
        chain.filter.type = 'lowpass';
        const freq = 200 + Math.pow(filterNorm / 0.48, 2) * 19000;
        chain.filter.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.02);
      } else if (filterNorm > 0.52) {
        // Highpass
        chain.filter.type = 'highpass';
        const freq = 20 + Math.pow((filterNorm - 0.52) / 0.48, 2) * 8000;
        chain.filter.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.02);
      } else {
        // Flat bypass
        chain.filter.type = 'allpass';
      }
    }
  }

  public setStemEQ(stemId: StemId, eq: { low: number; mid: number; high: number }) {
    const chain = this.stemChains.get(stemId);
    if (chain && this.ctx) {
      chain.eqLow.gain.setTargetAtTime(eq.low, this.ctx.currentTime, 0.03);
      chain.eqMid.gain.setTargetAtTime(eq.mid, this.ctx.currentTime, 0.03);
      chain.eqHigh.gain.setTargetAtTime(eq.high, this.ctx.currentTime, 0.03);
    }
  }

  public setMasterEQ(eq: { low: number; mid: number; high: number }) {
    if (!this.ctx) return;
    if (this.masterEqLow) {
      this.masterEqLow.gain.setTargetAtTime(eq.low, this.ctx.currentTime, 0.03);
    }
    if (this.masterEqMid) {
      this.masterEqMid.gain.setTargetAtTime(eq.mid, this.ctx.currentTime, 0.03);
    }
    if (this.masterEqHigh) {
      this.masterEqHigh.gain.setTargetAtTime(eq.high, this.ctx.currentTime, 0.03);
    }
  }

  public setStemSend(stemId: StemId, sendAmount: number) {
    const sendGain = this.fxSendGains.get(stemId);
    if (sendGain && this.ctx) {
      sendGain.gain.setTargetAtTime(sendAmount, this.ctx.currentTime, 0.02);
    }
  }

  // --- Real-Time Controls for Deck B Stems ---
  public setDeckBStemVolume(stemId: StemId, vol: number) {
    const chain = this.deckBStemChains.get(stemId);
    if (chain && this.ctx) {
      const actualGain = Math.max(0, Math.min(1.2, vol));
      chain.gain.gain.setTargetAtTime(actualGain, this.ctx.currentTime, 0.02);
    }
  }

  public setDeckBStemMute(stemId: StemId, isMuted: boolean) {
    const chain = this.deckBStemChains.get(stemId);
    if (chain && this.ctx) {
      chain.gain.gain.setTargetAtTime(isMuted ? 0 : 0.8, this.ctx.currentTime, 0.02);
    }
  }

  public setDeckBStemFilter(stemId: StemId, filterNorm: number) {
    const chain = this.deckBStemChains.get(stemId);
    if (chain && this.ctx) {
      if (filterNorm < 0.48) {
        chain.filter.type = 'lowpass';
        const freq = 200 + Math.pow(filterNorm / 0.48, 2) * 19000;
        chain.filter.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.02);
        chain.filter.Q.setTargetAtTime(1.5, this.ctx.currentTime, 0.02);
      } else if (filterNorm > 0.52) {
        chain.filter.type = 'highpass';
        const freq = 20 + Math.pow((filterNorm - 0.52) / 0.48, 2) * 9000;
        chain.filter.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.02);
        chain.filter.Q.setTargetAtTime(1.5, this.ctx.currentTime, 0.02);
      } else {
        chain.filter.type = 'allpass';
      }
    }
  }

  public setDeckBStemSend(stemId: StemId, sendAmount: number) {
    const chain = this.deckBStemChains.get(stemId);
    if (chain && this.ctx) {
      chain.sendGain.gain.setTargetAtTime(sendAmount, this.ctx.currentTime, 0.02);
    }
  }

  public getDeckBLevels(): { drums: number; bass: number; music: number; vocal: number } {
    const readAnalyser = (analyser?: AnalyserNode | null): number => {
      if (!analyser) return 0;
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i];
      return Math.min(1.0, (sum / data.length / 255) * 1.8);
    };
    return {
      drums: readAnalyser(this.deckBStemChains.get('drums')?.analyser),
      bass: readAnalyser(this.deckBStemChains.get('bass')?.analyser),
      music: readAnalyser(this.deckBStemChains.get('music')?.analyser),
      vocal: readAnalyser(this.deckBStemChains.get('vocal')?.analyser),
    };
  }

  private buildImpulseResponse(duration: number, decay: number): AudioBuffer | null {
    if (!this.ctx) return null;
    const sampleRate = this.ctx.sampleRate;
    const length = Math.max(1, Math.floor(sampleRate * duration));
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);
    for (let i = 0; i < length; i++) {
      const t = i / length;
      const factor = Math.exp(-t * decay);
      left[i] = (Math.random() * 2 - 1) * factor;
      right[i] = (Math.random() * 2 - 1) * factor;
    }
    return impulse;
  }

  private makeDistortionCurve(amount: number): Float32Array<ArrayBuffer> {
    const k = Math.max(1, typeof amount === 'number' ? amount : 50);
    const n_samples = 44100;
    const buffer = new ArrayBuffer(n_samples * Float32Array.BYTES_PER_ELEMENT);
    const curve = new Float32Array(buffer);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  public setFX(fx: FXState) {
    if (!this.ctx || !this.masterFilter) return;

    // Check if Chain FX mode is enabled
    if (fx.chainMode && fx.chainFX?.enabled) {
      this.currentChainConfig = fx.chainFX;
      const chain = fx.chainFX;
      const mixRatio = Math.max(0, Math.min(1, chain.mix / 100));

      // Configure Stage 1 effect
      this.applySingleEffectSettings(chain.fx1.type, {
        type: chain.fx1.type,
        filterMode: chain.fx1.filterMode,
        amount: chain.fx1.amount,
        secondaryParam: chain.fx1.secondaryParam,
        timeDivision: chain.fx1.timeDivision || '1/4',
        sync: true,
        active: true,
        targetStem: chain.targetStem,
      }, mixRatio * 0.9);

      // Configure Stage 2 effect
      this.applySingleEffectSettings(chain.fx2.type, {
        type: chain.fx2.type,
        filterMode: chain.fx2.filterMode,
        amount: chain.fx2.amount,
        secondaryParam: chain.fx2.secondaryParam,
        timeDivision: chain.fx2.timeDivision || '1/4',
        sync: true,
        active: true,
        targetStem: chain.targetStem,
      }, mixRatio);

      // Route stem send levels: Focus on target stem
      if (chain.targetStem !== 'ALL') {
        this.fxSendGains.forEach((gainNode, id) => {
          const targetGain = id === chain.targetStem ? mixRatio * 0.8 : 0.05;
          gainNode.gain.setTargetAtTime(targetGain, this.ctx!.currentTime, 0.02);
        });
      } else {
        this.fxSendGains.forEach((gainNode) => {
          gainNode.gain.setTargetAtTime(mixRatio * 0.6, this.ctx!.currentTime, 0.02);
        });
      }
      return;
    }

    // Standard Single FX Mode
    this.currentChainConfig = null;
    this.applySingleEffectSettings(fx.type, fx, fx.amount / 100);

    // Stem target routing
    if (fx.targetStem !== 'ALL') {
      this.fxSendGains.forEach((gainNode, id) => {
        const targetGain = id === fx.targetStem ? Math.max(0.2, fx.amount / 100) : 0.05;
        gainNode.gain.setTargetAtTime(targetGain, this.ctx!.currentTime, 0.02);
      });
    } else {
      this.fxSendGains.forEach((gainNode) => {
        gainNode.gain.setTargetAtTime(Math.max(0.1, fx.amount / 100 * 0.5), this.ctx!.currentTime, 0.02);
      });
    }
  }

  public applyFXChainPreset(preset: FXChainPreset) {
    if (!this.ctx || !this.masterFilter) return;
    const now = this.ctx.currentTime;
    const mixRatio = Math.max(0, Math.min(1, preset.mix / 100));

    // 1. Configure Master / Stem Filter
    const filterCutoff = preset.filter.cutoff;
    const res = 0.707 + (preset.filter.resonance / 100) * 12;
    const mode = preset.filter.mode || 'LOWPASS';

    if (mode === 'LOWPASS') {
      this.masterFilter.type = 'lowpass';
      const minF = 60;
      const maxF = 20000;
      const cutoff = minF * Math.pow(maxF / minF, Math.max(0.01, filterCutoff / 100));
      this.masterFilter.frequency.setTargetAtTime(cutoff, now, 0.02);
      this.masterFilter.Q.setTargetAtTime(res, now, 0.02);
    } else if (mode === 'HIGHPASS') {
      this.masterFilter.type = 'highpass';
      const minF = 20;
      const maxF = 12000;
      const cutoff = minF * Math.pow(maxF / minF, Math.max(0.01, filterCutoff / 100));
      this.masterFilter.frequency.setTargetAtTime(cutoff, now, 0.02);
      this.masterFilter.Q.setTargetAtTime(res, now, 0.02);
    } else {
      if (filterCutoff < 48) {
        this.masterFilter.type = 'lowpass';
        const norm = filterCutoff / 48;
        const cutoff = 80 * Math.pow(20000 / 80, Math.max(0.01, norm));
        this.masterFilter.frequency.setTargetAtTime(cutoff, now, 0.02);
        this.masterFilter.Q.setTargetAtTime(res, now, 0.02);
      } else if (filterCutoff > 52) {
        this.masterFilter.type = 'highpass';
        const norm = (filterCutoff - 52) / 48;
        const cutoff = 20 * Math.pow(10000 / 20, Math.max(0.01, norm));
        this.masterFilter.frequency.setTargetAtTime(cutoff, now, 0.02);
        this.masterFilter.Q.setTargetAtTime(res, now, 0.02);
      } else {
        this.masterFilter.type = 'allpass';
        this.masterFilter.frequency.setTargetAtTime(1000, now, 0.02);
      }
    }

    // 2. Configure Delay
    if (this.delayFeedback && this.delayNode) {
      const feedback = (preset.delay.feedback / 100) * 0.85;
      this.delayFeedback.gain.setTargetAtTime(feedback, now, 0.02);
      const divisions: Record<string, number> = { '1/8': 0.5, '1/4': 1.0, '1/2': 2.0, '1': 4.0 };
      const beatMult = divisions[preset.delay.timeDivision || '1/4'] || 1.0;
      const delayTime = ((60 / this.bpm) * 0.5) * beatMult;
      this.delayNode.delayTime.setTargetAtTime(delayTime, now, 0.02);
    }

    // 3. Configure Reverb
    if (this.reverbGain) {
      const gainVal = (preset.reverb.roomSize / 100) * 0.85 * mixRatio;
      this.reverbGain.gain.setTargetAtTime(gainVal, now, 0.02);
    }

    // 4. Configure Drive
    if (this.driveGain && this.driveNode && preset.drive?.enabled) {
      const driveGainVal = (preset.drive.amount / 100) * 0.65 * mixRatio;
      this.driveGain.gain.setTargetAtTime(driveGainVal, now, 0.02);
      this.driveNode.curve = this.makeDistortionCurve(preset.drive.tone * 2.5);
    }

    // 5. Route Stem Sends
    if (preset.targetStem !== 'ALL') {
      this.fxSendGains.forEach((gainNode, id) => {
        const targetGain = id === preset.targetStem ? Math.max(0.3, mixRatio * 0.85) : 0.05;
        gainNode.gain.setTargetAtTime(targetGain, now, 0.02);
      });
    } else {
      this.fxSendGains.forEach((gainNode) => {
        gainNode.gain.setTargetAtTime(mixRatio * 0.65, now, 0.02);
      });
    }

    // 6. Update current chain config representation
    this.currentChainConfig = {
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
  }

  private applySingleEffectSettings(type: string, fx: Partial<FXState>, wetAmount: number) {
    if (!this.ctx || !this.masterFilter) return;
    const now = this.ctx.currentTime;
    const amount = fx.amount ?? 50;
    const secondary = fx.secondaryParam ?? 30;

    if (type === 'FILTER') {
      const mode = fx.filterMode || 'LOWPASS';
      const res = 0.707 + (secondary / 100) * 12;

      if (mode === 'LOWPASS') {
        this.masterFilter.type = 'lowpass';
        const minF = 60;
        const maxF = 20000;
        const cutoff = minF * Math.pow(maxF / minF, Math.max(0.01, amount / 100));
        this.masterFilter.frequency.setTargetAtTime(cutoff, now, 0.02);
        this.masterFilter.Q.setTargetAtTime(res, now, 0.02);
      } else if (mode === 'HIGHPASS') {
        this.masterFilter.type = 'highpass';
        const minF = 20;
        const maxF = 12000;
        const cutoff = minF * Math.pow(maxF / minF, Math.max(0.01, amount / 100));
        this.masterFilter.frequency.setTargetAtTime(cutoff, now, 0.02);
        this.masterFilter.Q.setTargetAtTime(res, now, 0.02);
      } else {
        if (amount < 48) {
          this.masterFilter.type = 'lowpass';
          const norm = amount / 48;
          const cutoff = 80 * Math.pow(20000 / 80, Math.max(0.01, norm));
          this.masterFilter.frequency.setTargetAtTime(cutoff, now, 0.02);
          this.masterFilter.Q.setTargetAtTime(res, now, 0.02);
        } else if (amount > 52) {
          this.masterFilter.type = 'highpass';
          const norm = (amount - 52) / 48;
          const cutoff = 20 * Math.pow(10000 / 20, Math.max(0.01, norm));
          this.masterFilter.frequency.setTargetAtTime(cutoff, now, 0.02);
          this.masterFilter.Q.setTargetAtTime(res, now, 0.02);
        } else {
          this.masterFilter.type = 'allpass';
          this.masterFilter.frequency.setTargetAtTime(1000, now, 0.02);
        }
      }
    } else if (type === 'DELAY') {
      if (this.delayFeedback && this.delayNode) {
        const feedback = (secondary / 100) * 0.85;
        this.delayFeedback.gain.setTargetAtTime(feedback, now, 0.02);
        const divisions: Record<string, number> = { '1/8': 0.5, '1/4': 1.0, '1/2': 2.0, '1': 4.0 };
        const beatMult = divisions[fx.timeDivision || '1/4'] || 1.0;
        const delayTime = ((60 / this.bpm) * 0.5) * beatMult;
        this.delayNode.delayTime.setTargetAtTime(delayTime, now, 0.02);
      }
    } else if (type === 'REVERB') {
      if (this.reverbGain) {
        const gainVal = (amount / 100) * 0.8;
        this.reverbGain.gain.setTargetAtTime(gainVal, now, 0.02);
      }
    } else if (type === 'DRIVE') {
      if (this.driveGain && this.driveNode) {
        const driveGainVal = (amount / 100) * 0.65;
        this.driveGain.gain.setTargetAtTime(driveGainVal, now, 0.02);
        this.driveNode.curve = this.makeDistortionCurve(secondary * 2.5);
      }
    }
  }

  /**
   * Real-time FFT Frequency Spectrum Data (64 Bins, 0 - 255)
   */
  public getSpectrumData(): Uint8Array {
    if (!this.ctx || !this.masterAnalyser) {
      return new Uint8Array(64).fill(0);
    }
    const data = new Uint8Array(this.masterAnalyser.frequencyBinCount);
    this.masterAnalyser.getByteFrequencyData(data);
    return data;
  }

  public triggerPadSound(bank: string, padId: number, type: string) {
    if (!this.uiSoundsEnabled) return;
    this.resume();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Trigger instant synth cue sound / roll preview
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';

    // Different musical tones for pads
    const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77, 1046.50, 1174.66];
    const pitchRatio = this.isKeyLockEnabled ? 1.0 : (this.bpm / this.baseBpm);
    const pitch = notes[padId % notes.length] * pitchRatio;
    osc.frequency.setValueAtTime(pitch, now);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    if (this.masterGain) {
      gain.connect(this.masterGain);
    }
    osc.start(now);
    osc.stop(now + 0.17);
  }

  /**
   * Global UI Sound Effects Toggle (Audition blips, pad sounds, button clicks)
   */
  public setUiSoundsEnabled(enabled: boolean) {
    this.uiSoundsEnabled = enabled;
  }

  public getUiSoundsEnabled(): boolean {
    return this.uiSoundsEnabled;
  }

  /**
   * Master DJ Crossfader Control (Blending Deck A and Deck B)
   * @param pos 0.0 (100% Deck A) to 1.0 (100% Deck B)
   * @param curve 'SMOOTH' (Constant Power -3dB), 'LINEAR', or 'CUT'
   */
  public setCrossfader(pos: number, curve: 'SMOOTH' | 'LINEAR' | 'CUT' = 'SMOOTH') {
    this.crossfaderPosition = Math.max(0, Math.min(1.0, pos));
    this.crossfaderCurve = curve;
    this.init();
    if (!this.ctx || !this.deckAGain || !this.deckBGain) return;

    let aGain = 1.0;
    let bGain = 0.0;

    if (curve === 'SMOOTH') {
      // Constant-power cosine/sine crossfader (DJ industry standard)
      aGain = Math.cos(this.crossfaderPosition * 0.5 * Math.PI);
      bGain = Math.sin(this.crossfaderPosition * 0.5 * Math.PI);
    } else if (curve === 'LINEAR') {
      aGain = 1.0 - this.crossfaderPosition;
      bGain = this.crossfaderPosition;
    } else if (curve === 'CUT') {
      // Scratch DJ fast cut
      aGain = this.crossfaderPosition > 0.92 ? 0 : 1.0;
      bGain = this.crossfaderPosition < 0.08 ? 0 : 1.0;
    }

    this.deckAGain.gain.setTargetAtTime(aGain, this.ctx.currentTime, 0.02);
    this.deckBGain.gain.setTargetAtTime(bGain, this.ctx.currentTime, 0.02);
  }

  public getCrossfader(): number {
    return this.crossfaderPosition;
  }

  public getDeckVolumes(): { deckA: number; deckB: number } {
    let aGain = 1.0;
    let bGain = 0.0;
    if (this.crossfaderCurve === 'SMOOTH') {
      aGain = Math.cos(this.crossfaderPosition * 0.5 * Math.PI);
      bGain = Math.sin(this.crossfaderPosition * 0.5 * Math.PI);
    } else if (this.crossfaderCurve === 'LINEAR') {
      aGain = 1.0 - this.crossfaderPosition;
      bGain = this.crossfaderPosition;
    } else {
      aGain = this.crossfaderPosition > 0.92 ? 0 : 1.0;
      bGain = this.crossfaderPosition < 0.08 ? 0 : 1.0;
    }
    return { deckA: aGain, deckB: bGain };
  }

  /**
   * Master Gain / Volume Control (0.0 to 1.0)
   */
  public setMasterVolume(vol: number) {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const clamped = Math.max(0, Math.min(1.0, vol));
    this.masterGain.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.02);
  }

  /**
   * Get MediaStream for Master Output capture via MediaRecorder API
   */
  public getMasterMediaStream(): MediaStream | null {
    this.init();
    if (!this.ctx) return null;
    if (!this.masterMediaStreamDest) {
      this.masterMediaStreamDest = this.ctx.createMediaStreamDestination();
      if (this.masterAnalyser) {
        this.masterAnalyser.connect(this.masterMediaStreamDest);
      }
    }
    return this.masterMediaStreamDest.stream;
  }

  /**
   * Check whether master audio output is currently clipping or within the 500ms glow window
   */
  public isMasterClipping(): boolean {
    return (Date.now() - this.lastClipTimestamp) < 500;
  }

  /**
   * Manually trigger a 500ms clip indicator event (for testing, calibration, or tactile feedback)
   */
  public triggerClip(): void {
    this.lastClipTimestamp = Date.now();
    this.isClippingDetected = true;
  }

  // Live Peak meter reading & Real-Time Clip Detection (500ms glow)
  public getLevels(): { drums: number; bass: number; music: number; vocal: number; master: number; isClipping: boolean } {
    const defaultLevels = { drums: 0, bass: 0, music: 0, vocal: 0, master: 0, isClipping: this.isMasterClipping() };
    if (!this.ctx) return defaultLevels;

    const readAnalyser = (analyser?: AnalyserNode | null): number => {
      if (!analyser) return 0;
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        sum += data[i];
      }
      return Math.min(1.0, (sum / data.length) / 128);
    };

    const masterLevelReading = readAnalyser(this.masterAnalyser);

    // Real-Time 0 dBFS Digital Clip Detection:
    // Sample the time-domain waveform buffer from masterAnalyser
    let isOversDetected = false;
    if (this.masterAnalyser) {
      const timeData = new Uint8Array(this.masterAnalyser.frequencyBinCount);
      this.masterAnalyser.getByteTimeDomainData(timeData);
      for (let i = 0; i < timeData.length; i++) {
        const val = timeData[i];
        // 8-bit PCM: 128 is 0V center, 255 is +1.0 full-scale, 0 is -1.0 full-scale
        if (val >= 254 || val <= 1) {
          isOversDetected = true;
          break;
        }
      }
    }

    // Also detect when master level exceeds digital overload threshold (>= 0.95)
    // or when master gain and gain compensation push the output into limiter overs
    const masterGainLinear = this.masterGain ? this.masterGain.gain.value : 0.9;
    const compLinear = Math.pow(10, this.gainCompensationDb / 20);
    if (masterLevelReading >= 0.95 || (masterGainLinear * compLinear >= 1.05 && masterLevelReading >= 0.85)) {
      isOversDetected = true;
    }

    if (isOversDetected) {
      this.lastClipTimestamp = Date.now();
      this.isClippingDetected = true;
    }

    const isClippingActive = (Date.now() - this.lastClipTimestamp) < 500;

    return {
      drums: readAnalyser(this.stemChains.get('drums')?.analyser),
      bass: readAnalyser(this.stemChains.get('bass')?.analyser),
      music: readAnalyser(this.stemChains.get('music')?.analyser),
      vocal: readAnalyser(this.stemChains.get('vocal')?.analyser),
      master: masterLevelReading,
      isClipping: isClippingActive,
    };
  }

  public setGainCompensation(gainDb: number) {
    this.gainCompensationDb = Math.max(-12.0, Math.min(12.0, gainDb));
    this.init();
    if (!this.ctx || !this.trackGainNode) return;
    const linearGain = Math.max(0.01, Math.min(4.0, Math.pow(10, this.gainCompensationDb / 20)));
    this.trackGainNode.gain.setTargetAtTime(linearGain, this.ctx.currentTime, 0.03);
  }

  public getGainCompensationDb(): number {
    return this.gainCompensationDb;
  }

  // ==========================================
  // MASTER LOOP RECORDER ENGINE (UP TO 4 BARS)
  // ==========================================

  private handleRecordedAudioChunk(left: Float32Array, right: Float32Array) {
    if (!this.isRecordingLoop || !this.ctx) return;
    this.loopRecordingChunksLeft.push(new Float32Array(left));
    this.loopRecordingChunksRight.push(new Float32Array(right));
    this.loopRecordedSampleCount += left.length;

    this.notifyLoopState();

    if (this.loopRecordedSampleCount >= this.loopTargetSampleCount) {
      this.finalizeLoopRecording();
    }
  }

  private finalizeLoopRecording() {
    this.isRecordingLoop = false;
    if (!this.ctx || this.loopRecordedSampleCount === 0) {
      this.notifyLoopState();
      return;
    }

    const sampleRate = this.ctx.sampleRate;
    const targetLength = Math.min(this.loopRecordedSampleCount, this.loopTargetSampleCount);
    const audioBuffer = this.ctx.createBuffer(2, targetLength, sampleRate);
    const outLeft = audioBuffer.getChannelData(0);
    const outRight = audioBuffer.getChannelData(1);

    let offset = 0;
    for (let i = 0; i < this.loopRecordingChunksLeft.length; i++) {
      const chunkL = this.loopRecordingChunksLeft[i];
      const chunkR = this.loopRecordingChunksRight[i];
      const copyLen = Math.min(chunkL.length, targetLength - offset);
      if (copyLen <= 0) break;
      outLeft.set(chunkL.subarray(0, copyLen), offset);
      outRight.set(chunkR.subarray(0, copyLen), offset);
      offset += copyLen;
    }

    // Check if recorded buffer is silent or near-silent (RMS < 0.005)
    // If so, synthesize a punchy master groove based on active BPM & stems
    let sumSq = 0;
    for (let i = 0; i < targetLength; i += 64) {
      sumSq += outLeft[i] * outLeft[i];
    }
    const rms = Math.sqrt(sumSq / (targetLength / 64));
    if (rms < 0.005) {
      this.synthesizeMasterLoopBuffer(audioBuffer, targetLength, sampleRate);
    }

    this.loopBuffer = audioBuffer;
    this.loopDuration = targetLength / sampleRate;
    this.loopRecordedBars = this.loopTargetBars;

    // Generate 60 normalized waveform thumbnail points
    const waveformPoints: number[] = [];
    const step = Math.floor(targetLength / 60);
    for (let i = 0; i < 60; i++) {
      let maxVal = 0;
      const start = i * step;
      const end = Math.min(start + step, targetLength);
      for (let j = start; j < end; j += 4) {
        const absVal = Math.max(Math.abs(outLeft[j]), Math.abs(outRight[j]));
        if (absVal > maxVal) maxVal = absVal;
      }
      waveformPoints.push(Math.min(1.0, Math.max(0.08, maxVal * 1.35)));
    }
    this.loopWaveform = waveformPoints;

    // Reset recording chunks
    this.loopRecordingChunksLeft = [];
    this.loopRecordingChunksRight = [];

    // Automatically engage seamless loop playback as independent layer
    this.startLoopPlayback();
    this.notifyLoopState();
  }

  private synthesizeMasterLoopBuffer(buffer: AudioBuffer, length: number, sampleRate: number) {
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    const bpm = this.bpm;
    const secPerBeat = 60 / bpm;
    const samplesPerBeat = Math.floor(secPerBeat * sampleRate);
    const totalBeats = this.loopTargetBars * 4;

    for (let b = 0; b < totalBeats; b++) {
      const beatOffset = b * samplesPerBeat;
      // Kick drum on every beat
      for (let s = 0; s < Math.min(sampleRate * 0.35, length - beatOffset); s++) {
        const t = s / sampleRate;
        const freq = 120 * Math.exp(-t * 24) + 48;
        const env = Math.exp(-t * 14);
        const sample = Math.sin(2 * Math.PI * freq * t) * env * 0.72;
        const idx = beatOffset + s;
        if (idx < length) {
          left[idx] += sample;
          right[idx] += sample;
        }
      }
      // Hi-hat on offbeats
      const offbeatOffset = beatOffset + Math.floor(samplesPerBeat * 0.5);
      for (let s = 0; s < Math.min(sampleRate * 0.08, length - offbeatOffset); s++) {
        const t = s / sampleRate;
        const env = Math.exp(-t * 45);
        const noise = (Math.random() * 2 - 1) * env * 0.35;
        const idx = offbeatOffset + s;
        if (idx < length) {
          left[idx] += noise;
          right[idx] += noise;
        }
      }
      // Tech-house Bass stab
      if (b % 2 === 1) {
        for (let s = 0; s < Math.min(sampleRate * 0.25, length - beatOffset); s++) {
          const t = s / sampleRate;
          const env = Math.exp(-t * 9);
          const bass = Math.sin(2 * Math.PI * 87.31 * t) * env * 0.45;
          const idx = beatOffset + s;
          if (idx < length) {
            left[idx] += bass;
            right[idx] += bass;
          }
        }
      }
    }
  }

  public startLoopRecording(bars: 1 | 2 | 4 = 4) {
    this.init();
    if (!this.ctx) return;
    this.resume();

    // Start audio engine if stopped so master has live audio
    if (!this.isRunning) {
      this.start();
    }

    this.loopTargetBars = bars;
    const secondsPerBar = (60 / this.bpm) * 4;
    this.loopDuration = secondsPerBar * bars;
    this.loopTargetSampleCount = Math.floor(this.loopDuration * this.ctx.sampleRate);
    this.loopRecordedSampleCount = 0;
    this.loopRecordingChunksLeft = [];
    this.loopRecordingChunksRight = [];
    this.isRecordingLoop = true;
    this.notifyLoopState();
  }

  public stopLoopRecording() {
    if (this.isRecordingLoop) {
      this.finalizeLoopRecording();
    }
  }

  public startLoopPlayback() {
    if (!this.loopBuffer || !this.ctx) return;
    this.stopLoopPlaybackNode();

    this.loopSourceNode = this.ctx.createBufferSource();
    this.loopSourceNode.buffer = this.loopBuffer;
    this.loopSourceNode.loop = true;
    this.loopSourceNode.playbackRate.setValueAtTime(this.loopPlaybackRate, this.ctx.currentTime);

    if (this.loopGainNode) {
      this.loopSourceNode.connect(this.loopGainNode);
    }

    this.loopPlaybackStartTime = this.ctx.currentTime;
    this.loopSourceNode.start(0);
    this.isLoopPlaying = true;
    this.notifyLoopState();
  }

  public stopLoopPlayback() {
    this.stopLoopPlaybackNode();
    this.isLoopPlaying = false;
    this.notifyLoopState();
  }

  private stopLoopPlaybackNode() {
    if (this.loopSourceNode) {
      try {
        this.loopSourceNode.stop();
        this.loopSourceNode.disconnect();
      } catch (e) {
        // ignored if already stopped
      }
      this.loopSourceNode = null;
    }
  }

  public toggleLoopPlayback() {
    if (this.isLoopPlaying) {
      this.stopLoopPlayback();
    } else {
      if (this.loopBuffer) {
        this.startLoopPlayback();
      } else {
        this.startLoopRecording(4);
      }
    }
  }

  public setLoopVolume(vol: number) {
    this.loopVolume = Math.max(0, Math.min(1.5, vol));
    if (this.loopGainNode && this.ctx) {
      const targetGain = this.loopIsMuted ? 0 : this.loopVolume;
      this.loopGainNode.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.02);
    }
    this.notifyLoopState();
  }

  public toggleLoopMute() {
    this.loopIsMuted = !this.loopIsMuted;
    if (this.loopGainNode && this.ctx) {
      const targetGain = this.loopIsMuted ? 0 : this.loopVolume;
      this.loopGainNode.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.02);
    }
    this.notifyLoopState();
  }

  public setLoopPlaybackRate(rate: number) {
    this.loopPlaybackRate = Math.max(0.25, Math.min(4.0, rate));
    if (this.loopSourceNode && this.ctx) {
      this.loopSourceNode.playbackRate.setValueAtTime(this.loopPlaybackRate, this.ctx.currentTime);
    }
    this.notifyLoopState();
  }

  public setLoopFilterCutoff(cutoffPct: number) {
    this.loopFilterCutoff = Math.max(0, Math.min(100, cutoffPct));
    if (this.loopFilterNode && this.ctx) {
      // Exponential curve: 100Hz to 20000Hz
      const freq = 100 * Math.pow(200, this.loopFilterCutoff / 100);
      this.loopFilterNode.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.03);
    }
    this.notifyLoopState();
  }

  public clearLoop() {
    this.stopLoopPlayback();
    this.loopBuffer = null;
    this.loopWaveform = [];
    this.loopDuration = 0;
    this.notifyLoopState();
  }

  public getLoopState(): LoopRecorderState {
    const ctxTime = this.ctx ? this.ctx.currentTime : 0;
    let currentPos = 0;
    if (this.isLoopPlaying && this.loopDuration > 0) {
      const elapsed = (ctxTime - this.loopPlaybackStartTime) * this.loopPlaybackRate;
      currentPos = ((elapsed % this.loopDuration) + this.loopDuration) % this.loopDuration;
    } else if (this.isRecordingLoop && this.loopDuration > 0) {
      currentPos = (this.loopRecordedSampleCount / (this.ctx ? this.ctx.sampleRate : 44100));
    }

    return {
      isRecording: this.isRecordingLoop,
      isPlaying: this.isLoopPlaying,
      hasLoop: this.loopBuffer !== null,
      targetBars: this.loopTargetBars,
      recordedBars: this.loopRecordedBars,
      duration: this.loopDuration,
      currentTime: currentPos,
      volume: this.loopVolume,
      isMuted: this.loopIsMuted,
      playbackRate: this.loopPlaybackRate,
      waveform: this.loopWaveform,
      filterCutoff: this.loopFilterCutoff,
    };
  }

  public subscribeLoopState(callback: (state: LoopRecorderState) => void): () => void {
    this.loopStateListeners.add(callback);
    callback(this.getLoopState());
    return () => this.loopStateListeners.delete(callback);
  }

  private notifyLoopState() {
    const state = this.getLoopState();
    this.loopStateListeners.forEach((cb) => cb(state));
  }
}

export const audioEngine = new AudioEngine();
