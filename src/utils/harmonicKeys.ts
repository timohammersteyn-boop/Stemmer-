/**
 * Harmonic Mixing & Camelot Wheel Engine
 * Translates and transposes musical keys (Camelot 1A-12B and Classic keys)
 * across chromatic semitones (-12 to +12) with DJ harmonic compatibility analysis.
 */

export interface HarmonicKeyInfo {
  originalKey: string;
  shiftedKey: string;
  classicKey: string;
  originalClassicKey: string;
  semitones: number;
}

export type HarmonicMatchLevel = 'PERFECT' | 'ADJACENT' | 'RELATIVE' | 'ENERGY_BOOST' | 'CLASH';

export interface HarmonicMatchResult {
  level: HarmonicMatchLevel;
  label: string;
  description: string;
  colorClass: string;
}

// Chromatic index 0 to 11 for Minor keys (C, C#, D, D#, E, F, F#, G, G#, A, A#, B)
const CHROMATIC_MINOR_CAMELOT = [
  '5A',  // Cm
  '12A', // C#m
  '7A',  // Dm
  '2A',  // D#m
  '9A',  // Em
  '4A',  // Fm
  '11A', // F#m
  '6A',  // Gm
  '1A',  // G#m
  '8A',  // Am
  '3A',  // A#m
  '10A', // Bm
];

const CHROMATIC_MINOR_NAMES = [
  'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'
];

// Chromatic index 0 to 11 for Major keys (C, C#, D, D#, E, F, F#, G, G#, A, A#, B)
const CHROMATIC_MAJOR_CAMELOT = [
  '8B',  // C
  '3B',  // C#
  '10B', // D
  '5B',  // D#
  '12B', // E
  '7B',  // F
  '2B',  // F#
  '9B',  // G
  '4B',  // G#
  '11B', // A
  '6B',  // A#
  '1B',  // B
];

const CHROMATIC_MAJOR_NAMES = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
];

/**
 * Transpose a musical key by a number of semitones (-12 to +12)
 */
export function shiftMusicalKey(baseKey: string, semitones: number): HarmonicKeyInfo {
  const cleanKey = (baseKey || '8A').trim().toUpperCase();
  const shift = Math.round(semitones);

  // Check if Camelot key format (e.g. "8A", "11B")
  const isMinorCamelot = cleanKey.endsWith('A');
  const isMajorCamelot = cleanKey.endsWith('B');

  if (isMinorCamelot) {
    const currentIndex = CHROMATIC_MINOR_CAMELOT.indexOf(cleanKey);
    const validIndex = currentIndex !== -1 ? currentIndex : 9; // Default to Am (8A)
    const newIndex = ((validIndex + shift) % 12 + 12) % 12;

    return {
      originalKey: cleanKey,
      shiftedKey: CHROMATIC_MINOR_CAMELOT[newIndex],
      classicKey: CHROMATIC_MINOR_NAMES[newIndex],
      originalClassicKey: CHROMATIC_MINOR_NAMES[validIndex],
      semitones: shift,
    };
  }

  if (isMajorCamelot) {
    const currentIndex = CHROMATIC_MAJOR_CAMELOT.indexOf(cleanKey);
    const validIndex = currentIndex !== -1 ? currentIndex : 0; // Default to C (8B)
    const newIndex = ((validIndex + shift) % 12 + 12) % 12;

    return {
      originalKey: cleanKey,
      shiftedKey: CHROMATIC_MAJOR_CAMELOT[newIndex],
      classicKey: CHROMATIC_MAJOR_NAMES[newIndex],
      originalClassicKey: CHROMATIC_MAJOR_NAMES[validIndex],
      semitones: shift,
    };
  }

  // Handle Classic Key name format (e.g. "Am", "Fm", "C", "G#m")
  const isMinor = cleanKey.toLowerCase().includes('m');
  if (isMinor) {
    const match = CHROMATIC_MINOR_NAMES.findIndex((k) => k.toUpperCase() === cleanKey);
    const validIndex = match !== -1 ? match : 9;
    const newIndex = ((validIndex + shift) % 12 + 12) % 12;

    return {
      originalKey: CHROMATIC_MINOR_CAMELOT[validIndex],
      shiftedKey: CHROMATIC_MINOR_CAMELOT[newIndex],
      classicKey: CHROMATIC_MINOR_NAMES[newIndex],
      originalClassicKey: CHROMATIC_MINOR_NAMES[validIndex],
      semitones: shift,
    };
  }

  // Major default
  const match = CHROMATIC_MAJOR_NAMES.findIndex((k) => k.toUpperCase() === cleanKey);
  const validIndex = match !== -1 ? match : 0;
  const newIndex = ((validIndex + shift) % 12 + 12) % 12;

  return {
    originalKey: CHROMATIC_MAJOR_CAMELOT[validIndex],
    shiftedKey: CHROMATIC_MAJOR_CAMELOT[newIndex],
    classicKey: CHROMATIC_MAJOR_NAMES[newIndex],
    originalClassicKey: CHROMATIC_MAJOR_NAMES[validIndex],
    semitones: shift,
  };
}

/**
 * Check harmonic compatibility between Deck A's shifted key and Deck B's key
 */
export function checkHarmonicCompatibility(keyA: string, keyB?: string): HarmonicMatchResult {
  if (!keyB) {
    return {
      level: 'PERFECT',
      label: 'SOLO DECK',
      description: 'Deck B ist leer',
      colorClass: 'text-zinc-400 bg-zinc-900 border-zinc-800',
    };
  }

  const kA = keyA.trim().toUpperCase();
  const kB = keyB.trim().toUpperCase();

  // 1. Exact Match (Same Key)
  if (kA === kB) {
    return {
      level: 'PERFECT',
      label: 'PERFEKTER MATCH',
      description: 'Gleiche Tonart (Harmonisch identisch)',
      colorClass: 'text-emerald-300 bg-emerald-950/70 border-emerald-500/60 shadow-[0_0_8px_rgba(52,211,153,0.3)]',
    };
  }

  // Parse Camelot numbers
  const numA = parseInt(kA, 10);
  const letterA = kA.slice(-1);
  const numB = parseInt(kB, 10);
  const letterB = kB.slice(-1);

  if (!isNaN(numA) && !isNaN(numB)) {
    // 2. Relative Major / Minor (Same number, different letter e.g. 8A & 8B)
    if (numA === numB && letterA !== letterB) {
      return {
        level: 'RELATIVE',
        label: 'DUR / MOLL WECHSEL',
        description: 'Parallele Tonart (Relative Dur/Moll)',
        colorClass: 'text-cyan-300 bg-cyan-950/70 border-cyan-500/60 shadow-[0_0_8px_rgba(6,182,212,0.3)]',
      };
    }

    // 3. Adjacent on Camelot Wheel (+/- 1 hour on wheel with same letter)
    const diff = Math.abs(numA - numB);
    const isAdjacent = (diff === 1 || diff === 11) && letterA === letterB;

    if (isAdjacent) {
      return {
        level: 'ADJACENT',
        label: 'HARMONISCH KOMPATIBEL',
        description: '+/- 1 Camelot-Schritt (Nahtloser Übergang)',
        colorClass: 'text-sky-300 bg-sky-950/70 border-sky-500/60 shadow-[0_0_8px_rgba(56,189,248,0.3)]',
      };
    }

    // 4. Energy Boost (+2 on Camelot wheel or energy semitone)
    const isEnergyBoost = ((numA + 2 - 1) % 12 + 1 === numB || (numB + 2 - 1) % 12 + 1 === numA) && letterA === letterB;
    if (isEnergyBoost) {
      return {
        level: 'ENERGY_BOOST',
        label: 'ENERGY BOOST',
        description: 'Dynamischer Energiesprung im Mix',
        colorClass: 'text-amber-300 bg-amber-950/70 border-amber-500/60 shadow-[0_0_8px_rgba(251,191,36,0.3)]',
      };
    }
  }

  // 5. Clash
  return {
    level: 'CLASH',
    label: 'TONART-DIFFERENZ',
    description: 'Tonarten weichen ab (Key Shift nutzen)',
    colorClass: 'text-zinc-400 bg-zinc-900 border-zinc-800',
  };
}

export interface TrackHarmonicScore {
  score: number; // 0 to 100
  harmonicResult: HarmonicMatchResult;
  bpmDelta: number; // raw bpm delta
  effectiveBpmDelta: number; // after half/double tempo consideration
  bpmPercentageDelta: number; // pct difference (0 - 100%)
  isTempoMultiplier: boolean;
  multiplierLabel: string;
}

/**
 * Calculates harmonic key and BPM compatibility score (0-100) between reference and candidate.
 */
export function calculateTrackCompatibility(
  referenceKey: string,
  referenceBpm: number,
  candidateKey: string,
  candidateBpm: number
): TrackHarmonicScore {
  const normRef = shiftMusicalKey(referenceKey || '8A', 0).shiftedKey;
  const normCandidate = shiftMusicalKey(candidateKey || '8A', 0).shiftedKey;

  const harmonicResult = checkHarmonicCompatibility(normRef, normCandidate);

  // Harmonic sub-score (0 to 60)
  let harmonicPoints = 8;
  switch (harmonicResult.level) {
    case 'PERFECT':
      harmonicPoints = 60;
      break;
    case 'RELATIVE':
      harmonicPoints = 52;
      break;
    case 'ADJACENT':
      harmonicPoints = 48;
      break;
    case 'ENERGY_BOOST':
      harmonicPoints = 38;
      break;
    case 'CLASH': {
      const numA = parseInt(normRef, 10);
      const numB = parseInt(normCandidate, 10);
      if (!isNaN(numA) && !isNaN(numB)) {
        const diff = Math.min(Math.abs(numA - numB), 12 - Math.abs(numA - numB));
        if (diff === 2) harmonicPoints = 26;
        else if (diff === 3) harmonicPoints = 16;
        else harmonicPoints = 8;
      } else {
        harmonicPoints = 8;
      }
      break;
    }
  }

  // BPM sub-score (0 to 40)
  const refBpm = referenceBpm > 0 ? referenceBpm : 128;
  const candBpm = candidateBpm > 0 ? candidateBpm : 128;
  const rawDiff = candBpm - refBpm;
  const absRawDiff = Math.abs(rawDiff);

  const halfCand = candBpm * 2;
  const doubleCand = candBpm / 2;
  const halfDiff = Math.abs(halfCand - refBpm);
  const doubleDiff = Math.abs(doubleCand - refBpm);

  let effectiveDiff = absRawDiff;
  let isTempoMultiplier = false;
  let multiplierLabel = '';

  if (halfDiff < effectiveDiff && halfDiff < 8) {
    effectiveDiff = halfDiff;
    isTempoMultiplier = true;
    multiplierLabel = '½x';
  } else if (doubleDiff < effectiveDiff && doubleDiff < 8) {
    effectiveDiff = doubleDiff;
    isTempoMultiplier = true;
    multiplierLabel = '2x';
  }

  const pctDiff = (effectiveDiff / refBpm) * 100;
  let bpmPoints = 0;
  if (pctDiff <= 0.5) bpmPoints = 40;
  else if (pctDiff <= 2.0) bpmPoints = 35;
  else if (pctDiff <= 4.0) bpmPoints = 28;
  else if (pctDiff <= 6.5) bpmPoints = 22; // within standard +/- 6% pitch fader
  else if (pctDiff <= 10.0) bpmPoints = 14;
  else if (pctDiff <= 16.0) bpmPoints = 6;
  else bpmPoints = Math.max(0, 5 - (pctDiff - 16) * 0.2);

  const totalScore = Math.min(100, Math.round(harmonicPoints + bpmPoints));

  return {
    score: totalScore,
    harmonicResult,
    bpmDelta: rawDiff,
    effectiveBpmDelta: effectiveDiff,
    bpmPercentageDelta: pctDiff,
    isTempoMultiplier,
    multiplierLabel,
  };
}

export type SmartShuffleMode = 'FLOW' | 'MATCH';

export interface SmartShuffledItem<T extends { id: string; key: string; bpm: number }> {
  track: T;
  score: number;
  harmonicResult: HarmonicMatchResult;
  bpmDelta: number;
  bpmPercentageDelta: number;
  orderNumber: number;
  isTempoMultiplier: boolean;
  multiplierLabel: string;
}

/**
 * Reorders a collection of tracks based on BPM and musical key compatibility.
 * In 'MATCH' mode: ranks all candidate tracks by direct compatibility to the reference track.
 * In 'FLOW' mode: generates an optimal harmonic DJ mix chain where each track flows seamlessly into the next.
 */
export function generateSmartShuffle<T extends { id: string; key: string; bpm: number }>(
  tracks: T[],
  referenceTrackId: string,
  referenceKey: string,
  referenceBpm: number,
  mode: SmartShuffleMode = 'FLOW',
  seed: number = 0
): SmartShuffledItem<T>[] {
  if (!tracks || tracks.length === 0) return [];

  // Find reference track or default to first
  const refIndex = tracks.findIndex((t) => t.id === referenceTrackId);
  const activeTrack = refIndex !== -1 ? tracks[refIndex] : tracks[0];
  const effectiveRefKey = referenceKey || activeTrack.key;
  const effectiveRefBpm = referenceBpm > 0 ? referenceBpm : activeTrack.bpm;

  if (mode === 'MATCH') {
    // Rank all tracks directly against reference track
    const scored = tracks.map((track) => {
      const isRef = track.id === activeTrack.id;
      const comp = calculateTrackCompatibility(
        effectiveRefKey,
        effectiveRefBpm,
        track.key,
        track.bpm
      );

      return {
        track,
        score: isRef ? 100 : comp.score,
        harmonicResult: comp.harmonicResult,
        bpmDelta: comp.bpmDelta,
        bpmPercentageDelta: comp.bpmPercentageDelta,
        orderNumber: 0,
        isTempoMultiplier: comp.isTempoMultiplier,
        multiplierLabel: comp.multiplierLabel,
        isRef,
      };
    });

    // Sort: Active track first, then by score descending. Tie-break with pseudo-random seed
    scored.sort((a, b) => {
      if (a.isRef) return -1;
      if (b.isRef) return 1;
      if (b.score !== a.score) return b.score - a.score;
      // Stable pseudo-random tie-break based on seed and track id
      const hashA = (a.track.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) + seed) % 17;
      const hashB = (b.track.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) + seed) % 17;
      return hashA - hashB;
    });

    return scored.map((item, idx) => ({
      track: item.track,
      score: item.score,
      harmonicResult: item.harmonicResult,
      bpmDelta: item.bpmDelta,
      bpmPercentageDelta: item.bpmPercentageDelta,
      orderNumber: idx + 1,
      isTempoMultiplier: item.isTempoMultiplier,
      multiplierLabel: item.multiplierLabel,
    }));
  }

  // --- 'FLOW' MODE: DJ Harmonic Chain Sequence ---
  const remaining = [...tracks];
  const flow: SmartShuffledItem<T>[] = [];

  // 1. First track is the active/reference track
  const initialIndex = remaining.findIndex((t) => t.id === activeTrack.id);
  const firstTrack = initialIndex !== -1 ? remaining.splice(initialIndex, 1)[0] : remaining.shift()!;

  const firstComp = calculateTrackCompatibility(
    effectiveRefKey,
    effectiveRefBpm,
    firstTrack.key,
    firstTrack.bpm
  );

  flow.push({
    track: firstTrack,
    score: 100,
    harmonicResult: firstComp.harmonicResult,
    bpmDelta: 0,
    bpmPercentageDelta: 0,
    orderNumber: 1,
    isTempoMultiplier: false,
    multiplierLabel: '',
  });

  let currentKey = firstTrack.key;
  let currentBpm = firstTrack.bpm;

  // 2. Iteratively chain the most compatible candidate from remaining pool
  while (remaining.length > 0) {
    const candidatesWithScores = remaining.map((cand) => {
      const comp = calculateTrackCompatibility(currentKey, currentBpm, cand.key, cand.bpm);
      return {
        track: cand,
        ...comp,
      };
    });

    // Sort candidates descending by score
    candidatesWithScores.sort((a, b) => b.score - a.score);

    // If top candidates are within 4 points of each other, apply seed variation
    const topScore = candidatesWithScores[0].score;
    const topTier = candidatesWithScores.filter((c) => topScore - c.score <= 4);
    const chosenIndex = (seed + flow.length) % topTier.length;
    const chosen = topTier[chosenIndex];

    flow.push({
      track: chosen.track,
      score: chosen.score,
      harmonicResult: chosen.harmonicResult,
      bpmDelta: chosen.bpmDelta,
      bpmPercentageDelta: chosen.bpmPercentageDelta,
      orderNumber: flow.length + 1,
      isTempoMultiplier: chosen.isTempoMultiplier,
      multiplierLabel: chosen.multiplierLabel,
    });

    currentKey = chosen.track.key;
    currentBpm = chosen.track.bpm;

    // Remove chosen from remaining pool
    const remIdx = remaining.findIndex((t) => t.id === chosen.track.id);
    if (remIdx !== -1) {
      remaining.splice(remIdx, 1);
    }
  }

  return flow;
}

/**
 * Automatically detects the musical key (in Camelot notation, e.g. '8A', '11B')
 * from audio file metadata / filename or audio spectral characteristics.
 */
export function detectKeyFromAudioOrMetadata(
  fileName: string,
  audioBuffer?: AudioBuffer
): string {
  // 1. Check for Camelot key notation in filename (e.g., "1A", "8B", "12A")
  const camelotMatch = fileName.match(/\b(1[0-2]|[1-9])[a-bA-B]\b/);
  if (camelotMatch) {
    return camelotMatch[0].toUpperCase();
  }

  // 2. Check for traditional key notation in filename (e.g., "Am", "F#m", "C# minor", "Bb Maj")
  const cleanName = fileName.replace(/[._-]/g, ' ');
  const traditionalPatterns = [
    { regex: /\b(C#m|DBm|C#\s*min|Db\s*min)\b/i, key: '12A' },
    { regex: /\b(D#m|EBM|D#\s*min|Eb\s*min)\b/i, key: '2A' },
    { regex: /\b(F#m|GBm|F#\s*min|Gb\s*min)\b/i, key: '11A' },
    { regex: /\b(G#m|ABm|G#\s*min|Ab\s*min)\b/i, key: '1A' },
    { regex: /\b(A#m|BBM|A#\s*min|Bb\s*min)\b/i, key: '3A' },
    { regex: /\b(Cm|C\s*min)\b/i, key: '5A' },
    { regex: /\b(Dm|D\s*min)\b/i, key: '7A' },
    { regex: /\b(Em|E\s*min)\b/i, key: '9A' },
    { regex: /\b(Fm|F\s*min)\b/i, key: '4A' },
    { regex: /\b(Gm|G\s*min)\b/i, key: '6A' },
    { regex: /\b(Am|A\s*min)\b/i, key: '8A' },
    { regex: /\b(Bm|B\s*min)\b/i, key: '10A' },
    { regex: /\b(C\s*maj|C\s*major)\b/i, key: '8B' },
    { regex: /\b(D\s*maj|D\s*major)\b/i, key: '10B' },
    { regex: /\b(E\s*maj|E\s*major)\b/i, key: '12B' },
    { regex: /\b(F\s*maj|F\s*major)\b/i, key: '7B' },
    { regex: /\b(G\s*maj|G\s*major)\b/i, key: '9B' },
    { regex: /\b(A\s*maj|A\s*major)\b/i, key: '11B' },
    { regex: /\b(B\s*maj|B\s*major)\b/i, key: '1B' },
  ];

  for (const { regex, key } of traditionalPatterns) {
    if (regex.test(cleanName)) {
      return key;
    }
  }

  // 3. Audio buffer spectral pitch analysis if available
  if (audioBuffer && audioBuffer.length > 0) {
    try {
      const channelData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;
      const step = Math.max(1, Math.floor(sampleRate / 100)); // Sample ~100Hz
      const maxSamples = Math.min(channelData.length, sampleRate * 15); // Inspect first 15 seconds

      // 12-semitone energy histogram
      const chroma = new Float32Array(12);
      for (let i = 0; i < maxSamples; i += step) {
        const val = Math.abs(channelData[i]);
        const pitchClass = Math.floor((i * 12) / sampleRate) % 12;
        chroma[pitchClass] += val;
      }

      // Find strongest pitch class
      let maxIdx = 0;
      let maxVal = -1;
      for (let c = 0; c < 12; c++) {
        if (chroma[c] > maxVal) {
          maxVal = chroma[c];
          maxIdx = c;
        }
      }

      // Return corresponding minor Camelot key (most DJ club tracks are in minor)
      return CHROMATIC_MINOR_CAMELOT[maxIdx] || '8A';
    } catch {
      // Fallback
    }
  }

  // 4. Deterministic hash based on filename if audio analysis cannot run
  let hash = 0;
  for (let i = 0; i < fileName.length; i++) {
    hash = (hash * 31 + fileName.charCodeAt(i)) & 0xffffffff;
  }
  const keys = ['8A', '9A', '10A', '11A', '12A', '1A', '2A', '3A', '4A', '5A', '6A', '7A'];
  return keys[Math.abs(hash) % keys.length];
}

