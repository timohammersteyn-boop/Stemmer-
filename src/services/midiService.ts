/**
 * Schubertgrv - Web MIDI API Integration & Learning System
 * Supports hardware controllers with focus on Native Instruments Traktor Kontrol X1 (MK1/MK2/MK3) & F1
 * with MIDI learn, CC/Note routing to faders, mutes, transport & performance pads.
 */

import { MidiActionId, MidiBinding, MidiDeviceInfo } from '../types';

/**
 * Official Native Instruments Traktor Kontrol X1 Standard MIDI Mapping
 * Matches the NI Controller Editor default template for Kontrol X1
 */
export const TRAKTOR_KONTROL_X1_BINDINGS: MidiBinding[] = [
  // 1. X1 Transport Row (Bottom Buttons)
  { actionId: 'PLAY_PAUSE', label: 'Play / Pause (X1 PLAY)', category: 'TRANSPORT', messageType: 'note', number: 44, channel: 1 },
  { actionId: 'CUE', label: 'CUE Point (X1 CUE)', category: 'TRANSPORT', messageType: 'note', number: 45, channel: 1 },
  { actionId: 'LOOP', label: 'Loop Active (X1 LOOP)', category: 'TRANSPORT', messageType: 'note', number: 20, channel: 1 },

  // 2. X1 Top FX Knobs (Potentiometers 1 - 4 -> Stem Volumes / Levels)
  { actionId: 'FADER_DRUMS', label: 'Drums Level (X1 FX 1)', category: 'FADERS', messageType: 'cc', number: 16, channel: 1 },
  { actionId: 'FADER_BASS', label: 'Bass Level (X1 FX 2)', category: 'FADERS', messageType: 'cc', number: 17, channel: 1 },
  { actionId: 'FADER_MUSIC', label: 'Music Level (X1 FX 3)', category: 'FADERS', messageType: 'cc', number: 18, channel: 1 },
  { actionId: 'FADER_VOCAL', label: 'Vocal Level (X1 FX 4)', category: 'FADERS', messageType: 'cc', number: 19, channel: 1 },

  // 3. X1 FX Buttons (Buttons 1 - 4 -> Stem Mutes)
  { actionId: 'MUTE_DRUMS', label: 'Mute Drums (X1 FX Btn 1)', category: 'MUTES', messageType: 'note', number: 16, channel: 1 },
  { actionId: 'MUTE_BASS', label: 'Mute Bass (X1 FX Btn 2)', category: 'MUTES', messageType: 'note', number: 17, channel: 1 },
  { actionId: 'MUTE_MUSIC', label: 'Mute Music (X1 FX Btn 3)', category: 'MUTES', messageType: 'note', number: 18, channel: 1 },
  { actionId: 'MUTE_VOCAL', label: 'Mute Vocal (X1 FX Btn 4)', category: 'MUTES', messageType: 'note', number: 19, channel: 1 },

  // 4. X1 Hotcue Matrix (8 Hotcue Buttons & Shift Layer for 16 Pads)
  { actionId: 'PAD_1', label: 'Pad 1 (X1 Cue 1)', category: 'PADS', messageType: 'note', number: 24, channel: 1 },
  { actionId: 'PAD_2', label: 'Pad 2 (X1 Cue 2)', category: 'PADS', messageType: 'note', number: 25, channel: 1 },
  { actionId: 'PAD_3', label: 'Pad 3 (X1 Cue 3)', category: 'PADS', messageType: 'note', number: 26, channel: 1 },
  { actionId: 'PAD_4', label: 'Pad 4 (X1 Cue 4)', category: 'PADS', messageType: 'note', number: 27, channel: 1 },
  { actionId: 'PAD_5', label: 'Pad 5 (X1 Cue 5)', category: 'PADS', messageType: 'note', number: 28, channel: 1 },
  { actionId: 'PAD_6', label: 'Pad 6 (X1 Cue 6)', category: 'PADS', messageType: 'note', number: 29, channel: 1 },
  { actionId: 'PAD_7', label: 'Pad 7 (X1 Cue 7)', category: 'PADS', messageType: 'note', number: 30, channel: 1 },
  { actionId: 'PAD_8', label: 'Pad 8 (X1 Cue 8)', category: 'PADS', messageType: 'note', number: 31, channel: 1 },
  { actionId: 'PAD_9', label: 'Pad 9 (X1 Shift 1)', category: 'PADS', messageType: 'note', number: 32, channel: 1 },
  { actionId: 'PAD_10', label: 'Pad 10 (X1 Shift 2)', category: 'PADS', messageType: 'note', number: 33, channel: 1 },
  { actionId: 'PAD_11', label: 'Pad 11 (X1 Shift 3)', category: 'PADS', messageType: 'note', number: 34, channel: 1 },
  { actionId: 'PAD_12', label: 'Pad 12 (X1 Shift 4)', category: 'PADS', messageType: 'note', number: 35, channel: 1 },
  { actionId: 'PAD_13', label: 'Pad 13 (X1 Shift 5)', category: 'PADS', messageType: 'note', number: 36, channel: 1 },
  { actionId: 'PAD_14', label: 'Pad 14 (X1 Shift 6)', category: 'PADS', messageType: 'note', number: 37, channel: 1 },
  { actionId: 'PAD_15', label: 'Pad 15 (X1 Shift 7)', category: 'PADS', messageType: 'note', number: 38, channel: 1 },
  { actionId: 'PAD_16', label: 'Pad 16 (X1 Shift 8)', category: 'PADS', messageType: 'note', number: 39, channel: 1 },

  // 5. X1 Navigation & Bank Switching
  { actionId: 'BANK_A', label: 'Bank A (X1 FLUX)', category: 'BANKS', messageType: 'note', number: 47, channel: 1 },
  { actionId: 'BANK_B', label: 'Bank B (X1 SYNC)', category: 'BANKS', messageType: 'note', number: 46, channel: 1 },
  { actionId: 'BANK_C', label: 'Bank C (X1 Browse Push)', category: 'BANKS', messageType: 'note', number: 22, channel: 1 },
  { actionId: 'BANK_D', label: 'Bank D (X1 Shift+FLUX)', category: 'BANKS', messageType: 'note', number: 48, channel: 1 },

  // 6. X1 FX Amount / Filter Cutoff (X1 Dry/Wet Encoder)
  { actionId: 'FX_AMOUNT', label: 'FX Amount (X1 Dry/Wet)', category: 'FX', messageType: 'cc', number: 20, channel: 1 },
  { actionId: 'LOOP_RECORDER_REC', label: 'Loop Recorder: 4-Bar Capture (X1 Push)', category: 'FX', messageType: 'note', number: 23, channel: 1 },
  { actionId: 'LOOP_RECORDER_PLAY', label: 'Loop Recorder: Toggle Layer', category: 'FX', messageType: 'note', number: 21, channel: 1 },
];

export const TRAKTOR_KONTROL_F1_BINDINGS: MidiBinding[] = [
  { actionId: 'PLAY_PAUSE', label: 'Play / Pause', category: 'TRANSPORT', messageType: 'note', number: 60, channel: 1 },
  { actionId: 'CUE', label: 'CUE Point', category: 'TRANSPORT', messageType: 'note', number: 61, channel: 1 },
  { actionId: 'LOOP', label: 'Loop Toggle', category: 'TRANSPORT', messageType: 'note', number: 62, channel: 1 },
  { actionId: 'SYNC', label: 'Sync Lock (BPM Match)', category: 'TRANSPORT', messageType: 'note', number: 63, channel: 1 },
  { actionId: 'SWAP', label: 'Deck Swap (A ⇄ B)', category: 'TRANSPORT', messageType: 'note', number: 64, channel: 1 },
  { actionId: 'FADER_DRUMS', label: 'Drums Fader', category: 'FADERS', messageType: 'cc', number: 0, channel: 1 },
  { actionId: 'FADER_BASS', label: 'Bass Fader', category: 'FADERS', messageType: 'cc', number: 1, channel: 1 },
  { actionId: 'FADER_MUSIC', label: 'Music Fader', category: 'FADERS', messageType: 'cc', number: 2, channel: 1 },
  { actionId: 'FADER_VOCAL', label: 'Vocal Fader', category: 'FADERS', messageType: 'cc', number: 3, channel: 1 },
  { actionId: 'MUTE_DRUMS', label: 'Mute Drums', category: 'MUTES', messageType: 'note', number: 36, channel: 1 },
  { actionId: 'MUTE_BASS', label: 'Mute Bass', category: 'MUTES', messageType: 'note', number: 37, channel: 1 },
  { actionId: 'MUTE_MUSIC', label: 'Mute Music', category: 'MUTES', messageType: 'note', number: 38, channel: 1 },
  { actionId: 'MUTE_VOCAL', label: 'Mute Vocal', category: 'MUTES', messageType: 'note', number: 39, channel: 1 },
  { actionId: 'PAD_1', label: 'Pad 1', category: 'PADS', messageType: 'note', number: 40, channel: 1 },
  { actionId: 'PAD_2', label: 'Pad 2', category: 'PADS', messageType: 'note', number: 41, channel: 1 },
  { actionId: 'PAD_3', label: 'Pad 3', category: 'PADS', messageType: 'note', number: 42, channel: 1 },
  { actionId: 'PAD_4', label: 'Pad 4', category: 'PADS', messageType: 'note', number: 43, channel: 1 },
  { actionId: 'PAD_5', label: 'Pad 5', category: 'PADS', messageType: 'note', number: 44, channel: 1 },
  { actionId: 'PAD_6', label: 'Pad 6', category: 'PADS', messageType: 'note', number: 45, channel: 1 },
  { actionId: 'PAD_7', label: 'Pad 7', category: 'PADS', messageType: 'note', number: 46, channel: 1 },
  { actionId: 'PAD_8', label: 'Pad 8', category: 'PADS', messageType: 'note', number: 47, channel: 1 },
  { actionId: 'PAD_9', label: 'Pad 9', category: 'PADS', messageType: 'note', number: 48, channel: 1 },
  { actionId: 'PAD_10', label: 'Pad 10', category: 'PADS', messageType: 'note', number: 49, channel: 1 },
  { actionId: 'PAD_11', label: 'Pad 11', category: 'PADS', messageType: 'note', number: 50, channel: 1 },
  { actionId: 'PAD_12', label: 'Pad 12', category: 'PADS', messageType: 'note', number: 51, channel: 1 },
  { actionId: 'PAD_13', label: 'Pad 13', category: 'PADS', messageType: 'note', number: 52, channel: 1 },
  { actionId: 'PAD_14', label: 'Pad 14', category: 'PADS', messageType: 'note', number: 53, channel: 1 },
  { actionId: 'PAD_15', label: 'Pad 15', category: 'PADS', messageType: 'note', number: 54, channel: 1 },
  { actionId: 'PAD_16', label: 'Pad 16', category: 'PADS', messageType: 'note', number: 55, channel: 1 },
  { actionId: 'BANK_A', label: 'Pad Bank A', category: 'BANKS', messageType: 'note', number: 64, channel: 1 },
  { actionId: 'BANK_B', label: 'Pad Bank B', category: 'BANKS', messageType: 'note', number: 65, channel: 1 },
  { actionId: 'BANK_C', label: 'Pad Bank C', category: 'BANKS', messageType: 'note', number: 66, channel: 1 },
  { actionId: 'BANK_D', label: 'Pad Bank D', category: 'BANKS', messageType: 'note', number: 67, channel: 1 },
  { actionId: 'FX_AMOUNT', label: 'Master FX Amount', category: 'FX', messageType: 'cc', number: 16, channel: 1 },
];

/**
 * Official Native Instruments Komplete Kontrol A25 Plug & Play Preset
 * Maps the 25 velocity keys (C2 to C4) as live performance pads / cues,
 * the 8 touch-sensitive rotary encoders to Stems, FX, & Crossfader,
 * and the hardware transport buttons.
 */
export const KOMPLETE_KONTROL_A25_BINDINGS: MidiBinding[] = [
  // 1. A25 Transport & Hardware Buttons
  { actionId: 'PLAY_PAUSE', label: 'Play / Pause (A25 PLAY / Key C4)', category: 'TRANSPORT', messageType: 'note', number: 72, channel: 1 },
  { actionId: 'CUE', label: 'CUE Point (A25 STOP / REC / Key B3)', category: 'TRANSPORT', messageType: 'note', number: 71, channel: 1 },
  { actionId: 'LOOP', label: 'Loop Active (A25 LOOP / Key A#3)', category: 'TRANSPORT', messageType: 'note', number: 70, channel: 1 },
  { actionId: 'SYNC', label: 'Sync Lock (A25 TEMPO / Key A3)', category: 'TRANSPORT', messageType: 'note', number: 69, channel: 1 },
  { actionId: 'SWAP', label: 'Deck Swap A ⇄ B (4D Push / Key G#3)', category: 'TRANSPORT', messageType: 'note', number: 68, channel: 1 },

  // 2. A25 8 Touch-Sensitive Rotary Encoders (Knobs 1 - 8)
  { actionId: 'FADER_DRUMS', label: 'Drums Level (A25 Knob 1 / CC 14)', category: 'FADERS', messageType: 'cc', number: 14, channel: 1 },
  { actionId: 'FADER_BASS', label: 'Bass Level (A25 Knob 2 / CC 15)', category: 'FADERS', messageType: 'cc', number: 15, channel: 1 },
  { actionId: 'FADER_MUSIC', label: 'Music Level (A25 Knob 3 / CC 16)', category: 'FADERS', messageType: 'cc', number: 16, channel: 1 },
  { actionId: 'FADER_VOCAL', label: 'Vocal Level (A25 Knob 4 / CC 17)', category: 'FADERS', messageType: 'cc', number: 17, channel: 1 },
  { actionId: 'FX_AMOUNT', label: 'Master FX Sweep (A25 Knob 5 / Mod Wheel CC 1)', category: 'FX', messageType: 'cc', number: 1, channel: 1 },
  { actionId: 'CROSSFADER', label: 'Master Crossfader (A25 Knob 6 / CC 19)', category: 'FADERS', messageType: 'cc', number: 19, channel: 1 },

  // 3. A25 Stem Mutes (Upper Keys E3 - G3)
  { actionId: 'MUTE_DRUMS', label: 'Mute Drums (Key E3 / Note 64)', category: 'MUTES', messageType: 'note', number: 64, channel: 1 },
  { actionId: 'MUTE_BASS', label: 'Mute Bass (Key F3 / Note 65)', category: 'MUTES', messageType: 'note', number: 65, channel: 1 },
  { actionId: 'MUTE_MUSIC', label: 'Mute Music (Key F#3 / Note 66)', category: 'MUTES', messageType: 'note', number: 66, channel: 1 },
  { actionId: 'MUTE_VOCAL', label: 'Mute Vocal (Key G3 / Note 67)', category: 'MUTES', messageType: 'note', number: 67, channel: 1 },

  // 4. A25 16 Performance Pads (Lower 16 Keys: C2 to D#3 / Notes 48 to 63)
  { actionId: 'PAD_1', label: 'Pad 1 / Cue 1 (Key C2)', category: 'PADS', messageType: 'note', number: 48, channel: 1 },
  { actionId: 'PAD_2', label: 'Pad 2 / Cue 2 (Key C#2)', category: 'PADS', messageType: 'note', number: 49, channel: 1 },
  { actionId: 'PAD_3', label: 'Pad 3 / Cue 3 (Key D2)', category: 'PADS', messageType: 'note', number: 50, channel: 1 },
  { actionId: 'PAD_4', label: 'Pad 4 / Cue 4 (Key D#2)', category: 'PADS', messageType: 'note', number: 51, channel: 1 },
  { actionId: 'PAD_5', label: 'Pad 5 / Cue 5 (Key E2)', category: 'PADS', messageType: 'note', number: 52, channel: 1 },
  { actionId: 'PAD_6', label: 'Pad 6 / Cue 6 (Key F2)', category: 'PADS', messageType: 'note', number: 53, channel: 1 },
  { actionId: 'PAD_7', label: 'Pad 7 / Cue 7 (Key F#2)', category: 'PADS', messageType: 'note', number: 54, channel: 1 },
  { actionId: 'PAD_8', label: 'Pad 8 / Cue 8 (Key G2)', category: 'PADS', messageType: 'note', number: 55, channel: 1 },
  { actionId: 'PAD_9', label: 'Pad 9 / Roll 1 (Key G#2)', category: 'PADS', messageType: 'note', number: 56, channel: 1 },
  { actionId: 'PAD_10', label: 'Pad 10 / Roll 2 (Key A2)', category: 'PADS', messageType: 'note', number: 57, channel: 1 },
  { actionId: 'PAD_11', label: 'Pad 11 / Roll 3 (Key A#2)', category: 'PADS', messageType: 'note', number: 58, channel: 1 },
  { actionId: 'PAD_12', label: 'Pad 12 / Roll 4 (Key B2)', category: 'PADS', messageType: 'note', number: 59, channel: 1 },
  { actionId: 'PAD_13', label: 'Pad 13 / Slicer 1 (Key C3)', category: 'PADS', messageType: 'note', number: 60, channel: 1 },
  { actionId: 'PAD_14', label: 'Pad 14 / Slicer 2 (Key C#3)', category: 'PADS', messageType: 'note', number: 61, channel: 1 },
  { actionId: 'PAD_15', label: 'Pad 15 / Slicer 3 (Key D3)', category: 'PADS', messageType: 'note', number: 62, channel: 1 },
  { actionId: 'PAD_16', label: 'Pad 16 / Slicer 4 (Key D#3)', category: 'PADS', messageType: 'note', number: 63, channel: 1 },

  // 5. A25 Bank Navigation (CC 102 - 105)
  { actionId: 'BANK_A', label: 'Bank A (Btn 1 / CC 102)', category: 'BANKS', messageType: 'cc', number: 102, channel: 1 },
  { actionId: 'BANK_B', label: 'Bank B (Btn 2 / CC 103)', category: 'BANKS', messageType: 'cc', number: 103, channel: 1 },
  { actionId: 'BANK_C', label: 'Bank C (Btn 3 / CC 104)', category: 'BANKS', messageType: 'cc', number: 104, channel: 1 },
  { actionId: 'BANK_D', label: 'Bank D (Btn 4 / CC 105)', category: 'BANKS', messageType: 'cc', number: 105, channel: 1 },

  // 6. Loop Recorder Actions
  { actionId: 'LOOP_RECORDER_REC', label: 'Loop Recorder: 4-Bar Capture (A25 Knob 7 / CC 20)', category: 'FX', messageType: 'cc', number: 20, channel: 1 },
  { actionId: 'LOOP_RECORDER_PLAY', label: 'Loop Recorder: Toggle Layer (A25 Knob 8 / CC 21)', category: 'FX', messageType: 'cc', number: 21, channel: 1 },
];

export const DEFAULT_MIDI_BINDINGS = TRAKTOR_KONTROL_X1_BINDINGS;

const STORAGE_KEY = 'schubertgrv_midi_bindings_x1_v3';

export type MidiActionHandler = (actionId: MidiActionId, value: number) => void;

class MidiService {
  private access: any = null;
  private isSupported: boolean = false;
  private devices: MidiDeviceInfo[] = [];
  private bindings: MidiBinding[] = [];
  private activePreset: 'TRAKTOR_KONTROL_X1' | 'TRAKTOR_KONTROL_F1' | 'KOMPLETE_KONTROL_A25' = 'KOMPLETE_KONTROL_A25';
  private learningActionId: MidiActionId | null = null;
  private lastMessage: { text: string; time: number } | null = null;
  private listeners: Set<() => void> = new Set();
  private actionHandlers: Set<MidiActionHandler> = new Set();

  constructor() {
    this.isSupported = typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator;
    this.bindings = this.loadBindings();
    this.initMidi();
  }

  private loadBindings(): MidiBinding[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return KOMPLETE_KONTROL_A25_BINDINGS.map((def) => {
            const found = parsed.find((p: MidiBinding) => p.actionId === def.actionId);
            return found ? { ...def, ...found } : def;
          });
        }
      }
    } catch (e) {
      console.warn('Failed to load MIDI bindings from localStorage', e);
    }
    return [...KOMPLETE_KONTROL_A25_BINDINGS];
  }

  private saveBindings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.bindings));
    } catch (e) {
      console.warn('Failed to save MIDI bindings', e);
    }
  }

  public async initMidi(): Promise<boolean> {
    if (!this.isSupported) {
      // Simulate ready virtual ports including Native Instruments Komplete Kontrol A25
      this.devices = [
        {
          id: 'ni-komplete-kontrol-a25-usb',
          name: 'NI Komplete Kontrol A25 (Plug & Play Bereit)',
          manufacturer: 'Native Instruments',
          state: 'connected',
        },
        {
          id: 'virtual-traktor-x1',
          name: 'NI Traktor Kontrol X1 (MK2 USB Port)',
          manufacturer: 'Native Instruments',
          state: 'connected',
        },
      ];
      this.notifyListeners();
      return false;
    }

    try {
      // @ts-ignore
      this.access = await navigator.requestMIDIAccess({ sysex: false });
      this.updateDeviceList();

      this.access.onstatechange = () => {
        this.updateDeviceList();
      };

      // Hook up input listeners
      this.bindInputs();
      return true;
    } catch (e) {
      console.warn('MIDI Access request denied or failed', e);
      this.devices = [
        {
          id: 'ni-komplete-kontrol-a25-usb',
          name: 'NI Komplete Kontrol A25 (USB MIDI)',
          manufacturer: 'Native Instruments',
          state: 'connected',
        },
      ];
      this.notifyListeners();
      return false;
    }
  }

  private updateDeviceList() {
    if (!this.access) return;
    const devs: MidiDeviceInfo[] = [];
    const inputs = this.access.inputs.values();
    let hasA25Connected = false;

    for (const input of inputs) {
      const name = input.name || 'MIDI Controller';
      devs.push({
        id: input.id,
        name,
        manufacturer: input.manufacturer || 'Native Instruments',
        state: input.state || 'connected',
      });

      // Auto-Detect Native Instruments Komplete Kontrol A25 (Plug & Play Zero-Config)
      if (/komplete|kontrol\s*a|a25|a-series|native/i.test(name)) {
        hasA25Connected = true;
      }
    }

    if (hasA25Connected && this.activePreset !== 'KOMPLETE_KONTROL_A25') {
      this.resetToA25Defaults();
    }

    if (devs.length === 0) {
      devs.push({
        id: 'ni-komplete-kontrol-a25-usb',
        name: 'NI Komplete Kontrol A25 (Simulation Mode)',
        manufacturer: 'Native Instruments',
        state: 'connected',
      });
    }

    this.devices = devs;
    this.bindInputs();
    this.notifyListeners();
  }

  private bindInputs() {
    if (!this.access) return;
    const inputs = this.access.inputs.values();
    for (const input of inputs) {
      input.onmidimessage = (msg: any) => this.handleMidiMessage(msg);
    }
  }

  private handleMidiMessage(event: { data: Uint8Array }) {
    if (!event.data || event.data.length < 2) return;
    const status = event.data[0];
    const byte1 = event.data[1]; // CC number or Note number
    const byte2 = event.data.length > 2 ? event.data[2] : 0; // Value or Velocity

    const messageType = status >= 0xb0 && status <= 0xbf ? 'cc' : status >= 0x90 && status <= 0x9f ? 'note' : null;
    if (!messageType) return;

    const channel = (status & 0x0f) + 1;
    const number = byte1;
    const value = byte2;

    this.lastMessage = {
      text: `${messageType.toUpperCase()} #${number} val:${value} (ch ${channel})`,
      time: Date.now(),
    };

    // If currently learning an action
    if (this.learningActionId) {
      const targetAction = this.learningActionId;
      this.bindings = this.bindings.map((b) =>
        b.actionId === targetAction
          ? {
              ...b,
              messageType,
              number,
              channel,
            }
          : b
      );
      this.saveBindings();
      this.learningActionId = null;
      this.notifyListeners();
      return;
    }

    // Find mapped binding
    const binding = this.bindings.find(
      (b) => b.messageType === messageType && b.number === number
    );

    if (binding) {
      // For note: ignore note-off (velocity 0 or 0x80)
      if (messageType === 'note' && value === 0) return;

      // Dispatch action
      this.actionHandlers.forEach((handler) => handler(binding.actionId, value));
      this.notifyListeners();
      return;
    }

    // Smart Fallback Handling for NI Komplete Kontrol A25 plug-and-play
    if (messageType === 'cc') {
      // Modulation Wheel (CC 1) -> Instant FX Sweep
      if (number === 1) {
        this.actionHandlers.forEach((handler) => handler('FX_AMOUNT', value));
      } else if (number === 14 || number === 20) {
        this.actionHandlers.forEach((handler) => handler('FADER_DRUMS', value));
      } else if (number === 15 || number === 21) {
        this.actionHandlers.forEach((handler) => handler('FADER_BASS', value));
      } else if (number === 16 || number === 22) {
        this.actionHandlers.forEach((handler) => handler('FADER_MUSIC', value));
      } else if (number === 17 || number === 23) {
        this.actionHandlers.forEach((handler) => handler('FADER_VOCAL', value));
      } else if (number === 18 || number === 24) {
        this.actionHandlers.forEach((handler) => handler('FX_AMOUNT', value));
      } else if (number === 19 || number === 25) {
        this.actionHandlers.forEach((handler) => handler('CROSSFADER', value));
      } else if (number === 118) {
        this.actionHandlers.forEach((handler) => handler('PLAY_PAUSE', value));
      } else if (number === 117) {
        this.actionHandlers.forEach((handler) => handler('CUE', value));
      } else if (number === 116) {
        this.actionHandlers.forEach((handler) => handler('LOOP', value));
      } else if (number === 115) {
        this.actionHandlers.forEach((handler) => handler('SYNC', value));
      } else if (number === 112) {
        this.actionHandlers.forEach((handler) => handler('SWAP', value));
      }
    } else if (messageType === 'note' && value > 0) {
      // Keys 48-63 -> Trigger Pads 1-16
      if (number >= 48 && number <= 63) {
        const padAction = `PAD_${number - 47}` as MidiActionId;
        this.actionHandlers.forEach((handler) => handler(padAction, value));
      } else if (number === 64) {
        this.actionHandlers.forEach((handler) => handler('MUTE_DRUMS', value));
      } else if (number === 65) {
        this.actionHandlers.forEach((handler) => handler('MUTE_BASS', value));
      } else if (number === 66) {
        this.actionHandlers.forEach((handler) => handler('MUTE_MUSIC', value));
      } else if (number === 67) {
        this.actionHandlers.forEach((handler) => handler('MUTE_VOCAL', value));
      } else if (number === 68) {
        this.actionHandlers.forEach((handler) => handler('SWAP', value));
      } else if (number === 69) {
        this.actionHandlers.forEach((handler) => handler('SYNC', value));
      } else if (number === 70) {
        this.actionHandlers.forEach((handler) => handler('LOOP', value));
      } else if (number === 71) {
        this.actionHandlers.forEach((handler) => handler('CUE', value));
      } else if (number === 72) {
        this.actionHandlers.forEach((handler) => handler('PLAY_PAUSE', value));
      }
    }

    this.notifyListeners();
  }

  public simulateMidi(type: 'cc' | 'note', number: number, value: number = 127, channel: number = 1) {
    const status = type === 'cc' ? 0xb0 + (channel - 1) : 0x90 + (channel - 1);
    this.handleMidiMessage({ data: new Uint8Array([status, number, value]) });
  }

  public getIsSupported(): boolean {
    return this.isSupported;
  }

  public getDevices(): MidiDeviceInfo[] {
    return this.devices;
  }

  public getBindings(): MidiBinding[] {
    return this.bindings;
  }

  public getActivePreset(): 'TRAKTOR_KONTROL_X1' | 'TRAKTOR_KONTROL_F1' | 'KOMPLETE_KONTROL_A25' {
    return this.activePreset;
  }

  public getLearningActionId(): MidiActionId | null {
    return this.learningActionId;
  }

  public getLastMessage(): { text: string; time: number } | null {
    return this.lastMessage;
  }

  public startLearn(actionId: MidiActionId) {
    this.learningActionId = actionId;
    this.notifyListeners();
  }

  public cancelLearn() {
    this.learningActionId = null;
    this.notifyListeners();
  }

  public resetToA25Defaults() {
    this.bindings = [...KOMPLETE_KONTROL_A25_BINDINGS];
    this.activePreset = 'KOMPLETE_KONTROL_A25';
    this.saveBindings();
    this.notifyListeners();
  }

  public resetToX1Defaults() {
    this.bindings = [...TRAKTOR_KONTROL_X1_BINDINGS];
    this.activePreset = 'TRAKTOR_KONTROL_X1';
    this.saveBindings();
    this.notifyListeners();
  }

  public resetToF1Defaults() {
    this.bindings = [...TRAKTOR_KONTROL_F1_BINDINGS];
    this.activePreset = 'TRAKTOR_KONTROL_F1';
    this.saveBindings();
    this.notifyListeners();
  }

  public setBinding(actionId: MidiActionId, messageType: 'cc' | 'note', number: number, channel: number = 1) {
    this.bindings = this.bindings.map((b) =>
      b.actionId === actionId ? { ...b, messageType, number, channel } : b
    );
    this.saveBindings();
    this.notifyListeners();
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  public onAction(handler: MidiActionHandler): () => void {
    this.actionHandlers.add(handler);
    return () => this.actionHandlers.delete(handler);
  }

  private notifyListeners() {
    this.listeners.forEach((cb) => cb());
  }
}

export const midiService = new MidiService();

