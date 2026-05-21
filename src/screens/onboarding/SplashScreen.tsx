import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors, useTheme } from '../../theme';
import { AppText } from '../../components/ui/AppText';
import { useAuthStore } from '../../store/authStore';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: (isLoggedIn: boolean) => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const colors = useColors();
  const { theme } = useTheme();

  // Animation values
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(20)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start entry animations
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 15,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        delay: 400,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: 0,
        delay: 400,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Check auth status and proceed after a minimum delay of 2.2 seconds to allow the animation to play out
    const checkSession = async () => {
      const startTime = Date.now();
      
      // Let Zustand persist state hydrate. We wait up to 1 second for the store to hydrate if it hasn't
      let attempts = 0;
      while (!useAuthStore.persist.hasHydrated() && attempts < 10) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      const isLoggedIn = useAuthStore.getState().isLoggedIn;
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 2200 - elapsedTime);

      setTimeout(() => {
        onFinish(isLoggedIn);
      }, remainingTime);
    };

    checkSession();
  }, [logoOpacity, logoScale, contentOpacity, contentTranslateY, onFinish]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark || '#E65100']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          {/* We can use a nice vector icon or text for the logo */}
          <View style={styles.logoCircle}>
            <AppText variant="h1" style={{ color: colors.primary, fontSize: 40, fontWeight: '900' }}>
              A
            </AppText>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: contentOpacity,
              transform: [{ translateY: contentTranslateY }],
            },
          ]}
        >
          <AppText variant="h1" style={{ color: '#FFFFFF', marginBottom: 8, fontWeight: '800' }}>
            AlphaWare
          </AppText>
          <AppText variant="bodyMd" style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 40 }}>
            Premium Personal Loans
          </AppText>
          <LottieView
            source={require('../../../assets/loader.json')}
            autoPlay
            loop
            style={{ width: 80, height: 80 }}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  textContainer: {
    alignItems: 'center',
  },
});