import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors, useTheme } from '../../theme';
import { AppText } from '../../components/ui/AppText';
import { useAuthStore } from '../../store/authStore';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: (isLoggedIn: boolean) => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const colors = useColors();
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  // Animation values
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(30)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.4)).current;
  const bubble1Opacity = useRef(new Animated.Value(0)).current;
  const bubble2Opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo entrance
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 18,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        delay: 500,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: 0,
        delay: 500,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // Background bubbles fade in
      Animated.timing(bubble1Opacity, {
        toValue: 1,
        delay: 200,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(bubble2Opacity, {
        toValue: 1,
        delay: 400,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse ring loop
    const pulseAnimation = Animated.loop(
      Animated.parallel([
        Animated.timing(pulseScale, {
          toValue: 1.6,
          duration: 2000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(pulseOpacity, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    // Check auth status
    const checkSession = async () => {
      const startTime = Date.now();

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

    return () => {
      pulseAnimation.stop();
    };
  }, []);

  const bgColors: readonly [string, string, ...string[]] = isDark
    ? [colors.primary, colors.primaryDark || '#1E1B4B']
    : [colors.primary, colors.primaryDark || '#3730A3'];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={bgColors}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />

      {/* Decorative floating circles */}
      <Animated.View
        style={[
          styles.decorCircle1,
          { opacity: bubble1Opacity },
        ]}
      />
      <Animated.View
        style={[
          styles.decorCircle2,
          { opacity: bubble2Opacity },
        ]}
      />
      <Animated.View
        style={[
          styles.decorCircle3,
          { opacity: bubble1Opacity },
        ]}
      />

      <View style={styles.content}>
        {/* Logo with pulse */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          {/* Pulse ring */}
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [{ scale: pulseScale }],
                opacity: pulseOpacity,
                borderColor: 'rgba(255,255,255,0.3)',
              },
            ]}
          />

          <View style={styles.logoCircle}>
            <AppText
              variant="h1"
              style={styles.logoText}
            >
              A
            </AppText>
          </View>
        </Animated.View>

        {/* App Name + Tagline */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: contentOpacity,
              transform: [{ translateY: contentTranslateY }],
            },
          ]}
        >
          <AppText variant="h1" style={styles.appName}>
            AlphaWare
          </AppText>
          <AppText variant="bodyMd" style={styles.tagline}>
            Premium Personal Loans
          </AppText>
        </Animated.View>

        {/* Lottie Loader */}
        <Animated.View
          style={[
            styles.loaderContainer,
            {
              opacity: contentOpacity,
            },
          ]}
        >
          <LottieView
            source={require('../../../assets/loader.json')}
            autoPlay
            loop
            style={{ width: 60, height: 60 }}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      {/* Bottom branding */}
      <Animated.View style={[styles.bottomBranding, { opacity: contentOpacity }]}>
        <AppText variant="caption" style={styles.brandingText}>
          Powered by AlphaWare Finance
        </AppText>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  decorCircle1: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: height * 0.15,
    left: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  decorCircle3: {
    position: 'absolute',
    top: height * 0.35,
    right: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
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
    marginBottom: 28,
  },
  pulseRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  logoText: {
    color: '#4F46E5',
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -1,
  },
  textContainer: {
    alignItems: 'center',
  },
  appName: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  tagline: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  loaderContainer: {
    marginTop: 48,
  },
  bottomBranding: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  brandingText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});