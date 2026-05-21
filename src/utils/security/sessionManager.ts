/**
 * Session Manager Utility
 * Monitors user inactivity (touches/gestures) and app background transitions.
 * Triggers a callback (logout) when inactivity exceeds the configured timeout.
 */

import { AppState, AppStateStatus } from 'react-native';
import { env } from '../../config/env';

let sessionTimer: NodeJS.Timeout | null = null;
let timeoutCallback: (() => void) | null = null;
let appStateSubscription: { remove: () => void } | null = null;
let backgroundTime = 0;
let lastActiveTime = Date.now();

export const sessionManager = {
  /**
   * Initialize the session manager with a callback to fire on timeout.
   */
  init(onTimeout: () => void) {
    timeoutCallback = onTimeout;
    this.resetTimer();
    this.startAppStateMonitoring();
  },

  /**
   * Reset the inactivity timer. Should be called on user interactions.
   */
  resetTimer() {
    lastActiveTime = Date.now();
    
    if (sessionTimer) {
      clearTimeout(sessionTimer);
    }

    const timeoutMs = env.sessionTimeoutMs || 15 * 60 * 1000;

    sessionTimer = setTimeout(() => {
      console.log('[SessionManager] Session inactive. Triggering timeout...');
      if (timeoutCallback) {
        timeoutCallback();
      }
    }, timeoutMs);
  },

  /**
   * Get the timestamp of the last recorded user interaction.
   */
  getLastActiveTime() {
    return lastActiveTime;
  },

  /**
   * Monitor transitions between active, background, and inactive app states.
   */
  startAppStateMonitoring() {
    if (appStateSubscription) return;

    appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background') {
        backgroundTime = Date.now();
      } else if (nextAppState === 'active') {
        const timeSpentInBackground = Date.now() - backgroundTime;
        const timeoutMs = env.sessionTimeoutMs || 15 * 60 * 1000;
        
        if (backgroundTime > 0 && timeSpentInBackground > timeoutMs) {
          console.log('[SessionManager] Timeout exceeded in background. Triggering timeout...');
          if (timeoutCallback) {
            timeoutCallback();
          }
        } else {
          this.resetTimer();
        }
        backgroundTime = 0;
      }
    });
  },

  /**
   * Stop session timers and listeners.
   */
  destroy() {
    if (sessionTimer) {
      clearTimeout(sessionTimer);
      sessionTimer = null;
    }
    if (appStateSubscription) {
      appStateSubscription.remove();
      appStateSubscription = null;
    }
    timeoutCallback = null;
  }
};