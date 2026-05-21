import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { MotiView, MotiText } from 'moti';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { useColors } from '../../theme';
import { AppText } from '../../components/ui/AppText';
import { useOnboardingStore } from '../../store/onboardingStore';
import { trackEvent } from '../../utils/analytics';

interface EligibilityProcessingScreenProps {
  onComplete: () => void;
}

export const EligibilityProcessingScreen: React.FC<EligibilityProcessingScreenProps> = ({ onComplete }) => {
  const colors = useColors();
  const { completeStep } = useOnboardingStore();
  const [statusIndex, setStatusIndex] = useState(0);

  const analysisSteps = [
    'Reading bank statements...',
    'Performing credit bureau checks...',
    'Evaluating income eligibility criteria...',
    'Structuring custom loan offers...',
    'Almost ready...'
  ];

  useEffect(() => {
    trackEvent('eligibility_check_started');

    // Cycle through steps
    const interval = setInterval(() => {
      setStatusIndex((prev) => {
        if (prev < analysisSteps.length - 1) {
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 1800);

    // End after 8 seconds and proceed to offers
    const timeout = setTimeout(() => {
      completeStep('eligibility');
      trackEvent('eligibility_result_received');
      onComplete();
    }, 8500);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

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
              source={require('../../../assets/loader.json')}
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
});
