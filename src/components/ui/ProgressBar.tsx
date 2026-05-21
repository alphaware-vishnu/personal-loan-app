import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { useColors } from '../../theme';

export interface ProgressBarProps {
  progress: number; // 0 to 1
  segments?: number; // Optional: If provided, renders segmented progress
  variant?: 'linear' | 'segmented';
  height?: number;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  segments,
  variant = 'linear',
  height = 6,
  style,
}) => {
  const colors = useColors();
  const animatedValue = useRef(new Animated.Value(progress)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: Math.max(0, Math.min(1, progress)),
      duration: 350,
      useNativeDriver: false, // width/flex animations don't support native driver
    }).start();
  }, [progress, animatedValue]);

  if (variant === 'segmented' && segments && segments > 1) {
    const activeSegment = Math.floor(progress * segments);
    
    return (
      <View style={[styles.segmentedContainer, { height }, style]}>
        {Array.from({ length: segments }).map((_, index) => {
          let segmentColor = colors.borderLight;
          if (index < activeSegment) {
            segmentColor = colors.primary;
          } else if (index === activeSegment) {
            segmentColor = colors.primaryLight; // Current active step background
          }

          const isCurrent = index === activeSegment;

          return (
            <View
              key={index}
              style={[
                styles.segment,
                {
                  backgroundColor: segmentColor,
                  borderRadius: height / 2,
                  flex: 1,
                  marginHorizontal: 2,
                },
                isCurrent && {
                  borderColor: colors.primary,
                  borderWidth: 0.5,
                }
              ]}
            />
          );
        })}
      </View>
    );
  }

  // Linear variant
  const widthInterpolate = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View
      style={[
        styles.linearTrack,
        {
          height,
          backgroundColor: colors.borderLight,
          borderRadius: height / 2,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.linearFill,
          {
            height,
            backgroundColor: colors.primary,
            borderRadius: height / 2,
            width: widthInterpolate,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  segmentedContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  segment: {
    height: '100%',
  },
  linearTrack: {
    width: '100%',
    overflow: 'hidden',
  },
  linearFill: {
    width: '0%',
  },
});
