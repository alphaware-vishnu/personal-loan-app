import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import LottieView from 'lottie-react-native';
import { MotiView, MotiText } from 'moti';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';

import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { SafeHeader } from '../../components/layout/SafeHeader';
import { useColors } from '../../theme';
import { AppText } from '../../components/ui/AppText';
import { AppButton } from '../../components/ui/AppButton';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useAuthStore } from '../../store/authStore';
import { useLoanStore } from '../../store/loanStore';
import { useOfferStore } from '../../store/offerStore';
import { getPersonalSchemes, evaluateBre } from '../../services/eligibilityService';
import { trackEvent } from '../../utils/analytics';

interface EligibilityProcessingScreenProps {
  onComplete: () => void;
  onBack?: () => void;
  onSkip?: () => void;
}

export const EligibilityProcessingScreen: React.FC<EligibilityProcessingScreenProps> = ({
  onComplete,
  onBack,
  onSkip,
}) => {
  const colors = useColors();
  const [statusIndex, setStatusIndex] = useState(0);
  const [breState, setBreState] = useState<'processing' | 'failed' | 'rejected'>('processing');
  const [errorMessage, setErrorMessage] = useState('');
  const [retryTrigger, setRetryTrigger] = useState(0);

  const analysisSteps = [
    'Reading bank statements...',
    'Performing credit bureau checks...',
    'Evaluating income eligibility criteria...',
    'Structuring custom loan offers...',
    'Almost ready...'
  ];

  const handleRetry = () => {
    setBreState('processing');
    setErrorMessage('');
    setStatusIndex(0);
    setRetryTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    trackEvent('eligibility_check_started');

    // Cycle through steps visually
    const interval = setInterval(() => {
      setStatusIndex((prev) => {
        if (prev < analysisSteps.length - 1) {
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 1505);

    let active = true;
    const startTime = Date.now();

    const runBRE = async () => {
      try {
        const cId = useAuthStore.getState().authData?.customerId || useLoanStore.getState().customerId;
        if (!cId) {
          throw new Error('Customer ID not found. Please log in again.');
        }

        // 1. Fetch schemes list
        const schemes = await getPersonalSchemes();
        if (!schemes || schemes.length === 0) {
          throw new Error('No personal loan schemes available at the moment.');
        }
        const firstScheme = schemes[0];

        // 2. Evaluate BRE
        const breResult = await evaluateBre(cId, firstScheme.schemeMasterId);

        if (!active) return;

        const isEligible = breResult.decision === 'APPROVED' || breResult.decision === 'APPROVED_WITH_REDUCED_AMOUNT';

        // 3. Map BRE result to store format
        const mappedResult = {
          status: isEligible ? 'ELIGIBLE' as const : 'NOT_ELIGIBLE' as const,
          maxAmount: breResult.maxEligibleAmount || breResult.sanctionedAmount || firstScheme.maxLoanAmount || 150000,
          minAmount: firstScheme.minLoanAmount || 10000,
          maxTenure: breResult.approvedTenure || firstScheme.maxTenure || 12,
          minTenure: firstScheme.minTenure || 3,
          interestRate: breResult.approvedInterestRate || 14.5,
          processingFee: Math.round((breResult.maxEligibleAmount || 75000) * 0.02),
          creditScore: breResult.cibilScore || breResult.score || 750,
          message: breResult.decision === 'REJECTED' ? 'Does not meet credit bureau or income rules' : undefined,
        };

        // 4. Save results in useOfferStore and useLoanStore
        useOfferStore.getState().setEligibilityResult(mappedResult);
        useLoanStore.getState().setScheme({
          id: firstScheme.schemeMasterId,
          loanAmount: mappedResult.maxAmount,
          defaultTenure: mappedResult.maxTenure,
          defaultInterest: mappedResult.interestRate,
          tenureFrequency: 'MONTHLY',
        });

        // Ensure minimum 4 seconds of scanning animation
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 4000 - elapsed);

        setTimeout(() => {
          if (active) {
            trackEvent('eligibility_result_received', { decision: breResult.decision });
            if (isEligible) {
              onComplete();
            } else {
              setBreState('rejected');
            }
          }
        }, remaining);

      } catch (err: any) {
        if (!active) return;
        console.error('BRE evaluation failed:', err);
        
        Toast.show({
          type: 'error',
          text1: 'Evaluation Failed',
          text2: err.message || 'An error occurred during eligibility check.',
        });

        setErrorMessage(err.message || 'An error occurred during eligibility check.');
        setBreState('failed');
      }
    };

    runBRE();

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [retryTrigger]);

  if (breState === 'failed') {
    return (
      <ScreenWrapper>
        <SafeHeader title="Eligibility Status" onBack={onBack} />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <MotiView
            from={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 18 }}
            style={styles.cardContainer}
          >
            <View style={styles.iconWrap}>
              <LinearGradient
                colors={['#FEF3C7', '#FDE68A']}
                style={styles.iconGrad}
              >
                <Feather name="alert-triangle" size={52} color="#D97706" />
              </LinearGradient>
            </View>

            <AppText variant="h2" style={styles.cardTitle} align="center">
              Evaluation Failed
            </AppText>
            
            <AppText
              variant="bodyMd"
              style={{ color: colors.textSecondary, marginTop: 12, lineHeight: 22 }}
              align="center"
            >
              We encountered an issue while evaluating your eligibility. This could be due to a connection issue or a temporary service disruption.
            </AppText>

            <View style={[styles.errorDetailBox, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
              <AppText variant="caption" style={{ color: '#DC2626', fontWeight: '700' }} align="center">
                Details: {errorMessage}
              </AppText>
            </View>

            <View style={{ width: '100%', marginTop: 24, gap: 12 }}>
              <AppButton
                title="Try Again"
                onPress={handleRetry}
                variant="primary"
                size="lg"
              />
              {onSkip && (
                <AppButton
                  title="Back to Dashboard"
                  onPress={onSkip}
                  variant="outline"
                  size="lg"
                />
              )}
            </View>
          </MotiView>
        </ScrollView>
      </ScreenWrapper>
    );
  }

  if (breState === 'rejected') {
    return (
      <ScreenWrapper>
        <SafeHeader title="Eligibility Status" onBack={onBack} />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <MotiView
            from={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 18 }}
            style={styles.cardContainer}
          >
            <View style={styles.iconWrap}>
              <LinearGradient
                colors={['#FEE2E2', '#FCA5A5']}
                style={styles.iconGrad}
              >
                <Ionicons name="close-circle" size={52} color="#DC2626" />
              </LinearGradient>
            </View>

            <AppText variant="h2" style={styles.cardTitle} align="center">
              Not eligible right now
            </AppText>
            <AppText
              variant="bodyMd"
              style={{ color: colors.textSecondary, marginTop: 12, lineHeight: 22 }}
              align="center"
            >
              Thank you for applying. Unfortunately, your credit profile doesn't meet our current criteria for a loan approval at this time.
            </AppText>

            <View style={[styles.infoBox, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
              <Feather name="info" size={16} color={colors.textSecondary} style={{ marginBottom: 8 }} />
              <AppText variant="caption" style={{ color: colors.textSecondary, lineHeight: 20 }} align="center">
                You can re-apply after 90 days. Feel free to work on improving your credit score, clear existing outstanding dues, or contact our support team for guidance.
              </AppText>
            </View>

            <View style={{ width: '100%', marginTop: 24 }}>
              {onSkip && (
                <AppButton
                  title="Back to Dashboard"
                  onPress={onSkip}
                  variant="outline"
                  size="lg"
                  style={{ width: '100%' }}
                />
              )}
            </View>
          </MotiView>
        </ScrollView>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Animated concentric pulse circles */}
        <View style={styles.animationContainer}>
          <MotiView
            from={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{
              loop: true,
              type: 'timing',
              duration: 2000,
            }}
            style={[styles.pulseRing, { backgroundColor: colors.primaryLight }]}
          />
          <MotiView
            from={{ scale: 0.9, opacity: 0.7 }}
            animate={{ scale: 1.3, opacity: 0 }}
            transition={{
              loop: true,
              type: 'timing',
              duration: 2000,
              delay: 500,
            }}
            style={[styles.pulseRing, { backgroundColor: colors.primaryLight }]}
          />
          <View style={[styles.centerCircle, { backgroundColor: colors.primary }]}>
            <LottieView
              source={require('../../../assets/new-loader.json')}
              autoPlay
              loop
              style={{ width: 60, height: 60 }}
              resizeMode="contain"
            />
          </View>
        </View>

        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          style={styles.textContainer}
        >
          <AppText variant="h2" align="center" style={styles.title}>
            Calculating Your Limit
          </AppText>
          
          <AppText variant="bodyMd" align="center" style={{ color: colors.textSecondary, marginBottom: 30 }}>
            Please wait while our automated system analyzes your details.
          </AppText>

          {/* Cycler status text */}
          <MotiView
            key={statusIndex}
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 300 }}
            style={[styles.statusBox, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
          >
            <AppText variant="labelMd" align="center" style={{ color: colors.primary, fontWeight: '600' }}>
              {analysisSteps[statusIndex]}
            </AppText>
          </MotiView>
        </MotiView>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  animationContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  pulseRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  centerCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  textContainer: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusBox: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 99,
    borderWidth: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  cardContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  iconWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  iconGrad: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorDetailBox: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 20,
  },
  infoBox: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginTop: 24,
    alignItems: 'center',
  },
});
