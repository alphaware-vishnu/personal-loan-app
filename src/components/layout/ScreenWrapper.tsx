/**
 * ScreenWrapper — Consistent screen layout with safe area + theme background
 */

import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView, AnimatePresence } from 'moti';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useNetworkStatus } from '../../hooks';
import { AppText } from '../ui/AppText';

interface ScreenWrapperProps {
  children: React.ReactNode;
  /** Apply horizontal padding (default: true) */
  padded?: boolean;
  /** Background color override */
  backgroundColor?: string;
  /** Safe area edges to respect */
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  /** StatusBar style */
  statusBarStyle?: 'light-content' | 'dark-content';
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  padded = true,
  backgroundColor,
  edges = ['top', 'bottom'],
  statusBarStyle = 'dark-content',
}) => {
  const { theme } = useTheme();
  const bg = backgroundColor || theme.colors.background;
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const isOffline = !isConnected || !isInternetReachable;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={edges}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={bg} />
      
      <AnimatePresence>
        {isOffline && (
          <MotiView
            from={{ height: 0, opacity: 0 }}
            animate={{ height: 36, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'timing', duration: 250 }}
            style={[styles.offlineBanner, { backgroundColor: theme.colors.error }]}
          >
            <Feather name="wifi-off" size={14} color="#FFFFFF" style={styles.bannerIcon} />
            <AppText variant="caption" style={styles.bannerText}>
              Offline Mode — Connection lost
            </AppText>
          </MotiView>
        )}
      </AnimatePresence>

      <View style={[styles.content, padded && { paddingHorizontal: theme.screenPadding }]}>
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    overflow: 'hidden',
  },
  bannerIcon: {
    marginRight: 6,
  },
  bannerText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
