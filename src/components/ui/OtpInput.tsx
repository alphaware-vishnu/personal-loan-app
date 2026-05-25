import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useColors, useTheme } from '../../theme';
import { AppText } from './AppText';

export interface OtpInputProps {
  code: string;
  onChangeCode: (code: string) => void;
  length?: number;
  autoFocus?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  code,
  onChangeCode,
  length = 4,
  autoFocus = true,
}) => {
  const colors = useColors();
  const { theme } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);

  const cellSize = length > 4 ? 44 : 60;
  const cellGap = length > 4 ? 8 : 16;

  // Trigger haptic feedback when code length changes (meaning a digit was entered/deleted)
  useEffect(() => {
    if (code.length > 0) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        // Fallback
      }
    }
  }, [code.length]);

  const handlePress = () => {
    inputRef.current?.focus();
  };

  const handleTextChange = (text: string) => {
    // Keep only numeric characters
    const cleanText = text.replace(/[^0-9]/g, '');
    if (cleanText.length <= length) {
      onChangeCode(cleanText);
    }
  };

  const renderCells = () => {
    const cells = [];
    for (let i = 0; i < length; i++) {
      const char = code[i] || '';
      const isCurrent = i === code.length;
      const isLast = i === length - 1;
      const isCodeComplete = code.length === length;
      const activeStyle = isCurrent && isFocused;

      cells.push(
        <View
          key={i}
          style={[
            styles.cell,
            {
              width: cellSize,
              height: cellSize,
              borderColor: activeStyle
                ? colors.primary
                : colors.border,
              backgroundColor: activeStyle
                ? colors.background
                : colors.backgroundSecondary,
              borderRadius: theme.radii.lg,
            },
            activeStyle && styles.activeCell,
          ]}
        >
          <AppText
            variant="h2"
            style={[styles.cellText, { color: char ? colors.text : colors.textSecondary }]}
          >
            {char}
          </AppText>
        </View>
      );
    }
    return cells;
  };

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      <View style={[styles.cellsContainer, { gap: cellGap }]}>{renderCells()}</View>
      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        value={code}
        onChangeText={handleTextChange}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus={autoFocus}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        caretHidden={true}
        underlineColorAndroid="transparent"
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 12,
    position: 'relative',
  },
  cellsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    width: '100%',
  },
  cell: {
    width: 60,
    height: 60,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeCell: {
    borderWidth: 2,
  },
  cellText: {
    textAlign: 'center',
  },
  hiddenInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.01,
    color: 'transparent',
    backgroundColor: 'transparent',
  },
});
