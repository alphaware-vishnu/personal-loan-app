import { useState, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';

/**
 * Custom hook to subscribe to React Native AppState updates.
 * Exposes current state: 'active' | 'background' | 'inactive' (iOS).
 */
export function useAppState(): AppStateStatus {
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      setAppState(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return appState;
}
