import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ScrollView, KeyboardAvoidingView, Platform, StyleSheet, View, TouchableOpacity, Linking, AppState, AppStateStatus } from 'react-native';
import LottieView from 'lottie-react-native';
import { MotiView } from 'moti';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { SafeHeader } from '../../components/layout/SafeHeader';
import { StepIndicator } from '../../components/ui/StepIndicator';
import { useColors, useTheme } from '../../theme';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useKycStore } from '../../store/kycStore';
import { initiateDigiLocker, checkDigiLockerVerification } from '../../services/kycService';
import { trackEvent } from '../../utils/analytics';
import { AppText } from '../../components/ui/AppText';
import { AppButton } from '../../components/ui/AppButton';

type FlowPhase = 'idle' | 'initiating' | 'webview_opened' | 'polling' | 'verified' | 'error';

interface AadhaarVerificationScreenProps {
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

export const AadhaarVerificationScreen: React.FC<AadhaarVerificationScreenProps> = ({ onNext, onBack, onSkip }) => {
  const colors = useColors();
  const { theme } = useTheme();
  const { completeStep } = useOnboardingStore();
  const kycStore = useKycStore();

  const [phase, setPhase] = useState<FlowPhase>('idle');
  const [error, setError] = useState('');
  const [kycUrl, setKycUrl] = useState<string | null>(kycStore.digiLockerKycUrl);
  const [uniqueId, setUniqueId] = useState<string | null>(kycStore.digiLockerUniqueId);
  const [pollCount, setPollCount] = useState(0);

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const maxPollAttempts = 20;
  const pollIntervalMs = 3000;

  // ─── App State Listener (detect return from browser) ───
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      // When user returns from browser to the app
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        if (phase === 'webview_opened') {
          // User came back from DigiLocker WebView → start polling
          setPhase('polling');
          trackEvent('digilocker_returned_from_webview');
        }
      }
      appStateRef.current = nextState;
    });

    return () => {
      subscription.remove();
    };
  }, [phase]);

  // ─── Polling Effect ───
  useEffect(() => {
    if (phase !== 'polling') return;

    const poll = async () => {
      try {
        const result = await checkDigiLockerVerification();
        if (result.digiLockerVerified) {
          clearPollTimer();
          kycStore.setAadhaarStatus('VERIFIED');
          completeStep('kyc_aadhaar');
          trackEvent('digilocker_verified');
          setPhase('verified');

          // Auto-advance after a brief success animation
          setTimeout(() => onNext(), 1500);
          return;
        }
      } catch (err: any) {
        console.warn('[DigiLocker] Poll error:', err.message);
      }

      setPollCount((prev) => {
        const next = prev + 1;
        if (next >= maxPollAttempts) {
          clearPollTimer();
          setError('Verification is taking longer than expected. Please try again.');
          setPhase('error');
          return next;
        }
        return next;
      });
    };

    poll(); // Immediate first check
    pollTimerRef.current = setInterval(poll, pollIntervalMs);

    return () => clearPollTimer();
  }, [phase]);

  const clearPollTimer = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  // ─── Initiate DigiLocker ───
  const handleInitiate = useCallback(async () => {
    setError('');
    setPhase('initiating');
    setPollCount(0);

    try {
      const response = await initiateDigiLocker();

      const targetUrl = response.kycUrl || response.url;
      if (!targetUrl) {
        throw new Error('No KYC URL received from server. Please try again.');
      }

      // Store the response data for idempotent reuse
      kycStore.setDigiLockerData({
        url: response.url ?? undefined,
        kycUrl: response.kycUrl ?? undefined,
        uniqueId: response.uniqueId ?? undefined,
        transactionId: response.transactionId ?? undefined,
      });
      kycStore.setAadhaarStatus('IN_PROGRESS', response.transactionId ?? undefined);

      setKycUrl(targetUrl);
      setUniqueId(response.uniqueId ?? null);
      trackEvent('digilocker_initiated', { uniqueId: response.uniqueId });

      // Open the KYC URL in the device browser
      await openKycUrl(targetUrl);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Failed to initiate DigiLocker. Please try again.';
      setError(msg);
      setPhase('error');
      trackEvent('digilocker_initiate_error', { error: msg });
    }
  }, []);

  // ─── Open URL ───
  const openKycUrl = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        setPhase('webview_opened');
      } else {
        throw new Error('Unable to open KYC URL. Please check your browser settings.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to open verification link.');
      setPhase('error');
    }
  };

  // ─── Re-open saved URL ───
  const handleReopenUrl = useCallback(async () => {
    const url = kycUrl || kycStore.digiLockerKycUrl || kycStore.digiLockerUrl;
    if (url) {
      setError('');
      await openKycUrl(url);
    } else {
      // No saved URL; re-initiate
      await handleInitiate();
    }
  }, [kycUrl]);

  // ─── Retry from error ───
  const handleRetry = useCallback(() => {
    setError('');
    setPollCount(0);
    handleInitiate();
  }, [handleInitiate]);

  // ─── Manual poll trigger ───
  const handleCheckStatus = useCallback(async () => {
    setError('');
    setPhase('polling');
    setPollCount(0);
  }, []);

  // ─── Render Helpers ───
  const renderIdleState = () => (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 400 }}
      style={styles.content}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight || `${colors.primary}15` }]}>
        <MaterialCommunityIcons name="shield-check-outline" size={56} color={colors.primary} />
      </View>

      <AppText variant="h2" style={[styles.title, { color: colors.text }]}>
        DigiLocker eKYC
      </AppText>

      <AppText variant="bodyMd" style={{ color: colors.textSecondary, marginBottom: 24, textAlign: 'center' }}>
        Verify your identity instantly via DigiLocker.{'\n'}
        Your Aadhaar details will be securely fetched from the government database.
      </AppText>

      <View style={[styles.featureList]}>
        {[
          { icon: 'clock' as const, text: 'Takes less than 2 minutes' },
          { icon: 'shield' as const, text: 'Government-verified identity' },
          { icon: 'file-text' as const, text: 'Auto-fetch Aadhaar & PAN docs' },
        ].map((item, i) => (
          <View key={i} style={[styles.featureItem, { backgroundColor: colors.backgroundSecondary }]}>
            <Feather name={item.icon} size={18} color={colors.primary} style={{ marginRight: 12 }} />
            <AppText variant="bodySm" style={{ color: colors.text, flex: 1 }}>
              {item.text}
            </AppText>
          </View>
        ))}
      </View>

      <View style={[styles.secureBox, { backgroundColor: colors.backgroundSecondary }]}>
        <Feather name="lock" size={16} color={colors.success} style={{ marginRight: 8 }} />
        <AppText variant="caption" style={{ color: colors.textSecondary, flex: 1 }}>
          Powered by Digitap. Your data is encrypted and never shared without consent.
        </AppText>
      </View>
    </MotiView>
  );

  const renderInitiatingState = () => (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 300 }}
      style={styles.centerContent}
    >
      <LottieView
        source={require('../../../assets/loader.json')}
        autoPlay
        loop
        style={{ width: 120, height: 120 }}
        resizeMode="contain"
      />
      <AppText variant="bodyMd" style={{ color: colors.textSecondary, marginTop: 16, textAlign: 'center' }}>
        Preparing your DigiLocker verification...
      </AppText>
    </MotiView>
  );

  const renderWebViewOpenedState = () => (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 400 }}
      style={styles.content}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${colors.warning}15` }]}>
        <MaterialCommunityIcons name="web" size={56} color={colors.warning} />
      </View>

      <AppText variant="h2" style={[styles.title, { color: colors.text }]}>
        Complete Verification
      </AppText>

      <AppText variant="bodyMd" style={{ color: colors.textSecondary, marginBottom: 24, textAlign: 'center' }}>
        DigiLocker has opened in your browser.{'\n'}
        Please complete the verification there and return to this app.
      </AppText>

      <View style={[styles.stepsList]}>
        {[
          'Log in to DigiLocker with your Aadhaar',
          'Grant consent to share documents',
          'Return to this app after completion',
        ].map((step, i) => (
          <View key={i} style={[styles.stepItem, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
              <AppText variant="caption" style={{ color: '#FFFFFF', fontWeight: '700' }}>
                {i + 1}
              </AppText>
            </View>
            <AppText variant="bodySm" style={{ color: colors.text, flex: 1 }}>
              {step}
            </AppText>
          </View>
        ))}
      </View>

      {uniqueId && (
        <View style={[styles.referenceBox, { borderColor: colors.border }]}>
          <AppText variant="caption" style={{ color: colors.textSecondary }}>
            Reference: {uniqueId}
          </AppText>
        </View>
      )}
    </MotiView>
  );

  const renderPollingState = () => (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 300 }}
      style={styles.centerContent}
    >
      <LottieView
        source={require('../../../assets/loader.json')}
        autoPlay
        loop
        style={{ width: 100, height: 100 }}
        resizeMode="contain"
      />
      <AppText variant="h3" style={{ color: colors.text, marginTop: 16, textAlign: 'center' }}>
        Verifying your identity...
      </AppText>
      <AppText variant="bodySm" style={{ color: colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
        Checking DigiLocker verification status
      </AppText>
      <AppText variant="caption" style={{ color: colors.textTertiary, marginTop: 16 }}>
        Attempt {Math.min(pollCount + 1, maxPollAttempts)} of {maxPollAttempts}
      </AppText>
    </MotiView>
  );

  const renderVerifiedState = () => (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 500 }}
      style={styles.centerContent}
    >
      <View style={[styles.successIcon, { backgroundColor: `${colors.success}15` }]}>
        <Feather name="check-circle" size={64} color={colors.success} />
      </View>
      <AppText variant="h2" style={{ color: colors.text, marginTop: 20, textAlign: 'center' }}>
        Identity Verified!
      </AppText>
      <AppText variant="bodyMd" style={{ color: colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
        Your Aadhaar details have been verified successfully via DigiLocker.
      </AppText>
    </MotiView>
  );

  const renderErrorState = () => (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 400 }}
      style={styles.content}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${colors.error}15` }]}>
        <Feather name="alert-circle" size={56} color={colors.error} />
      </View>

      <AppText variant="h2" style={[styles.title, { color: colors.text }]}>
        Verification Issue
      </AppText>

      <AppText variant="bodyMd" style={{ color: colors.error, marginBottom: 24, textAlign: 'center' }}>
        {error}
      </AppText>
    </MotiView>
  );

  // ─── Footer Buttons ───
  const renderFooterButtons = () => {
    switch (phase) {
      case 'idle':
        return (
          <AppButton
            title="Start DigiLocker Verification"
            onPress={handleInitiate}
            variant="primary"
            size="lg"
            style={styles.button}
          />
        );

      case 'initiating':
        return null; // Loader shown in content area

      case 'webview_opened':
        return (
          <>
            <AppButton
              title="I've Completed Verification"
              onPress={handleCheckStatus}
              variant="primary"
              size="lg"
              style={styles.button}
            />
            <AppButton
              title="Re-open DigiLocker"
              variant="outline"
              size="md"
              onPress={handleReopenUrl}
              style={{ marginTop: 10 }}
            />
          </>
        );

      case 'polling':
        return (
          <AppButton
            title="Checking..."
            onPress={() => {}}
            disabled
            variant="primary"
            size="lg"
            style={styles.button}
          />
        );

      case 'verified':
        return (
          <AppButton
            title="Continue"
            onPress={onNext}
            variant="primary"
            size="lg"
            style={styles.button}
          />
        );

      case 'error':
        return (
          <>
            <AppButton
              title="Try Again"
              onPress={handleRetry}
              variant="primary"
              size="lg"
              style={styles.button}
            />
            {kycUrl && (
              <AppButton
                title="Re-open DigiLocker Link"
                variant="outline"
                size="md"
                onPress={handleReopenUrl}
                style={{ marginTop: 10 }}
              />
            )}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <ScreenWrapper>
      <SafeHeader title="Identity Verification" onBack={onBack} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <StepIndicator totalSteps={2} currentStep={0} showLabel stageName="KYC Verification" />

          {phase === 'idle' && renderIdleState()}
          {phase === 'initiating' && renderInitiatingState()}
          {phase === 'webview_opened' && renderWebViewOpenedState()}
          {phase === 'polling' && renderPollingState()}
          {phase === 'verified' && renderVerifiedState()}
          {phase === 'error' && renderErrorState()}
        </ScrollView>

        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 200 }}
          style={[styles.footer, { borderTopColor: colors.border }]}
        >
          {renderFooterButtons()}
          {phase !== 'verified' && phase !== 'initiating' && onSkip && (
            <AppButton
              title="Skip, I'll do later"
              variant="ghost"
              size="md"
              onPress={onSkip}
              style={{ marginTop: 8 }}
            />
          )}
        </MotiView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  content: {
    flex: 1,
    marginTop: 20,
    alignItems: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureList: {
    width: '100%',
    gap: 10,
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
  },
  secureBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    width: '100%',
  },
  stepsList: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  referenceBox: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'center',
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  button: {
    width: '100%',
  },
});
