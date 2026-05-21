import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Image, TouchableOpacity } from 'react-native';
import LottieView from 'lottie-react-native';
import { MotiView } from 'moti';
import { Feather, Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { SafeHeader } from '../../components/layout/SafeHeader';
import { StepIndicator } from '../../components/ui/StepIndicator';
import { CameraCapture } from '../../components/ui/CameraCapture';
import { useColors, useTheme } from '../../theme';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useKycStore } from '../../store/kycStore';
import { verifySelfieLiveliness } from '../../services/kycService';
import { trackEvent } from '../../utils/analytics';
import { AppText } from '../../components/ui/AppText';
import { AppButton } from '../../components/ui/AppButton';

interface SelfieVerificationScreenProps {
  onNext: () => void;
  onBack: () => void;
}

export const SelfieVerificationScreen: React.FC<SelfieVerificationScreenProps> = ({ onNext, onBack }) => {
  const colors = useColors();
  const { theme } = useTheme();
  const { completeStep } = useOnboardingStore();
  const kycStore = useKycStore();

  const [showCamera, setShowCamera] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);

  const handleStartCamera = () => {
    try {
      trackEvent('kyc_started');
    } catch (e) {}
    setShowCamera(true);
    setVerificationError('');
  };

  const handleCapture = async (uri: string) => {
    setCapturedUri(uri);
    setShowCamera(false);
    setIsVerifying(true);
    setVerificationError('');

    try {
      trackEvent('selfie_captured');
      const result = await verifySelfieLiveliness(uri);
      
      if (result.isLive) {
        kycStore.setSelfieStatus('VERIFIED', uri);
        completeStep('kyc_selfie');
        kycStore.computeOverallStatus();
        trackEvent('selfie_verified', { confidenceScore: result.confidenceScore });
        
        // Brief delay for success state
        setTimeout(() => {
          setIsVerifying(false);
          onNext();
        }, 1000);
      } else {
        setVerificationError('Liveliness check failed. Please ensure you are in a well-lit area.');
        kycStore.setSelfieStatus('REJECTED');
        setIsVerifying(false);
      }
    } catch (err: any) {
      setVerificationError(err.message || 'Liveliness verification failed. Please try again.');
      kycStore.setSelfieStatus('REJECTED');
      setIsVerifying(false);
    }
  };

  const handleCloseCamera = () => {
    setShowCamera(false);
  };

  // 1. Camera view takes over screen
  if (showCamera) {
    return (
      <CameraCapture
        mode="selfie"
        onCapture={handleCapture}
        onClose={handleCloseCamera}
      />
    );
  }

  // 2. Verification processing view
  if (isVerifying) {
    return (
      <ScreenWrapper>
        <View style={styles.verifyingContainer}>
          {capturedUri && (
            <View style={styles.previewContainer}>
              <Image source={{ uri: capturedUri }} style={styles.verifyingPreview} />
              <View style={[StyleSheet.absoluteFillObject, styles.scanningOverlay]}>
                <MotiView
                  from={{ translateY: -100 }}
                  animate={{ translateY: 240 }}
                  transition={{
                    loop: true,
                    type: 'timing',
                    duration: 2000,
                  }}
                  style={[styles.scannerBar, { backgroundColor: colors.primary }]}
                />
              </View>
            </View>
          )}

          <View style={styles.textContainer}>
            <LottieView
              source={require('../../../assets/loader.json')}
              autoPlay
              loop
              style={{ width: 100, height: 100, marginBottom: 20 }}
              resizeMode="contain"
            />
            <AppText variant="h2" align="center" style={styles.title}>
              Analyzing Selfie
            </AppText>
            <AppText variant="bodyMd" align="center" style={{ color: colors.textSecondary }}>
              Performing secure liveliness check & facial match. This will take just a moment.
            </AppText>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  // 3. Instructions & details view
  return (
    <ScreenWrapper>
      <SafeHeader title="Selfie Verification" onBack={onBack} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <StepIndicator totalSteps={4} currentStep={4} showLabel />

        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          style={styles.content}
        >
          <View style={styles.illustrationWrapper}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="camera" size={48} color={colors.primary} />
            </View>
          </View>

          <AppText variant="h2" style={styles.title} align="center">
            Take a Selfie Verification
          </AppText>
          
          <AppText variant="bodyMd" style={{ color: colors.textSecondary, marginBottom: 30 }} align="center">
            A quick photo helps us verify your identity and secure your account against fraud.
          </AppText>

          {verificationError ? (
            <View style={[styles.errorBox, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}>
              <Feather name="alert-triangle" size={20} color="#EF4444" style={{ marginRight: 10 }} />
              <AppText variant="bodyMd" style={{ color: '#DC2626', flex: 1 }}>
                {verificationError}
              </AppText>
            </View>
          ) : null}

          {/* Instructions List */}
          <AppText variant="labelLg" style={styles.instructionsHeading}>
            Tips for a clear verification:
          </AppText>

          <View style={[styles.instructionCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
            <View style={styles.instructionRow}>
              <View style={[styles.bulletIcon, { backgroundColor: colors.primaryLight }]}>
                <Feather name="sun" size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="labelMd" style={{ color: colors.text, fontWeight: '700' }}>
                  Good Lighting
                </AppText>
                <AppText variant="caption" style={{ color: colors.textSecondary, marginTop: 2 }}>
                  Ensure your face is evenly lit. Avoid background glare.
                </AppText>
              </View>
            </View>

            <View style={styles.instructionRow}>
              <View style={[styles.bulletIcon, { backgroundColor: colors.primaryLight }]}>
                <Feather name="eye" size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="labelMd" style={{ color: colors.text, fontWeight: '700' }}>
                  Full Face Visible
                </AppText>
                <AppText variant="caption" style={{ color: colors.textSecondary, marginTop: 2 }}>
                  Remove hats, glasses, or masks. Maintain a neutral expression.
                </AppText>
              </View>
            </View>

            <View style={styles.instructionRow}>
              <View style={[styles.bulletIcon, { backgroundColor: colors.primaryLight }]}>
                <Feather name="smartphone" size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="labelMd" style={{ color: colors.text, fontWeight: '700' }}>
                  Hold Steady
                </AppText>
                <AppText variant="caption" style={{ color: colors.textSecondary, marginTop: 2 }}>
                  Position the phone at eye level inside the oval framing indicator.
                </AppText>
              </View>
            </View>
          </View>
        </MotiView>
      </ScrollView>

      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 200 }}
        style={[styles.footer, { borderTopColor: colors.border }]}
      >
        <AppButton
          title="Open Selfie Camera"
          onPress={handleStartCamera}
          variant="primary"
          size="lg"
          style={styles.button}
        />
      </MotiView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  content: {
    flex: 1,
    marginTop: 10,
  },
  illustrationWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  instructionsHeading: {
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 10,
  },
  instructionCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  bulletIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    marginTop: 2,
  },
  verifyingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  previewContainer: {
    width: 180,
    height: 240,
    borderRadius: 90,
    overflow: 'hidden',
    marginBottom: 40,
    borderWidth: 3,
    borderColor: '#FFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    position: 'relative',
  },
  verifyingPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  scanningOverlay: {
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  scannerBar: {
    height: 4,
    width: '100%',
    opacity: 0.8,
  },
  textContainer: {
    alignItems: 'center',
    width: '100%',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  button: {
    width: '100%',
  },
});
