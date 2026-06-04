import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { MotiView, AnimatePresence } from 'moti';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { AppText } from '../../components/ui/AppText';
import { AppButton } from '../../components/ui/AppButton';
import { AppCard } from '../../components/ui/AppCard';
import { useColors, useTheme } from '../../theme';
import { useLoanStore } from '../../store/loanStore';
import { useOnboardingStore } from '../../store/onboardingStore';
import { trackEvent } from '../../utils/analytics';
import { formatCurrency } from '../../utils/formatters';

const { width } = Dimensions.get('window');

interface DisbursalScreenProps {
  onComplete: () => void;
}

type DisbursalStep = {
  id: number;
  label: string;
  status: 'pending' | 'active' | 'success';
};

export const DisbursalScreen: React.FC<DisbursalScreenProps> = ({ onComplete }) => {
  const colors = useColors();
  const { theme } = useTheme();
  const { completeStep, reset: resetOnboarding } = useOnboardingStore();
  const { requestedAmount, disbursalAmount, customerInfo } = useLoanStore();

  const bankDetail = customerInfo.customerBanks?.[0];
  const bankName = bankDetail?.bank || 'Verified Bank';
  const accountNo = bankDetail?.accountNo || '••••••••1234';
  const maskedAccountNo = accountNo.length > 4 
    ? `•••• ${accountNo.slice(-4)}` 
    : accountNo;

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState<DisbursalStep[]>([
    { id: 1, label: 'Validating Profile Details', status: 'active' },
    { id: 2, label: 'Verifying Bank Account', status: 'pending' },
    { id: 3, label: 'Processing Eligibility Criteria', status: 'pending' },
    { id: 4, label: 'Finalizing Application Setup', status: 'pending' },
  ]);

  // Animated values for custom progress styling
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    trackEvent('disbursal_initiated');
    
    // Define the sequence timing for steps
    const stepIntervals = [1200, 1500, 1500, 1500];
    let currentStep = 0;

    const runSimulation = () => {
      if (currentStep < steps.length - 1) {
        // Animate progression bar
        Animated.timing(progressAnim, {
          toValue: (currentStep + 1) / steps.length,
          duration: stepIntervals[currentStep],
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: false,
        }).start();

        setTimeout(() => {
          setSteps((prevSteps) => {
            const updated = prevSteps.map((step, idx) => {
              if (idx === currentStep) return { ...step, status: 'success' as const };
              if (idx === currentStep + 1) return { ...step, status: 'active' as const };
              return step;
            });
            return updated;
          });
          currentStep += 1;
          setCurrentStepIndex(currentStep);
          runSimulation();
        }, stepIntervals[currentStep]);
      } else {
        // Complete the final step
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }).start();

        setTimeout(() => {
          setSteps((prevSteps) =>
            prevSteps.map((step) => ({ ...step, status: 'success' as const }))
          );
          completeStep('disbursal');
          trackEvent('disbursal_completed', { amount: requestedAmount });
          resetOnboarding();
          onComplete();
        }, 1200);
      }
    };

    runSimulation();
  }, []);

  const displayAmount = disbursalAmount > 0 ? disbursalAmount : requestedAmount;

  // Next EMI Date (approx 30 days from now)
  const getNextEmiDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <ScreenWrapper padded={false} backgroundColor={colors.background}>
      <AnimatePresence>
        <MotiView
          key="processing"
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={styles.centerContent}
        >
            {/* Lottie Loader */}
            <View style={styles.animationContainer}>
              <LottieView
                source={require('../../../assets/new-loader.json')}
                autoPlay
                loop
                style={styles.loaderLottie}
              />
            </View>

            <AppText variant="h2" style={styles.title}>
              Creating Application
            </AppText>
            <AppText variant="bodyMd" style={[styles.subtitle, { color: colors.textSecondary }]}>
              Please do not close the app or press the back button. We are validating your details and setting up your application.
            </AppText>

            {/* Custom Premium Progress Bar */}
            <View style={[styles.progressBarContainer, { backgroundColor: colors.backgroundTertiary }]}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: colors.primary,
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>

            {/* Steps Checklist */}
            <View style={styles.stepsList}>
              {steps.map((step, idx) => {
                const isActive = step.status === 'active';
                const isSuccess = step.status === 'success';

                return (
                  <View key={step.id} style={styles.stepRow}>
                    <View style={styles.iconCol}>
                      {isSuccess ? (
                        <MotiView
                          from={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring' }}
                        >
                          <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                        </MotiView>
                      ) : isActive ? (
                        <LottieView
                          source={require('../../../assets/new-loader.json')}
                          autoPlay
                          loop
                          style={{ width: 24, height: 24 }}
                        />
                      ) : (
                        <View style={[styles.dotCircle, { borderColor: colors.border }]} />
                      )}
                    </View>
                    <AppText
                      variant="bodyMedium"
                      style={[
                        styles.stepLabel,
                        {
                          color: isSuccess
                            ? colors.text
                            : isActive
                            ? colors.primary
                            : colors.textMuted,
                          fontWeight: isActive || isSuccess ? '700' : '400',
                        },
                      ]}
                    >
                      {step.label}
                    </AppText>
                  </View>
                );
              })}
            </View>
          </MotiView>
      </AnimatePresence>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  animationContainer: {
    width: 200,
    height: 200,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderLottie: {
    width: 140,
    height: 140,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  progressBarContainer: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 32,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  stepsList: {
    width: '100%',
    gap: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  iconCol: {
    width: 36,
    alignItems: 'center',
  },
  dotCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  stepLabel: {
    flex: 1,
    marginLeft: 12,
  },
  successContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successAnimationContainer: {
    width: width,
    height: 200,
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successLottie: {
    width: width,
    height: 320,
    position: 'absolute',
  },
  textCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 6,
  },
  celebrationText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    textAlign: 'center',
    lineHeight: 18,
  },
  detailsCard: {
    padding: 20,
    borderRadius: 24,
    elevation: 3,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    marginBottom: 32,
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  amountText: {
    fontSize: 32,
    fontWeight: '900',
    marginTop: 4,
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  footer: {
    width: '100%',
    paddingBottom: 24,
    marginTop: 'auto',
  },
});
