import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '../../theme';

interface NotchedCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  notchColor?: string;
  colors?: readonly [string, string, ...string[]];
}

export const NotchedCard: React.FC<NotchedCardProps> = ({
  children,
  style,
  colors,
}) => {
  const themeColors = useColors();
  const defaultBg = themeColors.surface;

  return (
    <View style={[styles.notchedCard, { backgroundColor: colors ? 'transparent' : defaultBg }, style]}>
      {colors && (
        <LinearGradient
          colors={colors}
          style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}

      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  notchedCard: {
    borderRadius: 24,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    zIndex: 10,
  },
});
