import { useState, useEffect } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
}

/**
 * Custom hook to monitor device internet connection status.
 * Gracefully handles both Web and Native platforms.
 * Re-verifies connectivity on AppState foreground transition.
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
  });

  useEffect(() => {
    let active = true;

    const checkConnectivity = async () => {
      if (Platform.OS === 'web') {
        const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
        if (active) {
          setStatus({ isConnected: online, isInternetReachable: online });
        }
        return;
      }

      try {
        // Perform a lightweight network ping to verify actual internet reachability
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch('https://clients3.google.com/generate_204', {
          signal: controller.signal,
          cache: 'no-store',
        });
        
        clearTimeout(timeoutId);
        
        const isOnline = response.status >= 200 && response.status < 400;
        if (active) {
          setStatus({ isConnected: true, isInternetReachable: isOnline });
        }
      } catch (err) {
        if (active) {
          setStatus({ isConnected: false, isInternetReachable: false });
        }
      }
    };

    // Web-specific event listeners
    let webOnlineListener: (() => void) | undefined;
    let webOfflineListener: (() => void) | undefined;

    if (Platform.OS === 'web') {
      webOnlineListener = () => setStatus({ isConnected: true, isInternetReachable: true });
      webOfflineListener = () => setStatus({ isConnected: false, isInternetReachable: false });
      window.addEventListener('online', webOnlineListener);
      window.addEventListener('offline', webOfflineListener);
    }

    // AppState listener for native targets (recheck connection when user returns to app)
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkConnectivity();
      }
    };

    const appStateSub = AppState.addEventListener('change', handleAppStateChange);

    // Run initial check
    checkConnectivity();

    // Check periodically every 15 seconds to catch dropouts
    const interval = setInterval(checkConnectivity, 15000);

    return () => {
      active = false;
      clearInterval(interval);
      appStateSub.remove();
      if (Platform.OS === 'web') {
        if (webOnlineListener) window.removeEventListener('online', webOnlineListener);
        if (webOfflineListener) window.removeEventListener('offline', webOfflineListener);
      }
    };
  }, []);

  return status;
}
