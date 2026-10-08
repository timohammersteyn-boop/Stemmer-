/**
 * Audio Analysis Service
 * Calculates True Peak and Peak RMS of audio files to suggest optimal Gain Compensation
 * ensuring uniform perceived loudness across all tracks (Reference: -14.0 dB RMS / DJ Club Standard).
 */

import { TrackData } from '../types';

export interface AudioAnalysisResult {
  fileName: string;
  duration: number; // in seconds
  sampleRate: number;
  channels: number;
  peakDb: number; // True Peak in dBFS (e.g. -0.4 dBFS)
  peakRmsDb: number; // Peak RMS in dBFS (e.g. -16.2 dBFS)
  integratedRmsDb: number; // Full-track integrated RMS
  targetRmsDb: number; // -14.0 dBFS
  suggestedGainDb: number; // Optimal gain compensation in dB (e.g. +2.2 dB)
  waveform: number[]; // 48 normalized bars (0-100) for UI preview
}

export const TARGET_RMS_DB = -14.0;
export const MAX_PEAK_CEILING_DB = -0.3;

/**
 * Converts a linear amplitude value [0..1] to dBFS
 */
export function linearToDb(linear: number): number {
  if (linear <= 0.00001) return -96.0;
  return 20 * Math.log10(linear);
}

/**
 * Converts dBFS to linear amplitude multiplier
 */
export function dbToLinear(db: number): number {
  return Math.pow(10, db / 20);
}

/**
 * Analyzes an AudioBuffer in real-time or offline to extract Peak, Peak RMS, and Suggested Gain
 */
export function analyzeAudioBuffer(
  audioBuffer: AudioBuffer,
  fileName: string = 'Imported Track'
): AudioAnalysisResult {
  const numChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const sampleRate = audioBuffer.sampleRate;
  const duration = audioBuffer.duration;

  // Window size for local RMS (approx. 50ms block, e.g. 2048 samples at 44.1kHz)
  const windowSize = Math.max(512, Math.min(4096, Math.floor(sampleRate * 0.05)));

  let truePeak = 0;
  let totalSumOfSquares = 0;
  let maxWindowRms = 0;

  // Temporary channel pointers
  const channelsData: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channelsData.push(audioBuffer.getChannelData(c));
  }

  // Generate waveform preview bins (48 bars)
  const waveformBins = 48;
  const samplesPerBin = Math.floor(length / waveformBins);
  const rawWaveform: number[] = new Array(waveformBins).fill(0);

  // Iterate over samples
  let windowSumOfSquares = 0;
  let windowCount = 0;

  for (let i = 0; i < length; i++) {
    // Average amplitude across stereo / multi-channels
    let sampleAvg = 0;
    for (let c = 0; c < numChannels; c++) {
      const sample = channelsData[c][i];
      const absSample = Math.abs(sample);
      if (absSample > truePeak) {
        truePeak = absSample;
      }
      sampleAvg += sample;
    }
    sampleAvg /= numChannels;

    const sq = sampleAvg * sampleAvg;
    totalSumOfSquares += sq;
    windowSumOfSquares += sq;
    windowCount++;

    // Calculate window RMS
    if (windowCount >= windowSize || i === length - 1) {
      const windowRms = Math.sqrt(windowSumOfSquares / windowCount);
      if (windowRms > maxWindowRms) {
        maxWindowRms = windowRms;
      }
      windowSumOfSquares = 0;
      windowCount = 0;
    }

    // Bin for visual waveform
    const binIdx = Math.min(waveformBins - 1, Math.floor(i / samplesPerBin));
    if (Math.abs(sampleAvg) > rawWaveform[binIdx]) {
      rawWaveform[binIdx] = Math.abs(sampleAvg);
    }
  }

  const integratedRms = Math.sqrt(totalSumOfSquares / Math.max(1, length));

  // Convert to dB
  const peakDb = Math.round(linearToDb(truePeak) * 10) / 10;
  const peakRmsDb = Math.round(linearToDb(maxWindowRms) * 10) / 10;
  const integratedRmsDb = Math.round(linearToDb(integratedRms) * 10) / 10;

  // Calculate suggested gain compensation:
  // e.g. Target -14dB, Peak RMS -18dB => Suggested Gain +4dB
  // Safety headroom: ensure Peak + Gain does NOT exceed MAX_PEAK_CEILING_DB (-0.3dB)
  let rawGainDb = TARGET_RMS_DB - peakRmsDb;
  const maxSafeGainDb = MAX_PEAK_CEILING_DB - peakDb;

  let suggestedGainDb = Math.min(rawGainDb, maxSafeGainDb);
  // Clamp between -12 dB and +12 dB
  suggestedGainDb = Math.max(-12.0, Math.min(12.0, suggestedGainDb));
  suggestedGainDb = Math.round(suggestedGainDb * 10) / 10;

  // Normalize waveform to 0..100
  const maxWaveVal = Math.max(0.01, ...rawWaveform);
  const normalizedWaveform = rawWaveform.map((v) =>
    Math.round(Math.max(10, Math.min(100, (v / maxWaveVal) * 100)))
  );

  return {
    fileName,
    duration,
    sampleRate,
    channels: numChannels,
    peakDb,
    peakRmsDb,
    integratedRmsDb,
    targetRmsDb: TARGET_RMS_DB,
    suggestedGainDb,
    waveform: normalizedWaveform,
  };
}

/**
 * Decodes and analyzes a local audio File (WAV, MP3, AIFF, FLAC, OGG)
 */
export async function analyzeAudioFile(file: File): Promise<AudioAnalysisResult> {
  const arrayBuffer = await file.arrayBuffer();
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioCtx();

  try {
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    return analyzeAudioBuffer(audioBuffer, file.name);
  } finally {
    if (ctx.state !== 'closed') {
      try {
        await ctx.close();
      } catch {}
    }
  }
}

/**
 * Generates realistic Peak & RMS analysis for catalog tracks if not already analyzed
 */
export function getTrackAnalysis(track: TrackData): {
  peakDb: number;
  peakRmsDb: number;
  suggestedGainDb: number;
  targetRmsDb: number;
} {
  if (track.peakDb !== undefined && track.peakRmsDb !== undefined && track.gainCompensationDb !== undefined) {
    return {
      peakDb: track.peakDb,
      peakRmsDb: track.peakRmsDb,
      suggestedGainDb: track.gainCompensationDb,
      targetRmsDb: TARGET_RMS_DB,
    };
  }

  // Deterministic calculation from track ID & waveform
  let seed = 0;
  for (let i = 0; i < track.id.length; i++) {
    seed = (seed * 31 + track.id.charCodeAt(i)) & 0xfffff;
  }

  // Catalog tracks range from modern loud (-11 dB RMS) to deep / dynamic (-18 dB RMS)
  const basePeak = -0.2 - ((seed % 20) * 0.1);
  const baseRms = -12.0 - ((seed % 65) * 0.1); // -12.0 to -18.5 dBFS

  const peakDb = Math.round(basePeak * 10) / 10;
  const peakRmsDb = Math.round(baseRms * 10) / 10;

  let suggestedGain = TARGET_RMS_DB - peakRmsDb;
  const maxSafeGain = MAX_PEAK_CEILING_DB - peakDb;
  suggestedGain = Math.min(suggestedGain, maxSafeGain);
  suggestedGain = Math.max(-12, Math.min(12, Math.round(suggestedGain * 10) / 10));

  return {
    peakDb,
    peakRmsDb,
    suggestedGainDb: suggestedGain,
    targetRmsDb: TARGET_RMS_DB,
  };
}

/**
 * Automatically detects the tempo (BPM) of an AudioBuffer by analyzing
 * transient energy onsets and autocorrelation across candidate musical tempos.
 */
export function detectTempoFromAudioBuffer(audioBuffer: AudioBuffer): number {
  const sampleRate = audioBuffer.sampleRate;
  const channelData = audioBuffer.getChannelData(0);
  const length = channelData.length;

  if (length < sampleRate * 2) {
    return 128.0; // Default fallback for very short snippets
  }

  // Downsample energy envelope to ~200 Hz for fast autocorrelation
  const downsampleRate = 200;
  const step = Math.max(1, Math.floor(sampleRate / downsampleRate));
  const envelopeLength = Math.min(downsampleRate * 30, Math.floor(length / step)); // Analyze up to 30s
  const envelope = new Float32Array(envelopeLength);

  let prevSample = 0;
  for (let i = 0; i < envelopeLength; i++) {
    const rawIdx = i * step;
    let sumDiff = 0;
    for (let k = 0; k < step && rawIdx + k < length; k++) {
      const sample = Math.abs(channelData[rawIdx + k]);
      const diff = Math.max(0, sample - prevSample); // Half-wave rectified onset detection
      sumDiff += diff;
      prevSample = sample;
    }
    envelope[i] = sumDiff;
  }

  // Autocorrelation over BPM range 75 to 175 BPM
  const minLag = Math.floor((downsampleRate * 60) / 175); // ~175 BPM
  const maxLag = Math.floor((downsampleRate * 60) / 75);  // ~75 BPM

  let bestLag = 0;
  let maxCorr = -Infinity;

  for (let lag = minLag; lag <= maxLag; lag++) {
    let corr = 0;
    const testLength = envelopeLength - lag;
    for (let i = 0; i < testLength; i++) {
      corr += envelope[i] * envelope[i + lag];
    }
    if (corr > maxCorr) {
      maxCorr = corr;
      bestLag = lag;
    }
  }

  if (bestLag > 0) {
    let detectedBpm = (downsampleRate * 60) / bestLag;
    // Map half-time or double-time into DJ standard 115-165 range if applicable
    if (detectedBpm < 90) detectedBpm *= 2;
    if (detectedBpm > 180) detectedBpm /= 2;
    return Math.round(detectedBpm * 10) / 10;
  }

  return 128.0;
}

