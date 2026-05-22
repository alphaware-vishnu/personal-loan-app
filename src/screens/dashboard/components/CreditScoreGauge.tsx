import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useColors, useTheme } from '../../../theme';
import { AppText } from '../../../components/ui/AppText';

interface CreditScoreGaugeProps {
  score: number;
  maxScore?: number;
  size?: number;
}

const getScoreLabel = (score: number): { label: string; color: string } => {
  if (score >= 750) return { label: 'Excellent', color: '#10B981' };
  if (score >= 700) return { label: 'Good', color: '#3B82F6' };
  if (score >= 650) return { label: 'Fair', color: '#F59E0B' };
  if (score >= 550) return { label: 'Poor', color: '#F97316' };
  return { label: 'Very Poor', color: '#EF4444' };
};

export const CreditScoreGauge: React.FC<CreditScoreGaugeProps> = ({
  score,
  maxScore = 900,
  size = 160,
}) => {
  const colors = useColors();
  const { mode } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  const percentage = Math.min(Math.max(score / maxScore, 0), 1);
  const { label, color: scoreColor } = getScoreLabel(score);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: percentage,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  const radius = size / 2;
  const strokeWidth = 10;
  const innerRadius = radius - strokeWidth;

  // The gauge is a semi-circle (180 degrees)
  // We use the rotation technique: rotate a colored half-circle to reveal the arc
  const rotateInterpolation = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const isDark = mode === 'dark';
  const trackColor = isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB';
  const glowColor = isDark ? `${scoreColor}33` : `${scoreColor}1A`;

  return (
    <View style={[styles.container, { width: size, height: radius + 20 }]}>
      {/* Ambient glow */}
      <View
        style={[
          styles.glow,
          {
            width: size + 40,
            height: radius + 40,
            backgroundColor: glowColor,
            borderRadius: (size + 40) / 2,
            top: -10,
          },
        ]}
      />

      {/* Track (gray semi-circle background) */}
      <View
        style={[
          styles.semiCircle,
          {
            width: size,
            height: radius,
            borderTopLeftRadius: radius,
            borderTopRightRadius: radius,
            backgroundColor: trackColor,
          },
        ]}
      >
        {/* Inner cutout to make it a ring */}
        <View
          style={[
            styles.innerCutout,
            {
              width: innerRadius * 2,
              height: innerRadius,
              borderTopLeftRadius: innerRadius,
              borderTopRightRadius: innerRadius,
              backgroundColor: isDark ? colors.background : colors.surface,
            },
          ]}
        />
      </View>

      {/* Animated fill arc — left half */}
      <View
        style={[
          styles.semiCircle,
          styles.arcOverlay,
          {
            width: size,
            height: radius,
            borderTopLeftRadius: radius,
            borderTopRightRadius: radius,
            overflow: 'hidden',
          },
        ]}
      >
        {/* This is the rotating piece */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: size,
              height: size,
              bottom: 0,
              left: 0,
              transform: [
                { translateY: radius },
                { rotate: rotateInterpolation },
                { translateY: -radius },
              ],
            },
          ]}
        >
          {/* Bottom half that rotates up */}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: size,
              height: radius,
              borderTopLeftRadius: radius,
              borderTopRightRadius: radius,
              backgroundColor: scoreColor,
            }}
          />
        </Animated.View>

        {/* Inner cutout on top of fill */}
        <View
          style={[
            styles.innerCutout,
            {
              width: innerRadius * 2,
              height: innerRadius,
              borderTopLeftRadius: innerRadius,
              borderTopRightRadius: innerRadius,
              backgroundColor: isDark ? colors.background : colors.surface,
              zIndex: 10,
            },
          ]}
        />
      </View>

      {/* Score text in center */}
      <View style={[styles.scoreTextContainer, { bottom: 0, width: size }]}>
        <AppText
          variant="h1"
          style={[
            styles.scoreValue,
            { color: colors.text, fontSize: size * 0.22 },
          ]}
        >
          {score}
        </AppText>
        <View
          style={[
            styles.labelBadge,
            { backgroundColor: `${scoreColor}20`, borderColor: `${scoreColor}40` },
          ]}
        >
          <View style={[styles.labelDot, { backgroundColor: scoreColor }]} />
          <AppText
            variant="caption"
            style={[styles.labelText, { color: scoreColor }]}
          >
            {label}
          </AppText>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    alignSelf: 'center',
    opacity: 0.6,
  },
  semiCircle: {
    position: 'absolute',
    top: 0,
    overflow: 'hidden',
  },
  arcOverlay: {
    zIndex: 5,
  },
  innerCutout: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
  },
  scoreTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 20,
  },
  scoreValue: {
    fontWeight: '900',
    letterSpacing: -1,
  },
  labelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 2,
  },
  labelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  labelText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
