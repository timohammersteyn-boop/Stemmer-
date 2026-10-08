/**
 * Tactile Haptic Vibration Feedback Engine (Vibration API)
 * Provides crisp, subtle mechanical click feedback on mobile/touch DJ interactions.
 */

export type HapticType = 'tap' | 'nudge' | 'cue' | 'heavy' | 'double' | 'error';

let isHapticGloballyEnabled = true;

export function setHapticsEnabled(enabled: boolean) {
  isHapticGloballyEnabled = enabled;
  try {
    localStorage.setItem('schubertgrv_haptics_enabled', enabled ? 'true' : 'false');
  } catch {
    // Ignore storage errors
  }
}

export function isHapticsEnabled(): boolean {
  try {
    const stored = localStorage.getItem('schubertgrv_haptics_enabled');
    if (stored !== null) {
      return stored === 'true';
    }
  } catch {
    // Fallback
  }
  return isHapticGloballyEnabled;
}

export function triggerHaptic(type: HapticType = 'tap', forceEnabled?: boolean) {
  const allowed = forceEnabled !== undefined ? forceEnabled : isHapticsEnabled();
  if (!allowed) return;

  if (typeof window === 'undefined' || typeof navigator === 'undefined' || !navigator.vibrate) {
    return;
  }

  try {
    switch (type) {
      case 'tap':
        // Crisp 10ms click
        navigator.vibrate(10);
        break;
      case 'nudge':
        // 14ms tactile nudge tick
        navigator.vibrate(14);
        break;
      case 'cue':
        // Double-pulse cue trigger
        navigator.vibrate([15, 20, 20]);
        break;
      case 'heavy':
        // 30ms prominent motor strike
        navigator.vibrate(30);
        break;
      case 'double':
        navigator.vibrate([12, 25, 12]);
        break;
      case 'error':
        navigator.vibrate([20, 30, 20, 30, 20]);
        break;
    }
  } catch {
    // Gracefully handle browser security context restrictions
  }
}
