/**
 * ProfileCompletionScreen — Minimalistic celebration screen
 * Displays undraw success illustration, key status badges, and continue CTA.
 */

import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { SvgXml } from 'react-native-svg';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { useColors, useTheme } from '../../theme';
import { AppText } from '../../components/ui/AppText';
import { AppButton } from '../../components/ui/AppButton';
import { ILLUSTRATIONS } from '../../assets/illustrations';

const { width, height } = Dimensions.get('window');

interface ProfileCompletionScreenProps {
  onContinue: () => void;
}

export const ProfileCompletionScreen: React.FC<ProfileCompletionScreenProps> = ({ onContinue }) => {
  const colors = useColors();
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Illustration Container */}
          <MotiView
            from={{ opacity: 0, scale: 0.8, translateY: -20 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, delay: 100 }}
            style={styles.illustrationWrapper}
          >
            <SvgXml
              xml={ILLUSTRATIONS.actionSuccessful}
              width={width * 0.75}
              height={width * 0.58}
            />
          </MotiView>

          {/* Celebration Header */}
          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 300 }}
            style={styles.textContainer}
          >
            <AppText variant="h1" style={[styles.title, { color: colors.text }]}>
              Profile Completed!
            </AppText>
            <AppText
              variant="bodyMd"
              style={[styles.subtitle, { color: colors.textSecondary }]}
            >
              Your identity, employment, and address details have been successfully verified. Let's set up your income next.
            </AppText>
          </MotiView>

          {/* Minimalist Verified Badges */}
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 500 }}
            style={styles.badgesWrapper}
          >
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: isDark ? 'rgba(16,185,129,0.08)' : '#ECFDF5',
                  borderColor: isDark ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.15)',
                },
              ]}
            >
              <Ionicons name="shield-checkmark" size={16} color={colors.success} />
              <AppText variant="caption" style={[styles.badgeText, { color: colors.success }]}>
                PAN Verified
              </AppText>
            </View>

            <View
              style={[
                styles.badge,
                {
                  backgroundColor: isDark ? 'rgba(16,185,129,0.08)' : '#ECFDF5',
                  borderColor: isDark ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.15)',
                },
              ]}
            >
              <Ionicons name="location" size={16} color={colors.success} />
              <AppText variant="caption" style={[styles.badgeText, { color: colors.success }]}>
                Address Linked
              </AppText>
            </View>

            <View
              style={[
                styles.badge,
                {
                  backgroundColor: isDark ? 'rgba(16,185,129,0.08)' : '#ECFDF5',
                  borderColor: isDark ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.15)',
                },
              ]}
            >
              <Ionicons name="briefcase" size={16} color={colors.success} />
              <AppText variant="caption" style={[styles.badgeText, { color: colors.success }]}>
                Work Synced
              </AppText>
            </View>
          </MotiView>

          {/* Action button */}
          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 650 }}
            style={styles.actionContainer}
          >
            <AppButton
              title="Continue to Income Setup"
              onPress={onContinue}
              style={styles.button}
            />
          </MotiView>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: height * 0.05,
    paddingBottom: 24,
  },
  illustrationWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 36,
    paddingHorizontal: 12,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '900',
    fontSize: 28,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
  badgesWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 48,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  badgeText: {
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.2,
  },
  actionContainer: {
    width: '100%',
    marginTop: 'auto',
  },
  button: {
    width: '100%',
  },
});