import React, { useState, useEffect } from 'react';
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
import LottieView from 'lottie-react-native';
import { useColors, useTheme } from '../../theme';
import { AppText } from '../../components/ui/AppText';
import { OtpInput } from '../../components/ui/OtpInput';
import { AppButton } from '../../components/ui/AppButton';
import { verifyOtp, sendOtp } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useLoanStore } from '../../store/loanStore';
import { useKycStore } from '../../store/kycStore';
import { useOfferStore } from '../../store/offerStore';
import { usePaymentStore } from '../../store/paymentStore';
import { usePermissionStore } from '../../store/permissionStore';
import { useUploadStore } from '../../store/uploadStore';
import Toast from 'react-native-toast-message';
import { AuthData } from '../../types/auth.type';
import { env } from '../../config/env';
import { MeshBackground } from '@/components';

interface OtpVerificationScreenProps {
  mobile: string;
  onBack: () => void;
  onVerify: (isExisting: boolean) => void;
}

const OTP_LENGTH = env.otpLength;

export const OtpVerificationScreen: React.FC<OtpVerificationScreenProps> = ({
  mobile,
  onBack,
  onVerify,
}) => {
  const colors = useColors();
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const setAuth = useAuthStore((state) => state.setAuth);

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) {
      setCanResend(true);
      return;
    }
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const verifyOtpMutation = useMutation({
    mutationFn: (data: { mobile: string; otp: string; skipOtp: boolean }) =>
      verifyOtp(data),
    onSuccess: async (response: any) => {
      const data = response?.data?.data;
      if (data && data.access_token) {
        // Reset all user-specific stores if logging in with a different mobile number
        const currentMobile = useAuthStore.getState().mobile;
        if (currentMobile !== mobile) {
          useLoanStore.getState().reset();
          useOnboardingStore.getState().reset();
          useKycStore.getState().reset();
          useOfferStore.getState().reset();
          usePaymentStore.getState().reset();
          usePermissionStore.getState().reset();
          useUploadStore.getState().reset();
        }

        const onboardingState = useOnboardingStore.getState();
        const isFirstLogin = data.isFirstLogin ?? !onboardingState.hasCompletedProfile;
        const authData: AuthData = {
          ...data,
          isFirstLogin,
        };
        // Log in the user in the secure store
        setAuth(authData, mobile);
        
        // Show success animation in button
        setIsSuccess(true);

        // Redirect after animation completes
        setTimeout(() => {
          onVerify(!isFirstLogin);
        }, 1500);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Verification Failed',
          text2: 'Server response is missing authentication token.',
        });
      }
    },
    onError: (error: any) => {
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        'Invalid OTP verification code. Please try again.';
      Toast.show({
        type: 'error',
        text1: 'Verification Failed',
        text2: errorMsg,
      });
    },
  });

  const resendOtpMutation = useMutation({
    mutationFn: (phone: string) => sendOtp(phone),
    onSuccess: () => {
      setTimer(30);
      setCanResend(false);
      Toast.show({
        type: 'success',
        text1: 'OTP Sent',
        text2: 'A new code has been sent to your mobile number.',
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Resend Failed',
        text2: error?.message || 'Could not resend OTP. Please try again.',
      });
    },
  });

  const handleSubmit = () => {
    if (otp.length !== OTP_LENGTH || isSuccess || verifyOtpMutation.isPending) return;
    verifyOtpMutation.mutate({ mobile: `${mobile}`, otp, skipOtp: true });
  };

  // Auto submit when full OTP is entered
  useEffect(() => {
    if (otp.length === OTP_LENGTH) {
      handleSubmit();
    }
  }, [otp]);

  const handleResend = () => {
    if (!canResend) return;
    resendOtpMutation.mutate(`${mobile}`);
  };

  // Format timer display
  const formatTime = (s: number) => `0:${s.toString().padStart(2, '0')}`;

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
                      ? 'rgba(16,185,129,0.12)'
                      : '#ECFDF5',
                    borderColor: isDark
                      ? 'rgba(16,185,129,0.2)'
                      : 'transparent',
                    borderWidth: isDark ? 1 : 0,
                  },
                ]}
              >
                <Feather name="shield" size={36} color={colors.success} />
              </View>
            </MotiView>

            {/* Title / Subtitle */}
            <MotiView
              from={{ opacity: 0, translateY: 15 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500, delay: 200 }}
            >
              <AppText variant="h2" style={[styles.title, { color: colors.text }]}>
                Verify your number
              </AppText>
              <AppText
                variant="bodyMd"
                style={[styles.subtitle, { color: colors.textSecondary }]}
              >
                We sent a {OTP_LENGTH}-digit code to{' '}
                <AppText
                  variant="bodyMd"
                  style={{ color: colors.text, fontWeight: '700' }}
                >
                  +91 {mobile}
                </AppText>
              </AppText>
            </MotiView>

            {/* OTP Input Fields */}
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500, delay: 350 }}
            >
              <OtpInput
                code={otp}
                onChangeCode={setOtp}
                length={OTP_LENGTH}
              />
            </MotiView>

            {/* Resend Timer / Action */}
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 500, delay: 450 }}
              style={styles.resendContainer}
            >
              {canResend ? (
                <TouchableOpacity
                  onPress={handleResend}
                  disabled={resendOtpMutation.isPending}
                  style={[
                    styles.resendButton,
                    {
                      backgroundColor: isDark
                        ? 'rgba(99,102,241,0.12)'
                        : colors.primaryLight,
                    },
                  ]}
                >
                  <Ionicons
                    name="refresh"
                    size={14}
                    color={colors.primary}
                    style={{ marginRight: 5 }}
                  />
                  <AppText
                    variant="bodySm"
                    style={{ color: colors.primary, fontWeight: '700' }}
                  >
                    Resend Code
                  </AppText>
                </TouchableOpacity>
              ) : (
                <View
                  style={[
                    styles.timerContainer,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255,255,255,0.04)'
                        : colors.backgroundSecondary,
                    },
                  ]}
                >
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color={colors.textMuted}
                    style={{ marginRight: 5 }}
                  />
                  <AppText
                    variant="bodySm"
                    style={{ color: colors.textSecondary }}
                  >
                    Resend code in{' '}
                    <AppText
                      variant="bodySm"
                      style={{ color: colors.text, fontWeight: '700' }}
                    >
                      {formatTime(timer)}
                    </AppText>
                  </AppText>
                </View>
              )}
            </MotiView>

            {/* Verify CTA */}
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500, delay: 500 }}
            >
              <AppButton
                title={isSuccess ? undefined : "Verify & Continue"}
                variant={isSuccess ? "success" : "primary"}
                onPress={handleSubmit}
                disabled={otp.length !== OTP_LENGTH}
                loading={verifyOtpMutation.isPending && !isSuccess}
                style={styles.submitButton}
              >
                {isSuccess && (
                  <LottieView
                    source={require('../../../assets/button-success.json')}
                    autoPlay
                    loop={false}
                    style={{ width: 40, height: 40 }}
                    colorFilters={[
                      {
                        keypath: 'Shape Layer 2',
                        color: colors.success,
                      },
                      {
                        keypath: 'Shape Layer 1',
                        color: colors.successLight,
                      },
                    ]}
                  />
                )}
              </AppButton>
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
  resendContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  submitButton: {
    marginTop: 8,
  },
});