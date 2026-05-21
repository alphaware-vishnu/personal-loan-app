import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, ViewStyle } from 'react-native';
import { useColors } from '../../theme';

export type SkeletonShape = 'rect' | 'circle' | 'text';

export interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  shape?: SkeletonShape;
  style?: ViewStyle;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  shape = 'rect',
  style,
}) => {
  const colors = useColors();
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const getBorderRadius = () => {
    if (shape === 'circle') {
      return typeof width === 'number' ? width / 2 : 9999;
    }
    if (shape === 'text') {
      return 6;
    }
    return 12; // default rect radius
  };

  const loaderStyle = [
    {
      width,
      height: shape === 'text' ? 14 : height,
      borderRadius: getBorderRadius(),
      backgroundColor: colors.surfacePressed,
      opacity: pulseAnim,
    },
    style,
  ];

  return <Animated.View style={loaderStyle as any} />;
};

export interface SkeletonFormProps {
  rows?: number;
  style?: ViewStyle;
}

export const SkeletonForm: React.FC<SkeletonFormProps> = ({ rows = 3, style }) => {
  return (
    <View style={[styles.formContainer, style]}>
      {Array.from({ length: rows }).map((_, index) => (
        <View key={index} style={styles.formRow}>
          <SkeletonLoader shape="text" width={80} style={{ marginBottom: 8 }} />
          <SkeletonLoader shape="rect" height={48} style={{ marginBottom: 16 }} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    width: '100%',
  },
  formRow: {
    width: '100%',
    marginBottom: 16,
  },
});