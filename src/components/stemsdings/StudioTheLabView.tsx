import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Upload, Play, Square, Scissors, Disc, CheckCircle2, ChevronRight, RefreshCw, AudioWaveform as WaveformIcon, Layers, Sparkles, Shuffle, BookOpen, FileText, X, Loader2 } from 'lucide-react';
import { torsoS4Engine } from '../../services/torsoS4AudioEngine';
import { generateSmartShuffle, calculateTrackCompatibility, SmartShuffledItem } from '../../utils/harmonicKeys';
import { playlistParser, StoryTrack } from '../../services/PlaylistParser';

interface StudioTheLabViewProps {
  onCommitStemToLive: (zone: 'A' | 'B', stemRole: 'drums' | 'bass' | 'music' | 'vocal', trackTitle: string, bars: 4 | 8 | 16) => void;
  masterBpm: number;
  onImportStoryPlaylist?: (storyTracks: StoryTrack[], summary: string, recommendedBpm: number) => void;
}

export const StudioTheLabView: React.FC<StudioTheLabViewProps> = ({
  onCommitStemToLive,
  masterBpm,
  onImportStoryPlaylist,
}) => {
  // Demo Tracks for immediate one-click testing (Expanded for Harmonic Mixing)
  const DEMO_MASTERS = [
    { id: '1', title: 'Berlin Sub Dub 128', artist: 'Torso Tech', bpm: 128, key: '8A' },
    { id: '2', title: 'Modular Acid Sequence', artist: 'S4 Labs', bpm: 132, key: '11B' },
    { id: '3', title: 'Nordic Deep Chill', artist: 'Field Works', bpm: 124, key: '5A' },
    { id: '4', title: 'Industrial Warehouse', artist: 'Demucs Core', bpm: 130, key: '2A' },
    { id: '5', title: 'Deep Vocal Dub', artist: 'Sub Ground', bpm: 126, key: '7A' },
    { id: '6', title: 'Lo-Fi Deep House', artist: 'Chords Inc', bpm: 122, key: '8B' },
    { id: '7', title: 'Ambient Textures', artist: 'Space Resonator', bpm: 120, key: '9A' },
    { id: '8', title: 'Peak Acid Core', artist: '303 Grid', bpm: 134, key: '10A' },
    { id: '9', title: 'Warehouse Techno', artist: 'Dampener', bpm: 131, key: '12B' },
    { id: '10', title: 'S4 Granular Space', artist: 'Drone Waves', bpm: 125, key: '6A' },
  ];

  const [selectedTrack, setSelectedTrack] = useState(DEMO_MASTERS[0]);
  const [separationStatus, setSeparationStatus] = useState<'idle' | 'processing' | 'done'>('done');
  const [separationProgress, setSeparationProgress] = useState<number>(100);
  const [activeStage, setActiveStage] = useState<string>('COMPLETED: 4 STEMS ISOLATED');

  // Loop Cutter state
  const [selectedBars, setSelectedBars] = useState<4 | 8 | 16>(4);
  const [loopStartSec, setLoopStartSec] = useState<number>(0.0);
  const [isAuditioning, setIsAuditioning] = useState<boolean>(false);
  const [activeAuditionRole, setActiveAuditionRole] = useState<'all' | 'drums' | 'bass' | 'music' | 'vocal'>('all');
  const [targetZone, setTargetZone] = useState<'A' | 'B'>('A');
  const [commitFeedback, setCommitFeedback] = useState<string | null>(null);

  // Mixed in Key Smart Playlist Generator
  const [smartPlaylist, setSmartPlaylist] = useState<any[]>([]);

  // AI Storyteller & Smart Playlist Parser States
  const [isStoryModalOpen, setIsStoryModalOpen] = useState<boolean>(false);
  const [storyPromptInput, setStoryPromptInput] = useState<string>(
    '2 Stunden Club-Dramaturgie: Start mit Deep Groove, Peak bei treibendem Acid Techno, hypnotisches Outro.'
  );
  const [rawTracksInput, setRawTracksInput] = useState<string>(
    DEMO_MASTERS.map((t) => `${t.title} - ${t.artist}`).join('\n')
  );
  const [isStoryParsing, setIsStoryParsing] = useState<boolean>(false);
  const [generatedStoryTracks, setGeneratedStoryTracks] = useState<StoryTrack[] | null>(null);

  const handleParseStory = async () => {
    setIsStoryParsing(true);
    try {
      const res = await playlistParser.parseAndGenerateStorySet(storyPromptInput, rawTracksInput);
      setGeneratedStoryTracks(res.storyTracks);
    } catch (e) {
      console.error('Failed to parse story playlist:', e);
    } finally {
      setIsStoryParsing(false);
    }
  };

  const handleIngestStorySet = () => {
    if (!generatedStoryTracks || generatedStoryTracks.length === 0) return;
    if (onImportStoryPlaylist) {
      onImportStoryPlaylist(
        generatedStoryTracks,
        storyPromptInput,
        generatedStoryTracks[0]?.targetBpm || 128
      );
    } else {
      const first = generatedStoryTracks[0];
      onCommitStemToLive('A', 'drums', first.title, 4);
      onCommitStemToLive('A', 'bass', first.title, 4);
    }
    setIsStoryModalOpen(false);
    setCommitFeedback(`AI STORY INGESTED // ${generatedStoryTracks.length} TRACKS ORGANIZED`);
    setTimeout(() => setCommitFeedback(null), 3000);
  };

  // Automatically compute smart compatible flow list on track selection
  useEffect(() => {
    const flow = generateSmartShuffle(
      DEMO_MASTERS,
      selectedTrack.id,
      selectedTrack.key,
      selectedTrack.bpm,
      'FLOW'
    );
    // Keep tracks excluding the current one for next compatible list preview
    setSmartPlaylist(flow.slice(1));
  }, [selectedTrack]);

  // Canvas visualizer for the lab waveform
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Run neural separation simulation
  const startStemSeparation = () => {
    setSeparationStatus('processing');
    setSeparationProgress(0);
    setActiveStage('DEMUCS v4: INITIALIZING FFT FREQUENCY DECOMPOSITION...');

    let p = 0;
    const interval = setInterval(() => {
      p += 12;
      setSeparationProgress(Math.min(100, p));
      if (p === 24) setActiveStage('SPECTRAL FILTERING: SEPARATING TRANSIENT DRUM ENERGY');
      if (p === 48) setActiveStage('NEURAL NETWORK: EXTRACTING BASS SUB-HARMONICS');
      if (p === 72) setActiveStage('LATENT INFERENCE: ISOLATING HARMONIC SYNTHS & VOX');
      if (p >= 100) {
        clearInterval(interval);
        setSeparationStatus('done');
        setActiveStage('SUCCESS: 4 ISOLATED REMIX STEMS READY FOR SLICING');
      }
    }, 180);
  };

  // Draw custom high-precision Torso S4 style multi-stem waveforms
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      phase += 0.03;
      const w = canvas.width;
      const h = canvas.height;

      // Deep matte background
      ctx.fillStyle = '#0B0B0C';
      ctx.fillRect(0, 0, w, h);

      // Grid lines
      ctx.strokeStyle = '#1E2024';
      ctx.lineWidth = 1;
      const barWidth = w / selectedBars;
      for (let i = 0; i <= selectedBars; i++) {
        ctx.beginPath();
        ctx.moveTo(i * barWidth, 0);
        ctx.lineTo(i * barWidth, h);
        ctx.stroke();
      }

      // Draw 4 Stem Waveforms (Drums, Bass, Music, Vocal) stacked
      const stemLabels = ['DRUMS', 'BASS', 'SYNTH/MUSIC', 'VOCAL'];
      const laneH = h / 4;

      stemLabels.forEach((label, idx) => {
        const laneY = idx * laneH;

        // Lane divider
        ctx.strokeStyle = '#161719';
        ctx.beginPath();
        ctx.moveTo(0, laneY);
        ctx.lineTo(w, laneY);
        ctx.stroke();

        // Label
        ctx.fillStyle = '#8E9296';
        ctx.font = '8px monospace';
        ctx.fillText(label, 6, laneY + 12);

        // Waveform shape
        ctx.strokeStyle = idx === 0 ? '#E4E7EB' : '#8E9296';
        ctx.lineWidth = 1;
        ctx.beginPath();

        for (let x = 0; x < w; x += 3) {
          const modFactor = Math.sin((x * 0.05) + phase * (idx + 1)) * 0.4;
          const noise = ((x * 13) % 17) / 34;
          const amp = (laneH * 0.35) * (modFactor + noise);
          const y = laneY + (laneH / 2) + (x % 2 === 0 ? amp : -amp);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      // Active Loop Region Highlight
      ctx.fillStyle = 'rgba(228, 231, 235, 0.05)';
      ctx.fillRect(0, 0, w, h);

      // Playhead if auditioning
      if (isAuditioning) {
        const playX = (phase * 40) % w;
        ctx.strokeStyle = '#00E5FF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(playX, 0);
        ctx.lineTo(playX, h);
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [selectedBars, isAuditioning]);

  const handleAuditionToggle = async () => {
    if (!isAuditioning) {
      await torsoS4Engine.startPlayback();
      setIsAuditioning(true);
    } else {
      torsoS4Engine.stopPlayback();
      setIsAuditioning(false);
    }
  };

  const handleCommitStem = (role: 'drums' | 'bass' | 'music' | 'vocal') => {
    onCommitStemToLive(targetZone, role, selectedTrack.title, selectedBars);
    setCommitFeedback(`LOOP COMMITTED TO ZONE ${targetZone} [${role.toUpperCase()}]`);
    setTimeout(() => setCommitFeedback(null), 2500);
  };

  return (
    <div className="w-full flex-1 flex flex-col gap-3 p-4 bg-[#0B0B0C] text-[#E4E7EB] font-mono select-none overflow-y-auto">
      {/* Top Banner: Studio Lab workflow instructions */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#161719] border border-[#282A2E] p-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#0B0B0C] border border-[#282A2E]">
            <Disc className="w-4 h-4 text-[#E4E7EB]" />
          </div>
          <div>
            <div className="text-xs font-bold tracking-wider text-[#F9F6F0]">
              THE LAB: NEURAL STEM SEPARATION & PRECISION LOOP CUTTER
            </div>
            <div className="text-[10px] text-[#8E9296]">
              Load stereo tracks &bull; Decompose via Demucs/Spleeter into 4 stems &bull; Slice 4/8/16-Bar loops for Live Performance
            </div>
          </div>
        </div>

        {/* Storyteller Import Button & Demo Tracks Picker */}
        <div className="flex items-center gap-2.5 text-xs">
          <button
            onClick={() => setIsStoryModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF] hover:bg-[#00E5FF] hover:text-[#0B0B0C] transition-all font-bold text-[10px] tracking-wider rounded-xs shadow-[0_0_8px_rgba(0,229,255,0.25)]"
            title="Import raw track titles and generate an AI-driven dramaturgical DJ set"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>IMPORT STORY</span>
          </button>

          <span className="text-[#8E9296] text-[10px]">SOURCE TRACK:</span>
          <select
            value={selectedTrack.id}
            onChange={(e) => {
              const trk = DEMO_MASTERS.find((t) => t.id === e.target.value);
              if (trk) {
                setSelectedTrack(trk);
                startStemSeparation();
              }
            }}
            className="bg-[#0B0B0C] border border-[#282A2E] text-[#E4E7EB] px-2 py-1 text-[11px] focus:outline-none focus:border-[#E4E7EB]"
          >
            {DEMO_MASTERS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} ({t.bpm} BPM, {t.key})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Pipeline Status Bar */}
      <div className="bg-[#161719] border border-[#282A2E] p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <RefreshCw className={`w-3.5 h-3.5 text-[#00E5FF] ${separationStatus === 'processing' ? 'animate-spin' : ''}`} />
            <span className="font-bold tracking-wider text-[#E4E7EB]">{activeStage}</span>
          </div>
          <span className="text-[#8E9296] text-[10px] tabular-nums">{separationProgress}%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-[#0B0B0C] border border-[#282A2E] overflow-hidden">
          <div
            className="h-full bg-[#E4E7EB] transition-all duration-200"
            style={{ width: `${separationProgress}%` }}
          />
        </div>
      </div>

      {/* Main Studio Work Area: Waveform Looper & Stem Export */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {/* Left 3 cols: Waveform Display & Loop Quantizer */}
        <div className="lg:col-span-3 flex flex-col gap-2 bg-[#161719] border border-[#282A2E] p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scissors className="w-3.5 h-3.5 text-[#E4E7EB]" />
              <span className="text-xs font-bold tracking-wider">LOOP CUTTER [SAMPLE-ACCURATE]</span>
            </div>

            {/* Bar Length Quick Quantize */}
            <div className="flex items-center gap-1 bg-[#0B0B0C] border border-[#282A2E] p-0.5">
              {([4, 8, 16] as const).map((bars) => (
                <button
                  key={bars}
                  onClick={() => setSelectedBars(bars)}
                  className={`px-2 py-0.5 text-[10px] font-bold transition-colors ${
                    selectedBars === bars
                      ? 'bg-[#E4E7EB] text-[#0B0B0C]'
                      : 'text-[#8E9296] hover:text-[#E4E7EB]'
                  }`}
                >
                  {bars} BARS
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Multi-Stem Waveform Canvas */}
          <div className="relative w-full h-56 bg-[#0B0B0C] border border-[#282A2E]">
            <canvas
              ref={canvasRef}
              width={800}
              height={224}
              className="w-full h-full block"
            />
          </div>

          {/* Slicer Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
            <div className="flex items-center gap-2">
              <button
                onClick={handleAuditionToggle}
                className={`flex items-center gap-1.5 px-3 py-1 border font-bold text-[10px] ${
                  isAuditioning
                    ? 'bg-[#E4E7EB] text-[#0B0B0C] border-[#E4E7EB]'
                    : 'bg-[#0B0B0C] text-[#8E9296] border-[#282A2E] hover:text-[#E4E7EB]'
                }`}
              >
                {isAuditioning ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                <span>{isAuditioning ? 'STOP AUDITION' : 'AUDITION LOOP'}</span>
              </button>

              <div className="text-[10px] text-[#8E9296]">
                LENGTH: <span className="text-[#E4E7EB] font-bold">{selectedBars} BARS</span> ({((60 / masterBpm) * 4 * selectedBars).toFixed(2)}s)
              </div>
            </div>

            {/* Target Live Zone Selector */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#8E9296]">ASSIGN TO:</span>
              <div className="flex bg-[#0B0B0C] border border-[#282A2E] p-0.5">
                <button
                  onClick={() => setTargetZone('A')}
                  className={`px-2 py-0.5 text-[10px] font-bold ${
                    targetZone === 'A' ? 'bg-[#E4E7EB] text-[#0B0B0C]' : 'text-[#8E9296]'
                  }`}
                >
                  ZONE A (LEFT)
                </button>
                <button
                  onClick={() => setTargetZone('B')}
                  className={`px-2 py-0.5 text-[10px] font-bold ${
                    targetZone === 'B' ? 'bg-[#E4E7EB] text-[#0B0B0C]' : 'text-[#8E9296]'
                  }`}
                >
                  ZONE B (RIGHT)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 col: The 4 Separated Stems Export Rack & Smart Mixed in Key Playlist */}
        <div className="flex flex-col gap-2 bg-[#161719] border border-[#282A2E] p-3 overflow-hidden">
          <div className="flex items-center gap-2 text-xs font-bold tracking-wider mb-1">
            <Layers className="w-3.5 h-3.5 text-[#E4E7EB]" />
            <span>EXTRACTED STEMS</span>
          </div>

          {(['drums', 'bass', 'music', 'vocal'] as const).map((role) => (
            <div
              key={role}
              className="bg-[#0B0B0C] border border-[#282A2E] p-2 flex flex-col gap-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#F9F6F0] tracking-wider">
                  {role.toUpperCase()}
                </span>
                <span className="text-[8px] text-[#8E9296]">48kHz &bull; 24-bit</span>
              </div>

              <div className="text-[9px] text-[#8E9296] truncate">
                {selectedTrack.title} &bull; {selectedBars} BARS
              </div>

              <button
                onClick={() => handleCommitStem(role)}
                className="w-full mt-1 py-1 bg-[#161719] hover:bg-[#E4E7EB] hover:text-[#0B0B0C] text-[#E4E7EB] border border-[#282A2E] text-[10px] font-bold tracking-wider transition-colors flex items-center justify-center gap-1"
              >
                <span>SEND TO SET {targetZone}</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          ))}

          {/* Mixed in Key Smart Playlist Panel */}
          <div className="mt-3 flex flex-col gap-2 border-t border-[#282A2E] pt-3">
            <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-[#00E5FF]">
              <Sparkles className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span>MIXED IN KEY SMART PLAYLIST</span>
            </div>
            <span className="text-[9px] text-[#8E9296] leading-tight">
              Auto-calculated from reference key <strong className="text-[#F9F6F0]">{selectedTrack.key}</strong> ({selectedTrack.bpm} BPM) using Camelot Wheel.
            </span>

            <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto pr-1">
              {smartPlaylist.map((item, idx) => {
                const colors = {
                  PERFECT: 'text-emerald-300 border-emerald-500 bg-emerald-950/20',
                  RELATIVE: 'text-cyan-300 border-cyan-500 bg-cyan-950/20',
                  ADJACENT: 'text-sky-300 border-sky-500 bg-sky-950/20',
                  ENERGY_BOOST: 'text-amber-300 border-amber-500 bg-amber-950/20',
                  CLASH: 'text-zinc-500 border-zinc-800 bg-zinc-950/20',
                };
                const matchClass = colors[item.harmonicResult.level as keyof typeof colors] || colors.CLASH;

                return (
                  <button
                    key={item.track.id}
                    onClick={() => {
                      setSelectedTrack(item.track);
                      startStemSeparation();
                    }}
                    className="w-full text-left bg-[#0B0B0C] border border-[#282A2E] hover:border-[#00E5FF] p-2 flex flex-col gap-1 transition-all rounded-xs"
                    title={`Click to select track as active reference for smart flow`}
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-[#E4E7EB] truncate w-24">
                        {idx + 1}. {item.track.title}
                      </span>
                      <span className={`text-[8px] px-1 py-0.2 border rounded-xs font-bold ${matchClass}`}>
                        {item.track.key} &bull; {item.score}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[8px] text-[#8E9296]">
                      <span>{item.track.artist}</span>
                      <span>
                        {item.track.bpm} BPM ({item.bpmDelta > 0 ? `+${item.bpmDelta.toFixed(0)}` : item.bpmDelta.toFixed(0)} delta)
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feedback banner */}
          {commitFeedback && (
            <div className="mt-auto p-2 bg-[#0B0B0C] border border-[#00E676] text-[#00E676] text-[10px] font-bold text-center animate-pulse">
              {commitFeedback}
            </div>
          )}
        </div>
      </div>

      {/* AI STORYTELLER & PLAYLIST PARSER MODAL */}
      {isStoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#0B0B0C] border-2 border-[#00E5FF] shadow-[0_0_40px_rgba(0,229,255,0.3)] max-w-2xl w-full max-h-[90vh] flex flex-col font-mono text-[#E4E7EB]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-3.5 border-b border-[#282A2E] bg-[#161719]">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-[#00E5FF]/20 border border-[#00E5FF] text-[#00E5FF]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black tracking-widest text-[#F9F6F0] uppercase">
                    IMPORT STORY // AI PLAYLIST PARSER
                  </h3>
                  <p className="text-[10px] text-[#8E9296]">
                    Dramaturgical Set Assembly &bull; Camelot Wheel Harmonic Ordering &bull; 8-Stem Direct Ingest
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsStoryModalOpen(false)}
                className="p-1.5 text-[#8E9296] hover:text-[#F9F6F0] hover:bg-[#282A2E] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {/* 1. Story Narrative Input */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold tracking-wider text-[#00E5FF]">
                    1. SET DRAMATURGY & STORY NARRATIVE:
                  </label>
                  <span className="text-[9px] text-[#8E9296]">Spannungsbogen & Dramaturgie</span>
                </div>
                <textarea
                  value={storyPromptInput}
                  onChange={(e) => setStoryPromptInput(e.target.value)}
                  rows={2}
                  placeholder="Beschreibe die Geschichte oder den Spannungsbogen deines Sets..."
                  className="w-full bg-[#161719] border border-[#282A2E] p-2 text-xs text-[#E4E7EB] placeholder-[#8E9296]/50 focus:outline-none focus:border-[#00E5FF] resize-none"
                />

                {/* Narrative Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[8px] text-[#8E9296]">PRESETS:</span>
                  {[
                    { label: 'Berlin Acid Peak', story: '2 Stunden Berghain Acid: Start bei 126 BPM hypnotisch, Peak 134 BPM Acid 303 Meltdown, deep minimal Outro.' },
                    { label: 'Nordic Sunset Chill', story: 'Warm-Up Chug: 122 BPM organische Percussions, steigender melodischer Spannungsbogen bis Sonnenuntergang.' },
                    { label: 'Hypnotic Warehouse', story: 'Industrieller Raw Techno: Monotone Sub-Bässe, Filter-Builds, keine Pausen, purer Rave-Flow.' },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setStoryPromptInput(preset.story)}
                      className="px-1.5 py-0.5 bg-[#161719] hover:bg-[#282A2E] text-[#8E9296] hover:text-[#00E5FF] border border-[#282A2E] text-[8px] font-bold transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Raw Track List Multi-Line String Input */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold tracking-wider text-[#00E5FF]">
                    2. TRACK TITLES LIST (MULTI-LINE STRING):
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setRawTracksInput(
                          DEMO_MASTERS.map((t) => `${t.title} - ${t.artist}`).join('\n')
                        )
                      }
                      className="text-[9px] text-[#00E5FF] hover:underline font-bold"
                    >
                      LOAD DEMO TRACKS
                    </button>
                    <span className="text-[#282A2E]">&bull;</span>
                    <button
                      type="button"
                      onClick={() => setRawTracksInput('')}
                      className="text-[9px] text-[#8E9296] hover:text-[#E4E7EB]"
                    >
                      CLEAR
                    </button>
                  </div>
                </div>
                <textarea
                  value={rawTracksInput}
                  onChange={(e) => setRawTracksInput(e.target.value)}
                  rows={5}
                  placeholder={`Paste track titles, one per line:\nBerlin Sub Dub 128 - Torso Tech\nModular Acid Sequence - S4 Labs\nNordic Deep Chill - Field Works...`}
                  className="w-full bg-[#161719] border border-[#282A2E] p-2 text-xs font-mono text-[#E4E7EB] placeholder-[#8E9296]/50 focus:outline-none focus:border-[#00E5FF]"
                />
                <span className="text-[8px] text-[#8E9296]">
                  {rawTracksInput.split('\n').filter((l) => l.trim().length > 0).length} tracks detected
                </span>
              </div>

              {/* Action Trigger Button */}
              <button
                type="button"
                onClick={handleParseStory}
                disabled={isStoryParsing || rawTracksInput.trim().length === 0}
                className="w-full py-2.5 bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-[#0B0B0C] font-extrabold text-xs tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_16px_rgba(0,229,255,0.4)]"
              >
                {isStoryParsing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#0B0B0C]" />
                    <span>PARSING VIA GEMINI AI & CAMELOT MATRIX...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-current" />
                    <span>PARSE & GENERATE STORY TIMELINE</span>
                  </>
                )}
              </button>

              {/* 3. Generated Timeline Preview */}
              {generatedStoryTracks && generatedStoryTracks.length > 0 && (
                <div className="flex flex-col gap-2 pt-2 border-t border-[#282A2E]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#F9F6F0] tracking-wider">
                      GENERATED DRAMATURGICAL TIMELINE:
                    </span>
                    <span className="text-[10px] text-[#00E676] font-bold">
                      {generatedStoryTracks.length} TRACKS CURATED
                    </span>
                  </div>

                  {/* Key Progression Flow */}
                  <div className="flex items-center gap-1.5 p-2 bg-[#161719] border border-[#282A2E] overflow-x-auto text-[9px]">
                    <span className="text-[#8E9296] font-bold shrink-0">KEY FLOW:</span>
                    {generatedStoryTracks.map((trk, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 bg-[#0B0B0C] border border-[#00E5FF]/40 text-[#00E5FF] font-bold shrink-0"
                      >
                        {trk.targetKey}
                      </span>
                    ))}
                  </div>

                  {/* Track Cards */}
                  <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
                    {generatedStoryTracks.map((trk, i) => (
                      <div
                        key={i}
                        className="bg-[#161719] border border-[#282A2E] hover:border-[#00E5FF]/60 p-2 flex flex-col gap-1 text-[10px]"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[#8E9296] font-bold">
                              {String(i + 1).padStart(2, '0')}.
                            </span>
                            <span className="font-bold text-[#F9F6F0]">{trk.title}</span>
                            {trk.isAiRecommendation && (
                              <span className="text-[7px] px-1 py-0.2 bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF] font-bold">
                                AI PICK
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="px-1 py-0.2 bg-[#0B0B0C] border border-[#282A2E] text-[#E4E7EB] font-bold">
                              {trk.targetBpm} BPM
                            </span>
                            <span className="px-1 py-0.2 bg-[#00E5FF]/15 border border-[#00E5FF] text-[#00E5FF] font-bold">
                              {trk.targetKey}
                            </span>
                            <span className="text-[8px] px-1 py-0.2 bg-[#161719] text-[#8E9296] border border-[#282A2E] font-bold">
                              {trk.performanceRole}
                            </span>
                          </div>
                        </div>

                        <div className="text-[9px] text-[#00E676] bg-[#0B0B0C] px-1.5 py-0.5 border border-[#1E2024]">
                          &bull; Live STEM Instruction: {trk.liveInstruction}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-[#282A2E] bg-[#161719] flex items-center justify-between">
              <span className="text-[9px] text-[#8E9296]">
                Target: Live Performance View (Zone A & Zone B 8-Stem Slots)
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsStoryModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#8E9296] hover:text-[#E4E7EB] border border-[#282A2E] font-bold transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={handleIngestStorySet}
                  disabled={!generatedStoryTracks || generatedStoryTracks.length === 0}
                  className="px-4 py-1.5 bg-[#00E676] hover:bg-[#00E676]/90 text-[#0B0B0C] text-xs font-black tracking-wider flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_12px_rgba(0,230,118,0.4)]"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>COMMIT STORY & INJECT TO 8 STEM SLOTS</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
