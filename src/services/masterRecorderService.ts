import { MasterRecorderState } from '../types';
import { audioEngine } from './audioEngine';

class MasterRecorderService {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private startTime: number = 0;
  private pausedTime: number = 0;
  private timerInterval: number | null = null;
  private listeners: Set<(state: MasterRecorderState) => void> = new Set();

  private state: MasterRecorderState = {
    status: 'idle',
    duration: 0,
    audioBlob: null,
    audioUrl: null,
    mimeType: '',
    fileSizeBytes: 0,
    formattedTime: '00:00.0',
  };

  public getState(): MasterRecorderState {
    return { ...this.state };
  }

  public subscribe(listener: (state: MasterRecorderState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const currentState = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(currentState);
      } catch (err) {
        console.error('Error notifying recorder listener:', err);
      }
    });
  }

  private formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  }

  private getBestMimeType(): string {
    if (typeof MediaRecorder === 'undefined') return '';

    const candidateTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4',
      'audio/aac',
    ];

    for (const type of candidateTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return '';
  }

  public startRecording(): boolean {
    try {
      if (this.state.status === 'recording') {
        return false;
      }

      const stream = audioEngine.getMasterMediaStream();
      if (!stream) {
        console.error('Could not obtain master media stream from audio engine');
        return false;
      }

      // Cleanup old URL if any
      if (this.state.audioUrl) {
        URL.revokeObjectURL(this.state.audioUrl);
      }

      this.recordedChunks = [];
      const mimeType = this.getBestMimeType();
      const options = mimeType ? { mimeType } : undefined;

      this.mediaRecorder = options ? new MediaRecorder(stream, options) : new MediaRecorder(stream);
      this.state.mimeType = this.mediaRecorder.mimeType || mimeType || 'audio/webm';

      this.mediaRecorder.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) {
          this.recordedChunks.push(e.data);
          const totalSize = this.recordedChunks.reduce((acc, c) => acc + c.size, 0);
          this.state.fileSizeBytes = totalSize;
        }
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, {
          type: this.state.mimeType || 'audio/webm',
        });
        const url = URL.createObjectURL(blob);
        this.state.audioBlob = blob;
        this.state.audioUrl = url;
        this.state.fileSizeBytes = blob.size;
        this.state.status = 'stopped';
        this.notify();
      };

      this.startTime = performance.now();
      this.pausedTime = 0;
      this.mediaRecorder.start(250); // Collect slice every 250ms for live metering

      this.state.status = 'recording';
      this.state.duration = 0;
      this.state.audioBlob = null;
      this.state.audioUrl = null;
      this.state.fileSizeBytes = 0;
      this.state.formattedTime = '00:00.0';
      this.notify();

      // Start elapsed timer
      if (this.timerInterval !== null) {
        window.clearInterval(this.timerInterval);
      }
      this.timerInterval = window.setInterval(() => {
        if (this.state.status === 'recording') {
          const elapsed = (performance.now() - this.startTime) / 1000;
          this.state.duration = elapsed;
          this.state.formattedTime = this.formatDuration(elapsed);
          this.notify();
        }
      }, 100);

      return true;
    } catch (err) {
      console.error('Failed to start MediaRecorder:', err);
      return false;
    }
  }

  public pauseRecording(): boolean {
    if (this.mediaRecorder && this.state.status === 'recording' && this.mediaRecorder.state === 'recording') {
      try {
        this.mediaRecorder.pause();
        this.pausedTime = performance.now();
        this.state.status = 'paused';
        this.notify();
        return true;
      } catch (err) {
        console.error('Failed to pause recording:', err);
      }
    }
    return false;
  }

  public resumeRecording(): boolean {
    if (this.mediaRecorder && this.state.status === 'paused' && this.mediaRecorder.state === 'paused') {
      try {
        this.mediaRecorder.resume();
        const pauseDuration = performance.now() - this.pausedTime;
        this.startTime += pauseDuration;
        this.state.status = 'recording';
        this.notify();
        return true;
      } catch (err) {
        console.error('Failed to resume recording:', err);
      }
    }
    return false;
  }

  public stopRecording(): Promise<{ blob: Blob; url: string; duration: number } | null> {
    return new Promise((resolve) => {
      if (this.timerInterval !== null) {
        window.clearInterval(this.timerInterval);
        this.timerInterval = null;
      }

      if (!this.mediaRecorder || this.state.status === 'idle') {
        resolve(null);
        return;
      }

      const recorder = this.mediaRecorder;
      if (recorder.state !== 'inactive') {
        const originalOnStop = recorder.onstop;
        recorder.onstop = (ev: Event) => {
          if (originalOnStop) {
            originalOnStop.call(recorder, ev);
          }
          if (this.state.audioBlob && this.state.audioUrl) {
            resolve({
              blob: this.state.audioBlob,
              url: this.state.audioUrl,
              duration: this.state.duration,
            });
          } else {
            resolve(null);
          }
        };
        try {
          recorder.stop();
        } catch (err) {
          console.error('Error stopping MediaRecorder:', err);
          this.state.status = 'stopped';
          this.notify();
          resolve(null);
        }
      } else {
        this.state.status = 'stopped';
        this.notify();
        resolve(null);
      }
    });
  }

  public resetRecording() {
    if (this.timerInterval !== null) {
      window.clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch {
        // ignore
      }
    }
    if (this.state.audioUrl) {
      URL.revokeObjectURL(this.state.audioUrl);
    }
    this.recordedChunks = [];
    this.state = {
      status: 'idle',
      duration: 0,
      audioBlob: null,
      audioUrl: null,
      mimeType: '',
      fileSizeBytes: 0,
      formattedTime: '00:00.0',
    };
    this.notify();
  }

  public downloadRecording(customFilename?: string) {
    if (!this.state.audioUrl || !this.state.audioBlob) {
      console.warn('No recorded audio available to download');
      return;
    }

    const ext = this.state.mimeType.includes('ogg')
      ? 'ogg'
      : this.state.mimeType.includes('mp4')
      ? 'mp4'
      : 'webm';

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = `${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}-${now.getSeconds().toString().padStart(2, '0')}`;
    const filename = customFilename || `Schubertgrv_Master_Live_Mix_${dateStr}_${timeStr}.${ext}`;

    const anchor = document.createElement('a');
    anchor.style.display = 'none';
    anchor.href = this.state.audioUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();

    setTimeout(() => {
      document.body.removeChild(anchor);
    }, 150);
  }
}

export const masterRecorderService = new MasterRecorderService();
