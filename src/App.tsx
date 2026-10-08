/**
 * STEMSDINGS — "PLAY MUSIC DIFFERENT."
 * Torso Electronics S4 Paradigm Live Remix & Sound-Sculpting Workstation
 * Dual Workflow: Studio Mode ("The Lab") vs. Live Performance View (8-Stem Dual Zone)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  torsoS4Engine,
  LiveStemItem,
  S4DeviceType,
  S4ChainParams,
  ModSlotConfig,
  ModSlotId,
  ReactiveHudEvent,
} from './services/torsoS4AudioEngine';

import { StemsdingsHeader } from './components/stemsdings/StemsdingsHeader';
import { StudioTheLabView } from './components/stemsdings/StudioTheLabView';
import { LivePerformanceView } from './components/stemsdings/LivePerformanceView';
import { TorsoS4SculptingRack } from './components/stemsdings/TorsoS4SculptingRack';
import { ReactiveHudOverlay } from './components/stemsdings/ReactiveHudOverlay';
import { ScreenEditorModal } from './components/stemsdings/ScreenEditorModal';
import { AndroidCodeHubModal } from './components/stemsdings/AndroidCodeHubModal';
import { MidiLearnModal } from './components/stemsdings/MidiLearnModal';
import { playlistParser, StoryTrack } from './services/PlaylistParser';

const DEFAULT_PARAMS: S4ChainParams = {
  tapeSpeed: 1.0,
  tapeReverse: false,
  loopBars: 4,
  tapeCrossfade: 0.15,
  grainSize: 0.25,
  grainDensity: 0.5,
  granularSpray: 0.2,
  warpContour: 0.4,
  filterMode: 'LOWPASS',
  filterCutoff: 0.7,
  filterResonance: 0.35,
  colorDrive: 0.2,
  bitDepth: 16,
  sampleRateCrush: 0.0,
  analogNoise: 0.05,
  delayTimeDivision: '1/4',
  delayFeedback: 0.4,
  reverbRoomSize: 0.6,
  reverbDamping: 0.4,
  masterFreeze: false,
};

const INITIAL_8_STEMS: LiveStemItem[] = [
  // ZONE A (4 Stems Left)
  {
    id: 'a_drums',
    zone: 'A',
    role: 'drums',
    name: 'A.DRUMS',
    trackTitle: 'Berlin Sub Dub 128',
    volume: 0.85,
    isMuted: false,
    isSolo: false,
    isPlaying: true,
    pan: 0,
    bars: 4,
    activeDevice: 'MATERIAL',
    params: { ...DEFAULT_PARAMS },
  },
  {
    id: 'a_bass',
    zone: 'A',
    role: 'bass',
    name: 'A.BASS',
    trackTitle: 'Berlin Sub Dub 128',
    volume: 0.78,
    isMuted: false,
    isSolo: false,
    isPlaying: true,
    pan: 0,
    bars: 4,
    activeDevice: 'FILTER',
    params: { ...DEFAULT_PARAMS, filterCutoff: 0.55, filterResonance: 0.5 },
  },
  {
    id: 'a_music',
    zone: 'A',
    role: 'music',
    name: 'A.SYNTH',
    trackTitle: 'Berlin Sub Dub 128',
    volume: 0.72,
    isMuted: false,
    isSolo: false,
    isPlaying: true,
    pan: -0.2,
    bars: 8,
    activeDevice: 'GRANULAR',
    params: { ...DEFAULT_PARAMS, granularSpray: 0.4 },
  },
  {
    id: 'a_vocal',
    zone: 'A',
    role: 'vocal',
    name: 'A.VOCAL',
    trackTitle: 'Berlin Sub Dub 128',
    volume: 0.65,
    isMuted: false,
    isSolo: false,
    isPlaying: true,
    pan: 0.2,
    bars: 8,
    activeDevice: 'SPACE',
    params: { ...DEFAULT_PARAMS, delayFeedback: 0.55 },
  },

  // ZONE B (4 Stems Right)
  {
    id: 'b_drums',
    zone: 'B',
    role: 'drums',
    name: 'B.DRUMS',
    trackTitle: 'Modular Acid 132',
    volume: 0.80,
    isMuted: false,
    isSolo: false,
    isPlaying: true,
    pan: 0,
    bars: 4,
    activeDevice: 'COLOR',
    params: { ...DEFAULT_PARAMS, colorDrive: 0.35 },
  },
  {
    id: 'b_bass',
    zone: 'B',
    role: 'bass',
    name: 'B.BASS',
    trackTitle: 'Modular Acid 132',
    volume: 0.75,
    isMuted: false,
    isSolo: false,
    isPlaying: true,
    pan: 0,
    bars: 4,
    activeDevice: 'FILTER',
    params: { ...DEFAULT_PARAMS, filterCutoff: 0.8 },
  },
  {
    id: 'b_music',
    zone: 'B',
    role: 'music',
    name: 'B.LEAD',
    trackTitle: 'Modular Acid 132',
    volume: 0.68,
    isMuted: false,
    isSolo: false,
    isPlaying: true,
    pan: 0.3,
    bars: 16,
    activeDevice: 'SPACE',
    params: { ...DEFAULT_PARAMS, reverbRoomSize: 0.75 },
  },
  {
    id: 'b_vocal',
    zone: 'B',
    role: 'vocal',
    name: 'B.ACAPELLA',
    trackTitle: 'Modular Acid 132',
    volume: 0.60,
    isMuted: false,
    isSolo: false,
    isPlaying: true,
    pan: -0.3,
    bars: 16,
    activeDevice: 'GRANULAR',
    params: { ...DEFAULT_PARAMS, grainSize: 0.4 },
  },
];

export default function App() {
  // Global Workflow Mode: STUDIO vs. LIVE
  const [appMode, setAppMode] = useState<'STUDIO' | 'LIVE'>('LIVE');

  // Master BPM & Transport
  const [masterBpm, setMasterBpm] = useState<number>(128);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // 8 Stems
  const [stems, setStems] = useState<LiveStemItem[]>(INITIAL_8_STEMS);
  const [selectedStemId, setSelectedStemId] = useState<string>('a_drums');

  // DJ Crossfader
  const [crossfader, setCrossfader] = useState<number>(0.5);
  const [crossfaderCurve, setCrossfaderCurve] = useState<'SMOOTH' | 'LINEAR' | 'CUT'>('SMOOTH');

  // Modulations Matrix Slots (▲, ■, ⬡, ●)
  const [modSlots, setModSlots] = useState<ModSlotConfig[]>(torsoS4Engine.getModSlots());

  // Reaktives HUD State (2000ms auto-dismiss)
  const [hudEvent, setHudEvent] = useState<ReactiveHudEvent | null>(null);
  const hudTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Screen Editor (Zen-Mode) States
  const [zenMode, setZenMode] = useState<boolean>(false);
  const [showMiniWaveforms, setShowMiniWaveforms] = useState<boolean>(true);
  const [showEqDetails, setShowEqDetails] = useState<boolean>(false);
  const [showLiveModulations, setShowLiveModulations] = useState<boolean>(true);
  const [showSpectralGraphs, setShowSpectralGraphs] = useState<boolean>(true);

  // External MIDI Clock Sync state
  const [extClockSyncEnabled, setExtClockSyncEnabled] = useState<boolean>(torsoS4Engine.isExtClockSyncEnabled());

  // Responsive Layout Matrix & Orientation Simulator states
  const [simulatedOrientation, setSimulatedOrientation] = useState<'LANDSCAPE' | 'PORTRAIT'>('LANDSCAPE');
  const [portraitPage, setPortraitPage] = useState<number>(2);

  // Modals
  const [isScreenEditorOpen, setIsScreenEditorOpen] = useState<boolean>(false);
  const [isAndroidCodeHubOpen, setIsAndroidCodeHubOpen] = useState<boolean>(false);
  const [isMidiLearnOpen, setIsMidiLearnOpen] = useState<boolean>(false);

  // AI Story Ingest & Playlist Imported Blip Animation state
  const [isPlaylistImportedBlip, setIsPlaylistImportedBlip] = useState<boolean>(false);
  const [highlightedStemIds, setHighlightedStemIds] = useState<string[]>([]);
  const playlistBlipTimerRef = useRef<any>(null);

  const handleImportStoryPlaylist = useCallback((
    storyTracks: StoryTrack[],
    summary: string,
    recommendedBpm: number
  ) => {
    // 1. Inject story tracks into 8 live stem channels
    setStems((prevStems) => {
      const updated = playlistParser.injectStoryIntoStems(storyTracks, prevStems);
      const updatedIds = updated.map((s) => s.id);
      setHighlightedStemIds(updatedIds);

      // Trigger Reactive HUD with PlaylistImported state & stem list
      setHudEvent({
        paramName: 'PLAYLIST IMPORTED',
        valueDisplay: `${storyTracks.length} TRACKS // ${summary.slice(0, 32)}...`,
        timestamp: Date.now(),
        isPlaylistImported: true,
        updatedStemIds: updatedIds,
      });

      return updated;
    });

    // 2. Set Master BPM to recommended BPM if present
    if (recommendedBpm && !isNaN(recommendedBpm)) {
      const clamped = Math.max(60, Math.min(220, recommendedBpm));
      setMasterBpm(clamped);
      torsoS4Engine.setMasterBpm(clamped);
    }

    // 3. Trigger visual blip animation across stem slots
    setIsPlaylistImportedBlip(true);
    if (playlistBlipTimerRef.current) {
      clearTimeout(playlistBlipTimerRef.current);
    }
    playlistBlipTimerRef.current = setTimeout(() => {
      setIsPlaylistImportedBlip(false);
      setHighlightedStemIds([]);
    }, 2800);

    if (hudTimerRef.current) {
      clearTimeout(hudTimerRef.current);
    }
    hudTimerRef.current = setTimeout(() => {
      setHudEvent(null);
    }, 3500);

    // Auto-switch to LIVE view so the DJ immediately observes the updated stems
    setAppMode('LIVE');
    if (simulatedOrientation === 'PORTRAIT') {
      setPortraitPage(2); // Jump to STEM AUDIO MIXER in portrait mode
    }
  }, [simulatedOrientation]);

  // Initialize Web MIDI on launch
  useEffect(() => {
    torsoS4Engine.setupWebMidi();

    // Listen to real-time modulation updates (60fps)
    const unsubMod = torsoS4Engine.onModMatrixUpdate((slots) => {
      setModSlots([...slots]);
    });

    // Listen to reactive HUD events
    const unsubHud = torsoS4Engine.onReactiveHud((event) => {
      triggerHud(event.paramName, event.valueDisplay, event.modSymbol, event.modColor, event.stemId);
    });

    // Listen to external MIDI Clock BPM updates
    const unsubClock = torsoS4Engine.onExtClockBpm((newBpm) => {
      setMasterBpm(newBpm);
    });

    return () => {
      unsubMod();
      unsubHud();
      unsubClock();
    };
  }, []);

  // Trigger Reactive 2000ms Pop-Up HUD
  const triggerHud = useCallback((
    paramName: string,
    valueDisplay: string,
    modSymbol: string = '▲',
    modColor: string = '#00E5FF',
    stemId?: string
  ) => {
    setHudEvent({
      stemId,
      paramName,
      valueDisplay,
      modSymbol,
      modColor,
      timestamp: Date.now(),
    });

    if (hudTimerRef.current) {
      clearTimeout(hudTimerRef.current);
    }

    hudTimerRef.current = setTimeout(() => {
      setHudEvent(null);
    }, 2000);
  }, []);

  // Transport toggle
  const handleTogglePlay = async () => {
    if (!isPlaying) {
      await torsoS4Engine.startPlayback();
      setIsPlaying(true);
    } else {
      torsoS4Engine.stopPlayback();
      setIsPlaying(false);
    }
  };

  const handleSetBpm = (newBpm: number) => {
    const clamped = Math.max(60, Math.min(220, newBpm));
    setMasterBpm(clamped);
    torsoS4Engine.setMasterBpm(clamped);
    triggerHud('MASTER BPM', `${clamped.toFixed(1)} BPM`, '▲');
  };

  const handleSetCrossfader = (pos: number) => {
    setCrossfader(pos);
    torsoS4Engine.setCrossfader(pos);
    if (zenMode) {
      triggerHud('CROSSFADER', `${Math.round(pos * 100)}%`, '■');
    }
  };

  // Stem parameter controls
  const handleUpdateStemVolume = (id: string, vol: number) => {
    setStems((prev) =>
      prev.map((s) => (s.id === id ? { ...s, volume: vol } : s))
    );
    torsoS4Engine.setStemVolume(id, vol);
    if (zenMode) {
      triggerHud('VOLUME', `${Math.round(vol * 100)}%`, '▲', '#00E5FF', id);
    }
  };

  const handleToggleStemMute = (id: string) => {
    setStems((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const nextMute = !s.isMuted;
          torsoS4Engine.setStemMute(id, nextMute);
          triggerHud('MUTE', nextMute ? 'MUTED' : 'UNMUTED', '●', '#FF1744', id);
          return { ...s, isMuted: nextMute };
        }
        return s;
      })
    );
  };

  const handleToggleStemSolo = (id: string) => {
    setStems((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const nextSolo = !s.isSolo;
          triggerHud('SOLO', nextSolo ? 'SOLO ON' : 'SOLO OFF', '■', '#FFEA00', id);
          return { ...s, isSolo: nextSolo };
        }
        return s;
      })
    );
  };

  // S4 Chain Parameter Updates
  const handleUpdateParams = (updates: Partial<S4ChainParams>) => {
    setStems((prev) =>
      prev.map((s) => {
        if (s.id === selectedStemId) {
          const nextParams = { ...s.params, ...updates };
          torsoS4Engine.updateStemParams(s.id, nextParams);
          return { ...s, params: nextParams };
        }
        return s;
      })
    );
  };

  const handleSelectDevice = (device: S4DeviceType) => {
    setStems((prev) =>
      prev.map((s) => (s.id === selectedStemId ? { ...s, activeDevice: device } : s))
    );
    triggerHud('S4 DEVICE', device, '⬡', '#00E676', selectedStemId);
  };

  // Commit loop from The Lab into Live Performance
  const handleCommitStemToLive = (
    zone: 'A' | 'B',
    role: 'drums' | 'bass' | 'music' | 'vocal',
    trackTitle: string,
    bars: 4 | 8 | 16
  ) => {
    const targetId = `${zone.toLowerCase()}_${role}`;
    setStems((prev) =>
      prev.map((s) =>
        s.id === targetId
          ? {
              ...s,
              trackTitle,
              bars,
            }
          : s
      )
    );
    triggerHud('COMMITTED', `${role.toUpperCase()} -> ZONE ${zone}`, '▲', '#00E5FF');
  };

  const handleToggleExtClockSync = () => {
    const nextVal = !extClockSyncEnabled;
    setExtClockSyncEnabled(nextVal);
    torsoS4Engine.setExtClockSyncEnabled(nextVal);
    triggerHud('MIDI CLOCK', nextVal ? 'EXTERNAL' : 'INTERNAL', '▲', '#00E5FF');
  };

  const handleToggleOrientation = () => {
    const nextOrient = simulatedOrientation === 'LANDSCAPE' ? 'PORTRAIT' : 'LANDSCAPE';
    setSimulatedOrientation(nextOrient);
    triggerHud('VIEWPORT', nextOrient, '⬡', '#00E676');
  };

  const selectedStem = stems.find((s) => s.id === selectedStemId) || stems[0];

  return (
    <div className="w-full h-screen flex flex-col bg-[#0B0B0C] text-[#E4E7EB] font-mono select-none overflow-hidden antialiased">
      {/* 1. TOP CHASSIS BAR: Brand, Mode Switcher, Master Transport, Status */}
      <StemsdingsHeader
        appMode={appMode}
        onToggleAppMode={setAppMode}
        masterBpm={masterBpm}
        onSetBpm={handleSetBpm}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        zenMode={zenMode}
        onToggleZenMode={() => {
          setZenMode(!zenMode);
          triggerHud('ZEN MODE', !zenMode ? 'ACTIVATED' : 'DISABLED', '⬡', '#00E676');
        }}
        onOpenScreenEditor={() => setIsScreenEditorOpen(true)}
        onOpenMidiLearn={() => setIsMidiLearnOpen(true)}
        onOpenAndroidCodeHub={() => setIsAndroidCodeHubOpen(true)}
        modSlots={modSlots}
        extClockSyncEnabled={extClockSyncEnabled}
        onToggleExtClockSync={handleToggleExtClockSync}
        simulatedOrientation={simulatedOrientation}
        onToggleOrientation={handleToggleOrientation}
      />

      {/* 2. MAIN VIEWPORT: RESPONSIVE ROUTER MATRIX */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {simulatedOrientation === 'PORTRAIT' ? (
          /* 📱 PORTRAIT-MODUS: Immersive 5-Page Swipe Pager */
          <div className="flex-1 flex flex-col p-3 bg-[#0B0B0C] overflow-hidden">
            {/* Portrait Status LED Indicator Header (Torso S4 Style) */}
            <div className="flex items-center justify-between h-9 bg-[#161719] border border-[#282A2E] px-3.5 mb-2 rounded-xs">
              <div className="flex items-center text-xs">
                <span className="font-extrabold text-[#F9F6F0]">STEMS</span>
                <span className="text-[#8E9296]">dings</span>
                <span className="text-[9px] text-[#00E5FF] ml-2 font-bold uppercase">
                  // PAGE {portraitPage + 1}
                </span>
              </div>

              {/* Status LEDs representing active page index */}
              <div className="flex items-center gap-1.5">
                {Array.from({ length: 5 }).map((_, i) => {
                  const isActive = i === portraitPage;
                  return (
                    <button
                      key={i}
                      onClick={() => setPortraitPage(i)}
                      className={`h-1.5 rounded-sm transition-all duration-200 ${
                        isActive ? 'w-5 bg-[#F9F6F0]' : 'w-1.5 bg-[#282A2E] hover:bg-[#8E9296]'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Page Header Bar */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#282A2E] text-xs font-bold text-[#8E9296]">
              <button
                onClick={() => setPortraitPage((prev) => (prev > 0 ? prev - 1 : 4))}
                className="px-2 py-1 bg-[#161719] border border-[#282A2E] hover:text-[#E4E7EB]"
              >
                ◀ SWIPE LEFT
              </button>
              <span className="text-[#E4E7EB] tracking-widest text-[10px] uppercase">
                {portraitPage === 0 && '01 // THE LAB (STUDIO)'}
                {portraitPage === 1 && '02 // PERFORMANCE PADS'}
                {portraitPage === 2 && '03 // STEM AUDIO MIXER'}
                {portraitPage === 3 && '04 // S4 SOUND SCULPTING'}
                {portraitPage === 4 && '05 // SYSTEM SETTINGS'}
              </span>
              <button
                onClick={() => setPortraitPage((prev) => (prev < 4 ? prev + 1 : 0))}
                className="px-2 py-1 bg-[#161719] border border-[#282A2E] hover:text-[#E4E7EB]"
              >
                SWIPE RIGHT ▶
              </button>
            </div>

            {/* Immersive Scrollable Viewport Page */}
            <div className="flex-1 overflow-y-auto bg-[#161719] border border-[#282A2E] p-3 flex flex-col gap-2.5 rounded-xs">
              {portraitPage === 0 && (
                /* Page 1: STUDIO LAB */
                <StudioTheLabView
                  onCommitStemToLive={handleCommitStemToLive}
                  masterBpm={masterBpm}
                  onImportStoryPlaylist={handleImportStoryPlaylist}
                />
              )}

              {portraitPage === 1 && (
                /* Page 2: PERFORMANCE PADS TRIGGER MATRIX */
                <div className="flex flex-col gap-3 h-full justify-between">
                  <div className="text-[10px] text-[#8E9296] leading-relaxed">
                    <strong>TAP TO TRIGGER:</strong> Color-coded 4x4 matrix trigger pads. Triggers roll, stutter, hot-cue sweeps seamlessly aligned to master grid.
                  </div>
                  <div className="grid grid-cols-4 gap-2 my-auto">
                    {Array.from({ length: 16 }).map((_, idx) => {
                      const roles: Array<'drums' | 'bass' | 'music' | 'vocal'> = ['drums', 'bass', 'music', 'vocal'];
                      const role = roles[idx % 4];
                      const colors = {
                        drums: 'bg-[#E4E7EB] hover:bg-white text-[#0B0B0C]',
                        bass: 'bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]',
                        music: 'bg-[#00E676]/20 text-[#00E676] border-[#00E676]',
                        vocal: 'bg-[#FF1744]/20 text-[#FF1744] border-[#FF1744]',
                      };
                      return (
                        <button
                          key={idx}
                          onClick={() => triggerHud('PAD TRIGGER', `PAD #${idx + 1} (${role.toUpperCase()})`, '▲')}
                          className={`aspect-square border flex flex-col justify-between p-1.5 font-bold rounded-xs transition-transform active:scale-95 ${colors[role]} border-[#282A2E]`}
                        >
                          <span className="text-[8px] opacity-60">#{idx + 1}</span>
                          <span className="text-[9px] tracking-tighter text-right">{role.slice(0, 3).toUpperCase()}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {portraitPage === 2 && (
                /* Page 3: STEM AUDIO MIXER */
                <div className="flex flex-col gap-2 h-full">
                  <LivePerformanceView
                    stems={stems}
                    selectedStemId={selectedStemId}
                    onSelectStem={setSelectedStemId}
                    onUpdateStemVolume={handleUpdateStemVolume}
                    onToggleStemMute={handleToggleStemMute}
                    onToggleStemSolo={handleToggleStemSolo}
                    crossfader={crossfader}
                    onSetCrossfader={handleSetCrossfader}
                    crossfaderCurve={crossfaderCurve}
                    onSetCrossfaderCurve={setCrossfaderCurve}
                    zenMode={zenMode}
                    showMiniWaveforms={showMiniWaveforms}
                    showLiveModulations={showLiveModulations}
                    modSlots={modSlots}
                    isPlaylistImportedBlip={isPlaylistImportedBlip}
                    highlightedStemIds={highlightedStemIds}
                  />
                </div>
              )}

              {portraitPage === 3 && (
                /* Page 4: S4 FX SOUND SCULPTING */
                <div className="flex flex-col gap-2">
                  <TorsoS4SculptingRack
                    activeDevice={selectedStem.activeDevice}
                    onSelectDevice={handleSelectDevice}
                    stem={selectedStem}
                    onUpdateParams={handleUpdateParams}
                    modSlots={modSlots}
                    onUpdateModSlot={(id, updates) => torsoS4Engine.updateModSlot(id, updates)}
                    onTriggerHud={(param, val, sym, col) => triggerHud(param, val, sym, col, selectedStemId)}
                  />
                </div>
              )}

              {portraitPage === 4 && (
                /* Page 5: SYSTEM SETTINGS & SYSTEM UTILITIES */
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5 p-2 bg-[#0B0B0C] border border-[#282A2E]">
                    <span className="text-[10px] text-[#8E9296]">AUDIO ENGINE BUFFER SIZE:</span>
                    <div className="grid grid-cols-3 gap-1">
                      {['LOW (128)', 'MED (256)', 'SAFE (512)'].map((lat) => (
                        <button
                          key={lat}
                          onClick={() => triggerHud('LATENCY', lat, '⬡')}
                          className="py-1 bg-[#161719] border border-[#282A2E] text-[10px] font-bold text-center text-[#E4E7EB] hover:border-[#E4E7EB]"
                        >
                          {lat.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 p-2 bg-[#0B0B0C] border border-[#282A2E]">
                    <span className="text-[10px] text-[#8E9296]">MIDI AUTO-DETECTION PORTS:</span>
                    <div className="text-[9px] text-[#8E9296] leading-relaxed">
                      &bull; USB MIDI Port 0: Armed [NI Traktor X1 Encoders]<br />
                      &bull; USB MIDI Port 1: Armed [Teensy Custom Controller]<br />
                      &bull; Web MIDI API status: Connected
                    </div>
                  </div>

                  <button
                    onClick={() => setIsMidiLearnOpen(true)}
                    className="w-full py-2 bg-[#161719] text-[#E4E7EB] border border-[#282A2E] text-[10px] font-bold tracking-wider hover:bg-[#E4E7EB] hover:text-[#0B0B0C] transition-all"
                  >
                    ENTER MIDI LEARN MODULE
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* 🎛️ LANDSCAPE-MODUS: Stacked Multi-Column Pro Workstation Setup on One Plane */
          <div className="flex-1 flex flex-col overflow-hidden">
            {appMode === 'STUDIO' ? (
              <StudioTheLabView
                onCommitStemToLive={handleCommitStemToLive}
                masterBpm={masterBpm}
                onImportStoryPlaylist={handleImportStoryPlaylist}
              />
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* 8-Stem Remix Matrix (Zone A links, Zone B rechts) */}
                <LivePerformanceView
                  stems={stems}
                  selectedStemId={selectedStemId}
                  onSelectStem={setSelectedStemId}
                  onUpdateStemVolume={handleUpdateStemVolume}
                  onToggleStemMute={handleToggleStemMute}
                  onToggleStemSolo={handleToggleStemSolo}
                  crossfader={crossfader}
                  onSetCrossfader={handleSetCrossfader}
                  crossfaderCurve={crossfaderCurve}
                  onSetCrossfaderCurve={setCrossfaderCurve}
                  zenMode={zenMode}
                  showMiniWaveforms={showMiniWaveforms}
                  showLiveModulations={showLiveModulations}
                  modSlots={modSlots}
                  isPlaylistImportedBlip={isPlaylistImportedBlip}
                  highlightedStemIds={highlightedStemIds}
                />

                {/* Torso Electronics S4 5-Stage Serial Sound-Sculpting Rack */}
                <TorsoS4SculptingRack
                  activeDevice={selectedStem.activeDevice}
                  onSelectDevice={handleSelectDevice}
                  stem={selectedStem}
                  onUpdateParams={handleUpdateParams}
                  modSlots={modSlots}
                  onUpdateModSlot={(id, updates) => torsoS4Engine.updateModSlot(id, updates)}
                  onTriggerHud={(param, val, sym, col) => triggerHud(param, val, sym, col, selectedStemId)}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* 3. REAKTIVES POP-UP HUD OVERLAY (2000ms Auto-Dismiss) */}
      <ReactiveHudOverlay hudEvent={hudEvent} />

      {/* 4. MODALS: Screen Editor (Zen-Mode), Android Kotlin Code Hub, and MIDI Learn */}
      <ScreenEditorModal
        isOpen={isScreenEditorOpen}
        onClose={() => setIsScreenEditorOpen(false)}
        zenMode={zenMode}
        onToggleZenMode={() => setZenMode(!zenMode)}
        showMiniWaveforms={showMiniWaveforms}
        onToggleShowMiniWaveforms={() => setShowMiniWaveforms(!showMiniWaveforms)}
        showEqDetails={showEqDetails}
        onToggleShowEqDetails={() => setShowEqDetails(!showEqDetails)}
        showLiveModulations={showLiveModulations}
        onToggleShowLiveModulations={() => setShowLiveModulations(!showLiveModulations)}
        showSpectralGraphs={showSpectralGraphs}
        onToggleShowSpectralGraphs={() => setShowSpectralGraphs(!showSpectralGraphs)}
      />

      <AndroidCodeHubModal
        isOpen={isAndroidCodeHubOpen}
        onClose={() => setIsAndroidCodeHubOpen(false)}
      />

      <MidiLearnModal
        isOpen={isMidiLearnOpen}
        onClose={() => setIsMidiLearnOpen(false)}
      />
    </div>
  );
}
