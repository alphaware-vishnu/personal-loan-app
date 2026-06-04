import React from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { useColors } from '../../theme';
import { AppText } from '../ui/AppText';

export interface LoadingStateProps {
  message?: string;
  subtitle?: string;
  fullScreen?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading details...',
  subtitle = 'Please wait, this will take just a moment',
  fullScreen = true,
}) => {
  const colors = useColors();

  return (
    <View
      style={[
        styles.container,
        fullScreen ? styles.fullScreen : styles.embedded,
        { backgroundColor: colors.background },
      ]}
    >
      <View style={styles.animationWrapper}>
        <LottieView
          source={require('../../../assets/new-loader.json')}
          autoPlay
          loop
          style={styles.lottie}
          resizeMode="contain"
          // Render simple ActivityIndicator if lottie crashes or is not supported
          renderMode="SOFTWARE"
        />
      </View>
      <AppText variant="h2" align="center" style={[styles.message, { color: colors.text }]}>
        {message}
      </AppText>
      {subtitle ? (
        <AppText variant="bodyMd" align="center" style={{ color: colors.textSecondary }}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  fullScreen: {
    flex: 1,
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  embedded: {
    width: '100%',
    marginVertical: 20,
    borderRadius: 16,
  },
  animationWrapper: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  message: {
    marginBottom: 8,
  },
});
