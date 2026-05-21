import { useState, useEffect } from 'react';
import { Keyboard, KeyboardEvent } from 'react-native';

/**
 * Custom hook to track whether keyboard is visible and its exact pixel height.
 * Helps with custom layout positioning, scrolling offsets, and spacing adjustments.
 */
export function useKeyboard() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', (e: KeyboardEvent) => {
      setKeyboardHeight(e.endCoordinates.height);
      setKeyboardVisible(true);
    });
    
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return { keyboardHeight, isKeyboardVisible };
}
