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
  notchColor = '#ffffff',
  colors,
}) => {
  const themeColors = useColors();
  const defaultBg = themeColors.surface;

  return (
    <View style={[styles.notchedCard, { backgroundColor: colors ? 'transparent' : defaultBg }, style]}>
      {colors && (
        <LinearGradient
          colors={colors}
          style={[StyleSheet.absoluteFill, { borderRadius: 32 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}

      {/* Improved Notch with smooth shoulders */}
      <View style={styles.notchContainer}>
        <View
          style={[
            styles.notchShoulder,
            styles.notchShoulderLeft,
            { backgroundColor: colors ? colors[0] : defaultBg },
          ]}
        />
        <View style={[styles.notch, { backgroundColor: notchColor }]} />
        <View
          style={[
            styles.notchShoulder,
            styles.notchShoulderRight,
            { backgroundColor: colors ? colors[1] || colors[0] : defaultBg },
          ]}
        />
      </View>

      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  notchedCard: {
    borderRadius: 32,
    padding: 24,
    position: 'relative',
    overflow: 'visible',
  },
  notchContainer: {
    position: 'absolute',
    top: -1,
    left: 0,
    right: 0,
    height: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    zIndex: 20,
  },
  notch: {
    width: 120,
    height: 22,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  notchShoulder: {
    width: 16,
    height: 16,
  },
  notchShoulderLeft: {
    borderTopRightRadius: 16,
    marginRight: -0.5, // Bleed over to prevent gap
  },
  notchShoulderRight: {
    borderTopLeftRadius: 16,
    marginLeft: -0.5, // Bleed over to prevent gap
  },
  content: {
    flex: 1,
    paddingTop: 10,
    zIndex: 10,
  },
});
