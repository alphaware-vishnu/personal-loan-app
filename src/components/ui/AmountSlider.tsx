import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, GestureResponderEvent, LayoutChangeEvent } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors, useTheme } from '../../theme';
import { AppText } from './AppText';

export interface AmountSliderProps {
  value: number;
  onValueChange: (val: number) => void;
  min: number;
  max: number;
  step?: number;
  label?: string;
  prefix?: string;
  suffix?: string;
  formatter?: (val: number) => string;
}

export const AmountSlider: React.FC<AmountSliderProps> = React.memo(({
  value,
  onValueChange,
  min,
  max,
  step = 1000,
  label,
  prefix = '₹',
  suffix = '',
  formatter = (val: number) => val.toLocaleString('en-IN'),
}) => {
  const colors = useColors();
  const { theme } = useTheme();
  
  const [trackWidth, setTrackWidth] = useState(0);
  const trackRef = useRef<View>(null);

  const percentage = (value - min) / (max - min);
  const percentageStr = `${Math.min(100, Math.max(0, percentage * 100))}%`;

  const handleIncrement = () => {
    const newValue = Math.min(max, value + step);
    if (newValue !== value) {
      triggerHaptic();
      onValueChange(newValue);
    }
  };

  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    if (newValue !== value) {
      triggerHaptic();
      onValueChange(newValue);
    }
  };

  const triggerHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
  };

  // Convert gesture coordinate to slider value
  const handleTouch = (event: GestureResponderEvent) => {
    if (trackWidth <= 0) return;
    
    const touchX = event.nativeEvent.locationX;
    const ratio = Math.max(0, Math.min(1, touchX / trackWidth));
    
    // Calculate raw value
    const rawVal = min + ratio * (max - min);
    
    // Snap to nearest step
    const stepsCount = Math.round((rawVal - min) / step);
    const snappedVal = Math.max(min, Math.min(max, min + stepsCount * step));
    
    if (snappedVal !== value) {
      triggerHaptic();
      onValueChange(snappedVal);
    }
  };

  const onTrackLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  return (
    <View style={styles.container}>
      {/* Header Info */}
      <View style={styles.header}>
        {label && (
          <AppText variant="labelSm" style={{ color: colors.textSecondary }}>
            {label}
          </AppText>
        )}
        <AppText variant="h1" style={{ color: colors.primary }}>
          {prefix}
          {formatter(value)}
          {suffix}
        </AppText>
      </View>

      {/* Main Slider Row (with fine-tuning increment/decrement CTA buttons) */}
      <View style={styles.sliderRow}>
        <TouchableOpacity
          onPress={handleDecrement}
          style={[styles.adjustButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
          activeOpacity={0.7}
        >
          <Feather name="minus" size={18} color={colors.text} />
        </TouchableOpacity>

        {/* Custom Track */}
        <View
          ref={trackRef}
          onLayout={onTrackLayout}
          onTouchStart={handleTouch}
          onTouchMove={handleTouch}
          style={[styles.trackBg, { backgroundColor: colors.borderLight }]}
        >
          {/* Active fill track */}
          <View
            style={[
              styles.trackFill,
              {
                width: percentageStr as any,
                backgroundColor: colors.primary,
              },
            ]}
          />
          {/* Custom Slider Thumb handler */}
          <View
            style={[
              styles.thumb,
              {
                left: percentageStr as any,
                backgroundColor: colors.primary,
                borderColor: colors.background,
                shadowColor: colors.shadow,
              },
            ]}
          />
        </View>

        <TouchableOpacity
          onPress={handleIncrement}
          style={[styles.adjustButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
          activeOpacity={0.7}
        >
          <Feather name="plus" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Boundary labels */}
      <View style={styles.boundaryRow}>
        <AppText variant="caption" style={{ color: colors.textSecondary }}>
          {prefix}
          {formatter(min)}
          {suffix}
        </AppText>
        <AppText variant="caption" style={{ color: colors.textSecondary }}>
          {prefix}
          {formatter(max)}
          {suffix}
        </AppText>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
  },
  adjustButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 16,
    position: 'relative',
    justifyContent: 'center',
  },
  trackFill: {
    height: '100%',
    borderRadius: 3,
    position: 'absolute',
    left: 0,
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 3,
    position: 'absolute',
    marginLeft: -11,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  boundaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 54, // aligns with slider tracks
    marginTop: 8,
  },
});
