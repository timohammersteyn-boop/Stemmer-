/**
 * STEMSDINGS — AI-Storyteller & PlaylistParser Service
 * "PLAY MUSIC DIFFERENT."
 * Uses server-side Gemini API (gemini-3.8-flash) via /api/story-parse
 * to dramaturgically organize DJ track lists based on user story narrative
 * into sample-accurate harmonic sets.
 */

import { generateSmartShuffle, detectKeyFromAudioOrMetadata } from '../utils/harmonicKeys';
import { LiveStemItem } from './torsoS4AudioEngine';

export interface StoryTrack {
  trackIndex: number;
  title: string;
  artist?: string;
  targetBpm: number;
  targetKey: string;
  performanceRole: 'INTRO_FLOW' | 'BUILDUP_TENSION' | 'PEAK_ACID' | 'BREAKDOWN' | 'OUTRO_GLIDE' | string;
  liveInstruction: string;
  isAiRecommendation: boolean;
}

export interface StoryParseResult {
  storySummary: string;
  storyTracks: StoryTrack[];
  recommendedMasterBpm: number;
  harmonicKeyProgression: string[];
}

export class PlaylistParser {
  /**
   * Parses a raw multi-line track string and calls the server-side Gemini API
   * to assemble a dramaturgical set timeline with live stem instructions.
   */
  public async parseAndGenerateStorySet(
    userStory: string,
    rawTracksText: string
  ): Promise<StoryParseResult> {
    const cleanLines = rawTracksText
      .split('\n')
      .map((l) => l.trim().replace(/^[\d+.)\-*\s]+/, ''))
      .filter((l) => l.length > 0);

    const tracksList = cleanLines.length > 0
      ? cleanLines
      : [
          'Berlin Sub Dub 128 - Torso Tech',
          'Modular Acid Sequence - S4 Labs',
          'Nordic Deep Chill - Field Works',
          'Industrial Warehouse - Demucs Core',
          'Deep Vocal Dub - Sub Ground',
          'Lo-Fi Deep House - Chords Inc',
        ];

    const promptStory = userStory.trim() || '2 Stunden Club-Dramaturgie: Start mit Deep Groove, Peak bei treibendem Acid Techno, hypnotisches Outro.';

    try {
      const response = await fetch('/api/story-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userStory: promptStory,
          rawTracksText: tracksList.join('\n'),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const rawText = data.text || '';
        const parsed = this.extractJsonArray(rawText);
        if (parsed && parsed.length > 0) {
          const formatted = this.validateAndNormalizeTracks(parsed);
          return {
            storySummary: promptStory,
            storyTracks: formatted,
            recommendedMasterBpm: formatted[0]?.targetBpm || 128,
            harmonicKeyProgression: formatted.map((t) => t.targetKey),
          };
        }
      } else {
        console.warn('Backend /api/story-parse responded with', response.status);
      }
    } catch (err) {
      console.warn('Server story parse fetch error, falling back to harmonic generator:', err);
    }

    // Fallback: Smart Harmonic Music Theory Sequencing via Camelot Wheel
    return this.generateHarmonicStoryFallback(promptStory, tracksList);
  }

  private extractJsonArray(text: string): any[] | null {
    try {
      const start = text.indexOf('[');
      const end = text.lastIndexOf(']');
      if (start !== -1 && end !== -1 && end > start) {
        const jsonStr = text.substring(start, end + 1);
        return JSON.parse(jsonStr);
      }
    } catch (e) {
      console.warn('JSON array extraction failed:', e);
    }
    return null;
  }

  private validateAndNormalizeTracks(rawArray: any[]): StoryTrack[] {
    return rawArray.map((item, idx) => ({
      trackIndex: typeof item.trackIndex === 'number' ? item.trackIndex : idx,
      title: String(item.title || `Track ${idx + 1}`),
      artist: item.artist ? String(item.artist) : undefined,
      targetBpm: typeof item.targetBpm === 'number' ? Math.round(item.targetBpm * 10) / 10 : 128.0,
      targetKey: String(item.targetKey || '8A').toUpperCase(),
      performanceRole: String(item.performanceRole || 'BUILDUP_TENSION'),
      liveInstruction: String(item.liveInstruction || 'Filter Drums bei Cutoff 60%, Vocals solo triggern.'),
      isAiRecommendation: Boolean(item.isAiRecommendation),
    }));
  }

  /**
   * Deterministic harmonic sequencing fallback using Camelot Wheel progression
   */
  private generateHarmonicStoryFallback(
    userStory: string,
    trackNames: string[]
  ): StoryParseResult {
    const roles: Array<'INTRO_FLOW' | 'BUILDUP_TENSION' | 'PEAK_ACID' | 'BREAKDOWN' | 'OUTRO_GLIDE'> = [
      'INTRO_FLOW',
      'BUILDUP_TENSION',
      'PEAK_ACID',
      'BREAKDOWN',
      'OUTRO_GLIDE',
    ];

    const instructions = [
      'Nutze hier nur Vocals und Synth, um einen sanften Teppich zu legen.',
      'Drums reindrehen, Bassline mit 24dB Lowpass schrittweise öffnen.',
      'Volle 8 Stems synchron abfeuern, Space Freeze für Break-Momentum nutzen.',
      'Drums muten, Granular Spray auf 45% für diffuse Soundwolke schalten.',
      'Tape Varispeed sanft drosseln, Reverb Hall Decay auf 80% ausklingen lassen.',
    ];

    const baseBpm = 126.0;
    const storyTracks: StoryTrack[] = trackNames.map((name, idx) => {
      const detectedKey = detectKeyFromAudioOrMetadata(name);
      const role = roles[idx % roles.length];
      const bpm = baseBpm + (idx % 5) * 1.5;

      return {
        trackIndex: idx,
        title: name,
        targetBpm: Math.round(bpm * 10) / 10,
        targetKey: detectedKey || '8A',
        performanceRole: role,
        liveInstruction: instructions[idx % instructions.length],
        isAiRecommendation: false,
      };
    });

    // Add 1 AI recommendation if less than 6 tracks
    if (storyTracks.length < 6) {
      storyTracks.push({
        trackIndex: storyTracks.length,
        title: 'Deep Hypnotic Pulse (AI Curated Peak)',
        artist: 'STEMSDINGS Neural Labs',
        targetBpm: 130.0,
        targetKey: '9A',
        performanceRole: 'PEAK_ACID',
        liveInstruction: 'Bassline Drive auf 40% sättigen und Sidechain Ducking aktivieren.',
        isAiRecommendation: true,
      });
    }

    return {
      storySummary: userStory,
      storyTracks,
      recommendedMasterBpm: storyTracks[0]?.targetBpm || 128,
      harmonicKeyProgression: storyTracks.map((t) => t.targetKey),
    };
  }

  /**
   * Injects parsed story tracks directly into the 8 Live Stem Slots of Zone A and Zone B.
   */
  public injectStoryIntoStems(
    storyTracks: StoryTrack[],
    currentStems: LiveStemItem[]
  ): LiveStemItem[] {
    if (storyTracks.length === 0) return currentStems;

    return currentStems.map((stem, idx) => {
      const assignedStoryTrack = storyTracks[idx % storyTracks.length];
      if (!assignedStoryTrack) return stem;

      return {
        ...stem,
        trackTitle: assignedStoryTrack.title,
        name: `${stem.zone}.${stem.role.toUpperCase()} // ${assignedStoryTrack.targetKey}`,
      };
    });
  }
}

export const playlistParser = new PlaylistParser();
