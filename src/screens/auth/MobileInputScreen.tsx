import React from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { Feather, Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useColors, useTheme } from '../../theme';
import { AppText } from '../../components/ui/AppText';
import { AppInput } from '../../components/ui/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { sendOtp } from '../../services/authService';
import Toast from 'react-native-toast-message';
import { MeshBackground } from '@/components';

interface MobileInputScreenProps {
  mobile: string;
  setMobile: (mobile: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const MobileInputScreen: React.FC<MobileInputScreenProps> = ({
  mobile,
  setMobile,
  onNext,
  onBack,
}) => {
  const colors = useColors();
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  const sendOtpMutation = useMutation({
    mutationFn: (phone: string) => sendOtp(phone),
    onSuccess: () => {
      onNext();
    },
    onError: (error: any) => {
      const errorMsg =
        error?.response?.data?.message ||
        'Unable to send OTP. Proceeding in demo mode.';
      Toast.show({
        type: 'info',
        text1: 'OTP Info',
        text2: errorMsg,
        position: 'top',
      });
      onNext();
    },
  });

  const handleSubmit = () => {
    if (mobile.length !== 10) return;
    sendOtpMutation.mutate(`${mobile}`);
  };

  return (
    <MeshBackground style={styles.container}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: 'transparent' }]}
        edges={['top', 'bottom']}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.flex, { backgroundColor: 'transparent' }]}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            style={{ backgroundColor: 'transparent' }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
          {/* Back Button */}
          <TouchableOpacity
            onPress={onBack}
            style={[
              styles.backButton,
              {
                backgroundColor: isDark
                  ? 'rgba(255,255,255,0.06)'
                  : colors.backgroundSecondary,
                borderColor: isDark
                  ? 'rgba(255,255,255,0.08)'
                  : colors.border,
              },
            ]}
          >
            <Ionicons name="arrow-back" size={18} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.content}>
            {/* Icon */}
            <MotiView
              from={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', delay: 100, damping: 15 }}
            >
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: isDark
                      ? 'rgba(99,102,241,0.12)'
                      : `${colors.primaryLight}`,
                    borderColor: isDark
                      ? 'rgba(99,102,241,0.2)'
                      : 'transparent',
                    borderWidth: isDark ? 1 : 0,
                  },
                ]}
              >
                <Feather name="smartphone" size={36} color={colors.primary} />
              </View>
            </MotiView>

            {/* Title / Subtitle */}
            <MotiView
              from={{ opacity: 0, translateY: 15 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500, delay: 200 }}
            >
              <AppText variant="h2" style={[styles.title, { color: colors.text }]}>
                Welcome! Let's get started
              </AppText>
              <AppText
                variant="bodyMd"
                style={[styles.subtitle, { color: colors.textSecondary }]}
              >
                Enter your mobile number to sign in or create an account.
              </AppText>
            </MotiView>

            {/* Input field */}
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500, delay: 350 }}
            >
              <AppInput
                label="Mobile Number"
                placeholder="98765 43210"
                value={mobile}
                onChangeText={(text) =>
                  setMobile(text.replace(/[^0-9]/g, '').slice(0, 10))
                }
                keyboardType="number-pad"
                maxLength={10}
                leftIcon={
                  <View style={styles.prefixContainer}>
                    <AppText
                      variant="bodyLg"
                      style={[styles.prefix, { color: colors.text }]}
                    >
                      🇮🇳
                    </AppText>
                    <AppText
                      variant="bodyMd"
                      style={[styles.prefixCode, { color: colors.textSecondary }]}
                    >
                      +91
                    </AppText>
                    <View
                      style={[
                        styles.prefixDivider,
                        {
                          backgroundColor: isDark
                            ? 'rgba(255,255,255,0.1)'
                            : colors.border,
                        },
                      ]}
                    />
                  </View>
                }
                error={
                  mobile.length > 0 && mobile.length !== 10
                    ? 'Enter a valid 10-digit mobile number'
                    : undefined
                }
              />
            </MotiView>

            {/* Action button */}
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500, delay: 450 }}
            >
              <AppButton
                title="Get OTP"
                onPress={handleSubmit}
                disabled={mobile.length !== 10}
                loading={sendOtpMutation.isPending}
                style={styles.submitButton}
              />
            </MotiView>

            {/* Trust badge */}
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 500, delay: 600 }}
              style={[
                styles.trustBadge,
                {
                  backgroundColor: isDark
                    ? 'rgba(255,255,255,0.04)'
                    : colors.backgroundSecondary,
                  borderColor: isDark
                    ? 'rgba(255,255,255,0.06)'
                    : colors.border,
                },
              ]}
            >
              <Feather
                name="lock"
                size={13}
                color={colors.success}
                style={{ marginRight: 6 }}
              />
              <AppText
                variant="caption"
                style={[styles.trustText, { color: colors.textTertiary }]}
              >
                Secured by 256-bit encryption
              </AppText>
            </MotiView>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </MeshBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  backButton: {
    marginTop: 12,
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  content: {
    flex: 1,
    paddingTop: 36,
    paddingBottom: 24,
  },
  iconContainer: {
    width: 76,
    height: 76,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    marginBottom: 10,
    fontWeight: '800',
  },
  subtitle: {
    marginBottom: 32,
    lineHeight: 22,
  },
  prefixContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
  },
  prefix: {
    fontSize: 18,
    marginRight: 4,
  },
  prefixCode: {
    fontWeight: '600',
    fontSize: 14,
  },
  prefixDivider: {
    width: 1,
    height: 20,
    marginLeft: 10,
  },
  submitButton: {
    marginTop: 20,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'center',
  },
  trustText: {
    fontSize: 11,
    fontWeight: '600',
  },
});