/**
 * Utility for providing haptic feedback on scan events.
 */

export function triggerHaptic(pattern: number | number[] = 50): void {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Ignore vibration errors (e.g. strict policy, desktop)
    }
  }
}

export function triggerHapticSuccess(): void {
  triggerHaptic([50, 50, 50]); // Double pulse for success
}

export function triggerHapticError(): void {
  triggerHaptic([100, 50, 100, 50, 200]); // Longer error pattern
}
