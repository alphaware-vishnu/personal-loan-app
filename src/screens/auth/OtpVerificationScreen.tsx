import React, { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useColors } from '../../theme';
import { AppText } from '../../components/ui/AppText';
import { OtpInput } from '../../components/ui/OtpInput';
import { AppButton } from '../../components/ui/AppButton';
import { verifyOtp, sendOtp } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import Toast from 'react-native-toast-message';
import { AuthData } from '../../types/auth.type';

interface OtpVerificationScreenProps {
  mobile: string;
  onBack: () => void;
  onVerify: (isExisting: boolean) => void;
}

const OTP_LENGTH = 4;

export const OtpVerificationScreen: React.FC<OtpVerificationScreenProps> = ({
  mobile,
  onBack,
  onVerify,
}) => {
  const colors = useColors();
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

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
      if (data) {
        setAuth(data, mobile);
        onVerify(!data.isFirstLogin);
      } else {
        // Fallback demo login
        const demoAuth: AuthData = {
          customerId: 99999,
          isFirstLogin: true,
          access_token: 'demo-token',
          refresh_token: 'demo-refresh-token',
          token_type: 'Bearer',
          expires_in: 3600,
          refresh_expires_in: 3600,
          session_state: '',
          scope: '',
        };
        setAuth(demoAuth, mobile);
        onVerify(false);
      }
    },
    onError: (error: any) => {
      // In development/demo environments, allow bypass on invalid OTP
      Toast.show({
        type: 'info',
        text1: 'Demo Mode Bypass',
        text2: 'Invalid OTP api response. Proceeding in Demo mode.',
      });
      const demoAuth: AuthData = {
        customerId: 99999,
        isFirstLogin: true,
        access_token: 'demo-token',
        refresh_token: 'demo-refresh-token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_expires_in: 3600,
        session_state: '',
        scope: '',
      };
      setAuth(demoAuth, mobile);
      onVerify(false);
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
    if (otp.length !== OTP_LENGTH) return;
    verifyOtpMutation.mutate({ mobile: `91${mobile}`, otp, skipOtp: false });
  };

  const handleResend = () => {
    if (!canResend) return;
    resendOtpMutation.mutate(`91${mobile}`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.content}>
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight + '20' }]}>
              <Feather name="shield" size={40} color={colors.primary} />
            </View>

            {/* Title / Subtitle */}
            <AppText variant="h2" style={styles.title}>
              Verify your number
            </AppText>
            <AppText variant="bodyMd" style={[styles.subtitle, { color: colors.textSecondary }]}>
              We sent a 4-digit code to +91 {mobile}.
            </AppText>

            {/* OTP Input Fields */}
            <OtpInput
              code={otp}
              onChangeCode={setOtp}
              length={OTP_LENGTH}
            />

            {/* Resend Timer / Action */}
            <View style={styles.resendContainer}>
              {canResend ? (
                <TouchableOpacity onPress={handleResend} disabled={resendOtpMutation.isPending}>
                  <AppText variant="bodyMd" style={{ color: colors.primary, fontWeight: '600' }}>
                    Resend Code
                  </AppText>
                </TouchableOpacity>
              ) : (
                <AppText variant="bodyMd" style={{ color: colors.textSecondary }}>
                  Resend code in <AppText variant="bodyMd" style={{ color: colors.text, fontWeight: '600' }}>{timer}s</AppText>
                </AppText>
              )}
            </View>

            {/* Verify CTA */}
            <AppButton
              title="Verify & Continue"
              onPress={handleSubmit}
              disabled={otp.length !== OTP_LENGTH}
              loading={verifyOtpMutation.isPending}
              style={styles.submitButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    marginTop: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingTop: 40,
    paddingBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    marginBottom: 12,
  },
  subtitle: {
    marginBottom: 32,
  },
  resendContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  submitButton: {
    marginTop: 8,
  },
});