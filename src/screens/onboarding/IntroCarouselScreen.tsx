import React, { useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Carousel, { ICarouselInstance } from 'react-native-reanimated-carousel';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import { useColors, useTheme } from '../../theme';
import { AppText } from '../../components/ui/AppText';
import { AppButton } from '../../components/ui/AppButton';
import { OnboardingSlide } from '../../components/OnboardingSlide';
import { MeshBackground } from '@/components';

const { width, height } = Dimensions.get('window');

const SLIDES_DATA = [
  {
    title: 'Instant digital approval',
    highlightWord: 'approval',
    description: 'Get verified in minutes with zero paperwork and no branch visits needed.',
    icon: 'credit_card_money' as const,
  },
  {
    title: 'Bank-grade secure processing',
    highlightWord: 'secure',
    description: 'Your personal data is fully encrypted with industry-standard 256-bit AES protection.',
    icon: 'security' as const,
  },
  {
    title: 'Flexible custom repayment',
    highlightWord: 'repayment',
    description: 'Choose repayment schedules and EMI limits that fit your monthly budget comfortably.',
    icon: 'wallet_icon' as const,
    size: 2.0
  },
  {
    title: 'Money directly in minutes',
    highlightWord: 'minutes',
    description: 'Once approved, funds are transferred instantly to your verified bank account.',
    icon: 'rocket_icon' as const,
  },
];

interface IntroCarouselScreenProps {
  onStart: () => void;
}

export const IntroCarouselScreen: React.FC<IntroCarouselScreenProps> = ({ onStart }) => {
  const colors = useColors();
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<ICarouselInstance>(null);

  const handleNext = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) { }

    if (currentIndex < SLIDES_DATA.length - 1) {
      carouselRef.current?.scrollTo({ index: currentIndex + 1, animated: true });
      setCurrentIndex(prev => prev + 1);
    } else {
      onStart();
    }
  };

  const handleSkip = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) { }
    onStart();
  };

  const isLastSlide = currentIndex === SLIDES_DATA.length - 1;

  return (
    <MeshBackground style={styles.container}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: 'transparent' }]}
        edges={['top', 'bottom']}
      >
      {/* Header — Skip */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* Step counter */}
          <View
            style={[
              styles.stepCounter,
              {
                backgroundColor: isDark
                  ? 'rgba(255,255,255,0.06)'
                  : colors.backgroundSecondary,
              },
            ]}
          >
            <AppText
              variant="caption"
              style={[
                styles.stepText,
                { color: isDark ? colors.textMuted : colors.textTertiary },
              ]}
            >
              {currentIndex + 1}/{SLIDES_DATA.length}
            </AppText>
          </View>
        </View>

        {!isLastSlide && (
          <TouchableOpacity
            onPress={handleSkip}
            style={[
              styles.skipButton,
              {
                backgroundColor: isDark
                  ? 'rgba(255,255,255,0.06)'
                  : colors.backgroundSecondary,
              },
            ]}
          >
            <AppText
              variant="bodySm"
              style={[
                styles.skipText,
                { color: isDark ? colors.textMuted : colors.textSecondary },
              ]}
            >
              Skip
            </AppText>
          </TouchableOpacity>
        )}
      </View>

      {/* Carousel */}
      <View style={[styles.carouselContainer, { backgroundColor: 'transparent' }]}>
        <Carousel
          ref={carouselRef}
          style={{ backgroundColor: 'transparent' }}
          width={width}
          height={height * 0.64}
          data={SLIDES_DATA}
          onSnapToItem={(index) => setCurrentIndex(index)}
          renderItem={({ item }) => (
            <OnboardingSlide
              title={item.title}
              highlightWord={item.highlightWord}
              description={item.description}
              icon={item.icon}
              bgColor="transparent"
              textColor={colors.text}
              descColor={colors.textSecondary}
              primaryColor={colors.primary}
            />
          )}
        />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {/* Pagination Dots */}
        <View style={styles.dotsContainer}>
          {SLIDES_DATA.map((_, index) => {
            const isActive = index === currentIndex;
            const isPast = index < currentIndex;
            return (
              <MotiView
                key={index}
                animate={{
                  width: isActive ? 28 : 8,
                  opacity: isActive ? 1 : isPast ? 0.6 : 0.25,
                }}
                transition={{ type: 'timing', duration: 300 }}
                style={[
                  styles.dot,
                  {
                    backgroundColor: isActive || isPast
                      ? colors.primary
                      : isDark
                        ? 'rgba(255,255,255,0.15)'
                        : colors.borderLight,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Action Button */}
        <AppButton
          title={isLastSlide ? 'Get Started' : 'Continue'}
          onPress={handleNext}
          style={styles.button}
        />
      </View>
      </SafeAreaView>
    </MeshBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCounter: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  stepText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 10,
  },
  skipText: {
    fontWeight: '600',
    fontSize: 13,
  },
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  button: {
    width: '100%',
  },
});