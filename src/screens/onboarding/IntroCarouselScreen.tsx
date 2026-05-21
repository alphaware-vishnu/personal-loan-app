import React, { useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Carousel, { ICarouselInstance } from 'react-native-reanimated-carousel';
import * as Haptics from 'expo-haptics';
import { useColors, useTheme } from '../../theme';
import { AppText } from '../../components/ui/AppText';
import { AppButton } from '../../components/ui/AppButton';
import { OnboardingSlide } from '../../components/OnboardingSlide';

const { width, height } = Dimensions.get('window');

const SLIDES_DATA = [
  {
    title: 'Instant digital approval',
    highlightWord: 'approval',
    description: 'Get verified in minutes with zero paperwork and no branch visits needed.',
    icon: 'zap' as const,
  },
  {
    title: 'Bank-grade secure processing',
    highlightWord: 'secure',
    description: 'Your personal data is fully encrypted with industry-standard 256-bit AES protection.',
    icon: 'shield' as const,
  },
  {
    title: 'Flexible custom repayment',
    highlightWord: 'repayment',
    description: 'Choose repayment schedules and EMI limits that fit your monthly budget comfortably.',
    icon: 'sliders' as const,
  },
  {
    title: 'Money directly in minutes',
    highlightWord: 'minutes',
    description: 'Once approved, funds are transferred instantly to your verified bank account.',
    icon: 'check-circle' as const,
  },
];

interface IntroCarouselScreenProps {
  onStart: () => void;
}

export const IntroCarouselScreen: React.FC<IntroCarouselScreenProps> = ({ onStart }) => {
  const colors = useColors();
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<ICarouselInstance>(null);

  const handleNext = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}

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
    } catch (e) {}
    onStart();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {/* Header Skip button */}
      <View style={styles.header}>
        {currentIndex < SLIDES_DATA.length - 1 && (
          <TouchableOpacity onPress={handleSkip}>
            <AppText variant="bodyMd" style={{ color: colors.textSecondary, fontWeight: '600' }}>
              Skip
            </AppText>
          </TouchableOpacity>
        )}
      </View>

      {/* Carousel */}
      <View style={styles.carouselContainer}>
        <Carousel
          ref={carouselRef}
          width={width}
          height={height * 0.55}
          data={SLIDES_DATA}
          onSnapToItem={(index) => setCurrentIndex(index)}
          renderItem={({ item }) => (
            <OnboardingSlide
              title={item.title}
              highlightWord={item.highlightWord}
              description={item.description}
              icon={item.icon}
              bgColor={colors.background}
              textColor={colors.text}
              descColor={colors.textSecondary}
              primaryColor={colors.primary}
            />
          )}
        />
      </View>

      {/* Footer Area */}
      <View style={styles.footer}>
        {/* Pagination Dots */}
        <View style={styles.dotsContainer}>
          {SLIDES_DATA.map((_, index) => {
            const isActive = index === currentIndex;
            return (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: isActive ? colors.primary : colors.borderLight,
                    width: isActive ? 24 : 8,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Action Button */}
        <AppButton
          title={currentIndex === SLIDES_DATA.length - 1 ? "Get Started" : "Continue"}
          onPress={handleNext}
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 48,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
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